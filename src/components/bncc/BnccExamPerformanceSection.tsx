/**
 * Habilidades BNCC > Desempenho nas provas.
 * Relatório por série (e escola/turma): percentual de acerto de cada aluno em cada habilidade,
 * a partir das provas corrigidas, com o nível sugerido (ND, ED, D, PD). O professor revisa e
 * leva os níveis para o lançamento BNCC do bimestre.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Printer, FileDown, Download, Send, X, Settings2, AlertTriangle, ClipboardCheck } from 'lucide-react';
import type {
  BnccMasteryLevel,
  BnccSkill,
  BnccSkillAssessment,
  Exam,
  ExamSubmission,
  Question,
  SchoolClass,
  SchoolSettings,
  SchoolUnit,
  Student,
} from '../../types';
import { BNCC_LEVELS, levelInfo, assessmentKey, assessmentIdFor, componentFromCode } from '../../services/bncc/bnccAssessmentService';
import {
  buildSkillPerformance,
  classesForGrade,
  examMatches,
  gradeKey,
  normalizeCuts,
  DEFAULT_LEVEL_CUTS,
  LevelCuts,
  examTermNumber,
} from '../../services/bncc/examSkillService';
import { triggerPrint } from '../../utils/printHelper';
import { displayClassName, classLabelWithSchool } from '../../utils/schoolDataNormalizer';

interface Props {
  students: Student[];
  classes: SchoolClass[];
  schoolUnits: SchoolUnit[];
  settings: SchoolSettings;
  exams: Exam[];
  questions: Question[];
  submissions: ExamSubmission[];
  skillsByCode: Map<string, BnccSkill>;
  assessments: BnccSkillAssessment[];
  teacherName?: string;
  onSaveAssessments: (upserts: BnccSkillAssessment[], removeKeys: string[]) => void;
  notify: (type: 'ok' | 'erro', text: string) => void;
}

const CUTS_KEY = 'sucessoedu_bncc_level_cuts_v1';

const esc = (v: any) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const badge = (level: BnccMasteryLevel) => {
  const info = levelInfo(level);
  return <span className={`inline-block px-1.5 py-0.5 rounded-md border text-[10px] font-black ${info?.bg || ''}`}>{info?.sigla}</span>;
};

async function downloadXlsxSheets(filename: string, sheets: Array<{ name: string; rows: Array<Record<string, any>> }>) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  for (const sh of sheets) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sh.rows.length ? sh.rows : [{}]), sh.name.slice(0, 31));
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

export const BnccExamPerformanceSection: React.FC<Props> = ({
  students,
  classes,
  schoolUnits,
  settings,
  exams,
  questions,
  submissions,
  skillsByCode,
  assessments,
  teacherName,
  onSaveAssessments,
  notify,
}) => {
  const currentYear = new Date().getFullYear();
  const [unitId, setUnitId] = useState<string>(schoolUnits.length === 1 ? schoolUnits[0].id : 'ALL');
  const [grade, setGrade] = useState<string>('');
  const [classId, setClassId] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [term, setTerm] = useState<number>(0);
  const [year, setYear] = useState<number>(currentYear);
  const [pickedExams, setPickedExams] = useState<Set<string>>(new Set());
  const [cuts, setCuts] = useState<LevelCuts>(() => {
    try {
      return normalizeCuts(JSON.parse(localStorage.getItem(CUTS_KEY) || 'null'));
    } catch {
      return DEFAULT_LEVEL_CUTS;
    }
  });
  const [showCuts, setShowCuts] = useState(false);
  const [review, setReview] = useState<null | { term: number; items: Record<string, { include: boolean; level: BnccMasteryLevel }> }>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CUTS_KEY, JSON.stringify(cuts));
    } catch {
      /* sem armazenamento: vale só nesta tela */
    }
  }, [cuts]);

  const unitClasses = useMemo(() => classes.filter((c) => unitId === 'ALL' || c.schoolUnitId === unitId), [classes, unitId]);
  const gradeOptions = useMemo(() => {
    const set = new Set<string>();
    unitClasses.forEach((c) => c.gradeLevel && set.add(gradeKey(c.gradeLevel)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
  }, [unitClasses]);
  const gradeClasses = useMemo(() => classesForGrade(classes, grade, unitId, ''), [classes, grade, unitId]);
  const targetClasses = useMemo(() => classesForGrade(classes, grade, unitId, classId), [classes, grade, unitId, classId]);
  const classIds = useMemo(() => new Set(targetClasses.map((c) => c.id)), [targetClasses]);

  useEffect(() => {
    if (grade && !gradeOptions.includes(grade)) setGrade('');
  }, [gradeOptions, grade]);
  useEffect(() => {
    if (classId && !gradeClasses.some((c) => c.id === classId)) setClassId('');
  }, [gradeClasses, classId]);

  // Provas com correções nas turmas do filtro.
  const candidateExams = useMemo(() => {
    const withSubs = new Set(
      submissions
        .filter((s) => {
          const st = students.find((x) => x.id === s.studentId);
          return classIds.has(st?.classId || s.classId);
        })
        .map((s) => s.examId)
    );
    return exams
      .filter((e) => withSubs.has(e.id) && examMatches(e, { subject, schoolYear: year, term }))
      .sort((a, b) => String(a.title).localeCompare(String(b.title), 'pt-BR'));
  }, [exams, submissions, students, classIds, subject, year, term]);

  const subjectOptions = useMemo(() => Array.from(new Set(exams.map((e) => e.subject).filter(Boolean))).sort(), [exams]);

  useEffect(() => {
    setPickedExams((prev) => new Set(Array.from(prev).filter((id) => candidateExams.some((e) => e.id === id))));
  }, [candidateExams]);

  const report = useMemo(
    () =>
      buildSkillPerformance(
        exams,
        questions,
        submissions,
        students,
        {
          classIds,
          examIds: pickedExams.size ? pickedExams : null,
          subject,
          schoolYear: year,
          term,
          classGradeOf: (id) => gradeKey(classes.find((c) => c.id === id)?.gradeLevel),
        },
        cuts,
        (code) => skillsByCode.get(code)?.subject || componentFromCode(code)
      ),
    [exams, questions, submissions, students, classes, classIds, pickedExams, subject, year, term, cuts, skillsByCode]
  );

  const classNameOf = (id: string) => {
    const c = classes.find((x) => x.id === id);
    return c ? classLabelWithSchool(c, schoolUnits) : '';
  };
  const unitOfClass = (id: string) => classes.find((x) => x.id === id)?.schoolUnitId;
  const scopeLabel = [
    unitId === 'ALL' ? 'Todas as escolas' : schoolUnits.find((u) => u.id === unitId)?.name,
    grade || 'Todas as séries',
    classId ? classNameOf(classId) : 'Todas as turmas',
    subject || 'Todos os componentes',
    term ? `${term}º bimestre` : 'Todos os bimestres',
    String(year),
  ]
    .filter(Boolean)
    .join(' • ');

  const summaryRows = report.skills.map((s) => ({
    Habilidade: s.code,
    Descrição: skillsByCode.get(s.code)?.description || '',
    Componente: s.subject || '',
    Questões: s.questions,
    'Alunos avaliados': s.studentsAssessed,
    'Média de acerto (%)': s.avgPct,
    'Nível da série': levelInfo(s.level)?.label || '',
    ND: s.distribution[1],
    ED: s.distribution[2],
    D: s.distribution[3],
    PD: s.distribution[4],
  }));
  const studentRows = report.rows.flatMap((r) =>
    Object.entries(r.cells).map(([code, c]) => ({
      Aluno: r.studentName,
      Turma: classNameOf(r.classId),
      Habilidade: code,
      Questões: c.questions,
      'Pontos obtidos': Number(c.earned.toFixed(2)),
      'Pontos possíveis': Number(c.max.toFixed(2)),
      'Acerto (%)': c.pct,
      Nível: levelInfo(c.level)?.label || '',
    }))
  );

  const printHtml = () => {
    const lvl = (l: BnccMasteryLevel) => {
      const i = levelInfo(l);
      return `<span style="display:inline-block;padding:1px 5px;border-radius:4px;font-weight:700;font-size:10px;color:#fff;background:${i?.color}">${esc(i?.sigla)}</span>`;
    };
    const skillHead = report.skills.map((s) => `<th>${esc(s.code)}</th>`).join('');
    return `
      <h2 style="margin:0 0 4px">Desempenho por habilidade BNCC nas provas</h2>
      <p style="margin:0 0 8px;font-size:11px">${esc(scopeLabel)}<br/>Provas: ${esc(report.examsUsed.map((e) => e.title).join('; ') || '-')}<br/>
      Faixas: ND abaixo de ${cuts.ed}% • ED ${cuts.ed}% a ${cuts.d - 0.1}% • D ${cuts.d}% a ${cuts.pd - 0.1}% • PD ${cuts.pd}% ou mais</p>
      <h3>Resumo por habilidade</h3>
      <table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse;width:100%;font-size:10px">
        <tr><th>Habilidade</th><th>Descrição</th><th>Questões</th><th>Alunos</th><th>Média</th><th>Nível</th><th>ND</th><th>ED</th><th>D</th><th>PD</th></tr>
        ${report.skills
          .map(
            (s) =>
              `<tr><td><b>${esc(s.code)}</b></td><td>${esc(skillsByCode.get(s.code)?.description || '')}</td><td align="center">${s.questions}</td><td align="center">${s.studentsAssessed}</td><td align="center">${s.avgPct}%</td><td align="center">${lvl(s.level)}</td><td align="center">${s.distribution[1]}</td><td align="center">${s.distribution[2]}</td><td align="center">${s.distribution[3]}</td><td align="center">${s.distribution[4]}</td></tr>`
          )
          .join('')}
      </table>
      <h3>Desempenho por aluno</h3>
      <table border="1" cellspacing="0" cellpadding="3" style="border-collapse:collapse;width:100%;font-size:9px">
        <tr><th>Aluno</th><th>Turma</th>${skillHead}</tr>
        ${report.rows
          .map(
            (r) =>
              `<tr><td>${esc(r.studentName)}</td><td>${esc(classNameOf(r.classId))}</td>${report.skills
                .map((s) => {
                  const c = r.cells[s.code];
                  return `<td align="center">${c ? `${c.pct}% ${lvl(c.level)}` : '-'}</td>`;
                })
                .join('')}</tr>`
          )
          .join('')}
      </table>
      <p style="font-size:9px;margin-top:8px">Percentual de acerto = pontos obtidos ÷ pontos possíveis nas questões de cada habilidade. Emitido por ${esc(teacherName || '')} em ${new Date().toLocaleString('pt-BR')}.</p>`;
  };

  // ---- Levar para o lançamento BNCC -------------------------------------------------
  const openReview = () => {
    const termFromExams = Array.from(new Set(report.examsUsed.map((e) => examTermNumber(e)).filter(Boolean))) as number[];
    const t = term || (termFromExams.length === 1 ? termFromExams[0] : 0);
    const items: Record<string, { include: boolean; level: BnccMasteryLevel }> = {};
    for (const r of report.rows) for (const [code, c] of Object.entries(r.cells)) items[`${r.studentId}|${code}`] = { include: true, level: c.level };
    setReview({ term: t, items });
  };

  const existingFor = (studentId: string, code: string, t: number) =>
    assessments.find((a) => assessmentKey(a) === assessmentKey({ studentId, skillCode: code, schoolYear: year, term: t }));

  const confirmReview = () => {
    if (!review) return;
    if (!review.term) {
      notify('erro', 'Escolha o bimestre do lançamento.');
      return;
    }
    const now = new Date().toISOString();
    const ups: BnccSkillAssessment[] = [];
    for (const r of report.rows) {
      for (const [code, c] of Object.entries(r.cells)) {
        const it = review.items[`${r.studentId}|${code}`];
        if (!it?.include) continue;
        ups.push({
          id: assessmentIdFor({ studentId: r.studentId, skillCode: code, schoolYear: year, term: review.term }),
          studentId: r.studentId,
          classId: r.classId,
          schoolUnitId: unitOfClass(r.classId),
          skillCode: code,
          subject: skillsByCode.get(code)?.subject || componentFromCode(code) || subject || '',
          schoolYear: year,
          term: review.term,
          level: it.level,
          notes: `Provas: ${c.pct}% de acerto em ${c.questions} questão(ões).`,
          teacherName,
          updatedAt: now,
        });
      }
    }
    onSaveAssessments(ups, []);
    setReview(null);
    notify('ok', `${ups.length} nível(is) levado(s) para o lançamento BNCC do ${review.term}º bimestre de ${year}.`);
  };

  const overwriteCount = review
    ? report.rows.reduce(
        (n, r) =>
          n +
          Object.keys(r.cells).filter((code) => {
            const it = review.items[`${r.studentId}|${code}`];
            const ex = existingFor(r.studentId, code, review.term);
            return it?.include && ex && ex.level !== it.level;
          }).length,
        0
      )
    : 0;

  const sel = 'px-2 py-1.5 rounded-lg border border-slate-300 text-xs';
  const lbl = 'text-[11px] font-semibold text-slate-600 flex flex-col gap-1';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2 p-3 bg-white border border-slate-200 rounded-xl">
        {schoolUnits.length > 1 && (
          <label className={lbl}>
            Escola
            <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className={`${sel} min-w-[170px]`}>
              <option value="ALL">Todas as escolas</option>
              {schoolUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className={lbl}>
          Série
          <select value={grade} onChange={(e) => setGrade(e.target.value)} className={`${sel} min-w-[130px]`}>
            <option value="">Todas as séries</option>
            {gradeOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className={lbl}>
          Turma
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className={`${sel} min-w-[160px]`}>
            <option value="">Todas as turmas</option>
            {gradeClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {classLabelWithSchool(c, schoolUnits)}
              </option>
            ))}
          </select>
        </label>
        <label className={lbl}>
          Componente
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className={`${sel} min-w-[150px]`}>
            <option value="">Todos</option>
            {subjectOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className={lbl}>
          Bimestre
          <select value={term} onChange={(e) => setTerm(Number(e.target.value))} className={sel}>
            <option value={0}>Todos</option>
            {[1, 2, 3, 4].map((t) => (
              <option key={t} value={t}>
                {t}º bimestre
              </option>
            ))}
          </select>
        </label>
        <label className={lbl}>
          Ano letivo
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value) || currentYear)} className={`${sel} w-24`} />
        </label>
        <button onClick={() => setShowCuts((v) => !v)} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold cursor-pointer">
          <Settings2 className="h-3.5 w-3.5" /> Faixas dos níveis
        </button>
      </div>

      {showCuts && (
        <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs flex flex-wrap items-end gap-3">
          <span className="text-slate-600">Percentual mínimo de acerto para cada nível (abaixo do primeiro = Não desenvolvida):</span>
          {(
            [
              ['ed', 'Em desenvolvimento'],
              ['d', 'Desenvolvida'],
              ['pd', 'Plenamente desenvolvida'],
            ] as Array<[keyof LevelCuts, string]>
          ).map(([k, label]) => (
            <label key={k} className={lbl}>
              {label}
              <input
                type="number"
                min={0}
                max={100}
                value={cuts[k]}
                onChange={(e) => setCuts((c) => normalizeCuts({ ...c, [k]: Number(e.target.value) }))}
                className={`${sel} w-20`}
              />
            </label>
          ))}
          <button onClick={() => setCuts(DEFAULT_LEVEL_CUTS)} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold cursor-pointer">
            Voltar ao padrão (40 / 60 / 80)
          </button>
        </div>
      )}

      <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-2">
        <div className="font-semibold text-slate-700">Provas incluídas {pickedExams.size ? `(${pickedExams.size} escolhida(s))` : '(todas as corrigidas do filtro)'}</div>
        {candidateExams.length === 0 ? (
          <p className="text-slate-500">
            Nenhuma prova corrigida para este filtro. Em <strong>Provas & Avaliações</strong>, use <strong>Lançar respostas</strong> para corrigir as provas aplicadas no papel.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {candidateExams.map((e) => {
              const on = pickedExams.has(e.id);
              return (
                <button
                  key={e.id}
                  onClick={() =>
                    setPickedExams((prev) => {
                      const n = new Set(prev);
                      if (n.has(e.id)) n.delete(e.id);
                      else n.add(e.id);
                      return n;
                    })
                  }
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer ${on ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                >
                  {e.title} • {e.subject} • {e.term}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          ['Provas', report.examsUsed.length],
          ['Alunos avaliados', report.rows.length],
          ['Habilidades', report.skills.length],
          ['Questões sem habilidade', report.questionsWithoutSkill],
        ].map(([k, v]) => (
          <div key={k as string} className="p-3 bg-white border border-slate-200 rounded-xl">
            <div className="text-[10px] uppercase font-bold text-slate-500">{k}</div>
            <div className="text-xl font-black text-slate-900">{v}</div>
          </div>
        ))}
      </div>

      {report.skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => triggerPrint(printHtml(), { title: 'Desempenho por habilidade BNCC', documentCategory: 'RELATÓRIO DE HABILIDADES BNCC', schoolName: settings?.name || (settings as any)?.schoolName })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
          </button>
          <button
            onClick={() =>
              downloadXlsxSheets(`Desempenho_Habilidades_${(grade || 'todas').replace(/\s+/g, '_')}_${year}`, [
                { name: 'Resumo por habilidade', rows: summaryRows },
                { name: 'Por aluno', rows: studentRows },
              ])
            }
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
          >
            <FileDown className="h-3.5 w-3.5" /> Excel
          </button>
          <button onClick={openReview} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer">
            <Send className="h-3.5 w-3.5" /> Levar para o lançamento BNCC
          </button>
        </div>
      )}

      {report.skills.length > 0 ? (
        <>
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <div className="px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-800">Resumo por habilidade — {scopeLabel}</div>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2">Habilidade</th>
                  <th className="text-left px-3 py-2">Descrição</th>
                  <th className="px-2 py-2">Questões</th>
                  <th className="px-2 py-2">Alunos</th>
                  <th className="px-2 py-2">Média de acerto</th>
                  <th className="px-2 py-2">Nível da série</th>
                  <th className="px-2 py-2 min-w-[160px]">Distribuição (ND / ED / D / PD)</th>
                </tr>
              </thead>
              <tbody>
                {report.skills.map((s) => {
                  const total = s.studentsAssessed || 1;
                  return (
                    <tr key={s.code} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-mono font-black text-indigo-700">{s.code}</td>
                      <td className="px-3 py-2 text-slate-700 max-w-[380px]">{skillsByCode.get(s.code)?.description || <span className="text-slate-400">(fora do catálogo)</span>}</td>
                      <td className="px-2 py-2 text-center">{s.questions}</td>
                      <td className="px-2 py-2 text-center">{s.studentsAssessed}</td>
                      <td className="px-2 py-2 text-center font-bold">{s.avgPct}%</td>
                      <td className="px-2 py-2 text-center">{badge(s.level)}</td>
                      <td className="px-2 py-2">
                        <div className="flex h-3 rounded overflow-hidden bg-slate-100" title={BNCC_LEVELS.map((l) => `${l.sigla}: ${s.distribution[l.level]}`).join(' • ')}>
                          {BNCC_LEVELS.map((l) => (
                            <div key={l.level} style={{ width: `${(s.distribution[l.level] / total) * 100}%`, background: l.color }} />
                          ))}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{BNCC_LEVELS.map((l) => `${l.sigla} ${s.distribution[l.level]}`).join(' · ')}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <div className="px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-800">Desempenho por aluno (% de acerto e nível em cada habilidade)</div>
            <table className="text-xs min-w-full">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2 sticky left-0 bg-slate-50">Aluno</th>
                  <th className="text-left px-2 py-2">Turma</th>
                  {report.skills.map((s) => (
                    <th key={s.code} className="px-2 py-2 font-mono" title={skillsByCode.get(s.code)?.description}>
                      {s.code}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.rows.map((r) => (
                  <tr key={r.studentId} className="border-t border-slate-100">
                    <td className="px-3 py-1.5 font-semibold text-slate-800 whitespace-nowrap sticky left-0 bg-white">{r.studentName}</td>
                    <td className="px-2 py-1.5 text-slate-500 whitespace-nowrap">{classNameOf(r.classId)}</td>
                    {report.skills.map((s) => {
                      const c = r.cells[s.code];
                      return (
                        <td key={s.code} className="px-2 py-1.5 text-center whitespace-nowrap" title={c ? `${c.earned.toFixed(1)} de ${c.max.toFixed(1)} ponto(s) em ${c.questions} questão(ões)` : 'Não avaliada'}>
                          {c ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="font-bold">{c.pct}%</span> {badge(c.level)}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="p-8 bg-white border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500 space-y-1">
          <ClipboardCheck className="h-6 w-6 mx-auto text-slate-400" />
          <p>Sem dados de habilidades para este filtro.</p>
          <p>
            É preciso: questões com habilidade BNCC vinculada, prova montada com essas questões e as respostas dos alunos lançadas (<strong>Lançar respostas</strong>) ou a prova feita no
            computador.
          </p>
        </div>
      )}

      {review && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Levar para o lançamento BNCC</h3>
                <p className="text-xs text-slate-500">Confira o nível sugerido pela prova. Você pode mudar o nível ou desmarcar antes de confirmar.</p>
              </div>
              <button onClick={() => setReview(null)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 font-semibold">
                Bimestre do lançamento
                <select value={review.term} onChange={(e) => setReview({ ...review, term: Number(e.target.value) })} className={sel}>
                  <option value={0}>Escolha</option>
                  {[1, 2, 3, 4].map((t) => (
                    <option key={t} value={t}>
                      {t}º bimestre
                    </option>
                  ))}
                </select>
              </label>
              <span className="text-slate-600">Ano letivo {year}</span>
              {overwriteCount > 0 && (
                <span className="flex items-center gap-1 text-amber-800 font-semibold">
                  <AlertTriangle className="h-3.5 w-3.5" /> {overwriteCount} lançamento(s) já existente(s) terão o nível trocado.
                </span>
              )}
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-xs">
                <thead className="bg-white sticky top-0 shadow-sm">
                  <tr>
                    <th className="px-2 py-2">Levar</th>
                    <th className="text-left px-2 py-2">Aluno</th>
                    <th className="px-2 py-2">Habilidade</th>
                    <th className="px-2 py-2">Acerto</th>
                    <th className="px-2 py-2">Nível</th>
                    <th className="px-2 py-2">Lançado hoje</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.flatMap((r) =>
                    Object.entries(r.cells).map(([code, c]) => {
                      const k = `${r.studentId}|${code}`;
                      const it = review.items[k];
                      const ex = review.term ? existingFor(r.studentId, code, review.term) : undefined;
                      return (
                        <tr key={k} className="border-t border-slate-100">
                          <td className="px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={!!it?.include}
                              onChange={(e) => setReview({ ...review, items: { ...review.items, [k]: { ...it, include: e.target.checked } } })}
                            />
                          </td>
                          <td className="px-2 py-1">{r.studentName}</td>
                          <td className="px-2 py-1 text-center font-mono font-bold">{code}</td>
                          <td className="px-2 py-1 text-center">{c.pct}%</td>
                          <td className="px-2 py-1 text-center">
                            <select
                              value={it?.level}
                              onChange={(e) => setReview({ ...review, items: { ...review.items, [k]: { ...it, level: Number(e.target.value) as BnccMasteryLevel } } })}
                              className="px-1.5 py-1 rounded border border-slate-300"
                            >
                              {BNCC_LEVELS.map((l) => (
                                <option key={l.level} value={l.level}>
                                  {l.sigla} — {l.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-1 text-center">{ex ? badge(ex.level) : <span className="text-slate-300">—</span>}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setReview(null)} className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold cursor-pointer">
                Cancelar
              </button>
              <button onClick={confirmReview} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Download className="h-3.5 w-3.5" /> Confirmar lançamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
