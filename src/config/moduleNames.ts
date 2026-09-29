/**
 * Nome oficial de cada módulo do SucessoEdu — fonte única.
 *
 * O nome que aparece no menu lateral é o mesmo em todo lugar: abas abertas, barra de
 * tarefas, título da janela, selo "Módulo:" do cabeçalho, trilha de navegação, busca
 * rápida (Ctrl+K), atalhos de teclado, menu Iniciar, tour guiado e Tira-dúvidas.
 * Para renomear um módulo, altere somente aqui.
 */

export const MODULE_NAMES = {
  MAIN_DASHBOARD: 'Visão Geral / Dashbox',
  ARCHITECTURE_DIAGRAM: 'Diagrama & Solicitações IA',
  NOTIFICATIONS: 'Central de Notificações',
  COMMUNICATION: 'Mural de Comunicados & Mensagens',
  WHATSAPP: 'WhatsApp para Pais & Equipe',
  TEACHER_PORTAL: 'Portal do Professor',
  CLASS_DIARY: 'Diário & Frequência',
  STUDENTS: 'Secretaria & Alunos',
  CLASSES: 'Turmas & Matrizes',
  DROPOUT_CENSUS: 'Censo de Evasão & Busca Ativa',
  DOCUMENTS: 'Documentos & Certificados',
  PEDAGOGICAL_DASHBOARD: 'Evolução Pedagógica',
  BNCC_SKILLS: 'Habilidades BNCC',
  ASSESSMENT_REPORT: 'Resultados Nível & Escola',
  EXAMS: 'Elaboração de Provas',
  QUESTION_BANK: 'Banco de Questões BNCC',
  MUNICIPAL_SYNC: 'Rede Municipal & Polos',
  ADMIN_TI: 'Hub de Engenharia & TI',
  OMNI_DEPLOY: 'Deploy em Nuvem & Docker',
  NEXUS_DEPLOYER: 'Gerador de Pacotes Windows',
  NEXUS_INSTALL: 'Instalador Rápido de Estação',
  NEXUS_BUILD: 'Compilador & Empacotador',
  CLEANSLATE_HUB: 'Manutenção de Banco & Cache',
  INSTALAFLOW: 'Assistente Passo a Passo',
  DATASYNC_PRO: 'Sincronização Remota (.edusync)',
  DEBUG_FLOW: 'DebugFlow & Auditoria Full-Stack',
  USER_CONTROL: 'Usuários & Permissões',
  SYSTEM_UPDATES: 'Atualizações na Nuvem',
  NETWORK_INSTALLER: 'Instaladores & Backup',
  DEV_BACKLOG: 'Plano de Desenvolvimento',
  ABOUT: 'Sobre o Sistema & Dev',
  // Telas sem item próprio no menu
  STUDENT_ROOM: 'Sala do Aluno',
} as const;

export type ModuleId = keyof typeof MODULE_NAMES;

/** Grupo do menu lateral em que o módulo aparece. */
export const MODULE_GROUPS: Record<ModuleId, string> = {
  MAIN_DASHBOARD: 'Visão Geral',
  ARCHITECTURE_DIAGRAM: 'Visão Geral',
  NOTIFICATIONS: 'Comunicação & Avisos',
  COMMUNICATION: 'Comunicação & Avisos',
  WHATSAPP: 'Comunicação & Avisos',
  TEACHER_PORTAL: 'Espaço do Docente & Gestão de Turmas',
  CLASS_DIARY: 'Espaço do Docente & Gestão de Turmas',
  STUDENTS: 'Secretaria & Ensino',
  CLASSES: 'Secretaria & Ensino',
  DROPOUT_CENSUS: 'Secretaria & Ensino',
  DOCUMENTS: 'Secretaria & Ensino',
  PEDAGOGICAL_DASHBOARD: 'Pedagógico & Avaliações',
  BNCC_SKILLS: 'Pedagógico & Avaliações',
  ASSESSMENT_REPORT: 'Pedagógico & Avaliações',
  EXAMS: 'Pedagógico & Avaliações',
  QUESTION_BANK: 'Pedagógico & Avaliações',
  STUDENT_ROOM: 'Pedagógico & Avaliações',
  MUNICIPAL_SYNC: 'Gestão Municipal & Polos',
  ADMIN_TI: 'Administração & TI',
  OMNI_DEPLOY: 'Administração & TI',
  NEXUS_DEPLOYER: 'Administração & TI',
  NEXUS_INSTALL: 'Administração & TI',
  NEXUS_BUILD: 'Administração & TI',
  CLEANSLATE_HUB: 'Administração & TI',
  INSTALAFLOW: 'Administração & TI',
  DATASYNC_PRO: 'Administração & TI',
  DEBUG_FLOW: 'Administração & TI',
  USER_CONTROL: 'Administração & TI',
  SYSTEM_UPDATES: 'Administração & TI',
  NETWORK_INSTALLER: 'Administração & TI',
  DEV_BACKLOG: 'Administração & TI',
  ABOUT: 'Administração & TI',
};

/** Outros códigos de tela que abrem o mesmo módulo. */
const ALIASES: Record<string, ModuleId> = {
  QUESTIONS: 'QUESTION_BANK',
  PROFESSOR_DASHBOARD: 'TEACHER_PORTAL',
  PROFESSOR: 'TEACHER_PORTAL',
  CENSUS: 'DROPOUT_CENSUS',
};

export function resolveModuleId(tabId: string): ModuleId | null {
  if (tabId in MODULE_NAMES) return tabId as ModuleId;
  return ALIASES[tabId] || null;
}

/** Nome oficial do módulo (igual ao menu lateral). */
export function moduleName(tabId: string, fallback?: string): string {
  const id = resolveModuleId(tabId);
  return id ? MODULE_NAMES[id] : fallback ?? tabId;
}

/** Grupo do menu lateral do módulo. */
export function moduleGroup(tabId: string, fallback = 'Sistema'): string {
  const id = resolveModuleId(tabId);
  return id ? MODULE_GROUPS[id] : fallback;
}
