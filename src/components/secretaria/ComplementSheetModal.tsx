import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import type { SchoolClass, SchoolUnit, Student } from '../../types';
import {
  COMPLEMENT_COLUMNS,
  COMPLEMENT_INSTRUCTIONS,
  FIELD_LABEL,
  buildComplementRows,
  complementFileName,
  complementLists,
  parseComplementMatrix,
  planComplement,
  type ComplementPlan,
} from '../../services/students/complementSheet';

interface ComplementSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Alunos que este usuário pode alterar (a escola dele, ou a rede para a Sede). */
  students: Student[];
  classes: SchoolClass[];
  /** Escolas que este usuário pode escolher. */
  schoolUnits: SchoolUnit[];
  /** Todos os alunos conhecidos (para achar CPF repetido em outro aluno). */
  allStudents?: Student[];
  defaultSchoolId?: string;
  /** Grava os alunos completados (de uma vez). */
  onApply: (updated: Student[]) => void;
}

type Tab = 'GERAR' | 'IMPORTAR';

export const ComplementSheetModal: React.FC<ComplementSheetModalProps> = ({
  isOpen,
  onClose,
  students,
  classes,
  schoolUnits,
  allStudents,
  defaultSchoolId,
  onApply,
}) => {
  const [tab, setTab] = useState<Tab>('GERAR');
  // Escola de cada aluno (cadastro ou turma).
  const classSchool = useMemo(() => new Map(classes.map((c) => [c.id, c.schoolUnitId || ''])), [classes]);
  const schoolOfStudent = (s: Student) => s.schoolUnitId || classSchool.get(s.classId) || '';
  // Só as escolas que têm alunos nesta tela (com a escola em foco no alto, é só ela).
  const units = useMemo(() => {
    const withStudents = new Set(students.map(schoolOfStudent).filter(Boolean));
    return [...schoolUnits]
      .filter((u) => u && withStudents.has(u.id))
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolUnits, students, classSchool]);
  const [schoolId, setSchoolId] = useState<string>(() =>
    defaultSchoolId && defaultSchoolId !== 'ALL' && units.some((u) => u.id === defaultSchoolId) ? defaultSchoolId : units.length === 1 ? units[0].id : ''
  );
  // Escola fora da lista (ou nenhuma, havendo uma só): acerta a escolha.
  useEffect(() => {
    if (schoolId && units.some((u) => u.id === schoolId)) return;
    setSchoolId(units.length === 1 ? units[0].id : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units]);
  const [onlyPending, setOnlyPending] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [fileName, setFileName] = useState('');
  const [plan, setPlan] = useState<ComplementPlan | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [applied, setApplied] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const unit = units.find((u) => u.id === schoolId);
  const schoolStudents = useMemo(
    () => (schoolId ? students.filter((s) => schoolOfStudent(s) === schoolId && s.status !== 'TRANSFERRED') : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [students, schoolId, classSchool]
  );
  const rows = useMemo(() => buildComplementRows(schoolStudents, classes, onlyPending), [schoolStudents, classes, onlyPending]);
  const totalRows = useMemo(() => buildComplementRows(schoolStudents, classes, false).length, [schoolStudents, classes]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!unit || rows.length === 0) return;
    setBusy(true);
    setMessage(null);
    try {
      const { downloadStyledWorkbook } = await import('../../services/styledXlsx');
      const editIdx = COMPLEMENT_COLUMNS.map((c, i) => (c.edit ? i : -1)).filter((i) => i >= 0);
      await downloadStyledWorkbook(complementFileName(unit), [
        {
          sheetName: 'Complementação',
          title: 'Planilha de Complementação do Cadastro dos Alunos',
          subtitle: `${unit.name} — preencha as células em amarelo e devolva à Secretaria`,
          filtersLine: onlyPending ? 'Só alunos com algo faltando' : 'Todos os alunos da escola',
          letterhead: { schoolUnitId: unit.id, schoolName: unit.name },
          orientation: 'landscape',
          conference: false,
          columns: COMPLEMENT_COLUMNS.map((c) => ({ label: c.label, align: c.key === 'seq' || c.key === 'gender' || c.key === 'laudo' ? 'center' : 'left' })),
          sections: [
            {
              lines: [['Escola', unit.name], ['INEP', String(unit.inepCode || '')]],
              rows: rows.map((r) => COMPLEMENT_COLUMNS.map((c) => r[c.key])),
              countLine: `Total de alunos nesta planilha: ${rows.length}`,
              inputCols: editIdx,
              lists: complementLists(),
            },
          ],
          // Só as colunas de preenchimento podem ser alteradas (RA, nome, turma e código ficam bloqueados).
          protect: true,
        },
        {
          sheetName: 'Como preencher',
          title: 'Como preencher a planilha de complementação',
          letterhead: { schoolUnitId: unit.id, schoolName: unit.name },
          orientation: 'portrait',
          conference: false,
          columns: [{ label: 'Passo', align: 'center' }, { label: 'O que fazer' }],
          sections: [{ rows: COMPLEMENT_INSTRUCTIONS }],
          protect: true,
        },
      ]);
      setMessage(`Planilha gerada com ${rows.length} aluno(s). Envie para a escola completar e depois use "Importar complementação".`);
    } catch (e: any) {
      setMessage(`Não foi possível gerar a planilha: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setPlan(null);
    setParseError(null);
    setApplied(null);
    setFileName(file.name);
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      // Aba "Complementação" (ou a primeira que tiver o cabeçalho certo).
      const names = [...wb.SheetNames].sort((a, b) => (/complementa/i.test(b) ? 1 : 0) - (/complementa/i.test(a) ? 1 : 0));
      let parsed = null as ReturnType<typeof parseComplementMatrix> | null;
      for (const n of names) {
        const matrix = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[n], { header: 1, raw: true, defval: '' });
        const p = parseComplementMatrix(matrix);
        if (!p.error) {
          parsed = p;
          break;
        }
        parsed = parsed || p;
      }
      if (!parsed || parsed.error) {
        setParseError(parsed?.error || 'Arquivo vazio.');
        return;
      }
      setPlan(planComplement(parsed, students, classes, allStudents || students));
    } catch (e: any) {
      setParseError(`Não consegui ler o arquivo: ${e?.message || e}`);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleApply = () => {
    if (!plan || plan.items.length === 0) return;
    onApply(plan.items.map((i) => i.updated));
    setApplied(plan.items.length);
    setPlan(null);
  };

  const tabBtn = (t: Tab, label: string, Icon: typeof Download) => (
    <button
      type="button"
      onClick={() => setTab(t)}
      className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
        tab === t ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/60 flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="Planilha de complementação">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-white">
          <FileSpreadsheet className="h-6 w-6 text-emerald-600 shrink-0" />
          <div className="min-w-0">
            <h2 className="text-base font-black text-slate-800">Planilha de complementação do cadastro</h2>
            <p className="text-xs text-slate-500">A escola completa CPF, nascimento, sexo, raça/cor, endereço, responsável, PCD e laudo no Excel; depois o sistema importa só o que foi preenchido.</p>
          </div>
          <button type="button" onClick={onClose} className="ml-auto p-2 rounded-lg hover:bg-slate-100" aria-label="Fechar">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex gap-2 px-5 pt-3">
          {tabBtn('GERAR', '1. Gerar planilha', Download)}
          {tabBtn('IMPORTAR', '2. Importar complementação', Upload)}
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {tab === 'GERAR' && (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold text-slate-600">Escola</span>
                  <select
                    data-testid="complement-school"
                    value={schoolId}
                    onChange={(e) => {
                      setSchoolId(e.target.value);
                      setMessage(null);
                    }}
                    disabled={units.length === 1}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white disabled:bg-slate-50"
                  >
                    {units.length !== 1 && <option value="">Escolha a escola…</option>}
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 mt-5 cursor-pointer select-none">
                  <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
                  <span className="text-xs font-semibold text-slate-700">Só alunos com algo faltando</span>
                </label>
              </div>

              {schoolId && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <strong>{rows.length}</strong> aluno(s) na planilha
                  {onlyPending && <> (de {totalRows} da escola)</>}. Colunas para preencher: data de nascimento, CPF, sexo, raça/cor, endereço,
                  responsável, telefone, PCD e laudo — vazias saem em <span className="px-1 bg-yellow-200 rounded">amarelo</span>. A coluna “O que falta” mostra o que cada aluno precisa.
                  Vai junto uma aba “Como preencher”.
                </div>
              )}

              {rows.length > 0 && (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="min-w-full text-[11px]">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="px-2 py-1.5 text-left">Aluno</th>
                        <th className="px-2 py-1.5 text-left">Turma</th>
                        <th className="px-2 py-1.5 text-left">O que falta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 8).map((r) => (
                        <tr key={r.id} className="border-t border-slate-100">
                          <td className="px-2 py-1 font-semibold">{r.name}</td>
                          <td className="px-2 py-1">{r.className}</td>
                          <td className="px-2 py-1 text-amber-700">{r.missing}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 8 && <div className="px-2 py-1 text-[11px] text-slate-500 bg-slate-50">… e mais {rows.length - 8} aluno(s) na planilha.</div>}
                </div>
              )}

              {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{message}</div>}

              {!busy && (!unit || rows.length === 0) && (
                <div data-testid="complement-disabled-reason" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {units.length === 0
                    ? 'Nenhum aluno nesta tela. Confira a escola escolhida no alto da tela ou os filtros.'
                    : !unit
                      ? 'Escolha a escola acima para liberar o botão "Baixar planilha".'
                      : onlyPending
                        ? 'Nenhum aluno desta escola tem algo faltando. Desmarque "Só alunos com algo faltando" para gerar com todos.'
                        : 'Esta escola não tem alunos ativos.'}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  data-testid="complement-download"
                  onClick={handleDownload}
                  disabled={!unit || rows.length === 0 || busy}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Baixar planilha (.xlsx)
                </button>
              </div>
            </>
          )}

          {tab === 'IMPORTAR' && (
            <>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-1">
                <p>Escolha a planilha que a escola devolveu. O sistema acha cada aluno pelo código do sistema (ou RA) e mostra o que vai mudar <strong>antes</strong> de gravar.</p>
                <p>Só as células preenchidas são gravadas. Nada é apagado, e nome, escola e turma nunca mudam. CPF inválido ou repetido e data errada ficam de fora.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.ods,.csv"
                  data-testid="complement-file"
                  onChange={(e) => void handleFile(e.target.files?.[0])}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Escolher planilha preenchida
                </button>
                {fileName && <span className="text-xs text-slate-500 truncate max-w-xs">{fileName}</span>}
              </div>

              {parseError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {parseError}
                </div>
              )}

              {applied !== null && (
                <div data-testid="complement-applied" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Pronto! {applied} aluno(s) completado(s). As pendências resolvidas já saíram do cadastro e dos contadores.
                </div>
              )}

              {plan && (
                <div data-testid="complement-preview" className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      ['Alunos a atualizar', plan.items.length, 'text-emerald-700 bg-emerald-50 border-emerald-200'],
                      ['Pendências resolvidas', plan.resolvedCount, 'text-indigo-700 bg-indigo-50 border-indigo-200'],
                      ['Sem novidade', plan.unchanged, 'text-slate-600 bg-slate-50 border-slate-200'],
                      ['Linhas com problema', plan.problems.length, plan.problems.length ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-slate-600 bg-slate-50 border-slate-200'],
                    ].map(([label, n, cls]) => (
                      <div key={String(label)} className={`rounded-xl border p-2 text-center ${cls}`}>
                        <div className="text-xl font-black">{n as number}</div>
                        <div className="text-[10px] font-bold uppercase">{label}</div>
                      </div>
                    ))}
                  </div>

                  {plan.problems.length > 0 && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 max-h-40 overflow-y-auto">
                      <div className="font-bold mb-1">Linhas com problema (não gravadas ou gravadas em parte):</div>
                      <ul className="space-y-0.5">
                        {plan.problems.map((p, i) => (
                          <li key={i}>
                            Linha {p.line} — <strong>{p.name}</strong>: {p.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {plan.items.length > 0 && (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-72">
                      <table className="min-w-full text-[11px]">
                        <thead className="bg-slate-800 text-white sticky top-0">
                          <tr>
                            <th className="px-2 py-1.5 text-left">Linha</th>
                            <th className="px-2 py-1.5 text-left">Aluno</th>
                            <th className="px-2 py-1.5 text-left">O que muda</th>
                            <th className="px-2 py-1.5 text-left">Pendências que saem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plan.items.slice(0, 300).map((it) => (
                            <tr key={it.student.id} className="border-t border-slate-100 align-top">
                              <td className="px-2 py-1 text-slate-500">{it.line}</td>
                              <td className="px-2 py-1 font-semibold">{it.student.name}</td>
                              <td className="px-2 py-1">
                                {it.changes.map((c) => (
                                  <div key={c.field}>
                                    <span className="font-bold">{FIELD_LABEL[c.field]}:</span> {c.from ? <span className="line-through text-slate-400">{c.from}</span> : null}
                                    {c.from ? ' → ' : ''}
                                    <span className="text-emerald-700">{c.to}</span>
                                  </div>
                                ))}
                                {it.warnings.map((w, i) => (
                                  <div key={i} className="text-rose-600">⚠ {w}</div>
                                ))}
                              </td>
                              <td className="px-2 py-1 text-indigo-700">{it.resolved.join('; ') || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {plan.items.length > 300 && <div className="px-2 py-1 text-[11px] text-slate-500 bg-slate-50">… e mais {plan.items.length - 300} aluno(s).</div>}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setPlan(null)} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100">
                      Cancelar
                    </button>
                    <button
                      type="button"
                      data-testid="complement-apply"
                      onClick={handleApply}
                      disabled={plan.items.length === 0}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Gravar {plan.items.length} aluno(s)
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplementSheetModal;
