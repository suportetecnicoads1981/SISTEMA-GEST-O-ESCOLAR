import React, { useState } from 'react';
import {
  MessageSquare,
  QrCode,
  Smartphone,
  Send,
  RefreshCw,
  CheckCheck,
  Check,
  Clock,
  AlertTriangle,
  Users,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  FileText,
  Building2,
  GraduationCap,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
  PhoneCall,
  CheckCircle2,
  Settings2,
  ArrowLeft,
} from 'lucide-react';
import {
  WhatsAppConfig,
  WhatsAppMessageLog,
  WhatsAppTemplate,
  Student,
  SchoolClass,
  UserAccount,
  WhatsAppMessageType,
  WhatsAppRecipientRole,
} from '../../types';
import { DEFAULT_WHATSAPP_CONFIG, DEFAULT_WHATSAPP_TEMPLATES } from '../../data/defaultData';

export interface WhatsAppModuleProps {
  config?: WhatsAppConfig;
  logs?: WhatsAppMessageLog[];
  messageLogs?: WhatsAppMessageLog[];
  templates?: WhatsAppTemplate[];
  students?: Student[];
  classes?: SchoolClass[];
  userAccounts?: UserAccount[];
  currentUser?: UserAccount;
  onUpdateConfig: (newConfig: WhatsAppConfig) => void;
  onSendMessage: (log: Omit<WhatsAppMessageLog, 'id' | 'sentAt'>) => void;
  onSaveTemplate: (tpl: WhatsAppTemplate) => void;
  onDeleteTemplate: (tplId: string) => void;
  onBack?: () => void;
  onNavigate?: (tab: string, payload?: any) => void;
}

export const WhatsAppModule: React.FC<WhatsAppModuleProps> = ({
  config = DEFAULT_WHATSAPP_CONFIG,
  logs,
  messageLogs,
  templates = DEFAULT_WHATSAPP_TEMPLATES,
  students = [],
  classes = [],
  userAccounts = [],
  currentUser,
  onUpdateConfig,
  onSendMessage,
  onSaveTemplate,
  onDeleteTemplate,
  onBack,
  onNavigate,
}) => {
  const effectiveLogs = logs || messageLogs || [];
  const effectiveTemplates = templates && templates.length > 0 ? templates : DEFAULT_WHATSAPP_TEMPLATES;
  const effectiveConfig = config || DEFAULT_WHATSAPP_CONFIG;

  const [activeSubTab, setActiveSubTab] = useState<'DISPATCH' | 'LOGS' | 'TEMPLATES' | 'SETTINGS'>('DISPATCH');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Dispatch composer state
  const [selectedType, setSelectedType] = useState<WhatsAppMessageType>('AVISO_FALTA');
  const [selectedTargetGroup, setSelectedTargetGroup] = useState<'INDIVIDUAL' | 'TURMA' | 'DOCENTES' | 'TODOS_RESPONSAVEIS'>('INDIVIDUAL');
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [customPhone, setCustomPhone] = useState(students[0]?.guardianPhone || '(11) 98765-4321');
  const [customRecipientName, setCustomRecipientName] = useState(students[0]?.guardianName || 'Responsável');
  const [messageBody, setMessageBody] = useState(() => {
    const initialTpl = effectiveTemplates.find((t) => t.type === 'AVISO_FALTA') || effectiveTemplates[0];
    if (initialTpl && students[0]) {
      const studentClass = classes.find((c) => c.id === students[0]?.classId);
      return initialTpl.body
        .replace(/\{\{aluno\}\}/g, students[0].name)
        .replace(/\{\{responsavel\}\}/g, students[0].guardianName || 'Responsável')
        .replace(/\{\{turma\}\}/g, studentClass?.name || students[0].gradeLevel)
        .replace(/\{\{data\}\}/g, new Intl.DateTimeFormat('pt-BR').format(new Date()))
        .replace(/\{\{escola\}\}/g, 'Colégio Horizonte do Saber')
        .replace(/\{\{telefone_escola\}\}/g, '(11) 3456-7890');
    }
    return initialTpl?.body || '';
  });
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState('');

  // Editing template state
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editingTemplateData, setEditingTemplateData] = useState<WhatsAppTemplate | null>(null);

  // Load template into message composer when type changes
  const handleSelectTemplateType = (type: WhatsAppMessageType) => {
    setSelectedType(type);
    const matchedTpl = effectiveTemplates.find((t) => t.type === type) || effectiveTemplates[0];
    if (matchedTpl) {
      // Auto-interpolate basic variables based on student
      const student = students.find((s) => s.id === selectedStudentId) || students[0];
      const studentClass = classes.find((c) => c.id === student?.classId);

      let text = matchedTpl.body;
      if (student) {
        text = text
          .replace(/\{\{aluno\}\}/g, student.name)
          .replace(/\{\{responsavel\}\}/g, student.guardianName || 'Responsável')
          .replace(/\{\{turma\}\}/g, studentClass?.name || student.gradeLevel)
          .replace(/\{\{data\}\}/g, new Intl.DateTimeFormat('pt-BR').format(new Date()))
          .replace(/\{\{escola\}\}/g, 'Colégio Horizonte do Saber')
          .replace(/\{\{telefone_escola\}\}/g, '(11) 3456-7890')
          .replace(/\{\{bimestre\}\}/g, '1º Bimestre')
          .replace(/\{\{media_geral\}\}/g, '8.5')
          .replace(/\{\{data_reuniao\}\}/g, '04/09/2026')
          .replace(/\{\{horario\}\}/g, '19h00')
          .replace(/\{\{prazo_fechamento\}\}/g, '05/09/2026');
      }
      setMessageBody(text);
    }
  };

  // Sync selected student details into custom phone and recipient name
  const handleStudentSelect = (stdId: string) => {
    setSelectedStudentId(stdId);
    const st = students.find((s) => s.id === stdId);
    if (st) {
      setCustomRecipientName(st.guardianName || `${st.name} (Resp.)`);
      setCustomPhone(st.guardianPhone || '(11) 98765-4321');
    }
  };

  // Handle send message dispatch
  const handleSendDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim()) return;

    setIsSending(true);
    setSendSuccessMsg('');

    setTimeout(() => {
      if (selectedTargetGroup === 'INDIVIDUAL') {
        const student = students.find((s) => s.id === selectedStudentId);
        onSendMessage({
          recipientName: customRecipientName || student?.guardianName || 'Destinatário',
          recipientPhone: customPhone || student?.guardianPhone || '+55 (11) 98765-4321',
          recipientRole: 'RESPONSAVEL',
          messageType: selectedType,
          content: messageBody,
          studentName: student?.name,
          studentClass: classes.find((c) => c.id === student?.classId)?.name,
          status: 'ENTREGUE',
          operatorName: 'Secretaria Escolar (Painel Central)',
        });
        setSendSuccessMsg('Notificação via WhatsApp enviada com sucesso para o destinatário!');
      } else if (selectedTargetGroup === 'TURMA') {
        const targetStudents = students.filter((s) => s.classId === selectedClassId);
        targetStudents.forEach((st) => {
          onSendMessage({
            recipientName: st.guardianName || `${st.name} (Resp.)`,
            recipientPhone: st.guardianPhone || '+55 (11) 98765-4321',
            recipientRole: 'RESPONSAVEL',
            messageType: selectedType,
            content: messageBody.replace(/\{\{aluno\}\}/g, st.name),
            studentName: st.name,
            studentClass: classes.find((c) => c.id === st.classId)?.name,
            status: 'ENTREGUE',
            operatorName: 'Disparo em Lote para Turma',
          });
        });
        setSendSuccessMsg(`Disparo em lote concluído para ${targetStudents.length} responsáveis da turma selecionada!`);
      } else if (selectedTargetGroup === 'DOCENTES') {
        const teachers = userAccounts.filter((u) => u.sector === 'PROFESSOR' || u.role === 'TEACHER');
        teachers.forEach((t) => {
          onSendMessage({
            recipientName: t.name,
            recipientPhone: t.phone || '+55 (11) 98765-4321',
            recipientRole: 'PROFESSOR',
            messageType: 'COMUNICADO_INTERNO',
            content: messageBody,
            status: 'LIDO',
            operatorName: 'Diretoria / Secretaria SME',
          });
        });
        setSendSuccessMsg(`Comunicado interno enviado para ${teachers.length} professores cadastrados!`);
      }

      setIsSending(false);
      setTimeout(() => setSendSuccessMsg(''), 4000);
    }, 500);
  };

  // Filter logs
  const filteredLogs = effectiveLogs.filter((l) => {
    const matchSearch =
      (l.recipientName && l.recipientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.recipientPhone && l.recipientPhone.includes(searchTerm)) ||
      (l.studentName && l.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.content && l.content.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {onBack && (
        <div className="flex items-center justify-between pb-1">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all border border-slate-200 shadow-2xs cursor-pointer group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform text-slate-500" />
            <span>Voltar ao Painel Principal</span>
          </button>
        </div>
      )}

      {/* Top Banner & Connection Status */}
      <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-700/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-lg shadow-emerald-900/40 shrink-0">
            <MessageSquare className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Central de WhatsApp & Notificações Administrativas
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                {effectiveConfig.status === 'CONNECTED' ? 'Conectado & Ativo' : 'Aguardando Sincronização'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-200/80 max-w-2xl leading-relaxed">
              Disparo automatizado e manual de avisos de ausências, boletins escolares, convocações de busca ativa e comunicados internos para responsáveis e docentes.
            </p>
          </div>
        </div>

        {/* Quick Connection Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[240px] z-10 shrink-0">
          <div className="flex items-center justify-between text-xs text-emerald-200 mb-2">
            <span className="font-semibold">Instância Conectada:</span>
            <span className="font-mono text-white text-[11px] font-bold">{effectiveConfig.instanceName}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-emerald-200 mb-3">
            <span>Telefone do Emissor:</span>
            <span className="font-mono text-emerald-300 font-bold">{effectiveConfig.connectedPhone || '(11) 98765-4321'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onUpdateConfig({
                  ...effectiveConfig,
                  status: effectiveConfig.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED',
                });
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                effectiveConfig.status === 'CONNECTED'
                  ? 'bg-rose-500/30 hover:bg-rose-500/40 text-rose-200 border border-rose-400/30'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
              title={effectiveConfig.status === 'CONNECTED' ? 'Desconectar WhatsApp' : 'Conectar Instância'}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {effectiveConfig.status === 'CONNECTED' ? 'Desconectar' : 'Reconectar Instância'}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('DISPATCH')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'DISPATCH'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Abrir Central de Disparos de Mensagens"
        >
          <Send className="h-4 w-4" />
          <span>Enviar Mensagens & Avisos</span>
        </button>

        <button
          onClick={() => setActiveSubTab('LOGS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'LOGS'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Visualizar Histórico Completo de Envios"
        >
          <Clock className="h-4 w-4" />
          <span>Histórico de Envios ({effectiveLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('TEMPLATES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'TEMPLATES'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Gerenciar Modelos de Mensagens e Variáveis"
        >
          <FileText className="h-4 w-4" />
          <span>Modelos de Mensagens ({effectiveTemplates.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('SETTINGS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'SETTINGS'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Configurações de Gateway e Automação de Alertas"
        >
          <Settings2 className="h-4 w-4" />
          <span>Regras Automáticas & Gateway</span>
        </button>
      </div>

      {/* Tab 1: Message Dispatcher */}
      {activeSubTab === 'DISPATCH' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Target & Message Selection */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="h-4 w-4 text-emerald-600" />
                Compositor de Notificação WhatsApp
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecione o tipo de comunicado e os destinatários desejados. As tags de variáveis serão preenchidas automaticamente.
              </p>
            </div>

            {sendSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-2xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{sendSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSendDispatch} className="space-y-4">
              {/* Type of Notice */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tipo de Notificação / Modelo Predefinido
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { type: 'AVISO_FALTA', label: 'Aviso de Falta', desc: 'Ausência não justificada' },
                    { type: 'BOLETIM_NOTAS', label: 'Boletim & Notas', desc: 'Espelho de desempenho' },
                    { type: 'BUSCA_ATIVA', label: 'Busca Ativa', desc: 'Convocação prioritária' },
                    { type: 'EVENTO_REUNIAO', label: 'Reunião de Pais', desc: 'Convite pedagógico' },
                    { type: 'COMUNICADO_INTERNO', label: 'Aviso Docente', desc: 'Equipe e fechamento' },
                    { type: 'AVISO_GERAL', label: 'Comunicado Geral', desc: 'Informativo amplo' },
                  ].map((item) => {
                    const isSelected = selectedType === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => handleSelectTemplateType(item.type as WhatsAppMessageType)}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs font-bold ring-2 ring-emerald-500/20'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                        title={`Carregar modelo de ${item.label}`}
                      >
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className="text-[10px] text-slate-500 truncate">{item.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Público Alvo do Disparo
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'INDIVIDUAL', label: 'Aluno Específico' },
                    { key: 'TURMA', label: 'Toda a Turma' },
                    { key: 'DOCENTES', label: 'Todos Professores' },
                    { key: 'TODOS_RESPONSAVEIS', label: 'Toda a Escola' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setSelectedTargetGroup(item.key as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        selectedTargetGroup === item.key
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Target Selectors */}
              {selectedTargetGroup === 'INDIVIDUAL' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Selecionar Estudante
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => handleStudentSelect(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    >
                      {students.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.enrollmentNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      WhatsApp do Responsável
                    </label>
                    <input
                      type="text"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      placeholder="+55 (11) 98765-4321"
                      className="w-full py-2 px-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                </div>
              )}

              {selectedTargetGroup === 'TURMA' && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Selecionar Turma para Disparo em Lote
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  >
                    {classes.map((cls) => {
                      const count = students.filter((s) => s.classId === cls.id).length;
                      return (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({count} alunos matriculados)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Message Content Body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Mensagem a ser Transmitida
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {messageBody.length} caracteres
                  </span>
                </div>
                <textarea
                  rows={5}
                  required
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Escreva aqui a mensagem oficial..."
                  className="w-full p-3.5 rounded-2xl bg-white border border-slate-300 text-slate-800 text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all shadow-inner"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSending}
                  className="flex-1 py-3 px-4 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wide shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
                  title="Enviar mensagem através do WhatsApp Gateway Oficial"
                >
                  {isSending ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Transmitir Mensagem WhatsApp</span>
                    </>
                  )}
                </button>

                {customPhone && (
                  <a
                    href={`https://api.whatsapp.com/send?phone=${customPhone.replace(/\D/g, '')}&text=${encodeURIComponent(messageBody)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 flex items-center gap-1.5 transition-all"
                    title="Abrir diretamente no WhatsApp Web"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>WhatsApp Web</span>
                  </a>
                )}
              </div>
            </form>
          </div>

          {/* Right Live Simulation Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-lg text-white">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">SucessoEdu Oficial</div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Online • Canal Verificado
                    </div>
                  </div>
                </div>
                <Smartphone className="h-5 w-5 text-slate-500" />
              </div>

              {/* Chat Bubble Simulation */}
              <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 text-xs text-slate-200 leading-relaxed shadow-inner">
                <p className="whitespace-pre-wrap font-sans">
                  {messageBody || 'Selecione um modelo acima ou digite o texto da notificação para visualizar a prévia instantânea aqui...'}
                </p>
                <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-slate-400">
                  <span>{new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(new Date())}</span>
                  <CheckCheck className="h-3.5 w-3.5 text-sky-400" />
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Destinatário: <strong className="text-slate-200">{customRecipientName || 'Responsável'}</strong></span>
                <span>Tel: <strong className="text-emerald-400 font-mono">{customPhone || '+55 (11) 98765-4321'}</strong></span>
              </div>
            </div>

            {/* Quick Automation Notice */}
            <div className="bg-linear-to-br from-indigo-50 to-sky-50 rounded-3xl p-5 border border-indigo-100">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs mb-1.5">
                <Zap className="h-4 w-4 text-amber-500" />
                Automação Inteligente de Presença
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Quando o professor realiza o fechamento da chamada no <strong>Diário de Classe</strong>, os estudantes marcados como ausentes geram automaticamente notificações sugeridas prontas para envio aos responsáveis.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Logs History */}
      {activeSubTab === 'LOGS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Controls */}
          <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                Histórico & Auditoria de Disparos WhatsApp
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Registro detalhado de mensagens enviadas, status de entrega e leituras confirmadas.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, telefone..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 outline-hidden"
              >
                <option value="ALL">Todos os Status</option>
                <option value="LIDO">Lido / Visualizado</option>
                <option value="ENTREGUE">Entregue</option>
                <option value="ENVIADO">Enviado</option>
                <option value="ERRO">Falha no Envio</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Destinatário & Telefone</th>
                  <th className="py-3 px-4">Estudante / Turma</th>
                  <th className="py-3 px-4">Tipo de Aviso</th>
                  <th className="py-3 px-4">Conteúdo</th>
                  <th className="py-3 px-4">Data/Hora</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      Nenhum registro de envio localizado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const statusBadge =
                      log.status === 'LIDO'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : log.status === 'ENTREGUE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : log.status === 'ENVIADO'
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div>{log.recipientName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.recipientPhone}</div>
                        </td>
                        <td className="py-3 px-4">
                          {log.studentName ? (
                            <div>
                              <span className="font-semibold text-indigo-900">{log.studentName}</span>
                              <div className="text-[10px] text-slate-400">{log.studentClass || 'Turma Sede'}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Geral / Docente</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {log.messageType}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="truncate text-slate-600 text-xs" title={log.content}>
                            {log.content}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-500 font-mono whitespace-nowrap">
                          {new Intl.DateTimeFormat('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          }).format(new Date(log.sentAt))}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${statusBadge}`}
                          >
                            {log.status === 'LIDO' && <CheckCheck className="h-3 w-3 text-sky-500" />}
                            {log.status === 'ENTREGUE' && <Check className="h-3 w-3 text-emerald-500" />}
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-[11px] text-slate-500">
                          {log.operatorName}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Message Templates */}
      {activeSubTab === 'TEMPLATES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Modelos Oficiais de Mensagens & Variáveis Dinâmicas
              </h3>
              <p className="text-xs text-slate-500">
                Configure modelos padronizados utilizando tags como <code>{'{{aluno}}'}</code>, <code>{'{{responsavel}}'}</code>, <code>{'{{turma}}'}</code> e <code>{'{{escola}}'}</code>.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingTemplateData({
                  id: `tpl-${Date.now()}`,
                  title: 'Novo Modelo Institucional',
                  type: 'AVISO_GERAL',
                  body: 'Olá, {{responsavel}}! Informamos que...',
                  variables: ['{{responsavel}}', '{{aluno}}'],
                });
                setIsEditingTemplate(true);
              }}
              className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Criar Novo Modelo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {effectiveTemplates.map((tpl) => (
              <div key={tpl.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {tpl.type}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingTemplateData(tpl);
                          setIsEditingTemplate(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Editar Modelo"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTemplate(tpl.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Excluir Modelo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2">{tpl.title}</h4>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                    {tpl.body}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400">Variáveis:</span>
                  {tpl.variables.map((v) => (
                    <span key={v} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono text-slate-600">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Modal Template Edit */}
          {isEditingTemplate && editingTemplateData && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4">
                <h3 className="text-base font-bold text-slate-900">Configurar Modelo de Notificação</h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Título do Modelo</label>
                  <input
                    type="text"
                    value={editingTemplateData.title}
                    onChange={(e) => setEditingTemplateData({ ...editingTemplateData, title: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Finalidade</label>
                  <select
                    value={editingTemplateData.type}
                    onChange={(e) => setEditingTemplateData({ ...editingTemplateData, type: e.target.value as any })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="AVISO_FALTA">Aviso de Falta</option>
                    <option value="BOLETIM_NOTAS">Boletim de Notas</option>
                    <option value="BUSCA_ATIVA">Busca Ativa</option>
                    <option value="EVENTO_REUNIAO">Evento / Reunião</option>
                    <option value="COMUNICADO_INTERNO">Comunicado Interno</option>
                    <option value="AVISO_GERAL">Aviso Geral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Corpo da Mensagem (com tags)</label>
                  <textarea
                    rows={4}
                    value={editingTemplateData.body}
                    onChange={(e) => setEditingTemplateData({ ...editingTemplateData, body: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsEditingTemplate(false)}
                    className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      onSaveTemplate(editingTemplateData);
                      setIsEditingTemplate(false);
                    }}
                    className="py-2 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                  >
                    Salvar Modelo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Gateway Settings & Automation */}
      {activeSubTab === 'SETTINGS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-emerald-600" />
              Configurações de Gateway WhatsApp & Regras Automáticas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Conexão com provedores de API WhatsApp (Evolution API, Z-API, Baileys, WPPConnect ou Webhooks oficiais).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gateway Endpoint Form */}
            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Parâmetros do Servidor</h4>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome da Instância</label>
                <input
                  type="text"
                  value={config.instanceName}
                  onChange={(e) => onUpdateConfig({ ...config, instanceName: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Endpoint do Servidor Gateway</label>
                <input
                  type="text"
                  value={config.serverEndpoint}
                  onChange={(e) => onUpdateConfig({ ...config, serverEndpoint: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Token de Autenticação / API Key</label>
                <input
                  type="password"
                  value={config.apiKeyOrToken}
                  onChange={(e) => onUpdateConfig({ ...config, apiKeyOrToken: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                />
              </div>
            </div>

            {/* Automation Rules */}
            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Gatilhos de Notificação Automática</h4>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoSendAbsenceAlerts}
                    onChange={(e) => onUpdateConfig({ ...config, autoSendAbsenceAlerts: e.target.checked })}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Alerta de Faltas Automático</div>
                    <div className="text-[11px] text-slate-500">Notificar pais quando o docente lançar ausência no Diário.</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoSendGradeAlerts}
                    onChange={(e) => onUpdateConfig({ ...config, autoSendGradeAlerts: e.target.checked })}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Aviso de Fechamento de Boletim</div>
                    <div className="text-[11px] text-slate-500">Enviar link do boletim assim que a secretaria homologar as notas.</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoSendActiveSearchSummons}
                    onChange={(e) => onUpdateConfig({ ...config, autoSendActiveSearchSummons: e.target.checked })}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Convocação Busca Ativa Escolar</div>
                    <div className="text-[11px] text-slate-500">Disparar convocação urgente quando atingir 5 faltas consecutivas.</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
