/**
 * Controle de acesso do SucessoEdu (privilégios por usuário).
 *
 * Antes, a matriz de permissões do cadastro de usuários era só informativa: nada no sistema
 * consultava "Ler / Criar / Editar / Excluir". Aqui ficam as regras que passam a valer:
 *
 *  - Abrir módulo: exige "Ler" no módulo correspondente (menu, atalhos, busca, abas).
 *  - Gravar dados: toda gravação passa por enforceDataPermissions(), que compara o antes e o
 *    depois de cada cadastro e recusa inclusão, alteração ou exclusão sem o privilégio.
 *    Vale para qualquer tela, porque a checagem é feita no ponto único de gravação.
 *  - Usuários, senhas, setores e permissões, e os dados do desenvolvedor: só o Master altera.
 *  - Quem tem escola de lotação só grava registros da própria escola (schoolScope.ts).
 *  - O Master (setor MASTER ou marcado como Master) tem acesso total.
 */
import type { ModulePermission, SystemModuleKey, UserAccount } from '../../types';
import { moduleName } from '../../config/moduleNames';
import { getDefaultSectorPermissions } from '../../components/usuarios/UserAccessControl';
import { enforceSchoolScope, userSchoolScope } from './schoolScope';

export type AccessAction = 'canRead' | 'canCreate' | 'canEdit' | 'canDelete';

export const MODULE_KEY_LABEL: Record<SystemModuleKey, string> = {
  dashboard: moduleName('MAIN_DASHBOARD'),
  secretaria: moduleName('STUDENTS'),
  turmas: moduleName('CLASSES'),
  diarioClasse: moduleName('CLASS_DIARY'),
  portalProfessor: moduleName('TEACHER_PORTAL'),
  documentos: moduleName('DOCUMENTS'),
  comunicacao: moduleName('COMMUNICATION'),
  questoes: moduleName('QUESTION_BANK'),
  provas: moduleName('EXAMS'),
  relatorios: moduleName('PEDAGOGICAL_DASHBOARD'),
  gestaoMunicipal: moduleName('MUNICIPAL_SYNC'),
  usuarios: moduleName('USER_CONTROL'),
  configuracoes: 'Configurações & Administração',
};

const ACTION_LABEL: Record<AccessAction, string> = {
  canRead: 'abrir',
  canCreate: 'incluir',
  canEdit: 'alterar',
  canDelete: 'excluir',
};

type Actor = (Pick<UserAccount, 'id' | 'isMaster' | 'sector' | 'permissions' | 'active'> & { schoolUnitId?: string | null }) | null | undefined;

/** Master: setor MASTER ou conta marcada como Master. Acesso total. */
export function isMasterAccount(user: Actor): boolean {
  return Boolean(user && (user.isMaster || user.sector === 'MASTER'));
}

/** O usuário tem o privilégio no módulo? */
export function can(user: Actor, key: SystemModuleKey, action: AccessAction): boolean {
  if (!user) return false;
  if (isMasterAccount(user)) return true;
  if (user.active === false) return false;
  const own = user.permissions as any;
  // Cadastro sem matriz de permissões (ex.: veio incompleto de outro computador): vale o padrão do setor.
  const matrix = own && Object.keys(own).length ? own : user.sector ? getDefaultSectorPermissions(user.sector as any) : null;
  const perm: ModulePermission | undefined = matrix?.[key];
  return Boolean(perm && perm[action]);
}

/** Módulo (da matriz de permissões) que controla cada tela. null = sempre liberada. */
const TAB_MODULE: Record<string, SystemModuleKey | 'MASTER' | null> = {
  MAIN_DASHBOARD: null,
  NOTIFICATIONS: null,
  ABOUT: null,
  ARCHITECTURE_DIAGRAM: 'configuracoes',
  COMMUNICATION: 'comunicacao',
  WHATSAPP: 'comunicacao',
  TEACHER_PORTAL: 'portalProfessor',
  PROFESSOR_DASHBOARD: 'portalProfessor',
  PROFESSOR: 'portalProfessor',
  CLASS_DIARY: 'diarioClasse',
  STUDENTS: 'secretaria',
  DROPOUT_CENSUS: 'secretaria',
  CLASSES: 'turmas',
  DOCUMENTS: 'documentos',
  PEDAGOGICAL_DASHBOARD: 'relatorios',
  ASSESSMENT_REPORT: 'relatorios',
  BNCC_SKILLS: 'relatorios',
  EXAMS: 'provas',
  STUDENT_ROOM: 'provas',
  QUESTION_BANK: 'questoes',
  MUNICIPAL_SYNC: 'gestaoMunicipal',
  USER_CONTROL: 'usuarios',
  DEV_BACKLOG: 'MASTER',
};

/** Módulo que controla a tela (telas técnicas de TI = configurações). */
export function tabModuleKey(tabId: string): SystemModuleKey | 'MASTER' | null {
  if (tabId in TAB_MODULE) return TAB_MODULE[tabId];
  return 'configuracoes';
}

/** O usuário pode abrir esta tela? */
export function canOpenTab(user: Actor, tabId: string): boolean {
  const key = tabModuleKey(tabId);
  if (key === null) return true;
  if (key === 'MASTER') return isMasterAccount(user);
  return can(user, key, 'canRead');
}

export function deniedTabMessage(tabId: string): string {
  const key = tabModuleKey(tabId);
  if (key === 'MASTER') return `"${moduleName(tabId)}" é exclusivo do Administrador Master.`;
  return `Seu perfil não tem acesso a "${moduleName(tabId)}". Peça ao Administrador Master para liberar o módulo no cadastro de usuários.`;
}

// ---------------------------------------------------------------------------------------------
// Gravação de dados
// ---------------------------------------------------------------------------------------------

type Rule = {
  /** Módulos que dão o privilégio (basta um deles). 'MASTER' = só o Master. */
  keys: SystemModuleKey[] | 'MASTER';
  label: string;
  /** Campos que mudam sozinhos (leitura, sincronização, datas) e não contam como alteração. */
  ignore?: string[];
  /** Inclusão liberada para quem só pode ler (ex.: aluno respondendo prova). */
  createNeedsRead?: boolean;
};

const SYNC_FIELDS = ['updatedAt', 'rowVersion', 'serverUpdatedAt', 'baseVersion', 'syncedAt', 'lastSyncAt'];

export const ACCESS_RULES: Record<string, Rule> = {
  students: { keys: ['secretaria'], label: 'alunos' },
  academicHistories: { keys: ['secretaria', 'documentos'], label: 'históricos escolares' },
  classes: { keys: ['turmas'], label: 'turmas' },
  subjects: { keys: ['turmas'], label: 'disciplinas' },
  courses: { keys: ['turmas'], label: 'cursos' },
  schoolUnits: { keys: ['gestaoMunicipal'], label: 'escolas', ignore: ['totalStudents', 'totalClasses', 'totalTeachers', 'syncStatus', 'lastSync'] },
  municipalSecretary: { keys: ['gestaoMunicipal'], label: 'cadastro da SEMED' },
  questions: { keys: ['questoes'], label: 'questões' },
  bnccSkills: { keys: ['questoes'], label: 'habilidades BNCC' },
  exams: { keys: ['provas'], label: 'provas' },
  submissions: { keys: ['provas'], label: 'respostas de provas', createNeedsRead: true },
  bnccAssessments: { keys: ['relatorios', 'portalProfessor', 'diarioClasse'], label: 'lançamentos de habilidades BNCC' },
  attendanceSheets: { keys: ['diarioClasse', 'portalProfessor'], label: 'frequência' },
  lessonRegistries: { keys: ['diarioClasse', 'portalProfessor'], label: 'registros de aula' },
  classGradeSheets: { keys: ['diarioClasse', 'portalProfessor'], label: 'notas' },
  teacherLessonPlans: { keys: ['portalProfessor', 'diarioClasse'], label: 'planos de aula' },
  teacherStudentNotes: { keys: ['portalProfessor', 'diarioClasse'], label: 'anotações do professor' },
  communications: {
    keys: ['comunicacao'],
    label: 'comunicados',
    ignore: ['readBy', 'reads', 'readCount', 'readReceipts', 'confirmedBy', 'views', 'viewCount', 'acknowledgedBy'],
  },
  whatsappTemplates: { keys: ['comunicacao'], label: 'modelos de WhatsApp' },
  whatsappConfig: { keys: ['comunicacao'], label: 'configuração do WhatsApp' },
  dropoutAlertConfig: { keys: ['secretaria'], label: 'critério do alerta de evasão' },
  settings: {
    keys: ['configuracoes'],
    label: 'configurações do sistema',
    ignore: ['systemVersion', 'logoUrl', 'managementLogoUrl', 'lastBackupAt', 'lastBackupDate', 'lastSync', 'lastSyncAt', 'lastUpdateCheck'],
  },
  userAccounts: {
    keys: 'MASTER',
    label: 'usuários e permissões',
    // Login e troca de senha do próprio acesso não são alteração de cadastro.
    ignore: ['password', 'lastLogin', 'lastLoginAt', 'lastAccess', 'lastActivity', 'lastSeen', 'loginAttempts', 'mustChangePassword'],
  },
  developerContact: { keys: 'MASTER', label: 'dados do desenvolvedor' },
};

function strip(value: any, ignore: string[]): any {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const out: Record<string, any> = {};
  for (const k of Object.keys(value).sort()) {
    if (ignore.includes(k) || k.startsWith('_')) continue;
    const v = value[k];
    if (v === undefined) continue;
    out[k] = v;
  }
  return out;
}

const same = (a: any, b: any, ignore: string[]) =>
  a === b || JSON.stringify(strip(a, ignore)) === JSON.stringify(strip(b, ignore));

/** Inclusões, alterações e exclusões entre duas versões de um cadastro (lista ou registro único). */
export function diffCollection(prev: any, next: any, ignore: string[] = [], strictIds?: (id: string) => boolean) {
  const ign = [...SYNC_FIELDS, ...ignore];
  const strict = [...SYNC_FIELDS];
  const out = { created: 0, edited: 0, deleted: 0 };
  if (prev === next) return out;
  if (!Array.isArray(prev) && !Array.isArray(next)) {
    if (!prev && next) out.created = 1;
    else if (prev && !next) out.deleted = 1;
    else if (!same(prev, next, ign)) out.edited = 1;
    return out;
  }
  const a = Array.isArray(prev) ? prev : [];
  const b = Array.isArray(next) ? next : [];
  const idOf = (r: any, i: number) => (r && typeof r === 'object' && r.id != null ? String(r.id) : `#${i}`);
  const before = new Map<string, any>();
  a.forEach((r, i) => before.set(idOf(r, i), r));
  const seen = new Set<string>();
  b.forEach((r, i) => {
    const id = idOf(r, i);
    seen.add(id);
    if (!before.has(id)) out.created += 1;
    else {
      const old = before.get(id);
      if (old !== r && !same(old, r, strictIds?.(id) ? strict : ign)) out.edited += 1;
    }
  });
  before.forEach((_r, id) => {
    if (!seen.has(id)) out.deleted += 1;
  });
  return out;
}

export interface PermissionDenial {
  collection: string;
  label: string;
  action: AccessAction;
  count: number;
  modules: string[];
  /** Recusa por ser registro de outra escola (e não por falta de privilégio no módulo). */
  otherSchool?: boolean;
}

/**
 * Aplica os privilégios do operador a uma gravação. Cada cadastro alterado sem privilégio volta
 * ao estado anterior (os demais cadastros da mesma gravação seguem normalmente).
 */
export function enforceDataPermissions<T extends Record<string, any>>(
  prev: T,
  next: T,
  actor: Actor
): { next: T; denied: PermissionDenial[] } {
  if (!prev || !next || prev === next || !actor || isMasterAccount(actor)) return { next, denied: [] };
  let result: T | null = null;
  const denied: PermissionDenial[] = [];

  for (const [collection, rule] of Object.entries(ACCESS_RULES)) {
    const before = (prev as any)[collection];
    const after = (next as any)[collection];
    if (before === after) continue;
    // Senha e dados de login: cada um só mexe nos próprios, nunca na conta de outra pessoa.
    const d = diffCollection(before, after, rule.ignore, collection === 'userAccounts' ? (id) => id !== String(actor.id) : undefined);
    if (!d.created && !d.edited && !d.deleted) continue;

    const checks: Array<[AccessAction, number]> = [
      ['canCreate', d.created],
      ['canEdit', d.edited],
      ['canDelete', d.deleted],
    ];
    for (const [action, count] of checks) {
      if (!count) continue;
      let allowed: boolean;
      if (rule.keys === 'MASTER') allowed = false;
      else if (action === 'canCreate' && rule.createNeedsRead) allowed = rule.keys.some((k) => can(actor, k, 'canRead'));
      else allowed = rule.keys.some((k) => can(actor, k, action));
      if (!allowed) {
        denied.push({
          collection,
          label: rule.label,
          action,
          count,
          modules: rule.keys === 'MASTER' ? ['Administrador Master'] : rule.keys.map((k) => MODULE_KEY_LABEL[k]),
        });
      }
    }
    if (denied.some((x) => x.collection === collection)) {
      result = result || ({ ...next } as T);
      (result as any)[collection] = before;
    }
  }
  // Escola de lotação: nada de outra escola é incluído, alterado ou excluído.
  const scoped = enforceSchoolScope(prev, result || next, userSchoolScope(actor));
  for (const d of scoped.denied) {
    const rule = ACCESS_RULES[d.collection];
    denied.push({ collection: d.collection, label: rule?.label || d.collection, action: 'canEdit', count: d.count, modules: [], otherSchool: true });
  }
  return { next: scoped.next, denied };
}

/** Texto do aviso mostrado quando uma gravação é recusada. */
export function describeDenials(denied: PermissionDenial[]): string {
  const outside = denied.filter((d) => d.otherSchool);
  const byModule = denied.filter((d) => !d.otherSchool);
  const outsideText = outside.length
    ? `Seu usuário está lotado em uma escola e só grava registros dela: ${outside.map((d) => d.label).join(', ')} de outra escola não foram alterados. Transferências entre escolas são feitas pela Sede.`
    : '';
  if (!byModule.length) return outsideText;
  const parts = byModule.map((d) =>
    d.modules[0] === 'Administrador Master'
      ? `${ACTION_LABEL[d.action]} ${d.label} (somente o Administrador Master)`
      : `${ACTION_LABEL[d.action]} ${d.label} (${d.modules.join(' / ')})`
  );
  const moduleText = `Seu perfil não tem permissão para ${parts.join('; ')}. Nada foi alterado nesses cadastros. Se precisar, peça ao Administrador Master para ajustar suas permissões.`;
  return outsideText ? `${moduleText} ${outsideText}` : moduleText;
}
