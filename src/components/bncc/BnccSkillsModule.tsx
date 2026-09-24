/**
 * Módulo Habilidades BNCC: lançamento por turma/bimestre, relatórios personalizados
 * (aluno e turma), gráficos personalizáveis, catálogo de habilidades e importação/exportação.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpenCheck,
  ClipboardEdit,
  FileText,
  BarChart3,
  Library,
  ArrowDownUp,
  Save,
  Search,
  Upload,
  Download,
  Printer,
  FileDown,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  X,
} from 'lucide-react';
import type {
  BnccSkill,
  BnccSkillAssessment,
  BnccMasteryLevel,
  SchoolClass,
  SchoolUnit,
  Student,
  Subject,
  SchoolSettings,
} from '../../types';
import {
  BNCC_LEVELS,
  levelInfo,
  classYear,
  skillMatchesYear,
  componentFromCode,
  assessmentKey,
  assessmentIdFor,
  distribution,
  latestByStudentSkill,
  groupBy,
  rowsToSkills,
  skillsToRows,
  mergeSkills,
  rowsToAssessments,
  assessmentsToRows,
} from '../../services/bncc/bnccAssessmentService';
import { studentReportHtml, classReportHtml, downloadWordDoc, StudentReportOptions } from '../../services/bncc/bnccReportHtml';
import { FlexChart, downloadCsv } from '../common/FlexChart';
import { triggerPrint } from '../../utils/printHelper';
import { displayClassName } from '../../utils/schoolDataNormalizer';

interface Props {
  students: Student[];
  classes: SchoolClass[];
  subjects: Subject[];
  schoolUnits: SchoolUnit[];
  settings: SchoolSettings;
  bnccSkills: BnccSkill[];
  assessments: BnccSkillAssessment[];
  currentUserName?: string;
  onSaveAssessments: (upserts: BnccSkillAssessment[], removeKeys: string[]) => void;
  onUpsertSkills: (skills: BnccSkill[]) => void;
  onBack?: () => void;
}

type Section = 'LANCAR' | 'RELATORIOS' | 'GRAFICOS' | 'CATALOGO' | 'ARQUIVOS';

const SECTIONS: Array<{ id: Section; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'LANCAR', label: 'Lançamento', icon: ClipboardEdit },
  { id: 'RELATORIOS', label: 'Relatórios', icon: FileText },
  { id: 'GRAFICOS', label: 'Gráficos', icon: BarChart3 },
  { id: 'CATALOGO', label: 'Catálogo de habilidades', icon: Library },
  { id: 'ARQUIVOS', label: 'Importar / Exportar', icon: ArrowDownUp },
];

const normTxt = (v: any) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

async function readSheet(file: File): Promise<Array<Record<string, any>>> {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const isCsv = /\.csv$/i.test(file.name) || file.type === 'text/csv';
  const wb = isCsv
    ? XLSX.read(new TextDecoder('utf-8').decode(buf).replace(/^﻿/, ''), { type: 'string' })
    : XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' }) as Array<Record<string, any>>;
}

async function downloadXlsx(filename: string, rows: Array<Record<string, any>>, sheetName = 'Dados') {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

const csvCols = (rows: Array<Record<string, any>>) => Object.keys(rows[0] || {}).map((k) => ({ key: k, label: k }));

export const BnccSkillsModule: React.FC<Props> = ({
  students,
  classes,
  subjects,
  schoolUnits,
  settings,
  bnccSkills,
  assessments,
  currentUserName,
  onSaveAssessments,
  onUpsertSkills,
  onBack,
}) => {
  const [section, setSection] = useState<Section>('LANCAR');
  const currentYear = new Date().getFullYear();
  const [unitId, setUnitId] = useState<string>(schoolUnits.length === 1 ? schoolUnits[0].id : 'ALL');
  const [classId, setClassId] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [term, setTerm] = useState<number>(1);
  const [year, setYear] = useState<number>(currentYear);
  const [flash, setFlash] = useState<{ type: 'ok' | 'erro'; text: string } | null>(null);

  const notify = (type: 'ok' | 'erro', text: string) => {
    setFlash({ type, text });
    setTimeout(() => setFlash(null), 6000);
  };

  const skillsByCode = useMemo(() => new Map(bnccSkills.map((s) => [s.code.toUpperCase(), s])), [bnccSkills]);
  const unitClasses = useMemo(
    () =>
      classes
        .filter((c) => unitId === 'ALL' || c.schoolUnitId === unitId)
        .sort((a, b) => displayClassName(a).localeCompare(displayClassName(b), 'pt-BR')),
    [classes, unitId]
  );
  const selectedClass = classes.find((c) => c.id === classId);
  const classStudents = useMemo(
    () =>
      students
        .filter((s) => s.classId === classId)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [students, classId]
  );
  const subjectOptions = useMemo(() => {
    const set = new Set<string>();
    bnccSkills.forEach((s) => s.subject && set.add(s.subject));
    subjects.forEach((s) => s.name && set.add(s.name));
    assessments.forEach((a) => a.subject && set.add(a.subject));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [bnccSkills, subjects, assessments]);

  useEffect(() => {
    if (classId && !unitClasses.some((c) => c.id === classId)) setClassId('');
  }, [unitClasses, classId]);

  const schoolName =
    schoolUnits.find((u) => u.id === (selectedClass?.schoolUnitId || unitId))?.name || settings?.name || settings?.schoolName || 'Unidade Escolar';

  const filtersBar = (opts: { showTerm?: boolean; allowAllClasses?: boolean; allowAllSubjects?: boolean; allowAllTerms?: boolean } = {}) => (
    <div className="flex flex-wrap items-end gap-2 p-3 bg-white border border-slate-200 rounded-xl">
      {schoolUnits.length > 1 && (
        <label className="text-[11px] font-semibold text-slate-600 flex flex-col gap-1">
          Escola
          <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs min-w-[180px]">
            <option value="ALL">Todas as escolas</option>
            {schoolUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="text-[11px] font-semibold text-slate-600 flex flex-col gap-1">
        Turma
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs min-w-[170px]">
          <option value="">{opts.allowAllClasses ? 'Todas as turmas' : 'Selecione a turma'}</option>
          {unitClasses.map((c) => (
            <option key={c.id} value={c.id}>
              {displayClassName(c)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-[11px] font-semibold text-slate-600 flex flex-col gap-1">
        Componente curricular
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs min-w-[170px]">
          <option value="">{opts.allowAllSubjects === false ? 'Selecione' : 'Todos os componentes'}</option>
          {subjectOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      {opts.showTerm !== false && (
        <label className="text-[11px] font-semibold text-slate-600 flex flex-col gap-1">
          Bimestre
          <select value={term} onChange={(e) => setTerm(Number(e.target.value))} className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs">
            {opts.allowAllTerms && <option value={0}>Todos</option>}
            {[1, 2, 3, 4].map((t) => (
              <option key={t} value={t}>
                {t}º bimestre
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="text-[11px] font-semibold text-slate-600 flex flex-col gap-1">
        Ano letivo
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value) || currentYear)}
          className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs w-24"
        />
      </label>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-4 bg-slate-50 min-h-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer" title="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
            <BookOpenCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">Habilidades BNCC</h1>
            <p className="text-xs text-slate-500">
              Lançamento do desenvolvimento das habilidades da{' '}
              <a href="https://basenacionalcomum.mec.gov.br/" target="_blank" rel="noreferrer" className="text-indigo-600 underline">
                Base Nacional Comum Curricular
              </a>{' '}
              por aluno, bimestre e componente.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 bg-white border border-slate-200 p-1 rounded-xl">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  section === s.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {flash && (
        <div
          className={`flex items-start gap-2 p-3 rounded-xl text-xs border ${
            flash.type === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {flash.type === 'ok' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          <span className="whitespace-pre-line">{flash.text}</span>
        </div>
      )}

      {section === 'LANCAR' && (
        <LaunchSection
          filters={filtersBar({ allowAllSubjects: true })}
          selectedClass={selectedClass}
          classStudents={classStudents}
          subject={subject}
          term={term}
          year={year}
          bnccSkills={bnccSkills}
          assessments={assessments}
          teacherName={currentUserName}
          onSave={(ups, rem) => {
            onSaveAssessments(ups, rem);
            notify('ok', `Lançamento salvo: ${ups.length} habilidade(s) registrada(s)${rem.length ? `, ${rem.length} removida(s)` : ''}.`);
          }}
        />
      )}

      {section === 'RELATORIOS' && (
        <ReportsSection
          filters={filtersBar({ allowAllTerms: true })}
          selectedClass={selectedClass}
          classStudents={classStudents}
          subject={subject}
          term={term}
          year={year}
          assessments={assessments}
          skillsByCode={skillsByCode}
          schoolName={schoolName}
          teacherName={currentUserName}
        />
      )}

      {section === 'GRAFICOS' && (
        <ChartsSection
          filters={filtersBar({ allowAllClasses: true, allowAllTerms: true })}
          classes={unitClasses}
          classId={classId}
          subject={subject}
          term={term}
          year={year}
          assessments={assessments}
          skillsByCode={skillsByCode}
        />
      )}

      {section === 'CATALOGO' && (
        <CatalogSection
          bnccSkills={bnccSkills}
          subjectOptions={subjectOptions}
          onUpsertSkills={(list) => {
            onUpsertSkills(list);
          }}
          notify={notify}
        />
      )}

      {section === 'ARQUIVOS' && (
        <FilesSection
          filters={filtersBar({ allowAllClasses: true, allowAllTerms: true })}
          students={students}
          classes={classes}
          unitClasses={unitClasses}
          classId={classId}
          classStudents={classStudents}
          subject={subject}
          term={term}
          year={year}
          assessments={assessments}
          bnccSkills={bnccSkills}
          skillsByCode={skillsByCode}
          teacherName={currentUserName}
          onImport={(list) => onSaveAssessments(list, [])}
          notify={notify}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Lançamento
// ---------------------------------------------------------------------------

const LevelSelect: React.FC<{ value: number | ''; onChange: (v: number | '') => void; compact?: boolean }> = ({ value, onChange, compact }) => {
  const info = levelInfo(value || undefined);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
      className={`rounded-md border text-[11px] font-bold cursor-pointer ${compact ? 'px-1 py-0.5' : 'px-1.5 py-1'}`}
      style={info ? { background: info.color, color: '#fff', borderColor: info.color } : { background: '#fff', color: '#64748b', borderColor: '#cbd5e1' }}
      title={info?.label || 'Não avaliado'}
    >
      <option value="">—</option>
      {BNCC_LEVELS.map((l) => (
        <option key={l.level} value={l.level} style={{ background: '#fff', color: '#0f172a' }}>
          {l.sigla} · {l.label}
        </option>
      ))}
    </select>
  );
};

const LaunchSection: React.FC<{
  filters: React.ReactNode;
  selectedClass?: SchoolClass;
  classStudents: Student[];
  subject: string;
  term: number;
  year: number;
  bnccSkills: BnccSkill[];
  assessments: BnccSkillAssessment[];
  teacherName?: string;
  onSave: (ups: BnccSkillAssessment[], removeKeys: string[]) => void;
}> = ({ filters, selectedClass, classStudents, subject, term, year, bnccSkills, assessments, teacherName, onSave }) => {
  const [search, setSearch] = useState('');
  const [allYears, setAllYears] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [draft, setDraft] = useState<Record<string, number | ''>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  const yearOfClass = selectedClass ? classYear(selectedClass.gradeLevel || selectedClass.name) : null;
  const candidateSkills = useMemo(() => {
    const q = normTxt(search);
    return bnccSkills
      .filter((s) => allYears || skillMatchesYear(s, yearOfClass))
      .filter((s) => !subject || normTxt(s.subject) === normTxt(subject) || normTxt(componentFromCode(s.code)) === normTxt(subject))
      .filter((s) => !q || normTxt(`${s.code} ${s.description} ${s.knowledgeObject || ''} ${s.fieldOfExperience || ''}`).includes(q))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [bnccSkills, allYears, yearOfClass, subject, search]);

  // Habilidades já lançadas nesta turma/bimestre entram selecionadas
  const existing = useMemo(
    () =>
      assessments.filter(
        (a) => a.classId === selectedClass?.id && a.schoolYear === year && a.term === term && (!subject || a.subject === subject)
      ),
    [assessments, selectedClass?.id, year, term, subject]
  );

  useEffect(() => {
    const codes = Array.from(new Set(existing.map((a) => a.skillCode)));
    setSelectedCodes((prev) => Array.from(new Set([...codes, ...prev.filter((c) => candidateSkills.some((s) => s.code === c))])));
    const d: Record<string, number | ''> = {};
    const n: Record<string, string> = {};
    for (const a of existing) {
      d[`${a.studentId}|${a.skillCode}`] = a.level;
      if (a.notes) n[a.studentId] = a.notes;
    }
    setDraft(d);
    setNotes(n);
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  const toggleCode = (code: string) =>
    setSelectedCodes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));

  const setCell = (studentId: string, code: string, v: number | '') => {
    setDraft((prev) => ({ ...prev, [`${studentId}|${code}`]: v }));
    setDirty(true);
  };
  const fillColumn = (code: string, v: number | '') => {
    setDraft((prev) => {
      const next = { ...prev };
      classStudents.forEach((s) => (next[`${s.id}|${code}`] = v));
      return next;
    });
    setDirty(true);
  };

  const skillOf = (code: string) => bnccSkills.find((s) => s.code === code);

  const handleSave = () => {
    if (!selectedClass) return;
    const now = new Date().toISOString();
    const ups: BnccSkillAssessment[] = [];
    const removeKeys: string[] = [];
    for (const st of classStudents) {
      for (const code of selectedCodes) {
        const v = draft[`${st.id}|${code}`];
        const base = { studentId: st.id, skillCode: code, schoolYear: year, term };
        if (v) {
          ups.push({
            id: assessmentIdFor(base),
            ...base,
            classId: selectedClass.id,
            schoolUnitId: selectedClass.schoolUnitId,
            subject: subject || skillOf(code)?.subject || componentFromCode(code),
            level: v as BnccMasteryLevel,
            notes: notes[st.id]?.trim() || undefined,
            teacherName,
            updatedAt: now,
          });
        } else if (existing.some((a) => a.studentId === st.id && a.skillCode === code)) {
          removeKeys.push(assessmentKey(base));
        }
      }
    }
    // Habilidades desmarcadas: remove os lançamentos delas neste bimestre
    for (const a of existing) if (!selectedCodes.includes(a.skillCode)) removeKeys.push(assessmentKey(a));
    onSave(ups, removeKeys);
    setDirty(false);
  };

  const filled = selectedCodes.length * classStudents.length;
  const done = classStudents.reduce((n, s) => n + selectedCodes.filter((c) => draft[`${s.id}|${c}`]).length, 0);

  return (
    <div className="space-y-3">
      {filters}
      {!selectedClass ? (
        <div className="p-8 text-center text-sm text-slate-500 bg-white border border-dashed border-slate-300 rounded-xl">
          Escolha a turma, o componente e o bimestre para lançar as habilidades.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
          <div className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Habilidades ({candidateSkills.length})</h3>
              <label className="text-[11px] text-slate-600 flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={allYears} onChange={(e) => setAllYears(e.target.checked)} /> Todas as etapas
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              {yearOfClass === null
                ? 'Série da turma não reconhecida: mostrando todas as habilidades.'
                : `Filtradas para ${yearOfClass === 0 ? 'Educação Infantil' : yearOfClass >= 10 ? 'Ensino Médio' : `${yearOfClass}º ano`}.`}{' '}
              Faltou alguma? Cadastre ou importe no Catálogo.
            </p>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2 top-2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar código ou texto..."
                className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-slate-300 text-xs"
              />
            </div>
            <div className="max-h-[420px] overflow-y-auto space-y-1 pr-1">
              {candidateSkills.map((s) => (
                <label
                  key={s.id}
                  className={`flex items-start gap-2 p-2 rounded-lg border text-[11px] cursor-pointer ${
                    selectedCodes.includes(s.code) ? 'bg-indigo-50 border-indigo-300' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input type="checkbox" className="mt-0.5" checked={selectedCodes.includes(s.code)} onChange={() => toggleCode(s.code)} />
                  <span>
                    <b className="font-mono text-indigo-700">{s.code}</b> <span className="text-slate-400">· {s.subject}</span>
                    <br />
                    <span className="text-slate-700">{s.description}</span>
                  </span>
                </label>
              ))}
              {candidateSkills.length === 0 && <p className="text-xs text-slate-400 p-2">Nenhuma habilidade com estes filtros.</p>}
            </div>
          </div>

          <div className="xl:col-span-8 bg-white border border-slate-200 rounded-xl p-3 space-y-2 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {displayClassName(selectedClass)} · {term}º bimestre · {year}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {classStudents.length} aluno(s) · {selectedCodes.length} habilidade(s) · {done}/{filled} lançamentos
                  {dirty && <b className="text-amber-600"> · alterações não salvas</b>}
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={!dirty && selectedCodes.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> Salvar lançamento
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px]">
              {BNCC_LEVELS.map((l) => (
                <span key={l.level} className={`px-2 py-0.5 rounded border font-semibold ${l.bg}`}>
                  {l.sigla} = {l.label}
                </span>
              ))}
            </div>
            {selectedCodes.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-500">Marque ao lado as habilidades trabalhadas neste bimestre.</p>
            ) : (
              <div className="overflow-auto max-h-[520px] border border-slate-200 rounded-lg">
                <table className="text-xs w-full">
                  <thead className="bg-slate-100 sticky top-0 z-10">
                    <tr>
                      <th className="text-left p-2 min-w-[180px]">Aluno(a)</th>
                      {selectedCodes.map((c) => (
                        <th key={c} className="p-1.5 text-center align-bottom" title={skillOf(c)?.description}>
                          <div className="font-mono text-[10px] text-indigo-700">{c}</div>
                          <LevelSelect compact value="" onChange={(v) => fillColumn(c, v)} />
                          <div className="text-[9px] text-slate-400 font-normal">todos</div>
                        </th>
                      ))}
                      <th className="p-2 text-left min-w-[160px]">Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((st, i) => (
                      <tr key={st.id} className={i % 2 ? 'bg-slate-50/60' : ''}>
                        <td className="p-2">
                          <div className="font-semibold text-slate-800">{st.name}</div>
                          <div className="text-[10px] text-slate-400">{st.enrollmentNumber}</div>
                        </td>
                        {selectedCodes.map((c) => (
                          <td key={c} className="p-1 text-center">
                            <LevelSelect value={draft[`${st.id}|${c}`] ?? ''} onChange={(v) => setCell(st.id, c, v)} />
                          </td>
                        ))}
                        <td className="p-1">
                          <input
                            value={notes[st.id] || ''}
                            onChange={(e) => {
                              setNotes((prev) => ({ ...prev, [st.id]: e.target.value }));
                              setDirty(true);
                            }}
                            placeholder="Opcional"
                            className="w-full px-2 py-1 rounded border border-slate-200 text-[11px]"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Relatórios
// ---------------------------------------------------------------------------

const ReportsSection: React.FC<{
  filters: React.ReactNode;
  selectedClass?: SchoolClass;
  classStudents: Student[];
  subject: string;
  term: number;
  year: number;
  assessments: BnccSkillAssessment[];
  skillsByCode: Map<string, BnccSkill>;
  schoolName: string;
  teacherName?: string;
}> = ({ filters, selectedClass, classStudents, subject, term, year, assessments, skillsByCode, schoolName, teacherName }) => {
  const [mode, setMode] = useState<'ALUNO' | 'TURMA'>('ALUNO');
  const [studentId, setStudentId] = useState<string>('ALL');
  const [opts, setOpts] = useState<StudentReportOptions>({
    includeDescriptions: true,
    includeChart: true,
    includeOpinion: true,
    includeLegend: true,
    includeSignatures: true,
    terms: [1, 2, 3, 4],
    extraOpinion: '',
  });
  const previewRef = useRef<HTMLDivElement>(null);

  const yearList = useMemo(
    () => assessments.filter((a) => a.schoolYear === year && a.classId === selectedClass?.id && (!subject || a.subject === subject)),
    [assessments, year, selectedClass?.id, subject]
  );

  const html = useMemo(() => {
    if (!selectedClass) return '';
    const className = displayClassName(selectedClass);
    if (mode === 'TURMA') {
      const list = term ? latestByStudentSkill(yearList.filter((a) => a.term === term)) : latestByStudentSkill(yearList);
      return classReportHtml({ schoolName, schoolYear: year, className, subject, term, students: classStudents, assessments: list, skills: skillsByCode });
    }
    const terms = term ? opts.terms.filter((t) => t <= term) : opts.terms;
    const targets = studentId === 'ALL' ? classStudents : classStudents.filter((s) => s.id === studentId);
    return targets
      .map((st) =>
        studentReportHtml(
          {
            schoolName,
            schoolYear: year,
            studentName: st.name,
            enrollmentNumber: st.enrollmentNumber,
            className,
            teacherName,
            assessments: yearList.filter((a) => a.studentId === st.id && terms.includes(a.term)),
            skills: skillsByCode,
          },
          { ...opts, terms }
        )
      )
      .join('<div style="height:24px"></div>');
  }, [selectedClass, mode, yearList, term, schoolName, year, subject, classStudents, skillsByCode, studentId, opts, teacherName]);

  const fileBase = `Habilidades_BNCC_${selectedClass ? displayClassName(selectedClass).replace(/[^\w]+/g, '_') : ''}_${year}`;
  const toggle = (k: keyof StudentReportOptions) => setOpts((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div className="space-y-3">
      {filters}
      {!selectedClass ? (
        <div className="p-8 text-center text-sm text-slate-500 bg-white border border-dashed border-slate-300 rounded-xl">Escolha a turma para gerar os relatórios.</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
          <div className="xl:col-span-3 bg-white border border-slate-200 rounded-xl p-3 space-y-3 text-xs">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              {(['ALUNO', 'TURMA'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-1.5 rounded-md font-semibold cursor-pointer ${mode === m ? 'bg-white shadow-2xs text-indigo-700' : 'text-slate-600'}`}
                >
                  {m === 'ALUNO' ? 'Por aluno' : 'Mapa da turma'}
                </button>
              ))}
            </div>
            {mode === 'ALUNO' && (
              <>
                <label className="flex flex-col gap-1 font-semibold text-slate-600">
                  Aluno(a)
                  <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-300">
                    <option value="ALL">Todos da turma ({classStudents.length})</option>
                    {classStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-600">Personalizar o relatório</p>
                  {(
                    [
                      ['includeDescriptions', 'Descrição das habilidades'],
                      ['includeChart', 'Gráfico da situação'],
                      ['includeOpinion', 'Parecer descritivo automático'],
                      ['includeLegend', 'Legenda dos níveis'],
                      ['includeSignatures', 'Campos de assinatura'],
                    ] as Array<[keyof StudentReportOptions, string]>
                  ).map(([k, label]) => (
                    <label key={k} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={Boolean(opts[k])} onChange={() => toggle(k)} /> {label}
                    </label>
                  ))}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-slate-600">Bimestres:</span>
                    {[1, 2, 3, 4].map((t) => (
                      <label key={t} className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={opts.terms.includes(t)}
                          onChange={() =>
                            setOpts((p) => ({ ...p, terms: p.terms.includes(t) ? p.terms.filter((x) => x !== t) : [...p.terms, t].sort() }))
                          }
                        />
                        {t}º
                      </label>
                    ))}
                  </div>
                  <label className="flex flex-col gap-1 pt-1">
                    <span className="text-slate-600">Texto complementar do parecer</span>
                    <textarea
                      rows={4}
                      value={opts.extraOpinion}
                      onChange={(e) => setOpts((p) => ({ ...p, extraOpinion: e.target.value }))}
                      className="px-2 py-1.5 rounded-lg border border-slate-300"
                      placeholder="Ex.: participa com interesse das atividades em grupo..."
                    />
                  </label>
                </div>
              </>
            )}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => triggerPrint(html, { title: `Relatório de Habilidades BNCC - ${displayClassName(selectedClass)}`, documentCategory: 'RELATÓRIO DE HABILIDADES BNCC', schoolName })}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Imprimir / salvar PDF
              </button>
              <button
                onClick={() => downloadWordDoc(fileBase, html)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-semibold cursor-pointer"
              >
                <FileDown className="h-4 w-4" /> Baixar para Word (.doc)
              </button>
              <button
                onClick={() =>
                  downloadXlsx(
                    fileBase,
                    assessmentsToRows(term ? yearList.filter((a) => a.term === term) : yearList, {
                      students: classStudents,
                      classes: [{ id: selectedClass.id, name: displayClassName(selectedClass) }],
                      skills: Array.from(skillsByCode.values()),
                    }),
                    'Habilidades'
                  )
                }
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold cursor-pointer"
              >
                <Download className="h-4 w-4" /> Planilha Excel (.xlsx)
              </button>
            </div>
          </div>
          <div className="xl:col-span-9 bg-white border border-slate-200 rounded-xl p-4 overflow-auto max-h-[760px]">
            {/* Pré-visualização: HTML gerado pelo próprio sistema a partir de textos escapados */}
            <div ref={previewRef} dangerouslySetInnerHTML={{ __html: html || '<p>Nenhum dado.</p>' }} />
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Gráficos
// ---------------------------------------------------------------------------

const ChartsSection: React.FC<{
  filters: React.ReactNode;
  classes: SchoolClass[];
  classId: string;
  subject: string;
  term: number;
  year: number;
  assessments: BnccSkillAssessment[];
  skillsByCode: Map<string, BnccSkill>;
}> = ({ filters, classes, classId, subject, term, year, assessments, skillsByCode }) => {
  const classIds = useMemo(() => new Set(classId ? [classId] : classes.map((c) => c.id)), [classId, classes]);
  const base = useMemo(
    () => assessments.filter((a) => a.schoolYear === year && classIds.has(a.classId) && (!subject || a.subject === subject)),
    [assessments, year, classIds, subject]
  );
  const current = useMemo(() => (term ? base.filter((a) => a.term === term) : latestByStudentSkill(base)), [base, term]);
  const dist = distribution(current);

  const levelData = BNCC_LEVELS.map((l) => ({ name: l.label, value: dist.counts[l.level], color: l.color }));
  const bySkill = Array.from(groupBy(current, (a) => a.skillCode).entries())
    .map(([code, list]) => {
      const d = distribution(list);
      return { name: code, desenvolvida: d.achievedPct, media: d.average, alunos: d.total, descricao: skillsByCode.get(code.toUpperCase())?.description || '' };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  // Só bimestres com lançamento (bimestre vazio não é "0%")
  const byTerm = [1, 2, 3, 4]
    .map((t) => {
      const d = distribution(base.filter((a) => a.term === t));
      return { name: `${t}º bim.`, desenvolvida: d.achievedPct, media: d.average, lancamentos: d.total };
    })
    .filter((r) => r.lancamentos > 0);
  const byComponent = Array.from(groupBy(current, (a) => a.subject || 'Outros').entries()).map(([name, list]) => {
    const d = distribution(list);
    return { name, desenvolvida: d.achievedPct, media: d.average };
  });
  const byClass = classes
    .map((c) => {
      const d = distribution(current.filter((a) => a.classId === c.id));
      return { name: displayClassName(c), desenvolvida: d.achievedPct, media: d.average, total: d.total };
    })
    .filter((r) => r.total > 0);

  const card = (title: string, subtitle: string, chart: React.ReactNode) => (
    <div className="bg-white border border-slate-200 rounded-xl p-4 min-w-0">
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <p className="text-[11px] text-slate-500 mb-2">{subtitle}</p>
      {chart}
    </div>
  );

  return (
    <div className="space-y-3">
      {filters}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          ['Lançamentos', String(dist.total)],
          ['Habilidades desenvolvidas', `${dist.achievedPct}%`],
          ['Média (1 a 4)', dist.average.toFixed(2)],
          ['Não desenvolvidas', String(dist.counts[1])],
        ].map(([l, v]) => (
          <div key={l} className="bg-white border border-slate-200 rounded-xl p-3">
            <p className="text-[11px] text-slate-500">{l}</p>
            <p className="text-xl font-black text-slate-900">{v}</p>
          </div>
        ))}
      </div>
      {dist.total === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500 bg-white border border-dashed border-slate-300 rounded-xl">
          Sem lançamentos para estes filtros. Os gráficos aparecem após o lançamento das habilidades.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {card(
            'Situação das habilidades',
            'Quantidade de lançamentos em cada nível',
            <FlexChart storageKey="bncc-niveis" title="Situação das habilidades BNCC" data={levelData} xKey="name" series={[{ key: 'value', name: 'Lançamentos' }]} colorKey="color" defaultType="pie" allowedTypes={['pie', 'bar', 'barH']} height={260} />
          )}
          {card(
            'Desenvolvimento por habilidade',
            '% de alunos em D ou PD em cada habilidade',
            <FlexChart storageKey="bncc-por-habilidade" title="Desenvolvimento por habilidade" data={bySkill} xKey="name" series={[{ key: 'desenvolvida', name: '% desenvolvida', color: '#4f46e5' }]} defaultType="bar" yDomain={[0, 100]} unit="%" referenceValue={70} referenceLabel="Meta 70%" height={260} />
          )}
          {card(
            'Evolução por bimestre',
            'Como a turma avançou ao longo do ano',
            <FlexChart
              storageKey="bncc-evolucao"
              title="Evolução por bimestre"
              data={byTerm}
              xKey="name"
              series={[{ key: 'desenvolvida', name: '% desenvolvida', color: '#10b981' }]}
              defaultType="line"
              allowedTypes={['line', 'area', 'bar']}
              yDomain={[0, 100]}
              unit="%"
              height={260}
            />
          )}
          {card(
            'Por componente curricular',
            '% de habilidades desenvolvidas por componente',
            <FlexChart storageKey="bncc-componentes" title="Habilidades por componente" data={byComponent} xKey="name" series={[{ key: 'desenvolvida', name: '% desenvolvida', color: '#0ea5e9' }]} defaultType="barH" yDomain={[0, 100]} unit="%" height={260} />
          )}
          {!classId && byClass.length > 1 &&
            card(
              'Comparativo entre turmas',
              '% de habilidades desenvolvidas em cada turma',
              <FlexChart storageKey="bncc-turmas" title="Comparativo entre turmas" data={byClass} xKey="name" series={[{ key: 'desenvolvida', name: '% desenvolvida', color: '#8b5cf6' }]} defaultType="bar" yDomain={[0, 100]} unit="%" height={260} />
            )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

const CatalogSection: React.FC<{
  bnccSkills: BnccSkill[];
  subjectOptions: string[];
  onUpsertSkills: (skills: BnccSkill[]) => void;
  notify: (type: 'ok' | 'erro', text: string) => void;
}> = ({ bnccSkills, subjectOptions, onUpsertSkills, notify }) => {
  const [search, setSearch] = useState('');
  const [subjectF, setSubjectF] = useState('');
  const [yearF, setYearF] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', description: '', subject: '', educationLevel: '', knowledgeObject: '', fieldOfExperience: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  const list = useMemo(() => {
    const q = normTxt(search);
    const y = yearF === '' ? null : Number(yearF);
    return bnccSkills
      .filter((s) => !subjectF || s.subject === subjectF)
      .filter((s) => y === null || skillMatchesYear(s, y))
      .filter((s) => !q || normTxt(`${s.code} ${s.description} ${s.knowledgeObject || ''}`).includes(q))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [bnccSkills, search, subjectF, yearF]);

  const handleImport = async (file: File) => {
    try {
      const rows = await readSheet(file);
      const { skills, errors } = rowsToSkills(rows);
      if (!skills.length) {
        notify('erro', `Nenhuma habilidade válida encontrada em ${file.name}.${errors.length ? '\n' + errors.slice(0, 5).join('\n') : ''}`);
        return;
      }
      const { added, updated } = mergeSkills(bnccSkills, skills);
      onUpsertSkills(skills);
      notify(
        errors.length ? 'erro' : 'ok',
        `Catálogo importado: ${added} nova(s), ${updated} atualizada(s).` + (errors.length ? `\n${errors.length} linha(s) ignorada(s):\n${errors.slice(0, 5).join('\n')}` : '')
      );
    } catch (err: any) {
      notify('erro', `Não foi possível ler o arquivo: ${err?.message || err}`);
    }
  };

  const handleAdd = () => {
    const { skills, errors } = rowsToSkills([
      {
        Código: form.code,
        Descrição: form.description,
        Componente: form.subject,
        'Ano/Etapa': form.educationLevel,
        'Objeto de conhecimento': form.knowledgeObject,
        'Unidade temática': form.fieldOfExperience,
      },
    ]);
    if (!skills.length) {
      notify('erro', errors[0]?.replace('Linha 2: ', '') || 'Preencha o código (ex.: EF05MA03) e a descrição.');
      return;
    }
    onUpsertSkills(skills);
    notify('ok', `Habilidade ${skills[0].code} salva no catálogo.`);
    setForm({ code: '', description: '', subject: '', educationLevel: '', knowledgeObject: '', fieldOfExperience: '' });
    setShowForm(false);
  };

  const exportRows = skillsToRows(list);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2 p-3 bg-white border border-slate-200 rounded-xl">
        <label className="text-[11px] font-semibold text-slate-600 flex flex-col gap-1">
          Buscar
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Código ou texto" className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs w-52" />
        </label>
        <label className="text-[11px] font-semibold text-slate-600 flex flex-col gap-1">
          Componente
          <select value={subjectF} onChange={(e) => setSubjectF(e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs">
            <option value="">Todos</option>
            {subjectOptions.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-semibold text-slate-600 flex flex-col gap-1">
          Etapa / ano
          <select value={yearF} onChange={(e) => setYearF(e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs">
            <option value="">Todos</option>
            <option value="0">Educação Infantil</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((y) => (
              <option key={y} value={y}>
                {y}º ano
              </option>
            ))}
            <option value="10">Ensino Médio</option>
          </select>
        </label>
        <div className="flex-1" />
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer">
          <Plus className="h-4 w-4" /> Nova habilidade
        </button>
        <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold cursor-pointer">
          <Upload className="h-4 w-4" /> Importar (Excel/CSV)
        </button>
        <button onClick={() => downloadXlsx('Catalogo_Habilidades_BNCC', exportRows, 'Habilidades')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold cursor-pointer">
          <Download className="h-4 w-4" /> Excel
        </button>
        <button onClick={() => downloadCsv('Catalogo_Habilidades_BNCC', exportRows, csvCols(exportRows))} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold cursor-pointer">
          <Download className="h-4 w-4" /> CSV
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImport(f);
            e.target.value = '';
          }}
        />
      </div>

      <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-900 flex flex-wrap items-center gap-2">
        <span>
          O catálogo aceita planilhas com as colunas <b>Código</b> e <b>Descrição</b> (opcionais: Ano/Etapa, Componente, Unidade temática, Objeto de conhecimento).
          Ano e componente são deduzidos do código quando faltam.
        </span>
        <button
          onClick={() =>
            downloadXlsx(
              'Modelo_Catalogo_BNCC',
              [
                { Código: 'EF05MA03', 'Ano/Etapa': '5º Ano', Componente: 'Matemática', 'Unidade temática / Campo': 'Números', 'Objeto de conhecimento': 'Frações', Descrição: 'Texto da habilidade' },
              ],
              'Modelo'
            )
          }
          className="underline font-semibold cursor-pointer"
        >
          Baixar modelo
        </button>
        <a href="https://basenacionalcomum.mec.gov.br/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline font-semibold">
          Site oficial da BNCC <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {showForm && (
        <div className="bg-white border border-indigo-200 rounded-xl p-3 grid grid-cols-1 md:grid-cols-6 gap-2 text-xs">
          <input placeholder="Código (ex.: EF05MA03)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="px-2 py-1.5 rounded-lg border border-slate-300 md:col-span-1 font-mono" />
          <input placeholder="Componente (opcional)" list="bncc-subjects" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="px-2 py-1.5 rounded-lg border border-slate-300 md:col-span-2" />
          <input placeholder="Ano/Etapa (opcional)" value={form.educationLevel} onChange={(e) => setForm({ ...form, educationLevel: e.target.value })} className="px-2 py-1.5 rounded-lg border border-slate-300 md:col-span-1" />
          <input placeholder="Objeto de conhecimento (opcional)" value={form.knowledgeObject} onChange={(e) => setForm({ ...form, knowledgeObject: e.target.value })} className="px-2 py-1.5 rounded-lg border border-slate-300 md:col-span-2" />
          <textarea placeholder="Descrição da habilidade" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-2 py-1.5 rounded-lg border border-slate-300 md:col-span-5" />
          <div className="flex gap-2 md:col-span-1">
            <button onClick={handleAdd} className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer">
              Salvar
            </button>
            <button onClick={() => setShowForm(false)} className="px-2 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer" title="Cancelar">
              <X className="h-4 w-4" />
            </button>
          </div>
          <datalist id="bncc-subjects">
            {subjectOptions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-auto max-h-[600px]">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 sticky top-0">
            <tr>
              <th className="p-2 text-left">Código</th>
              <th className="p-2 text-left">Etapa</th>
              <th className="p-2 text-left">Componente</th>
              <th className="p-2 text-left">Habilidade</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s, i) => (
              <tr key={s.id} className={i % 2 ? 'bg-slate-50/60' : ''}>
                <td className="p-2 font-mono font-bold text-indigo-700 whitespace-nowrap">{s.code}</td>
                <td className="p-2 whitespace-nowrap">{s.educationLevel}</td>
                <td className="p-2">{s.subject}</td>
                <td className="p-2">
                  {s.description}
                  {s.knowledgeObject && <div className="text-[10px] text-slate-400">{s.knowledgeObject}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="p-2 text-[11px] text-slate-500">{list.length} de {bnccSkills.length} habilidade(s).</p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Importar / Exportar lançamentos
// ---------------------------------------------------------------------------

const FilesSection: React.FC<{
  filters: React.ReactNode;
  students: Student[];
  classes: SchoolClass[];
  unitClasses: SchoolClass[];
  classId: string;
  classStudents: Student[];
  subject: string;
  term: number;
  year: number;
  assessments: BnccSkillAssessment[];
  bnccSkills: BnccSkill[];
  skillsByCode: Map<string, BnccSkill>;
  teacherName?: string;
  onImport: (list: BnccSkillAssessment[]) => void;
  notify: (type: 'ok' | 'erro', text: string) => void;
}> = ({ filters, students, classes, unitClasses, classId, classStudents, subject, term, year, assessments, bnccSkills, skillsByCode, teacherName, onImport, notify }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ file: string; list: BnccSkillAssessment[]; errors: string[] } | null>(null);
  const classIds = useMemo(() => new Set(classId ? [classId] : unitClasses.map((c) => c.id)), [classId, unitClasses]);
  const ctxClasses = useMemo(() => classes.map((c) => ({ id: c.id, name: displayClassName(c) })), [classes]);

  const filtered = assessments.filter(
    (a) => a.schoolYear === year && classIds.has(a.classId) && (!subject || a.subject === subject) && (!term || a.term === term)
  );
  const rows = assessmentsToRows(filtered, { students, classes: ctxClasses, skills: bnccSkills });
  const fileBase = `Lancamentos_BNCC_${year}${term ? `_${term}bim` : ''}`;

  const template = () => {
    const cls = classes.find((c) => c.id === classId);
    const codes = Array.from(new Set(filtered.map((a) => a.skillCode)));
    const useCodes = codes.length ? codes : bnccSkills.filter((s) => skillMatchesYear(s, cls ? classYear(cls.gradeLevel || cls.name) : null)).slice(0, 3).map((s) => s.code);
    const out: Array<Record<string, any>> = [];
    for (const st of classStudents.length ? classStudents : students.slice(0, 3)) {
      for (const code of useCodes) {
        out.push({
          Matrícula: st.enrollmentNumber || '',
          Aluno: st.name,
          Turma: cls ? displayClassName(cls) : '',
          'Ano letivo': year,
          Bimestre: term || 1,
          Componente: subject || skillsByCode.get(code.toUpperCase())?.subject || '',
          Código: code,
          Nível: '',
          Observação: '',
        });
      }
    }
    downloadXlsx('Modelo_Lancamento_BNCC', out, 'Lançamentos');
  };

  const handleFile = async (file: File) => {
    try {
      const data = await readSheet(file);
      const { list, errors } = rowsToAssessments(
        data,
        { students, classes: ctxClasses, skills: bnccSkills, defaultYear: year, teacherName, defaultClassId: classId || undefined },
        skillsByCode
      );
      setPreview({ file: file.name, list, errors });
    } catch (err: any) {
      notify('erro', `Não foi possível ler o arquivo: ${err?.message || err}`);
    }
  };

  return (
    <div className="space-y-3">
      {filters}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Download className="h-4 w-4 text-emerald-600" /> Exportar lançamentos
          </h3>
          <p className="text-slate-500">{rows.length} lançamento(s) nos filtros atuais.</p>
          <div className="flex flex-wrap gap-2">
            <button disabled={!rows.length} onClick={() => downloadXlsx(fileBase, rows, 'Lançamentos')} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer disabled:opacity-50">
              Excel (.xlsx)
            </button>
            <button disabled={!rows.length} onClick={() => downloadCsv(fileBase, rows, csvCols(rows))} className="px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 font-semibold cursor-pointer disabled:opacity-50">
              CSV
            </button>
            <button
              disabled={!filtered.length}
              onClick={() => {
                const blob = new Blob([JSON.stringify({ formato: 'sucessoedu-bncc-v1', ano: year, lancamentos: filtered }, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${fileBase}.json`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
              className="px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 font-semibold cursor-pointer disabled:opacity-50"
            >
              Backup (.json)
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Upload className="h-4 w-4 text-indigo-600" /> Importar lançamentos
          </h3>
          <p className="text-slate-500">
            Planilha (.xlsx/.csv) com as colunas <b>Matrícula</b> (ou Aluno + Turma), <b>Código</b>, <b>Bimestre</b> e <b>Nível</b> (1-4 ou ND, ED, D, PD). Lançamentos já existentes do mesmo aluno, habilidade e bimestre são atualizados.
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={template} className="px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 font-semibold cursor-pointer">
              Baixar modelo {classId ? 'da turma' : ''}
            </button>
            <button onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer">
              Escolher arquivo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f) return;
                if (/\.json$/i.test(f.name)) {
                  try {
                    const parsed = JSON.parse(await f.text());
                    const list: BnccSkillAssessment[] = (parsed?.lancamentos || []).filter((a: any) => a && a.studentId && a.skillCode && a.level);
                    setPreview({ file: f.name, list, errors: list.length ? [] : ['Arquivo sem lançamentos no formato do SucessoEdu.'] });
                  } catch {
                    notify('erro', 'Arquivo .json inválido.');
                  }
                  return;
                }
                handleFile(f);
              }}
            />
          </div>
          {preview && (
            <div className="mt-2 p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
              <p>
                <b>{preview.file}</b>: {preview.list.length} lançamento(s) prontos para importar
                {preview.errors.length ? `, ${preview.errors.length} linha(s) com problema` : ''}.
              </p>
              {preview.errors.length > 0 && (
                <ul className="max-h-32 overflow-auto text-rose-700 list-disc pl-5">
                  {preview.errors.slice(0, 30).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <button
                  disabled={!preview.list.length}
                  onClick={() => {
                    onImport(preview.list);
                    notify('ok', `${preview.list.length} lançamento(s) importado(s) de ${preview.file}.`);
                    setPreview(null);
                  }}
                  className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  Confirmar importação
                </button>
                <button onClick={() => setPreview(null)} className="px-3 py-2 rounded-lg bg-white border border-slate-300 font-semibold cursor-pointer">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BnccSkillsModule;
