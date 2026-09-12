import React, { useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Download,
  CheckCircle2,
  RefreshCw,
  FolderLock,
  HardDrive,
  Copy,
  Check,
  Terminal,
  FileCode,
  ArrowRight,
  Database,
  Power,
  RotateCcw,
  Sparkles,
  Info,
  Users,
  GraduationCap,
  FileSpreadsheet,
} from 'lucide-react';
import {
  generateUninstallBat,
  generateStopServerBat,
  generateCleanDatabaseBat,
} from '../../utils/installerGenerator';
import {
  createBackup,
  getStoredData,
  resetToCleanDatabase,
  resetToDemoDatabase,
  isDatabaseClean,
  CleanInstallationOptions,
} from '../../data/storage';

interface UninstallationModuleProps {
  serverPort: number;
  schoolName: string;
  onNavigateToInstall?: () => void;
  onResetToCleanDatabase?: (options?: CleanInstallationOptions) => void;
  onResetToDemoDatabase?: () => void;
}

export const UninstallationModule: React.FC<UninstallationModuleProps> = ({
  serverPort,
  schoolName,
  onNavigateToInstall,
  onResetToCleanDatabase,
  onResetToDemoDatabase,
}) => {
  const [selectedMode, setSelectedMode] = useState<'SAFE' | 'TOTAL' | 'STOP_ONLY'>('SAFE');
  const [copiedScript, setCopiedScript] = useState(false);
  const [localBackupDone, setLocalBackupDone] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [browserResetSuccess, setBrowserResetSuccess] = useState(false);

  // Estados da Instalação Limpa
  const [currentData, setCurrentData] = useState(() => getStoredData());
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [cleanSchoolName, setCleanSchoolName] = useState(schoolName);
  const [cleanAdminEmail, setCleanAdminEmail] = useState('suportetecnicoads@gmail.com');
  const [cleanBackupBefore, setCleanBackupBefore] = useState(true);
  const [cleanNotification, setCleanNotification] = useState<string | null>(null);

  const isClean = isDatabaseClean(currentData);

  const downloadFile = (content: string, filename: string) => {
    const isWindowsScript = /\.(bat|cmd|vbs|reg|ini)$/i.test(filename);
    const safeContent = isWindowsScript
      ? content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\r\n')
      : content;
    const blob = new Blob([safeContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadUninstaller = () => {
    const batContent = generateUninstallBat(serverPort, schoolName);
    downloadFile(batContent, 'DESINSTALAR_OU_LIMPAR_SUCESSOEDU.bat');
  };

  const handleDownloadStopOnly = () => {
    const batContent = generateStopServerBat(serverPort);
    downloadFile(batContent, 'PARAR_SERVIDOR.bat');
  };

  const handleDownloadCleanBat = () => {
    const batContent = generateCleanDatabaseBat(serverPort, schoolName);
    downloadFile(batContent, 'LIMPAR_BASE_DADOS_PRODUCAO.bat');
  };

  const handleDownloadLocalBackup = () => {
    const backupData = createBackup();
    const backupJson = JSON.stringify(backupData, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadFile(backupJson, `SucessoEdu_Backup_Pre_Desinstalacao_${timestamp}.json`);
    setLocalBackupDone(true);
    setTimeout(() => setLocalBackupDone(false), 5000);
  };

  const handleExecuteCleanDatabase = () => {
    if (cleanBackupBefore) {
      handleDownloadLocalBackup();
    }
    const cleanState = resetToCleanDatabase({
      schoolName: cleanSchoolName || schoolName,
      adminEmail: cleanAdminEmail || 'suportetecnicoads@gmail.com',
    });
    setCurrentData(cleanState);
    if (onResetToCleanDatabase) {
      onResetToCleanDatabase({
        schoolName: cleanSchoolName || schoolName,
        adminEmail: cleanAdminEmail || 'suportetecnicoads@gmail.com',
      });
    }
    setShowCleanModal(false);
    setCleanNotification('Base de dados limpa com sucesso! O sistema está pronto para operação em produção.');
    setTimeout(() => setCleanNotification(null), 6000);
  };

  const handleRestoreDemoData = () => {
    if (window.confirm('Deseja restaurar a base demonstrativa com dados simulados de alunos, turmas e notas?')) {
      const demoState = resetToDemoDatabase();
      setCurrentData(demoState);
      if (onResetToDemoDatabase) {
        onResetToDemoDatabase();
      }
      setCleanNotification('Dados de demonstração restaurados com sucesso.');
      setTimeout(() => setCleanNotification(null), 6000);
    }
  };

  const handleCopyCmd = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* NOTIFICAÇÃO DE SUCESSO DE LIMPEZA */}
      {cleanNotification && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <p className="text-xs font-bold text-emerald-900">{cleanNotification}</p>
          </div>
          <button
            onClick={() => setCleanNotification(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 px-2 py-1 rounded-lg hover:bg-emerald-100"
          >
            Fechar
          </button>
        </div>
      )}

      {/* CARD PROEMINENTE: STATUS DA BASE DE DADOS & INSTALAÇÃO LIMPA */}
      <div className="bg-white rounded-2xl border-2 border-indigo-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                <Database className="h-3.5 w-3.5" /> Estado da Base de Dados Local
              </span>
              {isClean ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="h-3 w-3" /> Instalação Limpa (Modo Produção)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <Sparkles className="h-3 w-3" /> Modo Demonstração (Com Dados de Teste)
                </span>
              )}
            </div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              Limpeza de Base para Implantação e Nova Instalação
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Zera instantaneamente todas as tabelas de alunos, turmas, notas e diários para inicializar o SucessoEdu em ambiente real de produção sem resquícios de dados fictícios.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowCleanModal(true)}
              className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Limpar Base de Dados (Instalação Limpa)</span>
            </button>
            <button
              onClick={handleDownloadCleanBat}
              className="px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
              title="Baixar script Batch para limpar base de dados no servidor local Windows"
            >
              <Download className="h-4 w-4 text-indigo-600" />
              <span>Script Batch Windows (.BAT)</span>
            </button>
          </div>
        </div>

        {/* CONTADORES EM TEMPO REAL */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase">Alunos Cadastrados</span>
              <Users className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-xl font-black text-slate-900">
              {currentData.students.length}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {currentData.students.length === 0 ? 'Base limpa (0 registros)' : 'Dados simulados ativos'}
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase">Turmas &amp; Salas</span>
              <GraduationCap className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-xl font-black text-slate-900">
              {currentData.classes.length}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {currentData.classes.length === 0 ? 'Nenhuma turma cadastrada' : 'Turmas de exemplo ativas'}
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase">Provas &amp; Questões</span>
              <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-xl font-black text-slate-900">
              {currentData.questions.length + currentData.exams.length}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {currentData.questions.length === 0 ? 'Banco de questões zerado' : 'Itens de teste disponíveis'}
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase">Admin Master Geral</span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-xs font-bold text-slate-900 truncate">
              {currentData.userAccounts?.[0]?.name || 'Admin Master'}
            </div>
            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
              Preservado e Ativo (Chave Mestre)
            </p>
          </div>
        </div>

        {/* CONTROLE COMPLEMENTAR: RESTAURAR DADOS DE DEMONSTRAÇÃO */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs flex-wrap gap-2">
          <span className="text-slate-500">
            Deseja alternar temporariamente para os dados de teste para demonstração ou treinamento da equipe?
          </span>
          {isClean ? (
            <button
              onClick={handleRestoreDemoData}
              className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Carregar Dados de Demonstração</span>
            </button>
          ) : (
            <button
              onClick={() => setShowCleanModal(true)}
              className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5 text-indigo-600" />
              <span>Zerar para Base Limpa</span>
            </button>
          )}
        </div>
      </div>

      {/* MODAL DE EXECUÇÃO DE INSTALAÇÃO LIMPA */}
      {showCleanModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-700">
                <RotateCcw className="h-5 w-5" />
                <h3 className="font-black text-slate-900 text-base">
                  Confirmar Instalação Limpa sem Dados
                </h3>
              </div>
              <button
                onClick={() => setShowCleanModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-700 leading-relaxed">
                Esta operação irá <strong className="text-rose-700">remover todos os dados fictícios de demonstração</strong> (alunos, turmas, notas, avaliações e histórico escolar), preparando o sistema para implantação oficial.
              </p>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-900 block">O que será mantido intacto:</span>
                <ul className="text-slate-600 space-y-0.5">
                  <li className="flex items-center gap-1 text-emerald-700">
                    <Check className="h-3.5 w-3.5" /> Matriz curricular referencial da BNCC
                  </li>
                  <li className="flex items-center gap-1 text-emerald-700">
                    <Check className="h-3.5 w-3.5" /> Conta Mestre do Administrador ADS ({cleanAdminEmail})
                  </li>
                  <li className="flex items-center gap-1 text-emerald-700">
                    <Check className="h-3.5 w-3.5" /> Unidade Matriz e estrutura de permissões
                  </li>
                </ul>
              </div>

              <div className="space-y-2 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nome da Instituição de Ensino:
                  </label>
                  <input
                    type="text"
                    value={cleanSchoolName}
                    onChange={(e) => setCleanSchoolName(e.target.value)}
                    placeholder="Ex.: Escola Municipal Santos Dumont"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    E-mail do Administrador Master:
                  </label>
                  <input
                    type="email"
                    value={cleanAdminEmail}
                    onChange={(e) => setCleanAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <label className="flex items-center gap-2 pt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={cleanBackupBefore}
                    onChange={(e) => setCleanBackupBefore(e.target.checked)}
                    className="rounded-sm text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700 font-medium">
                    Baixar cópia de segurança (backup .JSON) dos dados atuais antes de zerar
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowCleanModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteCleanDatabase}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirmar e Inicializar Base Limpa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 mb-1.5">
              <Trash2 className="h-3.5 w-3.5" /> Módulo de Desinstalação &amp; Limpeza Homologado
            </div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              Desinstalação Segura, Reset e Liberação de Recursos
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Encerramento definitivo de processos em segundo plano, desvinculação de serviços automáticos, remoção de atalhos e limpeza controlada da pasta <code>C:\SucessoEdu</code> com preservação opcional garantida de dados.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadUninstaller}
              className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              <Download className="h-4 w-4" />
              <span>Baixar Desinstalador Oficial (.BAT)</span>
            </button>
            <button
              onClick={handleDownloadStopOnly}
              className="px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
            >
              <Power className="h-4 w-4 text-amber-600" />
              <span>Apenas Parar Servidor (.BAT)</span>
            </button>
          </div>
        </div>

        {/* 3 MODOS DE DESINSTALAÇÃO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* MODO 1: SEGURO COM BACKUP */}
          <div
            onClick={() => setSelectedMode('SAFE')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedMode === 'SAFE'
                ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <ShieldCheck className="h-3.5 w-3.5" /> Modo Recomendado
              </span>
              <span className="text-xs font-bold text-slate-400">Opção [1]</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Desinstalação Segura com Backup</h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Gera cópia completa de todos os bancos de dados para a <strong>Área de Trabalho</strong> antes de remover os arquivos de <code>C:\SucessoEdu</code>.
            </p>
            <ul className="text-[11px] text-slate-600 space-y-1">
              <li className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Backup automático em <code>Desktop\SucessoEdu_Backup_Final</code>
              </li>
              <li className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Finaliza processos e desvincula inicialização com Windows
              </li>
              <li className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Remove regras do firewall e limpa atalhos
              </li>
            </ul>
          </div>

          {/* MODO 2: RESET DE FÁBRICA */}
          <div
            onClick={() => setSelectedMode('TOTAL')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedMode === 'TOTAL'
                ? 'border-rose-500 bg-rose-50/50 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                <AlertTriangle className="h-3.5 w-3.5" /> Atenção: Sem Backup
              </span>
              <span className="text-xs font-bold text-slate-400">Opção [2]</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Limpeza Total / Reset de Fábrica</h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Exclui permanentemente todos os arquivos, bases de dados, registros e tarefas sem gerar cópia de segurança.
            </p>
            <ul className="text-[11px] text-slate-600 space-y-1">
              <li className="flex items-center gap-1 text-rose-700">
                <AlertTriangle className="h-3 w-3" /> Exclusão definitiva de alunos, notas e turmas
              </li>
              <li className="flex items-center gap-1 text-slate-600">
                <CheckCircle2 className="h-3 w-3" /> Limpeza de <code>C:\SucessoEdu</code> e <code>%LOCALAPPDATA%</code>
              </li>
              <li className="flex items-center gap-1 text-slate-600">
                <CheckCircle2 className="h-3 w-3" /> Ideal para descarte ou devolução de máquina
              </li>
            </ul>
          </div>

          {/* MODO 3: APENAS PARAR PROCESSOS */}
          <div
            onClick={() => setSelectedMode('STOP_ONLY')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedMode === 'STOP_ONLY'
                ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                <Power className="h-3.5 w-3.5" /> Não Exclui Nada
              </span>
              <span className="text-xs font-bold text-slate-400">Opção [3]</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Apenas Parar e Liberar Portas</h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Encerra processos travados na porta {serverPort} (micro-servidor, widget, system tray) mantendo 100% dos arquivos intactos.
            </p>
            <ul className="text-[11px] text-slate-600 space-y-1">
              <li className="flex items-center gap-1 text-amber-700">
                <CheckCircle2 className="h-3 w-3" /> Libera portas 3000, 3001 e 3002
              </li>
              <li className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Mantém todas as pastas e bancos intactos
              </li>
              <li className="flex items-center gap-1 text-slate-600">
                <CheckCircle2 className="h-3 w-3" /> Resolve erros de "Porta em uso"
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* GUIA PASSO A PASSO DA DESINSTALAÇÃO */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Terminal className="h-4 w-4 text-rose-600" />
          Passo a Passo para Executar a Desinstalação no Computador
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">1</span>
              Baixar o Script
            </span>
            <p className="text-slate-600 leading-relaxed">
              Clique no botão <strong>"Baixar Desinstalador Oficial (.BAT)"</strong> acima para salvar <code>DESINSTALAR_OU_LIMPAR_SUCESSOEDU.bat</code>.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">2</span>
              Executar como Administrador
            </span>
            <p className="text-slate-600 leading-relaxed">
              Clique com o <strong>botão direito</strong> no arquivo <code>DESINSTALAR_OU_LIMPAR_SUCESSOEDU.bat</code> e escolha <strong>"Executar como Administrador"</strong>.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">3</span>
              Escolher Opção [1] ou [3]
            </span>
            <p className="text-slate-600 leading-relaxed">
              No menu do prompt, digite <code>1</code> para desinstalação segura com backup ou <code>3</code> para apenas parar serviços e pressione <kbd className="px-1 bg-white border rounded text-[10px]">Enter</kbd>.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">4</span>
              Conferência e Nova Instalação
            </span>
            <p className="text-slate-600 leading-relaxed">
              A tela exibirá a mensagem verde de sucesso. A máquina estará 100% livre e pronta para receber uma nova instalação limpa a qualquer momento.
            </p>
          </div>
        </div>
      </div>

      {/* FERRAMENTAS DE SEGURANÇA E BACKUP DIRETO DO NAVEGADOR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BACKUP LOCAL DO NAVEGADOR */}
        <div className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-3">
          <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
            <Database className="h-4 w-4 text-indigo-600" />
            Backup Preventivo da Sessão Web Atual
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Se você estiver usando a versão web ou standalone offline, clique abaixo para baixar imediatamente uma cópia de segurança em formato JSON com todos os dados da escola.
          </p>
          <button
            onClick={handleDownloadLocalBackup}
            className="px-4 py-2 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-300 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-2xs"
          >
            {localBackupDone ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700">Backup Baixado com Sucesso!</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 text-indigo-600" />
                <span>Baixar Backup Completo (.JSON)</span>
              </>
            )}
          </button>
        </div>

        {/* COMANDO RÁPIDO VIA POWERSHELL */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-slate-900 text-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1.5">
              <Terminal className="h-4 w-4" /> Encerramento Rápido via PowerShell (Admin)
            </span>
            <button
              onClick={() =>
                handleCopyCmd(
                  `powershell -NoProfile -ExecutionPolicy Bypass -Command "Stop-Process -Name 'node','wscript','cscript' -Force -ErrorAction SilentlyContinue; Get-Process powershell,pwsh | Where-Object { $_.CommandLine -like '*SucessoEdu*' } | Stop-Process -Force -ErrorAction SilentlyContinue; Write-Host '[SUCESSO] Processos encerrados e portas liberadas!' -ForegroundColor Green"`
                )
              }
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer transition-all"
            >
              {copiedScript ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copiedScript ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 select-all">
            powershell -Command "Stop-Process -Name 'node','wscript' -Force; Get-Process | Where CommandLine -like '*SucessoEdu*' | Stop-Process -Force"
          </p>
          <p className="text-[11px] text-slate-400">
            Cole no PowerShell para fechar instantaneamente qualquer rotina do servidor em execução.
          </p>
        </div>
      </div>

      {/* CHECKLIST DE ITENS REMOVIDOS & PRESERVADOS */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Auditoria de Transparência da Desinstalação
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5 p-3 rounded-xl bg-rose-50/50 border border-rose-100">
            <span className="font-bold text-rose-900 block mb-1">Componentes Removidos pelo Script:</span>
            <ul className="text-slate-600 space-y-1">
              <li className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-rose-600 flex-shrink-0" />
                Processos do micro-servidor, tray e widget em segundo plano.
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-rose-600 flex-shrink-0" />
                Chaves no Registro do Windows (<code>HKCU\...\Run\SucessoEduServer</code>).
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-rose-600 flex-shrink-0" />
                Regras de entrada/saída criadas no Firewall do Windows.
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-rose-600 flex-shrink-0" />
                Atalhos antigos <code>.url</code> e atalhos <code>.lnk</code> no Desktop.
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-rose-600 flex-shrink-0" />
                Arquivos do sistema em <code>C:\SucessoEdu</code> (HTML, VBS, PS1, ICO).
              </li>
            </ul>
          </div>

          <div className="space-y-1.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <span className="font-bold text-emerald-900 block mb-1">Preservação Garantida (Modo Seguro):</span>
            <ul className="text-slate-600 space-y-1">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                Cópia de segurança de toda a pasta <code>data\</code> na Área de Trabalho.
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                Preservação de todos os arquivos <code>*.json</code>, <code>*.ini</code> e <code>*.sqlite</code>.
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                Geração do comprovante e manifesto de backup final pré-exclusão.
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                Possibilidade imediata de restaurar os dados após reinstalação limpa.
              </li>
            </ul>
          </div>
        </div>

        {onNavigateToInstall && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Deseja realizar uma nova instalação limpa imediatamente após a desinstalação?
            </span>
            <button
              onClick={onNavigateToInstall}
              className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <span>Ir para Pacotes de Instalação</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
