import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  HardDrive,
  Cloud,
  Download,
  Terminal,
  ArrowRight,
  ShieldCheck,
  Zap,
  Laptop,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Layers,
  Trash2,
  FolderCheck,
  Power,
} from 'lucide-react';
import {
  generateTotalServerReplacementBat,
  generateZipBundle,
  generateUninstallBat,
} from '../../utils/installerGenerator';
import { generateUpdateManualHtml } from '../../utils/updatePackageHelper';
import { downloadBackupJsonFile, performAutoBackup } from '../../data/storage';

interface UpdateTutorialGuideProps {
  schoolName?: string;
  serverPort?: number;
  currentVersion?: string;
}

export const UpdateTutorialGuide: React.FC<UpdateTutorialGuideProps> = ({
  schoolName = 'SucessoEdu Gestão Educacional',
  serverPort = 3000,
  currentVersion = 'v5.4.0-ENTERPRISE',
}) => {
  const [activeTutorialMethod, setActiveTutorialMethod] = useState<
    'FRESH_INSTALL' | 'EXISTING_UPDATE' | 'CLOUD_OTA' | 'OFFLINE_USB' | 'CLIENT_STATION' | 'UNINSTALL_CLEANUP'
  >('FRESH_INSTALL');
  const [copiedScript, setCopiedScript] = useState(false);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

  const handleDownloadTotalBat = () => {
    const bat = generateTotalServerReplacementBat(serverPort);
    const blob = new Blob([bat], { type: 'application/x-bat;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SUBSTITUICAO_TOTAL_SERVIDOR.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadUninstallBat = () => {
    const bat = generateUninstallBat(serverPort, schoolName);
    const blob = new Blob([bat], { type: 'application/x-bat;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DESINSTALAR_OU_LIMPAR_SUCESSOEDU.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadManualHtml = () => {
    const html = generateUpdateManualHtml(schoolName);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Manual_Oficial_Instalacao_e_Atualizacao_SucessoEdu.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleInstantBackup = () => {
    const snapshot = performAutoBackup(
      'Backup Preventivo Solicitado no Guia Didático de Atualizações',
      'Administrador Master'
    );
    downloadBackupJsonFile(snapshot);
    setBackupNotice(`✓ Cópia de segurança preventiva (${(snapshot.fileSizeBytes / 1024).toFixed(1)} KB) baixada com sucesso!`);
    setTimeout(() => setBackupNotice(null), 5000);
  };

  const handleCopyCmd = () => {
    navigator.clipboard.writeText('Instalador_Unificado_SucessoEdu.bat');
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
              <BookOpen className="w-3.5 h-3.5" /> Manual Didático de Instalação e Atualização
            </div>
            <h2 className="text-xl font-bold tracking-tight">Guia Oficial de Instalação e Atualização Passo a Passo</h2>
            <p className="text-slate-300 text-xs sm:text-sm">
              Instruções práticas para instalar do zero em computadores novos ou atualizar instalações existentes com 100% de preservação de dados.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleInstantBackup}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" /> Fazer Backup Agora (1-Clique)
            </button>
            <button
              onClick={handleDownloadManualHtml}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" /> Baixar Manual em HTML
            </button>
          </div>
        </div>

        {backupNotice && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            {backupNotice}
          </div>
        )}
      </div>

      {/* METHOD SELECTION TABS */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 border border-slate-200 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTutorialMethod('FRESH_INSTALL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTutorialMethod === 'FRESH_INSTALL'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Sparkles className="w-4 h-4" /> 1. Instalação do Zero (Computador Novo)
        </button>

        <button
          onClick={() => setActiveTutorialMethod('EXISTING_UPDATE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTutorialMethod === 'EXISTING_UPDATE'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <HardDrive className="w-4 h-4" /> 2. Atualizar Sistema Existente (C:\SucessoEdu)
        </button>

        <button
          onClick={() => setActiveTutorialMethod('CLOUD_OTA')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTutorialMethod === 'CLOUD_OTA'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Cloud className="w-4 h-4" /> 3. Nuvem (Google Drive)
        </button>

        <button
          onClick={() => setActiveTutorialMethod('OFFLINE_USB')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTutorialMethod === 'OFFLINE_USB'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Zap className="w-4 h-4" /> 4. Pen Drive (.edupkg)
        </button>

        <button
          onClick={() => setActiveTutorialMethod('CLIENT_STATION')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTutorialMethod === 'CLIENT_STATION'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Laptop className="w-4 h-4" /> 5. Estações de Trabalho (F5)
        </button>

        <button
          onClick={() => setActiveTutorialMethod('UNINSTALL_CLEANUP')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTutorialMethod === 'UNINSTALL_CLEANUP'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-rose-700 hover:bg-rose-100/70'
          }`}
        >
          <Trash2 className="w-4 h-4" /> 6. Desinstalação &amp; Limpeza Segura
        </button>
      </div>

      {/* METHOD 1: FRESH INSTALL */}
      {activeTutorialMethod === 'FRESH_INSTALL' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Computador Novo / Primeira Implantação
              </div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Passo a Passo: Instalação do Zero no Windows
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cria a estrutura oficial em <code>C:\SucessoEdu</code>, libera o Firewall, cria o atalho único oficial e inicializa o servidor automaticamente.
              </p>
            </div>
            <button
              onClick={handleDownloadManualHtml}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors flex-shrink-0 cursor-pointer"
            >
              <FileText className="w-4 h-4" /> Baixar Guia em HTML
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ETAPA 1 */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                <span className="font-bold text-sm text-slate-900">Baixar e Extrair o ZIP</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-10">
                Baixe o pacote oficial <code>SucessoEdu_Instalador_Completo_v5.4.0.zip</code> do Google Drive oficial ou pen drive. Extraia todo o conteúdo para uma pasta acessível (ex: <code>Downloads</code>).
              </p>
            </div>

            {/* ETAPA 2 */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                <span className="font-bold text-sm text-slate-900">Executar como Administrador</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-10">
                Clique com o botão direito em <code>Instalador_Unificado_SucessoEdu.bat</code> e selecione <strong>"Executar como Administrador"</strong>. Autorize o UAC do Windows clicando em "Sim".
              </p>
            </div>

            {/* ETAPA 3 */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">3</span>
                <span className="font-bold text-sm text-slate-900">Selecionar Opção [1]</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-10">
                Digite <code>1</code> e pressione <kbd className="px-1.5 py-0.5 bg-slate-200 border border-slate-300 rounded text-[10px]">Enter</kbd>. O instalador criará a pasta <code>C:\SucessoEdu</code>, liberará a porta 3000 no Firewall e criará o atalho com o ícone oficial <code>sucessoedu.ico</code>.
              </p>
            </div>

            {/* ETAPA 4 */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">4</span>
                <span className="font-bold text-sm text-slate-900">Acesso Imediato</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-10">
                O sistema abre automaticamente no navegador em <code>http://127.0.0.1:3000</code>. Nos outros computadores da escola, basta digitar o IP do servidor (ex: <code>http://192.168.1.100:3000</code>).
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Instalador_Unificado_SucessoEdu.bat -&gt; Opcao [1]</span>
            </div>
            <button
              onClick={handleCopyCmd}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-sans flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedScript ? 'Copiado!' : 'Copiar Nome'}
            </button>
          </div>
        </div>
      )}

      {/* METHOD 2: EXISTING UPDATE */}
      {activeTutorialMethod === 'EXISTING_UPDATE' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 mb-2">
                <HardDrive className="w-3.5 h-3.5 text-indigo-600" /> Preservação 100% de Dados em C:\SucessoEdu
              </div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Passo a Passo: Atualização em Computador que Já Tem o Sistema
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Substitui os arquivos executáveis pela versão atualizada mantendo 100% dos alunos, turmas, notas e relatórios intactos com backup preventivo automático.
              </p>
            </div>
            <button
              onClick={handleDownloadTotalBat}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors flex-shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Baixar Script (.bat)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ETAPA 1 */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                <span className="font-bold text-sm text-slate-900">Baixar o Pacote Atualizado</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-10">
                Baixe o pacote da nova versão (arquivo <code>.zip</code>) e extraia para uma pasta temporária (ex: em <code>Downloads</code>).
              </p>
            </div>

            {/* ETAPA 2 */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                <span className="font-bold text-sm text-slate-900">Executar o Atualizador</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-10">
                Clique com o botão direito em <code>ATUALIZAR_SISTEMA_LOCAL.bat</code> (ou opção [2] do <code>Instalador_Unificado_SucessoEdu.bat</code>) e escolha <strong>"Executar como Administrador"</strong>.
              </p>
            </div>

            {/* ETAPA 3 */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">3</span>
                <span className="font-bold text-sm text-emerald-950">Backup Preventivo Automático</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed pl-10">
                O script cria automaticamente um snapshot completo de dados em <code>C:\SucessoEdu\Backups\Backup_Update_[DATA]</code> antes de tocar em qualquer arquivo. A pasta <code>data/</code> nunca é apagada.
              </p>
            </div>

            {/* ETAPA 4 */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">4</span>
                <span className="font-bold text-sm text-slate-900">Substituição Limpa &amp; Reinício</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-10">
                Substitui os arquivos de código antigos pelos novos, renova o atalho único oficial <code>SucessoEdu Gestão Educacional.lnk</code> e abre o sistema já com a nova versão ativa.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>C:\SucessoEdu&gt; ATUALIZAR_SISTEMA_LOCAL.bat</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText('ATUALIZAR_SISTEMA_LOCAL.bat');
                setCopiedScript(true);
                setTimeout(() => setCopiedScript(false), 2000);
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-sans flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedScript ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      {/* METHOD 2: CLOUD OTA */}
      {activeTutorialMethod === 'CLOUD_OTA' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-indigo-600" />
              Passo a Passo: Atualização Direta via Nuvem (Google Drive Oficial)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Conectado ao repositório homologado <code>suportetecnicoads@gmail.com</code> na pasta <em>Atualizações e melhorias</em>.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mt-0.5 flex-shrink-0">1</div>
              <div>
                <strong className="text-xs text-slate-900 block font-bold">Acessar a Central de Atualizações</strong>
                <p className="text-xs text-slate-600 mt-0.5">No menu lateral esquerdo do SucessoEdu, clique em <strong>⚙️ Atualizações &amp; Nuvem</strong>.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mt-0.5 flex-shrink-0">2</div>
              <div>
                <strong className="text-xs text-slate-900 block font-bold">Verificar Novos Pacotes</strong>
                <p className="text-xs text-slate-600 mt-0.5">Clique no botão <strong>"☁️ Verificar Atualizações no Google Drive"</strong> para consultar a versão ativa.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mt-0.5 flex-shrink-0">3</div>
              <div>
                <strong className="text-xs text-slate-900 block font-bold">Instalar com 1 Clique (OTA)</strong>
                <p className="text-xs text-slate-600 mt-0.5">Clique no botão verde <strong>"⚡ Sincronizar Nuvem (OTA 1-Clique)"</strong>. O sistema executará o backup preventivo e aplicará o pacote.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* METHOD 3: OFFLINE USB */}
      {activeTutorialMethod === 'OFFLINE_USB' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600" />
              Passo a Passo: Atualização Offline via Pen Drive (.edupkg)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ideal para escolas em áreas rurais ou unidades que operam sem conexão contínua à internet.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mt-0.5 flex-shrink-0">1</div>
              <div>
                <strong className="text-xs text-slate-900 block font-bold">Baixar o Pacote .edupkg na Nuvem</strong>
                <p className="text-xs text-slate-600 mt-0.5">Em qualquer computador com internet, baixe o arquivo <code>SucessoEdu_Update_v5.4.0.edupkg</code> da pasta oficial no Google Drive.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mt-0.5 flex-shrink-0">2</div>
              <div>
                <strong className="text-xs text-slate-900 block font-bold">Copiar para o Pen Drive</strong>
                <p className="text-xs text-slate-600 mt-0.5">Salve o arquivo na raiz do seu pen drive ou disco removível e leve até a escola.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mt-0.5 flex-shrink-0">3</div>
              <div>
                <strong className="text-xs text-slate-900 block font-bold">Carregar no SucessoEdu</strong>
                <p className="text-xs text-slate-600 mt-0.5">Na aba <em>Atualizações &amp; Nuvem</em>, clique em <strong>"📂 Selecionar Pacote (.edupkg)"</strong>, selecione o arquivo do pen drive e confirme a instalação.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* METHOD 5: CLIENT STATION */}
      {activeTutorialMethod === 'CLIENT_STATION' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Laptop className="w-5 h-5 text-indigo-600" />
              Estações de Trabalho e Computadores da Rede Local
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Atualização instantânea para computadores dos professores, secretaria, alunos e laboratórios.
            </p>
          </div>

          <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              Não é necessário reinstalar nada nos outros computadores!
            </div>
            <p className="text-xs text-indigo-900 leading-relaxed">
              Como o SucessoEdu funciona em arquitetura centralizada na rede local, assim que o servidor for atualizado em <code>C:\SucessoEdu</code>, basta que os usuários nos outros computadores façam o seguinte:
            </p>
            <div className="p-4 bg-white border border-indigo-200 rounded-xl flex items-center justify-center gap-3 font-mono text-sm font-bold text-indigo-950">
              <span>Pressione no Teclado:</span>
              <kbd className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg shadow-xs text-slate-800 text-xs">F5</kbd>
              <span>ou</span>
              <kbd className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg shadow-xs text-slate-800 text-xs">Ctrl + F5</kbd>
            </div>
            <p className="text-xs text-indigo-800">
              O novo layout, gráficos, relatórios e permissões serão carregados instantaneamente na tela do professor ou secretário.
            </p>
          </div>
        </div>
      )}

      {/* METHOD 6: UNINSTALL & CLEANUP */}
      {activeTutorialMethod === 'UNINSTALL_CLEANUP' && (
        <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 mb-2">
                <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Procedimento Seguro de Remoção e Limpeza
              </div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Passo a Passo: Desinstalação Segura, Reset e Liberação de Recursos
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Permite remover a instalação ou liberar serviços travados, garantindo cópia de segurança na Área de Trabalho.
              </p>
            </div>
            <button
              onClick={handleDownloadUninstallBat}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors flex-shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Baixar Script Desinstalador (.bat)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Opção [1] Recomendado
              </span>
              <h4 className="text-xs font-bold text-slate-900">Desinstalação Segura com Backup</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Salva todos os bancos e relatórios em <code>%USERPROFILE%\Desktop\SucessoEdu_Backup_Final</code> antes de limpar <code>C:\SucessoEdu</code>.
              </p>
            </div>

            <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl space-y-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                Opção [2] Reset Total
              </span>
              <h4 className="text-xs font-bold text-slate-900">Limpeza de Fábrica (Sem Backup)</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Exclui permanentemente todos os registros, pastas locais e tarefas do agendador. Ideal para descarte ou devolução de máquina.
              </p>
            </div>

            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                Opção [3] Sem Exclusão
              </span>
              <h4 className="text-xs font-bold text-slate-900">Apenas Parar e Liberar Portas</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Fecha instâncias presas na porta {serverPort} sem alterar nenhum dado ou arquivo. Resolve travamentos sem riscos.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-rose-400" />
              <span>DESINSTALAR_OU_LIMPAR_SUCESSOEDU.bat -&gt; Executar como Administrador</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText('DESINSTALAR_OU_LIMPAR_SUCESSOEDU.bat');
                setCopiedScript(true);
                setTimeout(() => setCopiedScript(false), 2000);
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-sans flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedScript ? 'Copiado!' : 'Copiar Nome'}
            </button>
          </div>
        </div>
      )}

      {/* RESOLUÇÃO DE DÚVIDAS E PROBLEMAS NO PROMPT */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <div>
            <h4 className="text-sm font-bold text-slate-900">Perguntas Frequentes &amp; Resolução de Dificuldades Técnicas</h4>
            <p className="text-xs text-slate-500">Orientações diretas para técnicos e usuários durante instalações ou atualizações</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <FolderCheck className="h-4 w-4 text-amber-700" />
              O que fazer se a pasta C:\SucessoEdu foi criada com subpastas 'data' e 'backup', mas sem os arquivos de inicialização?
            </span>
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Causa:</strong> Em versões antigas de scripts, a cópia via <code>robocopy</code> podia falhar se a pasta de origem tivesse caminhos virtuais ou fosse movida durante o processo.<br/>
              <strong>Correção Aplicada:</strong> O novo <code>Instalador_Unificado_SucessoEdu.bat</code> agora possui mecanismo de <strong>auto-cura com arquivos autônomos embutidos</strong>. Basta executar novamente como Administrador: ele implanta diretamente todos os arquivos necessários (HTML standalone, Micro-Servidor, Tray, VBScript Launcher e Ícone) mesmo sem dependência da pasta de origem!
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Power className="h-4 w-4 text-indigo-600" />
              Porta 3000 em uso ou Servidor antigo não fecha
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Solução Rápida:</strong> Execute como Administrador o script <code>DESINSTALAR_OU_LIMPAR_SUCESSOEDU.bat</code> e escolha a opção <strong>[3] Apenas Parar Servidor e Liberar Portas</strong>. Todos os processos em segundo plano serão finalizados sem alterar nenhum dado ou arquivo.
            </p>
          </div>

          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <span>⚠️</span> Mensagem: "A sintaxe do nome do arquivo, do nome do diretório ou do rótulo do volume está incorreta"
            </span>
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Causa:</strong> Ocorre quando o instalador é extraído em uma pasta com caracteres especiais como parênteses (ex: <code>Downloads\Pacote (6)</code>).<br/>
              <strong>Solução:</strong> A versão 5.4+ possui proteção blindada contra caminhos especiais. Caso use versão anterior, renomeie a pasta removendo os parênteses antes de executar.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>🛡️</span> Mensagem: "O Windows protegeu o seu computador" (SmartScreen)
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Causa:</strong> Aviso padrão de segurança do Windows para scripts baixados da web.<br/>
              <strong>Solução:</strong> Clique no link <u>"Mais informações"</u> na tela azul e depois no botão <u>"Executar assim mesmo"</u>. Em seguida, clique em "Sim" no UAC.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
