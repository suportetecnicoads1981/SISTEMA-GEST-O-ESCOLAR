import React from 'react';
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
} from 'lucide-react';
import { SchoolSettings } from '../../types';

interface AboutSystemProps {
  settings: SchoolSettings;
}

export const AboutSystem: React.FC<AboutSystemProps> = ({ settings }) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="h-3.5 w-3.5" />
            EduGestão Pro • Versão Corporativa 2.4.0
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Plataforma Integrada de Gestão Escolar & Avaliação Pedagógica
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Desenvolvido para automatizar integralmente a rotina de secretariado escolar, emissão de documentos oficiais com fé pública, banco de questões com mapeamento de distratores, e aplicação de provas com correção instantânea e relatórios pedagógicos de evolução.
          </p>
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Award className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Secretaria & Documentos</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Emissão automatizada de Certificados de Conclusão, Históricos Escolares de Ensino Médio/Fundamental, Declarações de Matrícula e Frequência e Boletins conforme a LDB nº 9.394/96.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Cpu className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Motor de Correção Automática</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Correção em milissegundos de itens objetivos e discursivos por palavras-chave, com apontamento imediato dos distratores mais assinalados e cálculo de média ponderada.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Server className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Arquitetura Cliente/Servidor</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Suporte nativo a implantação em rede local (LAN) com descoberta automática do servidor central da secretaria e geração de pacotes instaladores para terminais de alunos e professores.
          </p>
        </div>
      </div>

      {/* Developer & Legal Compliance Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Institution Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-indigo-600" />
            Dados da Instituição Licenciada
          </h3>
          <div className="space-y-2 text-slate-700 divide-y divide-slate-100">
            <div className="pt-1.5 flex justify-between">
              <span className="text-slate-400">Escola:</span>
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
              <span className="text-slate-800">{settings.city} - {settings.state}</span>
            </div>
          </div>
        </div>

        {/* Technical Architecture & Dev Profile */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Code2 className="h-4 w-4 text-indigo-600" />
            Especificações de Engenharia de Software
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
              <span className="text-slate-400">Visualização de Dados:</span>
              <span className="font-semibold text-slate-900">Recharts & D3 Data Pipelines</span>
            </div>
            <div className="pt-1.5 flex justify-between">
              <span className="text-slate-400">Conformidade Legal:</span>
              <span className="font-semibold text-emerald-700">MEC / BNCC / LDB 9394/96</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
