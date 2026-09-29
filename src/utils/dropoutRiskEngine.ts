/**
 * Gatilho de risco de evasão por infrequência.
 *
 * Conta as faltas SEM justificativa de cada aluno (status "FALTA" no diário; "FALTA_JUSTIFICADA"
 * não conta) e compara com o limite definido no Censo de Evasão & Busca Ativa. O aluno que
 * atinge o limite entra em "risco de evasão": aparece no painel de risco, no Início, na Central
 * de Notificações e na janela de aviso da tela do usuário.
 */
import type { AttendanceSheet, DropoutAlertConfig, SchoolClass, Student } from '../types';

export const DEFAULT_DROPOUT_ALERT_CONFIG: DropoutAlertConfig = {
  enabled: true,
  maxUnjustifiedAbsences: 10,
  countMode: 'DIAS',
  period: 'ANO_LETIVO',
  windowDays: 30,
  warnAtPercent: 80,
  showPopup: true,
};

export type DropoutRiskLevel = 'LIMITE' | 'ATENCAO';

export interface DropoutRiskStudent {
  studentId: string;
  studentName: string;
  enrollmentNumber?: string;
  classId?: string;
  className?: string;
  schoolUnitId?: string;
  /** Faltas sem justificativa no período (em dias ou aulas, conforme o critério). */
  absences: number;
  /** Faltas justificadas no mesmo período (só para informação). */
  justified: number;
  lastAbsenceDate?: string;
  level: DropoutRiskLevel;
  /** Aluno já tem ficha de busca ativa aberta. */
  inActiveSearch: boolean;
}

export interface DropoutRiskResult {
  config: DropoutAlertConfig;
  /** Atingiram o limite (alerta de atenção). */
  atLimit: DropoutRiskStudent[];
  /** Perto do limite (a partir do percentual de atenção). */
  nearLimit: DropoutRiskStudent[];
  /** Menor quantidade que conta como "perto do limite". */
  warnFrom: number;
}

const EXCLUDED_STATUS = new Set(['TRANSFERRED', 'CONCLUDED', 'EVADIDO']);

export function normalizeDropoutConfig(cfg?: Partial<DropoutAlertConfig> | null): DropoutAlertConfig {
  const c = { ...DEFAULT_DROPOUT_ALERT_CONFIG, ...(cfg || {}) };
  const toInt = (v: any, min: number, max: number, def: number) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
  };
  return {
    ...c,
    enabled: c.enabled !== false,
    maxUnjustifiedAbsences: toInt(c.maxUnjustifiedAbsences, 1, 200, DEFAULT_DROPOUT_ALERT_CONFIG.maxUnjustifiedAbsences),
    countMode: c.countMode === 'AULAS' ? 'AULAS' : 'DIAS',
    period: c.period === 'ULTIMOS_DIAS' ? 'ULTIMOS_DIAS' : 'ANO_LETIVO',
    windowDays: toInt(c.windowDays, 1, 365, DEFAULT_DROPOUT_ALERT_CONFIG.windowDays),
    warnAtPercent: toInt(c.warnAtPercent, 10, 100, DEFAULT_DROPOUT_ALERT_CONFIG.warnAtPercent),
    showPopup: c.showPopup !== false,
  };
}

const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Descrição curta do critério (ex.: "10 dias com falta sem justificativa no ano letivo"). */
export function describeDropoutCriterion(cfg: DropoutAlertConfig): string {
  const unit = cfg.countMode === 'AULAS' ? 'faltas (aulas)' : 'dias com falta';
  const period = cfg.period === 'ULTIMOS_DIAS' ? `nos últimos ${cfg.windowDays} dias` : 'no ano letivo';
  return `${cfg.maxUnjustifiedAbsences} ${unit} sem justificativa ${period}`;
}

export function computeDropoutRisk(
  students: Student[] = [],
  attendanceSheets: AttendanceSheet[] = [],
  rawConfig?: Partial<DropoutAlertConfig> | null,
  options: { today?: Date; classes?: SchoolClass[]; schoolUnitId?: string } = {}
): DropoutRiskResult {
  const config = normalizeDropoutConfig(rawConfig);
  const warnFrom = Math.max(1, Math.ceil((config.maxUnjustifiedAbsences * config.warnAtPercent) / 100));
  const empty: DropoutRiskResult = { config, atLimit: [], nearLimit: [], warnFrom };
  if (!config.enabled) return empty;

  const today = options.today || new Date();
  const todayIso = isoDay(today);
  let fromIso = `${today.getFullYear()}-01-01`;
  if (config.period === 'ULTIMOS_DIAS') {
    const from = new Date(today);
    from.setDate(from.getDate() - config.windowDays + 1);
    fromIso = isoDay(from);
  }

  const classById = new Map((options.classes || []).map((c) => [c.id, c]));
  const eligible = new Map<string, Student>();
  for (const s of students) {
    if (!s || !s.id || EXCLUDED_STATUS.has(String(s.status))) continue;
    if (options.schoolUnitId) {
      const unit = s.schoolUnitId || (s.classId ? classById.get(s.classId)?.schoolUnitId : undefined);
      if (unit !== options.schoolUnitId) continue;
    }
    eligible.set(s.id, s);
  }
  if (!eligible.size) return empty;

  type Acc = { days: Set<string>; lessons: number; justifiedDays: Set<string>; justifiedLessons: number; last?: string; classId?: string; className?: string };
  const acc = new Map<string, Acc>();
  for (const sheet of attendanceSheets) {
    const date = String(sheet?.date || '').slice(0, 10);
    if (!date || date < fromIso || date > todayIso) continue;
    for (const entry of sheet.entries || []) {
      if (!entry || !eligible.has(entry.studentId)) continue;
      if (entry.status !== 'FALTA' && entry.status !== 'FALTA_JUSTIFICADA') continue;
      let a = acc.get(entry.studentId);
      if (!a) {
        a = { days: new Set(), lessons: 0, justifiedDays: new Set(), justifiedLessons: 0 };
        acc.set(entry.studentId, a);
      }
      if (entry.status === 'FALTA') {
        a.days.add(date);
        a.lessons += 1;
        if (!a.last || date > a.last) {
          a.last = date;
          a.classId = sheet.classId;
          a.className = sheet.className;
        }
      } else {
        a.justifiedDays.add(date);
        a.justifiedLessons += 1;
      }
    }
  }

  const atLimit: DropoutRiskStudent[] = [];
  const nearLimit: DropoutRiskStudent[] = [];
  for (const [studentId, a] of acc) {
    const absences = config.countMode === 'AULAS' ? a.lessons : a.days.size;
    if (absences < warnFrom) continue;
    const s = eligible.get(studentId)!;
    const cls = s.classId ? classById.get(s.classId) : undefined;
    const item: DropoutRiskStudent = {
      studentId,
      studentName: s.name,
      enrollmentNumber: s.enrollmentNumber,
      classId: s.classId || a.classId,
      className: cls?.name || a.className,
      schoolUnitId: s.schoolUnitId || cls?.schoolUnitId,
      absences,
      justified: config.countMode === 'AULAS' ? a.justifiedLessons : a.justifiedDays.size,
      lastAbsenceDate: a.last,
      level: absences >= config.maxUnjustifiedAbsences ? 'LIMITE' : 'ATENCAO',
      inActiveSearch: (s as any).dropoutIntervention?.searchStatus === 'EM_BUSCA_ATIVA',
    };
    (item.level === 'LIMITE' ? atLimit : nearLimit).push(item);
  }
  const order = (x: DropoutRiskStudent, y: DropoutRiskStudent) =>
    y.absences - x.absences || x.studentName.localeCompare(y.studentName, 'pt-BR');
  atLimit.sort(order);
  nearLimit.sort(order);
  return { config, atLimit, nearLimit, warnFrom };
}
