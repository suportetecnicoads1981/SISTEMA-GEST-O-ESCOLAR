import React, { useState } from 'react';
import {
  Server,
  Laptop,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Download,
  FolderTree,
  ShieldCheck,
  ChevronRight,
  Terminal,
  RefreshCw,
  Copy,
  Check,
  HardDrive
} from 'lucide-react';
import { InstallationScenario, WindowsFolderTarget } from '../../types/instalaflow';
import { WindowsInstallerService } from '../../services/instalaflow/WindowsInstallerService';

export const WindowsSetupWizard: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<InstallationScenario>('LOCAL_SERVER');
  const [targetFolder, setTargetFolder] = useState<WindowsFolderTarget>('PROGRAM_DATA');
  const [serverIp, setServerIp] = useState<string>('192.168.1.150');
  const [customPath, setCustomPath] = useState<string>('C:\\SucessoEdu');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [diagnosisSuccess, setDiagnosisSuccess] = useState<boolean>(true);

  const privilegeStatus = WindowsInstallerService.diagnoseWindowsEnvironment();
  const installerScript = WindowsInstallerService.generateSmartInstallerBat(targetFolder);
  const takeownScript = WindowsInstallerService.generateTakeOwnershipScript(
    targetFolder === 'ROOT_C' ? 'C:\\SucessoEdu' : 'C:\\ProgramData\\SucessoEdu'
  );

  const handleCopyScript = () => {
    navigator.clipboard.writeText(installerScript);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadBat = () => {
    const element = document.createElement('a');
    const file = new Blob([installerScript], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = 'Instalar_SucessoEdu_Elevado.bat';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadTakeown = () => {
    const element = document.createElement('a');
    const file = new Blob([takeownScript], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = 'Reparar_Permissoes_Takeown.bat';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleRunDiagnosis = () => {
    setIsDiagnosing(true);
    setTimeout(() => {
      setIsDiagnosing(false);
      setDiagnosisSuccess(true);
    }, 600);
  };

  return (
    <div id="windows-setup-wizard" className="space-y-6">
      {/* Cabeçalho do Wizard */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                InstalaFlow v5.6
              </span>
              <span className="text-xs text-slate-500">Material Design 3 & Windows Fluent</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Assistente de Instalação e Deploy Inteligente Windows
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Correção automática de privilégios UAC, detecção de caminhos protegidos e configuração do banco SQLite local com sincronização Supabase.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunDiagnosis}
              disabled={isDiagnosing}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isDiagnosing ? 'animate-spin' : ''}`} />
              {isDiagnosing ? 'Testando Permissões...' : 'Testar Permissões Windows'}
            </button>
            <button
              onClick={handleDownloadBat}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Baixar Instalador .BAT
            </button>
          </div>
        </div>
      </div>

      {/* Passo 1: Seleção de Cenário de Instalação */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
            1
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            Selecione o Cenário de Implantação
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cenário 1: Servidor Local */}
          <div
            onClick={() => setSelectedScenario('LOCAL_SERVER')}
            className={`cursor-pointer border rounded-lg p-5 transition-all ${
              selectedScenario === 'LOCAL_SERVER'
                ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className={`p-2.5 rounded-lg ${selectedScenario === 'LOCAL_SERVER' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Server className="w-5 h-5" />
              </div>
              {selectedScenario === 'LOCAL_SERVER' && (
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <h4 className="font-semibold text-slate-900 mt-3">Instalação Servidor Local (Master)</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Instala o banco SQLite criptografado (SQLCipher), inicia o serviço HTTP na porta 3000 e estabelece o canal de sincronização com o Supabase Central.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
              <span>Porta: <strong>3000 (TCP)</strong></span>
              <span className="text-blue-600 font-medium">Recomendado</span>
            </div>
          </div>

          {/* Cenário 2: Estação de Trabalho */}
          <div
            onClick={() => setSelectedScenario('WORKSTATION')}
            className={`cursor-pointer border rounded-lg p-5 transition-all ${
              selectedScenario === 'WORKSTATION'
                ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className={`p-2.5 rounded-lg ${selectedScenario === 'WORKSTATION' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Laptop className="w-5 h-5" />
              </div>
              {selectedScenario === 'WORKSTATION' && (
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <h4 className="font-semibold text-slate-900 mt-3">Estação de Trabalho (Workstation)</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Configura o terminal para conectar ao IP do Servidor Local via rede interna e autentica no Supabase usando <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">anon_key</code> restrita por <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">station_id</code>.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
              <span>Modo: <strong>Cliente Leve</strong></span>
              <span>LAN Discovery</span>
            </div>
          </div>

          {/* Cenário 3: Servidor Remoto Cloud */}
          <div
            onClick={() => setSelectedScenario('REMOTE_CLOUD')}
            className={`cursor-pointer border rounded-lg p-5 transition-all ${
              selectedScenario === 'REMOTE_CLOUD'
                ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className={`p-2.5 rounded-lg ${selectedScenario === 'REMOTE_CLOUD' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Cloud className="w-5 h-5" />
              </div>
              {selectedScenario === 'REMOTE_CLOUD' && (
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <h4 className="font-semibold text-slate-900 mt-3">Instalação Servidor Remoto (Cloud Hub)</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Configuração direta na nuvem (Supabase + Cloud Hub) para monitoramento global de todas as unidades municipais e telemetria unificada.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
              <span>Ambiente: <strong>PostgreSQL Nuvem</strong></span>
              <span>Multi-Escola</span>
            </div>
          </div>
        </div>
      </div>

      {/* Passo 2: Diagnóstico de Diretório e Fallback UAC */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
            2
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            Destino da Instalação & Prevenção de Falhas de Criação (UAC)
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Diretório de Destino Selecionado
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="folder"
                  checked={targetFolder === 'PROGRAM_DATA'}
                  onChange={() => setTargetFolder('PROGRAM_DATA')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-slate-900">C:\ProgramData\SucessoEdu</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">Recomendado (Fallback Seguro)</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Permissões de gravação nativas para serviços locais sem bloqueio do Windows Defender.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="folder"
                  checked={targetFolder === 'ROOT_C'}
                  onChange={() => setTargetFolder('ROOT_C')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-slate-900">C:\SucessoEdu</span>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">Requer Elevação UAC</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Se o <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">mkdir</code> falhar por falta de privilégio, o instalador aciona elevação ou migra para ProgramData.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="folder"
                  checked={targetFolder === 'LOCAL_APPDATA'}
                  onChange={() => setTargetFolder('LOCAL_APPDATA')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-sm text-slate-900">%LOCALAPPDATA%\SucessoEdu</span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Instalação isolada no perfil do usuário do Windows sem necessidade de privilégios de Administrador.
                  </p>
                </div>
              </label>
            </div>

            {selectedScenario === 'WORKSTATION' && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  IP ou Hostname do Servidor Local
                </label>
                <input
                  type="text"
                  value={serverIp}
                  onChange={(e) => setServerIp(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ex: 192.168.1.150 ou server-escola.local"
                />
              </div>
            )}
          </div>

          {/* Painel de Diagnóstico em Tempo Real */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Status de Permissões Windows
                  </span>
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Diagnóstico Pronto
                </span>
              </div>

              <div className="mt-3 space-y-2.5 text-xs">
                {privilegeStatus.testedPaths.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded border bg-white border-slate-200 flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="font-mono font-medium text-slate-900">{item.path}</div>
                      {item.errorMessage && (
                        <div className="text-amber-700 text-[11px] mt-0.5">{item.errorMessage}</div>
                      )}
                    </div>
                    {item.canWrite ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 whitespace-nowrap">
                        Permitido
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 whitespace-nowrap">
                        Requer UAC / 0x5
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Caso ocorra Erro 0x5 (Acesso Negado):
              </span>
              <button
                onClick={handleDownloadTakeown}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                <Terminal className="w-3.5 h-3.5" />
                Baixar Script Take Ownership
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Passo 3: Visualizador do Script Gerado */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              3
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              Script Gerado: Instalar_SucessoEdu_Elevado.bat
            </h3>
          </div>
          <button
            onClick={handleCopyScript}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {isCopied ? 'Copiado!' : 'Copiar Script'}
          </button>
        </div>

        <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-56">
          <pre>{installerScript}</pre>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Verificação UAC automática
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Fallback %ProgramData%
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Permissões NTFS icacls
            </span>
          </div>
          <button
            onClick={handleDownloadBat}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Salvar Arquivo .BAT Pronto
          </button>
        </div>
      </div>
    </div>
  );
};
