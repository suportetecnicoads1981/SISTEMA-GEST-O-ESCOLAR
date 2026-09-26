import React, { useState, useEffect, useRef } from 'react';
import { readLogoFile } from '../../services/documentBranding';
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
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { SchoolUnit, LocationZone, SchoolUnitType } from '../../types';
import { notify } from '../../utils/dialogs';

interface SchoolUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (unit: SchoolUnit) => void;
  unitToEdit?: SchoolUnit | null;
  defaultManagementLogo?: string;
}

export const SchoolUnitModal: React.FC<SchoolUnitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  unitToEdit,
  defaultManagementLogo,
}) => {
  const schoolLogoInputRef = useRef<HTMLInputElement>(null);
  const managementLogoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<SchoolUnit>>({
    name: '',
    tradeName: '',
    inepCode: '',
    cnpjOrDecree: '',
    type: 'ESCOLA_POLO',
    locationZone: 'ZONA_URBANA',
    district: '',
    address: '',
    zipCode: '68.398-000',
    city: 'Cumaru do Norte',
    state: 'PA',
    directorName: '',
    coordinatorName: '',
    secretaryName: '',
    phone: '(94) 98435-8694',
    email: '',
    totalClassrooms: 8,
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    hasInternet: true,
    syncStatus: 'SINCRONIZADO',
    isLinkedToSecretary: true,
    municipalSecretaryId: 'semed-cumaru-do-norte',
    municipalSecretaryName: 'Secretaria Municipal de Educação – SEMED',
    municipalSecretaryCnpj: '30.676.114/0001-17',
    linkageCode: 'VINC-SEMED-PA-001',
    linkageDecree: 'Portaria de Homologação SEMED nº 01/2026',
    logoUrl: '',
    managementLogoUrl: defaultManagementLogo || '',
  });

  const [error, setError] = useState<string>('');

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logoUrl' | 'managementLogoUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG ou WebP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      notify('O tamanho da imagem não deve exceder 3MB.');
      return;
    }

    // A logo é reduzida (até 480 px) para não pesar no banco nem na sincronização.
    readLogoFile(file)
      .then((dataUrl) => {
        setFormData((prev) => ({
          ...prev,
          [field]: dataUrl,
        }));
      })
      .catch(() => notify('Não foi possível ler a imagem. Tente outro arquivo (PNG ou JPG).'));
    e.target.value = '';
  };

  useEffect(() => {
    if (unitToEdit) {
      setFormData({
        ...unitToEdit,
        isLinkedToSecretary: unitToEdit.isLinkedToSecretary !== false,
        municipalSecretaryId: unitToEdit.municipalSecretaryId || 'semed-cumaru-do-norte',
        municipalSecretaryName: unitToEdit.municipalSecretaryName || 'Secretaria Municipal de Educação – SEMED',
        municipalSecretaryCnpj: unitToEdit.municipalSecretaryCnpj || '30.676.114/0001-17',
      });
    } else {
      const linkNum = Math.floor(100 + Math.random() * 900);
      setFormData({
        name: '',
        tradeName: '',
        // O INEP é o código oficial do MEC: nunca gerar um valor aleatório.
        inepCode: '',
        cnpjOrDecree: '',
        type: 'ESCOLA_POLO',
        locationZone: 'ZONA_URBANA',
        district: 'Centro',
        address: '',
        zipCode: '68.398-000',
        city: 'Cumaru do Norte',
        state: 'PA',
        directorName: '',
        coordinatorName: '',
        secretaryName: '',
        phone: '',
        email: '',
        totalClassrooms: 0,
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        hasInternet: true,
        syncStatus: 'SINCRONIZADO',
        isLinkedToSecretary: true,
        municipalSecretaryId: 'semed-cumaru-do-norte',
        municipalSecretaryName: 'Secretaria Municipal de Educação – SEMED',
        municipalSecretaryCnpj: '30.676.114/0001-17',
        linkageCode: `VINC-SEMED-PA-${linkNum}`,
        linkageDecree: 'Portaria SEMED/PMCN de Homologação da Unidade',
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
      gradesServed: formData.gradesServed || [],
      gradesServedText: formData.gradesServedText || (formData.gradesServed && formData.gradesServed.length > 0 ? formData.gradesServed.join(', ') : 'Educação Básica'),
      offeredStages: formData.offeredStages || ['ENSINO_FUNDAMENTAL_I', 'ENSINO_FUNDAMENTAL_II'],
      offeredGrades: formData.offeredGrades || [],
      offeredShifts: formData.offeredShifts || ['MATUTINO', 'VESPERTINO'],
      operatingHours: formData.operatingHours || '07:00 às 17:30',
      maxCapacityStudents: formData.maxCapacityStudents || 350,
      maxCapacityClasses: formData.maxCapacityClasses || 12,
      isLinkedToSecretary: formData.isLinkedToSecretary !== false,
      municipalSecretaryId: formData.municipalSecretaryId || 'semed-cumaru-do-norte',
      municipalSecretaryName: formData.municipalSecretaryName || 'Secretaria Municipal de Educação – SEMED',
      municipalSecretaryCnpj: formData.municipalSecretaryCnpj || '30.676.114/0001-17',
      linkageCode: formData.linkageCode || 'VINC-SEMED-PA-001',
      linkageDate: formData.linkageDate || new Date().toISOString(),
      linkageDecree: formData.linkageDecree || 'Portaria SEMED/PMCN de Homologação da Unidade',
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

          {/* VÍNCULO OFICIAL COM A SECRETARIA MUNICIPAL DE EDUCAÇÃO */}
          <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-emerald-950 text-xs">
                    Vínculo Central: Secretaria Municipal de Educação – SEMED
                  </span>
                  <span className="px-1.5 py-0.2 rounded-sm bg-emerald-600 text-white font-mono text-[9px] font-bold">
                    HOMOLOGADA
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  CNPJ: 30.676.114/0001-17 • Cumaru do Norte/PA • Rede Municipal de Ensino
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-900 shrink-0 bg-white/70 px-2.5 py-1 rounded-lg border border-emerald-200">
              <input
                type="checkbox"
                checked={formData.isLinkedToSecretary !== false}
                onChange={(e) => setFormData({ ...formData, isLinkedToSecretary: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Unidade Jurisdicionada à SEMED</span>
            </label>
          </div>

          {/* IDENTIDADE VISUAL & LOGOTIPOS DA UNIDADE ESCOLAR E GESTÃO */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-xs flex items-center justify-between pb-1 border-b border-slate-200">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-emerald-600" />
                <span>Identidade Visual da Escola e da Gestão</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                Suporta PNG, JPG, SVG ou WebP (Máx 3MB)
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Logo Oficial da Unidade Escolar (Brasão/Marca da Escola) */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1">
                    <span>1. Logo / Brasão da Escola</span>
                  </label>
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                      className="text-[10px] text-rose-600 hover:text-rose-700 flex items-center gap-0.5 font-bold cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Remover</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden relative group">
                    {formData.logoUrl ? (
                      <img
                        src={formData.logoUrl}
                        alt="Logo Escola"
                        className="h-full w-full object-contain p-1"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <School className="h-6 w-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      ref={schoolLogoInputRef}
                      onChange={(e) => handleFileUpload(e, 'logoUrl')}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => schoolLogoInputRef.current?.click()}
                      className="w-full px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{formData.logoUrl ? 'Trocar Logo da Escola' : 'Enviar Logo da Escola'}</span>
                    </button>
                    <input
                      type="text"
                      placeholder="Ou cole a URL da imagem da escola..."
                      value={formData.logoUrl?.startsWith('data:') ? 'Imagem carregada localmente' : (formData.logoUrl || '')}
                      onChange={(e) => setFormData((prev) => ({ ...prev, logoUrl: e.target.value }))}
                      className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 text-slate-700 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Logo da Gestão / Mantenedora Vinculada */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1">
                    <span>2. Logo da Gestão / Mantenedora</span>
                  </label>
                  {formData.managementLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, managementLogoUrl: '' }))}
                      className="text-[10px] text-rose-600 hover:text-rose-700 flex items-center gap-0.5 font-bold cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Remover</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden relative group">
                    {formData.managementLogoUrl ? (
                      <img
                        src={formData.managementLogoUrl}
                        alt="Logo Gestão"
                        className="h-full w-full object-contain p-1"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      ref={managementLogoInputRef}
                      onChange={(e) => handleFileUpload(e, 'managementLogoUrl')}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => managementLogoInputRef.current?.click()}
                      className="w-full px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{formData.managementLogoUrl ? 'Trocar Logo Gestão' : 'Enviar Logo Gestão'}</span>
                    </button>
                    <input
                      type="text"
                      placeholder="Ou cole a URL do logo da gestão..."
                      value={formData.managementLogoUrl?.startsWith('data:') ? 'Imagem carregada localmente' : (formData.managementLogoUrl || '')}
                      onChange={(e) => setFormData((prev) => ({ ...prev, managementLogoUrl: e.target.value }))}
                      className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 text-slate-700 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

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

          {/* ETAPAS DE ENSINO, SÉRIES E TURMAS ATENDIDAS */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-emerald-600" />
                <span>Etapas de Ensino, Séries e Turmas Oferecidas</span>
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const allGrades = [
                      'Berçário', 'Maternal I', 'Maternal II', 'Pré I', 'Pré II',
                      '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano',
                      '6º Ano', '7º Ano', '8º Ano', '9º Ano',
                      '1ª Série Médio', '2ª Série Médio', '3ª Série Médio',
                      'EJA Fundamental', 'EJA Médio', 'AEE Especial'
                    ];
                    setFormData((prev) => ({
                      ...prev,
                      offeredGrades: allGrades,
                      gradesServed: allGrades,
                      gradesServedText: 'Educação Infantil, Fundamental I e II, Médio e EJA',
                    }));
                  }}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded cursor-pointer"
                >
                  Marcar Todas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      offeredGrades: [],
                      gradesServed: [],
                      gradesServedText: '',
                    }));
                  }}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 px-2 py-0.5 rounded cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            </div>

            {/* Agrupamento por Segmentos */}
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {/* Educação Infantil */}
              <div>
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                  <span>Educação Infantil (Creche & Pré-Escola)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {['Berçário', 'Maternal I', 'Maternal II', 'Pré I', 'Pré II'].map((grade) => {
                    const isSelected = formData.offeredGrades?.includes(grade);
                    return (
                      <label
                        key={grade}
                        className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-pink-50 border-pink-300 text-pink-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={(e) => {
                            const current = formData.offeredGrades || [];
                            const next = e.target.checked
                              ? [...current, grade]
                              : current.filter((g) => g !== grade);
                            setFormData((prev) => ({
                              ...prev,
                              offeredGrades: next,
                              gradesServed: next,
                              gradesServedText: next.join(', '),
                            }));
                          }}
                          className="rounded accent-pink-600"
                        />
                        <span className="truncate">{grade}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Ensino Fundamental I */}
              <div>
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>Ensino Fundamental I (Anos Iniciais – 1º ao 5º)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano'].map((grade) => {
                    const isSelected = formData.offeredGrades?.includes(grade);
                    return (
                      <label
                        key={grade}
                        className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={(e) => {
                            const current = formData.offeredGrades || [];
                            const next = e.target.checked
                              ? [...current, grade]
                              : current.filter((g) => g !== grade);
                            setFormData((prev) => ({
                              ...prev,
                              offeredGrades: next,
                              gradesServed: next,
                              gradesServedText: next.join(', '),
                            }));
                          }}
                          className="rounded accent-blue-600"
                        />
                        <span className="truncate">{grade}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Ensino Fundamental II */}
              <div>
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span>Ensino Fundamental II (Anos Finais – 6º ao 9º)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {['6º Ano', '7º Ano', '8º Ano', '9º Ano'].map((grade) => {
                    const isSelected = formData.offeredGrades?.includes(grade);
                    return (
                      <label
                        key={grade}
                        className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={(e) => {
                            const current = formData.offeredGrades || [];
                            const next = e.target.checked
                              ? [...current, grade]
                              : current.filter((g) => g !== grade);
                            setFormData((prev) => ({
                              ...prev,
                              offeredGrades: next,
                              gradesServed: next,
                              gradesServedText: next.join(', '),
                            }));
                          }}
                          className="rounded accent-indigo-600"
                        />
                        <span className="truncate">{grade}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Ensino Médio, EJA e Modalidades Especiais */}
              <div>
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>Ensino Médio, EJA & Modalidades Especiais</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    '1ª Série Médio', '2ª Série Médio', '3ª Série Médio',
                    'EJA Fundamental', 'EJA Médio', 'AEE Especial'
                  ].map((grade) => {
                    const isSelected = formData.offeredGrades?.includes(grade);
                    return (
                      <label
                        key={grade}
                        className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={(e) => {
                            const current = formData.offeredGrades || [];
                            const next = e.target.checked
                              ? [...current, grade]
                              : current.filter((g) => g !== grade);
                            setFormData((prev) => ({
                              ...prev,
                              offeredGrades: next,
                              gradesServed: next,
                              gradesServedText: next.join(', '),
                            }));
                          }}
                          className="rounded accent-purple-600"
                        />
                        <span className="truncate">{grade}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Turnos de Funcionamento */}
              <div className="pt-2 border-t border-slate-200/80">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Turnos de Funcionamento Autorizados
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'MATUTINO', label: 'Matutino (Manhã)' },
                    { key: 'VESPERTINO', label: 'Vespertino (Tarde)' },
                    { key: 'NOTURNO', label: 'Noturno (Noite)' },
                    { key: 'INTEGRAL', label: 'Tempo Integral' },
                  ].map((shift) => {
                    const isShiftSelected = formData.offeredShifts?.includes(shift.key as any);
                    return (
                      <label
                        key={shift.key}
                        className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          isShiftSelected
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!isShiftSelected}
                          onChange={(e) => {
                            const current = formData.offeredShifts || [];
                            const next = e.target.checked
                              ? [...current, shift.key as any]
                              : current.filter((s) => s !== shift.key);
                            setFormData((prev) => ({ ...prev, offeredShifts: next }));
                          }}
                          className="rounded accent-emerald-600"
                        />
                        <span>{shift.label}</span>
                      </label>
                    );
                  })}
                </div>
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
