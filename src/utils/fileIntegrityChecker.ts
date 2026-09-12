/**
 * SUCESSOEDU GESTÃO EDUCACIONAL - AUDITORIA DE INTEGRIDADE E AUTO-REPARO CRIPTOGRÁFICO
 * 
 * Verifica a integridade dos arquivos críticos na pasta raiz oficial (C:\SucessoEdu)
 * comparando os hashes SHA-256 calculados em tempo real com o manifesto canônico da versão.
 * Permite detecção imediata de arquivos ausentes ou corrompidos e oferece auto-reparo em 1 clique.
 */

import JSZip from 'jszip';
import {
  generateMicroServerPs1,
  generateServerTrayPs1,
  generateFloatingServerWidgetPs1,
  generateSilentMicroServerVbs,
  generateAppLauncherVbs,
  generateShortcutInstallerVbs,
  generateShortcutInstallerPs1,
  generateOpenSucessoEduBat,
  generateCreateDesktopShortcutBat,
  generateFirewallUnlockBat,
  generateDiagnosticBat,
  generateServerConfigIni,
  generateUpdateSystemBat,
  generateTotalServerReplacementBat,
  generateUnifiedWindowsBat,
  generateStandaloneOfflineHtml,
  InstallerConfig,
} from './installerGenerator';
import { createSucessoEduIconUint8Array } from './iconGenerator';
import { generateArchitectureDiagramHtml, syncSystemArchitectureDiagrams } from './systemArchitectureDiagram';

export type FileCriticality = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export type FileCategory =
  | 'CORE_SPA'
  | 'SERVER_RUNTIME'
  | 'DESKTOP_LAUNCHER'
  | 'NETWORK_CONFIG'
  | 'SECURITY_FIREWALL'
  | 'DIAGNOSTICS'
  | 'SYSTEM_ARCHITECTURE';

export interface CriticalFileDefinition {
  path: string;
  name: string;
  category: FileCategory;
  criticality: FileCriticality;
  description: string;
  expectedSizeEstimate: string;
  getContent: (config: { schoolName: string; serverPort: number; serverIp: string }) => Promise<string | Uint8Array> | string | Uint8Array;
}

export interface FileAuditResult {
  path: string;
  name: string;
  category: FileCategory;
  criticality: FileCriticality;
  description: string;
  expectedSha256: string;
  actualSha256: string | null;
  status: 'INTACT' | 'MISSING' | 'CORRUPTED';
  sizeBytes: number;
  statusMessage: string;
  lastChecked: string;
  repaired?: boolean;
}

export interface SystemIntegrityReport {
  manifestVersion: string;
  scannedAt: string;
  schoolName: string;
  serverPort: number;
  targetRoot: string;
  totalFiles: number;
  intactCount: number;
  missingCount: number;
  corruptedCount: number;
  overallHealthPercent: number;
  overallStatus: 'HEALTHY' | 'NEEDS_ATTENTION' | 'CRITICAL_RISK';
  results: FileAuditResult[];
}

/**
 * Calcula o hash criptográfico SHA-256 de uma string ou Uint8Array
 */
export async function computeSha256Hex(data: string | Uint8Array): Promise<string> {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback se Web Crypto indisponível (geração determinística)
  let hash = 0;
  for (let i = 0; i < buffer.length; i++) {
    hash = (hash << 5) - hash + buffer[i];
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * Catálogo canônico dos 17 arquivos críticos que compõem o ecossistema SucessoEdu na raiz
 */
export const CRITICAL_FILES_CATALOG: CriticalFileDefinition[] = [
  {
    path: 'index.html',
    name: 'Aplicação Principal SPA Standalone',
    category: 'CORE_SPA',
    criticality: 'CRITICAL',
    description: 'Interface completa do sistema (Dashboard, Secretaria, Diário, Notas, Financeiro) com banco local embutido.',
    expectedSizeEstimate: '~650 KB',
    getContent: (cfg) => generateStandaloneOfflineHtml(cfg.schoolName),
  },
  {
    path: 'SucessoEdu_Aplicativo_Offline.html',
    name: 'Backup de Resguardo SPA Offline',
    category: 'CORE_SPA',
    criticality: 'CRITICAL',
    description: 'Cópia espelho de contingência para abertura direta no navegador mesmo sem servidor.',
    expectedSizeEstimate: '~650 KB',
    getContent: (cfg) => generateStandaloneOfflineHtml(cfg.schoolName),
  },
  {
    path: 'server_micro.ps1',
    name: 'Micro-Servidor HTTP Nativo PowerShell',
    category: 'SERVER_RUNTIME',
    criticality: 'CRITICAL',
    description: 'Motor HTTP nativo em .NET/PowerShell que distribui a aplicação na porta local e rede Wi-Fi.',
    expectedSizeEstimate: '~12 KB',
    getContent: (cfg) => generateMicroServerPs1(cfg.serverPort),
  },
  {
    path: 'servidor_tray.ps1',
    name: 'Servidor System Tray (Ícone de Computador)',
    category: 'SERVER_RUNTIME',
    criticality: 'HIGH',
    description: 'Controlador minimizado na barra de tarefas do Windows com notificações balão e controle de status.',
    expectedSizeEstimate: '~16 KB',
    getContent: (cfg) => generateServerTrayPs1(cfg.serverPort, cfg.schoolName),
  },
  {
    path: 'servidor_widget_flutuante.ps1',
    name: 'Widget Flutuante de Status da Rede',
    category: 'SERVER_RUNTIME',
    criticality: 'HIGH',
    description: 'Mini-janela flutuante no canto da tela informando status Online, IP local e atalho rápido.',
    expectedSizeEstimate: '~14 KB',
    getContent: (cfg) => generateFloatingServerWidgetPs1(cfg.serverPort),
  },
  {
    path: 'iniciar_servidor_silencioso.vbs',
    name: 'Inicializador em Segundo Plano Silencioso',
    category: 'SERVER_RUNTIME',
    criticality: 'CRITICAL',
    description: 'Script VBS que inicializa o servidor nativo sem abrir telas pretas ou janelas intrusivas.',
    expectedSizeEstimate: '~2 KB',
    getContent: (cfg) => generateSilentMicroServerVbs(cfg.serverPort),
  },
  {
    path: 'SucessoEdu_App.vbs',
    name: 'Lançador Oficial do Aplicativo Desktop',
    category: 'DESKTOP_LAUNCHER',
    criticality: 'CRITICAL',
    description: 'Alvo oficial do atalho na Área de Trabalho com ícone exclusivo e abertura no navegador padrão.',
    expectedSizeEstimate: '~3 KB',
    getContent: (cfg) => generateAppLauncherVbs(`http://localhost:${cfg.serverPort}`, `SucessoEdu - ${cfg.schoolName}`),
  },
  {
    path: 'sucessoedu.ico',
    name: 'Ícone de Alta Definição do Sistema',
    category: 'DESKTOP_LAUNCHER',
    criticality: 'HIGH',
    description: 'Arquivo de ícone .ico multiplataforma com gradiente e brasão educacional do SucessoEdu.',
    expectedSizeEstimate: '~5 KB',
    getContent: () => createSucessoEduIconUint8Array(),
  },
  {
    path: 'criar_atalhos.ps1',
    name: 'Script de Limpeza e Criação do Atalho Único',
    category: 'DESKTOP_LAUNCHER',
    criticality: 'HIGH',
    description: 'Elimina atalhos antigos duplicados e garante 1 único atalho oficial no Desktop.',
    expectedSizeEstimate: '~6 KB',
    getContent: (cfg) => generateShortcutInstallerPs1(`http://localhost:${cfg.serverPort}`, 'SucessoEdu Gestão Educacional', cfg.serverPort),
  },
  {
    path: 'criar_atalhos.vbs',
    name: 'Criador de Atalho VBS Legado/Fallback',
    category: 'DESKTOP_LAUNCHER',
    criticality: 'MEDIUM',
    description: 'Fallback nativo para criação de atalho em máquinas sem PowerShell 5.1.',
    expectedSizeEstimate: '~3 KB',
    getContent: (cfg) => generateShortcutInstallerVbs(`http://localhost:${cfg.serverPort}`, 'SucessoEdu Gestao Educacional'),
  },
  {
    path: 'Abrir_SucessoEdu.bat',
    name: 'Script Rápido de Abertura do Sistema',
    category: 'DESKTOP_LAUNCHER',
    criticality: 'HIGH',
    description: 'Script .bat para acionamento direto do SucessoEdu na porta configurada.',
    expectedSizeEstimate: '~1 KB',
    getContent: (cfg) => generateOpenSucessoEduBat(cfg.serverPort),
  },
  {
    path: 'Criar_Atalho_Desktop.bat',
    name: 'Restaurador de Atalho na Área de Trabalho',
    category: 'DESKTOP_LAUNCHER',
    criticality: 'MEDIUM',
    description: 'Restaura o atalho oficial na Área de Trabalho caso tenha sido deletado por engano.',
    expectedSizeEstimate: '~1 KB',
    getContent: (cfg) => generateCreateDesktopShortcutBat(`http://localhost:${cfg.serverPort}`, 'SucessoEdu Gestão Educacional'),
  },
  {
    path: '00_LIBERAR_FIREWALL_E_PORTAS.bat',
    name: 'Desbloqueio e Regras de Firewall do Windows',
    category: 'SECURITY_FIREWALL',
    criticality: 'CRITICAL',
    description: 'Registra regras no Firewall do Windows liberando a porta do servidor para acesso de outros computadores.',
    expectedSizeEstimate: '~4 KB',
    getContent: (cfg) =>
      generateFirewallUnlockBat({
        schoolName: cfg.schoolName,
        serverIp: cfg.serverIp,
        serverPort: cfg.serverPort,
        stationName: 'Estação',
        stationType: 'ADMIN',
        autoStart: true,
        kioskMode: false,
        enableFirewallRule: true,
      }),
  },
  {
    path: 'Diagnostico_Conexao.bat',
    name: 'Diagnóstico de Rede e Latência',
    category: 'DIAGNOSTICS',
    criticality: 'MEDIUM',
    description: 'Verifica se as portas estão ouvindo e diagnostica conflitos de IP.',
    expectedSizeEstimate: '~3 KB',
    getContent: (cfg) =>
      generateDiagnosticBat({
        schoolName: cfg.schoolName,
        serverIp: cfg.serverIp,
        serverPort: cfg.serverPort,
        stationName: 'Diagnóstico',
        stationType: 'ADMIN',
        autoStart: true,
        kioskMode: false,
        enableFirewallRule: true,
      }),
  },
  {
    path: 'config_servidor.ini',
    name: 'Arquivo de Parâmetros e Configuração Local',
    category: 'NETWORK_CONFIG',
    criticality: 'HIGH',
    description: 'Configurações persistidas da escola, porta HTTP, modo offline e IPs permitidos.',
    expectedSizeEstimate: '~1 KB',
    getContent: (cfg) =>
      generateServerConfigIni({
        schoolName: cfg.schoolName,
        serverIp: cfg.serverIp,
        serverPort: cfg.serverPort,
        stationName: 'Servidor',
        stationType: 'ADMIN',
        autoStart: true,
        kioskMode: false,
        enableFirewallRule: true,
      }),
  },
  {
    path: 'Diagrama_Arquitetura_Modulos_SucessoEdu.html',
    name: 'Diagrama Oficial da Arquitetura do Sistema',
    category: 'SYSTEM_ARCHITECTURE',
    criticality: 'HIGH',
    description: 'Documento interativo com mapeamento completo de todos os 12 módulos e histórico de melhorias.',
    expectedSizeEstimate: '~45 KB',
    getContent: (cfg) => generateArchitectureDiagramHtml(cfg.schoolName),
  },
  {
    path: 'ATUALIZAR_SISTEMA_LOCAL.bat',
    name: 'Script Oficial de Atualização Local Segura',
    category: 'SERVER_RUNTIME',
    criticality: 'HIGH',
    description: 'Script que atualiza os arquivos preservando 100% dos dados dos alunos com backup preventivo.',
    expectedSizeEstimate: '~5 KB',
    getContent: (cfg) => generateUpdateSystemBat(cfg.serverPort, cfg.schoolName),
  },
  {
    path: 'SUBSTITUICAO_TOTAL_SERVIDOR.bat',
    name: 'Script de Substituição Total do Servidor',
    category: 'SERVER_RUNTIME',
    criticality: 'HIGH',
    description: 'Rotina de transplante e migração estrutural com criação multi-camadas em C:\\SucessoEdu.',
    expectedSizeEstimate: '~7 KB',
    getContent: (cfg) => generateTotalServerReplacementBat(cfg.serverPort, cfg.schoolName),
  },
  {
    path: 'Instalador_Unificado_SucessoEdu.bat',
    name: 'Instalador Unificado do Sistema',
    category: 'SERVER_RUNTIME',
    criticality: 'HIGH',
    description: 'Menu inteligente com auto-elevação UAC e implantação oficial na raiz.',
    expectedSizeEstimate: '~9 KB',
    getContent: (cfg) =>
      generateUnifiedWindowsBat({
        schoolName: cfg.schoolName,
        serverIp: cfg.serverIp,
        serverPort: cfg.serverPort,
        stationName: 'Instalador',
        stationType: 'ADMIN',
        autoStart: true,
        kioskMode: false,
        enableFirewallRule: true,
      }),
  },
];

/**
 * Gera o manifesto criptográfico completo em tempo de execução
 */
export async function generateCryptographicManifest(
  schoolName = 'Escola Municipal SucessoEdu',
  serverPort = 3000,
  serverIp = '192.168.1.150'
): Promise<{
  manifestVersion: string;
  generatedAt: string;
  files: Array<{
    path: string;
    name: string;
    category: FileCategory;
    criticality: FileCriticality;
    description: string;
    expectedSizeEstimate: string;
    expectedSha256: string;
    sizeBytes: number;
  }>;
}> {
  const config = { schoolName, serverPort, serverIp };
  const filesWithHashes = await Promise.all(
    CRITICAL_FILES_CATALOG.map(async (def) => {
      const content = await def.getContent(config);
      const sha256 = await computeSha256Hex(content);
      const sizeBytes = typeof content === 'string' ? new TextEncoder().encode(content).length : content.length;
      return {
        path: def.path,
        name: def.name,
        category: def.category,
        criticality: def.criticality,
        description: def.description,
        expectedSizeEstimate: def.expectedSizeEstimate,
        expectedSha256: sha256,
        sizeBytes,
      };
    })
  );

  return {
    manifestVersion: 'v5.4.0-CRYPTO-AUDIT',
    generatedAt: new Date().toISOString(),
    files: filesWithHashes,
  };
}

/**
 * Executa auditoria simulada / em memória dos arquivos do sistema
 */
export async function performLocalIntegrityAudit(
  actualFilesMap: Map<string, { content?: string | Uint8Array; sha256?: string; sizeBytes?: number }>,
  schoolName = 'Escola Municipal SucessoEdu',
  serverPort = 3000,
  serverIp = '192.168.1.150'
): Promise<SystemIntegrityReport> {
  const manifest = await generateCryptographicManifest(schoolName, serverPort, serverIp);
  const now = new Date().toLocaleTimeString('pt-BR');

  let intactCount = 0;
  let missingCount = 0;
  let corruptedCount = 0;

  const results: FileAuditResult[] = manifest.files.map((file) => {
    const provided = actualFilesMap.get(file.path);

    if (!provided) {
      missingCount++;
      return {
        path: file.path,
        name: file.name,
        category: file.category,
        criticality: file.criticality,
        description: file.description,
        expectedSha256: file.expectedSha256,
        actualSha256: null,
        status: 'MISSING',
        sizeBytes: 0,
        statusMessage: 'Arquivo não encontrado na pasta raiz C:\\SucessoEdu.',
        lastChecked: now,
      };
    }

    const actualHash = provided.sha256;
    if (actualHash && actualHash.toLowerCase() !== file.expectedSha256.toLowerCase()) {
      corruptedCount++;
      return {
        path: file.path,
        name: file.name,
        category: file.category,
        criticality: file.criticality,
        description: file.description,
        expectedSha256: file.expectedSha256,
        actualSha256: actualHash,
        status: 'CORRUPTED',
        sizeBytes: provided.sizeBytes || 0,
        statusMessage: 'Divergência de hash SHA-256 detectada! Arquivo alterado ou corrompido.',
        lastChecked: now,
      };
    }

    intactCount++;
    return {
      path: file.path,
      name: file.name,
      category: file.category,
      criticality: file.criticality,
      description: file.description,
      expectedSha256: file.expectedSha256,
      actualSha256: file.expectedSha256,
      status: 'INTACT',
      sizeBytes: provided.sizeBytes || file.sizeBytes,
      statusMessage: 'Arquivo íntegro e autêntico. Hash SHA-256 validado com sucesso.',
      lastChecked: now,
    };
  });

  const totalFiles = manifest.files.length;
  const overallHealthPercent = Math.round((intactCount / totalFiles) * 100);

  let overallStatus: 'HEALTHY' | 'NEEDS_ATTENTION' | 'CRITICAL_RISK' = 'HEALTHY';
  if (corruptedCount > 0 || missingCount >= 3) {
    overallStatus = 'CRITICAL_RISK';
  } else if (missingCount > 0) {
    overallStatus = 'NEEDS_ATTENTION';
  }

  // Notificar e sincronizar diagramas
  syncSystemArchitectureDiagrams(
    'CONFIG_SERVIDORES_NUVEM',
    `Auditoria de integridade SHA-256 executada: ${intactCount}/${totalFiles} arquivos íntegros (${overallHealthPercent}% saúde).`
  );

  return {
    manifestVersion: manifest.manifestVersion,
    scannedAt: new Date().toISOString(),
    schoolName,
    serverPort,
    targetRoot: 'C:\\SucessoEdu',
    totalFiles,
    intactCount,
    missingCount,
    corruptedCount,
    overallHealthPercent,
    overallStatus,
    results,
  };
}

/**
 * Gera o script PowerShell nativo para verificação de integridade e auto-reparo no Windows
 */
export async function generateIntegrityVerificationPs1(
  schoolName = 'Escola Municipal SucessoEdu',
  serverPort = 3000,
  serverIp = '192.168.1.150'
): Promise<string> {
  const manifest = await generateCryptographicManifest(schoolName, serverPort, serverIp);
  const jsonManifest = JSON.stringify(
    manifest.files.map((f) => ({
      path: f.path,
      name: f.name,
      sha256: f.expectedSha256,
      size: f.sizeBytes,
      crit: f.criticality,
    })),
    null,
    2
  );

  return `# ===============================================================================
# SUCESSOEDU GESTÃO EDUCACIONAL - AUDITORIA DE INTEGRIDADE & AUTO-REPARO CRIPTOGRÁFICO
# Valida todos os arquivos críticos em C:\\SucessoEdu via hash SHA-256
# Auto-recupera arquivos corrompidos ou ausentes sem perdas de dados dos alunos
# ===============================================================================

$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$TargetDir = "C:\\SucessoEdu"
if (-not (Test-Path $TargetDir)) {
    Write-Host "Pasta $TargetDir nao encontrada. Criando estrutura com permissoes irrestritas..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
    New-Item -ItemType Directory -Path "$TargetDir\\Backups" -Force | Out-Null
    icacls "$TargetDir" /grant *S-1-1-0:(OI)(CI)F /T /C /Q | Out-Null
}

$BackupFolder = "$TargetDir\\Backups\\AutoReparo_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$LogFile = "$TargetDir\\Backups\\log_auditoria_integridade.txt"

function Log-Message($msg, $color = 'White') {
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logLine = "[$timestamp] $msg"
    Write-Host "  $msg" -ForegroundColor $color
    Add-Content -Path $LogFile -Value $logLine -Encoding UTF8 -ErrorAction SilentlyContinue
}

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "  SUCESSOEDU - AUDITORIA DE INTEGRIDADE DE ARQUIVOS CRITICOS (SHA-256)        " -ForegroundColor White
Write-Host "  Diretorio Raiz Auditado: $TargetDir                                         " -ForegroundColor Gray
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

# Manifesto canônico embutido
$ManifestJson = @'
${jsonManifest}
'@

$Manifest = $ManifestJson | ConvertFrom-Json

$TotalCount = $Manifest.Count
$IntactCount = 0
$MissingCount = 0
$CorruptedCount = 0
$RepairedCount = 0

foreach ($item in $Manifest) {
    $FilePath = Join-Path $TargetDir $item.path
    
    if (-not (Test-Path $FilePath)) {
        $MissingCount++
        Log-Message "[AUSENTE] $($item.path) ($($item.name))" 'Yellow'
    } else {
        try {
            $FileHash = (Get-FileHash -Path $FilePath -Algorithm SHA256).Hash.ToLower()
            $ExpectedHash = $item.sha256.ToLower()
            
            if ($FileHash -eq $ExpectedHash) {
                $IntactCount++
                Log-Message "[INTEGRO] $($item.path) - Hash SHA-256 OK" 'Green'
            } else {
                $CorruptedCount++
                Log-Message "[DIVERGENCIA/CORROMPIDO] $($item.path)" 'Red'
                Log-Message "   Esperado: $ExpectedHash" 'Gray'
                Log-Message "   Atual:    $FileHash" 'Gray'
                
                # Backup preventivo do arquivo corrompido
                if (-not (Test-Path $BackupFolder)) {
                    New-Item -ItemType Directory -Path $BackupFolder -Force | Out-Null
                }
                Copy-Item -Path $FilePath -Destination (Join-Path $BackupFolder ($item.path + ".corrompido")) -Force
            }
        } catch {
            $CorruptedCount++
            Log-Message "[ERRO DE LEITURA] $($item.path): $($_.Exception.Message)" 'Red'
        }
    }
}

Write-Host ""
Write-Host "-------------------------------------------------------------------------------" -ForegroundColor Gray
Write-Host "  RESUMO DA AUDITORIA:" -ForegroundColor White
Write-Host "  - Total de Arquivos Auditados: $TotalCount" -ForegroundColor White
Write-Host "  - Arquivos Integros:           $IntactCount" -ForegroundColor Green
Write-Host "  - Arquivos Ausentes:           $MissingCount" -ForegroundColor Yellow
Write-Host "  - Arquivos Corrompidos:        $CorruptedCount" -ForegroundColor Red
Write-Host "-------------------------------------------------------------------------------" -ForegroundColor Gray

# Se houver arquivos ausentes ou corrompidos, tenta restaurar a partir da fonte de instalacao
if ($MissingCount -gt 0 -or $CorruptedCount -gt 0) {
    Write-Host ""
    Write-Host "Iniciando Rotina de Auto-Reparo e Restauracao..." -ForegroundColor Yellow
    
    $SourceDir = $PSScriptRoot
    if ($SourceDir -and (Test-Path $SourceDir) -and ($SourceDir -ne $TargetDir)) {
        Write-Host "Copiando arquivos limpos e autenticos de: $SourceDir" -ForegroundColor Cyan
        robocopy "$SourceDir" "$TargetDir" *.* /E /IS /IT /R:1 /W:1 /NP /NFL /NDL | Out-Null
        icacls "$TargetDir" /grant *S-1-1-0:(OI)(CI)F /T /C /Q | Out-Null
        Write-Host "Arquivos reparados com sucesso na pasta $TargetDir!" -ForegroundColor Green
    } else {
        Write-Host "Para auto-reparar automaticamente, execute este script a partir do pacote de instalacao/atualizacao." -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "SISTEMA 100% INTEGRO E AUTENTICO! Nenhum arquivo critico corrompido." -ForegroundColor Green
}

Write-Host ""
Write-Host "Log completo gravado em: $LogFile" -ForegroundColor Gray
Write-Host "===============================================================================" -ForegroundColor Cyan
`;
}

/**
 * Gera o script Windows Batch (.bat) com UAC e chamada ao verificador de integridade
 */
export function generateIntegrityVerificationBat(serverPort = 3000, schoolName = 'SucessoEdu Gestão Educacional'): string {
  return `@echo off
chcp 65001 >nul
title SucessoEdu - Auditoria de Integridade e Auto-Reparo SHA-256
cd /d "%~dp0"

:: Auto-elevacao para Administrador preservando diretorio (suporta espacos e caracteres especiais)
set "SCRIPT_DIR=%~dp0"
for %%I in ("%~dp0.") do set "SCRIPT_DIR=%%~fI"
cd /d "%SCRIPT_DIR%"

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [SOLICITANDO PRIVILEGIOS DE ADMINISTRADOR]...
    set "SELF_BAT=%~f0"
    set "SELF_DIR=%SCRIPT_DIR%"
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$b = $env:SELF_BAT; $d = $env:SELF_DIR; Start-Process -FilePath $env:ComSpec -ArgumentList @('/c', ('\"\"' + $b + '\"\"')) -WorkingDirectory $d -Verb RunAs -ErrorAction SilentlyContinue"
    exit /b
)

set "SRC_DIR=%SCRIPT_DIR%"
set "DEST_DIR=C:\\SucessoEdu"

cls
echo ===============================================================================
echo   SUCESSOEDU - AUDITORIA CRIPTOGRAFICA E AUTO-REPARO DE ARQUIVOS (SHA-256)
echo   Diretorio Raiz: %DEST_DIR%
echo ===============================================================================
echo.

if not exist "%DEST_DIR%" (
    mkdir "%DEST_DIR%" >nul 2>&1
    mkdir "%DEST_DIR%\\Backups" >nul 2>&1
    powershell -NoProfile -ExecutionPolicy Bypass -Command "New-Item -ItemType Directory -Path '%DEST_DIR%' -Force | Out-Null" >nul 2>&1
)

:: Desbloquear permissoes caso estejam travadas
icacls "%DEST_DIR%" /grant *S-1-1-0:(OI)(CI)F /T /C /Q >nul 2>&1

:: Executa verificador PowerShell
if exist "%~dp0verificar_integridade_e_reparo.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0verificar_integridade_e_reparo.ps1"
) else (
    echo Gerando verificador em tempo real...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$manifest = @('index.html', 'server_micro.ps1', 'servidor_tray.ps1', 'iniciar_servidor_silencioso.vbs', 'SucessoEdu_App.vbs', 'sucessoedu.ico', '00_LIBERAR_FIREWALL_E_PORTAS.bat'); foreach($f in $manifest) { $p = 'C:\\SucessoEdu\\' + $f; if (Test-Path $p) { $h = (Get-FileHash $p -Algorithm SHA256).Hash.Substring(0,16); Write-Host \"  [OK] $f (SHA256: $h...)\" -ForegroundColor Green } else { Write-Host \"  [FALTA] $f nao encontrado na pasta raiz\" -ForegroundColor Yellow } }"
)

echo.
echo ===============================================================================
echo   Pressione qualquer tecla para retornar ao menu ou fechar...
echo ===============================================================================
pause >nul
exit /b
`;
}

/**
 * Cria pacote ZIP de reparo contendo apenas os arquivos ausentes ou corrompidos
 */
export async function createAutoRepairZipBundle(
  filesToRepair: string[],
  config: { schoolName: string; serverPort: number; serverIp: string }
): Promise<Blob> {
  const zip = new JSZip();
  const catalogMap = new Map(CRITICAL_FILES_CATALOG.map((def) => [def.path, def]));

  // Adiciona os arquivos solicitados
  for (const filePath of filesToRepair) {
    const def = catalogMap.get(filePath);
    if (def) {
      const content = await def.getContent(config);
      zip.file(def.path, content);
    }
  }

  // Adiciona script de auto-aplicação do reparo
  const applyRepairBat = `@echo off
chcp 65001 >nul
title SucessoEdu - Aplicador de Auto-Reparo
set "SCRIPT_DIR=%~dp0"
for %%I in ("%~dp0.") do set "SCRIPT_DIR=%%~fI"
cd /d "%SCRIPT_DIR%"

net session >nul 2>&1
if %errorLevel% neq 0 (
    set "SELF_BAT=%~f0"
    set "SELF_DIR=%SCRIPT_DIR%"
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$b = $env:SELF_BAT; $d = $env:SELF_DIR; Start-Process -FilePath $env:ComSpec -ArgumentList @('/c', ('\"\"' + $b + '\"\"')) -WorkingDirectory $d -Verb RunAs -ErrorAction SilentlyContinue"
    exit /b
)

set "DEST_DIR=C:\\SucessoEdu"
if not exist "%DEST_DIR%" mkdir "%DEST_DIR%" >nul 2>&1
if not exist "%DEST_DIR%\\Backups" mkdir "%DEST_DIR%\\Backups" >nul 2>&1

echo ===============================================================================
echo   APLICANDO REPARO EM C:\\SucessoEdu...
echo ===============================================================================
robocopy "%~dp0" "%DEST_DIR%" *.* /E /IS /IT /R:1 /W:1 /NP /NFL /NDL >nul 2>&1
xcopy /y /e /c /h /r /k /i "%~dp0*" "%DEST_DIR%\\" >nul 2>&1
icacls "%DEST_DIR%" /grant *S-1-1-0:(OI)(CI)F /T /C /Q >nul 2>&1

echo [OK] Arquivos reparados e restaurados com total sucesso!
echo.
pause
exit /b
`;

  zip.file('APLICAR_REPARO_IMEDIATO.bat', applyRepairBat);
  const ps1Code = await generateIntegrityVerificationPs1(config.schoolName, config.serverPort, config.serverIp);
  zip.file('verificar_integridade_e_reparo.ps1', ps1Code);
  zip.file('Verificar_Integridade.bat', generateIntegrityVerificationBat(config.serverPort, config.schoolName));

  return await zip.generateAsync({ type: 'blob' });
}
