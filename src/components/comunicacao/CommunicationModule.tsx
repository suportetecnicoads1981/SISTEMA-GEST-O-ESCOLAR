import { confirmDialog } from '../../utils/dialogs';
import React, { useState } from 'react';
import {
  Send,
  MessageSquare,
  Users,
  Paperclip,
  Bell,
  CheckCircle2,
  FileText,
  Clock,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  AlertTriangle,
  Sparkles,
  Printer,
  X,
  File,
  Image as ImageIcon,
  CheckCheck,
  Smartphone,
  Mail,
  Shield,
  UploadCloud,
  FileCheck,
  BarChart3,
  Upload,
  FileSpreadsheet,
  ArrowLeft,
  Home,
  ChevronRight,
} from 'lucide-react';
import {
  CommunicationMessage,
  CommunicationAttachment,
  UserRole,
  SchoolClass,
  Student,
  SchoolSettings,
} from '../../types';

interface CommunicationModuleProps {
  messages: CommunicationMessage[];
  classes: SchoolClass[];
  students: Student[];
  settings: SchoolSettings;
  currentRole: UserRole;
  onSendMessage: (newMessage: Omit<CommunicationMessage, 'id' | 'createdAt' | 'readConfirmations'>) => void;
  onConfirmRead: (messageId: string, userId: string, userName: string, userRole: UserRole) => void;
  onDeleteMessage: (messageId: string) => void;
  onTriggerPushNotification: (title: string, body: string) => void;
  onBatchImportMessages?: (messages: CommunicationMessage[]) => void;
  /** Abre a Central de WhatsApp com o público e o texto deste comunicado. */
  onSendViaWhatsApp?: (message: CommunicationMessage) => void;
  onBack?: () => void;
  onNavigate?: (tab: string, payload?: any) => void;
  /** Usuário logado: assina os comunicados e as confirmações de leitura. */
  currentUserName?: string;
  currentUserId?: string;
}

export const CommunicationModule: React.FC<CommunicationModuleProps> = ({
  messages,
  classes,
  students,
  settings,
  currentRole,
  onSendMessage,
  onConfirmRead,
  onDeleteMessage,
  onTriggerPushNotification,
  onBatchImportMessages,
  onSendViaWhatsApp,
  onBack,
  onNavigate,
  currentUserName: loggedUserName,
  currentUserId: loggedUserId,
}) => {
  // Navigation & filter state
  const [activeTab, setActiveTab] = useState<'FEED' | 'COMPOSE'>('FEED');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [selectedMessageForDetails, setSelectedMessageForDetails] = useState<CommunicationMessage | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<CommunicationAttachment | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  // Compose form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [recipientType, setRecipientType] = useState<'ALL' | 'ROLE' | 'CLASS' | 'INDIVIDUAL'>('ALL');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(['STUDENT', 'PARENT', 'TEACHER']);
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENTE' | 'INFORMATIVO'>('NORMAL');
  const [category, setCategory] = useState<'GERAL' | 'PEDAGOGICO' | 'SECRETARIA_FINANCEIRO' | 'EVENTO' | 'URGENTE'>('GERAL');
  const [attachments, setAttachments] = useState<CommunicationAttachment[]>([]);
  const [sendPushNotification, setSendPushNotification] = useState(true);
  const [requireReadConfirmation, setRequireReadConfirmation] = useState(true);
  const [alsoWhatsApp, setAlsoWhatsApp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick message templates
  const applyTemplate = (templateKey: string) => {
    switch (templateKey) {
      case 'REUNIAO':
        setTitle('Convocação: Reunião Pedagógica de Pais e Mestres');
        setContent(
          'Prezados pais e responsáveis,\n\nConvidamos a todos para a nossa Reunião Pedagógica do bimestre. Na ocasião, apresentaremos o relatório de desempenho geral, os avanços nas competências BNCC e as próximas etapas do calendário letivo.\n\nContamos com a valiosa presença de todos.'
        );
        setCategory('PEDAGOGICO');
        setPriority('URGENTE');
        setRequireReadConfirmation(true);
        break;
      case 'SIMULADO':
        setTitle('Novo Simulado Bimestral Disponível no Portal');
        setContent(
          'Caros alunos e professores,\n\nInformamos que a prova diagnóstica já se encontra aberta para resolução na plataforma online. Recomendamos verificar os prazos de entrega e garantir uma conexão estável antes do envio.'
        );
        setCategory('PEDAGOGICO');
        setPriority('INFORMATIVO');
        setSendPushNotification(true);
        break;
      case 'DOCUMENTACAO':
        setTitle('Aviso da Secretaria: Regularização de Documentação de Matrícula');
        setContent(
          'Prezados responsáveis,\n\nSolicitamos a gentileza de comparecer à secretaria ou enviar pelo portal os comprovantes de vacinação e transferência escolar para atualização cadastral no Censo Escolar.'
        );
        setCategory('SECRETARIA_FINANCEIRO');
        setPriority('NORMAL');
        setRequireReadConfirmation(true);
        break;
      case 'RECESSO':
        setTitle('Comunicado de Recesso Escolar e Feriado');
        setContent(
          'Informamos a toda a comunidade escolar que não haverá expediente pedagógico nas datas informadas em anexo devido ao recesso previsto no calendário letivo homologado.'
        );
        setCategory('EVENTO');
        setPriority('NORMAL');
        break;
    }
  };

  // Anexos: o arquivo é guardado dentro do comunicado (vai junto para a nuvem).
  // Limite por arquivo para não pesar a sincronização.
  const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    const tooBig = files.filter((f) => f.size > MAX_ATTACHMENT_BYTES);
    if (tooBig.length) {
      window.alert(
        `Arquivo(s) acima de 2 MB não foram anexados: ${tooBig.map((f) => f.name).join(', ')}.\nReduza o tamanho (ex.: salve o PDF em qualidade menor) ou envie por outro meio.`
      );
    }
    files
      .filter((f) => f.size <= MAX_ATTACHMENT_BYTES)
      .forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = () => {
          const lower = file.name.toLowerCase();
          const isPdf = lower.endsWith('.pdf');
          const isImg = file.type.startsWith('image/');
          const sizeFormatted = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
          const att: CommunicationAttachment = {
            id: `att-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            sizeFormatted,
            type: isPdf ? 'PDF' : isImg ? 'IMAGE' : lower.endsWith('.zip') ? 'ZIP' : 'DOC',
            url: String(reader.result || ''),
          };
          setAttachments((prev) => [...prev, att]);
        };
        reader.readAsDataURL(file);
      });
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);

    const studentObj = students.find((s) => s.id === selectedStudentId);

    const payload: Omit<CommunicationMessage, 'id' | 'createdAt' | 'readConfirmations'> = {
      title,
      content,
      senderRole: currentRole,
      // Assinado por quem está logado (antes usava nomes fictícios).
      senderName: currentUserName,
      senderTitle:
        currentRole === 'ADMIN'
          ? 'Diretoria Pedagógica'
          : currentRole === 'TEACHER'
          ? 'Docente Responsável'
          : 'Secretaria Escolar',
      recipientType,
      targetRoles: recipientType === 'ROLE' ? selectedRoles : ['STUDENT', 'PARENT', 'TEACHER'],
      targetClassId: recipientType === 'CLASS' ? selectedClassId : undefined,
      targetStudentId: recipientType === 'INDIVIDUAL' ? selectedStudentId : undefined,
      targetStudentName: recipientType === 'INDIVIDUAL' ? studentObj?.name : undefined,
      priority,
      category,
      attachments,
      sendPushNotification,
      requireReadConfirmation,
      status: 'ENVIADO',
    };
    onSendMessage(payload);
    if (alsoWhatsApp && onSendViaWhatsApp) {
      onSendViaWhatsApp({ ...payload, id: '', createdAt: new Date().toISOString(), readConfirmations: [] });
    }

    if (sendPushNotification) {
      onTriggerPushNotification(
        `📢 ${title}`,
        `${content.substring(0, 100)}... (Enviado pela Direção/Docência)`
      );
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setTitle('');
      setContent('');
      setAttachments([]);
      setActiveTab('FEED');
    }, 400);
  };

  const handleExportCSV = () => {
    const headers = ['Data', 'Título', 'Categoria', 'Prioridade', 'Remetente', 'Destinatários', 'Confirmações de Leitura'];
    const rows = filteredMessages.map((m) => [
      `"${new Date(m.createdAt).toLocaleDateString('pt-BR')}"`,
      `"${m.title.replace(/"/g, '""')}"`,
      `"${m.category}"`,
      `"${m.priority}"`,
      `"${m.senderName}"`,
      `"${m.recipientType}"`,
      m.readConfirmations.length,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `comunicados_escolares_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessImport = () => {
    try {
      let imported: CommunicationMessage[] = [];
      const trimmed = importText.trim();
      if (!trimmed) {
        setImportFeedback('Insira dados no formato JSON ou linhas de texto.');
        return;
      }

      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        imported = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
        lines.forEach((line, idx) => {
          if (idx === 0 && line.toLowerCase().includes('título')) return;
          const parts = line.includes(';') ? line.split(';') : line.split(',');
          const msgTitle = parts[0]?.replace(/"/g, '').trim() || `Comunicado ${idx + 1}`;
          const msgContent = parts[1]?.replace(/"/g, '').trim() || 'Aviso oficial da equipe pedagógica.';
          const msgCategory = (parts[2]?.replace(/"/g, '').trim() as any) || 'GERAL';

          imported.push({
            id: `comm-imp-${Date.now()}-${idx}`,
            title: msgTitle,
            content: msgContent,
            category: msgCategory,
            priority: 'NORMAL',
            senderRole: currentRole,
            senderName: currentUserName,
            recipientType: 'ALL',
            targetRoles: ['STUDENT', 'TEACHER', 'PARENT', 'ADMIN'],
            sendPushNotification: true,
            status: 'ENVIADO',
            attachments: [],
            requireReadConfirmation: true,
            readConfirmations: [],
            createdAt: new Date().toISOString(),
          });
        });
      }

      if (imported.length > 0) {
        if (onBatchImportMessages) {
          onBatchImportMessages(imported);
        } else {
          imported.forEach((msg) => {
            onSendMessage({
              title: msg.title,
              content: msg.content,
              category: msg.category,
              priority: msg.priority,
              senderRole: msg.senderRole,
              senderName: msg.senderName,
              recipientType: msg.recipientType,
              targetRoles: msg.targetRoles,
              targetClassId: msg.targetClassId,
              targetStudentId: msg.targetStudentId,
              attachments: msg.attachments,
              sendPushNotification: msg.sendPushNotification ?? true,
              requireReadConfirmation: msg.requireReadConfirmation,
              status: msg.status || 'ENVIADO',
            });
          });
        }
        setImportFeedback(`Sucesso! ${imported.length} comunicados importados.`);
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportFeedback(null);
          setImportText('');
        }, 1200);
      }
    } catch (e: any) {
      setImportFeedback(`Erro no processamento: ${e.message}`);
    }
  };

  // Filter messages
  const filteredMessages = messages.filter((msg) => {
    if (!msg) return false;
    const q = (searchQuery || '').toLowerCase().trim();
    const matchesSearch =
      !q ||
      (msg.title && msg.title.toLowerCase().includes(q)) ||
      (msg.content && msg.content.toLowerCase().includes(q)) ||
      (msg.senderName && msg.senderName.toLowerCase().includes(q));

    const matchesCategory = filterCategory === 'ALL' || msg.category === filterCategory;
    const matchesPriority = filterPriority === 'ALL' || msg.priority === filterPriority;

    return matchesSearch && matchesCategory && matchesPriority;
  });

  // Calculate high-level stats
  const totalMessages = messages.length;
  const urgentCount = messages.filter((m) => m.priority === 'URGENTE').length;
  const totalAttachments = messages.reduce((acc, m) => acc + m.attachments.length, 0);
  const totalConfirmations = messages.reduce((acc, m) => acc + m.readConfirmations.length, 0);

  // Usuário logado (antes eram personagens fictícios por perfil).
  const roleLabel =
    currentRole === 'ADMIN' ? 'Administração' : currentRole === 'TEACHER' ? 'Docente' : currentRole === 'STUDENT' ? 'Estudante' : 'Responsável';
  const currentUserName = (loggedUserName || '').trim() || roleLabel;
  const currentUserId = loggedUserId || `role-${currentRole.toLowerCase()}`;

  return (
    <div className="space-y-4">
      {/* Module Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onBack ? onBack() : onNavigate?.('MAIN_DASHBOARD')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-2xs group"
            title="Voltar ao Dashbox Principal"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar ao Início</span>
          </button>
          {activeTab === 'COMPOSE' && (
            <button
              onClick={() => setActiveTab('FEED')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all border border-indigo-200 cursor-pointer"
            >
              <span>← Voltar ao Mural</span>
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 ml-1">
            <span>Início</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="font-bold text-slate-800">Comunicação Escolar</span>
          </div>
        </div>

        {/* Quick Tab Switcher */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('FEED')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'FEED'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Mural ({messages.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('COMPOSE')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'COMPOSE'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Comunicado</span>
          </button>
          {onNavigate && (
            <button
              onClick={() => onNavigate('WHATSAPP')}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Abrir Central de Disparos WhatsApp"
            >
              <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
              <span>Central de WhatsApp</span>
            </button>
          )}
        </div>
      </div>

      {/* Bento Grid Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Messages */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total de Comunicados
            </p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{totalMessages}</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              Transmitidos no canal oficial
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
            <MessageSquare className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 2: Read Confirmations */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Leituras Confirmadas
            </p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{totalConfirmations}</h3>
            <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
              Pais e alunos cientificados
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
            <FileCheck className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 3: Urgent Announcements */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Avisos Urgentes
            </p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{urgentCount}</h3>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              Prioridade máxima emitida
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 4: Attachments Transmitted */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Documentos & Anexos
            </p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{totalAttachments}</h3>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              PDFs e comunicados baixáveis
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
            <Paperclip className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Tab Navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('FEED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'FEED'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Histórico & Mural de Comunicados</span>
            <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {messages.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('COMPOSE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'COMPOSE'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Novo Comunicado</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Relatório de Confirmação e Leitura"
          >
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            <span>Gerar Relatório</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Imprimir Mural Físico"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            <span>Imprimir Mural</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-slate-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="h-4 w-4 text-indigo-600" />
            <span>Importar</span>
          </button>
        </div>

        {/* Current Role Indicator */}
        <div className="text-xs flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <Shield className="h-3.5 w-3.5 text-indigo-600" />
          <span>Postando como:</span>
          <strong className="text-slate-800 font-bold">{currentUserName}</strong>
        </div>
      </div>

      {/* TAB CONTENT 1: FEED & HISTORY */}
      {activeTab === 'FEED' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar comunicados por título, conteúdo ou remetente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
              >
                <option value="ALL">Todas as Categorias</option>
                <option value="PEDAGOGICO">Pedagógico</option>
                <option value="SECRETARIA_FINANCEIRO">Secretaria & Matrículas</option>
                <option value="EVENTO">Eventos & Reuniões</option>
                <option value="URGENTE">Urgentes</option>
                <option value="GERAL">Geral</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
              >
                <option value="ALL">Todas as Prioridades</option>
                <option value="URGENTE">Prioridade Urgente</option>
                <option value="NORMAL">Prioridade Normal</option>
                <option value="INFORMATIVO">Informativo</option>
              </select>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                <MessageSquare className="h-10 w-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">Nenhum comunicado encontrado</h4>
                <p className="text-xs text-slate-500">
                  Tente ajustar os filtros de busca ou crie um novo comunicado institucional.
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isConfirmedByMe = msg.readConfirmations.some(
                  (c) => c.userId === currentUserId
                );
                const formattedDate = new Date(msg.createdAt).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={msg.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
                  >
                    {/* Card Top: Author, Date, Priority badge */}
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm border border-indigo-200">
                          {msg.senderName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-800">{msg.senderName}</h4>
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                              {msg.senderTitle || 'Emissor Oficial'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            <span>{formattedDate}</span>
                          </p>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {msg.priority === 'URGENTE' && (
                          <span className="bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>URGENTE</span>
                          </span>
                        )}

                        <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {msg.category}
                        </span>

                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {msg.recipientType === 'ALL' && '👥 Toda a Escola'}
                          {msg.recipientType === 'ROLE' && `🎯 ${msg.targetRoles.join(', ')}`}
                          {msg.recipientType === 'CLASS' && `🏫 ${classes.find((c) => c.id === msg.targetClassId)?.name || 'Turma específica'}`}
                          {msg.recipientType === 'INDIVIDUAL' && `👤 ${msg.targetStudentName || 'Individual'}`}
                        </span>

                        {/* Delete message button */}
                        <button
                          onClick={async () => {
                            if (await confirmDialog(`Excluir o comunicado "${msg.title}"?`)) onDeleteMessage(msg.id);
                          }}
                          aria-label={`Excluir comunicado ${msg.title}`}
                          title="Excluir comunicado"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Card Body: Title & Content */}
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {msg.title}
                      </h3>
                      <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                        {msg.content}
                      </p>
                    </div>

                    {/* Attachments Section */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Paperclip className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Arquivos Anexados ({msg.attachments.length})</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.attachments.map((att) => (
                            <div
                              key={att.id}
                              className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs hover:border-indigo-300 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {att.type === 'PDF' ? (
                                  <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                                ) : att.type === 'IMAGE' ? (
                                  <ImageIcon className="h-4 w-4 text-indigo-500 shrink-0" />
                                ) : (
                                  <File className="h-4 w-4 text-blue-500 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-800 truncate text-[11px]">
                                    {att.name}
                                  </p>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {att.sizeFormatted}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                <button
                                  onClick={() => setAttachmentPreview(att)}
                                  title="Pré-visualizar anexo"
                                  className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={att.name}
                                  title="Baixar arquivo"
                                  className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded cursor-pointer"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Card Footer: Read Confirmation & Details */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100">
                      {/* Read confirmations summary */}
                      <div className="flex items-center gap-2 text-slate-500">
                        <CheckCheck className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium">
                          <strong>{msg.readConfirmations.length}</strong> confirmações registradas
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Interactive Read Confirmation Button */}
                        {msg.requireReadConfirmation && (
                          <button
                            onClick={() => {
                              if (!isConfirmedByMe) {
                                onConfirmRead(msg.id, currentUserId, currentUserName, currentRole);
                              }
                            }}
                            disabled={isConfirmedByMe}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              isConfirmedByMe
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{isConfirmedByMe ? 'Leitura Confirmada' : 'Confirmar Ciência / Leitura'}</span>
                          </button>
                        )}

                        {onSendViaWhatsApp && (
                          <button
                            onClick={() => onSendViaWhatsApp(msg)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="Enviar este comunicado pelo WhatsApp (envio assistido)"
                          >
                            <Smartphone className="h-3.5 w-3.5" />
                            <span>Enviar por WhatsApp</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedMessageForDetails(msg)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Ver Detalhes & Auditoria</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: COMPOSE NEW MESSAGE */}
      {activeTab === 'COMPOSE' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Redigir Novo Comunicado Institucional
              </h3>
              <p className="text-xs text-slate-500">
                Transmita mensagens oficiais com notificações push e anexos para alunos, pais e docentes.
              </p>
            </div>

            {/* Template Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>Modelos Prontos:</span>
              </span>
              <button
                type="button"
                onClick={() => applyTemplate('REUNIAO')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg cursor-pointer transition-colors"
              >
                Reunião de Pais
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('SIMULADO')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg cursor-pointer transition-colors"
              >
                Novo Simulado
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('DOCUMENTACAO')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg cursor-pointer transition-colors"
              >
                Matrícula & Docs
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Target Audience & Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Recipient Scope */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Destinatários / Público
                </label>
                <select
                  value={recipientType}
                  onChange={(e) => setRecipientType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 font-medium"
                >
                  <option value="ALL">Toda a Comunidade Escolar</option>
                  <option value="ROLE">Por Perfil de Usuário</option>
                  <option value="CLASS">Por Turma Específica</option>
                  <option value="INDIVIDUAL">Aluno / Responsável Específico</option>
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nível de Prioridade
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 font-medium"
                >
                  <option value="NORMAL">Normal (Padrão)</option>
                  <option value="INFORMATIVO">Informativo</option>
                  <option value="URGENTE">🚨 Urgente (Alta Visibilidade)</option>
                </select>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 font-medium"
                >
                  <option value="GERAL">Geral</option>
                  <option value="PEDAGOGICO">Pedagógico & Provas</option>
                  <option value="SECRETARIA_FINANCEIRO">Secretaria & Matrículas</option>
                  <option value="EVENTO">Eventos & Calendário</option>
                  <option value="URGENTE">Aviso Urgente</option>
                </select>
              </div>
            </div>

            {/* Conditional Recipient Target Selectors */}
            {recipientType === 'ROLE' && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-700">
                  Selecione os Perfis Alvo:
                </label>
                <div className="flex flex-wrap gap-4 text-xs">
                  {(['STUDENT', 'PARENT', 'TEACHER'] as UserRole[]).map((r) => (
                    <label key={r} className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(r)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRoles((prev) => [...prev, r]);
                          } else {
                            setSelectedRoles((prev) => prev.filter((role) => role !== r));
                          }
                        }}
                        className="h-4 w-4 text-indigo-600 rounded"
                      />
                      <span>
                        {r === 'STUDENT' && '👨‍🎓 Alunos'}
                        {r === 'PARENT' && '👨‍👩‍👧 Pais / Responsáveis'}
                        {r === 'TEACHER' && '👨‍🏫 Professores'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {recipientType === 'CLASS' && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Selecione a Turma:</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.shift} - {cls.roomNumber})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {recipientType === 'INDIVIDUAL' && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Selecione o Estudante:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {students.map((std) => (
                    <option key={std.id} value={std.id}>
                      {std.name} (RA: {std.enrollmentNumber} - Resp: {std.guardianName})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Title / Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assunto / Título do Comunicado
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Convocação para Reunião de Pais e Mestres do 1º Bimestre"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 font-semibold"
              />
            </div>

            {/* Content / Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Conteúdo da Mensagem
              </label>
              <textarea
                required
                rows={5}
                placeholder="Digite o texto detalhado do comunicado com orientações, horários e diretrizes..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 leading-relaxed font-sans"
              />
            </div>

            {/* File Upload / Attachments Area */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Anexar Arquivos (PDF, Imagens, Documentos)</span>
                <span className="text-[11px] text-slate-400 font-normal">Máximo 10 MB por arquivo</span>
              </label>

              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/20 rounded-2xl p-4 text-center transition-colors">
                <input
                  type="file"
                  multiple
                  id="file-upload"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                >
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    Clique para selecionar ou arraste arquivos aqui
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Suporta PDF, Imagens (JPG, PNG), DOCX, Planilhas e Editais
                  </p>
                </label>
              </div>

              {/* Uploaded files list */}
              {attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {att.type === 'PDF' ? (
                          <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-indigo-500 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate text-[11px]">
                            {att.name}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {att.sizeFormatted}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Broadcast Options (Push & Read Confirmation) */}
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex flex-wrap items-center justify-between gap-4 text-xs">
              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendPushNotification}
                  onChange={(e) => setSendPushNotification(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <div className="flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-indigo-600" />
                  <span>Disparar Notificação Push no Navegador</span>
                </div>
              </label>

              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireReadConfirmation}
                  onChange={(e) => setRequireReadConfirmation(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <div className="flex items-center gap-1.5">
                  <CheckCheck className="h-4 w-4 text-emerald-600" />
                  <span>Exigir Confirmação de Leitura / Ciência</span>
                </div>
              </label>

              {onSendViaWhatsApp && (
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alsoWhatsApp}
                    onChange={(e) => setAlsoWhatsApp(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 rounded"
                  />
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                    <span>Depois de publicar, enviar também por WhatsApp</span>
                  </div>
                </label>
              )}
            </div>

            {/* Submit Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('FEED')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>{isSubmitting ? 'Transmitindo...' : 'Publicar Comunicado'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DETAILS / AUDIT MODAL */}
      {selectedMessageForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Auditoria & Confirmações de Leitura
                </h3>
              </div>
              <button
                onClick={() => setSelectedMessageForDetails(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                  {selectedMessageForDetails.category}
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  {selectedMessageForDetails.title}
                </h4>
                <p className="text-slate-500 text-[11px]">
                  Emitido por {selectedMessageForDetails.senderName} em{' '}
                  {new Date(selectedMessageForDetails.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedMessageForDetails.content}
              </div>

              {/* Confirmations List */}
              <div className="space-y-2 pt-2">
                <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Registro de Ciência ({selectedMessageForDetails.readConfirmations.length} confirmados)
                </h5>

                {selectedMessageForDetails.readConfirmations.length === 0 ? (
                  <p className="text-slate-400 italic">Nenhum responsável ou aluno confirmou leitura até o momento.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedMessageForDetails.readConfirmations.map((conf, idx) => (
                      <div key={idx} className="p-2.5 bg-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <div>
                            <p className="font-bold text-slate-800">{conf.userName}</p>
                            <span className="text-[10px] text-slate-400">{conf.userRole}</span>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(conf.confirmedAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedMessageForDetails(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ATTACHMENT PREVIEW MODAL */}
      {attachmentPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-5 w-5 text-indigo-600 shrink-0" />
                <h4 className="text-sm font-bold text-slate-800 truncate">
                  {attachmentPreview.name}
                </h4>
              </div>
              <button
                onClick={() => setAttachmentPreview(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl text-center space-y-3">
              {attachmentPreview.type === 'IMAGE' ? (
                <img
                  src={attachmentPreview.url}
                  alt={attachmentPreview.name}
                  className="max-h-64 mx-auto rounded-lg shadow-xs"
                />
              ) : attachmentPreview.type === 'PDF' && attachmentPreview.url.startsWith('data:application/pdf') ? (
                <iframe title={attachmentPreview.name} src={attachmentPreview.url} className="w-full h-[60vh] rounded-lg bg-white" />
              ) : (
                <div className="p-8 space-y-2">
                  <FileText className="h-16 w-16 text-rose-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">{attachmentPreview.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Tamanho: {attachmentPreview.sizeFormatted} | Formato {attachmentPreview.type}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">Documento homologado pelo colégio</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAttachmentPreview(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Fechar
                </button>
                <a
                  href={attachmentPreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={attachmentPreview.name}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Baixar Documento</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Relatório de Engajamento e Leituras */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Relatório de Eficácia & Leitura de Comunicados
                  </h2>
                  <p className="text-xs text-slate-500">Engajamento de pais, alunos e confirmações de ciência</p>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Transmitido</span>
                  <p className="text-2xl font-black text-slate-900">{messages.length}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700">Leituras Confirmadas</span>
                  <p className="text-2xl font-black text-emerald-700">
                    {messages.reduce((acc, m) => acc + m.readConfirmations.length, 0)}
                  </p>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-[10px] uppercase font-bold text-rose-700">Avisos Urgentes</span>
                  <p className="text-2xl font-black text-rose-700">
                    {messages.filter((m) => m.priority === 'URGENTE').length}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Detalhamento por Comunicado</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-2.5">Data</th>
                        <th className="p-2.5">Título</th>
                        <th className="p-2.5">Categoria</th>
                        <th className="p-2.5">Prioridade</th>
                        <th className="p-2.5">Remetente</th>
                        <th className="p-2.5 text-center">Confirmações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {messages.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="p-2.5 text-slate-500 font-mono">
                            {new Date(m.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="p-2.5 font-bold text-slate-800">{m.title}</td>
                          <td className="p-2.5">{m.category}</td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                m.priority === 'URGENTE'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {m.priority}
                            </span>
                          </td>
                          <td className="p-2.5">{m.senderName}</td>
                          <td className="p-2.5 text-center font-bold text-indigo-600">
                            {m.readConfirmations.length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Exportar CSV</span>
              </button>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Fechar Relatório
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Impressão de Mural Oficial */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between no-print">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Printer className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Impressão de Mural Oficial de Comunicados & Portaria
                  </h2>
                  <p className="text-xs text-slate-500">Documento diagramado para afixação física no colégio</p>
                </div>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-3 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between no-print text-xs">
              <p className="text-indigo-900 font-semibold">Exibindo {filteredMessages.length} comunicados recentes</p>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimir Mural (Ctrl+P / PDF)</span>
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto bg-white text-slate-900 font-serif leading-relaxed text-sm space-y-6">
              <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
                <h1 className="text-base font-bold uppercase tracking-wider font-sans">
                  COLÉGIO INTEGRADO • QUADRO OFICIAL DE AVISOS & COMUNICADOS
                </h1>
                <p className="text-xs text-slate-600 font-sans">
                  INFORMAÇÕES À COMUNIDADE ESCOLAR, RESPONSÁVEIS E CORPO DOCENTE
                </p>
                <div className="pt-2 text-xs font-sans flex justify-between border-t border-slate-200 mt-2 text-slate-700">
                  <span>Atualizado em: {new Date().toLocaleDateString('pt-BR')}</span>
                  <span>Portaria & Secretaria Central</span>
                </div>
              </div>

              <div className="space-y-4">
                {filteredMessages.map((m) => (
                  <div key={m.id} className="border border-slate-300 rounded-xl p-4 space-y-2 bg-slate-50/50 font-sans">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-900 text-sm">{m.title}</h3>
                      <span className="text-[11px] font-semibold text-slate-500 font-mono">
                        {new Date(m.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">{m.content}</p>
                    <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between">
                      <span>Emitido por: {m.senderName} ({m.senderRole})</span>
                      <span>Categoria: {m.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação de Comunicados */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Importação em Lote de Comunicados</h2>
                  <p className="text-xs text-slate-500">Cole mensagens no formato CSV (Título; Conteúdo; Categoria) ou JSON</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {importFeedback && (
                <div
                  className={`p-3 rounded-xl font-medium ${
                    importFeedback.includes('Sucesso')
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {importFeedback}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dados dos Comunicados (linha CSV ou JSON):
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`Exemplo CSV:\nReunião com Pais; Lembramos a reunião pedagógica amanhã às 19h; PEDAGOGICO\nFeira de Ciências 2026; Inscrições abertas para projetos da feira; EVENTO\nRecesso Escolar; Informamos o período de recesso de 15 a 22 de Julho; GERAL`}
                  className="w-full h-44 p-3 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleProcessImport}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
              >
                Cadastrar Comunicados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
