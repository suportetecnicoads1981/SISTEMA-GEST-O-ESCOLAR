import React, { useMemo, useState } from 'react';
import {
  FileClock,
  Plus,
  Search,
  Printer,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageCircle,
  FileText,
  User,
  Building2,
  History,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  StickyNote,
  Ban,
  PackageCheck,
  Hourglass,
  Inbox,
} from 'lucide-react';
import type {
  ProtocolChannel,
  ProtocolRequest,
  ProtocolRequesterRelation,
  ProtocolStatus,
  SchoolClass,
  SchoolUnit,
  Student,
  UserAccount,
} from '../../types';
import {
  PROTOCOL_CHANNEL_LABEL,
  PROTOCOL_DOCUMENT_TYPES,
  PROTOCOL_RELATION_LABEL,
  PROTOCOL_STATUSES,
  PROTOCOL_STATUS_LABEL,
  PROTOCOL_STATUS_STYLE,
  addDays,
  addProtocolNote,
  createProtocol,
  filterProtocols,
  formatDateBr,
  formatDateTimeBr,
  isFinalStatus,
  isOverdue,
  localIsoDate,
  moveProblem,
  moveProtocol,
  nextStatuses,
  protocolInputProblem,
  sortProtocols,
  DEFAULT_DUE_DAYS,
  type ProtocolFilters,
} from '../../services/protocols/protocolService';
import { triggerPrint } from '../../utils/printHelper';
import { ConfigurablePrintModal, type PrintColumnConfig } from '../common/ConfigurablePrintModal';
import { moduleName } from '../../config/moduleNames';
import { formatPersonName } from '../../services/documentBranding';

interface ProtocolModuleProps {
  protocols: ProtocolRequest[];
  students: Student[];
  classes: SchoolClass[];
  schoolUnits: SchoolUnit[];
  currentUser: UserAccount | null | undefined;
  /** Escola de lotação do usuário (lotado só registra protocolos da escola dele). */
  scopeUnitId?: string | null;
  canCreate: boolean;
  canEdit: boolean;
  /** Inclui ou atualiza o protocolo. */
  onSave: (p: ProtocolRequest) => void;
}

const PAGE = 50;

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const fold = (v: unknown) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const STATUS_ICON: Record<ProtocolStatus, React.ComponentType<{ className?: string }>> = {
  ABERTO: Inbox,
  EM_ANDAMENTO: Hourglass,
  PRONTO: PackageCheck,
  ENTREGUE: CheckCircle2,
  CANCELADO: Ban,
};

const StatusBadge: React.FC<{ p: ProtocolRequest }> = ({ p }) => {
  const Icon = STATUS_ICON[p.status];
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold ${PROTOCOL_STATUS_STYLE[p.status]}`}>
        <Icon className="h-3 w-3" />
        {PROTOCOL_STATUS_LABEL[p.status]}
      </span>
      {isOverdue(p) && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold bg-rose-50 text-rose-700 border-rose-200">
          <AlertTriangle className="h-3 w-3" />
          Atrasado
        </span>
      )}
    </span>
  );
};

/** Telefone para o link do WhatsApp (com DDI 55 quando faltar). */
function waPhone(phone?: string): string {
  const d = String(phone || '').replace(/\D/g, '');
  if (d.length < 10) return '';
  return d.startsWith('55') && d.length >= 12 ? d : `55${d}`;
}

export const ProtocolModule: React.FC<ProtocolModuleProps> = ({
  protocols,
  students,
  classes,
  schoolUnits,
  currentUser,
  scopeUnitId,
  canCreate,
  canEdit,
  onSave,
}) => {
  const actor = { id: String(currentUser?.id || 'desconhecido'), name: formatPersonName(currentUser?.name) || 'Usuário' };
  const unitName = (id?: string) => schoolUnits.find((u) => u.id === id)?.name || '';
  const today = localIsoDate(new Date());

  // ---------------- Filtros ----------------
  const [filters, setFilters] = useState<ProtocolFilters>({ status: 'ALL', schoolUnitId: 'ALL', documentType: 'ALL', createdBy: 'ALL' });
  const [page, setPage] = useState(0);
  const setFilter = (patch: Partial<ProtocolFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(0);
  };
  const clearFilters = () => {
    setFilters({ status: 'ALL', schoolUnitId: 'ALL', documentType: 'ALL', createdBy: 'ALL', search: '', from: '', to: '' });
    setPage(0);
  };

  const all = useMemo(() => sortProtocols(protocols || []), [protocols]);
  const filtered = useMemo(() => filterProtocols(all, filters, today), [all, filters, today]);
  const pageRows = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));

  const counts = useMemo(() => {
    const c: Record<string, number> = { ABERTO: 0, EM_ANDAMENTO: 0, PRONTO: 0, ENTREGUE: 0, CANCELADO: 0, OVERDUE: 0 };
    for (const p of all) {
      c[p.status] = (c[p.status] || 0) + 1;
      if (isOverdue(p, today)) c.OVERDUE++;
    }
    return c;
  }, [all, today]);

  const schoolOptions = useMemo(() => {
    const ids = new Set(all.map((p) => p.schoolUnitId).filter(Boolean) as string[]);
    return schoolUnits.filter((u) => ids.has(u.id)).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [all, schoolUnits]);
  const userOptions = useMemo(() => {
    const m = new Map<string, string>();
    all.forEach((p) => m.set(p.createdByUserId, p.createdByName));
    return Array.from(m.entries()).sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));
  }, [all]);

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.status !== 'ALL' ? 1 : 0) +
    (filters.schoolUnitId !== 'ALL' ? 1 : 0) +
    (filters.documentType !== 'ALL' ? 1 : 0) +
    (filters.createdBy !== 'ALL' ? 1 : 0) +
    (filters.from ? 1 : 0) +
    (filters.to ? 1 : 0);

  // ---------------- Novo protocolo ----------------
  const [newOpen, setNewOpen] = useState(false);
  const [justCreated, setJustCreated] = useState<ProtocolRequest | null>(null);

  // ---------------- Detalhe / movimentação ----------------
  const [openId, setOpenId] = useState<string | null>(null);
  const opened = openId ? all.find((p) => p.id === openId) || null : null;

  // ---------------- Relatório ----------------
  const [reportOpen, setReportOpen] = useState(false);

  // ---------------- Comprovante ----------------
  const printReceipt = (p: ProtocolRequest) => {
    const school = unitName(p.schoolUnitId);
    const row = (k: string, v?: string) =>
      v ? `<tr><td style="padding:5px 8px;border:1px solid #cbd5e1;width:32%;background:#f8fafc;font-weight:bold">${esc(k)}</td><td style="padding:5px 8px;border:1px solid #cbd5e1">${esc(v)}</td></tr>` : '';
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:12px">
        <h3 style="text-align:center;margin:4px 0 2px;font-size:15px">COMPROVANTE DE SOLICITAÇÃO</h3>
        <p style="text-align:center;margin:0 0 10px;color:#475569">Guarde este comprovante para acompanhar o pedido na secretaria da escola.</p>
        <div style="text-align:center;margin:8px auto 14px;padding:10px;border:2px dashed #0f172a;width:60%">
          <div style="font-size:11px;color:#475569">PROTOCOLO Nº</div>
          <div style="font-size:24px;font-weight:bold;letter-spacing:2px;font-family:'Courier New',monospace">${esc(p.number)}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          ${row('Data da solicitação', formatDateTimeBr(p.createdAt))}
          ${row('Documento solicitado', p.documentType)}
          ${row('Detalhes', p.description)}
          ${row('Aluno(a)', p.studentName)}
          ${row('Matrícula (RA)', p.enrollmentNumber)}
          ${row('Turma', p.className)}
          ${row('Escola', school)}
          ${row('Solicitante', `${p.requesterName} (${PROTOCOL_RELATION_LABEL[p.requesterRelation]})`)}
          ${row('Telefone', p.requesterPhone)}
          ${row('Previsão de entrega', formatDateBr(p.dueDate))}
          ${row('Situação atual', PROTOCOL_STATUS_LABEL[p.status])}
          ${row('Atendido por', p.createdByName)}
        </table>
        <table style="width:100%;margin-top:46px;border-collapse:collapse"><tr>
          <td style="width:50%;text-align:center;padding:0 14px"><div style="border-top:1px solid #0f172a;padding-top:4px;font-weight:bold">${esc(p.createdByName)}</div><div>Assinatura do atendente</div></td>
          <td style="width:50%;text-align:center;padding:0 14px"><div style="border-top:1px solid #0f172a;padding-top:4px;font-weight:bold">${esc(p.requesterName)}</div><div>Assinatura do solicitante</div></td>
        </tr></table>
      </div>`;
    triggerPrint(html, { title: `Protocolo ${p.number}`, schoolUnitId: p.schoolUnitId });
  };

  // ---------------- Relatório (Painel de Impressão) ----------------
  const reportColumns: PrintColumnConfig[] = [
    { id: 'index', label: 'Nº', defaultVisible: true, align: 'center' },
    { id: 'number', label: 'Protocolo', defaultVisible: true },
    { id: 'createdAt', label: 'Data', defaultVisible: true },
    { id: 'studentName', label: 'Aluno(a)', defaultVisible: true },
    { id: 'enrollmentNumber', label: 'RA', defaultVisible: false },
    { id: 'className', label: 'Turma', defaultVisible: false },
    { id: 'documentType', label: 'Documento', defaultVisible: true },
    { id: 'requesterName', label: 'Solicitante', defaultVisible: true },
    { id: 'requesterRelation', label: 'Parentesco', defaultVisible: false },
    { id: 'requesterPhone', label: 'Telefone', defaultVisible: false },
    { id: 'status', label: 'Situação', defaultVisible: true },
    { id: 'dueDate', label: 'Prazo', defaultVisible: true },
    { id: 'createdByName', label: 'Registrado por', defaultVisible: true },
    { id: 'deliveredAt', label: 'Entregue em', defaultVisible: false },
    { id: 'deliveredTo', label: 'Entregue a', defaultVisible: false },
  ];
  const reportCell = (p: ProtocolRequest, col: string): string => {
    switch (col) {
      case 'index':
        return '';
      case 'createdAt':
        return formatDateBr(p.createdAt);
      case 'status':
        return `${PROTOCOL_STATUS_LABEL[p.status]}${isOverdue(p, today) ? ' (atrasado)' : ''}`;
      case 'dueDate':
        return formatDateBr(p.dueDate);
      case 'deliveredAt':
        return formatDateBr(p.deliveredAt);
      case 'requesterRelation':
        return PROTOCOL_RELATION_LABEL[p.requesterRelation] || '';
      default:
        return String((p as any)[col] ?? '');
    }
  };
  const reportFilters = [
    filters.status && filters.status !== 'ALL'
      ? { label: 'Situação', value: filters.status === 'OVERDUE' ? 'Atrasados' : filters.status === 'OPEN_ANY' ? 'Em aberto' : PROTOCOL_STATUS_LABEL[filters.status as ProtocolStatus] }
      : null,
    filters.schoolUnitId && filters.schoolUnitId !== 'ALL' ? { label: 'Escola', value: unitName(filters.schoolUnitId) } : null,
    filters.documentType && filters.documentType !== 'ALL' ? { label: 'Documento', value: filters.documentType } : null,
    filters.createdBy && filters.createdBy !== 'ALL' ? { label: 'Registrado por', value: userOptions.find(([id]) => id === filters.createdBy)?.[1] || '' } : null,
    filters.search ? { label: 'Busca (aluno, responsável ou nº)', value: filters.search } : null,
    filters.from || filters.to ? { label: 'Período', value: `${formatDateBr(filters.from) || '...'} a ${formatDateBr(filters.to) || '...'}` } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const KPI: { key: ProtocolFilters['status']; label: string; value: number; tone: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'ABERTO', label: 'Abertos', value: counts.ABERTO, tone: 'sky', icon: Inbox },
    { key: 'EM_ANDAMENTO', label: 'Em andamento', value: counts.EM_ANDAMENTO, tone: 'amber', icon: Hourglass },
    { key: 'PRONTO', label: 'Prontos para entrega', value: counts.PRONTO, tone: 'violet', icon: PackageCheck },
    { key: 'OVERDUE', label: 'Atrasados', value: counts.OVERDUE, tone: 'rose', icon: AlertTriangle },
    { key: 'ENTREGUE', label: 'Entregues', value: counts.ENTREGUE, tone: 'emerald', icon: CheckCircle2 },
    { key: 'CANCELADO', label: 'Cancelados', value: counts.CANCELADO, tone: 'slate', icon: Ban },
  ];
  const toneClass: Record<string, string> = {
    sky: 'border-sky-200 bg-sky-50/60 text-sky-900',
    amber: 'border-amber-200 bg-amber-50/60 text-amber-900',
    violet: 'border-violet-200 bg-violet-50/60 text-violet-900',
    rose: 'border-rose-200 bg-rose-50/60 text-rose-900',
    emerald: 'border-emerald-200 bg-emerald-50/60 text-emerald-900',
    slate: 'border-slate-200 bg-slate-50 text-slate-800',
  };

  const inputCls = 'w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500';

  return (
    <div className="space-y-4" data-testid="protocol-module">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-700 rounded-2xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-white/15 rounded-xl">
            <FileClock className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{moduleName('PROTOCOLS')}</h2>
            <p className="text-xs text-teal-50/90 max-w-2xl mt-0.5">
              Registre cada pedido de documento (declaração, histórico, boletim...) com número de protocolo, acompanhe a
              situação até a entrega e tire relatórios por situação, aluno, escola, usuário ou responsável.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canCreate && (
            <button
              type="button"
              onClick={() => {
                setJustCreated(null);
                setNewOpen(true);
              }}
              className="px-3 py-2 bg-white text-teal-800 hover:bg-teal-50 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Novo Protocolo
            </button>
          )}
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            disabled={!filtered.length}
            className="px-3 py-2 bg-teal-900/40 hover:bg-teal-900/60 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Relatório dos protocolos da lista, com os filtros aplicados (imprimir, PDF, Excel, Word ou CSV)"
          >
            <BarChart3 className="h-4 w-4" />
            Relatório ({filtered.length})
          </button>
        </div>
      </div>

      {/* Indicadores (clique para filtrar) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPI.map((k) => {
          const Icon = k.icon;
          const active = filters.status === k.key;
          return (
            <button
              key={String(k.key)}
              type="button"
              onClick={() => setFilter({ status: active ? 'ALL' : k.key })}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${toneClass[k.tone]} ${active ? 'ring-2 ring-offset-1 ring-teal-500' : 'hover:shadow-sm'}`}
              title={`Mostrar só: ${k.label}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold">{k.label}</span>
                <Icon className="h-4 w-4 opacity-70" />
              </div>
              <p className="text-2xl font-black mt-1">{k.value}</p>
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2">
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={filters.search || ''}
              onChange={(e) => setFilter({ search: e.target.value })}
              placeholder="Buscar pelo número do protocolo, aluno, RA, responsável ou documento..."
              className={`${inputCls} pl-9`}
            />
          </div>
          <select value={String(filters.status)} onChange={(e) => setFilter({ status: e.target.value as any })} className={`${inputCls} lg:w-48`} title="Situação">
            <option value="ALL">Todas as situações</option>
            <option value="OPEN_ANY">Em aberto (não entregues)</option>
            {PROTOCOL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROTOCOL_STATUS_LABEL[s]}
              </option>
            ))}
            <option value="OVERDUE">Atrasados</option>
          </select>
          {!scopeUnitId && schoolOptions.length > 1 && (
            <select value={String(filters.schoolUnitId)} onChange={(e) => setFilter({ schoolUnitId: e.target.value })} className={`${inputCls} lg:w-56`} title="Escola">
              <option value="ALL">Todas as escolas</option>
              {schoolOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
          <select value={String(filters.documentType)} onChange={(e) => setFilter({ documentType: e.target.value })} className={`${inputCls} lg:w-56`} title="Documento">
            <option value="ALL">Todos os documentos</option>
            {PROTOCOL_DOCUMENT_TYPES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select value={String(filters.createdBy)} onChange={(e) => setFilter({ createdBy: e.target.value })} className={`${inputCls} lg:w-56`} title="Usuário que registrou">
            <option value="ALL">Registrado por: todos</option>
            {userOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-[11px] text-slate-600">
            De
            <input type="date" value={filters.from || ''} onChange={(e) => setFilter({ from: e.target.value })} className={`${inputCls} w-36`} />
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-slate-600">
            até
            <input type="date" value={filters.to || ''} onChange={(e) => setFilter({ to: e.target.value })} className={`${inputCls} w-36`} />
          </label>
          {activeFilterCount > 0 && (
            <button type="button" onClick={clearFilters} className="px-2.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 cursor-pointer">
              <RotateCcw className="h-3.5 w-3.5" />
              Limpar filtros ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <FileClock className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">
              {all.length ? 'Nenhum protocolo com estes filtros' : 'Nenhum protocolo registrado ainda'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {all.length
                ? 'Mude os filtros ou clique em "Limpar filtros".'
                : canCreate
                  ? 'Quando alguém pedir um documento, clique em "Novo Protocolo" para registrar e informar o número ao solicitante.'
                  : 'Seu perfil pode consultar os protocolos, mas não registrar novos.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  <th className="p-3">Protocolo</th>
                  <th className="p-3">Aluno / Escola</th>
                  <th className="p-3">Documento</th>
                  <th className="p-3">Solicitante</th>
                  <th className="p-3">Situação</th>
                  <th className="p-3">Prazo</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((p) => (
                  <tr key={p.id} className="hover:bg-teal-50/40 cursor-pointer" onClick={() => setOpenId(p.id)}>
                    <td className="p-3">
                      <div className="font-mono font-bold text-slate-900">{p.number}</div>
                      <div className="text-[11px] text-slate-500">{formatDateTimeBr(p.createdAt)}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{p.studentName}</div>
                      <div className="text-[11px] text-slate-500">
                        {[p.enrollmentNumber, unitName(p.schoolUnitId)].filter(Boolean).join(' • ')}
                      </div>
                    </td>
                    <td className="p-3 text-slate-700">{p.documentType}</td>
                    <td className="p-3">
                      <div className="text-slate-800">{p.requesterName}</div>
                      <div className="text-[11px] text-slate-500">{PROTOCOL_RELATION_LABEL[p.requesterRelation]}</div>
                    </td>
                    <td className="p-3">
                      <StatusBadge p={p} />
                    </td>
                    <td className="p-3 text-slate-700">{formatDateBr(p.dueDate)}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenId(p.id);
                        }}
                        className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[11px] rounded-lg cursor-pointer"
                      >
                        {canEdit && !isFinalStatus(p.status) ? 'Movimentar' : 'Ver'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > PAGE && (
          <div className="flex items-center justify-between p-3 border-t border-slate-100 text-xs text-slate-600">
            <span>
              Exibindo {page * PAGE + 1} a {Math.min(filtered.length, (page + 1) * PAGE)} de {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button type="button" disabled={page === 0} onClick={() => setPage((v) => v - 1)} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 cursor-pointer">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-bold">
                {page + 1} / {pages}
              </span>
              <button type="button" disabled={page >= pages - 1} onClick={() => setPage((v) => v + 1)} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 cursor-pointer">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {newOpen && (
        <NewProtocolModal
          students={students}
          classes={classes}
          schoolUnits={schoolUnits}
          scopeUnitId={scopeUnitId}
          justCreated={justCreated}
          onClose={() => {
            setNewOpen(false);
            setJustCreated(null);
          }}
          onCreate={(input) => {
            const p = createProtocol(input, actor, all.map((x) => x.number));
            onSave(p);
            setJustCreated(p);
          }}
          onPrint={printReceipt}
          onNew={() => setJustCreated(null)}
        />
      )}

      {opened && (
        <ProtocolDetailModal
          key={`${opened.id}|${opened.status}|${(opened.history || []).length}`}
          p={opened}
          schoolName={unitName(opened.schoolUnitId)}
          canEdit={canEdit}
          onClose={() => setOpenId(null)}
          onMove={(to, note, deliveredTo) => onSave(moveProtocol(opened, to, actor, { note, deliveredTo }))}
          onNote={(note) => onSave(addProtocolNote(opened, note, actor))}
          onPrint={() => printReceipt(opened)}
        />
      )}

      <ConfigurablePrintModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Relatório de Protocolos & Solicitações"
        subtitle="Pedidos de documentos, situação e prazos"
        columns={reportColumns}
        data={filtered}
        appliedFilters={reportFilters}
        summaryMetrics={[
          { label: 'Protocolos', value: filtered.length },
          { label: 'Em aberto', value: filtered.filter((p) => !isFinalStatus(p.status)).length },
          { label: 'Atrasados', value: filtered.filter((p) => isOverdue(p, today)).length },
          { label: 'Entregues', value: filtered.filter((p) => p.status === 'ENTREGUE').length },
        ]}
        defaultOrientation="landscape"
        renderCell={(p: ProtocolRequest, col: string, rowIndex: number) => (col === 'index' ? String(rowIndex + 1) : reportCell(p, col))}
        fileName="Relatorio_Protocolos"
        countLabel="Total de protocolos nesta relação"
        groupBy={(p: ProtocolRequest) => ({
          key: p.schoolUnitId || '__sem_escola__',
          sortKey: unitName(p.schoolUnitId) || '~',
          schoolUnitId: p.schoolUnitId || undefined,
          lines: [['Escola', unitName(p.schoolUnitId) || 'Sem escola definida']],
        })}
      />
    </div>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Novo protocolo                                                                              */
/* ------------------------------------------------------------------------------------------ */

const NewProtocolModal: React.FC<{
  students: Student[];
  classes: SchoolClass[];
  schoolUnits: SchoolUnit[];
  scopeUnitId?: string | null;
  justCreated: ProtocolRequest | null;
  onClose: () => void;
  onCreate: (input: Parameters<typeof createProtocol>[0]) => void;
  onPrint: (p: ProtocolRequest) => void;
  onNew: () => void;
}> = ({ students, classes, schoolUnits, justCreated, onClose, onCreate, onPrint, onNew }) => {
  const [studentSearch, setStudentSearch] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [relation, setRelation] = useState<ProtocolRequesterRelation>('RESPONSAVEL');
  const [requesterName, setRequesterName] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');
  const [documentType, setDocumentType] = useState<string>(PROTOCOL_DOCUMENT_TYPES[0]);
  const [description, setDescription] = useState('');
  const [channel, setChannel] = useState<ProtocolChannel>('BALCAO');
  const [dueDate, setDueDate] = useState(addDays(localIsoDate(new Date()), DEFAULT_DUE_DAYS));
  const [error, setError] = useState('');

  const matches = useMemo(() => {
    const t = fold(studentSearch).trim();
    if (t.length < 2) return [];
    return students
      .filter((s) => fold(s.name).includes(t) || fold(s.enrollmentNumber).includes(t))
      .slice(0, 8);
  }, [students, studentSearch]);

  const classOf = (s?: Student | null) => (s ? classes.find((c) => c.id === s.classId) : undefined);
  const schoolOf = (s?: Student | null) => {
    if (!s) return undefined;
    const id = s.schoolUnitId || classOf(s)?.schoolUnitId;
    return schoolUnits.find((u) => u.id === id);
  };

  const pickStudent = (s: Student) => {
    setStudent(s);
    setStudentSearch('');
    setError('');
    // Responsável do cadastro do aluno já vem preenchido (pode ser alterado).
    if (relation === 'RESPONSAVEL') {
      setRequesterName(formatPersonName(s.guardianName) || s.guardianName || '');
      setRequesterPhone(s.guardianPhone || '');
    } else if (relation === 'ALUNO') {
      setRequesterName(formatPersonName(s.name) || s.name);
      setRequesterPhone(s.phone || '');
    }
  };

  const changeRelation = (r: ProtocolRequesterRelation) => {
    setRelation(r);
    if (!student) return;
    if (r === 'RESPONSAVEL') {
      setRequesterName(formatPersonName(student.guardianName) || student.guardianName || '');
      setRequesterPhone(student.guardianPhone || '');
    } else if (r === 'ALUNO') {
      setRequesterName(formatPersonName(student.name) || student.name);
      setRequesterPhone(student.phone || '');
    } else {
      setRequesterName('');
      setRequesterPhone('');
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = {
      schoolUnitId: schoolOf(student)?.id,
      studentId: student?.id,
      studentName: student?.name || '',
      enrollmentNumber: student?.enrollmentNumber,
      className: classOf(student)?.name,
      requesterName,
      requesterRelation: relation,
      requesterPhone,
      documentType,
      description,
      channel,
      dueDate,
    };
    const problem = protocolInputProblem(input);
    if (problem) {
      setError(problem);
      return;
    }
    onCreate(input);
  };

  const inputCls = 'w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500';
  const labelCls = 'block text-[11px] font-bold text-slate-700 mb-1';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-teal-600 flex items-center justify-center text-white">
              <FileClock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Novo Protocolo</h2>
              <p className="text-xs text-slate-500">Registre o pedido e informe o número ao solicitante</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        {justCreated ? (
          <div className="p-6 text-center space-y-4" data-testid="protocol-created">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <div>
              <p className="text-sm text-slate-600">Solicitação registrada. Informe ao solicitante o número do protocolo:</p>
              <p className="mt-2 text-3xl font-black font-mono tracking-widest text-slate-900">{justCreated.number}</p>
              <p className="mt-1 text-xs text-slate-500">
                {justCreated.documentType} • {justCreated.studentName} • previsão de entrega {formatDateBr(justCreated.dueDate)}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button type="button" onClick={() => onPrint(justCreated)} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer">
                <Printer className="h-4 w-4" />
                Imprimir comprovante
              </button>
              <button type="button" onClick={onNew} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer">
                <Plus className="h-4 w-4" />
                Registrar outro
              </button>
              <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-xl cursor-pointer">
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Aluno */}
            <div>
              <label className={labelCls}>Aluno(a) *</label>
              {student ? (
                <div className="flex items-center justify-between gap-2 p-3 rounded-xl border border-teal-200 bg-teal-50/60">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-teal-700" />
                      {student.name}
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="h-3 w-3" />
                      {[student.enrollmentNumber, classOf(student)?.name, schoolOf(student)?.name].filter(Boolean).join(' • ')}
                    </div>
                  </div>
                  <button type="button" onClick={() => setStudent(null)} className="text-[11px] font-bold text-teal-800 hover:underline cursor-pointer shrink-0">
                    Trocar
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    autoFocus
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Digite o nome ou o RA do aluno..."
                    className={`${inputCls} pl-9`}
                  />
                  {matches.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                      {matches.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => pickStudent(s)}
                          className="w-full text-left px-3 py-2 hover:bg-teal-50 border-b border-slate-100 last:border-0 cursor-pointer"
                        >
                          <div className="font-bold text-slate-900">{s.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {[s.enrollmentNumber, classOf(s)?.name, schoolOf(s)?.name].filter(Boolean).join(' • ')}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {fold(studentSearch).trim().length >= 2 && matches.length === 0 && (
                    <p className="text-[11px] text-slate-500 mt-1">Nenhum aluno encontrado com esse nome ou RA.</p>
                  )}
                </div>
              )}
            </div>

            {/* Documento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Documento solicitado *</label>
                <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className={inputCls}>
                  {PROTOCOL_DOCUMENT_TYPES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Previsão de entrega</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Detalhes do pedido {documentType === 'Outro documento' ? '*' : '(opcional)'}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Ex.: declaração para o Bolsa Família; histórico do 1º ao 5º ano; 2ª via do boletim do 2º bimestre"
                className={inputCls}
              />
            </div>

            {/* Solicitante */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Quem está pedindo *</label>
                <select value={relation} onChange={(e) => changeRelation(e.target.value as ProtocolRequesterRelation)} className={inputCls}>
                  {(Object.keys(PROTOCOL_RELATION_LABEL) as ProtocolRequesterRelation[]).map((r) => (
                    <option key={r} value={r}>
                      {PROTOCOL_RELATION_LABEL[r]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Como o pedido chegou</label>
                <select value={channel} onChange={(e) => setChannel(e.target.value as ProtocolChannel)} className={inputCls}>
                  {(Object.keys(PROTOCOL_CHANNEL_LABEL) as ProtocolChannel[]).map((c) => (
                    <option key={c} value={c}>
                      {PROTOCOL_CHANNEL_LABEL[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Nome do solicitante *</label>
                <input value={requesterName} onChange={(e) => setRequesterName(e.target.value)} className={inputCls} placeholder="Nome completo" />
              </div>
              <div>
                <label className={labelCls}>Telefone / WhatsApp</label>
                <input value={requesterPhone} onChange={(e) => setRequesterPhone(e.target.value)} className={inputCls} placeholder="(94) 99999-9999" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl cursor-pointer">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer">
                <CheckCircle2 className="h-4 w-4" />
                Registrar e gerar protocolo
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Detalhe e movimentação                                                                      */
/* ------------------------------------------------------------------------------------------ */

const ProtocolDetailModal: React.FC<{
  p: ProtocolRequest;
  schoolName: string;
  canEdit: boolean;
  onClose: () => void;
  onMove: (to: ProtocolStatus, note?: string, deliveredTo?: string) => void;
  onNote: (note: string) => void;
  onPrint: () => void;
}> = ({ p, schoolName, canEdit, onClose, onMove, onNote, onPrint }) => {
  const options = nextStatuses(p.status);
  const [to, setTo] = useState<ProtocolStatus | ''>(options[0] || '');
  const [note, setNote] = useState('');
  const [deliveredTo, setDeliveredTo] = useState(p.requesterName || '');
  const [error, setError] = useState('');
  const [freeNote, setFreeNote] = useState('');

  const doMove = () => {
    if (!to) return;
    const problem = moveProblem(p, to, note, deliveredTo);
    if (problem) {
      setError(problem);
      return;
    }
    onMove(to, note, to === 'ENTREGUE' ? deliveredTo : undefined);
    setNote('');
    setError('');
  };

  const phone = waPhone(p.requesterPhone);
  const waText = encodeURIComponent(
    `Olá, ${p.requesterName}! O documento "${p.documentType}" de ${p.studentName} (protocolo ${p.number}) está pronto para retirada na secretaria${schoolName ? ` da ${schoolName}` : ''}.`
  );

  const info: [string, string | undefined][] = [
    ['Aluno(a)', p.studentName],
    ['RA / Turma', [p.enrollmentNumber, p.className].filter(Boolean).join(' • ')],
    ['Escola', schoolName],
    ['Documento', p.documentType],
    ['Detalhes', p.description],
    ['Solicitante', `${p.requesterName} (${PROTOCOL_RELATION_LABEL[p.requesterRelation]})`],
    ['Telefone', p.requesterPhone],
    ['Como chegou', p.channel ? PROTOCOL_CHANNEL_LABEL[p.channel] : ''],
    ['Aberto em', `${formatDateTimeBr(p.createdAt)} por ${p.createdByName}`],
    ['Previsão de entrega', formatDateBr(p.dueDate)],
    ['Entregue', p.deliveredAt ? `${formatDateTimeBr(p.deliveredAt)} a ${p.deliveredTo}` : ''],
  ];

  const inputCls = 'w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6" data-testid="protocol-detail">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] text-slate-500 font-semibold">PROTOCOLO</div>
            <div className="text-xl font-black font-mono tracking-wider text-slate-900">{p.number}</div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge p={p} />
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer" aria-label="Fechar">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-5 gap-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Dados */}
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
              {info
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="grid grid-cols-3 gap-2 px-3 py-2">
                    <span className="text-slate-500 font-semibold">{k}</span>
                    <span className="col-span-2 text-slate-900">{v}</span>
                  </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onPrint} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer">
                <Printer className="h-4 w-4" />
                Imprimir comprovante
              </button>
              {phone && p.status === 'PRONTO' && (
                <a
                  href={`https://wa.me/${phone}?text=${waText}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5"
                  title="Abre o WhatsApp com a mensagem pronta; confira e clique em Enviar"
                >
                  <MessageCircle className="h-4 w-4" />
                  Avisar pelo WhatsApp
                </a>
              )}
            </div>

            {/* Movimentar */}
            {canEdit && options.length > 0 && (
              <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-3 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-teal-700" />
                  Movimentar protocolo
                </div>
                {error && <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select value={to} onChange={(e) => setTo(e.target.value as ProtocolStatus)} className={inputCls}>
                    {options.map((s) => (
                      <option key={s} value={s}>
                        {PROTOCOL_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  {to === 'ENTREGUE' && (
                    <input value={deliveredTo} onChange={(e) => setDeliveredTo(e.target.value)} className={inputCls} placeholder="Entregue a (nome de quem retirou) *" />
                  )}
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className={inputCls}
                  placeholder={to === 'CANCELADO' ? 'Motivo do cancelamento *' : 'Observação (opcional)'}
                />
                <div className="flex justify-end">
                  <button type="button" onClick={doMove} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl cursor-pointer">
                    Salvar movimentação
                  </button>
                </div>
              </div>
            )}

            {canEdit && (
              <div className="rounded-xl border border-slate-200 p-3 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <StickyNote className="h-4 w-4 text-slate-600" />
                  Acrescentar observação
                </div>
                <textarea value={freeNote} onChange={(e) => setFreeNote(e.target.value)} rows={2} className={inputCls} placeholder="Ex.: responsável ligou perguntando; aguardando assinatura da direção" />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={!freeNote.trim()}
                    onClick={() => {
                      onNote(freeNote);
                      setFreeNote('');
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Salvar observação
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Histórico */}
          <div className="lg:col-span-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-2">
              <History className="h-4 w-4 text-slate-600" />
              Histórico
            </div>
            <ol className="relative border-l-2 border-slate-200 ml-2 space-y-3">
              {[...(p.history || [])].reverse().map((h, i) => (
                <li key={`${h.at}-${i}`} className="ml-3">
                  <span className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full bg-teal-500 border-2 border-white" />
                  <div className="text-[11px] text-slate-500">{formatDateTimeBr(h.at)}</div>
                  <div className="font-bold text-slate-900">{PROTOCOL_STATUS_LABEL[h.status]}</div>
                  <div className="text-[11px] text-slate-600">por {h.userName}</div>
                  {h.note && <div className="mt-0.5 text-slate-700 flex items-start gap-1"><FileText className="h-3 w-3 mt-0.5 shrink-0" />{h.note}</div>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtocolModule;
