import {
  Student,
  AttendanceSheet,
  ClassGradeSheet,
  AcademicHistory,
  SchoolClass,
  SchoolUnit,
  NotificationItem,
  PredictiveAlert,
  PredictiveAlertType,
} from '../types';

export interface PredictiveEngineResult {
  alerts: PredictiveAlert[];
  totalAlerts: number;
  consecutiveAbsencesCount: number;
  performanceDropCount: number;
  dualRiskCount: number;
  notifiedCoordinationCount: number;
  pendingCoordinationCount: number;
}

/**
 * Motor de Inteligência & Alertas Preditivos da Secretaria Escolar
 * Monitora infrequência crítica (3+ faltas consecutivas) e queda de desempenho (>= 20%).
 */
export function computePredictiveAlerts(
  students: Student[],
  attendanceSheets: AttendanceSheet[] = [],
  classGradeSheets: ClassGradeSheet[] = [],
  academicHistories: AcademicHistory[] = [],
  classes: SchoolClass[] = [],
  schoolUnits: SchoolUnit[] = [],
  existingNotifications: NotificationItem[] = []
): PredictiveEngineResult {
  const alerts: PredictiveAlert[] = [];

  const classMap = new Map<string, SchoolClass>();
  classes.forEach((c) => classMap.set(c.id, c));

  const unitMap = new Map<string, SchoolUnit>();
  schoolUnits.forEach((u) => unitMap.set(u.id, u));

  // Mapa de notificações existentes para checar se a coordenação já foi notificada
  const notifiedStudentIds = new Set<string>();
  existingNotifications.forEach((n) => {
    if (n.targetUserId) {
      notifiedStudentIds.add(n.targetUserId);
    }
    if (n.metadata?.studentId) {
      notifiedStudentIds.add(n.metadata.studentId);
    }
  });

  students.forEach((student) => {
    // Apenas estudantes com matrícula ativa ou em risco (não evadidos já homologados)
    if (student.status === 'CONCLUDED' || student.status === 'TRANSFERRED') {
      return;
    }

    const studentClass = student.classId ? classMap.get(student.classId) : undefined;
    const studentUnit = student.schoolUnitId
      ? unitMap.get(student.schoolUnitId)
      : studentClass?.schoolUnitId
      ? unitMap.get(studentClass.schoolUnitId)
      : undefined;

    /* -------------------------------------------------------------
       1. REGRA DE FALTAS CONSECUTIVAS (Mínimo de 3 faltas seguidas)
       ------------------------------------------------------------- */
    // Coleta todas as presenças do estudante nas folhas de frequência ordenadas por data
    const studentAttendanceEntries: {
      date: string;
      lessonNumber: number;
      status: 'PRESENTE' | 'FALTA' | 'FALTA_JUSTIFICADA';
      subjectName?: string;
    }[] = [];

    attendanceSheets.forEach((sheet) => {
      const entry = sheet.entries?.find((e) => e.studentId === student.id);
      if (entry) {
        studentAttendanceEntries.push({
          date: sheet.date,
          lessonNumber: sheet.lessonNumber || 1,
          status: entry.status,
          subjectName: sheet.subjectName,
        });
      }
    });

    // Ordenar cronologicamente
    studentAttendanceEntries.sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      if (cmp !== 0) return cmp;
      return a.lessonNumber - b.lessonNumber;
    });

    let currentConsecutiveAbsences = 0;
    let maxConsecutiveAbsences = 0;
    let tempAbsenceDates: string[] = [];
    let longestAbsenceDates: string[] = [];

    studentAttendanceEntries.forEach((att) => {
      if (att.status === 'FALTA') {
        currentConsecutiveAbsences++;
        tempAbsenceDates.push(att.date);
        if (currentConsecutiveAbsences > maxConsecutiveAbsences) {
          maxConsecutiveAbsences = currentConsecutiveAbsences;
          longestAbsenceDates = [...tempAbsenceDates];
        }
      } else {
        currentConsecutiveAbsences = 0;
        tempAbsenceDates = [];
      }
    });

    // Regra: atingir 3 ou mais faltas consecutivas
    const hasConsecutiveAbsenceRisk = maxConsecutiveAbsences >= 3;

    /* -------------------------------------------------------------
       2. REGRA DE REDUÇÃO DE DESEMPENHO (Queda de 20% ou mais)
       ------------------------------------------------------------- */
    let hasPerformanceDropRisk = false;
    let performanceDropPercent = 0;
    let previousAverage = 0;
    let currentAverage = 0;
    let subjectAffected = '';
    let termOrEvaluation = '';

    // Avaliação via Histórico Acadêmico (bimonthlyGrades: b1, b2, b3, b4)
    const history = academicHistories.find((h) => h.studentId === student.id);
    if (history?.records && history.records.length > 0) {
      for (const rec of history.records) {
        const { b1, b2, b3, b4 } = rec.bimonthlyGrades;
        // Testar b1 -> b2
        if (typeof b1 === 'number' && typeof b2 === 'number' && b1 > 0 && b2 < b1) {
          const drop = ((b1 - b2) / b1) * 100;
          if (drop >= 20 && drop > performanceDropPercent) {
            hasPerformanceDropRisk = true;
            performanceDropPercent = drop;
            previousAverage = b1;
            currentAverage = b2;
            subjectAffected = rec.subjectName;
            termOrEvaluation = '1º Bimestre ➔ 2º Bimestre';
          }
        }
        // Testar b2 -> b3
        if (typeof b2 === 'number' && typeof b3 === 'number' && b2 > 0 && b3 < b2) {
          const drop = ((b2 - b3) / b2) * 100;
          if (drop >= 20 && drop > performanceDropPercent) {
            hasPerformanceDropRisk = true;
            performanceDropPercent = drop;
            previousAverage = b2;
            currentAverage = b3;
            subjectAffected = rec.subjectName;
            termOrEvaluation = '2º Bimestre ➔ 3º Bimestre';
          }
        }
        // Testar b3 -> b4
        if (typeof b3 === 'number' && typeof b4 === 'number' && b3 > 0 && b4 < b3) {
          const drop = ((b3 - b4) / b3) * 100;
          if (drop >= 20 && drop > performanceDropPercent) {
            hasPerformanceDropRisk = true;
            performanceDropPercent = drop;
            previousAverage = b3;
            currentAverage = b4;
            subjectAffected = rec.subjectName;
            termOrEvaluation = '3º Bimestre ➔ 4º Bimestre';
          }
        }
      }
    }

    // Avaliação via Pautas de Notas (ClassGradeSheets)
    if (!hasPerformanceDropRisk && classGradeSheets.length > 0) {
      const studentGrades = classGradeSheets
        .map((sheet) => {
          const entry = sheet.grades.find((g) => g.studentId === student.id);
          return entry ? { sheet, entry } : null;
        })
        .filter(Boolean) as { sheet: ClassGradeSheet; entry: import('../types').StudentBimonthlyGradeEntry }[];

      // Agrupar por disciplina
      const bySubject: { [subId: string]: { term: string; avg: number; subName: string }[] } = {};
      studentGrades.forEach(({ sheet, entry }) => {
        if (!bySubject[sheet.subjectId]) bySubject[sheet.subjectId] = [];
        bySubject[sheet.subjectId].push({
          term: sheet.term,
          avg: entry.termAverage,
          subName: sheet.subjectName,
        });
      });

      Object.values(bySubject).forEach((list) => {
        if (list.length >= 2) {
          const prev = list[list.length - 2];
          const curr = list[list.length - 1];
          if (prev.avg > 0 && curr.avg < prev.avg) {
            const drop = ((prev.avg - curr.avg) / prev.avg) * 100;
            if (drop >= 20 && drop > performanceDropPercent) {
              hasPerformanceDropRisk = true;
              performanceDropPercent = drop;
              previousAverage = prev.avg;
              currentAverage = curr.avg;
              subjectAffected = prev.subName;
              termOrEvaluation = `${prev.term} ➔ ${curr.term}`;
            }
          }
        }
      });
    }

    // Se o estudante tem algum dos alertas críticos
    if (hasConsecutiveAbsenceRisk || hasPerformanceDropRisk) {
      let alertType: PredictiveAlertType = 'CONSECUTIVE_ABSENCES';
      let severity: import('../types').PredictiveAlertSeverity = 'HIGH';

      if (hasConsecutiveAbsenceRisk && hasPerformanceDropRisk) {
        alertType = 'DUAL_RISK';
        severity = 'CRITICAL';
      } else if (hasConsecutiveAbsenceRisk) {
        alertType = 'CONSECUTIVE_ABSENCES';
        severity = maxConsecutiveAbsences >= 5 ? 'CRITICAL' : 'HIGH';
      } else {
        alertType = 'PERFORMANCE_DROP';
        severity = performanceDropPercent >= 35 ? 'CRITICAL' : 'HIGH';
      }

      const isNotified = notifiedStudentIds.has(student.id);

      alerts.push({
        id: `pred-alert-${student.id}`,
        studentId: student.id,
        studentName: student.name,
        enrollmentNumber: student.enrollmentNumber,
        cpf: student.cpf,
        classId: student.classId || studentClass?.id || '',
        className: studentClass?.name || 'Sem Turma Atribuída',
        schoolUnitId: studentUnit?.id,
        schoolUnitName: studentUnit?.name || 'Sede Escolar',
        shift: studentClass?.shift || 'MANHÃ',
        photoUrl: student.photoUrl,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone || student.phone,
        guardianEmail: student.guardianEmail || student.email,
        alertType,
        severity,
        consecutiveAbsencesCount: maxConsecutiveAbsences,
        absenceDates: Array.from(new Set(longestAbsenceDates)),
        lastAbsenceDate: longestAbsenceDates[longestAbsenceDates.length - 1] || undefined,
        performanceDropPercent: Math.round(performanceDropPercent * 10) / 10,
        previousAverage: Math.round(previousAverage * 10) / 10,
        currentAverage: Math.round(currentAverage * 10) / 10,
        subjectAffected: subjectAffected || undefined,
        termOrEvaluation: termOrEvaluation || undefined,
        coordinationNotified: isNotified,
        notifiedAt: isNotified ? new Date().toISOString() : undefined,
        notifiedBy: isNotified ? 'Secretaria Escolar (Auto)' : undefined,
        interventionStatus: student.dropoutIntervention?.searchStatus ? 'IN_PROGRESS' : 'PENDING',
        interventionType: student.dropoutIntervention ? 'BUSCA_ATIVA_ESCOLAR' : undefined,
        interventionNotes: student.dropoutIntervention?.actionsTaken || undefined,
        detectedAt: new Date().toISOString(),
      });
    }
  });

  // Ordenar por severidade (CRITICAL primeiro, depois DUAL_RISK, depois número de faltas ou queda)
  alerts.sort((a, b) => {
    if (a.severity === 'CRITICAL' && b.severity !== 'CRITICAL') return -1;
    if (b.severity === 'CRITICAL' && a.severity !== 'CRITICAL') return 1;
    if (a.alertType === 'DUAL_RISK' && b.alertType !== 'DUAL_RISK') return -1;
    if (b.alertType === 'DUAL_RISK' && a.alertType !== 'DUAL_RISK') return 1;
    return b.performanceDropPercent - a.performanceDropPercent;
  });

  const consecutiveAbsencesCount = alerts.filter(
    (a) => a.alertType === 'CONSECUTIVE_ABSENCES' || a.alertType === 'DUAL_RISK'
  ).length;

  const performanceDropCount = alerts.filter(
    (a) => a.alertType === 'PERFORMANCE_DROP' || a.alertType === 'DUAL_RISK'
  ).length;

  const dualRiskCount = alerts.filter((a) => a.alertType === 'DUAL_RISK').length;
  const notifiedCoordinationCount = alerts.filter((a) => a.coordinationNotified).length;
  const pendingCoordinationCount = alerts.filter((a) => !a.coordinationNotified).length;

  return {
    alerts,
    totalAlerts: alerts.length,
    consecutiveAbsencesCount,
    performanceDropCount,
    dualRiskCount,
    notifiedCoordinationCount,
    pendingCoordinationCount,
  };
}

/**
 * Cria a notificação oficial formatada para a Coordenação Pedagógica
 */
export function buildCoordinationNotification(alert: PredictiveAlert): NotificationItem {
  let title = '';
  let message = '';

  const absenceInfo =
    alert.consecutiveAbsencesCount > 0
      ? `${alert.consecutiveAbsencesCount} faltas consecutivas registradas (${alert.absenceDates.slice(0, 3).join(', ')}${
          alert.absenceDates.length > 3 ? '...' : ''
        })`
      : '';

  const performanceInfo =
    alert.performanceDropPercent > 0
      ? `redução de ${alert.performanceDropPercent.toFixed(1)}% no desempenho em ${
          alert.subjectAffected || 'disciplinas curriculares'
        } (de ${alert.previousAverage.toFixed(1)} para ${alert.currentAverage.toFixed(1)})`
      : '';

  if (alert.alertType === 'DUAL_RISK') {
    title = `🚨 ALERTA DUPLO CRÍTICO: ${alert.studentName} (${alert.className})`;
    message = `URGENTE: O(A) estudante ${alert.studentName} (RA: ${alert.enrollmentNumber}) atingiu ${absenceInfo} E ${performanceInfo}. Risco iminente de evasão e retenção. Requer convocação imediata e plano de reforço.`;
  } else if (alert.alertType === 'CONSECUTIVE_ABSENCES') {
    title = `⚠️ Alerta Preditivo de Infrequência: ${alert.studentName}`;
    message = `Secretaria informa: O(A) estudante ${alert.studentName} (${alert.className}) atingiu ${absenceInfo}. Acionar busca ativa ou contato com os responsáveis para prevenir abandono escolar.`;
  } else {
    title = `📉 Alerta Preditivo de Rendimento: ${alert.studentName}`;
    message = `Secretaria informa: Detectada ${performanceInfo} na turma ${alert.className}. Recomenda-se encaminhar para tutoria pedagógica e recuperação contínua.`;
  }

  return {
    id: `notif-pred-${alert.studentId}-${Date.now()}`,
    title,
    message,
    type: 'IMPORTANT_ANNOUNCEMENT',
    priority: alert.severity === 'CRITICAL' ? 'URGENT' : 'HIGH',
    targetRoles: ['ADMIN', 'TEACHER'],
    targetClassId: alert.classId,
    targetUserId: alert.studentId,
    actionTab: 'STUDENTS',
    actionLabel: 'Ver Alertas Preditivos na Secretaria',
    createdAt: new Date().toISOString(),
    read: false,
    metadata: {
      studentId: alert.studentId,
      studentName: alert.studentName,
      alertType: alert.alertType,
      alertSeverity: alert.severity,
      consecutiveAbsencesCount: alert.consecutiveAbsencesCount,
      performanceDropPercent: alert.performanceDropPercent,
      channel: 'SECRETARIA_PREDICTIVE_RADAR',
    },
  };
}

/**
 * Gera mensagem formatada para comunicação rápida via WhatsApp
 */
export function buildWhatsAppAlertText(alert: PredictiveAlert): string {
  const greeting = 'Olá! Mensagem da Secretaria & Coordenação do SucessoEdu:';
  if (alert.alertType === 'DUAL_RISK') {
    return (
      `${greeting}\n\n` +
      `Informamos que o(a) estudante *${alert.studentName}* (${alert.className}) apresentou *${alert.consecutiveAbsencesCount} faltas consecutivas* e uma queda de *${alert.performanceDropPercent}% no rendimento acadêmico*.\n\n` +
      `Solicitamos comparecimento à escola ou contato urgente com a coordenação pedagógica para alinhamento de apoio educacional.`
    );
  } else if (alert.alertType === 'CONSECUTIVE_ABSENCES') {
    return (
      `${greeting}\n\n` +
      `Identificamos que o(a) estudante *${alert.studentName}* (${alert.className}) completou *${alert.consecutiveAbsencesCount} faltas consecutivas* sem justificativa formal.\n\n` +
      `Por favor, entrem em contato para regularizar a frequência e evitar prejuízos ao ano letivo.`
    );
  } else {
    return (
      `${greeting}\n\n` +
      `Identificamos uma oscilação de *${alert.performanceDropPercent}% no aproveitamento escolar* de *${alert.studentName}* (${alert.className}) em ${alert.subjectAffected || 'avaliações recentes'}.\n\n` +
      `Estamos disponibilizando apoio pedagógico e recuperação paralela. Contate a coordenação para mais detalhes.`
    );
  }
}
