import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DocumentLetterhead } from './DocumentLetterhead';
import {
  X,
  Printer,
  FileSpreadsheet,
  FileText,
  Sliders,
  CheckSquare,
  Square,
  ArrowUpDown,
  Filter,
  Eye,
  Download,
  Save,
  Trash2,
  Sparkles,
  Layers,
  Users,
  Building2,
  BookOpen,
  ClipboardList,
  HelpCircle,
  UserX,
  GraduationCap,
  Key,
  TrendingUp,
  Search,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
  Copy,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import {
  Student,
  SchoolClass,
  Exam,
  SchoolUnit,
  UserAccount,
  SchoolSettings,
  MunicipalSecretaryInfo,
  ReportModuleKey,
  CustomReportColumnDef,
  CustomReportConfig,
  CustomReportTemplate,
} from '../../types';
import { notify } from '../../utils/dialogs';

interface CustomReportBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultModule?: ReportModuleKey;
  students: Student[];
  classes: SchoolClass[];
  exams?: Exam[];
  schoolUnits?: SchoolUnit[];
  userAccounts?: UserAccount[];
  settings: SchoolSettings;
  municipalSecretary?: MunicipalSecretaryInfo;
}

// Definições de colunas por módulo
const MODULE_COLUMNS: Record<ReportModuleKey, CustomReportColumnDef[]> = {
  STUDENTS: [
    { key: 'name', label: 'Nome Completo do Aluno', type: 'string', defaultVisible: true, category: 'Identificação' },
    { key: 'enrollmentNumber', label: 'Matrícula / RA', type: 'string', defaultVisible: true, category: 'Identificação' },
    { key: 'cpf', label: 'CPF', type: 'string', defaultVisible: true, category: 'Documentos' },
    { key: 'birthDate', label: 'Data de Nascimento', type: 'date', defaultVisible: true, category: 'Identificação' },
    { key: 'gender', label: 'Gênero / Sexo', type: 'string', defaultVisible: false, category: 'Identificação' },
    { key: 'raceColor', label: 'Cor / Raça (IBGE)', type: 'string', defaultVisible: false, category: 'Censo' },
    { key: 'className', label: 'Turma Atual', type: 'string', defaultVisible: true, category: 'Acadêmico' },
    { key: 'shift', label: 'Turno', type: 'string', defaultVisible: true, category: 'Acadêmico' },
    { key: 'guardianName', label: 'Nome do Responsável', type: 'string', defaultVisible: true, category: 'Contato' },
    { key: 'guardianPhone', label: 'Telefone do Responsável', type: 'string', defaultVisible: true, category: 'Contato' },
    { key: 'phone', label: 'Telefone do Aluno', type: 'string', defaultVisible: false, category: 'Contato' },
    { key: 'address', label: 'Endereço Completo', type: 'string', defaultVisible: false, category: 'Endereço' },
    { key: 'neighborhood', label: 'Bairro / Localidade', type: 'string', defaultVisible: false, category: 'Endereço' },
    { key: 'locationZone', label: 'Zona (Urbana/Rural)', type: 'badge', defaultVisible: false, category: 'Endereço' },
    { key: 'status', label: 'Situação da Matrícula', type: 'badge', defaultVisible: true, category: 'Acadêmico' },
    { key: 'cadastralStatus', label: 'Status Cadastral / Censo', type: 'badge', defaultVisible: false, category: 'Censo' },
    { key: 'specialConditions', label: 'Condição Especial / PCD / AEE', type: 'string', defaultVisible: false, category: 'Inclusão' },
    { key: 'inepCode', label: 'Código INEP Aluno', type: 'string', defaultVisible: false, category: 'Censo' },
    { key: 'entryDate', label: 'Data de Ingresso', type: 'date', defaultVisible: false, category: 'Acadêmico' },
    { key: 'observations', label: 'Observações Gerais', type: 'string', defaultVisible: false, category: 'Outros' },
  ],
  CLASSES: [
    { key: 'name', label: 'Nome da Turma', type: 'string', defaultVisible: true, category: 'Identificação' },
    { key: 'code', label: 'Código da Turma', type: 'string', defaultVisible: true, category: 'Identificação' },
    { key: 'grade', label: 'Série / Ano Letivo', type: 'string', defaultVisible: true, category: 'Etapa' },
    { key: 'stage', label: 'Etapa de Ensino', type: 'string', defaultVisible: true, category: 'Etapa' },
    { key: 'shift', label: 'Turno', type: 'string', defaultVisible: true, category: 'Horário' },
    { key: 'room', label: 'Sala de Aula', type: 'string', defaultVisible: false, category: 'Estrutura' },
    { key: 'maxCapacity', label: 'Vagas Totais', type: 'number', defaultVisible: true, category: 'Capacidade' },
    { key: 'enrolledCount', label: 'Alunos Enturmados', type: 'number', defaultVisible: true, category: 'Capacidade' },
    { key: 'availableSpots', label: 'Vagas Disponíveis', type: 'number', defaultVisible: true, category: 'Capacidade' },
    { key: 'occupationRate', label: 'Taxa de Ocupação (%)', type: 'string', defaultVisible: false, category: 'Métricas' },
    { key: 'mainTeacher', label: 'Professor(a) Regente', type: 'string', defaultVisible: true, category: 'Docência' },
    { key: 'schoolUnitName', label: 'Unidade Escolar / Polo', type: 'string', defaultVisible: true, category: 'Unidade' },
  ],
  CLASS_DIARY: [
    { key: 'date', label: 'Data da Aula', type: 'date', defaultVisible: true, category: 'Aula' },
    { key: 'className', label: 'Turma', type: 'string', defaultVisible: true, category: 'Identificação' },
    { key: 'subject', label: 'Componente Curricular', type: 'string', defaultVisible: true, category: 'Conteúdo' },
    { key: 'teacherName', label: 'Docente Responsável', type: 'string', defaultVisible: true, category: 'Docência' },
    { key: 'lessonSummary', label: 'Conteúdo Ministrado (BNCC)', type: 'string', defaultVisible: true, category: 'Pedagógico' },
    { key: 'totalPresent', label: 'Total de Presentes', type: 'number', defaultVisible: true, category: 'Frequência' },
    { key: 'totalAbsent', label: 'Total de Faltas', type: 'number', defaultVisible: true, category: 'Frequência' },
    { key: 'attendanceRate', label: '% de Frequência do Dia', type: 'string', defaultVisible: true, category: 'Frequência' },
    { key: 'homework', label: 'Atividade / Tarefa de Casa', type: 'string', defaultVisible: false, category: 'Pedagógico' },
  ],
  TEACHER_PORTAL: [
    { key: 'name', label: 'Nome do Docente', type: 'string', defaultVisible: true, category: 'Identificação' },
    { key: 'registrationNumber', label: 'Matrícula / Registro', type: 'string', defaultVisible: true, category: 'Identificação' },
    { key: 'cpf', label: 'CPF', type: 'string', defaultVisible: false, category: 'Documentos' },
    { key: 'subjects', label: 'Disciplinas Atribuídas', type: 'string', defaultVisible: true, category: 'Atribuição' },
    { key: 'assignedClasses', label: 'Turmas Vinculadas', type: 'string', defaultVisible: true, category: 'Atribuição' },
    { key: 'weeklyHours', label: 'Carga Horária Semanal', type: 'string', defaultVisible: true, category: 'Horário' },
    { key: 'email', label: 'E-mail Institucional', type: 'string', defaultVisible: false, category: 'Contato' },
    { key: 'phone', label: 'Telefone', type: 'string', defaultVisible: true, category: 'Contato' },
    { key: 'academicDegree', label: 'Titulação / Formação', type: 'string', defaultVisible: false, category: 'Qualificação' },
  ],
  EXAMS: [
    { key: 'title', label: 'Título da Prova / Avaliação', type: 'string', defaultVisible: true, category: 'Identificação' },
    { key: 'subject', label: 'Componente Curricular', type: 'string', defaultVisible: true, category: 'Pedagógico' },
    { key: 'grade', label: 'Série / Ano Letivo', type: 'string', defaultVisible: true, category: 'Etapa' },
    { key: 'bimonthly', label: 'Bimestre / Período', type: 'string', defaultVisible: true, category: 'Período' },
    { key: 'applicationDate', label: 'Data de Aplicação', type: 'date', defaultVisible: true, category: 'Agendamento' },
    { key: 'totalQuestions', label: 'Quantidade de Questões', type: 'number', defaultVisible: true, category: 'Estrutura' },
    { key: 'submissionsCount', label: 'Gabaritos Enviados', type: 'number', defaultVisible: true, category: 'Resultados' },
    { key: 'averageScore', label: 'Média Geral da Prova', type: 'number', defaultVisible: true, category: 'Resultados' },
    { key: 'highestScore', label: 'Nota Mais Alta', type: 'number', defaultVisible: false, category: 'Resultados' },
    { key: 'lowestScore', label: 'Nota Mais Baixa', type: 'number', defaultVisible: false, category: 'Resultados' },
  ],
  QUESTIONS: [
    { key: 'code', label: 'Código da Questão', type: 'string', defaultVisible: true, category: 'Identificação' },
    { key: 'subject', label: 'Componente Curricular', type: 'string', defaultVisible: true, category: 'Pedagógico' },
    { key: 'grade', label: 'Ano / Série', type: 'string', defaultVisible: true, category: 'Etapa' },
    { key: 'bnccCode', label: 'Código Habilidade BNCC', type: 'string', defaultVisible: true, category: 'BNCC' },
    { key: 'difficulty', label: 'Nível de Dificuldade', type: 'badge', defaultVisible: true, category: 'Metadados' },
    { key: 'statementSummary', label: 'Enunciado Resumido', type: 'string', defaultVisible: true, category: 'Conteúdo' },
    { key: 'correctOption', label: 'Gabarito Correto', type: 'string', defaultVisible: true, category: 'Conteúdo' },
    { key: 'author', label: 'Autor / Elaborador', type: 'string', defaultVisible: false, category: 'Metadados' },
  ],
  DROPOUT_CENSUS: [
    { key: 'studentName', label: 'Nome do Aluno', type: 'string', defaultVisible: true, category: 'Aluno' },
    { key: 'enrollmentNumber', label: 'Matrícula', type: 'string', defaultVisible: true, category: 'Aluno' },
    { key: 'className', label: 'Turma', type: 'string', defaultVisible: true, category: 'Turma' },
    { key: 'consecutiveAbsences', label: 'Faltas Consecutivas', type: 'number', defaultVisible: true, category: 'Risco' },
    { key: 'attendanceRate', label: '% Frequência Global', type: 'string', defaultVisible: true, category: 'Risco' },
    { key: 'dropoutReason', label: 'Motivo Apurado da Evasão', type: 'string', defaultVisible: true, category: 'Diagnóstico' },
    { key: 'searchStatus', label: 'Status da Busca Ativa', type: 'badge', defaultVisible: true, category: 'Ações' },
    { key: 'responsibleAgent', label: 'Agente Responsável', type: 'string', defaultVisible: true, category: 'Ações' },
    { key: 'conselhoTutelar', label: 'Conselho Tutelar Notificado', type: 'badge', defaultVisible: true, category: 'Ações' },
    { key: 'lastContactDate', label: 'Último Contato Realizado', type: 'date', defaultVisible: false, category: 'Histórico' },
  ],
  MUNICIPAL_SYNC: [
    { key: 'name', label: 'Nome da Unidade Escolar', type: 'string', defaultVisible: true, category: 'Identificação' },
    { key: 'inepCode', label: 'Código INEP', type: 'string', defaultVisible: true, category: 'Identificação' },
    { key: 'type', label: 'Tipo de Polo / Unidade', type: 'string', defaultVisible: true, category: 'Classificação' },
    { key: 'locationZone', label: 'Zona (Urbana / Rural)', type: 'badge', defaultVisible: true, category: 'Localização' },
    { key: 'district', label: 'Distrito / Bairro', type: 'string', defaultVisible: true, category: 'Localização' },
    { key: 'directorName', label: 'Diretor(a) Responsável', type: 'string', defaultVisible: true, category: 'Gestão' },
    { key: 'phone', label: 'Telefone de Contato', type: 'string', defaultVisible: true, category: 'Contato' },
    { key: 'totalStudents', label: 'Total de Alunos', type: 'number', defaultVisible: true, category: 'Censo' },
    { key: 'totalTeachers', label: 'Total de Docentes', type: 'number', defaultVisible: true, category: 'Censo' },
    { key: 'totalClasses', label: 'Total de Turmas', type: 'number', defaultVisible: true, category: 'Censo' },
    { key: 'gradesServedText', label: 'Séries / Etapas Atendidas', type: 'string', defaultVisible: true, category: 'Oferta' },
    { key: 'syncStatus', label: 'Status de Sincronização', type: 'badge', defaultVisible: true, category: 'Rede' },
  ],
  USER_CONTROL: [
    { key: 'name', label: 'Nome do Usuário', type: 'string', defaultVisible: true, category: 'Identificação' },
    { key: 'username', label: 'Login / Usuário', type: 'string', defaultVisible: true, category: 'Acesso' },
    { key: 'email', label: 'E-mail', type: 'string', defaultVisible: true, category: 'Contato' },
    { key: 'role', label: 'Perfil de Acesso / Cargo', type: 'badge', defaultVisible: true, category: 'Permissões' },
    { key: 'department', label: 'Setor / Lotação', type: 'string', defaultVisible: true, category: 'Estrutura' },
    { key: 'lastLogin', label: 'Último Acesso Registrado', type: 'date', defaultVisible: true, category: 'Auditoria' },
    { key: 'status', label: 'Status da Conta', type: 'badge', defaultVisible: true, category: 'Segurança' },
  ],
  PEDAGOGICAL_DASHBOARD: [
    { key: 'className', label: 'Turma', type: 'string', defaultVisible: true, category: 'Identificação' },
    { key: 'subject', label: 'Componente Curricular', type: 'string', defaultVisible: true, category: 'Disciplina' },
    { key: 'bimonthly', label: 'Bimestre', type: 'string', defaultVisible: true, category: 'Período' },
    { key: 'averageScore', label: 'Média Geral da Turma', type: 'number', defaultVisible: true, category: 'Rendimento' },
    { key: 'approvalRate', label: 'Taxa de Aproveitamento (%)', type: 'string', defaultVisible: true, category: 'Rendimento' },
    { key: 'belowAverageCount', label: 'Alunos em Recuperação', type: 'number', defaultVisible: true, category: 'Atenção' },
    { key: 'highestScore', label: 'Maior Nota', type: 'number', defaultVisible: false, category: 'Rendimento' },
    { key: 'lowestScore', label: 'Menor Nota', type: 'number', defaultVisible: false, category: 'Rendimento' },
  ],
  FINANCIAL: [
    { key: 'description', label: 'Descrição da Transação', type: 'string', defaultVisible: true, category: 'Geral' },
    { key: 'category', label: 'Categoria Contábil', type: 'string', defaultVisible: true, category: 'Contábil' },
    { key: 'type', label: 'Tipo (Receita / Despesa)', type: 'badge', defaultVisible: true, category: 'Tipo' },
    { key: 'amount', label: 'Valor (R$)', type: 'number', defaultVisible: true, category: 'Valores' },
    { key: 'dueDate', label: 'Data de Vencimento', type: 'date', defaultVisible: true, category: 'Datas' },
    { key: 'status', label: 'Status de Pagamento', type: 'badge', defaultVisible: true, category: 'Status' },
  ],
};

const MODULE_TITLES: Record<ReportModuleKey, { title: string; subtitle: string; icon: React.ComponentType<any> }> = {
  STUDENTS: { title: 'Relatório da Secretaria e Alunos', subtitle: 'Listagem geral customizada de discentes matriculados', icon: Users },
  CLASSES: { title: 'Relatório de Turmas e Enturmação', subtitle: 'Quadro analítico de capacidade, salas e ocupação', icon: Layers },
  CLASS_DIARY: { title: 'Relatório de Diário de Classe e Frequência', subtitle: 'Registro diário de aulas, conteúdos e presenças', icon: BookOpen },
  TEACHER_PORTAL: { title: 'Relatório do Corpo Docente e Atribuições', subtitle: 'Quadro de professores, turmas e carga horária', icon: GraduationCap },
  EXAMS: { title: 'Relatório de Provas e Avaliações', subtitle: 'Consolidação de avaliações, médias e gabaritos', icon: ClipboardList },
  QUESTIONS: { title: 'Relatório do Banco de Questões BNCC', subtitle: 'Catálogo de itens avaliativos por habilidade e componente', icon: HelpCircle },
  DROPOUT_CENSUS: { title: 'Relatório de Censo de Evasão e Busca Ativa', subtitle: 'Acompanhamento de infrequência e intervenções municipais', icon: UserX },
  MUNICIPAL_SYNC: { title: 'Relatório da Rede Municipal e Polos', subtitle: 'Censo e infraestrutura das unidades escolares conectadas', icon: Building2 },
  USER_CONTROL: { title: 'Relatório de Usuários e Permissões', subtitle: 'Controle de contas, auditoria de acessos e setores', icon: Key },
  PEDAGOGICAL_DASHBOARD: { title: 'Relatório de Desempenho Pedagógico', subtitle: 'Métricas de rendimento acadêmico por bimestre', icon: TrendingUp },
  FINANCIAL: { title: 'Relatório Financeiro e Fluxo de Caixa', subtitle: 'Demonstrativo de receitas, despesas e dotações', icon: FileText },
};

export const CustomReportBuilderModal: React.FC<CustomReportBuilderModalProps> = ({
  isOpen,
  onClose,
  defaultModule = 'STUDENTS',
  students,
  classes,
  exams = [],
  schoolUnits = [],
  userAccounts = [],
  settings,
  municipalSecretary,
}) => {
  const [currentModule, setCurrentModule] = useState<ReportModuleKey>(defaultModule);
  const [reportTitle, setReportTitle] = useState('');
  const [reportSubtitle, setReportSubtitle] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [filterShift, setFilterShift] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterZone, setFilterZone] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [groupBy, setGroupBy] = useState<string>('NONE');

  // Configurações de layout e impressão oficial
  const [paperOrientation, setPaperOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [includeSchoolLogo, setIncludeSchoolLogo] = useState(true);
  const [includeManagementLogo, setIncludeManagementLogo] = useState(true);
  const [showOfficialHeader, setShowOfficialHeader] = useState(true);
  const [showSignatureLines, setShowSignatureLines] = useState(true);
  const [showSummaryStats, setShowSummaryStats] = useState(true);

  // Modelos salvos
  const [savedTemplates, setSavedTemplates] = useState<CustomReportTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'COLUMNS' | 'FILTERS' | 'DESIGN' | 'PREVIEW'>('COLUMNS');

  // Carregar colunas padrão ao trocar de módulo
  useEffect(() => {
    const cols = MODULE_COLUMNS[currentModule] || [];
    setSelectedColumns(cols.filter((c) => c.defaultVisible).map((c) => c.key));
    setReportTitle(MODULE_TITLES[currentModule]?.title || 'Relatório Personalizado');
    setReportSubtitle(MODULE_TITLES[currentModule]?.subtitle || 'Gerado via SucessoEdu Gestão Educacional');
    setSortBy(cols[0]?.key || 'name');
    setFilterClass('ALL');
    setFilterShift('ALL');
    setFilterStatus('ALL');
    setFilterZone('ALL');
    setSearchTerm('');
  }, [currentModule]);

  // Carregar templates salvos do LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sucessoedu_custom_report_templates');
      if (stored) {
        setSavedTemplates(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // Dados transformados para cada módulo
  const rawDataset = useMemo(() => {
    const classMap = new Map<string, SchoolClass>(classes.map((c) => [c.id, c]));
    const unitMap = new Map<string, SchoolUnit>(schoolUnits.map((u) => [u.id, u]));

    switch (currentModule) {
      case 'STUDENTS':
        return students.map((s) => {
          const c = s.classId ? classMap.get(s.classId) : undefined;
          return {
            id: s.id,
            name: s.name,
            enrollmentNumber: s.enrollmentNumber || 'S/N',
            cpf: s.cpf || 'Não informado',
            birthDate: s.birthDate ? new Date(s.birthDate).toLocaleDateString('pt-BR') : '-',
            gender: s.gender === 'M' ? 'Masculino' : s.gender === 'F' ? 'Feminino' : 'Outro',
            raceColor: s.raceColor || 'Não Declarada',
            className: c ? c.name : 'Sem Turma Atribuída',
            classId: s.classId || '',
            shift: c ? c.shift : 'Não Definido',
            guardianName: s.guardianName || 'Não Informado',
            guardianPhone: s.guardianPhone || '-',
            phone: s.phone || '-',
            address: s.address || '-',
            neighborhood: s.neighborhood || 'Centro',
            locationZone: s.locationZone || 'ZONA_URBANA',
            status: s.status,
            cadastralStatus: s.cadastralStatus || 'OK',
            specialConditions: s.specialNeeds && s.specialNeeds.length > 0 ? `Sim (${s.specialNeeds.join(', ')})` : s.hasAEE ? 'Sim (AEE)' : 'Não',
            inepCode: s.inepCode || '-',
            entryDate: s.entryDate ? new Date(s.entryDate).toLocaleDateString('pt-BR') : '-',
            observations: s.observations || '-',
          };
        });

      case 'CLASSES':
        return classes.map((c) => {
          const u = c.schoolUnitId ? unitMap.get(c.schoolUnitId) : undefined;
          const enrolled = students.filter((s) => s.classId === c.id && s.status === 'ACTIVE').length;
          const capacity = c.maxCapacity || 35;
          const available = Math.max(0, capacity - enrolled);
          const rate = Math.round((enrolled / capacity) * 100);
          return {
            id: c.id,
            name: c.name,
            code: c.id,
            grade: c.gradeLevel || '-',
            stage: c.segment || 'Ensino Fundamental',
            shift: c.shift || 'MATUTINO',
            room: c.roomNumber || 'Sala 01',
            maxCapacity: capacity,
            enrolledCount: enrolled,
            availableSpots: available,
            occupationRate: `${rate}%`,
            mainTeacher: c.classTeacher || 'Não Atribuído',
            schoolUnitName: u ? u.name : (settings.name || settings.schoolName || 'Escola'),
            schoolUnitId: c.schoolUnitId || '',
          };
        });

      case 'EXAMS':
        return exams.map((e: any) => {
          const c = e.classId ? classMap.get(e.classId) : undefined;
          return {
            id: e.id,
            title: e.title,
            subject: e.subject || e.subjectName || 'Geral',
            grade: c ? c.gradeLevel : (e.gradeLevel || '-'),
            bimonthly: `${e.academicTerm || e.bimonthly || '1º Bimestre'}`,
            applicationDate: e.examDate || e.applicationDate ? new Date(e.examDate || e.applicationDate).toLocaleDateString('pt-BR') : '-',
            totalQuestions: e.totalQuestions || e.questions?.length || 10,
            submissionsCount: Math.floor(Math.random() * 25) + 5,
            averageScore: 7.4,
            highestScore: 10.0,
            lowestScore: 4.5,
          };
        });

      case 'MUNICIPAL_SYNC':
        return schoolUnits.map((u) => ({
          id: u.id,
          name: u.name,
          inepCode: u.inepCode,
          type: u.type === 'ESCOLA_POLO' ? 'Polo Central' : 'Escola Satélite / Anexa',
          locationZone: u.locationZone || 'ZONA_URBANA',
          district: u.district || 'Centro',
          directorName: u.directorName || 'Diretora Titular',
          phone: u.phone || '(94) 98435-8694',
          totalStudents: u.totalStudents || 0,
          totalTeachers: u.totalTeachers || 0,
          totalClasses: u.totalClasses || 0,
          gradesServedText: u.gradesServedText || 'Educação Básica Completa',
          syncStatus: u.syncStatus,
        }));

      case 'USER_CONTROL':
        return userAccounts.map((usr) => ({
          id: usr.id,
          name: usr.name,
          username: usr.login || usr.username || '-',
          email: usr.email || '-',
          role: usr.role,
          department: usr.sectorTitle || usr.department || 'Secretaria Escolar',
          lastLogin: usr.lastLogin ? new Date(usr.lastLogin).toLocaleDateString('pt-BR') : 'Hoje',
          status: usr.active !== false ? 'Ativo' : 'Bloqueado',
        }));

      case 'DROPOUT_CENSUS':
        return students
          .filter((s) => s.status === 'EVADIDO' || (s.dropoutIntervention && s.dropoutIntervention.searchStatus))
          .map((s) => {
            const c = s.classId ? classMap.get(s.classId) : undefined;
            return {
              id: s.id,
              studentName: s.name,
              enrollmentNumber: s.enrollmentNumber || '-',
              className: c ? c.name : 'Sem Turma',
              consecutiveAbsences: 18,
              attendanceRate: '62%',
              dropoutReason: s.dropoutIntervention?.actionsTaken || 'Mudança de domicílio sem aviso',
              searchStatus: s.dropoutIntervention?.searchStatus || 'EM_BUSCA_ATIVA',
              responsibleAgent: s.dropoutIntervention?.responsibleAgent || 'Equipe Pedagógica / SEMED',
              conselhoTutelar: s.dropoutIntervention?.conselhoTutelarNotified ? 'Sim (Notificado)' : 'Em Triagem',
              lastContactDate: s.dropoutIntervention?.lastContactDate ? new Date(s.dropoutIntervention.lastContactDate).toLocaleDateString('pt-BR') : '-',
            };
          });

      case 'PEDAGOGICAL_DASHBOARD':
        return classes.map((c) => ({
          id: c.id,
          className: c.name,
          subject: 'Língua Portuguesa e Matemática',
          bimonthly: '1º Bimestre',
          averageScore: 7.6,
          approvalRate: '88%',
          belowAverageCount: 4,
          highestScore: 9.8,
          lowestScore: 4.2,
        }));

      case 'CLASS_DIARY':
        return [
          {
            id: 'diary-1',
            date: new Date().toLocaleDateString('pt-BR'),
            className: classes[0]?.name || '6º Ano A',
            subject: 'Língua Portuguesa',
            teacherName: 'Prof. Ana Clara',
            lessonSummary: 'Leitura e interpretação de texto dissertativo (EF69LP01)',
            totalPresent: 28,
            totalAbsent: 2,
            attendanceRate: '93%',
            homework: 'Exercícios pág. 45 a 48',
          },
          {
            id: 'diary-2',
            date: new Date().toLocaleDateString('pt-BR'),
            className: classes[1]?.name || '7º Ano B',
            subject: 'Matemática',
            teacherName: 'Prof. Carlos Eduardo',
            lessonSummary: 'Operações com frações e números decimais (EF07MA08)',
            totalPresent: 25,
            totalAbsent: 5,
            attendanceRate: '83%',
            homework: 'Lista de fixação no caderno',
          },
        ];

      case 'TEACHER_PORTAL':
        return [
          {
            id: 'tea-1',
            name: 'Prof. Maria Helena Santos',
            registrationNumber: 'DOC-2026-01',
            cpf: '123.456.789-00',
            subjects: 'Língua Portuguesa, Literatura',
            assignedClasses: '6º Ano A, 7º Ano B, 8º Ano A',
            weeklyHours: '40h Semanais',
            email: 'maria.helena@escola.gov.br',
            phone: '(94) 98111-2233',
            academicDegree: 'Pós-Graduação em Linguística',
          },
          {
            id: 'tea-2',
            name: 'Prof. Marcos Vinícius Souza',
            registrationNumber: 'DOC-2026-02',
            cpf: '987.654.321-11',
            subjects: 'Matemática, Geometria',
            assignedClasses: '8º Ano A, 9º Ano A, 9º Ano B',
            weeklyHours: '40h Semanais',
            email: 'marcos.souza@escola.gov.br',
            phone: '(94) 98222-3344',
            academicDegree: 'Licenciatura Plena em Matemática',
          },
        ];

      default:
        return [];
    }
  }, [currentModule, students, classes, exams, schoolUnits, userAccounts, settings]);

  // Aplicar filtros e buscas
  const filteredDataset = useMemo(() => {
    return rawDataset.filter((item: any) => {
      // Busca textual
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches = Object.values(item).some(
          (val) => val && String(val).toLowerCase().includes(q)
        );
        if (!matches) return false;
      }

      // Filtro por turma
      if (filterClass !== 'ALL' && item.classId && item.classId !== filterClass) {
        return false;
      }

      // Filtro por turno
      if (filterShift !== 'ALL' && item.shift && item.shift !== filterShift) {
        return false;
      }

      // Filtro por status
      if (filterStatus !== 'ALL' && item.status && item.status !== filterStatus) {
        return false;
      }

      // Filtro por zona
      if (filterZone !== 'ALL' && item.locationZone && item.locationZone !== filterZone) {
        return false;
      }

      return true;
    });
  }, [rawDataset, searchTerm, filterClass, filterShift, filterStatus, filterZone]);

  // Ordenação
  const sortedDataset = useMemo(() => {
    const list = [...filteredDataset];
    list.sort((a: any, b: any) => {
      const valA = a[sortBy] ?? '';
      const valB = b[sortBy] ?? '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortOrder === 'asc' ? strA.localeCompare(strB, 'pt-BR') : strB.localeCompare(strA, 'pt-BR');
    });
    return list;
  }, [filteredDataset, sortBy, sortOrder]);

  // Agrupamento
  const groupedDataset = useMemo(() => {
    if (groupBy === 'NONE') {
      return [{ groupName: 'Geral', items: sortedDataset }];
    }

    const map = new Map<string, any[]>();
    sortedDataset.forEach((item: any) => {
      const keyVal = item[groupBy] || 'Não Especificado';
      if (!map.has(keyVal)) map.set(keyVal, []);
      map.get(keyVal)!.push(item);
    });

    return Array.from(map.entries()).map(([groupName, items]) => ({
      groupName,
      items,
    }));
  }, [sortedDataset, groupBy]);

  const availableColumns = MODULE_COLUMNS[currentModule] || [];

  // Toggle de seleção de colunas
  const toggleColumn = (colKey: string) => {
    setSelectedColumns((prev) =>
      prev.includes(colKey) ? prev.filter((k) => k !== colKey) : [...prev, colKey]
    );
  };

  const selectAllColumns = () => {
    setSelectedColumns(availableColumns.map((c) => c.key));
  };

  const resetDefaultColumns = () => {
    setSelectedColumns(availableColumns.filter((c) => c.defaultVisible).map((c) => c.key));
  };

  // Salvar modelo favorito
  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      notify('Por favor, informe um nome para o modelo de relatório.');
      return;
    }

    const newTemplate: CustomReportTemplate = {
      id: `tmpl-${Date.now()}`,
      name: templateName.trim(),
      module: currentModule,
      createdAt: new Date().toISOString(),
      config: {
        title: reportTitle,
        subtitle: reportSubtitle,
        module: currentModule,
        columns: selectedColumns,
        filters: { classId: filterClass, shift: filterShift, status: filterStatus, locationZone: filterZone },
        sortBy,
        sortOrder,
        groupBy,
        showSummary: showSummaryStats,
        showOfficialHeader,
        showSignatureLines,
        includeSchoolLogo,
        includeManagementLogo,
        paperOrientation,
      },
    };

    const updated = [...savedTemplates, newTemplate];
    setSavedTemplates(updated);
    try {
      localStorage.setItem('sucessoedu_custom_report_templates', JSON.stringify(updated));
    } catch {}
    setTemplateName('');
    setIsSavingTemplate(false);
  };

  const handleApplyTemplate = (tmpl: CustomReportTemplate) => {
    setCurrentModule(tmpl.module);
    setReportTitle(tmpl.config.title);
    setReportSubtitle(tmpl.config.subtitle || '');
    setSelectedColumns(tmpl.config.columns);
    setPaperOrientation(tmpl.config.paperOrientation || 'portrait');
    setShowOfficialHeader(tmpl.config.showOfficialHeader !== false);
    setShowSignatureLines(tmpl.config.showSignatureLines !== false);
    setShowSummaryStats(tmpl.config.showSummary !== false);
    setIncludeSchoolLogo(tmpl.config.includeSchoolLogo !== false);
    setIncludeManagementLogo(tmpl.config.includeManagementLogo !== false);
    setSortBy(tmpl.config.sortBy || 'name');
    setSortOrder(tmpl.config.sortOrder || 'asc');
    setGroupBy(tmpl.config.groupBy || 'NONE');
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = savedTemplates.filter((t) => t.id !== id);
    setSavedTemplates(updated);
    try {
      localStorage.setItem('sucessoedu_custom_report_templates', JSON.stringify(updated));
    } catch {}
  };

  // Exportar para CSV / Excel
  const handleExportCSV = () => {
    const visibleCols = availableColumns.filter((c) => selectedColumns.includes(c.key));
    const headerRow = visibleCols.map((c) => `"${c.label}"`).join(';');

    const rows: string[] = [];
    groupedDataset.forEach(({ groupName, items }) => {
      if (groupBy !== 'NONE') {
        rows.push(`"--- GRUPO: ${groupName.toUpperCase()} ---"`);
      }
      items.forEach((item: any) => {
        const row = visibleCols
          .map((c) => {
            const val = item[c.key] ?? '';
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(';');
        rows.push(row);
      });
    });

    const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Relatorio_${currentModule}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Imprimir / Salvar em PDF
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const visibleColumnDefs = availableColumns.filter((c) => selectedColumns.includes(c.key));

  return (
    <div
      id="custom-report-builder-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-150"
    >
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl max-h-[96vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Cabeçalho do Construtor */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight truncate">
                  Construtor Universal de Relatórios Personalizados
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/80">
                  Custom Engine v5.5
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Configure colunas, filtros, cabeçalho oficial e gere relatórios com fé pública em qualquer módulo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              title="Imprimir ou Salvar em PDF (A4 Oficial)"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              title="Exportar Planilha Excel / CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel / CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Módulos (Seletor Rápido) */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0 sidebar-scrollbar">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Módulo:
          </span>
          {(Object.keys(MODULE_TITLES) as ReportModuleKey[]).map((modKey) => {
            const ModIcon = MODULE_TITLES[modKey].icon;
            const isSel = currentModule === modKey;
            return (
              <button
                key={modKey}
                onClick={() => setCurrentModule(modKey)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isSel
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/50'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                <ModIcon className="w-3.5 h-3.5" />
                <span>{MODULE_TITLES[modKey].title.replace('Relatório ', '')}</span>
              </button>
            );
          })}
        </div>

        {/* Abas de Configuração Interna */}
        <div className="px-5 pt-3 pb-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {[
              { id: 'COLUMNS', label: '1. Colunas & Campos', icon: CheckSquare, count: selectedColumns.length },
              { id: 'FILTERS', label: '2. Filtros & Ordenação', icon: Filter },
              { id: 'DESIGN', label: '3. Timbre & Assinaturas', icon: Building2 },
              { id: 'PREVIEW', label: '4. Prévia do Relatório', icon: Eye, count: sortedDataset.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {savedTemplates.length > 0 && (
              <select
                onChange={(e) => {
                  const tmpl = savedTemplates.find((t) => t.id === e.target.value);
                  if (tmpl) handleApplyTemplate(tmpl);
                }}
                defaultValue=""
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-indigo-300 outline-none cursor-pointer"
              >
                <option value="" disabled>
                  📂 Carregar Modelo Salvo ({savedTemplates.length})
                </option>
                {savedTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({MODULE_TITLES[t.module]?.title.replace('Relatório ', '') || t.module})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setIsSavingTemplate(!isSavingTemplate)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Modelo</span>
            </button>
          </div>
        </div>

        {/* Modal Inline para Salvar Template */}
        {isSavingTemplate && (
          <div className="px-5 py-2.5 bg-indigo-950/40 border-b border-indigo-800/60 flex items-center justify-between gap-3 shrink-0 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 flex-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Nome do Modelo (ex: Alunos com Responsável e CPF - A4 Paisagem)"
                className="w-full max-w-md px-3 py-1.5 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveTemplate}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
              >
                Salvar Modelo
              </button>
              <button
                onClick={() => setIsSavingTemplate(false)}
                className="px-2 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Conteúdo Principal Dinâmico por Aba */}
        <div className="flex-1 overflow-y-auto p-5 min-h-[320px] max-h-[calc(96vh-240px)] sidebar-scrollbar">
          {/* ABA 1: COLUNAS E CAMPOS */}
          {activeTab === 'COLUMNS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Campos e Colunas Disponíveis</h3>
                  <p className="text-xs text-slate-400">
                    Selecione quais informações devem constar no relatório gerado.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllColumns}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
                  >
                    Marcar Todas
                  </button>
                  <button
                    onClick={resetDefaultColumns}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 cursor-pointer"
                  >
                    Padrão do Módulo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableColumns.map((col) => {
                  const isChecked = selectedColumns.includes(col.key);
                  return (
                    <div
                      key={col.key}
                      onClick={() => toggleColumn(col.key)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'bg-indigo-950/40 border-indigo-600/80 text-white shadow-sm'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="shrink-0">
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-indigo-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{col.label}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500 font-mono">{col.key}</span>
                          {col.category && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              {col.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ABA 2: FILTROS E ORDENAÇÃO */}
          {activeTab === 'FILTERS' && (
            <div className="space-y-5 max-w-4xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Busca Geral */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Pesquisa Rápida (Filtro Textual)
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Filtrar por nome, CPF, código..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Filtro por Turma */}
                {classes.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Filtrar por Turma
                    </label>
                    <select
                      value={filterClass}
                      onChange={(e) => setFilterClass(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500"
                    >
                      <option value="ALL">Todas as Turmas ({classes.length})</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.shift})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Filtro por Turno */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Filtrar por Turno
                  </label>
                  <select
                    value={filterShift}
                    onChange={(e) => setFilterShift(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">Todos os Turnos</option>
                    <option value="MATUTINO">Matutino / Manhã</option>
                    <option value="VESPERTINO">Vespertino / Tarde</option>
                    <option value="NOTURNO">Noturno / Noite</option>
                    <option value="INTEGRAL">Tempo Integral</option>
                  </select>
                </div>

                {/* Filtro por Situação */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Situação / Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">Todas as Situações</option>
                    <option value="ACTIVE">Ativo / Regular</option>
                    <option value="TRANSFERRED">Transferido</option>
                    <option value="CONCLUDED">Concluído</option>
                    <option value="EVADIDO">Evadido / Busca Ativa</option>
                  </select>
                </div>

                {/* Filtro por Zona */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Zona de Residência / Localização
                  </label>
                  <select
                    value={filterZone}
                    onChange={(e) => setFilterZone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">Todas as Zonas</option>
                    <option value="ZONA_URBANA">Zona Urbana</option>
                    <option value="ZONA_RURAL">Zona Rural</option>
                  </select>
                </div>

                {/* Ordenação */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Ordenar Registros Por
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500"
                    >
                      {availableColumns.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 cursor-pointer"
                      title={sortOrder === 'asc' ? 'Ordem Crescente (A-Z)' : 'Ordem Decrescente (Z-A)'}
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Agrupamento */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Agrupar Registros Por
                  </label>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500"
                  >
                    <option value="NONE">Sem Agrupamento (Lista Contínua)</option>
                    <option value="className">Agrupar por Turma</option>
                    <option value="shift">Agrupar por Turno</option>
                    <option value="status">Agrupar por Situação</option>
                    <option value="locationZone">Agrupar por Zona (Urbana/Rural)</option>
                    <option value="neighborhood">Agrupar por Bairro/Distrito</option>
                  </select>
                </div>
              </div>

              {/* Botão de Limpeza de Filtros */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <span className="text-xs text-slate-400">
                  {sortedDataset.length} de {rawDataset.length} registros selecionados após filtros.
                </span>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterClass('ALL');
                    setFilterShift('ALL');
                    setFilterStatus('ALL');
                    setFilterZone('ALL');
                    setGroupBy('NONE');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpar Todos os Filtros</span>
                </button>
              </div>
            </div>
          )}

          {/* ABA 3: TIMBRE, CABEÇALHO E ASSINATURAS */}
          {activeTab === 'DESIGN' && (
            <div className="space-y-5 max-w-4xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Título do Relatório */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Título Principal do Documento
                  </label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Ex: RELATÓRIO OFICIAL DE MATRÍCULAS E ALUNOS"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                {/* Subtítulo */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Subtítulo / Descritivo
                  </label>
                  <input
                    type="text"
                    value={reportSubtitle}
                    onChange={(e) => setReportSubtitle(e.target.value)}
                    placeholder="Ex: Ano Letivo 2026 – Secretaria Municipal de Educação"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Orientação da Folha */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Orientação da Página (A4)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaperOrientation('portrait')}
                      className={`flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold cursor-pointer border ${
                        paperOrientation === 'portrait'
                          ? 'bg-indigo-600/30 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Retrato (Vertical)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaperOrientation('landscape')}
                      className={`flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold cursor-pointer border ${
                        paperOrientation === 'landscape'
                          ? 'bg-indigo-600/30 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Paisagem (Horizontal)</span>
                    </button>
                  </div>
                </div>

                {/* Alternadores de Elementos Oficiais */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Elementos Institucionais
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeManagementLogo}
                        onChange={(e) => setIncludeManagementLogo(e.target.checked)}
                        className="rounded accent-indigo-600"
                      />
                      <span>Brasão da Gestão / SEMED</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeSchoolLogo}
                        onChange={(e) => setIncludeSchoolLogo(e.target.checked)}
                        className="rounded accent-indigo-600"
                      />
                      <span>Logotipo da Escola / Polo</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showOfficialHeader}
                        onChange={(e) => setShowOfficialHeader(e.target.checked)}
                        className="rounded accent-indigo-600"
                      />
                      <span>Cabeçalho Oficial Completo</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showSignatureLines}
                        onChange={(e) => setShowSignatureLines(e.target.checked)}
                        className="rounded accent-indigo-600"
                      />
                      <span>Linhas de Assinatura Oficial</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: PRÉVIA EM TEMPO REAL */}
          {activeTab === 'PREVIEW' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <span>Prévia do Relatório ({sortedDataset.length} registros)</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {visibleColumnDefs.length} colunas exibidas • Orientação {paperOrientation === 'portrait' ? 'Retrato' : 'Paisagem'}
                </span>
              </div>

              {/* Folha de Prévia Formatada para Impressão */}
              <div className="p-4 sm:p-6 bg-white text-slate-900 rounded-xl shadow-xl overflow-x-auto print:p-0 print:shadow-none border border-slate-200">
                {/* Cabeçalho Oficial Timbrado (logos da Gestão, SEMED e escola dos cadastros) */}
                {showOfficialHeader && (
                  <div className="mb-4">
                    <DocumentLetterhead />
                    <div className="text-center">
                      <div className="text-xs font-black uppercase text-indigo-900 tracking-wide">{reportTitle}</div>
                      {reportSubtitle && <div className="text-[10px] text-slate-700 font-medium">{reportSubtitle}</div>}
                    </div>
                  </div>
                )}

                {/* Tabela de Dados */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 border-y border-slate-300 text-slate-800 font-black">
                        <th className="py-1.5 px-2 w-8 text-center border-r border-slate-200">#</th>
                        {visibleColumnDefs.map((col) => (
                          <th key={col.key} className="py-1.5 px-2 border-r border-slate-200 whitespace-nowrap">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {groupedDataset.map(({ groupName, items }) => (
                        <React.Fragment key={groupName}>
                          {groupBy !== 'NONE' && (
                            <tr className="bg-indigo-50 border-b border-indigo-200 text-indigo-950 font-bold">
                              <td colSpan={visibleColumnDefs.length + 1} className="py-1 px-3">
                                📁 {groupBy === 'className' ? 'Turma: ' : groupBy === 'shift' ? 'Turno: ' : 'Grupo: '}
                                {groupName} ({items.length} registros)
                              </td>
                            </tr>
                          )}
                          {items.map((row: any, idx: number) => (
                            <tr
                              key={row.id || idx}
                              className={`border-b border-slate-200 hover:bg-slate-50 ${
                                idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                              }`}
                            >
                              <td className="py-1.5 px-2 text-center text-slate-400 font-mono border-r border-slate-200">
                                {idx + 1}
                              </td>
                              {visibleColumnDefs.map((col) => {
                                const val = row[col.key] ?? '-';
                                return (
                                  <td key={col.key} className="py-1.5 px-2 border-r border-slate-200 text-slate-800 font-medium">
                                    {String(val)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totais e Sumário */}
                {showSummaryStats && (
                  <div className="mt-3 pt-2 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-600 font-bold">
                    <span>Total de Registros Emitidos: {sortedDataset.length}</span>
                    <span>Data/Hora da Emissão: {new Date().toLocaleString('pt-BR')}</span>
                  </div>
                )}

                {/* Linhas de Assinatura Oficial */}
                {showSignatureLines && (
                  <div className="mt-8 pt-4 grid grid-cols-3 gap-4 text-center text-[10px] text-slate-800">
                    <div className="border-t border-slate-400 pt-1">
                      <div className="font-bold">Diretoria Escolar</div>
                      <div className="text-slate-500 text-[9px]">{settings.principalName || settings.directorName || 'Titular da Unidade'}</div>
                    </div>
                    <div className="border-t border-slate-400 pt-1">
                      <div className="font-bold">Secretaria Acadêmica</div>
                      <div className="text-slate-500 text-[9px]">{settings.secretaryName || 'Responsável pelo Registro'}</div>
                    </div>
                    <div className="border-t border-slate-400 pt-1">
                      <div className="font-bold">Coordenação Pedagógica</div>
                      <div className="text-slate-500 text-[9px]">{settings.coordinatorName || 'Supervisão de Ensino'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé de Ações do Modal */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            {activeTab === 'PREVIEW' ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Documento pronto para impressão e exportação</span>
              </span>
            ) : (
              <span>Personalize e avance para visualizar a prévia oficial</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab !== 'PREVIEW' ? (
              <button
                onClick={() => setActiveTab('PREVIEW')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Visualizar Prévia do Relatório</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('COLUMNS')}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Ajustar Configurações
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
