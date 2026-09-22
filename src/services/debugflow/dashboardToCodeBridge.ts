/**
 * Dashboard-to-Code Bridge
 * Mapeador e auditor de integridade entre tabelas manuais do Supabase Dashboard
 * e as interfaces TypeScript do frontend.
 */
import {
  SupabaseColumnMapping,
  SupabaseTableAudit,
  SUPABASE_DASHBOARD_TABLES,
} from '../../types/supabaseSchema';
import { getStoredData, AppStateData } from '../../data/storage';

export interface ReferentialAuditResult {
  relationName: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  type: '1:N' | 'N:1' | 'N:N';
  totalSourceRecords: number;
  totalTargetRecords: number;
  orphanedRecordsCount: number;
  status: 'INTEGRITY_OK' | 'ORPHANS_DETECTED';
  remediationSnippet: string;
}

export class DashboardToCodeBridge {
  /**
   * Obtém a lista completa das tabelas cadastradas no Dashboard do Supabase
   */
  public static getDashboardTables(): SupabaseTableAudit[] {
    return SUPABASE_DASHBOARD_TABLES;
  }

  /**
   * Mapeamento detalhado de colunas entre Supabase e propriedades TypeScript
   */
  public static getColumnMappingsForTable(tableName: string): SupabaseColumnMapping[] {
    switch (tableName) {
      case 'students':
        return [
          { table: 'students', column: 'id', frontendProperty: 'id', dataType: 'TEXT', nullable: false, isPrimaryKey: true, status: 'MATCH' },
          { table: 'students', column: 'name', frontendProperty: 'name', dataType: 'TEXT', nullable: false, status: 'MATCH' },
          { table: 'students', column: 'registration_number', frontendProperty: 'registrationNumber', dataType: 'TEXT', nullable: true, status: 'TRANSFORMED' },
          { table: 'students', column: 'class_id', frontendProperty: 'classId', dataType: 'TEXT', nullable: true, foreignKey: { targetTable: 'school_classes', targetColumn: 'id', relationshipType: 'N:1' }, status: 'MATCH' },
          { table: 'students', column: 'unit_id', frontendProperty: 'unitId', dataType: 'TEXT', nullable: true, foreignKey: { targetTable: 'school_units', targetColumn: 'id', relationshipType: 'N:1' }, status: 'MATCH' },
          { table: 'students', column: 'birth_date', frontendProperty: 'birthDate', dataType: 'TEXT', nullable: true, status: 'TRANSFORMED' },
          { table: 'students', column: 'gender', frontendProperty: 'gender', dataType: 'TEXT', nullable: true, status: 'MATCH' },
          { table: 'students', column: 'cadastral_status', frontendProperty: 'cadastralStatus', dataType: 'TEXT', nullable: true, status: 'TRANSFORMED' },
          { table: 'students', column: 'special_needs', frontendProperty: 'specialNeeds', dataType: 'BOOLEAN', nullable: true, status: 'MATCH' },
          { table: 'students', column: 'guardian_name', frontendProperty: 'guardianName', dataType: 'TEXT', nullable: true, status: 'TRANSFORMED' },
          { table: 'students', column: 'guardian_phone', frontendProperty: 'guardianPhone', dataType: 'TEXT', nullable: true, status: 'TRANSFORMED' },
          { table: 'students', column: 'email', frontendProperty: 'email', dataType: 'TEXT', nullable: true, status: 'MATCH' },
          { table: 'students', column: 'created_at', frontendProperty: 'createdAt', dataType: 'TIMESTAMPTZ', nullable: true, status: 'TRANSFORMED' },
        ];
      case 'school_classes':
        return [
          { table: 'school_classes', column: 'id', frontendProperty: 'id', dataType: 'TEXT', nullable: false, isPrimaryKey: true, status: 'MATCH' },
          { table: 'school_classes', column: 'name', frontendProperty: 'name', dataType: 'TEXT', nullable: false, status: 'MATCH' },
          { table: 'school_classes', column: 'grade', frontendProperty: 'grade', dataType: 'TEXT', nullable: false, status: 'MATCH' },
          { table: 'school_classes', column: 'shift', frontendProperty: 'shift', dataType: 'TEXT', nullable: false, status: 'MATCH' },
          { table: 'school_classes', column: 'academic_year', frontendProperty: 'academicYear', dataType: 'INT', nullable: true, status: 'TRANSFORMED' },
          { table: 'school_classes', column: 'unit_id', frontendProperty: 'unitId', dataType: 'TEXT', nullable: true, foreignKey: { targetTable: 'school_units', targetColumn: 'id', relationshipType: 'N:1' }, status: 'MATCH' },
          { table: 'school_classes', column: 'max_capacity', frontendProperty: 'maxCapacity', dataType: 'INT', nullable: true, status: 'TRANSFORMED' },
        ];
      case 'exams':
        return [
          { table: 'exams', column: 'id', frontendProperty: 'id', dataType: 'TEXT', nullable: false, isPrimaryKey: true, status: 'MATCH' },
          { table: 'exams', column: 'title', frontendProperty: 'title', dataType: 'TEXT', nullable: false, status: 'MATCH' },
          { table: 'exams', column: 'subject', frontendProperty: 'subject', dataType: 'TEXT', nullable: false, status: 'MATCH' },
          { table: 'exams', column: 'total_questions', frontendProperty: 'totalQuestions', dataType: 'INT', nullable: true, status: 'TRANSFORMED' },
          { table: 'exams', column: 'max_score', frontendProperty: 'maxScore', dataType: 'NUMERIC', nullable: true, status: 'TRANSFORMED' },
        ];
      case 'exam_submissions':
        return [
          { table: 'exam_submissions', column: 'id', frontendProperty: 'id', dataType: 'TEXT', nullable: false, isPrimaryKey: true, status: 'MATCH' },
          { table: 'exam_submissions', column: 'exam_id', frontendProperty: 'examId', dataType: 'TEXT', nullable: false, foreignKey: { targetTable: 'exams', targetColumn: 'id', relationshipType: 'N:1' }, status: 'MATCH' },
          { table: 'exam_submissions', column: 'student_id', frontendProperty: 'studentId', dataType: 'TEXT', nullable: false, foreignKey: { targetTable: 'students', targetColumn: 'id', relationshipType: 'N:1' }, status: 'MATCH' },
          { table: 'exam_submissions', column: 'score', frontendProperty: 'score', dataType: 'NUMERIC', nullable: true, status: 'MATCH' },
          { table: 'exam_submissions', column: 'status', frontendProperty: 'status', dataType: 'TEXT', nullable: true, status: 'MATCH' },
        ];
      case 'sync_audit_logs':
        return [
          { table: 'sync_audit_logs', column: 'id', frontendProperty: 'id', dataType: 'TEXT', nullable: false, isPrimaryKey: true, status: 'MATCH' },
          { table: 'sync_audit_logs', column: 'table_name', frontendProperty: 'tableName', dataType: 'TEXT', nullable: false, status: 'MATCH' },
          { table: 'sync_audit_logs', column: 'operation', frontendProperty: 'operation', dataType: 'TEXT', nullable: false, status: 'MATCH' },
          { table: 'sync_audit_logs', column: 'station_id', frontendProperty: 'schoolUnitId', dataType: 'TEXT', nullable: false, status: 'TRANSFORMED' },
          { table: 'sync_audit_logs', column: 'records_count', frontendProperty: 'recordsMerged.students', dataType: 'INT', nullable: true, status: 'TRANSFORMED' },
          { table: 'sync_audit_logs', column: 'status', frontendProperty: 'status', dataType: 'TEXT', nullable: false, status: 'MATCH' },
          { table: 'sync_audit_logs', column: 'details', frontendProperty: 'notes', dataType: 'TEXT', nullable: true, status: 'TRANSFORMED' },
          { table: 'sync_audit_logs', column: 'created_at', frontendProperty: 'importedAt', dataType: 'TIMESTAMPTZ', nullable: true, status: 'TRANSFORMED' },
        ];
      default:
        return [
          { table: tableName, column: 'id', frontendProperty: 'id', dataType: 'TEXT', nullable: false, isPrimaryKey: true, status: 'MATCH' },
          { table: tableName, column: 'name', frontendProperty: 'name', dataType: 'TEXT', nullable: true, status: 'MATCH' },
          { table: tableName, column: 'created_at', frontendProperty: 'createdAt', dataType: 'TIMESTAMPTZ', nullable: true, status: 'TRANSFORMED' },
        ];
    }
  }

  /**
   * Auditoria de Integridade Referencial (Chaves Estrangeiras 1:N e N:1)
   */
  public static auditReferentialIntegrity(data?: AppStateData): ReferentialAuditResult[] {
    const currentData = data || getStoredData();
    const students = currentData.students || [];
    const classes = currentData.classes || [];
    const exams = currentData.exams || [];
    const submissions = currentData.submissions || [];
    const units = currentData.schoolUnits || [];

    const classIdSet = new Set(classes.map((c) => c.id));
    const studentIdSet = new Set(students.map((s) => s.id));
    const examIdSet = new Set(exams.map((e) => e.id));
    const unitIdSet = new Set(units.map((u) => u.id));

    // 1. Alunos -> Turmas (students.class_id -> school_classes.id)
    const orphanedStudentsInClass = students.filter(
      (s) => s.classId && !classIdSet.has(s.classId)
    ).length;

    // 2. Alunos -> Unidades Escolares (students.unit_id -> school_units.id)
    const orphanedStudentsInUnit = students.filter(
      (s) => (s as any).unitId && !unitIdSet.has((s as any).unitId)
    ).length;

    // 3. Provas Realizadas -> Exames (exam_submissions.exam_id -> exams.id)
    const orphanedSubmissionsInExam = submissions.filter(
      (sub) => sub.examId && !examIdSet.has(sub.examId)
    ).length;

    // 4. Provas Realizadas -> Alunos (exam_submissions.student_id -> students.id)
    const orphanedSubmissionsInStudent = submissions.filter(
      (sub) => sub.studentId && !studentIdSet.has(sub.studentId)
    ).length;

    return [
      {
        relationName: 'Alunos vinculados a Turmas existentes',
        sourceTable: 'students',
        sourceColumn: 'class_id',
        targetTable: 'school_classes',
        targetColumn: 'id',
        type: 'N:1',
        totalSourceRecords: students.length,
        totalTargetRecords: classes.length,
        orphanedRecordsCount: orphanedStudentsInClass,
        status: orphanedStudentsInClass === 0 ? 'INTEGRITY_OK' : 'ORPHANS_DETECTED',
        remediationSnippet: `UPDATE students SET class_id = NULL WHERE class_id NOT IN (SELECT id FROM school_classes);`,
      },
      {
        relationName: 'Alunos vinculados a Polos/Unidades Escolares',
        sourceTable: 'students',
        sourceColumn: 'unit_id',
        targetTable: 'school_units',
        targetColumn: 'id',
        type: 'N:1',
        totalSourceRecords: students.length,
        totalTargetRecords: units.length,
        orphanedRecordsCount: orphanedStudentsInUnit,
        status: orphanedStudentsInUnit === 0 ? 'INTEGRITY_OK' : 'ORPHANS_DETECTED',
        remediationSnippet: `UPDATE students SET unit_id = (SELECT id FROM school_units LIMIT 1) WHERE unit_id NOT IN (SELECT id FROM school_units);`,
      },
      {
        relationName: 'Submissões de Provas vinculadas a Exames',
        sourceTable: 'exam_submissions',
        sourceColumn: 'exam_id',
        targetTable: 'exams',
        targetColumn: 'id',
        type: 'N:1',
        totalSourceRecords: submissions.length,
        totalTargetRecords: exams.length,
        orphanedRecordsCount: orphanedSubmissionsInExam,
        status: orphanedSubmissionsInExam === 0 ? 'INTEGRITY_OK' : 'ORPHANS_DETECTED',
        remediationSnippet: `DELETE FROM exam_submissions WHERE exam_id NOT IN (SELECT id FROM exams);`,
      },
      {
        relationName: 'Submissões de Provas vinculadas a Alunos Cadastrados',
        sourceTable: 'exam_submissions',
        sourceColumn: 'student_id',
        targetTable: 'students',
        targetColumn: 'id',
        type: 'N:1',
        totalSourceRecords: submissions.length,
        totalTargetRecords: students.length,
        orphanedRecordsCount: orphanedSubmissionsInStudent,
        status: orphanedSubmissionsInStudent === 0 ? 'INTEGRITY_OK' : 'ORPHANS_DETECTED',
        remediationSnippet: `DELETE FROM exam_submissions WHERE student_id NOT IN (SELECT id FROM students);`,
      },
    ];
  }
}
