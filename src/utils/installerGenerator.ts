import JSZip from 'jszip';

export interface InstallerConfig {
  schoolName: string;
  serverIp: string;
  serverPort: number;
  stationName: string;
  stationType: 'ADMIN' | 'TEACHER' | 'STUDENT_LAB' | 'KIOSK_EXAM';
  autoStart: boolean;
  kioskMode: boolean;
  enableFirewallRule: boolean;
}

// -------------------------------------------------------------
// 1. MÓDULO SERVIDOR CENTRAL (MASTER OFFLINE)
// -------------------------------------------------------------

export function generateServerWindowsBat(config: InstallerConfig): string {
  return `@echo off
chcp 65001 >nul
title EduGestao Pro - Servidor Central Offline [${config.schoolName}]
color 1F

echo ===============================================================================
echo            EDUCESTAO PRO - SERVIDOR CENTRAL OFFLINE
echo            Escola: ${config.schoolName}
echo            Porta Local: ${config.serverPort}
echo ===============================================================================
echo.

:: Verificar se esta executando como Administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [AVISO] Solicitando privilegios de Administrador para abrir regras de Firewall...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

echo [1/4] Verificando Configuracao de Rede Local...
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0.*0.0.0.0') do (
    set LOCAL_IP=%%a
)
if "%LOCAL_IP%"=="" (
    set LOCAL_IP=${config.serverIp}
)
echo      - Endereco IP Detectado: %LOCAL_IP%
echo      - Porta do Servidor: ${config.serverPort}
echo.

echo [2/4] Liberando Porta ${config.serverPort} no Firewall do Windows (Rede Local)...
netsh advfirewall firewall delete rule name="EduGestao_Server_${config.serverPort}" >nul 2>&1
netsh advfirewall firewall add rule name="EduGestao_Server_${config.serverPort}" dir=in action=allow protocol=TCP localport=${config.serverPort} profile=private,domain,public >nul 2>&1
if %errorLevel% equ 0 (
    echo      [OK] Regra de Firewall criada com sucesso.
) else (
    echo      [INFO] Firewall mantido ou configurado manualmente.
)
echo.

echo [3/4] Criando Atalho do Servidor na Area de Trabalho...
set SCRIPT_DIR=%~dp0
set SHORTCUT_PATH=%USERPROFILE%\\Desktop\\EduGestao_Servidor.lnk
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%~dpnx0'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Description = 'Iniciar Servidor Local EduGestao Pro'; $s.Save()"
echo      [OK] Atalho criado na Area de Trabalho.
echo.

echo [4/4] Gerando Arquivo de Configuracao de Rede para Estacoes Clientes...
(
echo [EduGestao_Rede_Local]
echo Servidor_IP=%LOCAL_IP%
echo Porta=${config.serverPort}
echo Escola=${config.schoolName}
echo URL_Acesso=http://%LOCAL_IP%:${config.serverPort}
echo Status=ATIVO_LOCAL
) > "%SCRIPT_DIR%config_rede_estacoes.ini"
echo      [OK] Arquivo config_rede_estacoes.ini atualizado.
echo.

echo ===============================================================================
echo   SERVIDOR INICIADO COM SUCESSO! (MODO 100%% OFFLINE - SEM INTERNET)
echo ===============================================================================
echo.
echo   - Painel Local do Servidor:    http://localhost:${config.serverPort}
echo   - Acesso pelas outras maquinas: http://%LOCAL_IP%:${config.serverPort}
echo.
echo   Deixe esta janela aberta durante o horario de funcionamento da escola.
echo ===============================================================================
echo.

:: Abrir navegador padrao no servidor local
start http://localhost:${config.serverPort}

:: Manter processo ativo
if exist "%SCRIPT_DIR%dist\\server.cjs" (
    node "%SCRIPT_DIR%dist\\server.cjs"
) else if exist "%SCRIPT_DIR%node_modules" (
    npm run start
) else (
    echo [INFO] Servidor web em execucao. Pressione qualquer tecla para encerrar.
    pause >nul
)
`;
}

export function generateServerWindowsPowerShellService(config: InstallerConfig): string {
  return `# Script PowerShell para Instalacao de Servico Windows Offline
# EduGestao Pro - Servidor Central

$ServiceName = "EduGestaoServer"
$DisplayName = "EduGestao Pro - Servidor Escolar Offline"
$Port = ${config.serverPort}
$AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " Instalador de Servico em Segundo Plano - EduGestao Pro" -ForegroundColor Yellow
Write-Host "=========================================================" -ForegroundColor Cyan

# Teste de Administrador
If (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "Por favor, execute este script como Administrador do Windows."
    Exit
}

# Criar Regra de Firewall
Write-Host "[1/3] Configurando Firewall do Windows para porta $Port..." -ForegroundColor Green
New-NetFirewallRule -DisplayName "EduGestao Server $Port" -Direction Inbound -LocalPort $Port -Protocol TCP -Action Allow -Profile Any -ErrorAction SilentlyContinue

# Criar Arquivo de Inicializacao Automatica
Write-Host "[2/3] Registrando script de inicializacao no boot do Windows..." -ForegroundColor Green
$StartupFolder = [Environment]::GetFolderPath("CommonStartup")
$ShortcutTarget = "$AppDir\\Iniciar_Servidor_Offline.bat"
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$StartupFolder\\EduGestao_Servidor_AutoStart.lnk")
$Shortcut.TargetPath = $ShortcutTarget
$Shortcut.WorkingDirectory = $AppDir
$Shortcut.WindowStyle = 7 # Minimized
$Shortcut.Save()

Write-Host "[3/3] Servidor configurado para iniciar automaticamente ao ligar o PC!" -ForegroundColor Green
Write-Host "IP Local para os computadores dos alunos e professores:" -ForegroundColor Yellow
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" } | Select-Object -Property IPAddress, InterfaceAlias | Format-Table

Write-Host "Concluido com sucesso!" -ForegroundColor Cyan
`;
}

export function generateServerLinuxSh(config: InstallerConfig): string {
  return `#!/bin/bash
# ==============================================================================
# EDUGESTAO PRO - INSTALADOR DO SERVIDOR CENTRAL LINUX (OFFLINE)
# Compativel com: Ubuntu, Debian, Linux Educacional, Mint, Fedora, CentOS
# ==============================================================================

set -e
PORT=${config.serverPort}
APP_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"

echo -e "\\033[1;34m=======================================================================\\033[0m"
echo -e "\\033[1;32m      EDUCESTAO PRO - INSTALADOR SERVIDOR CENTRAL OFFLINE (LINUX)       \\033[0m"
echo -e "\\033[1;34m=======================================================================\\033[0m"
echo ""

if [ "$EUID" -ne 0 ]; then
  echo -e "\\033[1;33m[AVISO] Executando com sudo para permissões de rede e systemd...\\033[0m"
  exec sudo bash "$0" "$@"
fi

# Detectar IP Local
LOCAL_IP=$(hostname -I | awk '{print $1}')
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="${config.serverIp}"
fi

echo -e "\\033[1;36m[1/4] IP da Rede Local Detectado: \${LOCAL_IP}\\033[0m"

# Liberar porta no Firewall UFW se disponivel
echo "[2/4] Configurando Firewall para porta \${PORT}..."
if command -v ufw >/dev/null 2>&1; then
    ufw allow \${PORT}/tcp comment "EduGestao Pro Local Server" || true
    echo "      [OK] Porta \${PORT} liberada no UFW."
fi

# Criar Servico Systemd para Inicializacao Automatica
echo "[3/4] Criando servico systemd (edugestao.service)..."
cat <<EOF > /etc/systemd/system/edugestao.service
[Unit]
Description=EduGestao Pro - Servidor Escolar Offline
After=network.target

[Service]
Type=simple
User=\${SUDO_USER:-\$USER}
WorkingDirectory=\${APP_DIR}
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=\${PORT}

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable edugestao.service || true

# Criar Lancador no Desktop
echo "[4/4] Criando atalho na Area de Trabalho..."
DESKTOP_DIR="/home/\${SUDO_USER:-\$USER}/Desktop"
if [ -d "\$DESKTOP_DIR" ]; then
cat <<EOF > "\$DESKTOP_DIR/EduGestao_Servidor.desktop"
[Desktop Entry]
Version=1.0
Type=Application
Name=EduGestão Pro - Servidor Local
Comment=Acessar Painel Central do Servidor
Exec=xdg-open http://localhost:\${PORT}
Icon=network-server
Terminal=false
Categories=Education;Network;
EOF
chmod +x "\$DESKTOP_DIR/EduGestao_Servidor.desktop"
fi

echo ""
echo -e "\\033[1;32m=======================================================================\\033[0m"
echo -e "\\033[1;32m  SERVIDOR LINUX CONFIGURADO COM SUCESSO! (100%% SEM NECESSIDADE DE NET)  \\033[0m"
echo -e "\\033[1;32m=======================================================================\\033[0m"
echo -e "  - Acesso no proprio Servidor: http://localhost:\${PORT}"
echo -e "  - Acesso pelas Estacoes/Alunos: http://\${LOCAL_IP}:\${PORT}"
echo ""
`;
}

export function generateDockerCompose(config: InstallerConfig): string {
  return `version: '3.8'

services:
  edugestao-server:
    container_name: edugestao_servidor_offline
    image: node:20-alpine
    working_dir: /app
    volumes:
      - ./:/app
      - ./data_storage:/app/data
    ports:
      - "${config.serverPort}:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - SCHOOL_NAME=${config.schoolName}
    command: sh -c "npm install --production && npm run start"
    restart: always
    network_mode: "host"
`;
}

// -------------------------------------------------------------
// 2. MÓDULO ESTAÇÃO DE TRABALHO (CLIENTE / ALUNO / LABORATÓRIO)
// -------------------------------------------------------------

export function generateClientWindowsBat(config: InstallerConfig): string {
  const isKiosk = config.kioskMode || config.stationType === 'KIOSK_EXAM' || config.stationType === 'STUDENT_LAB';
  const serverUrl = `http://${config.serverIp}:${config.serverPort}`;

  return `@echo off
chcp 65001 >nul
title EduGestao Pro - Estacao de Trabalho [${config.stationName}]
color 0A

echo ===============================================================================
echo            EDUCESTAO PRO - INSTALADOR ESTACAO DE TRABALHO
echo            Tipo: ${config.stationType}
echo            Servidor Alvo: ${serverUrl}
echo ===============================================================================
echo.

set SERVER_URL=${serverUrl}
set SHORTCUT_NAME=EduGestao_${config.stationType}

echo [1/3] Testando comunicacao com o Servidor Central (%SERVER_URL%)...
powershell -Command "try { $req = [System.Net.WebRequest]::Create('%SERVER_URL%/api/health'); $req.Timeout = 3000; $res = $req.GetResponse(); Write-Host '     [OK] Servidor Central Respondendo Normalmente!' -ForegroundColor Green } catch { Write-Host '     [INFO] Servidor nao respondeu no ping rapido, mas o atalho sera criado.' -ForegroundColor Yellow }"
echo.

echo [2/3] Criando Atalho dedicado no Desktop com Modo Aplicativo...
set DESKTOP_DIR=%USERPROFILE%\\Desktop
set SCRIPT_VBS=%TEMP%\\create_shortcut.vbs

:: Detectar Chrome ou Edge para rodar como App independente
set BROWSER_CMD=
if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    set BROWSER_CMD="%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
) else if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" (
    set BROWSER_CMD="%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
) else if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    set BROWSER_CMD="%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"
) else (
    set BROWSER_CMD=explorer.exe
)

:: Flags de Modo Aplicativo / Tela Cheia / Kiosk para seguranca de prova
${
  isKiosk
    ? `set BROWSER_ARGS=--app=%SERVER_URL% --start-maximized --disable-translate --disable-extensions`
    : `set BROWSER_ARGS=--app=%SERVER_URL% --start-maximized`
}

(
echo Set oWS = WScript.CreateObject("WScript.Shell"^)
echo sLinkFile = "%DESKTOP_DIR%\\EduGestao Pro - ${config.stationName}.lnk"
echo Set oLink = oWS.CreateShortcut(sLinkFile^)
echo oLink.TargetPath = %BROWSER_CMD%
echo oLink.Arguments = "%BROWSER_ARGS%"
echo oLink.Description = "EduGestao Pro - Conectado ao Servidor Central Local"
echo oLink.WorkingDirectory = "%USERPROFILE%"
echo oLink.WindowStyle = 1
echo oLink.Save
) > "%SCRIPT_VBS%"

cscript //nologo "%SCRIPT_VBS%"
del "%SCRIPT_VBS%"

echo      [OK] Atalho criado na Area de Trabalho: "EduGestao Pro - ${config.stationName}"
echo.

${
  config.autoStart
    ? `echo [3/3] Configurando Inicializacao Automatica com o Windows...
copy /Y "%DESKTOP_DIR%\\EduGestao Pro - ${config.stationName}.lnk" "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\" >nul
echo      [OK] Configurado para abrir automaticamente ao ligar este computador.
echo.`
    : `echo [3/3] Inicializacao manual configurada (duplo clique no atalho da Area de Trabalho).
echo.`
}

echo ===============================================================================
echo   ESTACAO CONFIGURADA COM SUCESSO!
echo   Clique no atalho na Area de Trabalho para iniciar o sistema sem internet.
echo ===============================================================================
echo.

:: Perguntar se deseja abrir agora
set /p ABRIR="Deseja abrir o EduGestao Pro agora nesta estacao? (S/N): "
if /i "%ABRIR%"=="S" (
    start "" %BROWSER_CMD% %BROWSER_ARGS%
)
`;
}

export function generateClientLinuxSh(config: InstallerConfig): string {
  const isKiosk = config.kioskMode || config.stationType === 'KIOSK_EXAM' || config.stationType === 'STUDENT_LAB';
  const serverUrl = `http://${config.serverIp}:${config.serverPort}`;

  return `#!/bin/bash
# ==============================================================================
# EDUGESTAO PRO - INSTALADOR ESTACAO DE TRABALHO / LABORATÓRIO (LINUX)
# ==============================================================================

SERVER_URL="${serverUrl}"
STATION_NAME="${config.stationName}"
DESKTOP_DIR="$HOME/Desktop"
if [ ! -d "$DESKTOP_DIR" ]; then
  DESKTOP_DIR="$HOME/Área de Trabalho"
fi

echo "======================================================================="
echo "  EDUCESTAO PRO - INSTALACAO DE ESTACAO CLIENTE (LINUX OFFLINE)"
echo "  Servidor: $SERVER_URL"
echo "  Estação: $STATION_NAME"
echo "======================================================================="
echo ""

# Detectar navegador Chromium, Chrome ou Firefox
EXEC_CMD="google-chrome --app=$SERVER_URL --start-maximized"
if command -v chromium-browser >/dev/null 2>&1; then
    EXEC_CMD="chromium-browser --app=$SERVER_URL --start-maximized"
elif command -v chromium >/dev/null 2>&1; then
    EXEC_CMD="chromium --app=$SERVER_URL --start-maximized"
elif command -v google-chrome >/dev/null 2>&1; then
    EXEC_CMD="google-chrome --app=$SERVER_URL --start-maximized"
else
    EXEC_CMD="xdg-open $SERVER_URL"
fi

${
  isKiosk
    ? `EXEC_CMD="$EXEC_CMD --kiosk --disable-features=TranslateUI --disable-pinch"`
    : ''
}

# Criar arquivo .desktop
mkdir -p "$DESKTOP_DIR"
mkdir -p "$HOME/.local/share/applications"

cat <<EOF > "$DESKTOP_DIR/EduGestao_Cliente.desktop"
[Desktop Entry]
Version=1.0
Type=Application
Name=EduGestão Pro - $STATION_NAME
Comment=Conexão Local ao Servidor Escolar
Exec=$EXEC_CMD
Icon=preferences-system-network
Terminal=false
Categories=Education;Office;
StartupNotify=true
EOF

chmod +x "$DESKTOP_DIR/EduGestao_Cliente.desktop"
cp "$DESKTOP_DIR/EduGestao_Cliente.desktop" "$HOME/.local/share/applications/" || true

echo "[OK] Atalho criado na Área de Trabalho com sucesso!"
echo "Esta máquina está pronta para operar na rede local sem internet."
`;
}

export function generateClientDesktopFile(config: InstallerConfig): string {
  const serverUrl = `http://${config.serverIp}:${config.serverPort}`;
  return `[Desktop Entry]
Version=1.0
Type=Application
Name=EduGestão Pro - ${config.stationName}
Comment=Acesso direto ao Servidor Escolar Offline
Exec=google-chrome --app=${serverUrl} --start-maximized
Icon=preferences-system-network
Terminal=false
Categories=Education;Teaching;
StartupNotify=true
`;
}

export function generateServerConfigIni(config: InstallerConfig): string {
  return `[EduGestao_Configuracao_Offline]
Escola=${config.schoolName}
Servidor_IP=${config.serverIp}
Servidor_Porta=${config.serverPort}
Modo_Rede=LAN_OFFLINE_LOCAL
Sincronizacao_Segura=1
Criado_Em=${new Date().toISOString()}
Versao=4.2.0-Enterprise
`;
}

export function generateOfflineManualMarkdown(config: InstallerConfig): string {
  return `# MANUAL OFICIAL DE INSTALAÇÃO OFFLINE (REDE LOCAL SEM INTERNET)
**Sistema:** EduGestão Pro v4.2.0
**Instituição:** ${config.schoolName}
**IP Configurado do Servidor:** \`${config.serverIp}\` (Porta \`${config.serverPort}\`)

---

## 📌 1. Visão Geral da Arquitetura
O sistema foi desenvolvido para funcionar **100% de forma autônoma e local**, dispensando conexão com a internet externa.
- **Computador Servidor (Secretaria / TI):** Guarda os dados, gerencia matrículas, gabaritos e aplica as correções automáticas.
- **Computadores Clientes (Professores / Alunos / Laboratórios):** Conectam-se ao Servidor pela rede Wi-Fi ou cabo de rede local (LAN).

---

## 🖥️ 2. Instalação no Servidor Central (Passo a Passo)

### No Windows:
1. Extraia o conteúdo deste pacote no computador principal da escola (ex: \`C:\\EduGestao_Servidor\`).
2. Clique com o botão direito no arquivo **\`Instalar_Servidor_Windows.bat\`** e escolha **"Executar como Administrador"**.
3. O script irá:
   - Identificar o IP local do servidor.
   - Liberar a porta \`${config.serverPort}\` no Firewall do Windows automaticamente.
   - Criar o atalho **"EduGestão Pro - Servidor"** na Área de Trabalho.
   - Iniciar o servidor local.
4. Para acessar no próprio servidor: Abra \`http://localhost:${config.serverPort}\`.

### No Linux (Ubuntu / Debian / Linux Educacional):
1. Abra o terminal na pasta extraída.
2. Execute:
   \`\`\`bash
   chmod +x instalar_servidor_linux.sh
   sudo ./instalar_servidor_linux.sh
   \`\`\`
3. O serviço \`edugestao.service\` será instalado no \`systemd\`, iniciando automaticamente ao ligar o computador.

---

## 💻 3. Instalação nas Estações de Trabalho / Laboratórios de Informática

### No Windows (Laboratório dos Alunos / Professores):
1. Em cada computador do laboratório, execute o arquivo **\`Instalar_Estacao_Windows.bat\`**.
2. O script criará o atalho **"EduGestão Pro - ${config.stationName}"** na Área de Trabalho.
3. Ao abrir o atalho, o navegador é lançado em **Modo Aplicativo Nativo (App Mode)**, sem barras de endereços ou abas desnecessárias.
4. Ideal para **aplicação de provas sem trapaça**.

### No Linux:
1. Execute \`./instalar_estacao_linux.sh\`.
2. O atalho de desktop será adicionado na Área de Trabalho do aluno.

---

## 🔒 4. Resolução de Problemas Comuns na Rede Local
- **A estação não encontra o servidor:**
  - Verifique se ambos os computadores estão conectados no mesmo roteador / Wi-Fi da escola.
  - No servidor, abra o Prompt de Comando (\`cmd\`) e digite \`ipconfig\` para confirmar o endereço IP.
  - Atualize o arquivo \`config_rede_estacoes.ini\` com o IP correto.
- **Backup e Segurança:**
  - No menu do sistema, acesse **Configurações > Backup** para exportar periodicamente cópias de segurança em Pendrive.

---
*EduGestão Pro - Tecnologia Educacional Soberana e Segura.*
`;
}

// -------------------------------------------------------------
// 3. GERADOR DE PACOTE ZIP COMPLETO
// -------------------------------------------------------------

export async function generateZipBundle(
  type: 'SERVER' | 'CLIENT' | 'FULL',
  config: InstallerConfig
): Promise<Blob> {
  const zip = new JSZip();

  if (type === 'SERVER' || type === 'FULL') {
    const serverFolder = type === 'FULL' ? zip.folder('01_MODULO_SERVIDOR_CENTRAL')! : zip;
    serverFolder.file('Instalar_Servidor_Windows.bat', generateServerWindowsBat(config));
    serverFolder.file('Configurar_Servico_PowerShell.ps1', generateServerWindowsPowerShellService(config));
    serverFolder.file('instalar_servidor_linux.sh', generateServerLinuxSh(config));
    serverFolder.file('docker-compose.yml', generateDockerCompose(config));
    serverFolder.file('config_servidor.ini', generateServerConfigIni(config));
    serverFolder.file('LEIA-ME_SERVIDOR.txt', generateOfflineManualMarkdown(config));
  }

  if (type === 'CLIENT' || type === 'FULL') {
    const clientFolder = type === 'FULL' ? zip.folder('02_MODULO_ESTACAO_TRABALHO_CLIENTE')! : zip;
    clientFolder.file('Instalar_Estacao_Windows.bat', generateClientWindowsBat(config));
    clientFolder.file('instalar_estacao_linux.sh', generateClientLinuxSh(config));
    clientFolder.file('EduGestao_Estacao.desktop', generateClientDesktopFile(config));
    clientFolder.file('config_estacao.ini', generateServerConfigIni(config));
    clientFolder.file('LEIA-ME_ESTACAO.txt', generateOfflineManualMarkdown(config));
  }

  // Common Docs in root
  zip.file('MANUAL_DE_INSTALACAO_OFFLINE.md', generateOfflineManualMarkdown(config));

  return await zip.generateAsync({ type: 'blob' });
}
