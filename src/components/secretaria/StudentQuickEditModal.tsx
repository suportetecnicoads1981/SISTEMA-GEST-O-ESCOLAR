import React, { useState, useEffect } from 'react';
import { cpfDigits, cpfState, formatAge, formatCpf, isFutureBirthDate, isValidCpf } from '../../utils/studentDocuments';
import {
  X,
  Save,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  Calendar,
  Phone,
  Home,
  HeartPulse,
  FileCheck2,
  FileText,
  Building2,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  Student,
  SchoolClass,
  SchoolUnit,
  StudentColorRace,
  CadastralStatus,
  RaceColorType,
  LocationZone,
  ClassShift,
} from '../../types';

interface StudentQuickEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  classes: SchoolClass[];
  schoolUnits?: SchoolUnit[];
  onSave: (updatedStudent: Student) => void;
}

export const StudentQuickEditModal: React.FC<StudentQuickEditModalProps> = ({
  isOpen,
  onClose,
  student,
  classes,
  schoolUnits = [],
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [error, setError] = useState<string>('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);

  useEffect(() => {
    if (student) {
      setFormData({
        ...student,
        cpf: student.cpf === '000.000.000-00' ? '' : student.cpf || '',
        birthDate:
          student.birthDate === '2020-01-01' || student.birthDate === '2012-01-01'
            ? ''
            : student.birthDate || '',
        guardianName:
          student.guardianName?.includes('Pendente') || !student.guardianName
            ? ''
            : student.guardianName,
        address:
          student.address?.toLowerCase().includes('pendente') || !student.address
            ? ''
            : student.address,
      });
      setError('');
      setSaveSuccessNotice(false);
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  // Calcula campos essenciais e completude em tempo real
  const hasCpf = Boolean(formData.cpf && formData.cpf.trim() !== '' && formData.cpf !== '000.000.000-00');
  const hasBirthDate = Boolean(formData.birthDate && formData.birthDate.trim() !== '');
  const hasGuardian = Boolean(formData.guardianName && formData.guardianName.trim() !== '' && !formData.guardianName.includes('Pendente'));
  const hasAddress = Boolean(formData.address && formData.address.trim() !== '' && !formData.address.toLowerCase().includes('pendente'));
  const hasMedicalReportChecked = !formData.medicalClassification || formData.medicalClassification === 'Não declarada' || formData.medicalClassification === 'NENHUMA' || Boolean(formData.hasMedicalReport);
  const hasPhone = Boolean(formData.phone && formData.phone.trim() !== '');

  // Pontuação de completude (0 a 100%)
  const checks = [
    Boolean(formData.name && formData.name.trim().length > 3),
    hasCpf,
    hasBirthDate,
    hasGuardian,
    hasAddress,
    hasMedicalReportChecked,
    hasPhone,
    Boolean(formData.gender),
    Boolean(formData.raceColor || formData.colorRace),
  ];
  const completedCount = checks.filter(Boolean).length;
  const completionPercentage = Math.round((completedCount / checks.length) * 100);

  // Lista dinâmica do que ainda falta preencher
  const missingItems: string[] = [];
  if (!hasCpf) missingItems.push('CPF do Aluno');
  if (!hasBirthDate) missingItems.push('Data de Nascimento');
  if (!hasGuardian) missingItems.push('Nome da Mãe / Responsável');
  if (!hasAddress) missingItems.push('Endereço Residencial');
  if (!hasPhone) missingItems.push('Telefone / WhatsApp de Contato');
  if (
    formData.medicalClassification &&
    formData.medicalClassification !== 'Não declarada' &&
    formData.medicalClassification !== 'NENHUMA' &&
    !formData.hasMedicalReport
  ) {
    missingItems.push('Laudo Médico Comprobatório (PCD)');
  }

  // Formatar CPF com máscara visual amigável
  const handleCpfChange = (raw: string) => {
    const nums = raw.replace(/\D/g, '').slice(0, 11);
    let formatted = nums;
    if (nums.length > 9) {
      formatted = `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
    } else if (nums.length > 6) {
      formatted = `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
    } else if (nums.length > 3) {
      formatted = `${nums.slice(0, 3)}.${nums.slice(3)}`;
    }
    setFormData((prev) => ({ ...prev, cpf: formatted }));
  };

  // Formatar Telefone
  const handlePhoneChange = (raw: string) => {
    const nums = raw.replace(/\D/g, '').slice(0, 11);
    let formatted = nums;
    if (nums.length > 10) {
      formatted = `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
    } else if (nums.length > 6) {
      formatted = `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`;
    } else if (nums.length > 2) {
      formatted = `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    }
    setFormData((prev) => ({ ...prev, phone: formatted, guardianPhone: formatted }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.name.trim().length < 3) {
      setError('O nome do aluno deve conter pelo menos 3 caracteres.');
      return;
    }

    // CPF: pode ficar em branco (pendência), mas se for informado precisa ser válido.
    const cpfNow = cpfState(formData.cpf);
    if (cpfNow === 'INVALIDO') {
      setError('CPF inválido. Confira os números ou deixe o campo em branco para completar depois.');
      return;
    }
    if (isFutureBirthDate(formData.birthDate)) {
      setError('A data de nascimento está no futuro. Confira o dia, o mês e o ano.');
      return;
    }

    // Recalcular pendências remanescentes
    const pendingList: string[] = [];
    const finalCpf = cpfNow === 'OK' ? formatCpf(formData.cpf) : '000.000.000-00';
    if (cpfNow !== 'OK') {
      pendingList.push('CPF do Aluno');
    }

    const finalBirth = formData.birthDate?.trim() || '2020-01-01';
    if (!formData.birthDate || formData.birthDate.trim() === '' || finalBirth === '2020-01-01') {
      pendingList.push('Data de Nascimento');
    }

    const finalGuardian = formData.guardianName?.trim() || 'Pendente de Atualização Cadastral';
    if (!formData.guardianName || formData.guardianName.trim() === '' || finalGuardian.includes('Pendente')) {
      pendingList.push('Nome da Mãe / Responsável');
    }

    const finalAddress = formData.address?.trim() || 'Endereço pendente';
    if (!formData.address || formData.address.trim() === '' || finalAddress.toLowerCase().includes('pendente')) {
      pendingList.push('Endereço');
    }

    const hasPcdDeclared = Boolean(
      formData.medicalClassification &&
      formData.medicalClassification !== 'Não declarada' &&
      formData.medicalClassification !== 'NENHUMA' &&
      formData.medicalClassification !== ''
    );

    if (hasPcdDeclared && !formData.hasMedicalReport) {
      pendingList.push('Laudo Médico PCD');
    }

    // O cadastro é 100% OK se não tiver campos pendentes críticos
    const isCadastralOk = pendingList.length === 0;

    const updatedStudent: Student = {
      ...student,
      name: formData.name.trim(),
      cpf: finalCpf,
      rg: formData.rg?.trim() || student.rg || '',
      birthDate: finalBirth,
      gender: (formData.gender as 'M' | 'F' | 'OTHER') || student.gender || 'OTHER',
      raceColor: (formData.raceColor as RaceColorType) || student.raceColor || 'NAO_DECLARADA',
      colorRace: (formData.colorRace as StudentColorRace) || student.colorRace || 'PARDO',
      guardianName: finalGuardian,
      guardianPhone: formData.guardianPhone?.trim() || formData.phone?.trim() || student.guardianPhone || '',
      phone: formData.phone?.trim() || student.phone || '',
      email: formData.email?.trim() || student.email || '',
      address: finalAddress,
      neighborhood: formData.neighborhood?.trim() || student.neighborhood || '',
      city: formData.city?.trim() || student.city || 'Belém',
      state: formData.state?.trim() || student.state || 'PA',
      zipCode: formData.zipCode?.trim() || student.zipCode || '66000-000',
      locationZone: (formData.locationZone as LocationZone) || student.locationZone || 'ZONA_RURAL',
      classId: formData.classId || student.classId,
      shift: formData.shift || student.shift,
      series: formData.series || student.series,
      medicalClassification: hasPcdDeclared ? formData.medicalClassification : undefined,
      hasMedicalReport: hasPcdDeclared ? Boolean(formData.hasMedicalReport) : false,
      medicalReportText: hasPcdDeclared ? (formData.hasMedicalReport ? 'SIM' : 'NÃO') : 'NÃO',
      medicalObservations: formData.medicalObservations || student.medicalObservations,
      observations: formData.observations || student.observations,
      pendingFields: pendingList,
      cadastralStatus: isCadastralOk ? 'OK' : 'INCOMPLETE',
    };

    onSave(updatedStudent);
    setSaveSuccessNotice(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabeçalho do Modal */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white flex items-center justify-between border-b border-indigo-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-300">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Editar e Completar Cadastro do Aluno
                </h2>
                <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 text-[10px] font-bold rounded-md uppercase tracking-wider">
                  Regularização Censo & Secretaria
                </span>
              </div>
              <p className="text-xs text-indigo-200/90 mt-0.5">
                {student.name} • Matrícula: <strong className="text-white">{student.enrollmentNumber}</strong>
                {student.schoolOriginName && ` • Origem: ${student.schoolOriginName}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Barra de Progresso de Preenchimento Cadastral */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                Nível de Completude Cadastral
              </span>
              <span
                className={`font-bold ${
                  completionPercentage >= 100
                    ? 'text-emerald-700'
                    : completionPercentage >= 70
                    ? 'text-indigo-600'
                    : 'text-amber-600'
                }`}
              >
                {completionPercentage}% Concluído
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  completionPercentage >= 100
                    ? 'bg-emerald-500'
                    : completionPercentage >= 70
                    ? 'bg-indigo-600'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          <div>
            {missingItems.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold shadow-2xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Cadastro 100% Regular & Completo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold shadow-2xs">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                {missingItems.length} {missingItems.length === 1 ? 'informação pendente' : 'informações pendentes'}
              </span>
            )}
          </div>
        </div>

        {/* Box Informativo de Campos Pendentes */}
        {missingItems.length > 0 && (
          <div className="mx-6 mt-4 p-3 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <strong className="font-bold">Informações pendentes para completar este cadastro:</strong>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {missingItems.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded-md font-semibold text-[11px]"
                  >
                    • {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Formulário Principal */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {saveSuccessNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Cadastro salvo e atualizado com sucesso no SucessoEdu!</span>
            </div>
          )}

          {/* Seção 1: Dados Pessoais & Documentos Básicos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider pb-1 border-b border-slate-200">
              <FileText className="h-4 w-4 text-indigo-600" />
              <span>1. Identificação do Aluno & Documentação</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Nome Completo */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo do Aluno *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden uppercase"
                  placeholder="Nome completo do aluno"
                />
              </div>

              {/* Matrícula (Leitura / Informativa) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Matrícula / RA
                </label>
                <input
                  type="text"
                  disabled
                  value={formData.enrollmentNumber || ''}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed font-mono"
                />
              </div>

              {/* CPF do Aluno */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    CPF do Aluno
                  </label>
                  {!hasCpf && (
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-100 px-1.5 py-0.2 rounded">
                      Pendente
                    </span>
                  )}
                  {hasCpf && cpfDigits(formData.cpf).length === 11 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        isValidCpf(formData.cpf) ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'
                      }`}
                    >
                      {isValidCpf(formData.cpf) ? '✓ Válido' : 'CPF inválido'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.cpf || ''}
                  onChange={(e) => handleCpfChange(e.target.value)}
                  maxLength={14}
                  placeholder="000.000.000-00"
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-hidden font-mono transition-colors ${
                    !hasCpf
                      ? 'border-amber-400 bg-amber-50/30 focus:ring-2 focus:ring-amber-500'
                      : 'border-slate-300 focus:ring-2 focus:ring-indigo-500'
                  }`}
                />
              </div>

              {/* Data de Nascimento */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Data de Nascimento
                    {formatAge(formData.birthDate) && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                        Idade: {formatAge(formData.birthDate)}
                      </span>
                    )}
                  </label>
                  {!hasBirthDate && (
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-100 px-1.5 py-0.2 rounded">
                      Pendente
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={formData.birthDate || ''}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-hidden transition-colors ${
                    !hasBirthDate
                      ? 'border-amber-400 bg-amber-50/30 focus:ring-2 focus:ring-amber-500'
                      : 'border-slate-300 focus:ring-2 focus:ring-indigo-500'
                  }`}
                />
              </div>

              {/* Sexo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sexo
                </label>
                <select
                  value={formData.gender || 'OTHER'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white"
                >
                  <option value="M">Masculino (M)</option>
                  <option value="F">Feminino (F)</option>
                  <option value="OTHER">Não Declarado / Outro</option>
                </select>
              </div>

              {/* Cor / Raça (Censo Escolar / IBGE) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cor / Raça (Censo IBGE)
                </label>
                <select
                  value={formData.raceColor || 'PARDA'}
                  onChange={(e) => setFormData({ ...formData, raceColor: e.target.value as any, colorRace: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white"
                >
                  <option value="PARDA">Parda</option>
                  <option value="BRANCA">Branca</option>
                  <option value="PRETA">Preta</option>
                  <option value="AMARELA">Amarela</option>
                  <option value="INDIGENA">Indígena</option>
                  <option value="NAO_DECLARADA">Não Declarada</option>
                </select>
              </div>

              {/* RG do Aluno (Opcional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RG / Certidão de Nascimento
                </label>
                <input
                  type="text"
                  value={formData.rg || ''}
                  onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                  placeholder="Número do RG ou Certidão"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              {/* NIS / Bolsa Família */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIS / CadÚnico (Bolsa Família)
                </label>
                <input
                  type="text"
                  value={formData.observations?.match(/NIS:\s*(\d+)/)?.[1] || ''}
                  onChange={(e) => {
                    const nisVal = e.target.value.trim();
                    const prevObs = (formData.observations || '').replace(/;\s*NIS:\s*\d*/g, '');
                    setFormData({
                      ...formData,
                      observations: nisVal ? `${prevObs}; NIS: ${nisVal}` : prevObs,
                    });
                  }}
                  placeholder="Número do NIS"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Filiação & Contatos da Família */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider pb-1 border-b border-slate-200">
              <Phone className="h-4 w-4 text-indigo-600" />
              <span>2. Filiação & Contatos do Responsável Legal</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Nome da Mãe / Responsável Principal */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Nome da Mãe / Responsável Principal *
                  </label>
                  {!hasGuardian && (
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-100 px-1.5 py-0.2 rounded">
                      Pendente Censo
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.guardianName || ''}
                  onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                  placeholder="Nome completo da mãe ou responsável legal"
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-hidden uppercase transition-colors ${
                    !hasGuardian
                      ? 'border-amber-400 bg-amber-50/30 focus:ring-2 focus:ring-amber-500'
                      : 'border-slate-300 focus:ring-2 focus:ring-indigo-500'
                  }`}
                />
              </div>

              {/* Telefone / WhatsApp */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    WhatsApp / Telefone de Contato
                  </label>
                  {!hasPhone && (
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-100 px-1.5 py-0.2 rounded">
                      Recomendado
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(91) 98765-4321"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden font-mono"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Endereço & Localização (Zona Urbana / Rural) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider pb-1 border-b border-slate-200">
              <Home className="h-4 w-4 text-indigo-600" />
              <span>3. Endereço Residencial & Localização</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Endereço / Rua / Vila */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Endereço Completo (Rua, Vila, Comunidade, Nº) *
                  </label>
                  {!hasAddress && (
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-100 px-1.5 py-0.2 rounded">
                      Pendente
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ex: Vila Brilhante, Rua Principal, s/n"
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-hidden uppercase transition-colors ${
                    !hasAddress
                      ? 'border-amber-400 bg-amber-50/30 focus:ring-2 focus:ring-amber-500'
                      : 'border-slate-300 focus:ring-2 focus:ring-indigo-500'
                  }`}
                />
              </div>

              {/* Bairro / Localidade */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bairro / Localidade
                </label>
                <input
                  type="text"
                  value={formData.neighborhood || ''}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder="Bairro ou Comunidade"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden uppercase"
                />
              </div>

              {/* Zona de Localização (Censo) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Zona de Residência
                </label>
                <select
                  value={formData.locationZone || 'ZONA_RURAL'}
                  onChange={(e) => setFormData({ ...formData, locationZone: e.target.value as LocationZone })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white"
                >
                  <option value="ZONA_RURAL">Zona Rural / Ribeirinha</option>
                  <option value="ZONA_URBANA">Zona Urbana</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção 4: Enturmação, Turno e Escola de Referência */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider pb-1 border-b border-slate-200">
              <Building2 className="h-4 w-4 text-indigo-600" />
              <span>4. Enturmação, Turno & Série</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Turma */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Turma Vinculada *
                </label>
                <select
                  value={formData.classId || ''}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.shift})
                    </option>
                  ))}
                </select>
              </div>

              {/* Turno */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Turno
                </label>
                <select
                  value={formData.shift || 'MANHÃ'}
                  onChange={(e) => setFormData({ ...formData, shift: e.target.value as ClassShift })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white"
                >
                  <option value="MANHÃ">Manhã</option>
                  <option value="TARDE">Tarde</option>
                  <option value="INTEGRAL">Integral</option>
                  <option value="NOITE">Noite</option>
                </select>
              </div>

              {/* Série / Etapa de Referência */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Série / Etapa (Censo)
                </label>
                <input
                  type="text"
                  value={formData.series || 'PRÉ II'}
                  onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                  placeholder="Ex: PRÉ II, 1º ANO"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden uppercase"
                />
              </div>
            </div>
          </div>

          {/* Seção 5: Saúde, AEE & Laudo Médico (Censo / Inclusão) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider pb-1 border-b border-slate-200">
              <HeartPulse className="h-4 w-4 text-indigo-600" />
              <span>5. Saúde, Inclusão & Laudo Médico (AEE / Censo)</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Condição Médica / Necessidade Especial */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Condição Especial / PCD / AEE
                  </label>
                  <select
                    value={formData.medicalClassification || 'NENHUMA'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        medicalClassification: val === 'NENHUMA' ? '' : val,
                        hasMedicalReport: val === 'NENHUMA' ? false : formData.hasMedicalReport,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white"
                  >
                    <option value="NENHUMA">Nenhuma deficiência declarada</option>
                    <option value="TEA">TEA - Transtorno do Espectro Autista</option>
                    <option value="TDAH">TDAH - Déficit de Atenção / Hiperatividade</option>
                    <option value="DEFICIÊNCIA FÍSICA">Deficiência Física / Mobilidade</option>
                    <option value="DEFICIÊNCIA VISUAL">Deficiência Visual / Baixa Visão</option>
                    <option value="DEFICIÊNCIA AUDITIVA">Deficiência Auditiva / Surdez</option>
                    <option value="DEFICIÊNCIA INTELECTUAL">Deficiência Intelectual</option>
                    <option value="ALTAS HABILIDADES">Altas Habilidades / Superdotação</option>
                    <option value="OUTRA">Outra Necessidade Especial</option>
                  </select>
                </div>

                {/* Possui Laudo Médico? */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Possui Laudo Médico Anexado?
                  </label>
                  <select
                    value={formData.hasMedicalReport ? 'SIM' : 'NAO'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hasMedicalReport: e.target.value === 'SIM',
                        medicalReportText: e.target.value === 'SIM' ? 'SIM' : 'NÃO',
                      })
                    }
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-hidden bg-white font-bold ${
                      formData.medicalClassification &&
                      formData.medicalClassification !== 'NENHUMA' &&
                      !formData.hasMedicalReport
                        ? 'border-amber-400 text-amber-900 bg-amber-50'
                        : 'border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="NAO">Não Possui Laudo no Momento</option>
                    <option value="SIM">Sim, Laudo Médico Comprovado</option>
                  </select>
                </div>
              </div>

              {/* Alerta de Laudo Pendente se PCD declarado */}
              {formData.medicalClassification &&
                formData.medicalClassification !== 'NENHUMA' &&
                !formData.hasMedicalReport && (
                  <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-xl flex items-center gap-2 text-xs text-amber-900">
                    <Info className="h-4 w-4 text-amber-700 shrink-0" />
                    <span>
                      O aluno foi indicado como PCD ({formData.medicalClassification}). O Censo exige laudo médico. Você pode salvar agora e a secretaria solicitará o laudo à família.
                    </span>
                  </div>
                )}
            </div>
          </div>
        </form>

        {/* Rodapé com Ações */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600 hidden sm:inline">
              {missingItems.length === 0 ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Pronto para deixar o cadastro 100% completo!
                </span>
              ) : (
                <span>
                  Faltando: <strong>{missingItems.length} campos</strong>
                </span>
              )}
            </span>

            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Salvar e Concluir Cadastro</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
