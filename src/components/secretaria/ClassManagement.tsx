import React, { useState } from 'react';
import { Layers, Plus, Users, BookOpen, Clock, Edit2, Trash2, CheckCircle2, GraduationCap } from 'lucide-react';
import { SchoolClass, Course, Subject, Student } from '../../types';

interface ClassManagementProps {
  classes: SchoolClass[];
  courses: Course[];
  subjects: Subject[];
  students: Student[];
  onSaveClass: (cls: SchoolClass) => void;
  onDeleteClass: (id: string) => void;
}

export const ClassManagement: React.FC<ClassManagementProps> = ({
  classes,
  courses,
  subjects,
  students,
  onSaveClass,
  onDeleteClass,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [formData, setFormData] = useState<Partial<SchoolClass>>({
    name: '',
    gradeLevel: '3º Ano',
    segment: 'ENSINO_MEDIO',
    shift: 'MANHÃ',
    schoolYear: 2026,
    maxCapacity: 35,
    roomNumber: 'Sala 101',
    classTeacher: '',
  });

  const handleOpenAdd = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      gradeLevel: '3º Ano',
      segment: 'ENSINO_MEDIO',
      shift: 'MANHÃ',
      schoolYear: 2026,
      maxCapacity: 35,
      roomNumber: 'Sala 101',
      classTeacher: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: SchoolClass) => {
    setEditingClass(cls);
    setFormData(cls);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const newClass: SchoolClass = {
      id: editingClass?.id || `class-${Date.now()}`,
      name: formData.name.trim(),
      gradeLevel: formData.gradeLevel || '3º Ano',
      segment: (formData.segment as any) || 'ENSINO_MEDIO',
      shift: (formData.shift as any) || 'MANHÃ',
      schoolYear: Number(formData.schoolYear) || 2026,
      maxCapacity: Number(formData.maxCapacity) || 35,
      roomNumber: formData.roomNumber?.trim() || 'Sala 101',
      classTeacher: formData.classTeacher?.trim() || '',
    };

    onSaveClass(newClass);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            Gestão de Turmas, Cursos e Matrizes Curriculares
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organização dos ciclos letivos, capacidade de salas e atribuição de professores regentes
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Cadastrar Nova Turma</span>
        </button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes.map((cls) => {
          const enrolledCount = students.filter((s) => s.classId === cls.id).length;
          const capacityPercent = Math.min(100, Math.round((enrolledCount / cls.maxCapacity) * 100));

          return (
            <div
              key={cls.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1.5">
                      {cls.segment.replace('_', ' ')} • Ano {cls.schoolYear}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{cls.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cls)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Excluir a turma ${cls.name}?`)) {
                          onDeleteClass(cls.id);
                        }
                      }}
                      className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Turno:</span>
                    <span className="font-semibold text-slate-800">{cls.shift}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Espaço Físico:</span>
                    <span className="font-semibold text-slate-800">{cls.roomNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Professor Regente:</span>
                    <span className="font-semibold text-slate-800">{cls.classTeacher || 'A designar'}</span>
                  </div>
                </div>

                {/* Capacity progress bar */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      Ocupação
                    </span>
                    <span className="font-bold text-slate-800">
                      {enrolledCount} / {cls.maxCapacity} ({capacityPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        capacityPercent >= 90
                          ? 'bg-rose-500'
                          : capacityPercent >= 70
                          ? 'bg-indigo-600'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${capacityPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Disciplines / Subjects Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-600" />
          Matriz de Disciplinas e Carga Horária (BNCC & Itinerários)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Disciplina</th>
                <th className="py-2.5 px-3">Segmento</th>
                <th className="py-2.5 px-3">Docente Responsável</th>
                <th className="py-2.5 px-3 text-right">Carga Horária Anual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 font-mono font-semibold text-indigo-600">{sub.code}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">{sub.name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{sub.segment}</td>
                  <td className="py-2.5 px-3 text-slate-600">{sub.teacherName}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-slate-800">{sub.workloadHours} h/a</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingClass ? 'Editar Dados da Turma' : 'Nova Turma'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Turma *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: 3º Ano A - Ensino Médio"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Turno</label>
                  <select
                    value={formData.shift || 'MANHÃ'}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  >
                    <option value="MANHÃ">Manhã</option>
                    <option value="TARDE">Tarde</option>
                    <option value="NOITE">Noite</option>
                    <option value="INTEGRAL">Integral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ano Letivo</label>
                  <input
                    type="number"
                    value={formData.schoolYear || 2026}
                    onChange={(e) => setFormData({ ...formData, schoolYear: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Capacidade Máxima</label>
                  <input
                    type="number"
                    value={formData.maxCapacity || 35}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sala de Aula</label>
                  <input
                    type="text"
                    value={formData.roomNumber || ''}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="Ex: Sala 204"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Professor Regente</label>
                <input
                  type="text"
                  value={formData.classTeacher || ''}
                  onChange={(e) => setFormData({ ...formData, classTeacher: e.target.value })}
                  placeholder="Nome do professor orientador da turma"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Salvar Turma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
