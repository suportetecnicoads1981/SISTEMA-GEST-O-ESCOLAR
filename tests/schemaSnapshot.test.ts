import { describe, expect, it } from 'vitest';
import { SUPABASE_REQUIRED_COLUMNS, SUPABASE_TABLE_COLUMNS } from '../src/services/datasync/supabaseRowMapper';

/**
 * Colunas reais do schema public do projeto Supabase (consultado em 23/09/2026; tabelas BNCC em 24/09/2026
 * via information_schema). Se o banco mudar, atualize este retrato E o
 * supabaseRowMapper.ts juntos, senão a sincronização descarta campos.
 */
const DB_COLUMNS: Record<string, string> = {
  academic_histories: 'attendance_rate,created_at,final_result,general_average,grade_level,id,observations,records,school_name,school_year,student_id,updated_at',
  attendance_sheets: 'attendance_rate,class_id,class_name,created_at,date,entries,id,lesson_number,subject_id,subject_name,teacher_name,term,total_absent,total_justified,total_present,total_students,updated_at',
  bncc_skill_assessments: 'class_id,created_at,id,level,notes,school_unit_id,school_year,skill_code,student_id,subject,teacher_name,term,updated_at',
  bncc_skills: 'code,created_at,description,education_level,field_of_experience,id,knowledge_object,segment,subject,tags,updated_at',
  class_grade_sheets: 'average_score,class_id,class_name,created_at,grades,id,school_year,subject_id,subject_name,term,updated_at',
  communications: 'category,content,created_at,id,priority,read_confirmations,recipient_type,senderRole,sender_name,sender_role,status,targetRoles,target_roles,title,updated_at',
  courses: 'created_at,description,duration_years,id,name,segment,updated_at',
  exam_submissions: 'answers,class_id,correct_count,created_at,enrollment_number,exam_id,id,incorrect_count,max_score,percentage,started_at,status,student_id,student_name,submitted_at,time_spent_seconds,total_score',
  exams: 'class_id,created_at,description,due_date_time,id,passing_score,questions,scheduled_date,school_year,status,subject,teacher_name,term,time_limit_minutes,title,total_points,updated_at',
  lesson_registries: 'bncc_skill_codes,class_id,class_name,content_taught,created_at,date,homework,id,lesson_count,methodology,pedagogical_observations,status,subject_id,subject_name,teacher_name,term,updated_at',
  media_assets: 'bucket,created_at,id,is_animated,name,original_format,path,public_url,size_bytes',
  notifications: 'actionPayload,action_payload,action_tab,created_at,id,message,priority,read,targetRoles,target_roles,title,type',
  questions: 'author_teacher,bncc_skill,code,created_at,difficulty,explanation,grade_level,id,options,stem,subject,tags,topic,type,updated_at',
  role_preferences: 'categories,channels,quiet_hours,role,sound_enabled,updated_at',
  school_classes: 'capacity,class_teacher,created_at,grade_level,id,name,room_number,school_unit_id,school_year,segment,shift,updated_at',
  school_settings: 'accreditation_decree,address,city,cnpj,created_at,email,id,inep_code,logo_url,name,neighborhood,phone,principal_name,principal_title,secretary_name,secretary_registration,state,system_version,trade_name,updated_at,website,zip_code',
  school_units: 'active,city,code,created_at,email,id,inep_code,name,phone,principal_name,state,type,updated_at',
  students: 'address,birth_date,cadastral_status,city,class_id,cpf,created_at,email,gender,guardian_name,guardian_phone,has_aee,id,location_zone,medical_observations,name,phone,photo_url,registration_number,rg,school_unit_id,state,status,updated_at',
  subjects: 'code,created_at,id,name,segment,teacher_name,updated_at,workload_hours',
  sync_audit_logs: 'created_at,details,id,latency_ms,operation,records_count,station_id,status,table_name',
  system_updates: 'author,cloud_storage_url,created_at,description,download_url,id,improvements,is_cloud_available,min_compatible_version,published_at,published_by,release_date,severity,sha256_checksum,size_formatted,summary,target_platform,title,updated_at,version',
  user_accounts: 'active,created_at,email,id,login,name,permissions,role,school_unit_id,sector,sector_title,updated_at',
};

const DB_REQUIRED: Record<string, string> = {
  academic_histories: 'student_id', attendance_sheets: 'class_id',
  bncc_skill_assessments: 'level,school_year,skill_code,student_id,term', bncc_skills: 'code,description', class_grade_sheets: 'class_id',
  communications: 'content,sender_name,title', courses: 'name,segment', exam_submissions: 'exam_id,student_id,student_name',
  exams: 'subject,title', lesson_registries: 'class_id,content_taught', media_assets: 'bucket,name,original_format,path,size_bytes',
  notifications: 'message,title', questions: 'stem,subject', role_preferences: 'role', school_classes: 'grade_level,name',
  school_settings: 'name', school_units: 'name', students: 'name,registration_number', subjects: 'name',
  sync_audit_logs: 'operation,station_id,status,table_name', system_updates: 'title,version', user_accounts: 'email,login,name',
};

const sorted = (list: string[]) => [...list].sort().join(',');

describe('mapeador espelha o schema real do Supabase', () => {
  it('mesmas tabelas', () => {
    expect(Object.keys(SUPABASE_TABLE_COLUMNS).sort()).toEqual(Object.keys(DB_COLUMNS).sort());
  });
  it.each(Object.keys(DB_COLUMNS))('colunas de %s', (table) => {
    expect(sorted(SUPABASE_TABLE_COLUMNS[table])).toBe(DB_COLUMNS[table]);
  });
  it.each(Object.keys(DB_REQUIRED))('obrigatórias de %s', (table) => {
    expect(sorted(SUPABASE_REQUIRED_COLUMNS[table] || [])).toBe(DB_REQUIRED[table]);
  });
});
