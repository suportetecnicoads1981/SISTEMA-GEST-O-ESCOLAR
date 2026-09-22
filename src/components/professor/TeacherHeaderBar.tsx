import React from 'react';
import {
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  Layers,
  Award,
  ChevronDown,
  Sparkles,
  Clock,
  Building,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { Subject, SchoolClass, UserAccount } from '../../types';

interface TeacherHeaderBarProps {
  activeTeacherName: string;
  onChangeTeacher: (teacherName: string) => void;
  availableTeachers: string[];
  teacherClasses: SchoolClass[];
  teacherSubjects: Subject[];
  activeClassId: string;
  onSelectClass: (classId: string) => void;
  activeSubjectId: string;
  onSelectSubject: (subjectId: string) => void;
  selectedTerm: string;
  onChangeTerm: (term: string) => void;
  onBack?: () => void;
  backButtonLabel?: string;
}

export const TeacherHeaderBar: React.FC<TeacherHeaderBarProps> = ({
  activeTeacherName = '',
  onChangeTeacher,
  availableTeachers = [],
  teacherClasses = [],
  teacherSubjects = [],
  activeClassId = '',
  onSelectClass,
  activeSubjectId = '',
  onSelectSubject,
  selectedTerm = '1º Bimestre',
  onChangeTerm,
  onBack,
  backButtonLabel,
}) => {
  const totalWorkload = (teacherSubjects || []).reduce((acc, s) => acc + ((s && s.workloadHours) || 80), 0);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-900/40 space-y-5">
      {onBack && (
        <div className="flex items-center justify-between pb-2 border-b border-indigo-900/50">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 shadow-2xs cursor-pointer group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform text-indigo-300" />
            <span>{backButtonLabel || 'Voltar ao Painel Principal'}</span>
          </button>
        </div>
      )}

      {/* Top row: Teacher Profile Selector & Info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-600/30 border border-indigo-400/30">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-slate-900">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300 bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-700/50">
                Portal do Docente
              </span>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/50 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Ano Letivo 2026
              </span>
            </div>

            <div className="mt-1 flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {activeTeacherName}
              </h1>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Gestão pedagógica integrada: Diário de Classe, Chamada, Notas, Provas, Gabaritos e Alunos.
            </p>
          </div>
        </div>

        {/* Switch Teacher Quick Selector */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/60">
          <div className="text-xs">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Docente em Operação:
            </label>
            <div className="relative">
              <select
                value={activeTeacherName}
                onChange={(e) => onChangeTeacher(e.target.value)}
                className="text-xs font-bold text-white bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-1.5 pr-8 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none"
              >
                {availableTeachers.map((t) => (
                  <option key={t} value={t} className="bg-slate-900 text-white">
                    👨‍🏫 {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="h-9 w-px bg-slate-700 hidden sm:block" />

          {/* Quick Stat Pill */}
          <div className="flex items-center gap-3">
            <div className="bg-indigo-900/40 px-3 py-1.5 rounded-xl border border-indigo-700/30 text-center">
              <span className="block text-[10px] text-indigo-300 font-bold uppercase">Turmas</span>
              <span className="text-sm font-black text-white">{teacherClasses.length}</span>
            </div>
            <div className="bg-indigo-900/40 px-3 py-1.5 rounded-xl border border-indigo-700/30 text-center">
              <span className="block text-[10px] text-indigo-300 font-bold uppercase">Disciplinas</span>
              <span className="text-sm font-black text-white">{teacherSubjects.length}</span>
            </div>
            <div className="bg-indigo-900/40 px-3 py-1.5 rounded-xl border border-indigo-700/30 text-center hidden md:block">
              <span className="block text-[10px] text-indigo-300 font-bold uppercase">Carga Horária</span>
              <span className="text-sm font-black text-white">{totalWorkload}h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Context Bar: Active Class, Subject and Term Selector */}
      <div className="bg-slate-900/90 rounded-2xl p-3 sm:p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1 shrink-0">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              Turma:
            </span>
            <select
              value={activeClassId}
              onChange={(e) => onSelectClass(e.target.value)}
              className="text-xs font-bold text-white bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {teacherClasses.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.name} ({c.shift})
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1 shrink-0">
              <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
              Disciplina:
            </span>
            <select
              value={activeSubjectId}
              onChange={(e) => onSelectSubject(e.target.value)}
              className="text-xs font-bold text-white bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {teacherSubjects.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Term Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1 shrink-0">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              Bimestre:
            </span>
            <select
              value={selectedTerm}
              onChange={(e) => onChangeTerm(e.target.value)}
              className="text-xs font-bold text-white bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="1º Bimestre" className="bg-slate-900 text-white">1º Bimestre</option>
              <option value="2º Bimestre" className="bg-slate-900 text-white">2º Bimestre</option>
              <option value="3º Bimestre" className="bg-slate-900 text-white">3º Bimestre (Atual)</option>
              <option value="4º Bimestre" className="bg-slate-900 text-white">4º Bimestre</option>
              <option value="Recuperação Final" className="bg-slate-900 text-white">Recuperação Final</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-emerald-400" />
          <span>Sessão ativa e sincronizada</span>
        </div>
      </div>
    </div>
  );
};
