import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Sparkles,
  Layers,
  Award,
  Clock,
  Target,
  FileText,
  Check,
} from 'lucide-react';
import {
  SchoolClass,
  Subject,
  TeacherLessonPlan,
  BnccSkill,
  SchoolSettings,
} from '../../types';
import { confirmDialog } from '../../utils/dialogs';

interface TeacherLessonPlanningTabProps {
  teacherName: string;
  classes: SchoolClass[];
  subjects: Subject[];
  settings: SchoolSettings;
  bnccSkills: BnccSkill[];
  activeClassId: string;
  activeSubjectId: string;
  selectedTerm: string;
  lessonPlans: TeacherLessonPlan[];
  onSaveLessonPlan: (plan: TeacherLessonPlan) => void;
  onDeleteLessonPlan: (planId: string) => void;
}

export const TeacherLessonPlanningTab: React.FC<TeacherLessonPlanningTabProps> = ({
  teacherName,
  classes,
  subjects,
  settings,
  bnccSkills,
  activeClassId,
  activeSubjectId,
  selectedTerm,
  lessonPlans,
  onSaveLessonPlan,
  onDeleteLessonPlan,
}) => {
  const activeClass = useMemo(
    () => classes.find((c) => c.id === activeClassId) || classes[0],
    [classes, activeClassId]
  );

  const activeSubject = useMemo(
    () => subjects.find((s) => s.id === activeSubjectId) || subjects[0],
    [subjects, activeSubjectId]
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [generalObjective, setGeneralObjective] = useState<string>('');
  const [plannedLessons, setPlannedLessons] = useState<number>(36);
  const [executedLessons, setExecutedLessons] = useState<number>(24);
  const [methodologies, setMethodologies] = useState<string>('');
  const [assessmentCriteria, setAssessmentCriteria] = useState<string>('');
  const [resourcesNeeded, setResourcesNeeded] = useState<string>('');
  const [selectedBnccCodes, setSelectedBnccCodes] = useState<string[]>([]);
  const [status, setStatus] = useState<'PLANEJADO' | 'EM_EXECUCAO' | 'CONCLUIDO'>('EM_EXECUCAO');

  // Filter plans for active class and subject
  const currentPlans = useMemo(() => {
    return lessonPlans.filter(
      (p) => p.classId === activeClass?.id && p.subjectId === activeSubject?.id
    );
  }, [lessonPlans, activeClass?.id, activeSubject?.id]);

  const handleReset = () => {
    setEditingId(null);
    setTitle('');
    setGeneralObjective('');
    setPlannedLessons(36);
    setExecutedLessons(0);
    setMethodologies('');
    setAssessmentCriteria('');
    setResourcesNeeded('');
    setSelectedBnccCodes([]);
    setStatus('EM_EXECUCAO');
  };

  const handleEdit = (p: TeacherLessonPlan) => {
    setEditingId(p.id);
    setTitle(p.title);
    setGeneralObjective(p.generalObjective);
    setPlannedLessons(p.plannedLessonsCount);
    setExecutedLessons(p.executedLessonsCount);
    setMethodologies(p.methodologies);
    setAssessmentCriteria(p.assessmentCriteria);
    setResourcesNeeded(p.resourcesNeeded || '');
    setSelectedBnccCodes(p.bnccSkillCodes || []);
    setStatus(p.status);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !activeSubject || !title.trim()) return;

    const newPlan: TeacherLessonPlan = {
      id: editingId || `plan-${Date.now()}`,
      teacherName: teacherName || 'Docente Responsável',
      classId: activeClass.id,
      className: activeClass.name,
      subjectId: activeSubject.id,
      subjectName: activeSubject.name,
      term: selectedTerm as any,
      schoolYear: 2026,
      title,
      generalObjective,
      bnccSkillCodes: selectedBnccCodes,
      plannedLessonsCount: plannedLessons,
      executedLessonsCount: executedLessons,
      methodologies: methodologies || 'Metodologia ativa, aulas expositivas dialogadas e resolução orientada de problemas.',
      assessmentCriteria: assessmentCriteria || 'Avaliação formativa contínua, participação, trabalhos individuais e prova bimestral.',
      resourcesNeeded: resourcesNeeded || undefined,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveLessonPlan(newPlan);
    handleReset();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            Planejamento Bimestral & Cronograma de Ensino
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Estrutura curricular do bimestre: objetivos de aprendizagem, competências da BNCC e metas de aulas.
          </p>
        </div>
      </div>

      {/* Main Grid: Form (6 cols) + Active Plans (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900">
              {editingId ? 'Editar Plano de Ensino' : 'Novo Plano de Ensino Bimestral'}
            </h4>
            {editingId && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-500 hover:text-slate-700 bg-slate-100 px-2 py-1 rounded-md"
              >
                Cancelar
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Título / Unidade Temática: *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Álgebra Linear, Geometria Analítica & Aplicações Práticas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Objetivo Geral de Aprendizagem: *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Descreva a meta pedagógica que a turma deverá alcançar ao final do bimestre..."
                value={generalObjective}
                onChange={(e) => setGeneralObjective(e.target.value)}
                className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Aulas Previstas:
                </label>
                <input
                  type="number"
                  value={plannedLessons}
                  onChange={(e) => setPlannedLessons(Number(e.target.value))}
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Aulas Ministradas:
                </label>
                <input
                  type="number"
                  value={executedLessons}
                  onChange={(e) => setExecutedLessons(Number(e.target.value))}
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Status:
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer"
                >
                  <option value="PLANEJADO">Planejado</option>
                  <option value="EM_EXECUCAO">Em Execução</option>
                  <option value="CONCLUIDO">Concluído</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Metodologias & Estratégias Pedagógicas:
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Aprendizagem Baseada em Problemas (PBL), laboratório de informática, debates em grupo..."
                value={methodologies}
                onChange={(e) => setMethodologies(e.target.value)}
                className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Critérios de Avaliação & Instrumentos:
              </label>
              <input
                type="text"
                placeholder="Ex: Provas bimestrais, projetos interdisciplinares, participação e autoavaliação..."
                value={assessmentCriteria}
                onChange={(e) => setAssessmentCriteria(e.target.value)}
                className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Check className="h-4 w-4" />
                {editingId ? 'Salvar Alterações' : 'Cadastrar Plano de Ensino'}
              </button>
            </div>
          </form>
        </div>

        {/* Plans List Column */}
        <div className="lg:col-span-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Planos Ativos do Bimestre ({currentPlans.length})
          </h4>

          {currentPlans.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 text-center">
              <Target className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Nenhum plano de ensino cadastrado</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Utilize o formulário ao lado para cadastrar as diretrizes de ensino do bimestre.
              </p>
            </div>
          ) : (
            currentPlans.map((plan) => {
              const progressPercent = Math.min(
                100,
                Math.round((plan.executedLessonsCount / (plan.plannedLessonsCount || 1)) * 100)
              );

              return (
                <div
                  key={plan.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {plan.term} • 2026
                      </span>
                      <h5 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">
                        {plan.title}
                      </h5>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(plan)}
                        className="p-1 text-slate-500 hover:text-slate-800 rounded-md"
                        title="Editar Plano"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (await confirmDialog('Deseja excluir este plano de ensino?')) {
                            onDeleteLessonPlan(plan.id);
                          }
                        }}
                        className="p-1 text-rose-500 hover:text-rose-700 rounded-md"
                        title="Excluir Plano"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Objetivo:</strong> {plan.generalObjective}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500">
                        Progresso de Execução ({plan.executedLessonsCount}/{plan.plannedLessonsCount} aulas)
                      </span>
                      <span className="text-indigo-600">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <strong>Metodologia:</strong> {plan.methodologies}
                    </div>
                    <div>
                      <strong>Avaliação:</strong> {plan.assessmentCriteria}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
