/**
 * Central de WhatsApp — envio ASSISTIDO.
 *
 * O sistema monta a lista de destinatários com a mensagem de cada um pronta e
 * abre a conversa no WhatsApp; quem opera aperta "Enviar" no próprio WhatsApp.
 * Nada é marcado como "entregue" ou "lido": o histórico registra apenas que a
 * conversa foi aberta, por quem e quando.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  MessageSquare,
  Send,
  Clock,
  Search,
  Plus,
  Trash2,
  Edit2,
  FileText,
  ExternalLink,
  CheckCircle2,
  Settings2,
  ArrowLeft,
  AlertTriangle,
  Users,
  ListChecks,
  PhoneOff,
  X,
  Inbox,
  Info,
} from 'lucide-react';
import {
  WhatsAppConfig,
  WhatsAppMessageLog,
  WhatsAppTemplate,
  Student,
  SchoolClass,
  SchoolUnit,
  UserAccount,
  WhatsAppMessageType,
} from '../../types';
import { DEFAULT_WHATSAPP_CONFIG, DEFAULT_WHATSAPP_TEMPLATES } from '../../data/defaultData';
import { classLabelWithSchool } from '../../utils/schoolDataNormalizer';
import {
  Audience,
  AudienceKind,
  OpenMode,
  Recipient,
  StaffFilter,
  StudentContact,
  buildRecipients,
  fillMessage,
  formatPhoneBR,
  isDemoLog,
  loadOpenMode,
  missingVariables,
  normalizeWhatsAppPhone,
  openWhatsApp,
  saveOpenMode,
  studentsForAudience,
} from '../../services/whatsapp/whatsappAssist';

/** Pedido de envio vindo de outro módulo (ex.: Mural de Comunicados). */
export interface WhatsAppPrefill {
  title?: string;
  text: string;
  audience: Audience;
  messageType?: WhatsAppMessageType;
  source?: 'MURAL' | 'MANUAL';
}

export interface WhatsAppModuleProps {
  config?: WhatsAppConfig;
  logs?: WhatsAppMessageLog[];
  messageLogs?: WhatsAppMessageLog[];
  templates?: WhatsAppTemplate[];
  students?: Student[];
  classes?: SchoolClass[];
  schoolUnits?: SchoolUnit[];
  userAccounts?: UserAccount[];
  currentUser?: UserAccount;
  schoolName?: string;
  schoolPhone?: string;
  prefill?: WhatsAppPrefill | null;
  onPrefillConsumed?: () => void;
  onUpdateConfig: (newConfig: WhatsAppConfig) => void;
  onSendMessage: (log: Omit<WhatsAppMessageLog, 'id' | 'sentAt'>) => void;
  onUpdateLogs?: (ids: string[], patch: Partial<WhatsAppMessageLog>) => void;
  onSaveTemplate: (tpl: WhatsAppTemplate) => void;
  onDeleteTemplate: (tplId: string) => void;
  onBack?: () => void;
  onNavigate?: (tab: string, payload?: any) => void;
}

type SubTab = 'ENVIAR' | 'FILA' | 'HISTORICO' | 'MODELOS' | 'AJUSTES';

const TYPE_LABEL: Record<string, string> = {
  AVISO_FALTA: 'Aviso de falta',
  BOLETIM_NOTAS: 'Notas / boletim',
  CONVOCACAO_RESPONSAVEL: 'Convocação',
  COMUNICADO_INTERNO: 'Aviso à equipe',
  BUSCA_ATIVA: 'Busca ativa',
  EVENTO_REUNIAO: 'Reunião / evento',
  AVISO_GERAL: 'Comunicado geral',
};

const SOURCE_LABEL: Record<string, string> = {
  MANUAL: 'Envio manual',
  MURAL: 'Mural de comunicados',
  FALTA: 'Falta lançada',
  NOTA: 'Nota lançada',
};

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  ENVIADO: { text: 'Aberto no WhatsApp', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  FILA: { text: 'Aguardando envio', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  DESCARTADO: { text: 'Descartado', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  ENTREGUE: { text: 'Registro antigo', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  LIDO: { text: 'Registro antigo', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  ERRO: { text: 'Erro', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

interface SessionRow {
  recipient: Recipient;
  text: string;
  opened: boolean;
}

interface Session {
  batchId: string;
  title: string;
  messageType: WhatsAppMessageType;
  source: 'MANUAL' | 'MURAL';
  rows: SessionRow[];
  withoutPhone: Recipient[];
}

const fmtDateTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(d);
};

export const WhatsAppModule: React.FC<WhatsAppModuleProps> = ({
  config,
  logs,
  messageLogs,
  templates,
  students = [],
  classes = [],
  schoolUnits = [],
  userAccounts = [],
  currentUser,
  schoolName = '',
  schoolPhone = '',
  prefill,
  onPrefillConsumed,
  onUpdateConfig,
  onSendMessage,
  onUpdateLogs,
  onSaveTemplate,
  onDeleteTemplate,
  onBack,
}) => {
  const effectiveConfig = config || DEFAULT_WHATSAPP_CONFIG;
  const effectiveTemplates = templates && templates.length > 0 ? templates : DEFAULT_WHATSAPP_TEMPLATES;
  const allLogs = useMemo(() => (logs || messageLogs || []).filter((l) => l && !isDemoLog(l.id)), [logs, messageLogs]);
  const queue = useMemo(() => allLogs.filter((l) => l.status === 'FILA'), [allLogs]);
  const history = useMemo(() => allLogs.filter((l) => l.status !== 'FILA'), [allLogs]);
  const operator = currentUser?.name || 'Secretaria';
  const school = { name: schoolName, phone: schoolPhone };

  const [tab, setTab] = useState<SubTab>('ENVIAR');
  const [openMode, setOpenMode] = useState<OpenMode>(() => loadOpenMode());
  const [notice, setNotice] = useState('');

  // ---------------- Público ----------------
  const [kind, setKind] = useState<AudienceKind>('TURMA');
  const [studentId, setStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [contact, setContact] = useState<StudentContact>('RESPONSAVEL');
  const [staff, setStaff] = useState<StaffFilter>('PROFESSORES');

  // ---------------- Mensagem ----------------
  const [messageType, setMessageType] = useState<WhatsAppMessageType>('AVISO_GERAL');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [source, setSource] = useState<'MANUAL' | 'MURAL'>('MANUAL');
  const [session, setSession] = useState<Session | null>(null);

  // Pedido vindo do Mural: já preenche público e texto.
  useEffect(() => {
    if (!prefill) return;
    const a = prefill.audience;
    setKind(a.kind);
    setStudentId(a.studentId || '');
    setClassId(a.classId || '');
    setUnitId(a.unitId || '');
    setContact(a.contact || 'RESPONSAVEL');
    setStaff(a.staff || 'EQUIPE');
    setMessageType(prefill.messageType || 'AVISO_GERAL');
    setTitle(prefill.title || '');
    setBody(prefill.text);
    setSource(prefill.source || 'MURAL');
    setSession(null);
    setTab('ENVIAR');
    onPrefillConsumed?.();
  }, [prefill, onPrefillConsumed]);

  const activeStudents = useMemo(
    () => students.filter((s) => s && !['TRANSFERRED', 'EVADIDO', 'CONCLUDED'].includes(String(s.status || ''))),
    [students]
  );
  const sortedClasses = useMemo(
    () => [...classes].sort((a, b) => classLabelWithSchool(a, schoolUnits).localeCompare(classLabelWithSchool(b, schoolUnits), 'pt-BR')),
    [classes, schoolUnits]
  );
  const studentOptions = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return activeStudents
      .filter((s) => !q || s.name.toLowerCase().includes(q) || String(s.enrollmentNumber || '').includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      .slice(0, 300);
  }, [activeStudents, studentSearch]);

  const audience: Audience = { kind, studentId, classId, unitId, contact, staff };
  const recipients = useMemo(
    () => buildRecipients(audience, students, classes, userAccounts, schoolUnits),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kind, studentId, classId, unitId, contact, staff, students, classes, userAccounts, schoolUnits]
  );
  const withPhone = recipients.filter((r) => r.phone);
  const withoutPhone = recipients.filter((r) => !r.phone);
  const previewText = fillMessage(body, withPhone[0] || recipients[0] || null, school);
  const pendingVars = missingVariables(previewText);

  // Cobertura de telefones (ajuda a secretaria a completar os cadastros).
  const coverage = useMemo(() => {
    const total = activeStudents.length;
    const ok = activeStudents.filter((s) => normalizeWhatsAppPhone(s.guardianPhone)).length;
    const staffList = userAccounts.filter((u) => u && u.active !== false && !['ALUNO', 'RESPONSAVEL'].includes(String(u.sector)));
    const staffOk = staffList.filter((u) => normalizeWhatsAppPhone(u.phone)).length;
    return { total, ok, staffTotal: staffList.length, staffOk };
  }, [activeStudents, userAccounts]);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(''), 5000);
  };

  const applyTemplate = (tpl: WhatsAppTemplate) => {
    setMessageType(tpl.type);
    setBody(tpl.body);
    if (!title) setTitle(tpl.title);
  };

  const audienceReady =
    (kind === 'ALUNO' && !!studentId) || (kind === 'TURMA' && !!classId) || kind === 'ESCOLA' || kind === 'PROFISSIONAIS';

  // Motivo de o botão "Preparar envio" estar desativado (mostrado logo abaixo dele).
  const prepareBlockedReason = !audienceReady
    ? kind === 'ALUNO'
      ? 'Escolha o aluno em "1. Para quem".'
      : 'Escolha a turma em "1. Para quem".'
    : recipients.length === 0
    ? 'Nenhum destinatário encontrado para essa escolha.'
    : withPhone.length === 0
    ? kind === 'PROFISSIONAIS'
      ? 'Nenhum profissional dessa escolha tem telefone. Cadastre o telefone em Usuários & Permissões.'
      : `Nenhum ${contact === 'ALUNO' ? 'aluno' : 'responsável'} dessa escolha tem telefone. Cadastre o telefone no cadastro do aluno.`
    : !body.trim()
    ? 'Escreva a mensagem ou escolha um modelo em "2. Mensagem".'
    : pendingVars.length > 0
    ? `Troque no texto: ${pendingVars.join(', ')}.`
    : '';

  const prepare = () => {
    if (!body.trim() || withPhone.length === 0) return;
    setSession({
      batchId: `lote-${Date.now().toString(36)}`,
      title: title.trim() || TYPE_LABEL[messageType] || 'Mensagem',
      messageType,
      source,
      rows: withPhone.map((r) => ({ recipient: r, text: fillMessage(body, r, school), opened: false })),
      withoutPhone,
    });
  };

  const logFor = (
    r: Recipient,
    text: string,
    status: 'ENVIADO' | 'FILA',
    meta: { batchId: string; title: string; messageType: WhatsAppMessageType; source: 'MANUAL' | 'MURAL' }
  ): Omit<WhatsAppMessageLog, 'id' | 'sentAt'> => ({
    recipientName: r.name,
    recipientPhone: r.phone,
    recipientRole: r.role,
    messageType: meta.messageType,
    content: text,
    studentId: r.studentIds[0],
    studentName: r.studentNames.length ? r.studentNames.join(', ') : undefined,
    studentClass: r.className,
    status,
    operatorName: operator,
    source: meta.source,
    batchId: meta.batchId,
    title: meta.title,
  });

  const openRow = (idx: number) => {
    if (!session) return;
    const row = session.rows[idx];
    if (!row) return;
    const ok = openWhatsApp(row.recipient.phone, row.text, openMode);
    if (!ok) {
      flash('O navegador bloqueou a janela do WhatsApp. Permita pop-ups para este site e tente de novo.');
      return;
    }
    if (!row.opened) onSendMessage(logFor(row.recipient, row.text, 'ENVIADO', session));
    setSession({ ...session, rows: session.rows.map((r, i) => (i === idx ? { ...r, opened: true } : r)) });
  };

  const nextIdx = session ? session.rows.findIndex((r) => !r.opened) : -1;
  const openedCount = session ? session.rows.filter((r) => r.opened).length : 0;

  const saveRestToQueue = () => {
    if (!session) return;
    const rest = session.rows.filter((r) => !r.opened);
    rest.forEach((r) => onSendMessage(logFor(r.recipient, r.text, 'FILA', session)));
    setSession(null);
    flash(`${rest.length} mensagem(ns) guardada(s) em "Aguardando envio".`);
  };

  const finishSession = () => {
    if (!session) return;
    const rest = session.rows.filter((r) => !r.opened).length;
    if (rest > 0 && !window.confirm(`Ainda faltam ${rest} mensagem(ns) sem abrir. Encerrar mesmo assim? (Use "Guardar o restante" para continuar depois.)`)) return;
    setSession(null);
    flash(`Envio encerrado: ${openedCount} conversa(s) aberta(s) no WhatsApp.`);
  };

  // ---------------- Fila (avisos automáticos e restantes) ----------------
  const [queueFilter, setQueueFilter] = useState<string>('ALL');
  const queueShown = queue
    .filter((l) => queueFilter === 'ALL' || (l.source || 'MANUAL') === queueFilter)
    .sort((a, b) => String(a.createdAt || a.sentAt).localeCompare(String(b.createdAt || b.sentAt)));

  const openQueued = (l: WhatsAppMessageLog) => {
    const phone = normalizeWhatsAppPhone(l.recipientPhone);
    if (!phone) return;
    const ok = openWhatsApp(phone, l.content, openMode);
    if (!ok) {
      flash('O navegador bloqueou a janela do WhatsApp. Permita pop-ups para este site e tente de novo.');
      return;
    }
    onUpdateLogs?.([l.id], { status: 'ENVIADO', sentAt: new Date().toISOString(), operatorName: operator });
  };
  const discardQueued = (ids: string[]) => {
    if (!ids.length) return;
    onUpdateLogs?.(ids, { status: 'DESCARTADO', operatorName: operator });
  };

  // ---------------- Histórico ----------------
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const historyShown = history
    .filter((l) => {
      const q = search.trim().toLowerCase();
      const hit =
        !q ||
        (l.recipientName || '').toLowerCase().includes(q) ||
        (l.recipientPhone || '').includes(q) ||
        (l.studentName || '').toLowerCase().includes(q) ||
        (l.content || '').toLowerCase().includes(q);
      return hit && (statusFilter === 'ALL' || l.status === statusFilter);
    })
    .sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt)));

  // ---------------- Modelos ----------------
  const [editingTpl, setEditingTpl] = useState<WhatsAppTemplate | null>(null);

  const tabBtn = (id: SubTab, label: string, Icon: React.ElementType, badge?: number) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer ${
        tab === id ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`px-1.5 rounded-full text-[10px] ${tab === id ? 'bg-white/25' : 'bg-amber-100 text-amber-800'}`}>{badge}</span>
      )}
    </button>
  );

  const selectCls = 'w-full py-2 px-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden';

  return (
    <div className="space-y-5">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 text-slate-500" /> Voltar ao Painel Principal
        </button>
      )}

      {/* Cabeçalho */}
      <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
            <MessageSquare className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Central de WhatsApp</h2>
            <p className="text-xs text-emerald-100/80 max-w-2xl leading-relaxed mt-1">
              Envio assistido: o sistema monta a lista e abre cada conversa com a mensagem pronta. Você confere e aperta
              <strong> Enviar</strong> no WhatsApp. Use o WhatsApp da escola, conectado neste computador.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 shrink-0 text-center">
          <div className="bg-white/10 rounded-2xl px-4 py-2.5 border border-white/15">
            <div className="text-lg font-black">
              {coverage.ok}
              <span className="text-xs font-semibold text-emerald-200"> / {coverage.total}</span>
            </div>
            <div className="text-[10px] text-emerald-100">alunos com WhatsApp do responsável</div>
          </div>
          <div className="bg-white/10 rounded-2xl px-4 py-2.5 border border-white/15">
            <div className="text-lg font-black">
              {coverage.staffOk}
              <span className="text-xs font-semibold text-emerald-200"> / {coverage.staffTotal}</span>
            </div>
            <div className="text-[10px] text-emerald-100">profissionais com telefone</div>
          </div>
        </div>
      </div>

      {coverage.total > 0 && coverage.ok / coverage.total < 0.8 && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Só {coverage.ok} de {coverage.total} alunos têm o WhatsApp do responsável cadastrado. Quem não tem telefone não recebe
            nada. Complete na <strong>Secretaria &amp; Alunos</strong> (campo "Telefone do responsável") ou reimporte a planilha com a coluna
            <strong> WhatsApp/Telefone</strong>. Telefones dos profissionais ficam em <strong>Usuários &amp; Permissões</strong>.
          </span>
        </div>
      )}

      {notice && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> <span className="font-semibold">{notice}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {tabBtn('ENVIAR', 'Enviar mensagem', Send)}
        {tabBtn('FILA', 'Aguardando envio', Inbox, queue.length)}
        {tabBtn('HISTORICO', `Histórico (${history.length})`, Clock)}
        {tabBtn('MODELOS', 'Modelos', FileText)}
        {tabBtn('AJUSTES', 'Ajustes', Settings2)}
      </div>

      {/* ========================= ENVIAR ========================= */}
      {tab === 'ENVIAR' && !session && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-slate-200 space-y-5">
            {/* 1. Para quem */}
            <section className="space-y-2.5">
              <h3 className="text-sm font-bold text-slate-900">1. Para quem</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    ['ALUNO', 'Um aluno'],
                    ['TURMA', 'Uma turma'],
                    ['ESCOLA', 'Escola inteira'],
                    ['PROFISSIONAIS', 'Profissionais'],
                  ] as Array<[AudienceKind, string]>
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer ${
                      kind === k ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-3">
                {kind === 'ALUNO' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Buscar aluno por nome ou matrícula"
                      className={selectCls}
                    />
                    <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={selectCls}>
                      <option value="">Selecione o aluno…</option>
                      {studentOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} — {classLabelWithSchool(classes.find((c) => c.id === s.classId), schoolUnits) || s.gradeLevel || 'sem turma'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {kind === 'TURMA' && (
                  <select value={classId} onChange={(e) => setClassId(e.target.value)} className={selectCls}>
                    <option value="">Selecione a turma…</option>
                    {sortedClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {classLabelWithSchool(c, schoolUnits)} ({studentsForAudience({ kind: 'TURMA', classId: c.id }, students, classes).length} alunos)
                      </option>
                    ))}
                  </select>
                )}
                {(kind === 'ESCOLA' || kind === 'PROFISSIONAIS') && schoolUnits.length > 0 && (
                  <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className={selectCls}>
                    <option value="">Todas as escolas</option>
                    {schoolUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                )}
                {kind !== 'PROFISSIONAIS' ? (
                  <div className="flex flex-wrap gap-3 text-xs text-slate-700">
                    <span className="font-semibold">Enviar para:</span>
                    {(
                      [
                        ['RESPONSAVEL', 'Responsável'],
                        ['ALUNO', 'Próprio aluno'],
                        ['AMBOS', 'Os dois'],
                      ] as Array<[StudentContact, string]>
                    ).map(([v, label]) => (
                      <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" checked={contact === v} onChange={() => setContact(v)} /> {label}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3 text-xs text-slate-700">
                    {(
                      [
                        ['PROFESSORES', 'Só professores'],
                        ['EQUIPE', 'Toda a equipe (direção, coordenação, secretaria e professores)'],
                      ] as Array<[StaffFilter, string]>
                    ).map(([v, label]) => (
                      <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" checked={staff === v} onChange={() => setStaff(v)} /> {label}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {audienceReady && (
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <strong>{recipients.length}</strong> destinatário(s): <span className="text-emerald-700 font-semibold">{withPhone.length} com WhatsApp</span>
                  {withoutPhone.length > 0 && <span className="text-rose-600 font-semibold">· {withoutPhone.length} sem telefone</span>}
                </p>
              )}
            </section>

            {/* 2. Mensagem */}
            <section className="space-y-2.5">
              <h3 className="text-sm font-bold text-slate-900">2. Mensagem</h3>
              <div className="flex flex-wrap gap-1.5">
                {effectiveTemplates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-[11px] font-semibold text-slate-700 cursor-pointer"
                    title={t.body}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Assunto (fica só no histórico, não vai na mensagem)"
                className={selectCls}
              />
              <textarea
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escreva a mensagem ou escolha um modelo acima."
                className="w-full p-3 rounded-2xl bg-white border border-slate-300 text-slate-800 text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
              <p className="text-[11px] text-slate-500">
                O sistema troca sozinho: <code>{'{{aluno}}'}</code> <code>{'{{responsavel}}'}</code> <code>{'{{nome}}'}</code>{' '}
                <code>{'{{turma}}'}</code> <code>{'{{escola}}'}</code> <code>{'{{telefone_escola}}'}</code> <code>{'{{data}}'}</code>. Para
                deixar em negrito no WhatsApp, use *asteriscos*.
              </p>
              {body.trim() && pendingVars.length > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    Troque no texto antes de enviar: <strong>{pendingVars.join(', ')}</strong>
                    {pendingVars.some((v) => v.includes('escola')) && ' (o nome e o telefone da escola vêm das Configurações da Escola).'}
                  </span>
                </div>
              )}
            </section>

            <button
              type="button"
              onClick={prepare}
              disabled={!audienceReady || !body.trim() || withPhone.length === 0 || pendingVars.length > 0}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ListChecks className="h-4 w-4" />
              {withPhone.length > 0 ? `Preparar envio (${withPhone.length} mensagem${withPhone.length > 1 ? 's' : ''})` : 'Preparar envio'}
            </button>
            {prepareBlockedReason && (
              <p role="status" className="-mt-1 text-xs font-semibold text-amber-700 flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{prepareBlockedReason}</span>
              </p>
            )}
          </div>

          {/* Prévia */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#e5ddd5] rounded-3xl p-4 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-600 mb-2">
                Prévia {withPhone[0] ? `— ${withPhone[0].name}` : ''}
              </div>
              <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm p-3 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap shadow-xs">
                {previewText || 'A mensagem aparece aqui como o destinatário vai ler.'}
              </div>
            </div>
            <div className="bg-sky-50 rounded-3xl p-4 border border-sky-100 text-xs text-slate-700 space-y-1.5">
              <div className="font-bold text-sky-900 flex items-center gap-1.5">
                <Info className="h-4 w-4" /> Como funciona
              </div>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Escolha para quem e escreva a mensagem.</li>
                <li>Clique em <strong>Preparar envio</strong>: aparece a lista com cada pessoa.</li>
                <li>Clique em <strong>Abrir próximo</strong>: o WhatsApp abre na conversa com o texto pronto.</li>
                <li>Confira e aperte <strong>Enviar</strong> no WhatsApp. Volte aqui e abra o próximo.</li>
              </ol>
              <p className="text-slate-500">Dica: para lotes grandes, envie aos poucos (por turma). Muitas mensagens seguidas podem fazer o WhatsApp limitar o número.</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de envio em andamento */}
      {tab === 'ENVIAR' && session && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">{session.title}</h3>
              <p className="text-xs text-slate-500">
                {openedCount} de {session.rows.length} aberta(s) no WhatsApp
                {session.withoutPhone.length > 0 && ` · ${session.withoutPhone.length} sem telefone`}
              </p>
              <div className="mt-2 h-2 w-64 max-w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${(openedCount / Math.max(1, session.rows.length)) * 100}%` }} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => nextIdx >= 0 && openRow(nextIdx)}
                disabled={nextIdx < 0}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <ExternalLink className="h-4 w-4" />
                {nextIdx >= 0 ? `Abrir próximo: ${session.rows[nextIdx].recipient.name}` : 'Todos abertos'}
              </button>
              {nextIdx >= 0 && (
                <button onClick={saveRestToQueue} className="py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer">
                  Guardar o restante para depois
                </button>
              )}
              <button onClick={finishSession} className="py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer">
                Encerrar
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
            {session.rows.map((row, i) => (
              <div key={row.recipient.key} className={`px-5 py-2.5 flex items-center gap-3 ${i === nextIdx ? 'bg-emerald-50/60' : ''}`}>
                <span className="w-6 text-[11px] text-slate-400 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{row.recipient.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {formatPhoneBR(row.recipient.phone)}
                    {row.recipient.studentNames.length > 0 && row.recipient.role !== 'ALUNO' && ` · ${row.recipient.studentNames.join(', ')}`}
                    {row.recipient.className && ` · ${row.recipient.className}`}
                  </div>
                </div>
                {row.opened ? (
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Aberto
                  </span>
                ) : null}
                <button
                  onClick={() => openRow(i)}
                  className="py-1.5 px-3 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-[11px] font-bold cursor-pointer"
                >
                  {row.opened ? 'Abrir de novo' : 'Abrir WhatsApp'}
                </button>
              </div>
            ))}
          </div>
          {session.withoutPhone.length > 0 && (
            <div className="p-4 bg-rose-50 border-t border-rose-100">
              <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5 mb-1.5">
                <PhoneOff className="h-4 w-4" /> Sem WhatsApp cadastrado ({session.withoutPhone.length}) — avise de outra forma e complete o cadastro:
              </div>
              <div className="text-[11px] text-rose-900 leading-relaxed">
                {session.withoutPhone
                  .map((r) => (r.role === 'RESPONSAVEL' || r.role === 'ALUNO' ? `${r.studentNames.join(', ')}${r.className ? ` (${r.className})` : ''}` : r.name))
                  .join(' · ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================= FILA ========================= */}
      {tab === 'FILA' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Aguardando envio</h3>
              <p className="text-xs text-slate-500">
                Avisos gerados quando o professor lança faltas ou notas (conforme os Ajustes) e envios guardados para depois.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={queueFilter} onChange={(e) => setQueueFilter(e.target.value)} className="py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs">
                <option value="ALL">Todas as origens</option>
                <option value="FALTA">Faltas</option>
                <option value="NOTA">Notas</option>
                <option value="MURAL">Mural</option>
                <option value="MANUAL">Envio manual</option>
              </select>
              {queueShown.some((l) => normalizeWhatsAppPhone(l.recipientPhone)) && (
                <button
                  onClick={() => {
                    const first = queueShown.find((l) => normalizeWhatsAppPhone(l.recipientPhone));
                    if (first) openQueued(first);
                  }}
                  className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" /> Abrir próxima
                </button>
              )}
              {queueShown.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm(`Descartar ${queueShown.length} mensagem(ns) da lista? Elas não serão enviadas.`)) discardQueued(queueShown.map((l) => l.id));
                  }}
                  className="py-2 px-3 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Descartar todas
                </button>
              )}
            </div>
          </div>
          {queueShown.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-400">Nada aguardando envio.</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[65vh] overflow-y-auto">
              {queueShown.map((l) => {
                const phone = normalizeWhatsAppPhone(l.recipientPhone);
                return (
                  <div key={l.id} className="px-5 py-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900">
                        {l.recipientName}
                        {l.studentName && <span className="font-normal text-slate-500"> · {l.studentName}</span>}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {SOURCE_LABEL[l.source || 'MANUAL']} · {fmtDateTime(l.createdAt || l.sentAt)} ·{' '}
                        {phone ? formatPhoneBR(phone) : <span className="text-rose-600 font-semibold">sem telefone</span>}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2" title={l.content}>
                        {l.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {phone && (
                        <button onClick={() => openQueued(l)} className="py-1.5 px-3 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-[11px] font-bold cursor-pointer">
                          Abrir WhatsApp
                        </button>
                      )}
                      <button onClick={() => discardQueued([l.id])} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title="Descartar">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================= HISTÓRICO ========================= */}
      {tab === 'HISTORICO' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Histórico de envios</h3>
              <p className="text-xs text-slate-500">"Aberto no WhatsApp" = a conversa foi aberta com o texto pronto por quem está indicado.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar nome, aluno, telefone…"
                  className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs w-60"
                />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs">
                <option value="ALL">Todos</option>
                <option value="ENVIADO">Aberto no WhatsApp</option>
                <option value="DESCARTADO">Descartado</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Destinatário</th>
                  <th className="py-2.5 px-4">Aluno / Turma</th>
                  <th className="py-2.5 px-4">Tipo</th>
                  <th className="py-2.5 px-4">Mensagem</th>
                  <th className="py-2.5 px-4">Data</th>
                  <th className="py-2.5 px-4">Situação</th>
                  <th className="py-2.5 px-4">Quem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyShown.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Nenhum envio registrado.
                    </td>
                  </tr>
                ) : (
                  historyShown.slice(0, 500).map((l) => {
                    const st = STATUS_LABEL[l.status] || STATUS_LABEL.ENVIADO;
                    return (
                      <tr key={l.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900">{l.recipientName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{l.recipientPhone ? formatPhoneBR(normalizeWhatsAppPhone(l.recipientPhone) || l.recipientPhone) : '—'}</div>
                        </td>
                        <td className="py-2.5 px-4">
                          {l.studentName ? (
                            <>
                              <div className="font-semibold text-indigo-900">{l.studentName}</div>
                              <div className="text-[10px] text-slate-400">{l.studentClass}</div>
                            </>
                          ) : (
                            <span className="text-slate-400">Equipe</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {TYPE_LABEL[l.messageType] || l.messageType}
                          <div className="text-[10px] text-slate-400">{SOURCE_LABEL[l.source || 'MANUAL']}</div>
                        </td>
                        <td className="py-2.5 px-4 max-w-xs">
                          <p className="truncate" title={l.content}>
                            {l.content}
                          </p>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap text-[11px] text-slate-500">{fmtDateTime(l.sentAt)}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${st.cls}`}>{st.text}</span>
                        </td>
                        <td className="py-2.5 px-4 text-[11px] text-slate-500">{l.operatorName}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================= MODELOS ========================= */}
      {tab === 'MODELOS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500 max-w-2xl">
              Modelos prontos para usar no envio. Use as variáveis <code>{'{{aluno}}'}</code>, <code>{'{{responsavel}}'}</code>,{' '}
              <code>{'{{turma}}'}</code>, <code>{'{{escola}}'}</code>, <code>{'{{telefone_escola}}'}</code> e <code>{'{{data}}'}</code>. Outras
              marcações (ex.: <code>{'{{horario}}'}</code>) precisam ser trocadas à mão antes de enviar.
            </p>
            <button
              onClick={() =>
                setEditingTpl({ id: `tpl-${Date.now()}`, title: 'Novo modelo', type: 'AVISO_GERAL', body: 'Olá, {{responsavel}}! ', variables: [] })
              }
              className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" /> Novo modelo
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {effectiveTemplates.map((tpl) => (
              <div key={tpl.id} className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {TYPE_LABEL[tpl.type] || tpl.type}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditingTpl(tpl)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer" title="Editar">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => window.confirm(`Excluir o modelo "${tpl.title}"?`) && onDeleteTemplate(tpl.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{tpl.title}</h4>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 whitespace-pre-wrap">{tpl.body}</p>
                <button
                  onClick={() => {
                    applyTemplate(tpl);
                    setTab('ENVIAR');
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Usar este modelo →
                </button>
              </div>
            ))}
          </div>

          {editingTpl && (
            <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50" onClick={() => setEditingTpl(null)}>
              <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-3" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-base font-bold text-slate-900">Modelo de mensagem</h3>
                <input
                  value={editingTpl.title}
                  onChange={(e) => setEditingTpl({ ...editingTpl, title: e.target.value })}
                  placeholder="Nome do modelo"
                  className={selectCls}
                />
                <select value={editingTpl.type} onChange={(e) => setEditingTpl({ ...editingTpl, type: e.target.value as WhatsAppMessageType })} className={selectCls}>
                  {Object.entries(TYPE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <textarea
                  rows={6}
                  value={editingTpl.body}
                  onChange={(e) => setEditingTpl({ ...editingTpl, body: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingTpl(null)} className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      if (!editingTpl.title.trim() || !editingTpl.body.trim()) return;
                      onSaveTemplate({ ...editingTpl, variables: missingVariables(editingTpl.body) });
                      setEditingTpl(null);
                    }}
                    className="py-2 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                  >
                    Salvar modelo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================= AJUSTES ========================= */}
      {tab === 'AJUSTES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Onde abrir o WhatsApp</h3>
            {(
              [
                ['WEB', 'WhatsApp Web (navegador)', 'Abre web.whatsapp.com sempre na mesma aba. Precisa estar conectado com o QR Code do celular da escola.'],
                ['APP', 'Aplicativo WhatsApp do computador', 'Abre o WhatsApp instalado no Windows. Mais rápido para lotes grandes.'],
              ] as Array<[OpenMode, string, string]>
            ).map(([m, label, desc]) => (
              <label key={m} className={`flex gap-3 p-3 rounded-xl border cursor-pointer ${openMode === m ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
                <input
                  type="radio"
                  checked={openMode === m}
                  onChange={() => {
                    setOpenMode(m);
                    saveOpenMode(m);
                  }}
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">{label}</div>
                  <div className="text-[11px] text-slate-500">{desc}</div>
                </div>
              </label>
            ))}
            <p className="text-[11px] text-slate-500">Essa escolha vale para este computador.</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Avisos automáticos para a lista "Aguardando envio"</h3>
            <label className="flex gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={effectiveConfig.queueAbsenceAlerts !== false}
                onChange={(e) => onUpdateConfig({ ...effectiveConfig, queueAbsenceAlerts: e.target.checked })}
              />
              <div>
                <div className="text-xs font-bold text-slate-800">Faltas</div>
                <div className="text-[11px] text-slate-500">Quando o professor salva a chamada, cada falta gera uma mensagem ao responsável.</div>
              </div>
            </label>
            <label className="flex gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={effectiveConfig.queueGradeAlerts === true}
                onChange={(e) => onUpdateConfig({ ...effectiveConfig, queueGradeAlerts: e.target.checked })}
              />
              <div>
                <div className="text-xs font-bold text-slate-800">Notas</div>
                <div className="text-[11px] text-slate-500">
                  Quando o professor fecha a pauta, gera uma mensagem por aluno e disciplina. Desligado por padrão: pode gerar muitas mensagens.
                </div>
              </div>
            </label>
            <p className="text-[11px] text-slate-500">
              Os avisos não saem sozinhos: ficam em "Aguardando envio" para a secretaria conferir e abrir no WhatsApp.
            </p>
          </div>

          <div className="md:col-span-2 bg-slate-50 rounded-3xl p-5 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800">Dados da escola usados nas mensagens</div>
            <div>
              Nome: <strong>{schoolName || '— não informado'}</strong> · Telefone: <strong>{schoolPhone || '— não informado'}</strong>
            </div>
            <div className="text-[11px] text-slate-500">Para mudar, use Configurações da Escola.</div>
          </div>
        </div>
      )}
    </div>
  );
};
