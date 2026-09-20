import React, { useRef } from 'react';
import {
  X,
  Printer,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Download,
  School,
  MapPin,
  Users,
} from 'lucide-react';
import { MunicipalSecretaryInfo, SchoolUnit } from '../../types';

interface MunicipalLinkageCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  secretary: MunicipalSecretaryInfo;
  schoolUnits: SchoolUnit[];
}

export const MunicipalLinkageCertificateModal: React.FC<
  MunicipalLinkageCertificateModalProps
> = ({ isOpen, onClose, secretary, schoolUnits }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalStudents = schoolUnits.reduce((acc, u) => acc + (u.totalStudents || 0), 0);
  const totalTeachers = schoolUnits.reduce((acc, u) => acc + (u.totalTeachers || 0), 0);
  const totalClasses = schoolUnits.reduce((acc, u) => acc + (u.totalClasses || 0), 0);

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 print:m-0 print:border-none print:shadow-none">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Certidão Oficial de Vinculação Institucional à SEMED
              </h2>
              <p className="text-[11px] text-slate-300">
                Documento comprobatório de jurisdição e vinculação das unidades escolares municipais
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div
          ref={printRef}
          className="p-8 sm:p-12 space-y-6 text-slate-900 font-sans max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-6"
        >
          {/* Cabeçalho Timbrado Oficial */}
          <div className="border-b-2 border-slate-900 pb-6">
            <div className="flex items-center justify-between gap-4">
              {/* Logo Esquerdo: Gestão Municipal / Brasão Oficial */}
              <div className="w-24 sm:w-28 h-24 flex items-center justify-center shrink-0">
                {secretary.managementLogoUrl ? (
                  <img
                    src={secretary.managementLogoUrl}
                    alt="Brasão da Gestão Municipal"
                    className="max-h-20 max-w-24 object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-300">
                    <Building2 className="h-10 w-10 text-slate-800" />
                  </div>
                )}
              </div>

              {/* Texto Central Oficial */}
              <div className="flex-1 text-center space-y-1.5 px-2">
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-950">
                  ESTADO DO PARÁ
                </h1>
                <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-normal">
                  PREFEITURA MUNICIPAL DE CUMARU DO NORTE
                </h2>
                <h3 className="text-xs sm:text-sm font-bold text-emerald-900 uppercase">
                  {secretary.name}
                </h3>
                <div className="text-[11px] sm:text-xs text-slate-600 space-y-0.5 pt-1">
                  <p>
                    <span className="font-bold">CNPJ:</span> {secretary.cnpj} |{' '}
                    <span className="font-bold">E-mail:</span> {secretary.email} |{' '}
                    <span className="font-bold">Telefone:</span> {secretary.phone}
                  </p>
                  <p>
                    <span className="font-bold">Endereço da Sede:</span> {secretary.address} – CEP:{' '}
                    {secretary.zipCode}
                  </p>
                </div>
              </div>

              {/* Logo Direito: Secretaria Municipal de Educação (SEMED) */}
              <div className="w-24 sm:w-28 h-24 flex items-center justify-center shrink-0">
                {secretary.logoUrl ? (
                  <img
                    src={secretary.logoUrl}
                    alt="Logo da SEMED"
                    className="max-h-20 max-w-24 object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300">
                    <ShieldCheck className="h-10 w-10 text-emerald-700" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Título do Documento */}
          <div className="text-center py-2">
            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 font-mono text-xs font-bold rounded-md uppercase border border-slate-300">
              Ofício Circular nº 01/2026 – Gabinete SEMED / PMCN
            </span>
            <h2 className="text-base font-black text-slate-900 mt-2 uppercase tracking-wide">
              CERTIDÃO GERAL DE VINCULAÇÃO E HOMOLOGAÇÃO DA REDE ESCOLAR MUNICIPAL
            </h2>
          </div>

          {/* Texto Oficial */}
          <div className="text-xs text-slate-800 leading-relaxed text-justify space-y-3">
            <p>
              A <strong>SECRETARIA MUNICIPAL DE EDUCAÇÃO – SEMED</strong> de Cumaru do Norte, Estado
              do Pará, pessoa jurídica de direito público interno, inscrita no CNPJ sob o nº{' '}
              <strong>{secretary.cnpj}</strong>, com sede administrativa situada na{' '}
              <strong>{secretary.address}</strong>, no uso de suas atribuições legais conferidas
              pela Lei Orgânica Municipal e pelo Sistema Municipal de Ensino:
            </p>
            <p>
              <strong>CERTIFICA E HOMOLOGA</strong> que todas as unidades de ensino abaixo
              relacionadas integram oficialmente a Rede Municipal de Ensino de Cumaru do Norte/PA,
              encontrando-se sob a direta supervisão pedagógica, gerencial e administrativa desta
              Secretaria, com todos os seus dados de matrículas, turmas, docentes e rendimento
              escolar unificados no Sistema de Gestão Educacional SucessoEdu:
            </p>
          </div>

          {/* Tabela de Unidades Vinculadas */}
          <div className="overflow-x-auto border border-slate-300 rounded-lg">
            <table className="w-full text-[11px] text-left">
              <thead className="bg-slate-100 text-slate-900 border-b border-slate-300 font-bold">
                <tr>
                  <th className="p-2.5">Unidade Escolar</th>
                  <th className="p-2.5">Código INEP</th>
                  <th className="p-2.5">Tipo / Zona</th>
                  <th className="p-2.5">Diretor(a) Responsável</th>
                  <th className="p-2.5 text-center">Matrículas</th>
                  <th className="p-2.5 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {schoolUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-950">
                      {unit.name}
                      <span className="block text-[10px] font-normal text-slate-500">
                        {unit.address} – {unit.district}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono font-bold text-slate-800">{unit.inepCode}</td>
                    <td className="p-2.5">
                      <span className="block font-semibold">
                        {unit.type === 'SEDE_CENTRAL' && 'Sede Central'}
                        {unit.type === 'ESCOLA_POLO' && 'Escola Polo'}
                        {unit.type === 'ESCOLA_SATELITE' && 'Escola Satélite'}
                        {unit.type === 'ESCOLA_RURAL' && 'Escola Campo / Rural'}
                        {unit.type === 'CRECHE_INFANTIL' && 'Educação Infantil'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {unit.locationZone === 'ZONA_RURAL' ? '🌾 Zona Rural' : '🏙️ Zona Urbana'}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-800">{unit.directorName}</td>
                    <td className="p-2.5 text-center font-bold text-emerald-800">
                      {unit.totalStudents}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        <CheckCircle2 className="h-3 w-3" />
                        Vinculada à SEMED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quadro Resumo Consolidado */}
          <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">
                Escolas Vinculadas
              </span>
              <span className="text-base font-black text-slate-900">
                {schoolUnits.length} Unidades
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">
                Alunos Matriculados
              </span>
              <span className="text-base font-black text-emerald-800">
                {totalStudents.toLocaleString('pt-BR')}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">
                Corpo Docente Ativo
              </span>
              <span className="text-base font-black text-slate-900">{totalTeachers}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">
                Turmas Registradas
              </span>
              <span className="text-base font-black text-slate-900">{totalClasses}</span>
            </div>
          </div>

          {/* Encerramento e Assinaturas */}
          <div className="pt-6 space-y-8">
            <p className="text-xs text-slate-700 text-right">
              Cumaru do Norte – PA, {formattedDate}.
            </p>

            <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
              <div>
                <div className="border-t border-slate-400 w-4/5 mx-auto pt-2">
                  <p className="font-bold text-slate-950">{secretary.secretaryDirector}</p>
                  <p className="text-[11px] text-slate-600">
                    Secretária Municipal de Educação – SEMED
                  </p>
                  <p className="text-[10px] text-slate-500">Cumaru do Norte / PA</p>
                </div>
              </div>

              <div>
                <div className="border-t border-slate-400 w-4/5 mx-auto pt-2">
                  <p className="font-bold text-slate-950">Gabinete de Gestão Educacional</p>
                  <p className="text-[11px] text-slate-600">Supervisão e Controle Escolar</p>
                  <p className="text-[10px] text-slate-500">SEMED / PMCN</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé institucional */}
          <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-400">
            Documento emitido eletronicamente via SucessoEdu Gestão Educacional • CNPJ SEMED:{' '}
            {secretary.cnpj} • Sistema Municipal de Ensino de Cumaru do Norte/PA
          </div>
        </div>
      </div>
    </div>
  );
};
