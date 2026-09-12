import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Building2,
  MapPin,
  GraduationCap,
  Phone,
  Mail,
  Wifi,
  WifiOff,
  Users,
  Layers,
  FileText,
  School,
  Sparkles,
} from 'lucide-react';
import { SchoolUnit, LocationZone, SchoolUnitType } from '../../types';

interface SchoolUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (unit: SchoolUnit) => void;
  unitToEdit?: SchoolUnit | null;
}

export const SchoolUnitModal: React.FC<SchoolUnitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  unitToEdit,
}) => {
  const [formData, setFormData] = useState<Partial<SchoolUnit>>({
    name: '',
    tradeName: '',
    inepCode: '',
    cnpjOrDecree: '',
    type: 'ESCOLA_POLO',
    locationZone: 'ZONA_URBANA',
    district: '',
    address: '',
    zipCode: '',
    city: 'São Paulo',
    state: 'SP',
    directorName: '',
    coordinatorName: '',
    secretaryName: '',
    phone: '',
    email: '',
    totalClassrooms: 8,
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    hasInternet: true,
    syncStatus: 'SINCRONIZADO',
  });

  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (unitToEdit) {
      setFormData(unitToEdit);
    } else {
      const codeNum = Math.floor(10000000 + Math.random() * 90000000);
      setFormData({
        name: '',
        tradeName: '',
        inepCode: codeNum.toString(),
        cnpjOrDecree: '',
        type: 'ESCOLA_POLO',
        locationZone: 'ZONA_URBANA',
        district: '',
        address: '',
        zipCode: '',
        city: 'São Paulo',
        state: 'SP',
        directorName: '',
        coordinatorName: '',
        secretaryName: '',
        phone: '',
        email: '',
        totalClassrooms: 8,
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        hasInternet: true,
        syncStatus: 'SINCRONIZADO',
      });
    }
    setError('');
  }, [unitToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('O nome da unidade escolar é obrigatório.');
      return;
    }
    if (!formData.inepCode?.trim()) {
      setError('O código INEP da escola é obrigatório para o Censo Escolar.');
      return;
    }
    if (!formData.directorName?.trim()) {
      setError('O nome do(a) Diretor(a) é obrigatório.');
      return;
    }

    const schoolUnit: SchoolUnit = {
      id: unitToEdit?.id || `unit-${Date.now()}`,
      name: formData.name.trim(),
      tradeName: formData.tradeName?.trim() || undefined,
      inepCode: formData.inepCode.trim(),
      cnpjOrDecree: formData.cnpjOrDecree?.trim() || undefined,
      type: (formData.type as SchoolUnitType) || 'ESCOLA_POLO',
      locationZone: (formData.locationZone as LocationZone) || 'ZONA_URBANA',
      district: formData.district?.trim() || 'Centro',
      address: formData.address?.trim() || 'Logradouro não informado',
      zipCode: formData.zipCode?.trim() || undefined,
      city: formData.city?.trim() || 'Município',
      state: formData.state?.trim() || 'SP',
      directorName: formData.directorName.trim(),
      coordinatorName: formData.coordinatorName?.trim() || undefined,
      secretaryName: formData.secretaryName?.trim() || undefined,
      phone: formData.phone?.trim() || '(11) 3000-0000',
      email: formData.email?.trim() || 'escola@educacao.gov.br',
      totalClassrooms: Number(formData.totalClassrooms) || 6,
      totalStudents: Number(formData.totalStudents) || 0,
      totalTeachers: Number(formData.totalTeachers) || 0,
      totalClasses: Number(formData.totalClasses) || 0,
      hasInternet: Boolean(formData.hasInternet),
      syncStatus: formData.syncStatus || 'SINCRONIZADO',
      lastSyncDate: unitToEdit?.lastSyncDate || new Date().toISOString(),
    };

    onSave(schoolUnit);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {unitToEdit ? 'Editar Unidade Escolar' : 'Cadastrar Nova Unidade Escolar'}
              </h2>
              <p className="text-xs text-slate-500">
                Dados cadastrais da escola, localidade (Zona Urbana / Rural), INEP e diretoria
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* DADOS BÁSICOS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Nome Oficial da Unidade Escolar *
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Escola Municipal Profa. Maria José de Almeida"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Código INEP (MEC/Censo) *
              </label>
              <input
                type="text"
                required
                value={formData.inepCode || ''}
                onChange={(e) => setFormData({ ...formData, inepCode: e.target.value })}
                placeholder="Ex: 35129940"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-emerald-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nome Fantasia / Sigla</label>
              <input
                type="text"
                value={formData.tradeName || ''}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                placeholder="Ex: E.M. Maria José"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tipo de Unidade *</label>
              <select
                value={formData.type || 'ESCOLA_POLO'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800"
              >
                <option value="SEDE_CENTRAL">Sede Central da SME</option>
                <option value="ESCOLA_POLO">Escola Polo Principal</option>
                <option value="ESCOLA_SATELITE">Escola Satélite / Anexa</option>
                <option value="ESCOLA_RURAL">Escola Campo / Rural</option>
                <option value="CRECHE_INFANTIL">Creche / Educação Infantil</option>
              </select>
            </div>

            {/* SELEÇÃO CRÍTICA DE LOCALIDADE: ZONA URBANA OU RURAL */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Localização / Zona Geográfica *
              </label>
              <select
                value={formData.locationZone || 'ZONA_URBANA'}
                onChange={(e) => setFormData({ ...formData, locationZone: e.target.value as any })}
                className={`w-full px-3 py-2 rounded-xl border font-bold ${
                  formData.locationZone === 'ZONA_RURAL'
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                }`}
              >
                <option value="ZONA_URBANA">🏙️ ZONA URBANA (Sede / Bairro Urbano)</option>
                <option value="ZONA_RURAL">🌾 ZONA RURAL (Campo / Povoado / Fazenda)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                CNPJ da Escola ou Decreto de Criação
              </label>
              <input
                type="text"
                value={formData.cnpjOrDecree || ''}
                onChange={(e) => setFormData({ ...formData, cnpjOrDecree: e.target.value })}
                placeholder="Ex: Lei Municipal nº 1.450/2012 ou CNPJ"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Conectividade à Internet
              </label>
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="hasInternet"
                    checked={formData.hasInternet === true}
                    onChange={() => setFormData({ ...formData, hasInternet: true })}
                    className="h-4 w-4 text-emerald-600"
                  />
                  <span>Com Internet (Conectada)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="hasInternet"
                    checked={formData.hasInternet === false}
                    onChange={() => setFormData({ ...formData, hasInternet: false })}
                    className="h-4 w-4 text-amber-600"
                  />
                  <span>Offline / Polo Remoto (.edusync)</span>
                </label>
              </div>
            </div>
          </div>

          {/* LOCALIZAÇÃO E ENDEREÇO */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>Endereço e Contato Institucional</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Logradouro / Rua e Número</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ex: Av. Brasil, 500"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bairro / Povoado / Distrito</label>
                <input
                  type="text"
                  value={formData.district || ''}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="Ex: Bairro São Pedro / Gleba 2"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">CEP</label>
                <input
                  type="text"
                  value={formData.zipCode || ''}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="Ex: 01001-000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Município</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ex: São Paulo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">UF (Estado)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  placeholder="SP"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono uppercase font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Telefone da Escola</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ex: (11) 3456-7890"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">E-mail Institucional</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: escola.mariajose@sme.gov.br"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* CORPO DIRETIVO */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-emerald-600" />
              <span>Corpo Diretivo & Gestão Pedagógica</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do(a) Diretor(a) *</label>
                <input
                  type="text"
                  required
                  value={formData.directorName || ''}
                  onChange={(e) => setFormData({ ...formData, directorName: e.target.value })}
                  placeholder="Ex: Prof. Valdemir Santos"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Coordenador(a) Pedagógico(a)</label>
                <input
                  type="text"
                  value={formData.coordinatorName || ''}
                  onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })}
                  placeholder="Ex: Profa. Adriana Silva"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Secretário(a) Escolar</label>
                <input
                  type="text"
                  value={formData.secretaryName || ''}
                  onChange={(e) => setFormData({ ...formData, secretaryName: e.target.value })}
                  placeholder="Ex: Márcia Regina"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* ESTRUTURA E CAPACIDADE */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-emerald-600" />
              <span>Estrutura Física & Dimensionamento</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Salas de Aula</label>
                <input
                  type="number"
                  min={1}
                  value={formData.totalClassrooms || 6}
                  onChange={(e) => setFormData({ ...formData, totalClassrooms: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-center"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Turmas Ativas</label>
                <input
                  type="number"
                  min={0}
                  value={formData.totalClasses || 0}
                  onChange={(e) => setFormData({ ...formData, totalClasses: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-center"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Total de Alunos</label>
                <input
                  type="number"
                  min={0}
                  value={formData.totalStudents || 0}
                  onChange={(e) => setFormData({ ...formData, totalStudents: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-center text-emerald-700"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Corpo Docente</label>
                <input
                  type="number"
                  min={0}
                  value={formData.totalTeachers || 0}
                  onChange={(e) => setFormData({ ...formData, totalTeachers: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-center"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-200"
            >
              <Save className="h-4 w-4" />
              <span>{unitToEdit ? 'Salvar Alterações' : 'Cadastrar Escola'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
