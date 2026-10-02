import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, Building2, LogIn, LogOut, X, History } from 'lucide-react';
import type { ExternalNetworkType, SchoolClass, SchoolUnit, Student } from '../../types';
import {
  EXTERNAL_NETWORK_LABEL,
  registerExternalArrival,
  transferOutOfNetwork,
  transferWithinNetwork,
} from '../../services/students/transfers';
import { unitDisplayName } from '../../utils/schoolAnnexes';

type Mode = 'REDE' | 'SAIDA_EXTERNA' | 'ENTRADA_EXTERNA';

interface Props {
  student: Student | null;
  /** Todas as escolas da rede (cadastro completo). */
  schoolUnits: SchoolUnit[];
  /** Todas as turmas (para escolher a turma na escola de destino). */
  classes: SchoolClass[];
  /** Escolas para onde este usuário pode transferir (null = rede inteira). */
  allowedDestinationIds: ReadonlySet<string> | null;
  registeredBy?: string;
  onClose: () => void;
  onSave: (student: Student) => void;
}

// Data local (no Brasil, depois das 21h o toISOString já seria o dia seguinte).
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const fmt = (d?: string) => {
  const [y, m, dd] = String(d || '').split('-');
  return y && m && dd ? `${dd}/${m}/${y}` : d || '';
};

export const TransferStudentModal: React.FC<Props> = ({
  student,
  schoolUnits,
  classes,
  allowedDestinationIds,
  registeredBy,
  onClose,
  onSave,
}) => {
  const [mode, setMode] = useState<Mode>('REDE');
  const [date, setDate] = useState(today());
  const [toUnitId, setToUnitId] = useState('');
  const [toClassId, setToClassId] = useState('');
  const [extName, setExtName] = useState('');
  const [extCity, setExtCity] = useState('');
  const [extState, setExtState] = useState('');
  const [extNetwork, setExtNetwork] = useState<ExternalNetworkType | ''>('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setMode('REDE');
    setDate(today());
    setToUnitId('');
    setToClassId('');
    setExtName('');
    setExtCity('');
    setExtState('');
    setExtNetwork('');
    setReason('');
    setError('');
  }, [student?.id]);

  const unitName = (id?: string) => {
    const u = schoolUnits.find((x) => x.id === id);
    return u ? unitDisplayName(u, schoolUnits) || u.name : '';
  };
  const currentClass = classes.find((c) => c.id === student?.classId);
  const currentUnitName = unitName(student?.schoolUnitId) || student?.schoolOriginName || 'Escola não informada';
  // Nome gravado no registro: o nome oficial da escola (sem o complemento "anexa de").
  const plainUnitName =
    schoolUnits.find((x) => x.id === student?.schoolUnitId)?.name || student?.schoolOriginName || 'Escola não informada';

  const destinations = useMemo(
    () =>
      schoolUnits
        .filter((u) => u.id !== student?.schoolUnitId)
        .filter((u) => !allowedDestinationIds || allowedDestinationIds.has(u.id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [schoolUnits, student?.schoolUnitId, allowedDestinationIds]
  );
  const destClasses = useMemo(
    () => classes.filter((c) => c.schoolUnitId === toUnitId).sort((a, b) => a.name.localeCompare(b.name)),
    [classes, toUnitId]
  );

  if (!student) return null;

  const history = student.transfers || [];

  const handleSave = () => {
    setError('');
    try {
      let next: Student;
      if (mode === 'REDE') {
        const toUnit = schoolUnits.find((u) => u.id === toUnitId);
        if (!toUnit) throw new Error('Escolha a escola de destino.');
        next = transferWithinNetwork(student, {
          toUnit: { id: toUnit.id, name: toUnit.name },
          toClass: destClasses.find((c) => c.id === toClassId) || null,
          date,
          reason,
          registeredBy,
          fromUnitName: plainUnitName,
          fromClassName: currentClass?.name,
        });
      } else {
        const input = {
          schoolName: extName,
          city: extCity,
          state: extState,
          network: extNetwork || undefined,
          date,
          reason,
          registeredBy,
          fromUnitName: plainUnitName,
          fromClassName: currentClass?.name,
        };
        next = mode === 'SAIDA_EXTERNA' ? transferOutOfNetwork(student, input) : registerExternalArrival(student, input);
      }
      onSave(next);
      onClose();
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  };

  const tab = (m: Mode, label: string, Icon: React.ElementType) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
        mode === m ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );

  const input = 'w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 my-6">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
              Transferência de Aluno
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {student.name} • RA {student.enrollmentNumber} • {currentUnitName}
              {currentClass ? ` • ${currentClass.name}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer" title="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            {tab('REDE', 'Para escola da rede', Building2)}
            {tab('SAIDA_EXTERNA', 'Para fora da rede', LogOut)}
            {tab('ENTRADA_EXTERNA', 'Veio de fora da rede', LogIn)}
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3">
            {mode === 'REDE' &&
              'O aluno continua com o mesmo cadastro e RA e passa para a escola/turma de destino. Notas, frequência e histórico já lançados ficam registrados na escola de origem.'}
            {mode === 'SAIDA_EXTERNA' &&
              'Use quando o aluno vai para uma escola que não é da rede municipal (estadual, particular, outro município). A situação passa a "Transferido" e o destino fica registrado.'}
            {mode === 'ENTRADA_EXTERNA' &&
              'Registra a escola de origem de um aluno que chegou de fora da rede municipal. A escola e a turma atuais não mudam.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-slate-700 space-y-1">
              <span>Data da transferência *</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
            </label>

            {mode === 'REDE' ? (
              <>
                <label className="text-xs font-semibold text-slate-700 space-y-1">
                  <span>Escola de destino *</span>
                  <select
                    value={toUnitId}
                    onChange={(e) => {
                      setToUnitId(e.target.value);
                      setToClassId('');
                    }}
                    className={input}
                  >
                    <option value="">Selecione…</option>
                    {destinations.map((u) => (
                      <option key={u.id} value={u.id}>
                        {unitName(u.id) || u.name}
                      </option>
                    ))}
                  </select>
                  {allowedDestinationIds && destinations.length === 0 && (
                    <span className="block text-[10px] text-amber-700 font-normal">
                      Seu usuário está lotado numa escola: a transferência para outra escola da rede é registrada pela
                      Secretaria (usuário sem lotação).
                    </span>
                  )}
                </label>
                <label className="text-xs font-semibold text-slate-700 space-y-1 sm:col-span-2">
                  <span>Turma na escola de destino</span>
                  <select value={toClassId} onChange={(e) => setToClassId(e.target.value)} className={input} disabled={!toUnitId}>
                    <option value="">Sem turma (enturmar depois)</option>
                    {destClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.shift ? ` (${c.shift})` : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <>
                <label className="text-xs font-semibold text-slate-700 space-y-1">
                  <span>{mode === 'SAIDA_EXTERNA' ? 'Escola de destino *' : 'Escola de origem *'}</span>
                  <input value={extName} onChange={(e) => setExtName(e.target.value)} className={input} placeholder="Nome da escola" />
                </label>
                <label className="text-xs font-semibold text-slate-700 space-y-1">
                  <span>Rede</span>
                  <select value={extNetwork} onChange={(e) => setExtNetwork(e.target.value as ExternalNetworkType)} className={input}>
                    <option value="">Não informada</option>
                    {(Object.keys(EXTERNAL_NETWORK_LABEL) as ExternalNetworkType[]).map((k) => (
                      <option key={k} value={k}>
                        {EXTERNAL_NETWORK_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-700 space-y-1">
                  <span>Cidade</span>
                  <input value={extCity} onChange={(e) => setExtCity(e.target.value)} className={input} />
                </label>
                <label className="text-xs font-semibold text-slate-700 space-y-1">
                  <span>UF</span>
                  <input value={extState} maxLength={2} onChange={(e) => setExtState(e.target.value.toUpperCase())} className={input} />
                </label>
              </>
            )}

            <label className="text-xs font-semibold text-slate-700 space-y-1 sm:col-span-2">
              <span>Motivo / observação</span>
              <input value={reason} onChange={(e) => setReason(e.target.value)} className={input} placeholder="Ex.: mudança de endereço" />
            </label>
          </div>

          {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">{error}</div>}

          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
              <History className="h-3.5 w-3.5 text-slate-500" /> Histórico de transferências
            </h4>
            {history.length === 0 ? (
              <p className="text-[11px] text-slate-500">Nenhuma transferência registrada para este aluno.</p>
            ) : (
              <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                {[...history].reverse().map((t) => (
                  <li key={t.id} className="text-[11px] text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                    <strong>{fmt(t.date)}</strong> •{' '}
                    {t.kind === 'REDE'
                      ? `Rede: ${t.fromUnitName || '—'}${t.fromClassName ? ` (${t.fromClassName})` : ''} → ${t.toUnitName || '—'}${t.toClassName ? ` (${t.toClassName})` : ''}`
                      : t.kind === 'SAIDA_EXTERNA'
                        ? `Saiu para fora da rede: ${t.externalSchoolName}${t.externalCity ? ` – ${t.externalCity}` : ''}${t.externalState ? `/${t.externalState}` : ''}`
                        : `Veio de fora da rede: ${t.externalSchoolName}${t.externalCity ? ` – ${t.externalCity}` : ''}${t.externalState ? `/${t.externalState}` : ''}`}
                    {t.reason ? ` • ${t.reason}` : ''}
                    {t.registeredBy ? <span className="text-slate-400"> • registrado por {t.registeredBy}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
          >
            {mode === 'ENTRADA_EXTERNA' ? 'Registrar procedência' : 'Confirmar transferência'}
          </button>
        </div>
      </div>
    </div>
  );
};
