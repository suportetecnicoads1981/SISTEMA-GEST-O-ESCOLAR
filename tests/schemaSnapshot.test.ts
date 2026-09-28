import { describe, expect, it } from 'vitest';
import { SUPABASE_REQUIRED_COLUMNS, SUPABASE_TABLE_COLUMNS } from '../src/services/datasync/supabaseRowMapper';

/**
 * Colunas reais do schema public do projeto Supabase (consultado em 28/09/2026, depois da sincronização v2). Se o banco mudar, atualize este retrato E o
 * supabaseRowMapper.ts juntos, senão a sincronização descarta campos.
 */
const DB_COLUMNS: Record<string, string> = {
  academic_histories: 'attendance_rate,base_version,created_at,doc,final_result,general_average,grade_level,id,observations,records,row_version,school_name,school_year,server_updated_at,student_id,updated_at',
  app_records: 'base_version,collection,doc,id,row_version,server_updated_at',
  attendance_sheets: 'attendance_rate,base_version,class_id,class_name,created_at,date,doc,entries,id,lesson_number,row_version,server_updated_at,subject_id,subject_name,teacher_name,term,total_absent,total_justified,total_present,total_students,updated_at',
  bncc_skill_assessments: 'base_version,class_id,created_at,doc,id,level,notes,row_version,school_unit_id,school_year,server_updated_at,skill_code,student_id,subject,teacher_name,term,updated_at',
  bncc_skills: 'base_version,code,created_at,description,doc,education_level,field_of_experience,id,knowledge_object,row_version,segment,server_updated_at,subject,tags,updated_at',
  class_grade_sheets: 'average_score,base_version,class_id,class_name,created_at,doc,grades,id,row_version,school_year,server_updated_at,subject_id,subject_name,term,updated_at',
  communications: 'attachments,base_version,category,content,created_at,doc,id,priority,read_confirmations,recipient_type,require_read_confirmation,row_version,send_push_notification,senderRole,sender_name,sender_role,sender_title,server_updated_at,status,targetRoles,target_class_id,target_roles,target_student_id,target_student_name,title,updated_at',
  courses: 'base_version,created_at,description,doc,duration_years,id,name,row_version,segment,server_updated_at,updated_at',
  exam_submissions: 'answers,base_version,class_id,correct_count,created_at,doc,enrollment_number,exam_id,id,incorrect_count,max_score,percentage,row_version,server_updated_at,started_at,status,student_id,student_name,submitted_at,time_spent_seconds,total_score',
  exams: 'base_version,class_id,created_at,description,doc,due_date_time,id,passing_score,questions,row_version,scheduled_date,school_year,server_updated_at,status,subject,teacher_name,term,time_limit_minutes,title,total_points,updated_at',
  lesson_registries: 'base_version,bncc_skill_codes,class_id,class_name,content_taught,created_at,date,doc,homework,id,lesson_count,methodology,pedagogical_observations,row_version,server_updated_at,status,subject_id,subject_name,teacher_name,term,updated_at',
  media_assets: 'bucket,created_at,id,is_animated,name,original_format,path,public_url,size_bytes',
  notifications: 'actionPayload,action_payload,action_tab,base_version,created_at,doc,id,message,priority,read,row_version,server_updated_at,targetRoles,target_roles,title,type',
  questions: 'author_teacher,base_version,bncc_skill,code,created_at,difficulty,doc,explanation,grade_level,id,options,row_version,server_updated_at,stem,subject,tags,topic,type,updated_at',
  role_preferences: 'categories,channels,quiet_hours,role,sound_enabled,updated_at',
  school_classes: 'base_version,capacity,class_teacher,created_at,doc,grade_level,id,name,room_number,row_version,school_unit_id,school_year,segment,server_updated_at,shift,updated_at',
  school_settings: 'accreditation_decree,address,base_version,city,cnpj,created_at,doc,email,id,inep_code,logo_url,management_logo_url,name,neighborhood,phone,principal_name,principal_title,row_version,secretary_name,secretary_registration,server_updated_at,state,system_version,trade_name,updated_at,website,zip_code',
  school_units: 'active,base_version,city,code,created_at,doc,email,id,inep_code,logo_url,management_logo_url,name,phone,principal_name,row_version,server_updated_at,state,type,updated_at',
  students: 'address,base_version,birth_date,cadastral_status,city,class_id,cpf,created_at,doc,email,gender,guardian_name,guardian_phone,has_aee,id,location_zone,medical_observations,name,phone,photo_url,registration_number,rg,row_version,school_unit_id,server_updated_at,state,status,updated_at',
  subjects: 'base_version,code,created_at,doc,id,name,row_version,segment,server_updated_at,teacher_name,updated_at,workload_hours',
  sync_audit_logs: 'created_at,details,id,latency_ms,operation,records_count,station_id,status,table_name',
  system_updates: 'author,base_version,cloud_storage_url,created_at,description,doc,download_url,id,improvements,is_cloud_available,min_compatible_version,published_at,published_by,release_date,row_version,server_updated_at,severity,sha256_checksum,size_formatted,summary,target_platform,title,updated_at,version',
  user_accounts: 'active,base_version,created_at,doc,email,id,login,name,permissions,phone,role,row_version,school_unit_id,sector,sector_title,server_updated_at,updated_at',
  whatsapp_messages: 'base_version,batch_id,content,created_at,doc,id,message_type,operator_name,recipient_name,recipient_phone,recipient_role,row_version,sent_at,server_updated_at,source,status,student_class,student_id,student_name,title,updated_at',
};

const DB_REQUIRED: Record<string, string> = {
  academic_histories: 'student_id',
  app_records: 'collection',
  attendance_sheets: 'class_id',
  bncc_skill_assessments: 'level,school_year,skill_code,student_id,term',
  bncc_skills: 'code,description',
  class_grade_sheets: 'class_id',
  communications: 'content,sender_name,title',
  courses: 'name,segment',
  exam_submissions: 'exam_id,student_id,student_name',
  exams: 'subject,title',
  lesson_registries: 'class_id,content_taught',
  media_assets: 'bucket,name,original_format,path,size_bytes',
  notifications: 'message,title',
  questions: 'stem,subject',
  role_preferences: 'role',
  school_classes: 'grade_level,name',
  school_settings: 'name',
  school_units: 'name',
  students: 'name,registration_number',
  subjects: 'name',
  sync_audit_logs: 'operation,station_id,status,table_name',
  system_updates: 'title,version',
  user_accounts: 'email,login,name',
  whatsapp_messages: 'content,recipient_name',
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
