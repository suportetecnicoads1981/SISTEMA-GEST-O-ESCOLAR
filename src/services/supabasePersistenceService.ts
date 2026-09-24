import { getSupabaseClient } from './datasync/supabaseClient';
import { SupabaseDatabaseService } from './datasync/SupabaseDatabaseService';
import type { AppStateData } from '../data/storage';
import { DEFAULT_SCHOOL_SETTINGS } from '../data/defaultData';
import { fromRemoteRow, mergeRemoteIntoLocal } from './datasync/supabaseRowMapper';
import { withoutTombstones } from './datasync/deletionTracker';

/** Mantém uma habilidade por código (a primeira encontrada). */
function dedupeSkillsByCode<T extends { code?: string }>(list: T[]): T[] {
  const seen = new Set<string>();
  return (list || []).filter((s) => {
    const code = String(s?.code || '').toUpperCase();
    if (!code) return true;
    if (seen.has(code)) return false;
    seen.add(code);
    return true;
  });
}

export class SupabasePersistenceService {
  private static isSubscribed = false;

  /** Estado completo gravado localmente (mesma chave usada por storage.ts). */
  private static readLocalState(): AppStateData | null {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('sucessoedu_master_store_v5') : null;
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === 'object' ? (parsed as AppStateData) : null;
    } catch {
      return null;
    }
  }
  private static readonly SAVE_DEBOUNCE_MS = 1500;
  private static readonly REALTIME_DEBOUNCE_MS = 2000;
  private static pendingSave: Promise<void> | null = null;
  private static isSyncing = false;
  private static resyncRequested = false;
  private static realtimeRefetchTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Fetch all app state entities from Supabase PostgreSQL tables and map to AppStateData
   */
  public static async fetchAppStateFromSupabase(): Promise<AppStateData | null> {
    try {
      const supabase = getSupabaseClient();

      // Sem sessão autenticada as políticas RLS devolvem listas vazias: não há o que buscar.
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        return null;
      }

      const local = SupabasePersistenceService.readLocalState();
      if (!local) {
        // Sem estado local para mesclar: evita montar um estado parcial que apagaria campos.
        return null;
      }
      const localAccountsById = new Map<string, any>(
        (Array.isArray(local.userAccounts) ? local.userAccounts : []).map((u: any) => [u.id, u])
      );

      const [
        studentsRes,
        classesRes,
        subjectsRes,
        coursesRes,
        questionsRes,
        examsRes,
        submissionsRes,
        attendanceRes,
        lessonsRes,
        gradeSheetsRes,
        historiesRes,
        unitsRes,
        usersRes,
        commsRes,
        notifsRes,
        settingsRes,
        updatesRes,
        bnccSkillsRes,
        bnccAssessRes,
      ] = await Promise.all([
        supabase.from('students').select('*'),
        supabase.from('school_classes').select('*'),
        supabase.from('subjects').select('*'),
        supabase.from('courses').select('*'),
        supabase.from('questions').select('*'),
        supabase.from('exams').select('*'),
        supabase.from('exam_submissions').select('*'),
        supabase.from('attendance_sheets').select('*'),
        supabase.from('lesson_registries').select('*'),
        supabase.from('class_grade_sheets').select('*'),
        supabase.from('academic_histories').select('*'),
        supabase.from('school_units').select('*'),
        supabase.from('user_accounts').select('*'),
        supabase.from('communications').select('*'),
        supabase.from('notifications').select('*'),
        supabase.from('school_settings').select('*'),
        supabase.from('system_updates').select('*'),
        supabase.from('bncc_skills').select('*'),
        supabase.from('bncc_skill_assessments').select('*'),
      ]);

      if (studentsRes.error && classesRes.error) {
        console.warn('Supabase fetch failed or tables not present yet:', studentsRes.error);
        return null;
      }

      // Linhas excluídas localmente (ainda não confirmadas na nuvem) não podem reaparecer.
      const rowsOf = (res: { data: any[] | null; error: any }, table?: string) =>
        res.error ? null : table ? withoutTombstones(table, res.data) ?? null : res.data;
      const withRoles = (row: Record<string, any>) => {
        const mapped = fromRemoteRow(row);
        mapped.targetRoles = Array.isArray(row.targetRoles)
          ? row.targetRoles
          : Array.isArray(row.target_roles)
          ? row.target_roles
          : ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];
        return mapped;
      };

      const remoteSettingsRow = rowsOf(settingsRes)?.[0];
      const remoteSettings = remoteSettingsRow ? fromRemoteRow(remoteSettingsRow) : null;
      if (remoteSettings) {
        delete remoteSettings.id;
        delete remoteSettings.createdAt;
        delete remoteSettings.updatedAt;
      }

      // Mescla não destrutiva: dados da nuvem atualizam os registros locais por id,
      // campos e coleções que não existem na nuvem continuam como estão localmente.
      const freshData: AppStateData = {
        ...local,
        students: mergeRemoteIntoLocal(local.students, rowsOf(studentsRes, 'students'), (row) => {
          const mapped = fromRemoteRow(row);
          if (row.registration_number) mapped.enrollmentNumber = row.registration_number;
          if (typeof row.has_aee === 'boolean') mapped.hasAEE = row.has_aee;
          delete mapped.registrationNumber;
          delete mapped.hasAee;
          return mapped;
        }),
        classes: mergeRemoteIntoLocal(local.classes, rowsOf(classesRes, 'school_classes'), (row) => {
          const mapped = fromRemoteRow(row);
          if (row.capacity) mapped.maxCapacity = row.capacity;
          return mapped;
        }),
        subjects: mergeRemoteIntoLocal(local.subjects, rowsOf(subjectsRes, 'subjects')),
        courses: mergeRemoteIntoLocal(local.courses, rowsOf(coursesRes, 'courses')),
        questions: mergeRemoteIntoLocal(local.questions, rowsOf(questionsRes, 'questions')),
        exams: mergeRemoteIntoLocal(local.exams, rowsOf(examsRes, 'exams')),
        submissions: mergeRemoteIntoLocal(local.submissions, rowsOf(submissionsRes, 'exam_submissions')),
        attendanceSheets: mergeRemoteIntoLocal(local.attendanceSheets, rowsOf(attendanceRes, 'attendance_sheets')),
        lessonRegistries: mergeRemoteIntoLocal(local.lessonRegistries, rowsOf(lessonsRes, 'lesson_registries')),
        // Catálogo BNCC: mescla por id e mantém uma habilidade por código
        bnccSkills: dedupeSkillsByCode(
          mergeRemoteIntoLocal(local.bnccSkills, rowsOf(bnccSkillsRes, 'bncc_skills'), (row) => {
            const m = fromRemoteRow(row);
            delete m.createdAt;
            delete m.updatedAt;
            return m;
          })
        ),
        bnccAssessments: mergeRemoteIntoLocal(local.bnccAssessments, rowsOf(bnccAssessRes, 'bncc_skill_assessments'), (row) => {
          const m = fromRemoteRow(row);
          m.level = Number(row.level);
          m.term = Number(row.term);
          m.schoolYear = Number(row.school_year);
          delete m.createdAt;
          return m;
        }) as any,
        classGradeSheets: mergeRemoteIntoLocal(local.classGradeSheets, rowsOf(gradeSheetsRes, 'class_grade_sheets')),
        academicHistories: mergeRemoteIntoLocal(local.academicHistories, rowsOf(historiesRes, 'academic_histories')),
        schoolUnits: mergeRemoteIntoLocal(local.schoolUnits, rowsOf(unitsRes, 'school_units')),
        communications: mergeRemoteIntoLocal(local.communications, rowsOf(commsRes, 'communications'), withRoles),
        notifications: mergeRemoteIntoLocal(local.notifications, rowsOf(notifsRes, 'notifications'), (row) => ({
          ...withRoles(row),
          read: Boolean(row.read),
        })),
        systemUpdates: mergeRemoteIntoLocal(local.systemUpdates as any[], rowsOf(updatesRes), (row) => ({
          ...fromRemoteRow(row),
          isCloudAvailable: true,
          improvements: Array.isArray(row.improvements) ? row.improvements : [],
        })) as any,
        settings: remoteSettings
          ? { ...DEFAULT_SCHOOL_SETTINGS, ...(local.settings || {}), ...remoteSettings }
          : local.settings,
        userAccounts: mergeRemoteIntoLocal(local.userAccounts, rowsOf(usersRes, 'user_accounts'), (u) => {
          // A tabela remota não guarda senha nem a marca de Master: esses campos são
          // preservados da cópia local. Sem isso, cada sincronização apagava as senhas.
          const localAcc = localAccountsById.get(u.id);
          return {
            ...fromRemoteRow(u),
            password: localAcc?.password,
            isMaster: Boolean(localAcc?.isMaster),
            cloudSynced: true,
            // Papel desconhecido recebe o menor privilégio (antes virava ADMIN).
            role: (u.role && ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'].includes(u.role)) ? u.role : 'STUDENT',
          };
        }),
      };

      return freshData;
    } catch (err) {
      console.warn('Error fetching app state from Supabase:', err);
      return null;
    }
  }

  /**
   * Save app state to Supabase PostgreSQL database
   */
  public static saveAppStateToSupabase(_data?: AppStateData): Promise<void> {
    // Cada gravação local dispara uma sincronização completa de todas as tabelas.
    // Várias gravações seguidas (ex.: ao abrir módulos) geravam dezenas de upserts
    // simultâneos (ERR_INSUFFICIENT_RESOURCES). Aqui as chamadas são agrupadas:
    // aguarda-se um intervalo curto e executa-se uma única sincronização por vez,
    // sempre lendo o estado mais recente do localStorage.
    if (!this.pendingSave) {
      this.pendingSave = new Promise<void>((resolve) => {
        setTimeout(async () => {
          this.pendingSave = null;
          await this.runSync();
          resolve();
        }, SupabasePersistenceService.SAVE_DEBOUNCE_MS);
      });
    }
    return this.pendingSave;
  }

  private static async runSync(): Promise<void> {
    if (this.isSyncing) {
      // Já existe uma sincronização em andamento: agenda mais uma ao final dela.
      this.resyncRequested = true;
      return;
    }
    this.isSyncing = true;
    try {
      await SupabaseDatabaseService.syncAllEntitiesToSupabase();
    } catch (err) {
      console.warn('Failed to push state to Supabase:', err);
    } finally {
      this.isSyncing = false;
      if (this.resyncRequested) {
        this.resyncRequested = false;
        this.saveAppStateToSupabase().catch(() => {});
      }
    }
  }

  /**
   * Initialize Realtime subscription to synchronize across instances in real-time
   */
  public static initRealtimeSync(onUpdate: (data: AppStateData) => void): void {
    if (this.isSubscribed) return;
    try {
      const supabase = getSupabaseClient();
      supabase
        .channel('sucessoedu-realtime-global')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload) => {
            console.log('🔄 [Supabase Realtime] Change detected in table:', payload.table);
            // Um upsert em lote gera um evento por linha; sem agrupamento cada evento
            // recarregava todas as tabelas. Recarrega uma única vez após a rajada.
            if (this.realtimeRefetchTimer) clearTimeout(this.realtimeRefetchTimer);
            this.realtimeRefetchTimer = setTimeout(async () => {
              this.realtimeRefetchTimer = null;
              const fresh = await this.fetchAppStateFromSupabase();
              if (fresh) {
                onUpdate(fresh);
              }
            }, SupabasePersistenceService.REALTIME_DEBOUNCE_MS);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.isSubscribed = true;
            console.log('🟢 [Supabase Realtime] Conectado e ouvindo sincronizações entre instâncias.');
          }
        });
    } catch (err) {
      console.warn('Supabase Realtime initialization warning:', err);
    }
  }
}
