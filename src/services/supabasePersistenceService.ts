import { getSupabaseClient } from './datasync/supabaseClient';
import { SupabaseDatabaseService } from './datasync/SupabaseDatabaseService';
import type { AppStateData } from '../data/storage';
import { DEFAULT_ROLE_PREFERENCES, DEFAULT_SCHOOL_SETTINGS, DEFAULT_USER_ACCOUNTS } from '../data/defaultData';

export class SupabasePersistenceService {
  private static isSubscribed = false;

  /**
   * Fetch all app state entities from Supabase PostgreSQL tables and map to AppStateData
   */
  public static async fetchAppStateFromSupabase(): Promise<AppStateData | null> {
    try {
      const supabase = getSupabaseClient();
      
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
        logsRes,
        updatesRes
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
        supabase.from('sync_audit_logs').select('*'),
        supabase.from('system_updates').select('*'),
      ]);

      if (studentsRes.error && classesRes.error) {
        console.warn('Supabase fetch failed or tables not present yet:', studentsRes.error);
        return null;
      }

      const rawSettings = settingsRes.data?.[0] || {};
      delete rawSettings.id;

      const freshData: AppStateData = {
        students: studentsRes.data || [],
        classes: (classesRes.data || []).map((c: any) => ({
          ...c,
          maxCapacity: c.capacity || c.maxCapacity,
        })),
        subjects: subjectsRes.data || [],
        courses: coursesRes.data || [],
        questions: questionsRes.data || [],
        exams: examsRes.data || [],
        submissions: submissionsRes.data || [],
        academicHistories: historiesRes.data || [],
        settings: Object.keys(rawSettings).length > 0 ? { ...DEFAULT_SCHOOL_SETTINGS, ...rawSettings } : DEFAULT_SCHOOL_SETTINGS,
        notifications: (notifsRes.data || []).map((n: any) => ({
          ...n,
          targetRoles: Array.isArray(n.targetRoles)
            ? n.targetRoles
            : Array.isArray(n.target_roles)
            ? n.target_roles
            : ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
          read: Boolean(n.read),
        })),
        communications: (commsRes.data || []).map((c: any) => ({
          ...c,
          senderRole: c.senderRole || c.sender_role || 'ADMIN',
          targetRoles: Array.isArray(c.targetRoles)
            ? c.targetRoles
            : Array.isArray(c.target_roles)
            ? c.target_roles
            : ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
        })),
        rolePreferences: DEFAULT_ROLE_PREFERENCES,
        schoolUnits: unitsRes.data || [],
        municipalSecretary: undefined,
        syncLogs: (logsRes.data || []).map((l: any) => {
          let parsedDetails: any = {};
          if (l.details && typeof l.details === 'string') {
            try { parsedDetails = JSON.parse(l.details); } catch (_) {}
          }
          return {
            id: l.id || ('log_' + Math.random().toString(36).substring(2, 7)),
            schoolUnitId: l.schoolUnitId || l.station_id || 'SEMED_CENTRAL',
            schoolUnitName: l.schoolUnitName || parsedDetails.schoolUnitName || 'Polo Municipal',
            importedAt: l.importedAt || l.created_at || new Date().toISOString(),
            operatorName: l.operatorName || parsedDetails.operatorName || 'Administrador',
            recordsMerged: l.recordsMerged || parsedDetails.recordsMerged || {
              students: l.records_count || 0,
              classes: 0,
              exams: 0,
              submissions: 0
            },
            status: l.status || 'SUCESSO',
            notes: typeof l.notes === 'string' ? l.notes : (typeof l.details === 'string' ? l.details : 'Sincronização realizada com sucesso.')
          };
        }),
        userAccounts: (usersRes.data && usersRes.data.length > 0)
          ? usersRes.data.map((u: any) => ({
              ...u,
              role: (u.role && ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'].includes(u.role)) ? u.role : 'ADMIN',
            }))
          : DEFAULT_USER_ACCOUNTS,
        developerContact: undefined,
        bnccSkills: [],
        stateRegulations: [],
        activeStateRegulationCode: 'SP',
        attendanceSheets: attendanceRes.data || [],
        lessonRegistries: lessonsRes.data || [],
        classGradeSheets: gradeSheetsRes.data || [],
        teacherLessonPlans: [],
        teacherStudentNotes: [],
        whatsappConfig: undefined,
        whatsappTemplates: [],
        whatsappLogs: [],
        systemUpdates: (updatesRes.data && updatesRes.data.length > 0)
          ? updatesRes.data.map((u: any) => ({
              id: u.id,
              version: u.version,
              title: u.title,
              summary: u.summary || u.description || '',
              description: u.description || u.summary || '',
              releaseDate: u.releaseDate || u.release_date || new Date().toISOString().split('T')[0],
              severity: u.severity || 'MAJOR',
              sizeFormatted: u.sizeFormatted || u.size_formatted || '58.4 MB',
              sha256Checksum: u.sha256Checksum || u.sha256_checksum || '',
              author: u.author || 'SEDUC / SucessoEdu',
              isInstalled: Boolean(u.isInstalled || u.is_installed),
              isCloudAvailable: true,
              improvements: Array.isArray(u.improvements) ? u.improvements : [],
            }))
          : [],
        auditLogs: logsRes.data || [],
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
  public static async saveAppStateToSupabase(data: AppStateData): Promise<void> {
    try {
      await SupabaseDatabaseService.syncAllEntitiesToSupabase();
    } catch (err) {
      console.warn('Failed to push state to Supabase:', err);
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
          async (payload) => {
            console.log('🔄 [Supabase Realtime] Change detected in table:', payload.table);
            const fresh = await this.fetchAppStateFromSupabase();
            if (fresh) {
              onUpdate(fresh);
            }
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
