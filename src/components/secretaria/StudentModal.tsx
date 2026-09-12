import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Save,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  UserX,
  ShieldAlert,
  Search,
  FileCheck2,
  PhoneCall,
  Calendar,
  Building,
  HeartPulse,
  Activity,
  Plus,
  Tag,
  Check,
  Building2,
} from 'lucide-react';
import {
  Student,
  SchoolClass,
  Course,
  SchoolUnit,
  StudentColorRace,
  CadastralStatus,
  StudentStatus,
  DropoutReasonKey,
  ActiveSearchStatus,
  DROPOUT_REASON_INFO,
  CADASTRAL_STATUS_INFO,
  ACTIVE_SEARCH_STATUS_INFO,
} from '../../types';
import { SchoolUnitModal } from '../municipal/SchoolUnitModal';
import { PhotoUploadInput } from '../common/PhotoUploadInput';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Student) => void;
  studentToEdit?: Student | null;
  classes: SchoolClass[];
  courses: Course[];
  schoolUnits?: SchoolUnit[];
  onSaveSchoolUnit?: (unit: SchoolUnit) => void;
}

const MEDICAL_CONDITIONS_LIST = [
  { code: 'F84', label: 'TEA (Transtorno do Espectro Autista)', need: 'TEA', desc: 'CID F84 - Autismo Infantil e Atípico' },
  { code: 'F90', label: 'TDAH (Déficit de Atenção e Hiperatividade)', need: 'TDAH', desc: 'CID F90 - Transtornos Hipercinéticos' },
  { code: 'F70', label: 'Deficiência Intelectual', need: 'DEFICIENCIA_INTELECTUAL', desc: 'CID F70 - Retardo Mental Leve/Moderado' },
  { code: 'H54', label: 'Deficiência Visual / Baixa Visão', need: 'DEFICIENCIA_VISUAL', desc: 'CID H54 - Cegueira ou Baixa Visão' },
  { code: 'H90', label: 'Deficiência Auditiva / Surdez', need: 'DEFICIENCIA_AUDITIVA', desc: 'CID H90 - Perda Auditiva Bilateral' },
  { code: 'G80', label: 'Deficiência Física / Motora', need: 'DEFICIENCIA_FISICA', desc: 'CID G80 - Paralisia Cerebral / Mobilidade' },
  { code: 'F81', label: 'Dislexia / T. de Aprendizagem', need: 'DISLEXIA', desc: 'CID F81 - Transtorno Específico de Habilidades Escolares' },
  { code: 'Z73', label: 'Altas Habilidades / Superdotação', need: 'SUPERDOTACAO', desc: 'CID Z73 - Problemas de Organização / Potencial Elevado' },
  { code: 'G40', label: 'Epilepsia / Crises Convulsivas', need: 'EPILEPSIA', desc: 'CID G40 - Acompanhamento Neurológico' },
  { code: 'E10', label: 'Diabetes Tipo 1 (Insulino-dependente)', need: 'DIABETES', desc: 'CID E10 - Controle Glicêmico Escolar' },
  { code: 'J45', label: 'Asma / Doença Respiratória', need: 'ASMA', desc: 'CID J45 - Cuidados em Atividades Físicas' },
];

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  studentToEdit,
  classes,
  courses,
  schoolUnits = [],
  onSaveSchoolUnit,
}) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    enrollmentNumber: '',
    cpf: '',
    rg: '',
    birthDate: '2008-01-01',
    gender: 'F',
    colorRace: 'PARDO',
    schoolUnitId: schoolUnits[0]?.id || '',
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
    cadastralStatus: 'OK',
    entryDate: new Date().toISOString().split('T')[0],
    observations: '',
    medicalObservations: '',
    cidCodes: [],
    specialNeeds: [],
    hasAeeSupport: false,
    bloodType: '',
    dropoutReason: undefined,
    dropoutDate: undefined,
    dropoutObservation: '',
    dropoutIntervention: undefined,
  });

  const [cidInput, setCidInput] = useState('');
  const [error, setError] = useState('');
  const [isSchoolUnitModalOpen, setIsSchoolUnitModalOpen] = useState(false);

  useEffect(() => {
    if (studentToEdit) {
      setFormData({
        ...studentToEdit,
        colorRace: studentToEdit.colorRace || 'PARDO',
        schoolUnitId: studentToEdit.schoolUnitId || schoolUnits[0]?.id || '',
        cidCodes: studentToEdit.cidCodes || [],
        specialNeeds: studentToEdit.specialNeeds || [],
        hasAeeSupport: studentToEdit.hasAeeSupport || false,
        cadastralStatus: studentToEdit.cadastralStatus || 'OK',
        medicalObservations: studentToEdit.medicalObservations || '',
        dropoutIntervention: studentToEdit.dropoutIntervention || {
          searchStatus: 'EM_BUSCA_ATIVA',
          responsibleAgent: 'Equipe de Acompanhamento SME',
          caseOpenedDate: studentToEdit.dropoutDate || new Date().toISOString().split('T')[0],
          contactAttempts: [],
          conselhoTutelarNotified: false,
          crasNotified: false,
          actionsTaken: '',
        },
      });
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
        colorRace: 'PARDO',
        schoolUnitId: schoolUnits[0]?.id || '',
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
        cadastralStatus: 'OK',
        entryDate: new Date().toISOString().split('T')[0],
        observations: '',
        medicalObservations: '',
        cidCodes: [],
        specialNeeds: [],
        hasAeeSupport: false,
        bloodType: '',
        dropoutReason: undefined,
        dropoutDate: undefined,
        dropoutObservation: '',
        dropoutIntervention: {
          searchStatus: 'EM_BUSCA_ATIVA',
          responsibleAgent: 'Equipe Multiprofissional SME',
          caseOpenedDate: new Date().toISOString().split('T')[0],
          contactAttempts: [],
          conselhoTutelarNotified: false,
          crasNotified: false,
          actionsTaken: '',
        },
      });
    }
    setError('');
  }, [studentToEdit, isOpen, classes, courses, schoolUnits]);

  if (!isOpen) return null;

  const handleAddCid = (cidToAdd?: string, needToAdd?: string) => {
    const targetCid = (cidToAdd || cidInput).trim().toUpperCase();
    if (!targetCid) return;

    setFormData((prev) => {
      const currentCids = prev.cidCodes || [];
      const currentNeeds = prev.specialNeeds || [];
      const newCids = currentCids.includes(targetCid) ? currentCids : [...currentCids, targetCid];
      const newNeeds = needToAdd && !currentNeeds.includes(needToAdd) ? [...currentNeeds, needToAdd] : currentNeeds;

      return {
        ...prev,
        cidCodes: newCids,
        specialNeeds: newNeeds,
        hasAeeSupport: true, // Auto habilita AEE quando adiciona condição/CID
      };
    });

    setCidInput('');
  };

  const handleRemoveCid = (cidToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      cidCodes: (prev.cidCodes || []).filter((c) => c !== cidToRemove),
    }));
  };

  const handleToggleCondition = (item: { code: string; label: string; need: string }) => {
    setFormData((prev) => {
      const currentCids = prev.cidCodes || [];
      const currentNeeds = prev.specialNeeds || [];
      const isSelected = currentCids.includes(item.code) || currentNeeds.includes(item.need);

      if (isSelected) {
        return {
          ...prev,
          cidCodes: currentCids.filter((c) => c !== item.code),
          specialNeeds: currentNeeds.filter((n) => n !== item.need),
        };
      } else {
        return {
          ...prev,
          cidCodes: [...currentCids, item.code],
          specialNeeds: currentNeeds.includes(item.need) ? currentNeeds : [...currentNeeds, item.need],
          hasAeeSupport: true,
        };
      }
    });
  };

  const handleInsertObservationPreset = (textToAppend: string) => {
    setFormData((prev) => {
      const existing = prev.medicalObservations || '';
      const updated = existing ? `${existing}\n• ${textToAppend}` : `• ${textToAppend}`;
      return { ...prev, medicalObservations: updated };
    });
  };

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

    if (formData.status === 'EVADIDO' && !formData.dropoutReason) {
      setError('Por favor selecione o motivo da evasão escolar conforme os padrões do Censo MEC.');
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
      colorRace: (formData.colorRace as StudentColorRace) || 'PARDO',
      schoolUnitId: formData.schoolUnitId || schoolUnits[0]?.id || '',
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
      status: (formData.status as StudentStatus) || 'ACTIVE',
      cadastralStatus: (formData.cadastralStatus as CadastralStatus) || 'OK',
      entryDate: formData.entryDate || new Date().toISOString().split('T')[0],
      photoUrl: formData.photoUrl || `https://images.unsplash.com/photo-${formData.gender === 'M' ? '1500648767791-00dcc994a43e' : '1534528741775-53994a69daeb'}?w=150&auto=format&fit=crop&q=80`,
      observations: formData.observations?.trim() || '',
      medicalObservations: formData.medicalObservations?.trim() || '',
      cidCodes: formData.cidCodes || [],
      specialNeeds: formData.specialNeeds || [],
      hasAeeSupport: Boolean(formData.hasAeeSupport),
      bloodType: formData.bloodType || '',
      dropoutReason: formData.status === 'EVADIDO' ? formData.dropoutReason : undefined,
      dropoutDate: formData.status === 'EVADIDO' ? (formData.dropoutDate || new Date().toISOString().split('T')[0]) : undefined,
      dropoutObservation: formData.status === 'EVADIDO' ? formData.dropoutObservation : undefined,
      dropoutIntervention: formData.status === 'EVADIDO' ? formData.dropoutIntervention : undefined,
    };

    onSave(student);
  };

  const handleSaveInlineSchoolUnit = (unit: SchoolUnit) => {
    if (onSaveSchoolUnit) {
      onSaveSchoolUnit(unit);
    }
    setFormData((prev) => ({ ...prev, schoolUnitId: unit.id }));
    setIsSchoolUnitModalOpen(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
          {/* Modal Header */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {studentToEdit ? 'Editar Dados da Matrícula & Prontuário' : 'Nova Matrícula Escolar'}
                </h2>
                <p className="text-xs text-slate-500">
                  Identificação, Cor/Raça Censo, Escola Matriculada, CID/TEA/TDAH e Acompanhamento
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Modal Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Upload / Captura de Foto do Estudante */}
            <div className="sm:col-span-2">
              <PhotoUploadInput
                photoUrl={formData.photoUrl}
                onPhotoChange={(newPhoto) => setFormData((prev) => ({ ...prev, photoUrl: newPhoto }))}
                label="Foto Oficial do Estudante / Carteirinha"
                sublabel="Carregue uma foto 3x4 ou use a webcam do computador para registro escolar"
                shape="rounded"
                size="md"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Student Basic Info */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo do Estudante *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Maria Eduarda Silva"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              {/* SELEÇÃO DA ESCOLA ONDE ESTÁ MATRICULADO + BOTÃO DE CADASTRAR NOVA ESCOLA */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Unidade Escolar / Escola Matriculada *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsSchoolUnitModalOpen(true)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>+ Cadastrar Nova Escola</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <select
                    value={formData.schoolUnitId || ''}
                    onChange={(e) => setFormData({ ...formData, schoolUnitId: e.target.value })}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-indigo-50/40 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {schoolUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name} ({unit.zone === 'RURAL' || (unit as any).locationZone === 'ZONA_RURAL' ? 'Zona Rural' : 'Zona Urbana'}) - {unit.city}/{unit.state}
                      </option>
                    ))}
                    {schoolUnits.length === 0 && (
                      <option value="">Escola Municipal Principal (Sede)</option>
                    )}
                  </select>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Vínculo oficial da matrícula na unidade escolar da rede municipal.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de Matrícula (RA) *
                </label>
                <input
                  type="text"
                  value={formData.enrollmentNumber || ''}
                  onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                  placeholder="Ex: MAT-2026-101"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CPF do Estudante *
                </label>
                <input
                  type="text"
                  value={formData.cpf || ''}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={formData.birthDate || '2008-01-01'}
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

              {/* SELEÇÃO DA COR / RAÇA CONFORME O CENSO ESCOLAR */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Cor / Raça / Etnia (Censo Escolar / MEC) *
                </label>
                <select
                  value={formData.colorRace || 'PARDO'}
                  onChange={(e) => setFormData({ ...formData, colorRace: e.target.value as StudentColorRace })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="BRANCO">BRANCO (Branca)</option>
                  <option value="PARDO">PARDO (Parda)</option>
                  <option value="NEGRO">NEGRO (Preta / Negra)</option>
                  <option value="AMARELO">AMARELO (Asiática / Amarela)</option>
                  <option value="INDIGINA">INDÍGENA (Povos Originários / Aldeados)</option>
                  <option value="NAO_DECLARADO">NÃO DECLARADO</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Classificação oficial para relatórios do Educacenso e FNDE.
                </p>
              </div>

              {/* TIPO SANGUÍNEO */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo Sanguíneo / Fator Rh
                </label>
                <select
                  value={formData.bloodType || ''}
                  onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Não informado</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              {/* SEÇÃO DA SAÚDE, OBSERVAÇÕES MÉDICAS, CID E TEA/TDAH */}
              <div className="sm:col-span-2 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 rounded-lg bg-rose-100 text-rose-700">
                    <HeartPulse className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Observações Médicas, Laudos & CIDs de Doenças (TEA, TDAH, Inclusão)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Registro de necessidades educacionais específicas, laudo médico e CIDs para Atendimento Educacional Especializado (AEE)
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                  {/* PRESETS RÁPIDOS DE CIDs E CONDIÇÕES */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <label className="block text-xs font-bold text-slate-800">
                        Condições Especiais & CIDs Frequentes:
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Clique em uma condição ou selecione na lista abaixo:
                      </span>
                    </div>

                    {/* SELECT DROPDOWN DIRETO PARA ESCOLHA RÁPIDA */}
                    <div className="mb-3">
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          const found = MEDICAL_CONDITIONS_LIST.find((c) => c.code === val);
                          if (found) {
                            handleAddCid(found.code, found.need);
                            handleInsertObservationPreset(`${found.label} (${found.desc})`);
                          }
                          e.target.value = '';
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-rose-200 bg-white font-bold text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-xs"
                      >
                        <option value="">➕ Selecionar Condição / CID da Lista Oficial...</option>
                        {MEDICAL_CONDITIONS_LIST.map((item) => (
                          <option key={item.code} value={item.code}>
                            CID {item.code} - {item.label} ({item.desc})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {MEDICAL_CONDITIONS_LIST.map((item) => {
                        const isCidSelected = (formData.cidCodes || []).includes(item.code);
                        const isNeedSelected = (formData.specialNeeds || []).includes(item.need);
                        const active = isCidSelected || isNeedSelected;
                        return (
                          <button
                            key={item.code}
                            type="button"
                            onClick={() => {
                              handleToggleCondition(item);
                              if (!active) {
                                handleInsertObservationPreset(`${item.label} (CID ${item.code})`);
                              }
                            }}
                            className={`p-2.5 text-left rounded-xl transition-all border flex items-start gap-2 cursor-pointer ${
                              active
                                ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500/20 text-rose-900 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:bg-rose-50/50'
                            }`}
                          >
                            <div
                              className={`mt-0.5 h-4 w-4 rounded flex items-center justify-center shrink-0 ${
                                active ? 'bg-rose-600 text-white' : 'border border-slate-300 bg-slate-50'
                              }`}
                            >
                              {active ? <Check className="h-3 w-3" /> : <Activity className="h-2.5 w-2.5 text-slate-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold leading-tight">{item.label}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ADICIONAR CID PERSONALIZADO */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80">
                    <div className="flex-1 min-w-[220px]">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={cidInput}
                          onChange={(e) => setCidInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCid();
                            }
                          }}
                          placeholder="Digitar código CID manual (Ex: F84.0, F90.0, G40, E10, H54)..."
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-mono uppercase focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCid()}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Adicionar CID</span>
                        </button>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 p-2 bg-indigo-50 border border-indigo-200 rounded-xl cursor-pointer text-xs font-bold text-indigo-900">
                      <input
                        type="checkbox"
                        checked={formData.hasAeeSupport || false}
                        onChange={(e) => setFormData({ ...formData, hasAeeSupport: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                      />
                      <span>Atendimento Educacional Especializado (AEE / Sala de Recursos)</span>
                    </label>
                  </div>

                  {/* CIDs ATUALMENTE VINCULADOS */}
                  {formData.cidCodes && formData.cidCodes.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-rose-50/70 border border-rose-200 rounded-xl">
                      <span className="text-xs font-bold text-rose-900 mr-1 flex items-center gap-1">
                        <Tag className="h-3 w-3 text-rose-600" />
                        CIDs Registrados no Prontuário ({formData.cidCodes.length}):
                      </span>
                      {formData.cidCodes.map((cid) => (
                        <span
                          key={cid}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-rose-600 text-white shadow-xs"
                        >
                          <span>CID {cid}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCid(cid)}
                            className="hover:bg-rose-700 rounded p-0.5 font-bold ml-1 cursor-pointer"
                            title="Remover CID"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* CAMPO DE TEXTO LIVRE PARA OBSERVAÇÕES MÉDICAS, ALERGIAS E MEDICAMENTOS */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Prontuário / Observações Médicas, Alergias & Restrições Alimentares:
                      </label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleInsertObservationPreset('Possui laudo médico neurológico atualizado.')}
                          className="text-[10px] text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md hover:bg-slate-50 cursor-pointer"
                        >
                          + Laudo Médico
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertObservationPreset('Faz uso de medicação contínua durante o turno.')}
                          className="text-[10px] text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md hover:bg-slate-50 cursor-pointer"
                        >
                          + Medicação
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertObservationPreset('Alergia alimentar / intolerância severa.')}
                          className="text-[10px] text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md hover:bg-slate-50 cursor-pointer"
                        >
                          + Alergia
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      value={formData.medicalObservations || ''}
                      onChange={(e) => setFormData({ ...formData, medicalObservations: e.target.value })}
                      placeholder="Informe diagnósticos, acompanhamentos com psicopedagogo/neurologista, uso contínuo de medicamentos, alergias a alimentos/medicamentos ou restrições para educação física..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO DA SITUAÇÃO CADASTRAL & STATUS ESCOLAR */}
              <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileCheck2 className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Situação Cadastral & Status da Matrícula</span>
                </h3>
              </div>

              {/* SITUAÇÃO CADASTRAL (SE O CADASTRO ESTÁ OK OU COM PENDÊNCIAS) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Situação do Cadastro do Aluno
                </label>
                <select
                  value={formData.cadastralStatus || 'OK'}
                  onChange={(e) => setFormData({ ...formData, cadastralStatus: e.target.value as CadastralStatus })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                    formData.cadastralStatus === 'OK'
                      ? 'border-emerald-300 bg-emerald-50/50 text-emerald-800'
                      : formData.cadastralStatus === 'PENDING_DOCS'
                      ? 'border-amber-300 bg-amber-50/50 text-amber-800'
                      : 'border-rose-300 bg-rose-50/50 text-rose-800'
                  }`}
                >
                  <option value="OK">Cadastro Regular / OK (Documentação Completa)</option>
                  <option value="PENDING_DOCS">Pendência de Documentos (Certidão/CPF/Comprovante)</option>
                  <option value="INCOMPLETE">Cadastro Incompleto (Falta Responsável/Endereço)</option>
                  <option value="NEEDS_UPDATE">Necessita Atualização Cadastral</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {CADASTRAL_STATUS_INFO[formData.cadastralStatus || 'OK']?.desc}
                </p>
              </div>

              {/* STATUS DA MATRÍCULA (ATIVO, TRANSFERIDO, CONCLUÍDO, EVADIDO) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status da Matrícula Escolar
                </label>
                <select
                  value={formData.status || 'ACTIVE'}
                  onChange={(e) => {
                    const newStatus = e.target.value as StudentStatus;
                    setFormData({
                      ...formData,
                      status: newStatus,
                      dropoutReason: newStatus === 'EVADIDO' ? formData.dropoutReason || 'DESINTERESSE' : undefined,
                      dropoutDate: newStatus === 'EVADIDO' ? formData.dropoutDate || new Date().toISOString().split('T')[0] : undefined,
                    });
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-xl border font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                    formData.status === 'ACTIVE'
                      ? 'border-emerald-300 bg-emerald-50/50 text-emerald-800'
                      : formData.status === 'EVADIDO'
                      ? 'border-rose-300 bg-rose-50/50 text-rose-800'
                      : 'border-slate-300 bg-slate-50 text-slate-800'
                  }`}
                >
                  <option value="ACTIVE">Ativo / Regularmente Frequente</option>
                  <option value="TRANSFERRED">Transferido para Outra Escola/Rede</option>
                  <option value="GRADUATED">Concluinte / Formado</option>
                  <option value="EVADIDO">Evadido / Abandono Escolar (Censo MEC)</option>
                </select>
              </div>

              {/* SEÇÃO EXTRA SE O ALUNO FOR DECLARADO COMO EVADIDO */}
              {formData.status === 'EVADIDO' && (
                <div className="sm:col-span-2 p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-rose-600 text-white">
                      <UserX className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                        Registro de Evasão Escolar & Protocolo de Busca Ativa (Censo MEC)
                      </h3>
                      <p className="text-[11px] text-rose-700">
                        Informações obrigatórias para prestação de contas no Educacenso e acionamento da rede de proteção
                      </p>
                    </div>
                  </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-rose-900 mb-1">
                      Motivo Principal da Evasão *
                    </label>
                    <select
                      value={formData.dropoutReason || 'DESINTERESSE'}
                      onChange={(e) => setFormData({ ...formData, dropoutReason: e.target.value as DropoutReasonKey })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-rose-300 bg-white font-bold text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      {Object.entries(DROPOUT_REASON_INFO).map(([key, info]) => (
                        <option key={key} value={key}>
                          {info.label} ({info.mecCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-rose-900 mb-1">
                      Data do Registro de Abandono / Evasão
                    </label>
                    <input
                      type="date"
                      value={formData.dropoutDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setFormData({ ...formData, dropoutDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-rose-300 bg-white font-medium text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-rose-900 mb-1">
                      Observações / Histórico de Tentativas de Contato & Encaminhamentos
                    </label>
                    <textarea
                      rows={2}
                      value={formData.dropoutObservation || ''}
                      onChange={(e) => setFormData({ ...formData, dropoutObservation: e.target.value })}
                      placeholder="Relate contatos com os pais, visitas domiciliares, notificações ao Conselho Tutelar ou CRAS..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-rose-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Turma & Curso */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Turma Atribuída
              </label>
              <select
                value={formData.classId || ''}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                E-mail do Estudante / Responsável
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
                Dados do Responsável Legal & Endereço
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
                placeholder="Nome da mãe, pai ou responsável legal"
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
                placeholder="Rua, Número, Bairro, CEP ou Linha/Zona Rural"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observações Pedagógicas Gerais
              </label>
              <textarea
                rows={2}
                value={formData.observations || ''}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Informações adicionais, pareceres pedagógicos ou histórico escolar relevante..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar / Cancelar</span>
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

    {/* MODAL INLINE DE CADASTRO DE UNIDADE ESCOLAR */}
    {isSchoolUnitModalOpen && (
      <SchoolUnitModal
        isOpen={isSchoolUnitModalOpen}
        onClose={() => setIsSchoolUnitModalOpen(false)}
        onSave={handleSaveInlineSchoolUnit}
      />
    )}
  </>
);
};

