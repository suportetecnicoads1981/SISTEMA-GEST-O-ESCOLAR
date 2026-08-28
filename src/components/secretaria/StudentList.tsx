import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  Filter,
  Award,
  FileText,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Download,
  GraduationCap,
  Users,
} from 'lucide-react';
import { Student, SchoolClass, Course, AcademicHistory } from '../../types';
import { StudentModal } from './StudentModal';

interface StudentListProps {
  students: Student[];
  classes: SchoolClass[];
  courses?: Course[];
  histories?: AcademicHistory[];
  onSaveStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onIssueDocument?: (studentId: string, docType?: string) => void;
  onGenerateDocument?: (studentId: string, docType: string) => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  classes,
  courses = [],
  histories = [],
  onSaveStudent,
  onDeleteStudent,
  onIssueDocument,
  onGenerateDocument,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  const handleDocAction = (studentId: string, docType: string) => {
    if (onIssueDocument) {
      onIssueDocument(studentId, docType);
    } else if (onGenerateDocument) {
      onGenerateDocument(studentId, docType);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.enrollmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.cpf.includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesClass =
        selectedClassFilter === 'ALL' || student.classId === selectedClassFilter;

      const matchesStatus =
        selectedStatusFilter === 'ALL' || student.status === selectedStatusFilter;

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [students, searchTerm, selectedClassFilter, selectedStatusFilter]);

  const classMap = useMemo(
    () => new Map(classes.map((c) => [c.id, c.name])),
    [classes]
  );

  const handleOpenAddModal = () => {
    setStudentToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setStudentToEdit(student);
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['Matrícula', 'Nome', 'CPF', 'Turma', 'Status', 'Email', 'Telefone', 'Responsável'];
    const rows = filteredStudents.map((s) => [
      s.enrollmentNumber,
      `"${s.name}"`,
      s.cpf,
      `"${classMap.get(s.classId) || s.classId}"`,
      s.status,
      s.email,
      s.phone,
      `"${s.guardianName}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relacao_alunos_matriculados_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="bento-students-root" className="space-y-4">
      {/* Top Banner & Quick Metrics in Bento Layout */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-indigo-600" />
            Secretaria Acadêmica & Gestão de Matrículas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastro de estudantes, enturmação, documentação oficial e controle de frequência
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-students-export-csv"
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-600" />
            <span>Exportar CSV</span>
          </button>
          <button
            id="btn-students-add-student"
            onClick={handleOpenAddModal}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Nova Matrícula</span>
          </button>
        </div>
      </div>

      {/* Bento Metric Cards (4 columns) */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase mb-1">Total de Alunos</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{students.length}</span>
            <span className="text-emerald-500 text-xs font-medium">+100% no Censo</span>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase mb-1">Matrículas Ativas</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-600">
              {students.filter((s) => s.status === 'ACTIVE').length}
            </span>
            <span className="text-slate-500 text-xs font-medium">Em frequência</span>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase mb-1">Turmas Ativas</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{classes.length}</span>
            <span className="text-slate-500 text-xs font-medium">Ensino Médio & Fund.</span>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase mb-1">Status Censo Escolar</span>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold text-slate-700">Conforme MEC / INEP</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome do aluno, número de matrícula (RA), CPF ou e-mail..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full md:w-44 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium"
          >
            <option value="ALL">Todas as Turmas</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full md:w-36 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="TRANSFERRED">Transferido</option>
            <option value="CONCLUDED">Concluído</option>
            <option value="SUSPENDED">Trancado</option>
          </select>
        </div>
      </div>

      {/* Student Records Table in Bento Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Estudante</th>
                <th className="py-2.5 px-3">Matrícula (RA)</th>
                <th className="py-2.5 px-3">CPF</th>
                <th className="py-2.5 px-3">Turma</th>
                <th className="py-2.5 px-3">Contato & Responsável</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Documentos & Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Nenhum estudante encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const className = classMap.get(student.classId) || 'Turma não atribuída';
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Student Identity */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.photoUrl}
                            alt={student.name}
                            referrerPolicy="no-referrer"
                            className="h-8 w-8 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{student.name}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Nascimento:{' '}
                              {new Date(student.birthDate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* RA */}
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                        {student.enrollmentNumber}
                      </td>

                      {/* CPF */}
                      <td className="py-2.5 px-3 font-mono text-slate-600">{student.cpf}</td>

                      {/* Class */}
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-700 block">{className}</span>
                        <span className="text-[10px] text-slate-400">
                          Ano Letivo {student.enrollmentYear}
                        </span>
                      </td>

                      {/* Contact & Guardian */}
                      <td className="py-2.5 px-3 text-slate-600">
                        <p className="truncate text-slate-800 font-medium">{student.guardianName}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Phone className="h-2.5 w-2.5" />
                          {student.phone}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            student.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : student.status === 'CONCLUDED'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {student.status === 'ACTIVE'
                            ? 'Ativo'
                            : student.status === 'CONCLUDED'
                            ? 'Concluído'
                            : 'Transferido'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDocAction(student.id, 'CERTIFICADO_CONCLUSAO')}
                            title="Emitir Certificado Oficial de Conclusão"
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Award className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDocAction(student.id, 'HISTORICO_ESCOLAR')}
                            title="Emitir Histórico Escolar Completo"
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                          >
                            <FileText className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(student)}
                            title="Editar Matrícula"
                            className="p-1 text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Deseja realmente remover a matrícula de ${student.name}?`
                                )
                              ) {
                                onDeleteStudent(student.id);
                              }
                            }}
                            title="Remover Matrícula"
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Add / Edit Modal */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(student) => {
          onSaveStudent(student);
          setIsModalOpen(false);
        }}
        studentToEdit={studentToEdit}
        classes={classes}
        courses={courses}
      />
    </div>
  );
};
