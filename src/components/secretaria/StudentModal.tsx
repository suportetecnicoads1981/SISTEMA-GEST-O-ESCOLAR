import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, AlertCircle, Sparkles } from 'lucide-react';
import { Student, SchoolClass, Course } from '../../types';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Student) => void;
  studentToEdit?: Student | null;
  classes: SchoolClass[];
  courses: Course[];
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  studentToEdit,
  classes,
  courses,
}) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    enrollmentNumber: '',
    cpf: '',
    rg: '',
    birthDate: '2008-01-01',
    gender: 'F',
    email: '',
    phone: '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    address: '',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '',
    courseId: courses[0]?.id || '',
    classId: classes[0]?.id || '',
    status: 'ACTIVE',
    entryDate: new Date().toISOString().split('T')[0],
    observations: '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (studentToEdit) {
      setFormData(studentToEdit);
    } else {
      const year = new Date().getFullYear();
      const randNum = Math.floor(100 + Math.random() * 900);
      setFormData({
        name: '',
        enrollmentNumber: `MAT-${year}-${randNum}`,
        cpf: '',
        rg: '',
        birthDate: '2008-05-15',
        gender: 'F',
        email: '',
        phone: '',
        guardianName: '',
        guardianPhone: '',
        guardianEmail: '',
        address: '',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '',
        courseId: courses[0]?.id || '',
        classId: classes[0]?.id || '',
        status: 'ACTIVE',
        entryDate: new Date().toISOString().split('T')[0],
        observations: '',
      });
    }
    setError('');
  }, [studentToEdit, isOpen, classes, courses]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('O nome do estudante é obrigatório.');
      return;
    }
    if (!formData.enrollmentNumber?.trim()) {
      setError('O número de matrícula é obrigatório.');
      return;
    }
    if (!formData.cpf?.trim()) {
      setError('O CPF do estudante é obrigatório.');
      return;
    }

    const student: Student = {
      id: studentToEdit?.id || `std-${Date.now()}`,
      name: formData.name.trim(),
      enrollmentNumber: formData.enrollmentNumber.trim(),
      cpf: formData.cpf.trim(),
      rg: formData.rg?.trim() || '',
      birthDate: formData.birthDate || '2008-01-01',
      gender: (formData.gender as 'M' | 'F' | 'OTHER') || 'F',
      email: formData.email?.trim() || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@aluno.escola.br`,
      phone: formData.phone?.trim() || '',
      guardianName: formData.guardianName?.trim() || 'Responsável Legal',
      guardianPhone: formData.guardianPhone?.trim() || '',
      guardianEmail: formData.guardianEmail?.trim() || '',
      address: formData.address?.trim() || '',
      city: formData.city?.trim() || 'São Paulo',
      state: formData.state?.trim() || 'SP',
      zipCode: formData.zipCode?.trim() || '',
      courseId: formData.courseId || courses[0]?.id || '',
      classId: formData.classId || classes[0]?.id || '',
      status: formData.status || 'ACTIVE',
      entryDate: formData.entryDate || new Date().toISOString().split('T')[0],
      photoUrl: formData.photoUrl || `https://images.unsplash.com/photo-${formData.gender === 'M' ? '1500648767791-00dcc994a43e' : '1534528741775-53994a69daeb'}?w=150&auto=format&fit=crop&q=80`,
      observations: formData.observations?.trim() || '',
    };

    onSave(student);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {studentToEdit ? 'Editar Dados da Matrícula' : 'Nova Matrícula Escolar'}
              </h2>
              <p className="text-xs text-slate-500">
                Cadastro e enturmação de estudante no sistema acadêmico
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo do Aluno *
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Ana Beatriz Souza Ribeiro"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número de Matrícula (RA) *
              </label>
              <input
                type="text"
                required
                value={formData.enrollmentNumber || ''}
                onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                placeholder="Ex: MAT-2026-001"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CPF do Aluno *
              </label>
              <input
                type="text"
                required
                value={formData.cpf || ''}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={formData.birthDate || ''}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gênero
              </label>
              <select
                value={formData.gender || 'F'}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="OTHER">Outro / Não Declarado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Turma / Enturmação *
              </label>
              <select
                value={formData.classId || ''}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.shift})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Curso / Nível
              </label>
              <select
                value={formData.courseId || ''}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {courses.map((crs) => (
                  <option key={crs.id} value={crs.id}>
                    {crs.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status da Matrícula
              </label>
              <select
                value={formData.status || 'ACTIVE'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
              >
                <option value="ACTIVE">Ativo / Regular</option>
                <option value="TRANSFERRED">Transferido</option>
                <option value="CONCLUDED">Concluído</option>
                <option value="SUSPENDED">Trancado / Suspenso</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail Institucional
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="aluno@escola.edu.br"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Dados do Responsável Legal
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Responsável
              </label>
              <input
                type="text"
                value={formData.guardianName || ''}
                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                placeholder="Nome da mãe, pai ou responsável"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone do Responsável
              </label>
              <input
                type="text"
                value={formData.guardianPhone || ''}
                onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                placeholder="(00) 00000-0000"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Endereço Residencial
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, Número, Bairro, CEP"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observações Médicas / Pedagógicas
              </label>
              <textarea
                rows={2}
                value={formData.observations || ''}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Informações adicionais, laudos, alergias ou histórico escolar relevante..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{studentToEdit ? 'Salvar Alterações' : 'Concluir Matrícula'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
