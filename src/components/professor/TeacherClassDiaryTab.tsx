import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Printer,
  Sparkles,
  Search,
  Filter,
  Layers,
  FileText,
  Clock,
  Award,
  Check,
  Building,
} from 'lucide-react';
import {
  SchoolClass,
  Subject,
  LessonDiaryRegistry,
  BnccSkill,
  SchoolSettings,
} from '../../types';
import { writeSafePrintDocument } from '../../utils/safeHtml';

interface TeacherClassDiaryTabProps {
  teacherName: string;
  classes: SchoolClass[];
  subjects: Subject[];
  settings: SchoolSettings;
  bnccSkills: BnccSkill[];
  activeClassId: string;
  activeSubjectId: string;
  selectedTerm: string;
  lessonRegistries: LessonDiaryRegistry[];
  onSaveLessonRegistry: (registry: LessonDiaryRegistry) => void;
  onDeleteLessonRegistry: (registryId: string) => void;
  onAddBnccSkill?: (skill: BnccSkill) => void;
}

export const TeacherClassDiaryTab: React.FC<TeacherClassDiaryTabProps> = ({
  teacherName = '',
  classes = [],
  subjects = [],
  settings,
  bnccSkills = [],
  activeClassId,
  activeSubjectId,
  selectedTerm,
  lessonRegistries = [],
  onSaveLessonRegistry,
  onDeleteLessonRegistry,
}) => {
  const activeClass = useMemo(
    () => classes.find((c) => c.id === activeClassId) || classes[0],
    [classes, activeClassId]
  );

  const activeSubject = useMemo(
    () => subjects.find((s) => s.id === activeSubjectId) || subjects[0],
    [subjects, activeSubjectId]
  );

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [lessonCount, setLessonCount] = useState<number>(2);
  const [contentTaught, setContentTaught] = useState<string>('');
  const [selectedBnccCodes, setSelectedBnccCodes] = useState<string[]>([]);
  const [methodology, setMethodology] = useState<string>('');
  const [homework, setHomework] = useState<string>('');
  const [pedagogicalObservations, setPedagogicalObservations] = useState<string>('');
  const [occurrences, setOccurrences] = useState<string>('');

  // BNCC Search in form
  const [bnccSearch, setBnccSearch] = useState<string>('');
  const [showBnccPicker, setShowBnccPicker] = useState<boolean>(false);

  // Success alert
  const [successAlert, setSuccessAlert] = useState<string | null>(null);

  // Filter lessons for active class and subject
  const currentClassLessons = useMemo(() => {
    return (lessonRegistries || [])
      .filter((l) => l && l.classId === activeClass?.id && l.subjectId === activeSubject?.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [lessonRegistries, activeClass?.id, activeSubject?.id]);

  // Filtered BNCC Skills
  const availableBnccSkills = useMemo(() => {
    const list = bnccSkills || [];
    if (!bnccSearch.trim()) return list.slice(0, 12);
    const q = bnccSearch.toLowerCase().trim();
    return list.filter(
      (b) =>
        b &&
        ((b.code && b.code.toLowerCase().includes(q)) ||
          (b.description && b.description.toLowerCase().includes(q)) ||
          (b.knowledgeObject && b.knowledgeObject.toLowerCase().includes(q)))
    );
  }, [bnccSkills, bnccSearch]);

  const handleToggleBnccCode = (code: string) => {
    if (selectedBnccCodes.includes(code)) {
      setSelectedBnccCodes(selectedBnccCodes.filter((c) => c !== code));
    } else {
      setSelectedBnccCodes([...selectedBnccCodes, code]);
    }
  };

  const handleResetForm = () => {
    setEditingId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setLessonCount(2);
    setContentTaught('');
    setSelectedBnccCodes([]);
    setMethodology('');
    setHomework('');
    setPedagogicalObservations('');
    setOccurrences('');
  };

  const handleEditLesson = (lesson: LessonDiaryRegistry) => {
    setEditingId(lesson.id);
    setDate(lesson.date);
    setLessonCount(lesson.lessonCount || 2);
    setContentTaught(lesson.contentTaught || '');
    setSelectedBnccCodes(lesson.bnccSkillCodes || []);
    setMethodology(lesson.methodology || '');
    setHomework(lesson.homework || '');
    setPedagogicalObservations(lesson.pedagogicalObservations || '');
    setOccurrences(lesson.occurrences || '');
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !activeSubject) return;

    if (!contentTaught.trim()) {
      alert('Por favor, informe o conteúdo programático ministrado na aula.');
      return;
    }

    const registry: LessonDiaryRegistry = {
      id: editingId || `lesson-${Date.now()}`,
      date,
      classId: activeClass.id,
      className: activeClass.name,
      subjectId: activeSubject.id,
      subjectName: activeSubject.name,
      schoolUnitId: activeClass.schoolUnitId,
      teacherName: teacherName || activeSubject.teacherName || 'Docente Responsável',
      lessonCount,
      term: selectedTerm,
      contentTaught,
      bnccSkillCodes: selectedBnccCodes,
      methodology: methodology || 'Aula expositiva dialogada e resolução de atividades práticas.',
      homework: homework || undefined,
      pedagogicalObservations: pedagogicalObservations || undefined,
      occurrences: occurrences || undefined,
      status: 'HOMOLOGADO_PROFESSOR',
      signedByTeacherAt: new Date().toISOString(),
    };

    onSaveLessonRegistry(registry);
    setSuccessAlert(`Aula registrada e assinada com sucesso no diário!`);
    handleResetForm();
    setTimeout(() => setSuccessAlert(null), 4000);
  };

  // Official Class Diary Print
  const handlePrintOfficialDiary = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    writeSafePrintDocument(printWindow, `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Diário de Classe Oficial - ${activeClass?.name}</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 9.5pt; color: #0f172a; margin: 0; padding: 15px; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 13pt; font-weight: bold; text-transform: uppercase; }
          .subtitle { font-size: 9pt; color: #475569; }
          .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; font-size: 8.5pt; background: #f8fafc; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 8.5pt; }
          th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-weight: bold; }
          td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; }
          .bncc-pill { display: inline-block; background: #e0e7ff; color: #3730a3; font-weight: bold; padding: 2px 6px; border-radius: 4px; font-size: 7.5pt; margin-right: 4px; }
          .signatures { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; font-size: 8.5pt; }
          .sig-line { border-top: 1px solid #475569; padding-top: 4px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${settings.name}</div>
            <div class="subtitle">DIÁRIO DE CLASSE OFICIAL - REGISTRO DE CONTEÚDOS & HABILIDADES BNCC</div>
          </div>
          <div style="text-align: right; font-size: 8pt; color: #64748b;">
            Emitido em: ${new Date().toLocaleString('pt-BR')}<br>
            INEP: ${settings.inepCode || '35128490'}
          </div>
        </div>

        <div class="meta-grid">
          <div><strong>Turma:</strong> ${activeClass?.name} (${activeClass?.shift})</div>
          <div><strong>Componente Curricular:</strong> ${activeSubject?.name}</div>
          <div><strong>Docente Responsável:</strong> ${teacherName}</div>
          <div><strong>Período:</strong> ${selectedTerm} / 2026</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 70px; text-align: center;">Data</th>
              <th style="width: 50px; text-align: center;">Aulas</th>
              <th style="width: 250px;">Conteúdo Programático Desenvolvido</th>
              <th style="width: 140px;">Habilidades BNCC</th>
              <th>Metodologia & Recursos</th>
              <th style="width: 130px;">Tarefas / Observações</th>
              <th style="width: 80px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${currentClassLessons
              .map(
                (l) => `
              <tr>
                <td style="text-align: center; font-weight: bold;">${new Date(l.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                <td style="text-align: center; font-weight: bold;">${l.lessonCount}h/a</td>
                <td><strong>${l.contentTaught}</strong></td>
                <td>
                  ${(l.bnccSkillCodes || []).map((code) => `<span class="bncc-pill">${code}</span>`).join('') || '-'}
                </td>
                <td>${l.methodology || '-'}</td>
                <td>
                  ${l.homework ? `<div><strong>Tarefa:</strong> ${l.homework}</div>` : ''}
                  ${l.pedagogicalObservations ? `<div><strong>Obs:</strong> ${l.pedagogicalObservations}</div>` : ''}
                  ${!l.homework && !l.pedagogicalObservations ? '-' : ''}
                </td>
                <td style="text-align: center; font-weight: bold; color: #059669;">HOMOLOGADO</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="signatures">
          <div>
            <div class="sig-line">
              <strong>${teacherName}</strong><br>
              Professor(a) Regente do Componente
            </div>
          </div>
          <div>
            <div class="sig-line">
              <strong>${settings.principalName || 'Coordenação Pedagógica'}</strong><br>
              Coordenação Pedagógica / Direção
            </div>
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
  };

  return (
    <div className="space-y-6">
      {/* Alert toast */}
      {successAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold">{successAlert}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Form for Registering Lesson + List of Past Lessons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Lesson Form (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                {editingId ? 'Editar Registro de Aula' : 'Lançar Nova Aula no Diário'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Turma: <strong>{activeClass?.name}</strong> • Disciplina: <strong>{activeSubject?.name}</strong>
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg"
              >
                Cancelar Edição
              </button>
            )}
          </div>

          <form onSubmit={handleSaveForm} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Data da Aula: *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Qtd. de Horas/Aula:
                </label>
                <select
                  value={lessonCount}
                  onChange={(e) => setLessonCount(Number(e.target.value))}
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                >
                  <option value={1}>1 Hora/Aula (50 min)</option>
                  <option value={2}>2 Horas/Aula (Geminada)</option>
                  <option value={3}>3 Horas/Aula</option>
                  <option value={4}>4 Horas/Aula</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Bimestre:
                </label>
                <div className="text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
                  {selectedTerm}
                </div>
              </div>
            </div>

            {/* Content Taught */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Conteúdo Programático Ministrado: *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Descreva detalhadamente os conceitos, tópicos e problemas abordados nesta aula..."
                value={contentTaught}
                onChange={(e) => setContentTaught(e.target.value)}
                className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
              />
            </div>

            {/* BNCC Skills Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Habilidades BNCC Alinhadas ({selectedBnccCodes.length} selecionadas):
                </label>
                <button
                  type="button"
                  onClick={() => setShowBnccPicker(!showBnccPicker)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  {showBnccPicker ? 'Ocultar Seletor BNCC' : 'Buscar Habilidades BNCC'}
                </button>
              </div>

              {/* Selected Codes Pills */}
              {selectedBnccCodes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  {selectedBnccCodes.map((code) => {
                    const skill = bnccSkills.find((s) => s.code === code);
                    return (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-bold shadow-2xs"
                      >
                        {code}
                        <button
                          type="button"
                          onClick={() => handleToggleBnccCode(code)}
                          className="hover:text-rose-200 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Collapsible BNCC Picker */}
              {showBnccPicker && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Pesquisar por código (ex: EM13MAT301) ou palavra-chave..."
                      value={bnccSearch}
                      onChange={(e) => setBnccSearch(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white border border-slate-200 rounded-lg">
                    {availableBnccSkills.map((skill) => {
                      const isSelected = selectedBnccCodes.includes(skill.code);
                      return (
                        <div
                          key={skill.code}
                          onClick={() => handleToggleBnccCode(skill.code)}
                          className={`p-2 hover:bg-slate-50 cursor-pointer flex items-start gap-2 text-xs transition-colors ${
                            isSelected ? 'bg-indigo-50/80 font-bold' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <span className="font-mono text-indigo-600 font-bold">{skill.code}</span>
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                              {skill.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Methodology & Resources */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Metodologia, Estratégias & Recursos Utilizados:
              </label>
              <input
                type="text"
                placeholder="Ex: Aula expositiva dialogada, estudo de caso, GeoGebra, trabalho em grupo..."
                value={methodology}
                onChange={(e) => setMethodology(e.target.value)}
                className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            {/* Homework / Tarefas */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Tarefas de Casa / Atividades Extraclasse:
              </label>
              <input
                type="text"
                placeholder="Ex: Exercícios 1 a 10 da página 142 do livro didático oficial..."
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
                className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            {/* Pedagogical Observations & Occurrences */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Observações Pedagógicas da Aula:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Bom engajamento da turma; dúvidas pontuais..."
                  value={pedagogicalObservations}
                  onChange={(e) => setPedagogicalObservations(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Ocorrências / Registro de Sala:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Nenhuma ocorrência registrada..."
                  value={occurrences}
                  onChange={(e) => setOccurrences(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Assinatura digital automática pelo docente
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Check className="h-4 w-4" />
                {editingId ? 'Salvar Alterações da Aula' : 'Homologar & Assinar Aula no Diário'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: History of Lessons for Active Class & Subject (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  Aulas Registradas ({currentClassLessons.length})
                </h3>
                <span className="text-[11px] text-slate-500">Histórico de registros deste bimestre</span>
              </div>

              <button
                onClick={handlePrintOfficialDiary}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir Diário
              </button>
            </div>

            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {currentClassLessons.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Nenhuma aula registrada ainda</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Utilize o formulário ao lado para registrar o conteúdo da sua primeira aula.
                  </p>
                </div>
              ) : (
                currentClassLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="p-4 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200 transition-colors space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CalendarIcon className="h-3.5 w-3.5 text-indigo-600" />
                        {new Date(lesson.date + 'T00:00:00').toLocaleDateString('pt-BR')} • {lesson.lessonCount}h/a
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditLesson(lesson)}
                          className="p-1 hover:bg-slate-200 rounded-md text-slate-600 cursor-pointer"
                          title="Editar Registro"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Deseja realmente excluir este registro de aula?')) {
                              onDeleteLessonRegistry(lesson.id);
                            }
                          }}
                          className="p-1 hover:bg-rose-100 rounded-md text-rose-600 cursor-pointer"
                          title="Excluir Registro"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-800 font-semibold leading-relaxed">
                      {lesson.contentTaught}
                    </p>

                    {lesson.bnccSkillCodes && lesson.bnccSkillCodes.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {lesson.bnccSkillCodes.map((code) => (
                          <span
                            key={code}
                            className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    )}

                    {lesson.homework && (
                      <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                        <span className="font-bold text-indigo-600">Tarefa:</span> {lesson.homework}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                      <span>Assinado por {lesson.teacherName}</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Homologado
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
