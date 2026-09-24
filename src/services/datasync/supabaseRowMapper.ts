/**
 * Conversão entre os objetos do aplicativo (camelCase) e as linhas das tabelas
 * do Supabase (snake_case).
 *
 * Antes, vários registros eram enviados com as chaves do app (classId, entries…)
 * e o PostgREST recusava o lote inteiro por coluna inexistente; na volta, as
 * linhas chegavam em snake_case e substituíam os objetos locais, quebrando campos
 * como classId e enrollmentNumber.
 */

/** Colunas reais de cada tabela (espelha o esquema public do projeto Supabase). */
export const SUPABASE_TABLE_COLUMNS: Record<string, string[]> = {
  academic_histories: ['id', 'student_id', 'school_year', 'grade_level', 'school_name', 'records', 'general_average', 'attendance_rate', 'final_result', 'observations', 'created_at', 'updated_at'],
  bncc_skills: ['id', 'code', 'education_level', 'segment', 'subject', 'field_of_experience', 'knowledge_object', 'description', 'tags', 'created_at', 'updated_at'],
  bncc_skill_assessments: ['id', 'student_id', 'class_id', 'school_unit_id', 'skill_code', 'subject', 'school_year', 'term', 'level', 'notes', 'teacher_name', 'created_at', 'updated_at'],
  attendance_sheets: ['id', 'date', 'class_id', 'class_name', 'subject_id', 'subject_name', 'teacher_name', 'lesson_number', 'term', 'entries', 'total_students', 'total_present', 'total_absent', 'total_justified', 'attendance_rate', 'created_at', 'updated_at'],
  class_grade_sheets: ['id', 'class_id', 'class_name', 'subject_id', 'subject_name', 'school_year', 'term', 'grades', 'average_score', 'created_at', 'updated_at'],
  communications: ['id', 'title', 'content', 'sender_role', 'sender_name', 'recipient_type', 'priority', 'category', 'status', 'read_confirmations', 'created_at', 'updated_at', 'senderRole', 'target_roles', 'targetRoles'],
  courses: ['id', 'name', 'segment', 'duration_years', 'description', 'created_at', 'updated_at'],
  exam_submissions: ['id', 'exam_id', 'student_id', 'student_name', 'enrollment_number', 'class_id', 'started_at', 'submitted_at', 'time_spent_seconds', 'total_score', 'max_score', 'percentage', 'correct_count', 'incorrect_count', 'answers', 'status', 'created_at'],
  exams: ['id', 'title', 'description', 'subject', 'class_id', 'teacher_name', 'school_year', 'term', 'total_points', 'passing_score', 'time_limit_minutes', 'questions', 'status', 'scheduled_date', 'due_date_time', 'created_at', 'updated_at'],
  lesson_registries: ['id', 'date', 'class_id', 'class_name', 'subject_id', 'subject_name', 'teacher_name', 'lesson_count', 'term', 'content_taught', 'bncc_skill_codes', 'methodology', 'homework', 'pedagogical_observations', 'status', 'created_at', 'updated_at'],
  media_assets: ['id', 'name', 'bucket', 'path', 'original_format', 'size_bytes', 'is_animated', 'public_url', 'created_at'],
  notifications: ['id', 'title', 'message', 'type', 'priority', 'read', 'action_tab', 'created_at', 'target_roles', 'targetRoles', 'action_payload', 'actionPayload'],
  questions: ['id', 'code', 'subject', 'topic', 'grade_level', 'bncc_skill', 'difficulty', 'type', 'stem', 'options', 'explanation', 'author_teacher', 'tags', 'created_at', 'updated_at'],
  role_preferences: ['role', 'channels', 'categories', 'sound_enabled', 'quiet_hours', 'updated_at'],
  school_classes: ['id', 'name', 'grade_level', 'shift', 'school_year', 'capacity', 'created_at', 'updated_at', 'segment', 'room_number', 'class_teacher', 'school_unit_id'],
  school_settings: ['id', 'name', 'trade_name', 'inep_code', 'cnpj', 'accreditation_decree', 'address', 'city', 'state', 'phone', 'email', 'principal_name', 'secretary_name', 'logo_url', 'created_at', 'updated_at', 'neighborhood', 'zip_code', 'website', 'principal_title', 'secretary_registration', 'system_version'],
  school_units: ['id', 'name', 'code', 'type', 'inep_code', 'city', 'state', 'principal_name', 'phone', 'email', 'active', 'created_at', 'updated_at'],
  students: ['id', 'name', 'registration_number', 'status', 'class_id', 'birth_date', 'created_at', 'updated_at', 'cpf', 'rg', 'gender', 'email', 'phone', 'guardian_name', 'guardian_phone', 'address', 'city', 'state', 'location_zone', 'cadastral_status', 'medical_observations', 'has_aee', 'photo_url', 'school_unit_id'],
  subjects: ['id', 'name', 'code', 'segment', 'teacher_name', 'workload_hours', 'created_at', 'updated_at'],
  sync_audit_logs: ['id', 'table_name', 'operation', 'station_id', 'records_count', 'latency_ms', 'status', 'details', 'created_at'],
  system_updates: ['id', 'version', 'release_date', 'title', 'summary', 'description', 'severity', 'size_formatted', 'sha256_checksum', 'download_url', 'cloud_storage_url', 'min_compatible_version', 'author', 'target_platform', 'is_cloud_available', 'improvements', 'published_by', 'published_at', 'created_at', 'updated_at'],
  user_accounts: ['id', 'name', 'login', 'email', 'role', 'sector', 'sector_title', 'active', 'permissions', 'created_at', 'updated_at', 'school_unit_id'],
};

/** Colunas NOT NULL sem valor padrão: linhas sem elas fariam o lote inteiro falhar. */
export const SUPABASE_REQUIRED_COLUMNS: Record<string, string[]> = {
  academic_histories: ['student_id'],
  attendance_sheets: ['class_id'],
  bncc_skills: ['code', 'description'],
  bncc_skill_assessments: ['student_id', 'skill_code', 'school_year', 'term', 'level'],
  class_grade_sheets: ['class_id'],
  communications: ['content', 'sender_name', 'title'],
  courses: ['segment', 'name'],
  exam_submissions: ['student_id', 'student_name', 'exam_id'],
  exams: ['subject', 'title'],
  lesson_registries: ['content_taught', 'class_id'],
  media_assets: ['original_format', 'bucket', 'name', 'path', 'size_bytes'],
  notifications: ['message', 'title'],
  questions: ['stem', 'subject'],
  role_preferences: ['role'],
  school_classes: ['grade_level', 'name'],
  school_settings: ['name'],
  school_units: ['name'],
  students: ['registration_number', 'name'],
  subjects: ['name'],
  sync_audit_logs: ['operation', 'status', 'station_id', 'table_name'],
  system_updates: ['title', 'version'],
  user_accounts: ['email', 'login', 'name'],
};

/** Tabelas em que apenas ADMIN pode gravar (ver políticas RLS). */
export const ADMIN_ONLY_TABLES = new Set(['user_accounts', 'school_units', 'school_settings', 'system_updates', 'role_preferences']);

export function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}

export function snakeToCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/**
 * Converte um objeto do app em linha da tabela: chaves em snake_case e somente
 * colunas existentes. Retorna null quando falta alguma coluna obrigatória.
 */
export function toRemoteRow(table: string, record: Record<string, any>): Record<string, any> | null {
  const columns = SUPABASE_TABLE_COLUMNS[table];
  if (!columns) return record;
  const allowed = new Set(columns);
  const row: Record<string, any> = {};

  for (const [key, value] of Object.entries(record)) {
    if (value === undefined) continue;
    if (allowed.has(key)) {
      row[key] = value;
      continue;
    }
    const snake = camelToSnake(key);
    if (allowed.has(snake) && !(snake in row)) {
      row[snake] = value;
    }
  }

  const required = SUPABASE_REQUIRED_COLUMNS[table] || [];
  for (const col of required) {
    if (row[col] === undefined || row[col] === null || row[col] === '') return null;
  }
  return row;
}

/** Converte uma linha do Supabase para as chaves camelCase usadas no app. */
export function fromRemoteRow(row: Record<string, any>): Record<string, any> {
  const obj: Record<string, any> = {};
  for (const [key, value] of Object.entries(row || {})) {
    if (value === null) continue;
    obj[snakeToCamel(key)] = value;
  }
  return obj;
}

/**
 * Mescla as linhas remotas sobre a lista local, por id:
 * - campos que só existem localmente são preservados;
 * - registros que só existem localmente são mantidos (a sincronização nunca exclui);
 * - lista remota vazia não apaga os dados locais;
 * - registro local com updatedAt mais recente que o da nuvem é mantido (alteração ainda não enviada).
 */
export function mergeRemoteIntoLocal<T extends Record<string, any>>(
  localList: T[] | undefined,
  remoteRows: any[] | null | undefined,
  mapRow: (row: Record<string, any>) => Record<string, any> = fromRemoteRow
): T[] {
  const local = Array.isArray(localList) ? localList : [];
  if (!Array.isArray(remoteRows) || remoteRows.length === 0) return local;

  const byId = new Map<string, T>();
  const order: string[] = [];
  for (const item of local) {
    if (item && item.id !== undefined) {
      byId.set(String(item.id), item);
      order.push(String(item.id));
    }
  }
  for (const row of remoteRows) {
    if (!row || row.id === undefined) continue;
    const id = String(row.id);
    const mapped = mapRow(row);
    if (!byId.has(id)) order.push(id);
    const current = byId.get(id);
    // Alteração local mais recente que a cópia da nuvem (ainda não enviada) não é sobrescrita.
    const localTime = Date.parse(String(current?.updatedAt ?? ''));
    const remoteTime = Date.parse(String(row.updated_at ?? row.updatedAt ?? ''));
    if (current && !Number.isNaN(localTime) && !Number.isNaN(remoteTime) && localTime > remoteTime) {
      byId.set(id, { ...mapped, ...current } as T);
      continue;
    }
    byId.set(id, { ...(current || {}), ...mapped } as T);
  }
  return order.map((id) => byId.get(id)!).filter(Boolean);
}
