import React, { useState, useRef, useMemo } from 'react';
import {
  Info,
  Code2,
  Cpu,
  GraduationCap,
  ShieldCheck,
  Award,
  Globe,
  Mail,
  Phone,
  Server,
  Layers,
  HeartHandshake,
  CheckCircle2,
  Sparkles,
  Edit3,
  Save,
  X,
  Building,
  FileCode,
  Lock,
  ExternalLink,
  MessageSquare,
  MapPin,
  Calendar,
  Check,
  ArrowLeft,
  Home,
  ChevronRight,
  Users,
  Key,
  Image as ImageIcon,
  Upload,
  Trash2,
  School,
  Building2,
} from 'lucide-react';
import { SchoolSettings, DeveloperContact } from '../../types';
import { DEFAULT_SCHOOL_SETTINGS } from '../../data/defaultData';

const DEFAULT_DEVELOPER_CONTACT: DeveloperContact = {
  name: 'Equipe SucessoEdu',
  company: 'SucessoEdu Gestão Educacional',
  email: 'suportetecnicoads@gmail.com',
  phone: '(00) 00000-0000',
  supportAvailability: 'Seg. a Sex., 8h às 18h',
  license: 'Licença Enterprise',
  systemVersion: 'v5.4.2-ENTERPRISE',
};

interface AboutSystemProps {
  settings?: SchoolSettings;
  developerContact?: DeveloperContact;
  onUpdateDeveloperContact: (contact: DeveloperContact) => void;
  onUpdateSettings?: (settings: SchoolSettings) => void;
  onBack?: () => void;
  onNavigate?: (tab: string, payload?: any) => void;
  onOpenVersionControl?: () => void;
}

export const AboutSystem: React.FC<AboutSystemProps> = ({
  settings = DEFAULT_SCHOOL_SETTINGS,
  developerContact,
  onUpdateDeveloperContact,
  onUpdateSettings,
  onBack,
  onNavigate,
  onOpenVersionControl,
}) => {
  const safeContact: DeveloperContact = useMemo(() => {
    return {
      ...DEFAULT_DEVELOPER_CONTACT,
      ...(developerContact || {}),
    };
  }, [developerContact]);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<DeveloperContact>(() => ({
    ...DEFAULT_DEVELOPER_CONTACT,
    ...(developerContact || {}),
  }));
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [schoolLogoPreview, setSchoolLogoPreview] = useState<string>(settings?.logoUrl || '');
  const [managementLogoPreview, setManagementLogoPreview] = useState<string>(settings?.managementLogoUrl || '');
  const [logoSuccessMsg, setLogoSuccessMsg] = useState(false);
  const schoolLogoInputRef = useRef<HTMLInputElement>(null);
  const managementLogoInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logoUrl' | 'managementLogoUrl'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3.5 * 1024 * 1024) {
        alert('O arquivo selecionado é maior que 3.5MB. Por favor, utilize uma imagem mais leve.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        const base64 = evt.target?.result as string;
        if (field === 'logoUrl') {
          setSchoolLogoPreview(base64);
          if (onUpdateSettings) {
            onUpdateSettings({
              ...settings,
              logoUrl: base64,
            });
          }
        } else {
          setManagementLogoPreview(base64);
          if (onUpdateSettings) {
            onUpdateSettings({
              ...settings,
              managementLogoUrl: base64,
            });
          }
        }
        setLogoSuccessMsg(true);
        setTimeout(() => setLogoSuccessMsg(false), 3500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = (field: 'logoUrl' | 'managementLogoUrl') => {
    if (field === 'logoUrl') {
      setSchoolLogoPreview('');
      if (onUpdateSettings) {
        onUpdateSettings({
          ...settings,
          logoUrl: '',
        });
      }
    } else {
      setManagementLogoPreview('');
      if (onUpdateSettings) {
        onUpdateSettings({
          ...settings,
          managementLogoUrl: '',
        });
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDeveloperContact(formData);
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };


  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Module Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onBack ? onBack() : onNavigate?.('MAIN_DASHBOARD')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-2xs group"
            title="Voltar ao Dashbox Principal"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar ao Início</span>
          </button>
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 ml-1">
            <span>Início</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="font-bold text-slate-800">Sobre o Sistema & Desenvolvedor</span>
          </div>
        </div>

        {/* Quick Module Navigation Tabs */}
        {onNavigate && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => onNavigate('ABOUT')}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Info className="h-3.5 w-3.5" />
              <span>Sobre o Sistema</span>
            </button>
            <button
              onClick={() => onNavigate('USER_ACCESS')}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Users className="h-3.5 w-3.5 text-slate-500" />
              <span>Usuários</span>
            </button>
            <button
              onClick={() => onNavigate('NETWORK_INSTALLER')}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Key className="h-3.5 w-3.5 text-slate-500" />
              <span>Instaladores</span>
            </button>
          </div>
        )}
      </div>

      {/* Top Banner with System Identity */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden border border-indigo-800/40">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            <Sparkles className="h-3.5 w-3.5" />
            SucessoEdu Gestão Educacional • Versão 5.0 Enterprise
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Plataforma Unificada de Gestão Escolar, Inteligência Pedagógica & Censo Municipal
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Ambiente completo para controle de secretariado acadêmico com fé pública, banco de questões BNCC, aplicação de provas com correção instantânea, unificação de polos remotos fora da rede (.edusync) e relatórios de evolução discente.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 text-sm font-semibold shadow-xs animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>Dados do desenvolvedor e empresa de TI atualizados e salvos com sucesso!</span>
        </div>
      )}

      {logoSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 text-sm font-semibold shadow-xs animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>Logomarca oficial da instituição/empresa atualizada e aplicada em todo o sistema!</span>
        </div>
      )}

      {/* Identidade Visual & Logomarcas Oficiais */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Identidade Visual & Logomarcas Oficiais
              </h2>
              <p className="text-xs text-slate-500">
                Personalize os logotipos da escola e da gestão/mantenedora para aplicação no cabeçalho, tela de login e documentos oficiais com fé pública.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Oficial da Unidade Escolar */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="h-24 w-24 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-inner shrink-0 p-2">
              {schoolLogoPreview ? (
                <img
                  src={schoolLogoPreview}
                  alt="Logo Escola"
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center text-slate-400 text-[10px]">
                  <School className="h-7 w-7 mx-auto mb-1 opacity-50 text-slate-400" />
                  Sem Logo
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1 text-center sm:text-left">
              <div className="text-xs font-bold text-slate-900">
                1. Logo / Brasão da Escola
              </div>
              <p className="text-[11px] text-slate-500">
                Logotipo institucional próprio da unidade escolar.
              </p>
              <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start flex-wrap">
                <label className="py-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all">
                  <Upload className="h-3.5 w-3.5" />
                  <span>{schoolLogoPreview ? 'Trocar Logo Escola' : 'Enviar Logo Escola'}</span>
                  <input
                    ref={schoolLogoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'logoUrl')}
                    className="hidden"
                  />
                </label>
                {schoolLogoPreview && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLogo('logoUrl')}
                    className="py-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center gap-1 transition-all cursor-pointer"
                    title="Remover Logo da Escola"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remover</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Logo da Gestão / Mantenedora / SEMED */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="h-24 w-24 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-inner shrink-0 p-2">
              {managementLogoPreview ? (
                <img
                  src={managementLogoPreview}
                  alt="Logo Gestão"
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center text-slate-400 text-[10px]">
                  <Building2 className="h-7 w-7 mx-auto mb-1 opacity-50 text-slate-400" />
                  Sem Logo
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1 text-center sm:text-left">
              <div className="text-xs font-bold text-slate-900">
                2. Logo da Gestão / Mantenedora / SEMED
              </div>
              <p className="text-[11px] text-slate-500">
                Brasão municipal, prefeitura ou mantenedora.
              </p>
              <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start flex-wrap">
                <label className="py-1.5 px-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all">
                  <Upload className="h-3.5 w-3.5" />
                  <span>{managementLogoPreview ? 'Trocar Logo Gestão' : 'Enviar Logo Gestão'}</span>
                  <input
                    ref={managementLogoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'managementLogoUrl')}
                    className="hidden"
                  />
                </label>
                {managementLogoPreview && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLogo('managementLogoUrl')}
                    className="py-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center gap-1 transition-all cursor-pointer"
                    title="Remover Logo da Gestão"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remover</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Developer & TI Company Section (Card with Edit Button) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Code2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Desenvolvedor do Sistema & Empresa de Tecnologia
              </h2>
              <p className="text-xs text-slate-500">
                Informações de contato, suporte técnico especializado e registro de engenharia
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setFormData({ ...safeContact });
              setIsEditing(!isEditing);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer shrink-0"
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4" /> Cancelar Edição
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4" /> Editar Meus Dados (Desenvolvedor)
              </>
            )}
          </button>
        </div>

        {isEditing ? (
          /* FORMULÁRIO DE EDIÇÃO DO DESENVOLVEDOR */
          <form onSubmit={handleSave} className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Empresa de TI / Razão Social *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Ex: ADS Soluções em Sistemas"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Nome do Desenvolvedor / Responsável *
                </label>
                <input
                  type="text"
                  required
                  value={formData.developerName || formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      developerName: e.target.value,
                      name: e.target.value,
                    })
                  }
                  placeholder="Ex: Engenheiro de Software ADS"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  CNPJ / Registro Profissional
                </label>
                <input
                  type="text"
                  value={formData.cnpj || ''}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="Ex: 38.452.190/0001-88"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  E-mail de Suporte Técnico *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: suportetecnicoads@gmail.com"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Telefone / WhatsApp de Contato *
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value, whatsapp: e.target.value })}
                  placeholder="Ex: +55 (11) 98765-4321"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Website / Portfólio
                </label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="Ex: https://sucessoedu.com.br"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Cidade / Estado (Localização)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: São Paulo, SP - Atendimento Nacional"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Versão Oficial do Sistema
                </label>
                <input
                  type="text"
                  value={formData.systemVersion}
                  onChange={(e) => setFormData({ ...formData, systemVersion: e.target.value })}
                  placeholder="Ex: v5.0.0-Enterprise"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Tipo de Licença
                </label>
                <input
                  type="text"
                  value={formData.license}
                  onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                  placeholder="Ex: Licença Definitiva Governamental / Enterprise"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-xs">
                Termos de Suporte & Observações Técnicas
              </label>
              <textarea
                rows={2}
                value={formData.supportAvailability}
                onChange={(e) => setFormData({ ...formData, supportAvailability: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Save className="h-4 w-4" /> Salvar Meus Dados
              </button>
            </div>
          </form>
        ) : (
          /* VISUALIZAÇÃO DOS DADOS DO DESENVOLVEDOR */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Building className="h-4 w-4 text-indigo-600" />
                <span>Empresa Desenvolvedora</span>
              </div>
              <div className="text-slate-800 font-bold text-base">{safeContact.company || 'SucessoEdu Gestão Educacional'}</div>
              {safeContact.cnpj && (
                <div className="text-slate-500">
                  <span className="font-semibold">CNPJ:</span> {safeContact.cnpj}
                </div>
              )}
              <div className="text-slate-500 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{safeContact.location || 'Brasil'}</span>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Mail className="h-4 w-4 text-indigo-600" />
                <span>Canais de Atendimento & Suporte</span>
              </div>
              <div className="text-slate-800 font-semibold flex items-center gap-2">
                <span className="text-slate-400">E-mail:</span>
                <a
                  href={`mailto:${safeContact.email}`}
                  className="text-indigo-600 hover:underline font-bold"
                >
                  {safeContact.email}
                </a>
              </div>
              <div className="text-slate-800 font-semibold flex items-center gap-2">
                <span className="text-slate-400">WhatsApp / Fone:</span>
                <span className="text-slate-900 font-bold">{safeContact.phone}</span>
              </div>
              <div className="text-slate-500 text-[11px] leading-relaxed">
                {safeContact.supportAvailability}
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Licenciamento &amp; Versão</span>
                </div>
                {onOpenVersionControl && (
                  <button
                    onClick={onOpenVersionControl}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold border border-indigo-200 transition cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span>Ver Novidades</span>
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-slate-900 font-bold text-sm font-mono">
                  {safeContact.systemVersion || 'v5.4.1-ENTERPRISE'}
                </div>
                {onOpenVersionControl && (
                  <button
                    onClick={onOpenVersionControl}
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Controle de Versões &rarr;
                  </button>
                )}
              </div>
              <div className="text-slate-600 text-[11px] leading-relaxed">
                {safeContact.license}
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Software Homologado &amp; Ativo
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                  C:\SucessoEdu
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Key Architectural Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Award className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Secretaria & Documentos com Fé Pública</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Emissão automatizada de Certificados de Conclusão, Históricos Escolares, Declarações de Matrícula e Boletins conforme a LDB nº 9.394/96 e normas do CEE.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Cpu className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Motor de Correção & Distratores BNCC</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Correção em milissegundos de itens objetivos e discursivos, com apontamento imediato dos distratores mais assinalados e gráficos de evolução pedagógica.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
            <Server className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Unificação de Polos Remotos (.edusync)</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Escolas rurais e satélites operam sem internet e exportam pacotes criptografados que são unificados na central SME para o Censo Escolar.
          </p>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-indigo-600" />
            Dados da Instituição Licenciada
          </h3>
          <div className="space-y-2 text-slate-700 divide-y divide-slate-100">
            <div className="pt-1.5 flex justify-between">
              <span className="text-slate-400">Escola / Rede:</span>
              <span className="font-bold text-slate-900">{settings.name}</span>
            </div>
            <div className="pt-1.5 flex justify-between">
              <span className="text-slate-400">Código INEP:</span>
              <span className="font-mono font-semibold text-slate-900">{settings.inepCode}</span>
            </div>
            <div className="pt-1.5 flex justify-between">
              <span className="text-slate-400">Ato de Credenciamento:</span>
              <span className="text-slate-800 text-right">{settings.accreditationDecree}</span>
            </div>
            <div className="pt-1.5 flex justify-between">
              <span className="text-slate-400">Localização:</span>
              <span className="text-slate-800">
                {settings.city} - {settings.state}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Code2 className="h-4 w-4 text-indigo-600" />
            Especificações da Stack de Engenharia
          </h3>
          <div className="space-y-2 text-slate-700 divide-y divide-slate-100">
            <div className="pt-1.5 flex justify-between">
              <span className="text-slate-400">Frontend:</span>
              <span className="font-semibold text-slate-900">React 18 + TypeScript + Vite + Tailwind CSS</span>
            </div>
            <div className="pt-1.5 flex justify-between">
              <span className="text-slate-400">Backend & API:</span>
              <span className="font-semibold text-slate-900">Node.js Express (RESTful, Discovery, Port 3000)</span>
            </div>
            <div className="pt-1.5 flex justify-between">
              <span className="text-slate-400">Gráficos & Métricas:</span>
              <span className="font-semibold text-slate-900">Recharts & D3 Data Pipelines</span>
            </div>
            <div className="pt-1.5 flex justify-between">
              <span className="text-slate-400">Conformidade Legal:</span>
              <span className="font-semibold text-emerald-700">MEC / BNCC / LDB 9394/96 / LGPD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
