import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Building2,
  MapPin,
  Phone,
  Mail,
  FileText,
  ShieldCheck,
  Check,
  Copy,
  RotateCcw,
  Sparkles,
  Info,
  Upload,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { MunicipalSecretaryInfo } from '../../types';
import { DEFAULT_MUNICIPAL_SECRETARY } from '../../data/defaultData';

interface MunicipalSecretaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  secretary: MunicipalSecretaryInfo;
  onSave: (updated: MunicipalSecretaryInfo) => void;
}

export const MunicipalSecretaryModal: React.FC<MunicipalSecretaryModalProps> = ({
  isOpen,
  onClose,
  secretary,
  onSave,
}) => {
  const [formData, setFormData] = useState<MunicipalSecretaryInfo>(secretary);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const managementFileInputRef = useRef<HTMLInputElement>(null);
  const semedFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(secretary);
    setSaveSuccess(false);
  }, [secretary, isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'managementLogoUrl' | 'logoUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG ou WebP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert('O tamanho da imagem não deve exceder 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        [field]: base64,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRestoreOfficial = () => {
    if (
      window.confirm(
        'Deseja restaurar os dados oficiais da Secretaria Municipal de Educação – SEMED (Cumaru do Norte/PA)?'
      )
    ) {
      setFormData(DEFAULT_MUNICIPAL_SECRETARY);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      lastUpdateDate: new Date().toISOString(),
    });
    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Cadastro Central da Secretaria de Educação
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px]">
                  SEMED
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Órgão gestor municipal ao qual todas as unidades escolares e polos estão vinculados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Quick Notice Banner */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-xs">Entidade Gestora Central Homologada</p>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                As informações deste cadastro central são carimbadas nos relatórios oficiais,
                certidões de vínculo, boletins e nos pacotes de sincronização offline (.edusync) de
                toda a rede de ensino.
              </p>
            </div>
          </div>

          {/* IDENTIDADE VISUAL & LOGOTIPOS OFICIAIS */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-xs flex items-center justify-between pb-1 border-b border-slate-200">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-emerald-600" />
                <span>Identidade Visual da Gestão Municipal & SEMED</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                Formatos: PNG, JPG, SVG ou WebP (Máx 3MB)
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Logo da Gestão / Brasão Municipal */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1">
                    <span>1. Logo da Gestão / Brasão Municipal</span>
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
                      ref={managementFileInputRef}
                      onChange={(e) => handleFileUpload(e, 'managementLogoUrl')}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => managementFileInputRef.current?.click()}
                      className="w-full px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{formData.managementLogoUrl ? 'Trocar Logo Gestão' : 'Enviar Logo Gestão / Brasão'}</span>
                    </button>
                    <input
                      type="text"
                      placeholder="Ou cole a URL da imagem..."
                      value={formData.managementLogoUrl?.startsWith('data:') ? 'Imagem carregada localmente' : (formData.managementLogoUrl || '')}
                      onChange={(e) => setFormData((prev) => ({ ...prev, managementLogoUrl: e.target.value }))}
                      className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 text-slate-700 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Logo da SEMED / Secretaria de Educação */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1">
                    <span>2. Logo Oficial da SEMED</span>
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
                        alt="Logo SEMED"
                        className="h-full w-full object-contain p-1"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Sparkles className="h-6 w-6 text-emerald-600" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      ref={semedFileInputRef}
                      onChange={(e) => handleFileUpload(e, 'logoUrl')}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => semedFileInputRef.current?.click()}
                      className="w-full px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{formData.logoUrl ? 'Trocar Logo SEMED' : 'Enviar Logo SEMED'}</span>
                    </button>
                    <input
                      type="text"
                      placeholder="Ou cole a URL da imagem..."
                      value={formData.logoUrl?.startsWith('data:') ? 'Imagem carregada localmente' : (formData.logoUrl || '')}
                      onChange={(e) => setFormData((prev) => ({ ...prev, logoUrl: e.target.value }))}
                      className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 text-slate-700 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DADOS INSTITUCIONAIS */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Building2 className="h-4 w-4 text-emerald-600" />
              <span>Identificação do Órgão Público</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Razão Social / Nome da Secretaria *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Secretaria Municipal de Educação – SEMED"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Sigla Oficial *
                </label>
                <input
                  type="text"
                  required
                  value={formData.shortName}
                  onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                  placeholder="Ex: SEMED"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-black text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">CNPJ Oficial *</label>
                  <button
                    type="button"
                    onClick={() => handleCopy(formData.cnpj, 'cnpj')}
                    className="text-[10px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {copiedField === 'cnpj' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedField === 'cnpj' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="Ex: 30.676.114/0001-17"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jurisdição Administrativa *
                </label>
                <input
                  type="text"
                  value={formData.jurisdiction}
                  onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                  placeholder="Ex: Rede Municipal de Ensino de Cumaru do Norte - PA"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Secretária(o) Titular / Responsável *
                </label>
                <input
                  type="text"
                  value={formData.secretaryDirector}
                  onChange={(e) => setFormData({ ...formData, secretaryDirector: e.target.value })}
                  placeholder="Ex: Augusta (Secretária Municipal de Educação)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Código de Registro do Sistema
                </label>
                <input
                  type="text"
                  value={formData.systemCode}
                  onChange={(e) => setFormData({ ...formData, systemCode: e.target.value })}
                  placeholder="Ex: SEMED-PMCN-PA"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 uppercase"
                />
              </div>
            </div>
          </div>

          {/* CONTATO INSTITUCIONAL */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Mail className="h-4 w-4 text-emerald-600" />
              <span>Contatos Oficiais da Secretaria</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">E-mail Institucional *</label>
                  <button
                    type="button"
                    onClick={() => handleCopy(formData.email, 'email')}
                    className="text-[10px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {copiedField === 'email' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedField === 'email' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: augustasec@pmcn.pa.gov.br"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Telefone Institucional *</label>
                  <button
                    type="button"
                    onClick={() => handleCopy(formData.phone, 'phone')}
                    className="text-[10px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {copiedField === 'phone' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedField === 'phone' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ex: (94) 98435-8694"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* LOCALIZAÇÃO E SEDE */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>Sede Física e Endereço da SEMED</span>
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Endereço Completo / Logradouro *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Ex: Rua Um, s/nº, Centro – Cumaru do Norte/PA"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">CEP *</label>
                <input
                  type="text"
                  required
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="Ex: 68.398-000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Município *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ex: Cumaru do Norte"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">UF (Estado) *</label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  placeholder="PA"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono uppercase font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* OBSERVAÇÕES & DECRETO */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <FileText className="h-4 w-4 text-emerald-600" />
              <span>Base Normativa & Observações</span>
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Decreto ou Lei Orgânica de Criação
              </label>
              <input
                type="text"
                value={formData.officialDecree || ''}
                onChange={(e) => setFormData({ ...formData, officialDecree: e.target.value })}
                placeholder="Ex: Lei Orgânica Municipal / Decreto PMCN nº 104/1993"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Observações Institucionais
              </label>
              <textarea
                rows={2}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Diretrizes pedagógicas e administrativas da SEMED..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleRestoreOfficial}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restaurar Dados SEMED (Cumaru do Norte/PA)</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {saveSuccess ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Salvo com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
