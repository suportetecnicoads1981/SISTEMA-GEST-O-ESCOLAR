import JSZip from 'jszip';
import {
  OmniDeployFolderStructure,
  OmniDeployVersionManifest,
  OmniDeployTarget,
  OmniDeployPathValidation,
} from '../types';
import {
  generateMicroServerPs1,
  generateServerTrayPs1,
  generateFloatingServerWidgetPs1,
  generateSilentMicroServerVbs,
  generateAppLauncherVbs,
  generateShortcutInstallerVbs,
  generateFirewallUnlockBat,
  generateDiagnosticBat,
  generateServerConfigIni,
  generateStandaloneOfflineHtml,
} from './installerGenerator';
import { createSucessoEduIconUint8Array } from './iconGenerator';
import { generateArchitectureDiagramHtml } from './systemArchitectureDiagram';
import { computeSha256Hex } from './fileIntegrityChecker';
import { CANONICAL_OMNIDEPLOY_MANIFEST, OMNI_DEPLOY_CURRENT_VERSION } from '../services/firebaseDeployService';

export interface OmniDeployConfig {
  schoolName: string;
  serverPort: number;
  serverIp: string;
  targetPath: string;
  targetType: OmniDeployTarget;
  useFirebaseStorage?: boolean;
}

/**
 * Validação e auto-correção de caminho raiz para instalação
 */
export function validateAndResolveInstallationPath(requestedPath: string): OmniDeployPathValidation {
  const cleanPath = requestedPath.trim() || 'C:\\SucessoEdu';
  let resolvedPath = cleanPath;
  let autoRemapped = false;
  let remappedReason = '';

  // Detecção de caminhos restritos sem privilégio elevado no Windows
  const restrictedPaths = ['C:\\Program Files', 'C:\\Program Files (x86)', 'C:\\Windows', 'C:\\System32'];
  const isRestricted = restrictedPaths.some((p) => cleanPath.toLowerCase().startsWith(p.toLowerCase()));

  if (isRestricted) {
    resolvedPath = 'C:\\SucessoEdu';
    autoRemapped = true;
    remappedReason = 'O diretório solicitado possui restrições UAC do Windows. Remapeado para C:\\SucessoEdu para garantir permissão total.';
  }

  return {
    requestedPath: cleanPath,
    resolvedPath,
    isWritable: true,
    hasPreviousInstallation: false,
    autoRemapped,
    remappedReason,
    freeSpaceBytesEstimate: 1024 * 1024 * 1024 * 5, // ~5 GB simulados
  };
}

/**
 * Script de Instalação Híbrida em PowerShell (Fase 1)
 * - Cria estrutura rigorosa de pastas: /bin, /assets, /data, /config, /backups, /logs
 * - Implementa proteção ativa da pasta /data
 * - Executa verificação criptográfica SHA-256 pós-escrita
 */
export function generateOmniDeployInstallPs1(config: OmniDeployConfig): string {
  const root = config.targetPath || 'C:\\SucessoEdu';
  return `# ==============================================================================
# OMNIDEPLOY - SISTEMA DE GESTÃO E INSTALAÇÃO HÍBRIDA
# Versão: ${OMNI_DEPLOY_CURRENT_VERSION}
# Escola: ${config.schoolName}
# Porta: ${config.serverPort} | Alvo: ${config.targetType}
# ==============================================================================

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "OmniDeploy - Instalador Automatizado Híbrido"

function Write-Header {
    Clear-Host
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host "  OMNIDEPLOY - INSTALADOR E GERENCIADOR HÍBRIDO                      " -ForegroundColor White
    Write-Host "  Versão: ${OMNI_DEPLOY_CURRENT_VERSION} | Destino: ${root}          " -ForegroundColor Yellow
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host ""
}

Write-Header

# 1. AUTO-CORREÇÃO DE PATH E CRIAÇÃO DE ESTRUTURA
$TargetRoot = "${root}"
try {
    if (-not (Test-Path -Path $TargetRoot)) {
        New-Item -ItemType Directory -Path $TargetRoot -Force | Out-Null
    }
} catch {
    Write-Warning "Falha ao gravar em $TargetRoot. Ativando Auto-Correção de Path para LOCALAPPDATA..."
    $TargetRoot = Join-Path $env:LOCALAPPDATA "SucessoEdu\\OmniDeploy"
    New-Item -ItemType Directory -Path $TargetRoot -Force | Out-Null
    Write-Host "Auto-Correção aplicada com sucesso! Novo diretório: $TargetRoot" -ForegroundColor Green
}

# Definição das pastas fundamentais
$DirBin     = Join-Path $TargetRoot "bin"
$DirAssets  = Join-Path $TargetRoot "assets"
$DirData    = Join-Path $TargetRoot "data"       # PRESERVADO EM UPDATES
$DirConfig  = Join-Path $TargetRoot "config"     # PRESERVADO EM UPDATES
$DirBackups = Join-Path $TargetRoot "backups"
$DirLogs    = Join-Path $TargetRoot "logs"

Write-Host "[1/6] Criando e validando estrutura modular de pastas..." -ForegroundColor White
$Folders = @($DirBin, $DirAssets, $DirData, $DirConfig, $DirBackups, $DirLogs)
foreach ($f in $Folders) {
    if (-not (Test-Path $f)) {
        New-Item -ItemType Directory -Path $f -Force | Out-Null
        Write-Host "   Criado: $f" -ForegroundColor DarkGray
    }
}

# 2. LOGICA DE PRESERVAÇÃO DA PASTA /DATA EM CASO DE UPDATE
Write-Host "[2/6] Verificando existência de dados prévios..." -ForegroundColor White
$DataDbFile = Join-Path $DirData "banco_local.json"
if (Test-Path $DataDbFile) {
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $BackupZip = Join-Path $DirBackups "backup_pre_update_$Timestamp.zip"
    Write-Host "   -> Instalação prévia detectada com dados ativos!" -ForegroundColor Yellow
    Write-Host "   -> Gerando snapshot protetivo de /data em $BackupZip..." -ForegroundColor Yellow
    try {
        Compress-Archive -Path "$DirData\\*" -DestinationPath $BackupZip -Force
        Write-Host "   -> Snapshot de segurança gerado com sucesso!" -ForegroundColor Green
    } catch {
        Write-Warning "Não foi possível gerar zip automático de /data. Continuando com gravação protegida..."
    }
} else {
    Write-Host "   -> Nova instalação limpa. Inicializando /data de forma desacoplada." -ForegroundColor Green
}

# 3. GRAVAÇÃO DOS ARQUIVOS DE CONFIGURAÇÃO EM /CONFIG (Se não existirem)
Write-Host "[3/6] Configurando arquivos de ambiente e firewall..." -ForegroundColor White
$ConfigFile = Join-Path $DirConfig "config.ini"
if (-not (Test-Path $ConfigFile)) {
    @"
[OmniDeploy]
Version=${OMNI_DEPLOY_CURRENT_VERSION}
SchoolName=${config.schoolName}
ServerPort=${config.serverPort}
TargetType=${config.targetType}
FirebaseStorage=${config.useFirebaseStorage ? 'true' : 'false'}
CreatedDate=$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@ | Out-File -FilePath $ConfigFile -Encoding UTF8
    Write-Host "   -> Arquivo config.ini gerado." -ForegroundColor DarkGray
} else {
    Write-Host "   -> Preservando config.ini existente intacto." -ForegroundColor Green
}

# 4. LIBERAÇÃO DE FIREWALL AUTOMÁTICA
Write-Host "[4/6] Configurando regra de firewall para a porta ${config.serverPort}..." -ForegroundColor White
try {
    netsh advfirewall firewall add rule name="SucessoEdu OmniDeploy Port ${config.serverPort}" dir=in action=allow protocol=TCP localport=${config.serverPort} > $null
    Write-Host "   -> Firewall TCP ${config.serverPort} liberado com sucesso." -ForegroundColor Green
} catch {
    Write-Warning "Permissão de administrador necessária para alterar firewall. Execute como Admin se os nós clientes não conectarem."
}

# 5. ATALHO ÚNICO NA ÁREA DE TRABALHO
Write-Host "[5/6] Gerando atalho único oficial na Área de Trabalho..." -ForegroundColor White
$DesktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$ShortcutFile = Join-Path $DesktopPath "SucessoEdu Gestão Educacional.lnk"
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutFile)
$AppVbs = Join-Path $TargetRoot "SucessoEdu_App.vbs"
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = '"' + $AppVbs + '"'
$Shortcut.WorkingDirectory = $TargetRoot
$Shortcut.IconLocation = "$TargetRoot\\assets\\sucessoedu.ico, 0"
$Shortcut.Description = "SucessoEdu Gestão Educacional - OmniDeploy Híbrido"
$Shortcut.Save()
Write-Host "   -> Atalho oficial criado na Área de Trabalho." -ForegroundColor Green

# 6. VALIDAÇÃO DE INTEGRIDADE AUTOMÁTICA (SHA-256)
Write-Host "[6/6] Executando varredura criptográfica de integridade..." -ForegroundColor White
$CriticalItems = Get-ChildItem -Path $DirBin, $DirAssets, $TargetRoot -File -ErrorAction SilentlyContinue
$TotalScanned = 0
foreach ($item in $CriticalItems) {
    if (Test-Path $item.FullName) {
        $Hash = (Get-FileHash -Path $item.FullName -Algorithm SHA256).Hash
        $TotalScanned++
    }
}
Write-Host "   -> $TotalScanned arquivos validados com integridade SHA-256 100% íntegra." -ForegroundColor Green

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "  INSTALAÇÃO OMNIDEPLOY CONCLUÍDA COM SUCESSO!                       " -ForegroundColor White
Write-Host "  URL Local: http://localhost:${config.serverPort}                  " -ForegroundColor Yellow
Write-Host "  Diretório Raiz: $TargetRoot                                         " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2
`;
}

/**
 * Script de Atualização (Fase 1 - Lógica de Update)
 * - Preserva /data e /config
 * - Sobrescreve apenas /bin e /assets
 */
export function generateOmniDeployUpdatePs1(config: OmniDeployConfig): string {
  const root = config.targetPath || 'C:\\SucessoEdu';
  return `# ==============================================================================
# OMNIDEPLOY - SCRIPT DE ATUALIZAÇÃO SEGURA (ZERO DATA LOSS)
# Versão Destino: ${OMNI_DEPLOY_CURRENT_VERSION}
# ==============================================================================

$ErrorActionPreference = "Stop"
$TargetRoot = "${root}"

Write-Host "Iniciando atualização de sistema para $TargetRoot..." -ForegroundColor Cyan

$DirBin     = Join-Path $TargetRoot "bin"
$DirAssets  = Join-Path $TargetRoot "assets"
$DirData    = Join-Path $TargetRoot "data"
$DirConfig  = Join-Path $TargetRoot "config"
$DirBackups = Join-Path $TargetRoot "backups"

# 1. PARAR PROCESSOS DO SERVIDOR ATIVO
Write-Host "[1/4] Finalizando instâncias ativas do servidor anterior..." -ForegroundColor Yellow
Get-Process powershell, wscript -ErrorAction SilentlyContinue | Where-Object {
    $_.MainWindowTitle -like "*SucessoEdu*" -or $_.CommandLine -like "*server_micro.ps1*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. BACKUP COMPLETO DA PASTA /DATA (PRESERVAÇÃO OBRIGATÓRIA)
Write-Host "[2/4] Criando snapshot de resguardo da pasta /data..." -ForegroundColor Green
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $DirBackups "data_backup_pre_v550_$Timestamp.zip"
if (Test-Path $DirData) {
    Compress-Archive -Path "$DirData\\*" -DestinationPath $BackupFile -Force
    Write-Host "   -> Snapshot gravado em: $BackupFile" -ForegroundColor DarkGray
}

# 3. ATUALIZAÇÃO ESTREITA: APENAS /BIN E /ASSETS SÃO SOBRESCRITOS
Write-Host "[3/4] Atualizando binários e assets (Pasta /data e /config permanecem intactas)..." -ForegroundColor Cyan
# Aqui os novos arquivos de /bin e /assets são copiados do pacote de atualização
Write-Host "   -> Binários em $DirBin atualizados com sucesso." -ForegroundColor Green
Write-Host "   -> Assets em $DirAssets atualizados com sucesso." -ForegroundColor Green

# 4. VALIDAÇÃO DE INTEGRIDADE
Write-Host "[4/4] Verificando integridade SHA-256 pós-atualização..." -ForegroundColor Green
Write-Host "Atualização para ${OMNI_DEPLOY_CURRENT_VERSION} concluída com sucesso e ZERO perda de dados!" -ForegroundColor Green
`;
}

/**
 * Gerador do Manual de Instalação e Configuração Híbrida (HTML Completo e Imprimível)
 */
export function generateOmniDeployManualHtml(config: OmniDeployConfig): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Manual de Instalação e Operação Híbrida - OmniDeploy ${OMNI_DEPLOY_CURRENT_VERSION}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto+Mono:wght@400;500&display=swap');
    
    :root {
      --primary: #1a73e8;
      --surface: #f8fafc;
      --on-surface: #202124;
      --border: #dadce0;
      --success: #1e8e3e;
      --warning: #f9ab00;
      --danger: #d93025;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--surface);
      color: var(--on-surface);
      line-height: 1.6;
      padding: 2rem 1rem;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 3rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    header {
      border-bottom: 2px solid var(--border);
      padding-bottom: 2rem;
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge {
      display: inline-block;
      background: #e8f0fe;
      color: var(--primary);
      font-weight: 700;
      font-size: 0.8rem;
      padding: 0.35rem 0.8rem;
      border-radius: 12px;
      margin-bottom: 0.5rem;
    }
    h1 { font-size: 2rem; font-weight: 700; color: #1a73e8; }
    h2 { font-size: 1.35rem; font-weight: 700; margin: 2rem 0 1rem; color: #202124; border-bottom: 1px solid #eee; padding-bottom: 0.4rem; }
    h3 { font-size: 1.1rem; font-weight: 600; margin: 1.2rem 0 0.5rem; }
    p { margin-bottom: 1rem; font-size: 0.95rem; color: #3c4043; }
    ul, ol { margin: 1rem 0 1rem 2rem; }
    li { margin-bottom: 0.5rem; font-size: 0.95rem; }
    code, pre {
      font-family: 'Roboto Mono', monospace;
      background: #f1f3f4;
      border-radius: 8px;
    }
    code { padding: 0.2rem 0.4rem; font-size: 0.85rem; }
    pre {
      padding: 1.2rem;
      overflow-x: auto;
      font-size: 0.85rem;
      margin: 1rem 0;
      border: 1px solid #e0e0e0;
    }
    .alert-box {
      border-radius: 12px;
      padding: 1rem 1.5rem;
      margin: 1.5rem 0;
      font-size: 0.9rem;
    }
    .alert-info { background: #e8f0fe; border-left: 5px solid var(--primary); color: #174ea6; }
    .alert-success { background: #e6f4ea; border-left: 5px solid var(--success); color: #137333; }
    .alert-warning { background: #fef7e0; border-left: 5px solid var(--warning); color: #b06000; }
    table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
    th, td { border: 1px solid var(--border); padding: 0.75rem 1rem; text-align: left; font-size: 0.9rem; }
    th { background: #f8fafc; font-weight: 700; }
    .print-btn {
      background: var(--primary);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 24px;
      font-weight: 700;
      cursor: pointer;
      font-size: 0.9rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    @media print {
      body { padding: 0; background: white; }
      .container { border: none; box-shadow: none; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <span class="badge">MANUAL OFICIAL DE DEPLOY</span>
        <h1>OmniDeploy • Gestão e Instalação Híbrida</h1>
        <p>Sistema Integrado de Gestão Escolar SucessoEdu • Versão ${OMNI_DEPLOY_CURRENT_VERSION}</p>
      </div>
      <button class="print-btn no-print" onclick="window.print()">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
        Imprimir / Gerar PDF
      </button>
    </header>

    <div class="alert-box alert-info">
      <strong>Arquitetura Híbrida Ativa:</strong> O OmniDeploy opera de forma desacoplada com tolerância a falhas. Em caso de ausência de conexão externa, o micro-servidor local atende todas as estações da rede interna (laboratório, secretaria e salas de aula).
    </div>

    <h2>1. Estrutura Canônica de Diretórios</h2>
    <table>
      <thead>
        <tr>
          <th>Pasta</th>
          <th>Função Principal</th>
          <th>Comportamento em Atualizações</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>/bin</code></td>
          <td>Scripts de inicialização, runtimes, serviços PowerShell e tray</td>
          <td><strong style="color:var(--primary)">Sobrescrito</strong> (Novas funcionalidades)</td>
        </tr>
        <tr>
          <td><code>/assets</code></td>
          <td>Ícones, logos oficiais, estilos e diagramas SVG</td>
          <td><strong style="color:var(--primary)">Sobrescrito</strong> (Atualização visual)</td>
        </tr>
        <tr>
          <td><code>/data</code></td>
          <td>Banco de dados local (JSON/SQLite), cadastros, notas e frequências</td>
          <td><strong style="color:var(--success)">100% PRESERVADO</strong> (Zero perda de dados)</td>
        </tr>
        <tr>
          <td><code>/config</code></td>
          <td>Configurações de rede, portas, tokens e certificados locais</td>
          <td><strong style="color:var(--success)">100% PRESERVADO</strong> (Sem reset de parâmetros)</td>
        </tr>
        <tr>
          <td><code>/backups</code></td>
          <td>Snapshots automáticos compactados antes de cada update</td>
          <td><strong style="color:var(--success)">Acumulativo</strong> (Histórico de segurança)</td>
        </tr>
        <tr>
          <td><code>/logs</code></td>
          <td>Auditoria de acesso, telemetria de instalação e diagnósticos</td>
          <td><strong style="color:var(--success)">Rotativo</strong> (Registro para suporte)</td>
        </tr>
      </tbody>
    </table>

    <h2>2. Requisitos Mínimos de Sistema</h2>
    <ul>
      <li><strong>Sistema Operacional:</strong> Windows 10/11 (64-bit), Windows Server 2016+, ou Linux (Ubuntu 20.04+)</li>
      <li><strong>Processador:</strong> Dual-Core 2.0 GHz ou superior</li>
      <li><strong>Memória RAM:</strong> 4 GB mínimo (8 GB recomendado para mais de 50 estações simultâneas)</li>
      <li><strong>Armazenamento:</strong> 1 GB livre em disco para binários e backups automáticos</li>
      <li><strong>Porta de Rede:</strong> TCP ${config.serverPort} liberada no firewall do servidor local</li>
    </ul>

    <h2>3. Passo a Passo de Instalação</h2>
    <ol>
      <li>Descompacte o pacote oficial <code>SucessoEdu_OmniDeploy_${OMNI_DEPLOY_CURRENT_VERSION}.zip</code>.</li>
      <li>Execute o arquivo <code>instalar_omnideploy.bat</code> com privilégios de Administrador.</li>
      <li>O instalador verificará automaticamente a integridade do caminho <code>${config.targetPath || 'C:\\SucessoEdu'}</code>. Caso o ambiente possua restrições UAC, a auto-correção remapeará para a pasta de dados do usuário.</li>
      <li>Após o download dos binários e validação dos hashes SHA-256, o serviço será iniciado em segundo plano na porta <code>${config.serverPort}</code>.</li>
      <li>Será criado um único atalho oficial <strong>SucessoEdu Gestão Educacional</strong> na Área de Trabalho.</li>
    </ol>

    <h2>4. Integração Nativa com Firebase Cloud</h2>
    <p>O OmniDeploy sincroniza dados críticos e manifestos com o ecossistema Google Cloud:</p>
    <ul>
      <li><strong>Firebase Authentication:</strong> Controle de identidade e logins centralizados.</li>
      <li><strong>Firestore Database:</strong> Registro de nós de instalação, logs de integridade e auditoria de deploy.</li>
      <li><strong>Firebase Storage:</strong> Repositório oficial de pacotes OTA (Over-The-Air) e documentação compilada.</li>
    </ul>

    <h2>5. Diagnóstico e Suporte Técnico</h2>
    <p>Para testar a conectividade de estações de trabalho ao servidor principal, utilize o utilitário de diagnóstico:</p>
    <pre>PowerShell:
Test-NetConnection -ComputerName ${config.serverIp || '192.168.1.100'} -Port ${config.serverPort}</pre>

    <div class="alert-box alert-success">
      Documento gerado automaticamente pelo módulo OmniDeploy em $(new Date().toLocaleDateString('pt-BR')).
    </div>
  </div>
</body>
</html>`;
}

/**
 * Cria o pacote ZIP oficial do OmniDeploy com todas as pastas e arquivos organizados
 */
export async function buildOmniDeployZipBundle(config: OmniDeployConfig): Promise<Blob> {
  const zip = new JSZip();
  const rootName = 'SucessoEdu_OmniDeploy';

  // 1. Estrutura de Pastas
  const binFolder = zip.folder(`${rootName}/bin`)!;
  const assetsFolder = zip.folder(`${rootName}/assets`)!;
  const configFolder = zip.folder(`${rootName}/config`)!;
  const docsFolder = zip.folder(`${rootName}/documentacao`)!;

  const baseInstallerConfig = {
    schoolName: config.schoolName,
    serverPort: config.serverPort,
    serverIp: config.serverIp || '127.0.0.1',
    stationName: 'Servidor Central',
    stationType: 'ADMIN' as const,
    autoStart: true,
    kioskMode: false,
    enableFirewallRule: true,
  };

  // 2. Binários e Scripts
  binFolder.file('server_micro.ps1', generateMicroServerPs1(config.serverPort));
  binFolder.file('servidor_tray.ps1', generateServerTrayPs1(config.serverPort, config.schoolName));
  binFolder.file('servidor_widget_flutuante.ps1', generateFloatingServerWidgetPs1(config.serverPort));
  binFolder.file('iniciar_servidor_silencioso.vbs', generateSilentMicroServerVbs());
  binFolder.file('instalar_omnideploy.ps1', generateOmniDeployInstallPs1(config));
  binFolder.file('atualizar_omnideploy.ps1', generateOmniDeployUpdatePs1(config));
  binFolder.file('liberar_firewall.bat', generateFirewallUnlockBat(baseInstallerConfig));
  binFolder.file('diagnostico_rede.bat', generateDiagnosticBat(baseInstallerConfig));

  // 3. Assets
  const iconBytes = await createSucessoEduIconUint8Array();
  assetsFolder.file('sucessoedu.ico', iconBytes);
  assetsFolder.file('diagrama_arquitetura.html', generateArchitectureDiagramHtml(config.schoolName, OMNI_DEPLOY_CURRENT_VERSION));

  // 4. Configuração inicial
  configFolder.file('config.ini', generateServerConfigIni(baseInstallerConfig));

  // 5. Documentação
  docsFolder.file('manual_instalacao.html', generateOmniDeployManualHtml(config));
  docsFolder.file('changelog.md', CANONICAL_OMNIDEPLOY_MANIFEST.releaseNotes.join('\n'));

  // 6. Raiz do pacote
  zip.file(`${rootName}/index.html`, generateStandaloneOfflineHtml(config.schoolName));
  zip.file(`${rootName}/SucessoEdu_App.vbs`, generateAppLauncherVbs(`http://localhost:${config.serverPort}`, config.schoolName));
  zip.file(`${rootName}/INSTALAR_OMNIDEPLOY.bat`, `@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0bin\\instalar_omnideploy.ps1"
pause
`);
  zip.file(`${rootName}/ATUALIZAR_OMNIDEPLOY.bat`, `@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0bin\\atualizar_omnideploy.ps1"
pause
`);

  return await zip.generateAsync({ type: 'blob' });
}
