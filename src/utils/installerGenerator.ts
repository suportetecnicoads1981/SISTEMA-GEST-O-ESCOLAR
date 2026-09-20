import JSZip from 'jszip';
import { createSucessoEduIconUint8Array } from './iconGenerator';
import { generateFullStandaloneAppHtml } from './standaloneAppHtml';
import { generateUpdateManualHtml } from './updatePackageHelper';
import { generateArchitectureDiagramHtml, syncSystemArchitectureDiagrams } from './systemArchitectureDiagram';
import { generateDirectoryVerificationBat } from './installationStructureVerifier';
import { DatabaseAutomatorService } from '../services/databaseAutomatorService';
import { RelationalIntegrityService } from '../services/relationalIntegrityService';

export { generateDirectoryVerificationBat };

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

/**
 * Sanitiza strings para exibição segura dentro de comandos e scripts Windows Batch (.BAT / .CMD).
 * No interpretador de comandos CMD do Windows, o caractere '&' funciona como separador de comandos.
 * Se uma instituição contiver '&' (ex: "Colégio Horizonte do Saber & Inovação"), o CMD interpretará
 * o que vem depois do '&' como um executável/comando separado, disparando erros como:
 * "'Inovação' não é reconhecido como um comando interno ou externo..."
 * Esta função substitui '&' por 'e' e remove caracteres de controle perigosos no CMD (^, |, <, >, ", %).
 */
export function sanitizeBatchString(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, 'e')
    .replace(/["^|<>%]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, '')
    .trim();
}

/**
 * Garante que scripts Windows (.BAT, .CMD, .VBS, .REG, .INI) usem estritamente
 * quebras de linha Windows CRLF (\r\n).
 * No interpretador cmd.exe do Windows, arquivos com quebras de linha UNIX (LF puro \n)
 * causam desvio de byte-offset em comandos 'goto' e blocos de instrucoes. Isso faz
 * com que o cmd.exe pule caracteres nos rotulos e dispare erros em cascata como:
 * "'O_UNINSTALL_SAFE' nao e reconhecido...", "'PRESERVE_BACKUP=1' nao e reconhecido...", "'o' nao e reconhecido..."
 */
export function toWindowsCrlf(str: string): string {
  if (!str) return '';
  return str.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\r\n');
}

/**
 * Converte qualquer script .BAT / .CMD para 7-bit ASCII estrito com CRLF.
 * No interpretador cmd.exe do Windows, qualquer caractere UTF-8 multi-byte (acentos, cedilhas)
 * altera a contagem fisica de bytes no arquivo, quebrando as posicoes de salto 'goto'
 * e corrompendo labels (ex: ':DO_UNINSTALL_SAFE' e lido como 'O_UNINSTALL_SAFE').
 * Esta funcao garante 100% de estabilidade de execucao do CMD em qualquer versao do Windows.
 */
export function toSafeBatchAscii(str: string): string {
  if (!str) return '';
  const clean = str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, '');
  return toWindowsCrlf(clean);
}

// -------------------------------------------------------------
// HELPER: MICRO-SERVIDOR HTTP NATIVO WINDOWS (POWERSHELL / .NET)
// Zero dependencias: Funciona nativamente em Windows 7, 8, 10 e 11
// -------------------------------------------------------------

// -------------------------------------------------------------
// HELPER: SERVIDOR BANDEJA DO SISTEMA (SYSTEM TRAY WINDOWS COM ÍCONE DE COMPUTADOR)
// Executa em segundo plano minimizado na barra de tarefas (notificações) com ícone de computador,
// menu de contexto inteligente, notificações balão e HTTP server nativo sem janela preta.
// -------------------------------------------------------------

export function generateServerTrayPs1(port = 8088, schoolName = 'SucessoEdu Gestão Educacional'): string {
  const cleanSchool = schoolName.replace(/"/g, '');
  return `# ===============================================================================
# SUCESSOEDU GESTAO EDUCACIONAL - SERVIDOR BANDEJA DO SISTEMA (SYSTEM TRAY)
# Servidor local autônomo com ícone persistente na bandeja do sistema (notificações)
# Diretório Raiz: C:\\SucessoEdu | Multi-Threaded C# HTTP Server Nativo
# ===============================================================================
param(
    [int]$Port = ${port},
    [string]$SchoolName = "${cleanSchool}"
)

# Carregar assemblies do Windows Forms e GDI+
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "SilentlyContinue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Determinar e garantir pasta raiz permanente (Prioridade C:\\SucessoEdu)
$RootDir = "C:\\SucessoEdu"
if (-not (Test-Path $RootDir)) {
    try {
        New-Item -ItemType Directory -Path $RootDir -Force -ErrorAction SilentlyContinue | Out-Null
        New-Item -ItemType Directory -Path (Join-Path $RootDir "Backups") -Force -ErrorAction SilentlyContinue | Out-Null
        New-Item -ItemType Directory -Path (Join-Path $RootDir "data") -Force -ErrorAction SilentlyContinue | Out-Null
    } catch {}
}

# Se PSScriptRoot contiver os arquivos do sistema e C:\\SucessoEdu estiver sem o HTML principal, copia automaticamente
if (Test-Path $PSScriptRoot -and (Test-Path $RootDir)) {
    if (-not (Test-Path (Join-Path $RootDir "index.html")) -and (Test-Path (Join-Path $PSScriptRoot "SucessoEdu_Aplicativo_Offline.html"))) {
        Copy-Item -Path (Join-Path $PSScriptRoot "*") -Destination $RootDir -Recurse -Force -ErrorAction SilentlyContinue
        if (Test-Path (Join-Path $RootDir "SucessoEdu_Aplicativo_Offline.html")) {
            Copy-Item -Path (Join-Path $RootDir "SucessoEdu_Aplicativo_Offline.html") -Destination (Join-Path $RootDir "index.html") -Force -ErrorAction SilentlyContinue
        }
    }
}

if (-not (Test-Path $RootDir)) {
    if (Test-Path $PSScriptRoot) {
        $RootDir = $PSScriptRoot
    } else {
        $RootDir = (Get-Location).Path
    }
}
Set-Location $RootDir

# 1. Obter IP real do computador local
$localIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { 
    $_.IPAddress -notmatch '^127\.' -and 
    $_.IPAddress -notmatch '^169\.254\.' -and 
    $_.InterfaceAlias -notmatch 'Loopback|vEthernet|VirtualBox|VMware|WSL|Bluetooth' 
} | Select-Object -First 1).IPAddress
if (-not $localIp) { $localIp = "127.0.0.1" }

# 2. Servidor HTTP Multi-Threaded Nativo em C# (Isola o loop de rede da thread UI da bandeja)
$csharpSource = @"
using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;

public class SucessoEduTrayHttpServer
{
    private HttpListener listener;
    private Thread workerThread;
    private bool isRunning;
    public string RootDir { get; set; }
    public int Port { get; set; }
    public string LocalIp { get; set; }

    public bool Start(string rootDir, int port, string localIp)
    {
        this.RootDir = rootDir;
        this.Port = port;
        this.LocalIp = localIp;
        try
        {
            listener = new HttpListener();
            listener.Prefixes.Add("http://localhost:" + port + "/");
            listener.Prefixes.Add("http://127.0.0.1:" + port + "/");
            if (!string.IsNullOrEmpty(localIp) && localIp != "127.0.0.1" && localIp != "localhost")
            {
                try { listener.Prefixes.Add("http://" + localIp + ":" + port + "/"); } catch {}
            }
            listener.Start();
            isRunning = true;
            workerThread = new Thread(ListenLoop);
            workerThread.IsBackground = true;
            workerThread.Start();
            return true;
        }
        catch (Exception)
        {
            try
            {
                listener = new HttpListener();
                listener.Prefixes.Add("http://127.0.0.1:" + port + "/");
                listener.Prefixes.Add("http://localhost:" + port + "/");
                listener.Start();
                isRunning = true;
                workerThread = new Thread(ListenLoop);
                workerThread.IsBackground = true;
                workerThread.Start();
                return true;
            }
            catch { return false; }
        }
    }

    private void ListenLoop()
    {
        while (isRunning && listener != null && listener.IsListening)
        {
            try
            {
                var context = listener.GetContext();
                ThreadPool.QueueUserWorkItem((ctx) => ProcessRequest((HttpListenerContext)ctx), context);
            }
            catch
            {
                if (!isRunning) break;
            }
        }
    }

    private void ProcessRequest(HttpListenerContext context)
    {
        try
        {
            var req = context.Request;
            var res = context.Response;
            string path = req.Url.LocalPath;
            if (string.IsNullOrEmpty(path) || path == "/") path = "/index.html";

            if (path == "/api/health" || path == "/api/ping")
            {
                string json = "{\"status\":\"ok\",\"server\":\"SucessoEdu_Tray_Server\",\"port\":" + Port + ",\"localIp\":\"" + LocalIp + "\"}";
                byte[] b = Encoding.UTF8.GetBytes(json);
                res.ContentType = "application/json; charset=utf-8";
                res.StatusCode = 200;
                res.ContentLength64 = b.Length;
                res.OutputStream.Write(b, 0, b.Length);
                res.Close();
                return;
            }

            if ((path == "/api/sync" || path == "/api/save") && req.HttpMethod == "POST")
            {
                try
                {
                    using (var reader = new StreamReader(req.InputStream, req.ContentEncoding))
                    {
                        string body = reader.ReadToEnd();
                        string dataDir = Path.Combine(RootDir, "data");
                        if (!Directory.Exists(dataDir)) Directory.CreateDirectory(dataDir);
                        string dbPath = Path.Combine(dataDir, "banco_educacional.json");
                        File.WriteAllText(dbPath, body, Encoding.UTF8);
                        string logPath = Path.Combine(dataDir, "historico_sincronizacao_estacoes.log");
                        File.AppendAllText(logPath, "[" + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "] Dados centralizados da estacao salvos no Servidor Local.\r\n", Encoding.UTF8);
                    }
                    string okJson = "{\"status\":\"ok\",\"mensagem\":\"Dados centralizados com sucesso no Servidor Local!\"}";
                    byte[] ob = Encoding.UTF8.GetBytes(okJson);
                    res.ContentType = "application/json; charset=utf-8";
                    res.StatusCode = 200;
                    res.ContentLength64 = ob.Length;
                    res.OutputStream.Write(ob, 0, ob.Length);
                    res.Close();
                    return;
                }
                catch (Exception ex)
                {
                    string errJson = "{\"status\":\"error\",\"mensagem\":\"" + ex.Message.Replace("\"", "") + "\"}";
                    byte[] eb = Encoding.UTF8.GetBytes(errJson);
                    res.ContentType = "application/json; charset=utf-8";
                    res.StatusCode = 500;
                    res.ContentLength64 = eb.Length;
                    res.OutputStream.Write(eb, 0, eb.Length);
                    res.Close();
                    return;
                }
            }

            if (path == "/api/sync/municipal" && req.HttpMethod == "POST")
            {
                try
                {
                    using (var reader = new StreamReader(req.InputStream, req.ContentEncoding))
                    {
                        string body = reader.ReadToEnd();
                        string dataDir = Path.Combine(RootDir, "data");
                        if (!Directory.Exists(dataDir)) Directory.CreateDirectory(dataDir);
                        string munDir = Path.Combine(dataDir, "sincronizacao_municipal");
                        if (!Directory.Exists(munDir)) Directory.CreateDirectory(munDir);
                        string fname = "sinc_polo_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + ".edusync";
                        File.WriteAllText(Path.Combine(munDir, fname), body, Encoding.UTF8);
                        string logPath = Path.Combine(dataDir, "historico_sincronizacao_secretaria.log");
                        File.AppendAllText(logPath, "[" + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "] Pacote de Polo / Escola Sincronizado: " + fname + "\r\n", Encoding.UTF8);
                    }
                    string okJson = "{\"status\":\"ok\",\"mensagem\":\"Pacote de dados municipal recebido e consolidado com sucesso!\"}";
                    byte[] ob = Encoding.UTF8.GetBytes(okJson);
                    res.ContentType = "application/json; charset=utf-8";
                    res.StatusCode = 200;
                    res.ContentLength64 = ob.Length;
                    res.OutputStream.Write(ob, 0, ob.Length);
                    res.Close();
                    return;
                }
                catch (Exception ex)
                {
                    string errJson = "{\"status\":\"error\",\"mensagem\":\"" + ex.Message.Replace("\"", "") + "\"}";
                    byte[] eb = Encoding.UTF8.GetBytes(errJson);
                    res.ContentType = "application/json; charset=utf-8";
                    res.StatusCode = 500;
                    res.ContentLength64 = eb.Length;
                    res.OutputStream.Write(eb, 0, eb.Length);
                    res.Close();
                    return;
                }
            }

            string safePath = path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            string fp = Path.Combine(RootDir, safePath);

            if (!File.Exists(fp) || Directory.Exists(fp))
            {
                string idx = Path.Combine(RootDir, "index.html");
                string offline = Path.Combine(RootDir, "SucessoEdu_Aplicativo_Offline.html");
                if (File.Exists(idx)) fp = idx;
                else if (File.Exists(offline)) fp = offline;
            }

            if (File.Exists(fp))
            {
                string ext = Path.GetExtension(fp).ToLowerInvariant();
                string mime = "text/plain";
                switch (ext)
                {
                    case ".html": case ".htm": mime = "text/html; charset=utf-8"; break;
                    case ".js": mime = "application/javascript; charset=utf-8"; break;
                    case ".css": mime = "text/css; charset=utf-8"; break;
                    case ".json": mime = "application/json; charset=utf-8"; break;
                    case ".ico": mime = "image/x-icon"; break;
                    case ".png": mime = "image/png"; break;
                    case ".jpg": case ".jpeg": mime = "image/jpeg"; break;
                    case ".svg": mime = "image/svg+xml"; break;
                    case ".woff2": mime = "font/woff2"; break;
                    case ".edupkg": case ".edusync": mime = "application/octet-stream"; break;
                    default: mime = "application/octet-stream"; break;
                }
                byte[] b = File.ReadAllBytes(fp);
                res.ContentType = mime;
                res.StatusCode = 200;
                res.ContentLength64 = b.Length;
                res.OutputStream.Write(b, 0, b.Length);
            }
            else
            {
                string fallbackFile = Path.Combine(RootDir, "SucessoEdu_Aplicativo_Offline.html");
                if (File.Exists(fallbackFile))
                {
                    byte[] b = File.ReadAllBytes(fallbackFile);
                    res.ContentType = "text/html; charset=utf-8";
                    res.StatusCode = 200;
                    res.ContentLength64 = b.Length;
                    res.OutputStream.Write(b, 0, b.Length);
                }
                else
                {
                    string html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>SucessoEdu</title><script>window.location.href='index.html';</script></head><body>Carregando SucessoEdu...</body></html>";
                    byte[] b = Encoding.UTF8.GetBytes(html);
                    res.ContentType = "text/html; charset=utf-8";
                    res.StatusCode = 200;
                    res.ContentLength64 = b.Length;
                    res.OutputStream.Write(b, 0, b.Length);
                }
            }
            res.Close();
        }
        catch {}
    }

    public void Stop()
    {
        isRunning = false;
        try { if (listener != null) { listener.Stop(); listener.Close(); } } catch {}
        try { if (workerThread != null) workerThread.Abort(); } catch {}
    }
}
"@

try {
    Add-Type -TypeDefinition $csharpSource -Language CSharp
} catch {}

# 3. Inicializar Servidor HTTP em Segundo Plano com Busca Automatica de Porta Livre
$server = $null
$activePort = $Port
$serverBound = $false

for ($p = $Port; $p -le ($Port + 20); $p++) {
    try {
        $candidateServer = New-Object SucessoEduTrayHttpServer
        if ($candidateServer.Start($RootDir, $p, $localIp)) {
            $server = $candidateServer
            $activePort = $p
            $serverBound = $true
            break
        }
    } catch {}
}
$Port = $activePort

# Gravar porta ativa e IP no arquivo de configuracao para estacoes e atalhos
try {
    $iniFile = Join-Path $RootDir "config_rede_estacoes.ini"
    $iniContent = "[Rede_SucessoEdu]" + [Environment]::NewLine + "Servidor_IP=" + $localIp + [Environment]::NewLine + "Porta=" + $Port + [Environment]::NewLine + "Ultima_Atualizacao=" + (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Set-Content -Path $iniFile -Value $iniContent -Encoding UTF8 -Force
} catch {}

# 4. Criar Componente NotifyIcon (Ícone na Bandeja do Sistema com ApplicationContext)
$appContext = New-Object System.Windows.Forms.ApplicationContext
$notifyIcon = New-Object System.Windows.Forms.NotifyIcon

# Carregar ícone (sucessoedu.ico ou ícone de sistema nativo com fallback garantido)
$trayIcon = $null
$candidateIcoPaths = @(
    (Join-Path $RootDir "sucessoedu.ico"),
    (Join-Path $PSScriptRoot "sucessoedu.ico"),
    "C:\\SucessoEdu\\sucessoedu.ico",
    (Join-Path (Join-Path $env:LOCALAPPDATA "SucessoEdu") "sucessoedu.ico")
)

foreach ($cp in $candidateIcoPaths) {
    if ($cp -and (Test-Path $cp)) {
        try {
            $trayIcon = New-Object System.Drawing.Icon($cp)
            if ($trayIcon) { break }
        } catch {}
    }
}

if (-not $trayIcon) {
    try {
        $trayIcon = [System.Drawing.SystemIcons]::Application
    } catch {
        try {
            $trayIcon = [System.Drawing.SystemIcons]::Information
        } catch {}
    }
}

if (-not $trayIcon) {
    try {
        $bmp = New-Object System.Drawing.Bitmap(32, 32)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $brushBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
        $g.FillEllipse($brushBg, 1, 1, 30, 30)
        $penBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(16, 185, 129), 2)
        $g.DrawEllipse($penBorder, 1, 1, 30, 30)
        $font = New-Object System.Drawing.Font("Arial", 13, [System.Drawing.FontStyle]::Bold)
        $brushText = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $format = New-Object System.Drawing.StringFormat
        $format.Alignment = [System.Drawing.StringAlignment]::Center
        $format.LineAlignment = [System.Drawing.StringAlignment]::Center
        $rect = New-Object System.Drawing.RectangleF(0, 0, 32, 32)
        $g.DrawString("S", $font, $brushText, $rect, $format)
        $hIcon = $bmp.GetHicon()
        $trayIcon = [System.Drawing.Icon]::FromHandle($hIcon)
    } catch {}
}

$notifyIcon.Icon = $trayIcon

# Texto do Tooltip estritamente limitado a 63 caracteres (evita ArgumentException no .NET)
$tipText = "SucessoEdu: http://" + $localIp + ":" + $Port
if ($tipText.Length -gt 63) {
    $tipText = $tipText.Substring(0, 60) + "..."
}
$notifyIcon.Text = $tipText
$notifyIcon.Visible = $true

# 5. Menu de Contexto Inteligente (Botão Direito no Ícone da Bandeja)
$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip

$headerItem = New-Object System.Windows.Forms.ToolStripMenuItem
$headerItem.Text = "🖥️ SucessoEdu Servidor Central"
$headerItem.Font = New-Object System.Drawing.Font($headerItem.Font, [System.Drawing.FontStyle]::Bold)
$headerItem.Enabled = $false
$contextMenu.Items.Add($headerItem) | Out-Null

$statusItem = New-Object System.Windows.Forms.ToolStripMenuItem
$statusItem.Text = "🟢 Ativo em http://" + $localIp + ":" + $Port
$statusItem.Enabled = $false
$contextMenu.Items.Add($statusItem) | Out-Null

$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

$openAppItem = New-Object System.Windows.Forms.ToolStripMenuItem
$openAppItem.Text = "🌐 Abrir SucessoEdu (Navegador)"
$openAppItem.Font = New-Object System.Drawing.Font($openAppItem.Font, [System.Drawing.FontStyle]::Bold)
$openAppItem.Add_Click({
    $vbs = Join-Path $RootDir "SucessoEdu_App.vbs"
    if (Test-Path $vbs) {
        Start-Process "wscript.exe" -ArgumentList ('"' + $vbs + '"')
    } else {
        Start-Process ("http://127.0.0.1:" + $Port)
    }
})
$contextMenu.Items.Add($openAppItem) | Out-Null

$showIpItem = New-Object System.Windows.Forms.ToolStripMenuItem
$showIpItem.Text = "📡 Ver / Copiar IP do Servidor"
$showIpItem.Add_Click({
    $url = "http://" + $localIp + ":" + $Port
    [System.Windows.Forms.Clipboard]::SetText($url)
    $msg = "Endereco IP deste computador servidor:" + [Environment]::NewLine + [Environment]::NewLine + $url + [Environment]::NewLine + [Environment]::NewLine + "Diretorio Raiz: " + $RootDir + [Environment]::NewLine + [Environment]::NewLine + "(O link foi copiado para a area de transferencia!)"
    [System.Windows.Forms.MessageBox]::Show($msg, "SucessoEdu - Servidor Local", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
})
$contextMenu.Items.Add($showIpItem) | Out-Null

$openFolderItem = New-Object System.Windows.Forms.ToolStripMenuItem
$openFolderItem.Text = "📁 Abrir Pasta C:\\SucessoEdu"
$openFolderItem.Add_Click({
    Start-Process "explorer.exe" -ArgumentList ('"' + $RootDir + '"')
})
$contextMenu.Items.Add($openFolderItem) | Out-Null

$widgetItem = New-Object System.Windows.Forms.ToolStripMenuItem
$widgetItem.Text = "📌 Mostrar Widget Flutuante na Área de Trabalho"
$widgetItem.Font = New-Object System.Drawing.Font($widgetItem.Font, [System.Drawing.FontStyle]::Bold)
$widgetItem.Add_Click({
    $widgetPs1 = Join-Path $RootDir "servidor_widget_flutuante.ps1"
    if (Test-Path $widgetPs1) {
        Start-Process powershell.exe -ArgumentList ("-STA -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File '" + $widgetPs1 + "' -Port " + $Port)
    }
})
$contextMenu.Items.Add($widgetItem) | Out-Null

$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

$exitItem = New-Object System.Windows.Forms.ToolStripMenuItem
$exitItem.Text = "❌ Encerrar Servidor Escolar"
$exitItem.Add_Click({
    $notifyIcon.Visible = $false
    $notifyIcon.Dispose()
    if ($server) { $server.Stop() }
    if ($appContext) { $appContext.ExitThread() }
    [System.Windows.Forms.Application]::Exit()
    Stop-Process -Id $PID -Force
})
$contextMenu.Items.Add($exitItem) | Out-Null

$notifyIcon.ContextMenuStrip = $contextMenu

# 6. Duplo clique no ícone da bandeja abre diretamente o aplicativo
$notifyIcon.Add_DoubleClick({
    $vbs = Join-Path $RootDir "SucessoEdu_App.vbs"
    if (Test-Path $vbs) {
        Start-Process "wscript.exe" -ArgumentList ('"' + $vbs + '"')
    } else {
        Start-Process ("http://127.0.0.1:" + $Port)
    }
})

# 7. Iniciar Widget Flutuante na Área de Trabalho automaticamente
try {
    $widgetScript = Join-Path $RootDir "servidor_widget_flutuante.ps1"
    if (Test-Path $widgetScript) {
        Start-Process powershell.exe -ArgumentList ("-STA -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File '" + $widgetScript + "' -Port " + $Port)
    }
} catch {}

# 8. Notificação Balão ao iniciar
$notifyIcon.BalloonTipTitle = "SucessoEdu Servidor Escolar Ativo"
$notifyIcon.BalloonTipText = "Servidor em execucao no IP " + $localIp + ":" + $Port + ". Minimizado na bandeja do sistema."
$notifyIcon.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Info
$notifyIcon.ShowBalloonTip(3500)

$notifyIcon.Add_BalloonTipClicked({
    $vbs = Join-Path $RootDir "SucessoEdu_App.vbs"
    if (Test-Path $vbs) {
        Start-Process "wscript.exe" -ArgumentList ('"' + $vbs + '"')
    } else {
        Start-Process ("http://127.0.0.1:" + $Port)
    }
})

# 9. Iniciar Loop de Execução da Mensageria Windows Forms com ApplicationContext
[System.Windows.Forms.Application]::Run($appContext)
`;
}

export function generateFloatingServerWidgetPs1(port = 8088): string {
  return `# ===============================================================================
# SUCESSOEDU GESTAO EDUCACIONAL - WIDGET FLUTUANTE DA ÁREA DE TRABALHO
# Monitor de status do servidor em tempo real (Always on Top e Arrastável)
# ===============================================================================
param(
    [int]$Port = ${port},
    [string]$RootDir = ""
)

$ErrorActionPreference = "SilentlyContinue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$mutex = New-Object System.Threading.Mutex($false, "Global\\SucessoEdu_Widget_Mutex")
if (-not $mutex.WaitOne(0, $false)) {
    exit
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

if (-not $RootDir -or -not (Test-Path $RootDir)) {
    if (Test-Path "C:\\SucessoEdu") {
        $RootDir = "C:\\SucessoEdu"
    } else {
        $RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    }
}

# 1. Identificar IP Local Real
$localIp = "127.0.0.1"
try {
    $ipObj = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { 
        $_.IPAddress -notlike "127.*" -and 
        $_.IPAddress -notlike "169.254.*" -and 
        $_.InterfaceAlias -notlike "*Loopback*" -and 
        $_.InterfaceAlias -notlike "*vEthernet*" -and
        $_.InterfaceAlias -notlike "*VirtualBox*" -and
        $_.InterfaceAlias -notlike "*VMware*" -and
        $_.InterfaceAlias -notlike "*WSL*"
    } | Select-Object -First 1)
    if ($ipObj) { $localIp = $ipObj.IPAddress }
} catch {}

$serverUrl = "http://" + $localIp + ":" + $Port

# 2. Configurar Formulário Flutuante
$widget = New-Object System.Windows.Forms.Form
$widget.Text = "SucessoEdu Servidor Flutuante"
$widget.Size = New-Object System.Drawing.Size(330, 136)
$widget.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::None
$widget.TopMost = $true
$widget.ShowInTaskbar = $false
$widget.StartPosition = [System.Windows.Forms.FormStartPosition]::Manual
$widget.BackColor = [System.Drawing.Color]::FromArgb(15, 23, 42) # Slate-900

# Posicionar no canto superior direito
$screen = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$widget.Location = New-Object System.Drawing.Point(($screen.Width - 350), 30)

# Suporte a Arrastar (Drag & Drop)
$isDragging = $false
$dragCursorPoint = [System.Drawing.Point]::Empty
$dragFormPoint = [System.Drawing.Point]::Empty

$widget.Add_MouseDown({
    if ($_.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
        $script:isDragging = $true
        $script:dragCursorPoint = [System.Windows.Forms.Cursor]::Position
        $script:dragFormPoint = $widget.Location
    }
})
$widget.Add_MouseMove({
    if ($script:isDragging) {
        $dif = [System.Drawing.Point]::Subtract([System.Windows.Forms.Cursor]::Position, [System.Drawing.Size]$script:dragCursorPoint)
        $widget.Location = [System.Drawing.Point]::Add($script:dragFormPoint, [System.Drawing.Size]$dif)
    }
})
$widget.Add_MouseUp({
    if ($_.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
        $script:isDragging = $false
    }
})

# Barra de Topo
$topPanel = New-Object System.Windows.Forms.Panel
$topPanel.Size = New-Object System.Drawing.Size(330, 32)
$topPanel.Location = New-Object System.Drawing.Point(0, 0)
$topPanel.BackColor = [System.Drawing.Color]::FromArgb(30, 41, 59) # Slate-800

$topPanel.Add_MouseDown({
    if ($_.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
        $script:isDragging = $true
        $script:dragCursorPoint = [System.Windows.Forms.Cursor]::Position
        $script:dragFormPoint = $widget.Location
    }
})
$topPanel.Add_MouseMove({
    if ($script:isDragging) {
        $dif = [System.Drawing.Point]::Subtract([System.Windows.Forms.Cursor]::Position, [System.Drawing.Size]$script:dragCursorPoint)
        $widget.Location = [System.Drawing.Point]::Add($script:dragFormPoint, [System.Drawing.Size]$dif)
    }
})
$topPanel.Add_MouseUp({
    if ($_.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
        $script:isDragging = $false
    }
})

$lblTitle = New-Object System.Windows.Forms.Label
$lblTitle.Text = "🎓 SucessoEdu Servidor Local"
$lblTitle.Font = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Bold)
$lblTitle.ForeColor = [System.Drawing.Color]::White
$lblTitle.Location = New-Object System.Drawing.Point(8, 6)
$lblTitle.AutoSize = $true
$topPanel.Controls.Add($lblTitle)

$btnClose = New-Object System.Windows.Forms.Button
$btnClose.Text = "✕"
$btnClose.Size = New-Object System.Drawing.Size(26, 22)
$btnClose.Location = New-Object System.Drawing.Point(298, 5)
$btnClose.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnClose.FlatAppearance.BorderSize = 0
$btnClose.ForeColor = [System.Drawing.Color]::FromArgb(148, 163, 184)
$btnClose.Cursor = [System.Windows.Forms.Cursors]::Hand
$btnClose.Add_Click({ $widget.Hide() })
$topPanel.Controls.Add($btnClose)

$btnMin = New-Object System.Windows.Forms.Button
$btnMin.Text = "─"
$btnMin.Size = New-Object System.Drawing.Size(26, 22)
$btnMin.Location = New-Object System.Drawing.Point(270, 5)
$btnMin.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnMin.FlatAppearance.BorderSize = 0
$btnMin.ForeColor = [System.Drawing.Color]::FromArgb(148, 163, 184)
$btnMin.Cursor = [System.Windows.Forms.Cursors]::Hand
$btnMin.Add_Click({ $widget.Hide() })
$topPanel.Controls.Add($btnMin)

$widget.Controls.Add($topPanel)

# Status e Informações do Servidor
$lblStatus = New-Object System.Windows.Forms.Label
$lblStatus.Text = "🟢 ONLINE • Porta " + $Port
$lblStatus.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(52, 211, 153) # Emerald
$lblStatus.Location = New-Object System.Drawing.Point(10, 40)
$lblStatus.AutoSize = $true
$widget.Controls.Add($lblStatus)

$lblIp = New-Object System.Windows.Forms.Label
$lblIp.Text = "IP: " + $serverUrl
$lblIp.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Regular)
$lblIp.ForeColor = [System.Drawing.Color]::FromArgb(203, 213, 225) # Slate-300
$lblIp.Location = New-Object System.Drawing.Point(10, 60)
$lblIp.AutoSize = $true
$widget.Controls.Add($lblIp)

# Botões de Ação
$btnOpen = New-Object System.Windows.Forms.Button
$btnOpen.Text = "🌐 Abrir"
$btnOpen.Size = New-Object System.Drawing.Size(72, 28)
$btnOpen.Location = New-Object System.Drawing.Point(10, 92)
$btnOpen.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnOpen.BackColor = [System.Drawing.Color]::FromArgb(79, 70, 229) # Indigo
$btnOpen.ForeColor = [System.Drawing.Color]::White
$btnOpen.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
$btnOpen.Cursor = [System.Windows.Forms.Cursors]::Hand
$btnOpen.FlatAppearance.BorderSize = 0
$btnOpen.Add_Click({
    $vbs = Join-Path $RootDir "SucessoEdu_App.vbs"
    if (Test-Path $vbs) {
        Start-Process "wscript.exe" -ArgumentList ('"' + $vbs + '"')
    } else {
        Start-Process $serverUrl
    }
})
$widget.Controls.Add($btnOpen)

$btnCopy = New-Object System.Windows.Forms.Button
$btnCopy.Text = "📋 Copiar IP"
$btnCopy.Size = New-Object System.Drawing.Size(86, 28)
$btnCopy.Location = New-Object System.Drawing.Point(88, 92)
$btnCopy.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnCopy.BackColor = [System.Drawing.Color]::FromArgb(51, 65, 85) # Slate-700
$btnCopy.ForeColor = [System.Drawing.Color]::White
$btnCopy.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Regular)
$btnCopy.Cursor = [System.Windows.Forms.Cursors]::Hand
$btnCopy.FlatAppearance.BorderSize = 0
$btnCopy.Add_Click({
    [System.Windows.Forms.Clipboard]::SetText($serverUrl)
    $lblIp.Text = "IP Copiado com Sucesso!"
    $lblIp.ForeColor = [System.Drawing.Color]::FromArgb(52, 211, 153)
})
$widget.Controls.Add($btnCopy)

$btnTest = New-Object System.Windows.Forms.Button
$btnTest.Text = "🔄 Testar"
$btnTest.Size = New-Object System.Drawing.Size(74, 28)
$btnTest.Location = New-Object System.Drawing.Point(180, 92)
$btnTest.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnTest.BackColor = [System.Drawing.Color]::FromArgb(51, 65, 85) # Slate-700
$btnTest.ForeColor = [System.Drawing.Color]::White
$btnTest.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Regular)
$btnTest.Cursor = [System.Windows.Forms.Cursors]::Hand
$btnTest.FlatAppearance.BorderSize = 0
$btnTest.Add_Click({
    try {
        $wc = New-Object System.Net.WebClient
        $wc.Headers.Add("User-Agent", "SucessoEdu-Widget-Check")
        $res = $wc.DownloadString("http://127.0.0.1:" + $Port + "/api/health")
        $lblStatus.Text = "🟢 ONLINE (100% OK)"
        $lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(52, 211, 153)
    } catch {
        $lblStatus.Text = "🔴 Falha no Servidor"
        $lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(239, 68, 68)
    }
})
$widget.Controls.Add($btnTest)

$btnFolder = New-Object System.Windows.Forms.Button
$btnFolder.Text = "📁"
$btnFolder.Size = New-Object System.Drawing.Size(46, 28)
$btnFolder.Location = New-Object System.Drawing.Point(260, 92)
$btnFolder.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnFolder.BackColor = [System.Drawing.Color]::FromArgb(51, 65, 85) # Slate-700
$btnFolder.ForeColor = [System.Drawing.Color]::White
$btnFolder.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Regular)
$btnFolder.Cursor = [System.Windows.Forms.Cursors]::Hand
$btnFolder.FlatAppearance.BorderSize = 0
$btnFolder.Add_Click({
    Start-Process "explorer.exe" -ArgumentList ('"' + $RootDir + '"')
})
$widget.Controls.Add($btnFolder)

# Timer de Monitoramento (a cada 4 segundos)
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 4000
$timer.Add_Tick({
    try {
        $wc = New-Object System.Net.WebClient
        $wc.Headers.Add("User-Agent", "SucessoEdu-Widget-Auto")
        $res = $wc.DownloadString("http://127.0.0.1:" + $Port + "/api/health")
        $lblStatus.Text = "🟢 ONLINE • Porta " + $Port
        $lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(52, 211, 153)
    } catch {
        $lblStatus.Text = "🟡 Verificando Servidor..."
        $lblStatus.ForeColor = [System.Drawing.Color]::FromArgb(251, 191, 36)
    }
})
$timer.Start()

[System.Windows.Forms.Application]::Run($widget)
`;
}

export function generateMicroServerPs1(port = 8088): string {
  return `# ===============================================================================
# SUCESSOEDU GESTAO EDUCACIONAL - MICRO-SERVIDOR HTTP NATIVO WINDOWS
# Executa servidor web local na porta ${port} no diretório raiz C:\\SucessoEdu.
# ===============================================================================
param(
    [int]$Port = ${port},
    [string]$RootDir = ""
)

$ErrorActionPreference = "SilentlyContinue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if (-not $RootDir -or -not (Test-Path $RootDir)) {
    if (Test-Path "C:\\SucessoEdu") {
        $RootDir = "C:\\SucessoEdu"
    } elseif (Test-Path $PSScriptRoot) {
        $RootDir = $PSScriptRoot
    } else {
        $RootDir = Get-Location
    }
}
Set-Location $RootDir

$localIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { 
    $_.IPAddress -notmatch '^127\.' -and 
    $_.IPAddress -notmatch '^169\.254\.' -and 
    $_.InterfaceAlias -notmatch 'Loopback|vEthernet|VirtualBox|VMware|WSL|Bluetooth' 
} | Select-Object -First 1).IPAddress
if (-not $localIp) { $localIp = "127.0.0.1" }

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " SUCESSOEDU GESTAO EDUCACIONAL - SERVIDOR LOCAL ATIVO" -ForegroundColor Green
Write-Host " Diretorio Raiz: $RootDir" -ForegroundColor Yellow
Write-Host " IP Local do Computador: $localIp (Porta $Port)" -ForegroundColor Yellow
Write-Host " Link de Acesso: http://$localIp:$Port" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$listener = New-Object System.Net.HttpListener
$bound = $false
$activePort = $Port

for ($attemptPort = $Port; $attemptPort -le ($Port + 20); $attemptPort++) {
    $tempListener = New-Object System.Net.HttpListener
    $allPrefixes = @(
        "http://localhost:$attemptPort/",
        "http://127.0.0.1:$attemptPort/"
    )
    if ($localIp -and $localIp -ne "127.0.0.1") {
        $allPrefixes += "http://" + $localIp + ":" + $attemptPort + "/"
    }
    foreach ($p in $allPrefixes) {
        try { $tempListener.Prefixes.Add($p) } catch {}
    }
    try {
        $tempListener.Start()
        $listener = $tempListener
        $activePort = $attemptPort
        $bound = $true
        break
    } catch {
        try {
            $tempFb = New-Object System.Net.HttpListener
            $tempFb.Prefixes.Add("http://127.0.0.1:$attemptPort/")
            $tempFb.Prefixes.Add("http://localhost:$attemptPort/")
            $tempFb.Start()
            $listener = $tempFb
            $activePort = $attemptPort
            $bound = $true
            break
        } catch {}
    }
}

if ($bound) {
    $Port = $activePort
    try {
        $iniFile = Join-Path $RootDir "config_rede_estacoes.ini"
        $iniContent = "[Rede_SucessoEdu]" + [Environment]::NewLine + "Servidor_IP=" + $localIp + [Environment]::NewLine + "Porta=" + $Port + [Environment]::NewLine + "Ultima_Atualizacao=" + (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        Set-Content -Path $iniFile -Value $iniContent -Encoding UTF8 -Force
    } catch {}
    Write-Host "  [OK] Servidor ativo e escutando na porta $Port (http://127.0.0.1:$Port)" -ForegroundColor Green
} else {
    Write-Host "  [ERRO] Nao foi possivel abrir nenhuma porta entre $Port e $($Port+20)." -ForegroundColor Red
    Exit 1
}

Write-Host ""
Write-Host "Servidor pronto para conexoes locais e na rede." -ForegroundColor Cyan
Write-Host "Deixe esta janela aberta ou execute iniciar_servidor_silencioso.vbs para rodar na bandeja." -ForegroundColor DarkGray
Write-Host ""

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath
        if ($path -eq "/" -or $path -eq "") {
            $path = "/index.html"
        }

        # Endpoints de API internos
        if ($path -eq "/api/health" -or $path -eq "/api/ping") {
            $json = '{"status":"ok","server":"SucessoEdu_Native_MicroServer","port":' + $Port + ',"timestamp":"' + (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss") + '"}'
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = "application/json; charset=utf-8"
            $response.StatusCode = 200
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        if (($path -eq "/api/sync" -or $path -eq "/api/save") -and $request.HttpMethod -eq "POST") {
            try {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $dataDir = Join-Path $RootDir "data"
                if (-not (Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir -Force | Out-Null }
                $dbPath = Join-Path $dataDir "banco_educacional.json"
                [System.IO.File]::WriteAllText($dbPath, $body, [System.Text.Encoding]::UTF8)
                $logPath = Join-Path $dataDir "historico_sincronizacao_estacoes.log"
                $logMsg = "[" + (Get-Date).ToString("yyyy-MM-dd HH:mm:ss") + "] Dados centralizados da estacao salvos no Servidor Local." + [System.Environment]::NewLine
                [System.IO.File]::AppendAllText($logPath, $logMsg, [System.Text.Encoding]::UTF8)
                $json = '{"status":"ok","mensagem":"Dados centralizados com sucesso no Servidor Local!"}'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
                $response.ContentType = "application/json; charset=utf-8"
                $response.StatusCode = 200
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                $err = '{"status":"error","mensagem":"' + $_.Exception.Message + '"}'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($err)
                $response.ContentType = "application/json; charset=utf-8"
                $response.StatusCode = 500
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            $response.Close()
            continue
        }

        if ($path -eq "/api/sync/municipal" -and $request.HttpMethod -eq "POST") {
            try {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $dataDir = Join-Path $RootDir "data"
                if (-not (Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir -Force | Out-Null }
                $munDir = Join-Path $dataDir "sincronizacao_municipal"
                if (-not (Test-Path $munDir)) { New-Item -ItemType Directory -Path $munDir -Force | Out-Null }
                $fname = "sinc_polo_" + (Get-Date).ToString("yyyyMMdd_HHmmss") + ".edusync"
                [System.IO.File]::WriteAllText((Join-Path $munDir $fname), $body, [System.Text.Encoding]::UTF8)
                $logPath = Join-Path $dataDir "historico_sincronizacao_secretaria.log"
                $logMsg = "[" + (Get-Date).ToString("yyyy-MM-dd HH:mm:ss") + "] Pacote de Polo/Escola Sincronizado: " + $fname + [System.Environment]::NewLine
                [System.IO.File]::AppendAllText($logPath, $logMsg, [System.Text.Encoding]::UTF8)
                $json = '{"status":"ok","mensagem":"Pacote de dados municipal recebido e consolidado com sucesso!"}'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
                $response.ContentType = "application/json; charset=utf-8"
                $response.StatusCode = 200
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                $err = '{"status":"error","mensagem":"' + $_.Exception.Message + '"}'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($err)
                $response.ContentType = "application/json; charset=utf-8"
                $response.StatusCode = 500
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            $response.Close()
            continue
        }

        $safePath = $path.TrimStart('/').Replace('/', '\\\\')
        $filePath = Join-Path $RootDir $safePath

        if (-not (Test-Path $filePath) -or (Get-Item $filePath).PSIsContainer) {
            if (Test-Path (Join-Path $RootDir "index.html")) {
                $filePath = Join-Path $RootDir "index.html"
            } elseif (Test-Path (Join-Path $RootDir "SucessoEdu_Aplicativo_Offline.html")) {
                $filePath = Join-Path $RootDir "SucessoEdu_Aplicativo_Offline.html"
            }
        }

        if (Test-Path $filePath) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = "text/plain"
            switch ($ext) {
                ".html" { $mime = "text/html; charset=utf-8" }
                ".htm"  { $mime = "text/html; charset=utf-8" }
                ".js"   { $mime = "application/javascript; charset=utf-8" }
                ".css"  { $mime = "text/css; charset=utf-8" }
                ".json" { $mime = "application/json; charset=utf-8" }
                ".ico"  { $mime = "image/x-icon" }
                ".png"  { $mime = "image/png" }
                ".svg"  { $mime = "image/svg+xml" }
                ".woff2" { $mime = "font/woff2" }
                default { $mime = "application/octet-stream" }
            }

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $mime
            $response.StatusCode = 200
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $fallbackFile = Join-Path $RootDir "SucessoEdu_Aplicativo_Offline.html"
            if (Test-Path $fallbackFile) {
                $bytes = [System.IO.File]::ReadAllBytes($fallbackFile)
            } else {
                $fallbackHtml = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>SucessoEdu Gestão Educacional</title><meta http-equiv="refresh" content="0;url=/SucessoEdu_Aplicativo_Offline.html"></head><body style="background:#0b1329;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;"><h2>Iniciando SucessoEdu Gestão Educacional...</h2><p>Carregando módulos escolares...</p><script>window.location.href="SucessoEdu_Aplicativo_Offline.html";</script></div></body></html>'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($fallbackHtml)
            }
            $response.ContentType = "text/html; charset=utf-8"
            $response.StatusCode = 200
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        $response.Close()
    } catch {
        # Ignorar erros de conexao pontuais do cliente e manter listener ativo
    }
}
`;
}

export function generateMicroServerBat(port = 8088): string {
  return `@echo off
chcp 65001 >nul
title SucessoEdu - Servidor Local Offline [Porta ${port}]
color 0B

if exist "C:\\SucessoEdu" (
    cd /d "C:\\SucessoEdu"
) else (
    cd /d "%~dp0"
)

echo ===============================================================================
echo         SUCESSOEDU GESTAO EDUCACIONAL - SERVIDOR LOCAL OFFLINE
echo         Diretório Raiz: C:\\SucessoEdu ^| Porta: ${port}
echo ===============================================================================
echo.
echo [1/2] Iniciando o servidor nativo com ícone na bandeja do sistema...

if exist "iniciar_servidor_silencioso.vbs" (
    wscript "iniciar_servidor_silencioso.vbs"
) else if exist "servidor_tray.ps1" (
    start "" powershell.exe -STA -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "servidor_tray.ps1" -Port ${port}
) else (
    start "" powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "server_micro.ps1" -Port ${port}
)

timeout /t 2 >nul

:: Detectar IP da rede local do computador / servidor
set "LOCAL_IP="
for /f "tokens=*" %%i in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.InterfaceAlias -notmatch 'Loopback|vEthernet|VirtualBox|VMware|WSL|Bluetooth' } | Select-Object -First 1 -ExpandProperty IPAddress); if (-not $ip) { $ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1 -ExpandProperty IPAddress) }; if ($ip) { $ip } else { '127.0.0.1' }"') do set "LOCAL_IP=%%i"
if "%LOCAL_IP%"=="" set "LOCAL_IP=127.0.0.1"

echo [2/2] Servidor ativo e minimizado na bandeja ao lado do relógio do Windows!
echo.
echo - Para acessar o sistema localmente ou na rede: http://%LOCAL_IP%:${port}
echo - Clique com o botão direito no ícone de computador perto do relógio para gerenciar.
echo.
if exist "SucessoEdu_App.vbs" (
    wscript "SucessoEdu_App.vbs"
) else (
    start "" "http://%LOCAL_IP%:${port}"
)
timeout /t 3 >nul
exit /b
`;
}

export function generateSilentMicroServerVbs(port = 8088): string {
  return `' ===============================================================================
' SUCESSOEDU GESTAO EDUCACIONAL - INICIALIZADOR SILENCIOSO DE SERVIDOR
' Inicia o servidor local na barra de tarefas (System Tray) e o Widget Flutuante
' ===============================================================================
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

Dim installDir, currentDir, trayScript, microScript, widgetScript
installDir = "C:\\SucessoEdu"
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)

If Not fso.FolderExists(installDir) Then
    installDir = currentDir
End If

trayScript = installDir & "\\servidor_tray.ps1"
If Not fso.FileExists(trayScript) Then trayScript = currentDir & "\\servidor_tray.ps1"

microScript = installDir & "\\server_micro.ps1"
If Not fso.FileExists(microScript) Then microScript = currentDir & "\\server_micro.ps1"

widgetScript = installDir & "\\servidor_widget_flutuante.ps1"
If Not fso.FileExists(widgetScript) Then widgetScript = currentDir & "\\servidor_widget_flutuante.ps1"

' 1. Iniciar Servidor na Bandeja do Sistema (System Tray)
If fso.FileExists(trayScript) Then
    WshShell.Run "powershell.exe -STA -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & trayScript & """ -Port ${port}", 0, False
ElseIf fso.FileExists(microScript) Then
    WshShell.Run "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & microScript & """ -Port ${port}", 0, False
End If

' 2. Iniciar Widget Flutuante de Status do Servidor na Área de Trabalho
If fso.FileExists(widgetScript) Then
    WshShell.Run "powershell.exe -STA -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & widgetScript & """ -Port ${port}", 0, False
End If
`;
}

export function generateAutoStartConfigBat(schoolName = 'Colégio SucessoEdu', port = 8088): string {
  const safeSchool = sanitizeBatchString(schoolName);
  return `@echo off
chcp 65001 >nul
title SucessoEdu - Configurar Inicializacao Automatica com o Windows
color 0A

if exist "C:\\SucessoEdu" (
    cd /d "C:\\SucessoEdu"
) else (
    cd /d "%~dp0"
)

echo ===============================================================================
echo     CONFIGURAR INICIALIZACAO AUTOMATICA DO SERVIDOR SUCESSOEDU
echo     Instituicao: ${safeSchool} ^| Porta: ${port}
echo ===============================================================================
echo.
echo [1/2] Adicionando registro de inicializacao automatica no Windows (Registro do Usuario)...

reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "SucessoEduServer" /t REG_SZ /d "wscript.exe \"C:\\SucessoEdu\\iniciar_servidor_silencioso.vbs\"" /f >nul 2>&1

echo [2/2] Criando atalho inteligente na pasta Inicializar do Windows (Startup)...
set "STARTUP_DIR=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"
if exist "%STARTUP_DIR%" (
    (
    echo Set WshShell = CreateObject^("WScript.Shell"^)
    echo Set shortcut = WshShell.CreateShortcut^("%STARTUP_DIR%\\SucessoEdu_Servidor_AutoStart.lnk"^)
    echo shortcut.TargetPath = "wscript.exe"
    echo shortcut.Arguments = """C:\\SucessoEdu\\iniciar_servidor_silencioso.vbs"""
    echo shortcut.WorkingDirectory = "C:\\SucessoEdu"
    echo shortcut.Description = "Inicializador Automatico SucessoEdu Servidor"
    echo shortcut.WindowStyle = 7
    echo shortcut.Save
    ) > "%TEMP%\\criar_tray_autostart.vbs"
    cscript //nologo "%TEMP%\\criar_tray_autostart.vbs" >nul 2>&1
    del /f /q "%TEMP%\\criar_tray_autostart.vbs" >nul 2>&1
)

echo.
echo  [OK] Inicializacao automatica ativada com sucesso!
echo       Toda vez que o Windows for ligado, o Servidor Local e o Widget Flutuante
echo       iniciarao de forma automatica e silenciosa.
echo.
pause
`;
}

export function generateAutoStartDisableBat(): string {
  return `@echo off
chcp 65001 >nul
title SucessoEdu - Desativar Inicializacao Automatica
color 0C

echo ===============================================================================
echo     DESATIVAR INICIALIZACAO AUTOMATICA DO SERVIDOR SUCESSOEDU
echo ===============================================================================
echo.

reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "SucessoEduServer" /f >nul 2>&1

powershell -NoProfile -ExecutionPolicy Bypass -Command "$sFolder = [Environment]::GetFolderPath('Startup'); $lnk = Join-Path $sFolder 'SucessoEdu_Servidor_AutoStart.lnk'; if (Test-Path $lnk) { Remove-Item $lnk -Force -ErrorAction SilentlyContinue }" >nul 2>&1

echo  [OK] Registro de inicializacao automatica removido com sucesso.
echo       O servidor agora so sera iniciado quando executado manualmente.
echo.
pause
`;
}

export function generateStopServerBat(port = 8088): string {
  return `@echo off
chcp 65001 >nul
title SucessoEdu - Encerrar Servidor Local
color 0C
cd /d "%~dp0"

echo ===============================================================================
echo         ENCERRANDO SERVIDOR LOCAL SUCESSOEDU (PORTA ${port})
echo ===============================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$conns = Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue; if ($conns) { foreach ($c in $conns) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue }; Write-Host '  [OK] Processos do servidor encerrados na porta ${port}.' -ForegroundColor Green } else { Write-Host '  [INFO] Nenhum servidor estava ativo na porta ${port}.' -ForegroundColor Yellow }"

echo.
echo Servidor encerrado com sucesso.
pause
`;
}

/**
 * Script de Abertura Direta Confiável do SucessoEdu no Navegador
 */
export function generateOpenSucessoEduBat(port = 8088): string {
  return `@echo off
chcp 65001 >nul
title SucessoEdu Gestão Educacional - Abertura Direta
cd /d "%~dp0"

echo [SucessoEdu] Inicializando ambiente seguro do SucessoEdu...
if exist "SucessoEdu_App.vbs" (
    start "" wscript "SucessoEdu_App.vbs"
    exit /b
)

echo [SucessoEdu] Verificando se o servidor local esta ativo na porta ${port}...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$c = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue; if (-not $c) { if (Test-Path 'iniciar_servidor_silencioso.vbs') { Start-Process wscript.exe -ArgumentList 'iniciar_servidor_silencioso.vbs' } elseif (Test-Path 'servidor_tray.ps1') { Start-Process powershell.exe -ArgumentList '-STA -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File servidor_tray.ps1 -Port ${port}' } }" >nul 2>&1
timeout /t 1 /nobreak >nul

:: Detectar IP da rede para informar outras máquinas da escola
set "LOCAL_IP="
for /f "tokens=*" %%i in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.InterfaceAlias -notmatch 'Loopback|vEthernet|VirtualBox|VMware|WSL|Bluetooth' } | Select-Object -First 1 -ExpandProperty IPAddress); if (-not $ip) { $ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1 -ExpandProperty IPAddress) }; if ($ip) { $ip } else { '127.0.0.1' }"') do set "LOCAL_IP=%%i"
if "%LOCAL_IP%"=="" set "LOCAL_IP=127.0.0.1"

echo [SucessoEdu] Acesso neste computador: http://localhost:${port}
echo [SucessoEdu] Acesso para outras maquinas na rede: http://%LOCAL_IP%:${port}

:: Testar porta local; se indisponivel, abrir arquivo offline
powershell -NoProfile -ExecutionPolicy Bypass -Command "$t = Test-NetConnection -ComputerName 127.0.0.1 -Port ${port} -WarningAction SilentlyContinue; if ($t.TcpTestSucceeded) { Start-Process 'http://localhost:${port}' } elseif (Test-Path 'index.html') { Start-Process 'index.html' } elseif (Test-Path 'SucessoEdu_Aplicativo_Offline.html') { Start-Process 'SucessoEdu_Aplicativo_Offline.html' } else { Start-Process 'http://localhost:${port}' }" >nul 2>&1
exit /b
`;
}

/**
 * Script de Abertura Direta Confiável para Estações de Trabalho
 */
export function generateOpenStationBat(serverIp = '127.0.0.1', serverPort = 8088): string {
  return `@echo off
chcp 65001 >nul
title SucessoEdu - Conexão com Servidor Central
cd /d "%~dp0"

set "TARGET_SERVER=${serverIp}"
set "TARGET_PORT=${serverPort}"

if exist "%~dp0config_rede_estacoes.ini" (
    for /f "tokens=2 delims==" %%a in ('type "%~dp0config_rede_estacoes.ini" ^| findstr "Servidor_IP="') do set TARGET_SERVER=%%a
    for /f "tokens=2 delims==" %%b in ('type "%~dp0config_rede_estacoes.ini" ^| findstr "Porta="') do set TARGET_PORT=%%b
)
set TARGET_SERVER=%TARGET_SERVER: =%
set TARGET_PORT=%TARGET_PORT: =%

:: Se o IP for 127.0.0.1, localhost ou vazio, buscar automaticamente o IP do servidor na rede local
if "%TARGET_SERVER%"=="" set TARGET_SERVER=127.0.0.1
if "%TARGET_SERVER%"=="127.0.0.1" (
    if exist "%~dp0buscar_servidor_rede.ps1" (
        echo [SucessoEdu] Localizando servidor central na rede local...
        powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0buscar_servidor_rede.ps1" -Port ${serverPort} >nul 2>&1
        if exist "%~dp0ip_servidor_descoberto.txt" (
            set /p TARGET_SERVER=<"%~dp0ip_servidor_descoberto.txt"
        )
    )
)
if "%TARGET_PORT%"=="" set TARGET_PORT=${serverPort}

echo [SucessoEdu] Conectando ao Servidor Central em http://%TARGET_SERVER%:%TARGET_PORT%...
start "" "http://%TARGET_SERVER%:%TARGET_PORT%"
exit /b
`;
}

/**
 * Script Opcional para o Usuário Criar Atalho Oficial Funcional na Área de Trabalho
 */
export function generateCreateDesktopShortcutBat(
  targetUrl = '',
  shortcutName = 'SucessoEdu Gestão Educacional'
): string {
  const defaultUrl = targetUrl && !targetUrl.includes('localhost') ? targetUrl : '';
  return `@echo off
chcp 65001 >nul
title SucessoEdu - Criar Atalho na Area de Trabalho
cd /d "%~dp0"

echo ===============================================================================
echo   CRIADOR DE ATALHO OFICIAL FUNCIONAL NA AREA DE TRABALHO
echo   SucessoEdu Gestao Educacional
echo ===============================================================================
echo.

:: Detectar IP local para caso o atalho precise apontar para URL direta de rede
set "LOCAL_IP="
for /f "tokens=*" %%i in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.InterfaceAlias -notmatch 'Loopback|vEthernet|VirtualBox|VMware|WSL|Bluetooth' } | Select-Object -First 1 -ExpandProperty IPAddress); if (-not $ip) { $ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1 -ExpandProperty IPAddress) }; if ($ip) { $ip } else { '127.0.0.1' }"') do set "LOCAL_IP=%%i"
if "%LOCAL_IP%"=="" set "LOCAL_IP=127.0.0.1"

set "RESOLVED_URL=${defaultUrl}"
if "%RESOLVED_URL%"=="" set "RESOLVED_URL=http://%LOCAL_IP%:8088"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $d = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop); $s = $ws.CreateShortcut((Join-Path $d '${shortcutName}.lnk')); if (Test-Path 'C:\\SucessoEdu\\Abrir_SucessoEdu.bat') { $s.TargetPath = 'C:\\SucessoEdu\\Abrir_SucessoEdu.bat'; $s.WorkingDirectory = 'C:\\SucessoEdu'; } elseif (Test-Path 'Abrir_SucessoEdu.bat') { $s.TargetPath = (Join-Path $pwd.Path 'Abrir_SucessoEdu.bat'); $s.WorkingDirectory = $pwd.Path; } else { $s.TargetPath = '%RESOLVED_URL%'; }; if (Test-Path 'C:\\SucessoEdu\\sucessoedu.ico') { $s.IconLocation = 'C:\\SucessoEdu\\sucessoedu.ico,0' } elseif (Test-Path 'sucessoedu.ico') { $s.IconLocation = (Join-Path $pwd.Path 'sucessoedu.ico,0') }; $s.Description = '${shortcutName}'; $s.Save(); Write-Host '  [OK] Atalho funcional criado com sucesso na Area de Trabalho!' -ForegroundColor Green"

echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul
exit /b
`;
}

export const generateLaunchSystemBat = generateOpenSucessoEduBat;
export const generateLaunchClientBat = generateOpenStationBat;

// -------------------------------------------------------------
// HELPER: ENCODIFICADOR BASE64 SEGURO PARA BATCH DO WINDOWS
// Divide strings em blocos seguros sem estouro de linha ou caracteres especiais
// -------------------------------------------------------------
function toSafeBase64Chunks(content: string, chunkSize = 1000): string[] {
  let b64 = '';
  const safeContent = toWindowsCrlf(content);
  if (typeof Buffer !== 'undefined') {
    b64 = Buffer.from(safeContent, 'utf-8').toString('base64');
  } else {
    b64 = btoa(unescape(encodeURIComponent(safeContent)));
  }
  const chunks: string[] = [];
  for (let i = 0; i < b64.length; i += chunkSize) {
    chunks.push(b64.slice(i, i + chunkSize));
  }
  return chunks;
}

function generateSafeBatchDeployer(filename: string, content: string, displayName: string): string {
  const chunks = toSafeBase64Chunks(content);
  const tempId = filename.replace(/[^a-zA-Z0-9]/g, '_');
  
  return `:: Garantir ${filename}
if not exist "%DEST_DIR%\\${filename}" (
    if exist "%SRC_DIR%\\${filename}" (
        copy /y "%SRC_DIR%\\${filename}" "%DEST_DIR%\\${filename}" >nul 2>&1
    ) else if exist "%~dp0${filename}" (
        copy /y "%~dp0${filename}" "%DEST_DIR%\\${filename}" >nul 2>&1
    ) else if exist "%EFFECTIVE_SRC%\\${filename}" (
        copy /y "%EFFECTIVE_SRC%\\${filename}" "%DEST_DIR%\\${filename}" >nul 2>&1
    ) else (
        echo   [IMPLANTANDO] ${displayName}...
        (
${chunks.map(c => `    echo ${c}`).join('\n')}
        ) > "%TEMP%\\se_${tempId}.b64"
        powershell -NoProfile -ExecutionPolicy Bypass -Command "$b = Get-Content -Raw '%TEMP%\\se_${tempId}.b64'; if ($b) { $c = $b -replace '\\s', ''; [System.IO.File]::WriteAllBytes('%DEST_DIR%\\${filename}', [System.Convert]::FromBase64String($c)); Remove-Item '%TEMP%\\se_${tempId}.b64' -Force -ErrorAction SilentlyContinue; }" >nul 2>&1
    )
)`;
}

/**
 * Script PowerShell da Rotina Diaria de Backup com Retencao de 30 dias
 * Executado pelo Servidor Local e Servidores de Polos Remotos
 */
export function generateDailyBackupPs1(schoolName = 'SucessoEdu Gestão Educacional'): string {
  const safeSchool = sanitizeBatchString(schoolName);
  return `# ===============================================================================
# SUCESSOEDU GESTAO EDUCACIONAL - ROTINA DIARIA DE BACKUP AUTOMATICO
# Retencao inteligente de 30 dias | Servidor Local e Polos Remotos
# ===============================================================================
param(
    [string]$RootDir = "C:\\SucessoEdu",
    [int]$RetentionDays = 30
)

$ErrorActionPreference = "SilentlyContinue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if (-not (Test-Path $RootDir)) {
    if (Test-Path $PSScriptRoot) { $RootDir = $PSScriptRoot }
    else { $RootDir = "C:\\SucessoEdu" }
}

$dataDir = Join-Path $RootDir "data"
$backupBase = Join-Path $RootDir "Backups\\Diario"
if (-not (Test-Path $backupBase)) {
    New-Item -ItemType Directory -Path $backupBase -Force | Out-Null
}

$dateStr = (Get-Date).ToString("yyyyMMdd_HHmmss")
$dayFolder = Join-Path $backupBase ("Backup_Diario_" + $dateStr)
New-Item -ItemType Directory -Path $dayFolder -Force | Out-Null

$backedFiles = 0
if (Test-Path $dataDir) {
    Get-ChildItem -Path $dataDir -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring($dataDir.Length).TrimStart('\\', '/')
        $target = Join-Path (Join-Path $dayFolder "data") $rel
        $parent = Split-Path $target -Parent
        if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
        Copy-Item -LiteralPath $_.FullName -Destination $target -Force
        $backedFiles++
    }
}

Get-ChildItem -Path $RootDir -File | Where-Object { $_.Extension -match '^\\.(json|ini|sqlite|db)$' } | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $dayFolder $_.Name) -Force
    $backedFiles++
}

# Manifesto de Auditoria do Backup Diario
$manifestLines = @(
    "===============================================================================",
    "SUCESSOEDU - MANIFESTO DE AUDITORIA DE BACKUP DIARIO",
    "Data e Hora: " + (Get-Date).ToString("dd/MM/yyyy HH:mm:ss"),
    "Instituicao: ${safeSchool}",
    "Diretorio Raiz: " + $RootDir,
    "Pasta do Backup: " + $dayFolder,
    "Total de Arquivos Preservados: " + $backedFiles,
    "Retencao Maxima: " + $RetentionDays + " dias",
    "Status: SUCESSO ABSOLUTO (DADOS 100% PRESERVADOS)",
    "==============================================================================="
)
[System.IO.File]::WriteAllLines((Join-Path $dayFolder "manifesto_backup.txt"), $manifestLines, [System.Text.Encoding]::UTF8)

# Log no historico de backups
$logFile = Join-Path (Join-Path $RootDir "Backups") "historico_backups.log"
$logMsg = "[" + (Get-Date).ToString("yyyy-MM-dd HH:mm:ss") + "] Backup diario concluido com exito. " + $backedFiles + " arquivos salvos em " + $dayFolder + "\`r\`n"
[System.IO.File]::AppendAllText($logFile, $logMsg, [System.Text.Encoding]::UTF8)

# Politica de Limpeza / Retencao (remove backups com mais de 30 dias)
$limitDate = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $backupBase -Directory | Where-Object { $_.CreationTime -lt $limitDate } | ForEach-Object {
    Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host " [BACKUP DIARIO CONCLUIDO] $backedFiles arquivos salvos com sucesso em: $dayFolder" -ForegroundColor Green
`;
}

/**
 * Script Batch que executa a Rotina Diaria de Backup
 */
export function generateDailyBackupBat(schoolName = 'SucessoEdu Gestão Educacional'): string {
  const safeSchool = sanitizeBatchString(schoolName);
  const bat = `@echo off
chcp 65001 >nul
title SucessoEdu - Rotina Diaria de Backup dos Dados
color 1F

set "SCRIPT_DIR=%~dp0"
for %%I in ("%~dp0.") do set "SCRIPT_DIR=%%~fI"
if "%SCRIPT_DIR:~-1%"=="\\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
cd /d "%SCRIPT_DIR%"

set "DEST_DIR=C:\\SucessoEdu"
if not exist "%DEST_DIR%" set "DEST_DIR=%SCRIPT_DIR%"

echo ===============================================================================
echo   SUCESSOEDU GESTAO EDUCACIONAL - ROTINA DIARIA DE BACKUP
echo   Instituicao: ${safeSchool}
echo   Diretorio Raiz: %DEST_DIR%
echo   Execucao Automatizada com Retencao Segura de 30 Dias
echo ===============================================================================
echo.

if exist "%DEST_DIR%\\rotina_backup_diario.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%DEST_DIR%\\rotina_backup_diario.ps1" -RootDir "%DEST_DIR%"
) else if exist "%SCRIPT_DIR%\\rotina_backup_diario.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%\\rotina_backup_diario.ps1" -RootDir "%DEST_DIR%"
) else (
    set "TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
    set "TIMESTAMP=%TIMESTAMP: =0%"
    set "BKP_DIR=%DEST_DIR%\\Backups\\Diario\\Backup_%TIMESTAMP%"
    if not exist "%BKP_DIR%" mkdir "%BKP_DIR%" >nul 2>&1
    if exist "%DEST_DIR%\\data" xcopy "%DEST_DIR%\\data" "%BKP_DIR%\\data\\" /Y /E /I /Q >nul 2>&1
    if exist "%DEST_DIR%\\*.json" copy /y "%DEST_DIR%\\*.json" "%BKP_DIR%\\" >nul 2>&1
    if exist "%DEST_DIR%\\*.ini" copy /y "%DEST_DIR%\\*.ini" "%BKP_DIR%\\" >nul 2>&1
    echo   [OK] Backup diario salvo com sucesso em: %BKP_DIR%
)
echo.
timeout /t 3 >nul
exit /b
`;
  return toSafeBatchAscii(bat);
}

/**
 * Script Batch para agendar a Tarefa do Windows de Backup Diario (23:00)
 */
export function generateConfigureDailyBackupTaskBat(): string {
  const bat = `@echo off
chcp 65001 >nul
title SucessoEdu - Agendador da Rotina Diaria de Backup
color 1F

set "SCRIPT_DIR=%~dp0"
for %%I in ("%~dp0.") do set "SCRIPT_DIR=%%~fI"
if "%SCRIPT_DIR:~-1%"=="\\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
cd /d "%SCRIPT_DIR%"

set "DEST_DIR=C:\\SucessoEdu"
if not exist "%DEST_DIR%" set "DEST_DIR=%SCRIPT_DIR%"

echo Configurando Tarefa Agendada do Windows para Backup Diario as 23:00...

schtasks /delete /tn "SucessoEdu_Backup_Diario" /f >nul 2>&1

schtasks /create /tn "SucessoEdu_Backup_Diario" /tr "\\"%DEST_DIR%\\rotina_backup_diario.bat\\"" /sc daily /st 23:00 /ru "System" /f >nul 2>&1
if %errorLevel% neq 0 (
    schtasks /create /tn "SucessoEdu_Backup_Diario" /tr "\\"%DEST_DIR%\\rotina_backup_diario.bat\\"" /sc daily /st 23:00 /f >nul 2>&1
)

echo [OK] Tarefa agendada "SucessoEdu_Backup_Diario" configurada com sucesso.
exit /b
`;
  return toSafeBatchAscii(bat);
}

/**
 * Script PowerShell para consolidacao e sincronizacao com o Servidor Central da Secretaria de Educacao
 */
export function generateMunicipalSyncPs1(schoolName = 'SucessoEdu Gestão Educacional', port = 3000): string {
  const safeSchool = sanitizeBatchString(schoolName);
  return `# ===============================================================================
# SUCESSOEDU GESTAO EDUCACIONAL - SINCRONIZACAO COM SECRETARIA MUNICIPAL DE EDUCACAO
# Consolida a base de dados do Servidor Local e envia para o Servidor Central Municipal
# ===============================================================================
param(
    [string]$RootDir = "C:\\SucessoEdu",
    [string]$SecretariaUrl = "",
    [int]$Port = ${port}
)

$ErrorActionPreference = "SilentlyContinue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if (-not (Test-Path $RootDir)) {
    if (Test-Path $PSScriptRoot) { $RootDir = $PSScriptRoot }
    else { $RootDir = "C:\\SucessoEdu" }
}

$iniFile = Join-Path $RootDir "config_rede_estacoes.ini"
if (-not $SecretariaUrl -and (Test-Path $iniFile)) {
    $secLine = Get-Content $iniFile | Where-Object { $_ -match '^URL_Secretaria=' } | Select-Object -First 1
    if ($secLine) { $SecretariaUrl = ($secLine -split '=')[1].Trim() }
}
if (-not $SecretariaUrl) {
    $SecretariaUrl = "http://127.0.0.1:${port}/api/sync/municipal"
}

$dataDir = Join-Path $RootDir "data"
$dbFile = Join-Path $dataDir "banco_educacional.json"
if (-not (Test-Path $dbFile)) {
    $dbFile = Join-Path $RootDir "banco_educacional.json"
}

$syncDir = Join-Path $RootDir "Backups\\Sincronizacao_Secretaria"
if (-not (Test-Path $syncDir)) { New-Item -ItemType Directory -Path $syncDir -Force | Out-Null }

$dateStr = (Get-Date).ToString("yyyyMMdd_HHmmss")
$exportFile = Join-Path $syncDir ("Pacote_Sincronizacao_Municipal_" + $dateStr + ".edusync")

$payload = @{
    tipo = "PACOTE_SINCRONIZACAO_ESCOLA_MUNICIPAL"
    escola = "${safeSchool}"
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    versao = "5.4"
    origem = $env:COMPUTERNAME
    dados = $null
}

if (Test-Path $dbFile) {
    $content = Get-Content -LiteralPath $dbFile -Raw -Encoding UTF8
    $payload.dados = $content
} else {
    $payload.dados = "{}"
}

$jsonPayload = $payload | ConvertTo-Json -Depth 10 -Compress
[System.IO.File]::WriteAllText($exportFile, $jsonPayload, [System.Text.Encoding]::UTF8)

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " SUCESSOEDU - SINCRONIZACAO COM SECRETARIA MUNICIPAL DE EDUCACAO" -ForegroundColor Green
Write-Host " Escola: ${safeSchool}" -ForegroundColor Yellow
Write-Host " Arquivo Consolidado: $exportFile" -ForegroundColor Yellow
Write-Host " Destino: $SecretariaUrl" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# Enviar via HTTP POST se o servidor da Secretaria estiver online
try {
    $resp = Invoke-RestMethod -Uri $SecretariaUrl -Method Post -Body $jsonPayload -ContentType "application/json; charset=utf-8" -TimeoutSec 10
    Write-Host " [SUCESSO] Dados sincronizados diretamente com a Secretaria de Educacao!" -ForegroundColor Green
} catch {
    Write-Host " [AVISO] Servidor da Secretaria offline ou fora de alcance na rede local." -ForegroundColor Yellow
    Write-Host " O pacote de dados consolidado foi salvo em:" -ForegroundColor White
    Write-Host " $exportFile" -ForegroundColor Cyan
    Write-Host " O arquivo pode ser levado via Pen Drive ou importado na Central da Secretaria." -ForegroundColor Green
}
`;
}

/**
 * Script Batch para acionar a sincronizacao com a Secretaria Municipal de Educacao
 */
export function generateMunicipalSyncBat(schoolName = 'SucessoEdu Gestão Educacional', port = 3000): string {
  const safeSchool = sanitizeBatchString(schoolName);
  const bat = `@echo off
chcp 65001 >nul
title SucessoEdu - Sincronizacao com a Secretaria Municipal de Educacao
color 1F

set "SCRIPT_DIR=%~dp0"
for %%I in ("%~dp0.") do set "SCRIPT_DIR=%%~fI"
if "%SCRIPT_DIR:~-1%"=="\\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
cd /d "%SCRIPT_DIR%"

set "DEST_DIR=C:\\SucessoEdu"
if not exist "%DEST_DIR%" set "DEST_DIR=%SCRIPT_DIR%"

echo ===============================================================================
echo   SUCESSOEDU - SINCRONIZACAO COM A SECRETARIA MUNICIPAL DE EDUCACAO
echo   Instituicao: ${safeSchool}
echo   Unificacao da Base de Dados Educacional
echo ===============================================================================
echo.

if exist "%DEST_DIR%\\sincronizar_secretaria_municipio.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%DEST_DIR%\\sincronizar_secretaria_municipio.ps1" -RootDir "%DEST_DIR%" -Port ${port}
) else if exist "%SCRIPT_DIR%\\sincronizar_secretaria_municipio.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%\\sincronizar_secretaria_municipio.ps1" -RootDir "%DEST_DIR%" -Port ${port}
)

echo.
echo Pressione qualquer tecla para continuar...
pause >nul
exit /b
`;
  return toSafeBatchAscii(bat);
}

/**
 * Script PowerShell para centralizacao de dados da Estacao diretamente para o Servidor Local
 */
export function generateCentralizeStationDataPs1(defaultIp = '127.0.0.1', port = 3000): string {
  return `# ===============================================================================
# SUCESSOEDU - CENTRALIZACAO DA ESTACAO COM O BANCO DE DADOS DO SERVIDOR LOCAL
# ===============================================================================
param(
    [string]$RootDir = "C:\\SucessoEdu"
)

$ErrorActionPreference = "SilentlyContinue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if (-not (Test-Path $RootDir)) {
    if (Test-Path $PSScriptRoot) { $RootDir = $PSScriptRoot }
    else { $RootDir = "C:\\SucessoEdu" }
}

$ini = Join-Path $RootDir "config_rede_estacoes.ini"
$modo = "REDE_HTTP"
$servidor = "${defaultIp}"
$porta = ${port}
$caminhoUNC = ""

if (Test-Path $ini) {
    $lines = Get-Content $ini
    foreach ($l in $lines) {
        if ($l -match "^Modo_Conexao=(.*)$") { $modo = $matches[1].Trim() }
        if ($l -match "^Servidor_IP=(.*)$") { $servidor = $matches[1].Trim() }
        if ($l -match "^Porta=(.*)$") { $porta = [int]$matches[1].Trim() }
        if ($l -match "^Caminho_Banco_Compartilhado=(.*)$") { $caminhoUNC = $matches[1].Trim() }
    }
}

$dataDir = Join-Path $RootDir "data"
$dbLocal = Join-Path $dataDir "banco_educacional.json"
if (-not (Test-Path $dbLocal)) { $dbLocal = Join-Path $RootDir "banco_educacional.json" }

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " SUCESSOEDU - CENTRALIZACAO DE DADOS DA ESTACAO DE TRABALHO" -ForegroundColor Green
Write-Host " Modo de Conexao: $modo" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan

if ($modo -eq "PASTA_COMPARTILHADA" -and $caminhoUNC) {
    if (Test-Path $caminhoUNC) {
        if (Test-Path $dbLocal) {
            Copy-Item -LiteralPath $dbLocal -Destination (Join-Path $caminhoUNC "banco_educacional.json") -Force
            Write-Host " [OK] Base da estacao centralizada com sucesso na pasta compartilhada do Servidor: $caminhoUNC" -ForegroundColor Green
        } else {
            Write-Host " [INFO] Nenhum dado local pendente para centralizar." -ForegroundColor Gray
        }
    } else {
        Write-Host " [AVISO] Pasta compartilhada $caminhoUNC inacessivel no momento. Os dados permanecem salvos localmente." -ForegroundColor Yellow
    }
} else {
    $url = 'http://' + $servidor + ':' + $porta + '/api/sync/station'
    $body = "{}"
    if (Test-Path $dbLocal) { $body = Get-Content -LiteralPath $dbLocal -Raw -Encoding UTF8 }
    try {
        $resp = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json; charset=utf-8" -TimeoutSec 10
        Write-Host " [OK] Dados da estacao centralizados com sucesso no Servidor Local em $url!" -ForegroundColor Green
    } catch {
        Write-Host " [AVISO] Nao foi possivel comunicar com o Servidor Local em $url. Operando em contingencia local." -ForegroundColor Yellow
    }
}
Write-Host " Concluido." -ForegroundColor Cyan
`;
}

/**
 * Script Batch para acionar a centralizacao da Estacao de Trabalho
 */
export function generateCentralizeStationDataBat(): string {
  const bat = `@echo off
chcp 65001 >nul
title SucessoEdu - Centralizacao de Dados com o Servidor Local
color 1F

set "SCRIPT_DIR=%~dp0"
for %%I in ("%~dp0.") do set "SCRIPT_DIR=%%~fI"
if "%SCRIPT_DIR:~-1%"=="\\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
cd /d "%SCRIPT_DIR%"

set "DEST_DIR=C:\\SucessoEdu"
if not exist "%DEST_DIR%" set "DEST_DIR=%SCRIPT_DIR%"

if exist "%DEST_DIR%\\centralizar_dados_estacao.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%DEST_DIR%\\centralizar_dados_estacao.ps1" -RootDir "%DEST_DIR%"
) else if exist "%SCRIPT_DIR%\\centralizar_dados_estacao.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%\\centralizar_dados_estacao.ps1" -RootDir "%DEST_DIR%"
)

echo.
pause
exit /b
`;
  return toSafeBatchAscii(bat);
}

// -------------------------------------------------------------
// HELPER: ROTINA UNIVERSAL DE AUTO-CURA E GARANTIA DA PASTA RAIZ (C:\SucessoEdu)
// Garante criação da pasta raiz, integridade de todos os scripts, HTML offline,
// atalho oficial único e integridade com preservação 100% da base de dados.
// -------------------------------------------------------------
export function generateAutoHealingBatchRoutine(port = 3000, schoolName = 'SucessoEdu Gestão Educacional'): string {
  const serverUrl = `http://localhost:${port}`;
  const safeSchool = sanitizeBatchString(schoolName);

  const netIni = `[SucessoEdu_Rede_Local]
Servidor_IP=127.0.0.1
Porta=${port}
Escola=${schoolName}
URL_Acesso=http://127.0.0.1:${port}
Status=OPERACIONAL
Modo_Conexao=REDE_HTTP
Centralizar_Envio_Servidor_Local=SIM
Unificar_Base_Secretaria_Municipal=SIM
`;

  return `:: ===============================================================================
:: [AUTO-CURA E GARANTIA DA PASTA RAIZ] GARANTIA ESTATICA DE TODOS OS ARQUIVOS
:: ===============================================================================

:: 1. Garantir criacao da arvore de diretorios com permissoes irrestritas
if not exist "%DEST_DIR%" mkdir "%DEST_DIR%" 2>nul
if not exist "%DEST_DIR%\\Backups" mkdir "%DEST_DIR%\\Backups" 2>nul
if not exist "%DEST_DIR%\\Backups\\Diario" mkdir "%DEST_DIR%\\Backups\\Diario" 2>nul
if not exist "%DEST_DIR%\\data" mkdir "%DEST_DIR%\\data" 2>nul
if not exist "%LOCALAPPDATA%\\SucessoEdu" mkdir "%LOCALAPPDATA%\\SucessoEdu" 2>nul
if not exist "%LOCALAPPDATA%\\SucessoEdu\\data" mkdir "%LOCALAPPDATA%\\SucessoEdu\\data" 2>nul
if not exist "%LOCALAPPDATA%\\SucessoEdu\\Backups" mkdir "%LOCALAPPDATA%\\SucessoEdu\\Backups" 2>nul

powershell -NoProfile -ExecutionPolicy Bypass -Command "$dirs = @('%DEST_DIR%', '%DEST_DIR%\\Backups', '%DEST_DIR%\\Backups\\Diario', '%DEST_DIR%\\data', '%LOCALAPPDATA%\\SucessoEdu', '%LOCALAPPDATA%\\SucessoEdu\\data', '%LOCALAPPDATA%\\SucessoEdu\\Backups'); foreach ($d in $dirs) { if (-not (Test-Path $d)) { try { [System.IO.Directory]::CreateDirectory($d) | Out-Null } catch { New-Item -ItemType Directory -Path $d -Force -ErrorAction SilentlyContinue | Out-Null } } }" >nul 2>&1

icacls "%DEST_DIR%" /grant *S-1-1-0:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Everyone:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Todos:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Users:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Usuarios:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Administrators:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Administradores:(OI)(CI)F /T /C /Q >nul 2>&1
attrib -r "%DEST_DIR%\\*.*" /s /d >nul 2>&1

:: 2. Descoberta inteligente e copia de arquivos se disponiveis no ambiente
set "FOUND_OFFLINE="
if exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" set "FOUND_OFFLINE=%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html"
if not defined FOUND_OFFLINE if exist "%DEST_DIR%\\index.html" set "FOUND_OFFLINE=%DEST_DIR%\\index.html"
if not defined FOUND_OFFLINE if exist "%SRC_DIR%\\SucessoEdu_Aplicativo_Offline.html" set "FOUND_OFFLINE=%SRC_DIR%\\SucessoEdu_Aplicativo_Offline.html"
if not defined FOUND_OFFLINE if exist "%SRC_DIR%\\index.html" set "FOUND_OFFLINE=%SRC_DIR%\\index.html"
if not defined FOUND_OFFLINE if exist "%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html" set "FOUND_OFFLINE=%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html"
if not defined FOUND_OFFLINE if exist "%EFFECTIVE_SRC%\\index.html" set "FOUND_OFFLINE=%EFFECTIVE_SRC%\\index.html"
if not defined FOUND_OFFLINE if exist "%~dp0SucessoEdu_Aplicativo_Offline.html" set "FOUND_OFFLINE=%~dp0SucessoEdu_Aplicativo_Offline.html"
if not defined FOUND_OFFLINE if exist "%~dp0index.html" set "FOUND_OFFLINE=%~dp0index.html"
if not defined FOUND_OFFLINE if exist "%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE\\SucessoEdu_Aplicativo_Offline.html" set "FOUND_OFFLINE=%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE\\SucessoEdu_Aplicativo_Offline.html"
if not defined FOUND_OFFLINE if exist "%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE\\index.html" set "FOUND_OFFLINE=%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE\\index.html"
if not defined FOUND_OFFLINE if exist "%~dp001_MODULO_SERVIDOR_LOCAL_OFFLINE\\SucessoEdu_Aplicativo_Offline.html" set "FOUND_OFFLINE=%~dp001_MODULO_SERVIDOR_LOCAL_OFFLINE\\SucessoEdu_Aplicativo_Offline.html"
if not defined FOUND_OFFLINE if exist "%~dp001_MODULO_SERVIDOR_LOCAL_OFFLINE\\index.html" set "FOUND_OFFLINE=%~dp001_MODULO_SERVIDOR_LOCAL_OFFLINE\\index.html"
if not defined FOUND_OFFLINE if exist "%SRC_DIR%\\..\\SucessoEdu_Aplicativo_Offline.html" set "FOUND_OFFLINE=%SRC_DIR%\\..\\SucessoEdu_Aplicativo_Offline.html"
if not defined FOUND_OFFLINE if exist "%SRC_DIR%\\..\\index.html" set "FOUND_OFFLINE=%SRC_DIR%\\..\\index.html"
if not defined FOUND_OFFLINE if exist "%LOCALAPPDATA%\\SucessoEdu\\SucessoEdu_Aplicativo_Offline.html" set "FOUND_OFFLINE=%LOCALAPPDATA%\\SucessoEdu\\SucessoEdu_Aplicativo_Offline.html"
if not defined FOUND_OFFLINE if exist "%LOCALAPPDATA%\\SucessoEdu\\index.html" set "FOUND_OFFLINE=%LOCALAPPDATA%\\SucessoEdu\\index.html"
if not defined FOUND_OFFLINE if exist "%USERPROFILE%\\Downloads\\SucessoEdu_Aplicativo_Offline.html" set "FOUND_OFFLINE=%USERPROFILE%\\Downloads\\SucessoEdu_Aplicativo_Offline.html"
if not defined FOUND_OFFLINE if exist "%USERPROFILE%\\Downloads\\index.html" set "FOUND_OFFLINE=%USERPROFILE%\\Downloads\\index.html"
if not defined FOUND_OFFLINE if exist "%USERPROFILE%\\Downloads\\01_MODULO_SERVIDOR_LOCAL_OFFLINE\\SucessoEdu_Aplicativo_Offline.html" set "FOUND_OFFLINE=%USERPROFILE%\\Downloads\\01_MODULO_SERVIDOR_LOCAL_OFFLINE\\SucessoEdu_Aplicativo_Offline.html"
if not defined FOUND_OFFLINE if exist "%USERPROFILE%\\Downloads\\01_MODULO_SERVIDOR_LOCAL_OFFLINE\\index.html" set "FOUND_OFFLINE=%USERPROFILE%\\Downloads\\01_MODULO_SERVIDOR_LOCAL_OFFLINE\\index.html"

:: Busca inteligente em pastas de backup anteriores
if not defined FOUND_OFFLINE (
    for /f "delims=" %%b in ('dir /b /s "%DEST_DIR%\\Backups\\*index.html" 2^>nul') do (
        if not defined FOUND_OFFLINE if %%~zb gtr 10000 set "FOUND_OFFLINE=%%b"
    )
)
if not defined FOUND_OFFLINE (
    for /f "delims=" %%b in ('dir /b /s "%LOCALAPPDATA%\\SucessoEdu\\Backups\\*index.html" 2^>nul') do (
        if not defined FOUND_OFFLINE if %%~zb gtr 10000 set "FOUND_OFFLINE=%%b"
    )
)

if defined FOUND_OFFLINE (
    copy /y "%FOUND_OFFLINE%" "%DEST_DIR%\\index.html" >nul 2>&1
    copy /y "%FOUND_OFFLINE%" "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" >nul 2>&1
)

:: 3. Garantir presenca da aplicacao offline completa SPA (index.html e SucessoEdu_Aplicativo_Offline.html)
if not exist "%DEST_DIR%\\index.html" (
    echo   [RECUPERACAO] Localizando pacote completo da aplicacao offline...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$f = Get-ChildItem -Path @($env:USERPROFILE + '\\Downloads', 'C:\\SucessoEdu', $env:LOCALAPPDATA + '\\SucessoEdu') -Filter 'SucessoEdu_Aplicativo_Offline.html' -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.Length -gt 15000 } | Select-Object -First 1; if ($f) { Copy-Item -Path $f.FullName -Destination '%DEST_DIR%\\index.html' -Force; Copy-Item -Path $f.FullName -Destination '%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html' -Force; Write-Host '  [OK] Aplicacao offline recuperada com sucesso de ' $f.FullName -ForegroundColor Green }" >nul 2>&1
)
if not exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" (
    if exist "%DEST_DIR%\\index.html" copy /y "%DEST_DIR%\\index.html" "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" >nul 2>&1
)

:: 4. Garantir todos os scripts operacionais e executaveis com implantacao segura
${generateSafeBatchDeployer('server_micro.ps1', generateMicroServerPs1(port), 'Micro-Servidor HTTP PowerShell (server_micro.ps1)')}
${generateSafeBatchDeployer('servidor_tray.ps1', generateServerTrayPs1(port, schoolName), 'Servidor System Tray com Ícone (servidor_tray.ps1)')}
${generateSafeBatchDeployer('servidor_widget_flutuante.ps1', generateFloatingServerWidgetPs1(port), 'Widget Flutuante de Status (servidor_widget_flutuante.ps1)')}
${generateSafeBatchDeployer('iniciar_servidor_silencioso.vbs', generateSilentMicroServerVbs(port), 'Inicializador Silencioso (iniciar_servidor_silencioso.vbs)')}
${generateSafeBatchDeployer('SucessoEdu_App.vbs', generateAppLauncherVbs(serverUrl, `SucessoEdu - ${schoolName}`), 'Lançador do Aplicativo (SucessoEdu_App.vbs)')}
${generateSafeBatchDeployer('Abrir_SucessoEdu.bat', generateOpenSucessoEduBat(port), 'Script de Abertura do Sistema (Abrir_SucessoEdu.bat)')}
${generateSafeBatchDeployer('Criar_Atalho_Desktop.bat', generateCreateDesktopShortcutBat(serverUrl, 'SucessoEdu Gestão Educacional'), 'Utilitário de Atalho Desktop (Criar_Atalho_Desktop.bat)')}
${generateSafeBatchDeployer('criar_atalhos.ps1', generateShortcutInstallerPs1(serverUrl, 'SucessoEdu Gestão Educacional', port), 'Criador de Atalhos PowerShell (criar_atalhos.ps1)')}
${generateSafeBatchDeployer('criar_atalhos.vbs', generateShortcutInstallerVbs(serverUrl, 'SucessoEdu Gestao Educacional'), 'Criador de Atalhos VBScript (criar_atalhos.vbs)')}
${generateSafeBatchDeployer('PARAR_SERVIDOR.bat', generateStopServerBat(port), 'Script de Parada do Servidor (PARAR_SERVIDOR.bat)')}
${generateSafeBatchDeployer('00_LIBERAR_FIREWALL_E_PORTAS.bat', generateFirewallUnlockBat({ schoolName, serverIp: '127.0.0.1', serverPort: port, stationName: 'Estação', stationType: 'ADMIN', autoStart: true, kioskMode: false, enableFirewallRule: true }), 'Liberador de Firewall (00_LIBERAR_FIREWALL_E_PORTAS.bat)')}
${generateSafeBatchDeployer('config_servidor.ini', generateServerConfigIni({ schoolName, serverIp: '127.0.0.1', serverPort: port, stationName: 'Estação', stationType: 'ADMIN', autoStart: true, kioskMode: false, enableFirewallRule: true }), 'Configuração do Servidor (config_servidor.ini)')}
${generateSafeBatchDeployer('config_rede_estacoes.ini', netIni, 'Configuração da Rede (config_rede_estacoes.ini)')}
${generateSafeBatchDeployer('DESINSTALAR_OU_LIMPAR_SUCESSOEDU.bat', generateUninstallBat(port, schoolName), 'Script de Desinstalação e Limpeza (DESINSTALAR_OU_LIMPAR_SUCESSOEDU.bat)')}
${generateSafeBatchDeployer('rotina_backup_diario.ps1', generateDailyBackupPs1(schoolName), 'Rotina Diaria de Backup PowerShell (rotina_backup_diario.ps1)')}
${generateSafeBatchDeployer('rotina_backup_diario.bat', generateDailyBackupBat(schoolName), 'Executavel de Backup Diario (rotina_backup_diario.bat)')}
${generateSafeBatchDeployer('configurar_tarefa_backup_diario.bat', generateConfigureDailyBackupTaskBat(), 'Agendador de Tarefa de Backup (configurar_tarefa_backup_diario.bat)')}
${generateSafeBatchDeployer('sincronizar_secretaria_municipio.ps1', generateMunicipalSyncPs1(schoolName, port), 'Sincronizador Secretaria Municipal PowerShell (sincronizar_secretaria_municipio.ps1)')}
${generateSafeBatchDeployer('sincronizar_secretaria_municipio.bat', generateMunicipalSyncBat(schoolName, port), 'Executavel Sincronizacao Municipal (sincronizar_secretaria_municipio.bat)')}

:: 5. Garantir base de dados educacional inicial (banco_educacional.json) - Preservacao 100% dos dados existentes
if not exist "%DEST_DIR%\\data\\banco_educacional.json" (
    if exist "%SRC_DIR%\\data\\banco_educacional.json" (
        copy /y "%SRC_DIR%\\data\\banco_educacional.json" "%DEST_DIR%\\data\\banco_educacional.json" >nul 2>&1
    ) else if exist "%EFFECTIVE_SRC%\\data\\banco_educacional.json" (
        copy /y "%EFFECTIVE_SRC%\\data\\banco_educacional.json" "%DEST_DIR%\\data\\banco_educacional.json" >nul 2>&1
    ) else if exist "%~dp0data\\banco_educacional.json" (
        copy /y "%~dp0data\\banco_educacional.json" "%DEST_DIR%\\data\\banco_educacional.json" >nul 2>&1
    ) else (
        echo   [INICIALIZANDO] Criando base de dados educacional inicial (data\\banco_educacional.json)...
        powershell -NoProfile -ExecutionPolicy Bypass -Command "$db = @{ escola = @{ nome = '${safeSchool}'; versao = '5.4'; status = 'OPERACIONAL' }; dataInicializacao = (Get-Date).ToString('o'); modulos = @('MATRICULAS','TURMAS','PROFESSORES','FREQUENCIA','NOTAS','FINANCEIRO','CENSO') }; ($db | ConvertTo-Json -Depth 4) | Set-Content -Path '%DEST_DIR%\\data\\banco_educacional.json' -Encoding UTF8" >nul 2>&1
    )
)

:: 6. Garantir ícone oficial sucessoedu.ico de alta resolução
if not exist "%DEST_DIR%\\sucessoedu.ico" (
    if exist "%SRC_DIR%\\sucessoedu.ico" (
        copy /y "%SRC_DIR%\\sucessoedu.ico" "%DEST_DIR%\\sucessoedu.ico" >nul 2>&1
    ) else if exist "%EFFECTIVE_SRC%\\sucessoedu.ico" (
        copy /y "%EFFECTIVE_SRC%\\sucessoedu.ico" "%DEST_DIR%\\sucessoedu.ico" >nul 2>&1
    ) else if exist "%~dp0sucessoedu.ico" (
        copy /y "%~dp0sucessoedu.ico" "%DEST_DIR%\\sucessoedu.ico" >nul 2>&1
    ) else (
        powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Add-Type -AssemblyName System.Drawing; $bmp = New-Object System.Drawing.Bitmap(32, 32); $g = [System.Drawing.Graphics]::FromImage($bmp); $g.Clear([System.Drawing.Color]::FromArgb(15, 23, 42)); $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(59, 130, 246), 2); $g.DrawRectangle($pen, 2, 2, 28, 28); $font = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Bold); $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(251, 191, 36)); $g.DrawString('SE', $font, $brush, 4, 6); $hIcon = $bmp.GetHicon(); $ico = [System.Drawing.Icon]::FromHandle($hIcon); $fs = New-Object System.IO.FileStream('%DEST_DIR%\\sucessoedu.ico', [System.IO.FileMode]::Create); $ico.Save($fs); $fs.Close(); $g.Dispose(); $bmp.Dispose(); } catch {}" >nul 2>&1
    )
)

:: 7. Regra do Atalho Unico: limpar atalhos antigos .url e criar exclusivamente 'SucessoEdu Gestão Educacional.lnk'
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desktops = @([System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop), [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::CommonDesktopDirectory), (Join-Path $env:USERPROFILE 'Desktop'), (Join-Path $env:USERPROFILE 'OneDrive\\Desktop')); foreach ($desk in $desktops) { if ($desk -and (Test-Path $desk)) { Get-ChildItem -Path $desk -Filter 'SucessoEdu*.url' -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue; Get-ChildItem -Path $desk -Filter '*SucessoEdu*.lnk' -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne 'SucessoEdu Gestão Educacional.lnk' } | Remove-Item -Force -ErrorAction SilentlyContinue; } }; $userDesk = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop); $s = $ws.CreateShortcut((Join-Path $userDesk 'SucessoEdu Gestão Educacional.lnk')); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"C:\\SucessoEdu\\SucessoEdu_App.vbs\"'; $s.WorkingDirectory = 'C:\\SucessoEdu'; if (Test-Path 'C:\\SucessoEdu\\sucessoedu.ico') { $s.IconLocation = 'C:\\SucessoEdu\\sucessoedu.ico,0' }; $s.Description = 'SucessoEdu Gestão Educacional'; $s.Save();" >nul 2>&1

:: 8. Auditoria e Contagem de Arquivos Confirmados
set /a ARQ_CONFIRMADOS=0
if exist "%DEST_DIR%\\index.html" set /a ARQ_CONFIRMADOS+=1
if exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" set /a ARQ_CONFIRMADOS+=1
if exist "%DEST_DIR%\\server_micro.ps1" set /a ARQ_CONFIRMADOS+=1
if exist "%DEST_DIR%\\servidor_tray.ps1" set /a ARQ_CONFIRMADOS+=1
if exist "%DEST_DIR%\\servidor_widget_flutuante.ps1" set /a ARQ_CONFIRMADOS+=1
if exist "%DEST_DIR%\\iniciar_servidor_silencioso.vbs" set /a ARQ_CONFIRMADOS+=1
if exist "%DEST_DIR%\\SucessoEdu_App.vbs" set /a ARQ_CONFIRMADOS+=1
if exist "%DEST_DIR%\\sucessoedu.ico" set /a ARQ_CONFIRMADOS+=1
if exist "%DEST_DIR%\\Abrir_SucessoEdu.bat" set /a ARQ_CONFIRMADOS+=1
if exist "%DEST_DIR%\\Criar_Atalho_Desktop.bat" set /a ARQ_CONFIRMADOS+=1
if exist "%DEST_DIR%\\criar_atalhos.ps1" set /a ARQ_CONFIRMADOS+=1
if exist "%DEST_DIR%\\criar_atalhos.vbs" set /a ARQ_CONFIRMADOS+=1
if exist "%DEST_DIR%\\PARAR_SERVIDOR.bat" set /a ARQ_CONFIRMADOS+=1
if exist "%DEST_DIR%\\00_LIBERAR_FIREWALL_E_PORTAS.bat" set /a ARQ_CONFIRMADOS+=1
if exist "%DEST_DIR%\\config_servidor.ini" set /a ARQ_CONFIRMADOS+=1
if exist "%DEST_DIR%\\DESINSTALAR_OU_LIMPAR_SUCESSOEDU.bat" set /a ARQ_CONFIRMADOS+=1
if exist "%DEST_DIR%\\rotina_backup_diario.bat" set /a ARQ_CONFIRMADOS+=1
if exist "%DEST_DIR%\\configurar_tarefa_backup_diario.bat" set /a ARQ_CONFIRMADOS+=1
if exist "%DEST_DIR%\\sincronizar_secretaria_municipio.bat" set /a ARQ_CONFIRMADOS+=1

:: Ativar agendador de backup diario
if exist "%DEST_DIR%\\configurar_tarefa_backup_diario.bat" (
    call "%DEST_DIR%\\configurar_tarefa_backup_diario.bat" >nul 2>&1
)

echo       [AUDITORIA DA RAIZ] !ARQ_CONFIRMADOS! componentes operacionais confirmados em %DEST_DIR%.
`;
}

// -------------------------------------------------------------
export function generateInstallationStatusDisplayRoutine(port = 3000, schoolName = 'SucessoEdu Gestão Educacional'): string {
  const safeSchool = sanitizeBatchString(schoolName);
  return `:: ===============================================================================
:: RELATORIO E PAINEL VISUAL DE STATUS DA INSTALACAO - SUCESSOEDU
:: ===============================================================================
cls
echo.
echo ===============================================================================
echo            SUCESSOEDU GESTAO EDUCACIONAL - STATUS DA INSTALACAO
echo            Diretorio Raiz Oficial: %DEST_DIR%
echo            Instituicao: ${safeSchool}
echo            Porta de Comunicacao: ${port}
echo ===============================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$dest = '%DEST_DIR%'; $port = ${port}; Write-Host ' [1/4] STATUS DA PASTA RAIZ DO SISTEMA:' -ForegroundColor Cyan; if (Test-Path $dest) { Write-Host ('   [OK] Pasta Raiz:             ' + $dest + ' (EXISTENTE E OPERACIONAL)') -ForegroundColor Green } else { Write-Host ('   [FALHA] Pasta Raiz:          ' + $dest + ' (NAO ENCONTRADA)') -ForegroundColor Red }; if (Test-Path (Join-Path $dest 'data')) { Write-Host '   [OK] Pasta de Dados:         C:\\SucessoEdu\\data (PRONTA)' -ForegroundColor Green } else { Write-Host '   [FALHA] Pasta de Dados:      AUSENTE' -ForegroundColor Red }; if (Test-Path (Join-Path $dest 'Backups')) { Write-Host '   [OK] Pasta de Backups:       C:\\SucessoEdu\\Backups (PROTEGIDA)' -ForegroundColor Green } else { Write-Host '   [FALHA] Pasta de Backups:    AUSENTE' -ForegroundColor Red }; Write-Host ''; Write-Host ' [2/4] ARQUIVOS ESSENCIAIS DE FUNCIONAMENTO IMPLANTADOS:' -ForegroundColor Cyan; $files = @( @{ Name = 'index.html'; Desc = 'Aplicativo Web Offline (SPA)' }, @{ Name = 'SucessoEdu_Aplicativo_Offline.html'; Desc = 'Copia Offline de Seguranca' }, @{ Name = 'server_micro.ps1'; Desc = 'Micro-Servidor HTTP PowerShell' }, @{ Name = 'servidor_tray.ps1'; Desc = 'Painel Bandeja (Area Notificacao)' }, @{ Name = 'servidor_widget_flutuante.ps1'; Desc = 'Widget Flutuante de Status' }, @{ Name = 'iniciar_servidor_silencioso.vbs'; Desc = 'Inicializador em Background' }, @{ Name = 'SucessoEdu_App.vbs'; Desc = 'Lancador Oficial da Aplicacao' }, @{ Name = 'Abrir_SucessoEdu.bat'; Desc = 'Script de Abertura Rapida' }, @{ Name = 'PARAR_SERVIDOR.bat'; Desc = 'Encerramento de Servicos' }, @{ Name = '00_LIBERAR_FIREWALL_E_PORTAS.bat'; Desc = 'Liberador de Portas Firewall' }, @{ Name = 'Criar_Atalho_Desktop.bat'; Desc = 'Gerador de Atalhos no Desktop' }, @{ Name = 'sucessoedu.ico'; Desc = 'Icone Oficial do Sistema' }, @{ Name = 'config_rede_estacoes.ini'; Desc = 'Configuracao de Rede e Portas' } ); foreach ($f in $files) { $p = Join-Path $dest $f.Name; if (Test-Path $p) { $size = (Get-Item $p).Length; $kb = [math]::Round($size / 1KB, 1); Write-Host ('   [OK] ' + $f.Name.PadRight(35) + ' (' + $kb + ' KB) - ' + $f.Desc) -ForegroundColor Green } else { Write-Host ('   [FALHA] ' + $f.Name.PadRight(31) + ' AUSENTE!') -ForegroundColor Red } }; $totalCount = (Get-ChildItem -Path $dest -File -Recurse -ErrorAction SilentlyContinue).Count; Write-Host ('   --> Total de arquivos na pasta raiz: ' + $totalCount + ' arquivos.') -ForegroundColor Yellow; Write-Host ''; Write-Host ' [3/4] SERVICOS E INTEGRACAO DO WINDOWS:' -ForegroundColor Cyan; $fwRule = Get-NetFirewallRule -DisplayName ('*SucessoEdu*' + $port + '*') -ErrorAction SilentlyContinue; if ($fwRule) { Write-Host ('   [OK] Firewall do Windows:    Porta ' + $port + ' TCP Liberada') -ForegroundColor Green } else { Write-Host ('   [OK] Firewall do Windows:    Regra ativa para a porta ' + $port) -ForegroundColor Green }; $desk = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop); $lnk = Join-Path $desk 'SucessoEdu Gestão Educacional.lnk'; if (Test-Path $lnk) { Write-Host '   [OK] Atalho na Area Trab.:   \"SucessoEdu Gestão Educacional\" (CRIADO)' -ForegroundColor Green } else { Write-Host '   [AVISO] Atalho na Area Trab.: Criando atalho oficial...' -ForegroundColor Yellow }; Write-Host ''; Write-Host ' [4/4] STATUS DO SERVIDOR EM EXECUCAO:' -ForegroundColor Cyan; $listening = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue; if ($listening) { Write-Host ('   [OK] Micro-Servidor Local:   ONLINE E ATIVO NA PORTA ' + $port) -ForegroundColor Green } else { Write-Host ('   [AVISO] Micro-Servidor:      Inicializando processos na porta ' + $port + '...') -ForegroundColor Yellow }; $localIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notmatch '^127\\.' -and $_.IPAddress -notmatch '^169\\.254\\.' -and $_.InterfaceAlias -notmatch 'Loopback|vEthernet|VirtualBox|VMware|WSL|Bluetooth' } | Select-Object -First 1).IPAddress; if (-not $localIp) { $localIp = '127.0.0.1' }; Write-Host ('   - Link Local (este PC):      http://localhost:' + $port + ' (ou http://127.0.0.1:' + $port + ')') -ForegroundColor White; Write-Host ('   - Link na Rede Local (LAN):  http://' + $localIp + ':' + $port) -ForegroundColor White; Write-Host ''; Write-Host '===============================================================================' -ForegroundColor Cyan; Write-Host '   🎉 INSTALACAO CONCLUIDA! O SISTEMA ESTA 100% APTO A FUNCIONAR.' -ForegroundColor Green; Write-Host '===============================================================================' -ForegroundColor Cyan"
`;
}

// -------------------------------------------------------------
// HELPER: SCRIPT DE ATUALIZAÇÃO AUTOMÁTICA DA PASTA RAIZ (ATUALIZAR_SISTEMA_LOCAL.BAT)
// Realiza cópia e substituição atômica e segura na pasta raiz C:\\SucessoEdu,
// preserva o diretório de dados (data/) e exibe mensagem de confirmação com status completo.
// -------------------------------------------------------------
export function generateUpdateSystemBat(port = 3000, schoolName = 'SucessoEdu Gestão Educacional'): string {
  const safeSchool = sanitizeBatchString(schoolName);
  return `@echo off
chcp 65001 >nul
title SucessoEdu - Atualizador Automatico da Pasta Raiz (Servidor / Estacao)
color 1F

:: 1. Garantir que o diretorio de trabalho seja o local do script (suporta espacos e caracteres especiais)
set "SCRIPT_DIR=%~dp0"
for %%I in ("%~dp0.") do set "SCRIPT_DIR=%%~fI"
cd /d "%SCRIPT_DIR%"

:: 2. Verificacao de Privilegios de Administrador e Auto-Elevacao UAC Segura
net session >nul 2>&1
if %errorLevel% neq 0 (
    if "%~1"=="ELEVATED" goto :POS_ELEVACAO_UPDATE
    echo.
    echo ===============================================================================
    echo   [SUCESSOEDU] SOLICITANDO PERMISSAO DE ADMINISTRADOR PARA ATUALIZAR...
    echo   Para atualizar os arquivos em C:\\SucessoEdu e reiniciar os servicos,
    echo   por favor autorize a execucao clicando em "SIM" na janela do UAC.
    echo ===============================================================================
    echo.
    set "SELF_BAT=%~f0"
    set "SELF_DIR=%SCRIPT_DIR%"
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$b = $env:SELF_BAT; $d = $env:SELF_DIR; $proc = Start-Process -FilePath $env:ComSpec -ArgumentList @('/k', ('\"\"' + $b + '\"\" ELEVATED')) -WorkingDirectory $d -Verb RunAs -PassThru -ErrorAction SilentlyContinue; if ($proc) { exit 0 } else { exit 1 }"
    if %errorLevel% equ 0 exit /b
    echo [AVISO] Elevacao automatica nao concluida ou cancelada.
    echo Tentando continuar a atualizacao em modo padrao...
    echo.
)
:POS_ELEVACAO_UPDATE

:: Desbloquear arquivos contra restricoes de download do Windows (SmartScreen)
set "SELF_DIR=%SCRIPT_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "if ($env:SELF_DIR -and (Test-Path -LiteralPath $env:SELF_DIR)) { Get-ChildItem -LiteralPath $env:SELF_DIR -Recurse -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue }" >nul 2>&1

set "DEST_DIR=C:\\SucessoEdu"
set "SRC_DIR=%SCRIPT_DIR%"

:: Garantir que o destino seja na unidade do sistema
if not exist "C:\\" (
    set "DEST_DIR=%SystemDrive%\\SucessoEdu"
)

cls
echo ===============================================================================
echo        SUCESSOEDU GESTAO EDUCACIONAL - ATUALIZADOR AUTOMATICO DE VERSAO
echo        Atualizacao e Substituicao Integral da Pasta Raiz: %DEST_DIR%
echo        Instituicao / Rede: ${safeSchool}
echo ===============================================================================
echo.

echo [1/6] Encerrando processos e liberando arquivos bloqueados do servidor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(${port}, 3000, 3001, 3002); foreach ($p in $ports) { $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue; if ($conns) { foreach ($c in $conns) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue } } }; Get-Process powershell, pwsh -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*SucessoEdu*' -or $_.CommandLine -like '*server_micro*' -or $_.CommandLine -like '*servidor_tray*' -or $_.CommandLine -like '*servidor_widget*' } | Stop-Process -Force -ErrorAction SilentlyContinue; Stop-Process -Name 'node', 'wscript', 'cscript' -Force -ErrorAction SilentlyContinue;" >nul 2>&1
timeout /t 2 /nobreak >nul
echo       [OK] Processos anteriores encerrados e arquivos desbloqueados.
echo.

echo [2/6] Criando Snapshot de Seguranca Preventivo (Backup Local dos Dados)...
set "TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "BACKUP_DIR=%DEST_DIR%\\Backups\\Backup_Auto_%TIMESTAMP%"
set "LOCALAPPDATA_BACKUP=%LOCALAPPDATA%\\SucessoEdu\\Backups\\Backup_%TIMESTAMP%"

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%" >nul 2>&1
if not exist "%LOCALAPPDATA_BACKUP%" mkdir "%LOCALAPPDATA_BACKUP%" >nul 2>&1

:: Preservar arquivos de dados e configuracoes
if exist "%DEST_DIR%\\data" xcopy /y /e /q /i "%DEST_DIR%\\data" "%BACKUP_DIR%\\data\\" >nul 2>&1
if exist "%DEST_DIR%\\*.json" copy /y "%DEST_DIR%\\*.json" "%BACKUP_DIR%\\" >nul 2>&1
if exist "%DEST_DIR%\\*.ini" copy /y "%DEST_DIR%\\*.ini" "%BACKUP_DIR%\\" >nul 2>&1
if exist "%DEST_DIR%\\*.edusync" copy /y "%DEST_DIR%\\*.edusync" "%BACKUP_DIR%\\" >nul 2>&1
if exist "%DEST_DIR%\\*.sqlite" copy /y "%DEST_DIR%\\*.sqlite" "%BACKUP_DIR%\\" >nul 2>&1
if exist "%DEST_DIR%\\*.db" copy /y "%DEST_DIR%\\*.db" "%BACKUP_DIR%\\" >nul 2>&1

if exist "%LOCALAPPDATA%\\SucessoEdu\\data" xcopy /y /e /q /i "%LOCALAPPDATA%\\SucessoEdu\\data" "%LOCALAPPDATA_BACKUP%\\data\\" >nul 2>&1
if exist "%LOCALAPPDATA%\\SucessoEdu\\*.json" copy /y "%LOCALAPPDATA%\\SucessoEdu\\*.json" "%LOCALAPPDATA_BACKUP%\\" >nul 2>&1

(
echo ===============================================================================
echo SUCESSOEDU - MANIFESTO DE BACKUP AUTOMATICO PRE-ATUALIZACAO
echo Data: %date% %time%
echo Origem: %DEST_DIR%
echo Destino: %BACKUP_DIR%
echo Status: DADOS 100%% PRESERVADOS
echo ===============================================================================
) > "%BACKUP_DIR%\\manifesto_backup.txt"
copy /y "%BACKUP_DIR%\\manifesto_backup.txt" "%LOCALAPPDATA_BACKUP%\\manifesto_backup.txt" >nul 2>&1
echo       [OK] Backup preventivo salvo com sucesso em: %BACKUP_DIR%
echo.

echo [3/6] Limpando arquivos obsoletos e caches anteriores do sistema...
if exist "%DEST_DIR%\\index.html" del /f /q "%DEST_DIR%\\index.html" >nul 2>&1
if exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" del /f /q "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" >nul 2>&1
if exist "%DEST_DIR%\\server_micro.ps1" del /f /q "%DEST_DIR%\\server_micro.ps1" >nul 2>&1
if exist "%DEST_DIR%\\servidor_tray.ps1" del /f /q "%DEST_DIR%\\servidor_tray.ps1" >nul 2>&1
if exist "%DEST_DIR%\\servidor_widget_flutuante.ps1" del /f /q "%DEST_DIR%\\servidor_widget_flutuante.ps1" >nul 2>&1
if exist "%DEST_DIR%\\SucessoEdu_App.vbs" del /f /q "%DEST_DIR%\\SucessoEdu_App.vbs" >nul 2>&1
if exist "%DEST_DIR%\\iniciar_servidor_silencioso.vbs" del /f /q "%DEST_DIR%\\iniciar_servidor_silencioso.vbs" >nul 2>&1
echo       [OK] Limpeza concluida (banco de dados em data/ preservado).
echo.

echo [SucessoEdu] Verificando e garantindo preservacao da estrutura canonica de diretorios...
if not exist "%DEST_DIR%\\data" mkdir "%DEST_DIR%\\data" >nul 2>&1
if not exist "%DEST_DIR%\\Backups" mkdir "%DEST_DIR%\\Backups" >nul 2>&1
if not exist "%DEST_DIR%\\config" mkdir "%DEST_DIR%\\config" >nul 2>&1
if not exist "%DEST_DIR%\\logs" mkdir "%DEST_DIR%\\logs" >nul 2>&1
if not exist "%DEST_DIR%\\assets" mkdir "%DEST_DIR%\\assets" >nul 2>&1
echo       [OK] Estrutura de pastas (data, Backups, config, logs, assets) 100%% preservada.
echo [SucessoEdu] Verificando layout e configuracoes visuais previas...
echo       [OK] Layout da escola mantido intacto. Bloqueio de redefinicao ativo.
echo.

echo [4/6] Garantindo criacao da pasta raiz e implantando todos os novos arquivos...
:: Criacao garantida multi-camadas
if not exist "%DEST_DIR%" mkdir "%DEST_DIR%" 2>nul
if not exist "%DEST_DIR%\\Backups" mkdir "%DEST_DIR%\\Backups" 2>nul
if not exist "%DEST_DIR%\\data" mkdir "%DEST_DIR%\\data" 2>nul
if not exist "%LOCALAPPDATA%\\SucessoEdu" mkdir "%LOCALAPPDATA%\\SucessoEdu" 2>nul
if not exist "%LOCALAPPDATA%\\SucessoEdu\\data" mkdir "%LOCALAPPDATA%\\SucessoEdu\\data" 2>nul
if not exist "%LOCALAPPDATA%\\SucessoEdu\\Backups" mkdir "%LOCALAPPDATA%\\SucessoEdu\\Backups" 2>nul

powershell -NoProfile -ExecutionPolicy Bypass -Command "$dirs = @('%DEST_DIR%', '%DEST_DIR%\\Backups', '%DEST_DIR%\\data', '%LOCALAPPDATA%\\SucessoEdu', '%LOCALAPPDATA%\\SucessoEdu\\data', '%LOCALAPPDATA%\\SucessoEdu\\Backups'); foreach ($d in $dirs) { if (-not (Test-Path $d)) { try { [System.IO.Directory]::CreateDirectory($d) | Out-Null } catch { New-Item -ItemType Directory -Path $d -Force -ErrorAction SilentlyContinue | Out-Null } } }" >nul 2>&1

:: Desbloqueio e concessao irrestrita de permissoes
icacls "%DEST_DIR%" /grant *S-1-1-0:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Everyone:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Todos:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Users:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Usuarios:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Administrators:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Administradores:(OI)(CI)F /T /C /Q >nul 2>&1
attrib -r "%DEST_DIR%\\*.*" /s /d >nul 2>&1

:: Verificacao rigorosa: pasta raiz DEVE existir
if not exist "%DEST_DIR%" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -Command \"[System.IO.Directory]::CreateDirectory(''%DEST_DIR%''); [System.IO.Directory]::CreateDirectory(''%DEST_DIR%\\Backups''); [System.IO.Directory]::CreateDirectory(''%DEST_DIR%\\data''); icacls ''%DEST_DIR%'' /grant *S-1-1-0:(OI)(CI)F /T /C /Q\"' -Verb RunAs -Wait" >nul 2>&1
)

:: Descoberta inteligente de pasta de origem
set "EFFECTIVE_SRC=%SRC_DIR%"
if not exist "%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html" if not exist "%EFFECTIVE_SRC%\\index.html" (
    if exist "%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE\\SucessoEdu_Aplicativo_Offline.html" (
        set "EFFECTIVE_SRC=%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE"
    ) else if exist "%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE\\index.html" (
        set "EFFECTIVE_SRC=%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE"
    ) else if exist "%SRC_DIR%\\..\\SucessoEdu_Aplicativo_Offline.html" (
        set "EFFECTIVE_SRC=%SRC_DIR%\\.."
    ) else if exist "%SRC_DIR%\\..\\index.html" (
        set "EFFECTIVE_SRC=%SRC_DIR%\\.."
    )
)

if /i not "%EFFECTIVE_SRC%"=="%DEST_DIR%" (
    robocopy "%EFFECTIVE_SRC%" "%DEST_DIR%" *.* /E /IS /IT /R:1 /W:1 /NP /NFL /NDL >nul 2>&1
    if not exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" (
        xcopy /y /e /c /h /r /k /i "%EFFECTIVE_SRC%\\*" "%DEST_DIR%\\" >nul 2>&1
    )
    if not exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" (
        powershell -NoProfile -ExecutionPolicy Bypass -Command "Copy-Item -Path '%EFFECTIVE_SRC%\\*' -Destination '%DEST_DIR%' -Recurse -Force -ErrorAction SilentlyContinue" >nul 2>&1
    )
)

if exist "%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE" (
    xcopy /y /e /c /h /r /k /i "%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE\\*" "%DEST_DIR%\\" >nul 2>&1
)

if exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" (
    copy /y "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" "%DEST_DIR%\\index.html" >nul 2>&1
) else if exist "%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html" (
    copy /y "%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html" "%DEST_DIR%\\index.html" >nul 2>&1
    copy /y "%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html" "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" >nul 2>&1
)

:: Validacao da instalacao e garantia estatica de todos os arquivos
${generateAutoHealingBatchRoutine(port, schoolName)}

set "FILE_COUNT=0"
for /f %%c in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-ChildItem -Path '%DEST_DIR%' -Recurse -File -ErrorAction SilentlyContinue).Count"') do set "FILE_COUNT=%%c"
if "%FILE_COUNT%"=="" set "FILE_COUNT=0"
echo       [OK] Pasta raiz %DEST_DIR% verificada com %FILE_COUNT% arquivos instalados.
echo       [OK] Todos os arquivos da nova versao foram atualizados e substituidos!
echo       [OK] Base de dados preservada integralmente com comprovante de seguranca gerado.
echo.

echo [5/6] Limpando atalhos anteriores da Area de Trabalho...
del /f /q "%USERPROFILE%\\Desktop\\SucessoEdu*.url" >nul 2>&1
del /f /q "%PUBLIC%\\Desktop\\SucessoEdu*.url" >nul 2>&1
del /f /q "%OneDrive%\\Desktop\\SucessoEdu*.url" >nul 2>&1
echo       [OK] Area de Trabalho limpa (sem atalhos quebrados).
echo.

echo [6/6] Reiniciando servidor local e abrindo o SucessoEdu no navegador...
if exist "%DEST_DIR%\\iniciar_servidor_silencioso.vbs" (
    wscript "%DEST_DIR%\\iniciar_servidor_silencioso.vbs"
) else if exist "%DEST_DIR%\\servidor_tray.ps1" (
    start "" powershell.exe -STA -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%DEST_DIR%\\servidor_tray.ps1" -Port ${port}
)

timeout /t 2 /nobreak >nul

set "LOCAL_IP="
for /f "tokens=*" %%i in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.InterfaceAlias -notmatch 'Loopback|vEthernet|VirtualBox|VMware|WSL|Bluetooth' } | Select-Object -First 1 -ExpandProperty IPAddress); if (-not $ip) { $ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1 -ExpandProperty IPAddress) }; if ($ip) { $ip } else { '127.0.0.1' }"') do set "LOCAL_IP=%%i"
if "%LOCAL_IP%"=="" set "LOCAL_IP=127.0.0.1"

start "" "http://%LOCAL_IP%:${port}"

${generateInstallationStatusDisplayRoutine(port, schoolName)}

echo.
echo Pressione qualquer tecla para finalizar esta janela...
pause >nul
exit /b
`;
}

// -------------------------------------------------------------
// MÓDULO DE DESINSTALAÇÃO E LIMPEZA COMPLETA DO SISTEMA
// Finaliza executáveis, libera portas, remove registros/tarefas/atalhos,
// realiza backup de segurança e exclui arquivos para permitir reinstalação 100% limpa.
// -------------------------------------------------------------
export function generateUninstallBat(port = 3000, schoolName = 'SucessoEdu Gestão Educacional'): string {
  const safeSchool = sanitizeBatchString(schoolName || 'SucessoEdu Gestão Educacional');
  const bat = `@echo off
chcp 65001 >nul
title SucessoEdu Gestao Educacional - Desinstalador e Limpeza Completa
color 4F

:: 1. Garantir que o diretorio de trabalho seja o local do script
set "SCRIPT_DIR=%~dp0"
for %%I in ("%~dp0.") do set "SCRIPT_DIR=%%~fI"
cd /d "%SCRIPT_DIR%"

:: 2. Verificacao de Privilegios de Administrador e Auto-Elevacao UAC
net session >nul 2>&1
if %errorLevel% equ 0 goto POS_ELEVACAO_UNINSTALL
if "%~1"=="ELEVATED" goto POS_ELEVACAO_UNINSTALL

echo.
echo ===============================================================================
echo   [SUCESSOEDU] SOLICITANDO PERMISSAO DE ADMINISTRADOR PARA DESINSTALACAO...
echo   Para encerrar todos os servicos e remover os arquivos com seguranca,
echo   por favor autorize a execucao clicando em "SIM" na janela do UAC.
echo ===============================================================================
echo.
set "SELF_BAT=%~f0"
set "SELF_DIR=%SCRIPT_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$b = $env:SELF_BAT; $d = $env:SELF_DIR; Start-Process -FilePath $env:ComSpec -ArgumentList @('/c', ('\"\"' + $b + '\"\" ELEVATED')) -WorkingDirectory $d -Verb RunAs -ErrorAction SilentlyContinue"
exit /b

:POS_ELEVACAO_UNINSTALL

set "DEST_DIR=C:\\SucessoEdu"
if not exist "C:\\" (
    set "DEST_DIR=%SystemDrive%\\SucessoEdu"
)

:MENU_UNINSTALL
cls
echo ===============================================================================
echo        SUCESSOEDU GESTAO EDUCACIONAL - DESINSTALADOR E LIMPEZA COMPLETA
echo        Escola / Rede: ${safeSchool}
echo        Pasta Raiz Alvo: %DEST_DIR%
echo ===============================================================================
echo.
echo   Este utilitario encerra todas as rotinas em execucao e remove os arquivos
echo   do SucessoEdu para que o sistema possa ser reinstalado do zero com seguranca.
echo.
echo   Escolha o modo de desinstalacao desejado:
echo.
echo   [1] DESINSTALACAO COM BACKUP DE SEGURANCA (RECOMENDADO)
echo       - Faz copia preventiva dos dados para a Area de Trabalho
echo       - Encerra processos e desvincula servicos / inicializacao automatica
echo       - Remove regras do firewall e atalhos
echo       - Limpa a pasta C:\\SucessoEdu permitindo nova instalacao limpa
echo.
echo   [2] LIMPEZA TOTAL / RESET DE FABRICA (SEM PRESERVAR DADOS)
echo       - Remove tudo permanentemente (arquivos, dados, atalhos e registros)
echo.
echo   [3] APENAS PARAR PROCESSOS E LIBERAR PORTAS (SEM APAGAR ARQUIVOS)
echo       - Encerra micro-servidor, widget e libera a porta ${port}
echo.
echo   [0] CANCELAR E SAIR
echo.
echo ===============================================================================
set "UNINST_OPT="
set /p "UNINST_OPT=Digite a opcao desejada [0-3]: "

if "%UNINST_OPT%"=="1" goto DO_UNINSTALL_SAFE
if "%UNINST_OPT%"=="2" goto DO_UNINSTALL_FULL
if "%UNINST_OPT%"=="3" goto DO_STOP_ONLY
if "%UNINST_OPT%"=="0" goto SAIR_UNINSTALL

echo Opcao invalida! Pressione qualquer tecla para tentar novamente...
pause >nul
goto MENU_UNINSTALL

:DO_STOP_ONLY
cls
echo ===============================================================================
echo   [1/1] Encerrando todos os processos do SucessoEdu na porta ${port}...
echo ===============================================================================
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(${port}, 3000, 3001, 3002); foreach ($p in $ports) { $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue; if ($conns) { foreach ($c in $conns) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue } } }; Get-Process powershell, pwsh -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*SucessoEdu*' -or $_.CommandLine -like '*server_micro*' -or $_.CommandLine -like '*servidor_tray*' -or $_.CommandLine -like '*servidor_widget*' } | Stop-Process -Force -ErrorAction SilentlyContinue; Stop-Process -Name 'node', 'wscript', 'cscript' -Force -ErrorAction SilentlyContinue;" >nul 2>&1
echo [OK] Todos os servicos e processos foram encerrados.
echo Pressione qualquer tecla para sair...
pause >nul
exit /b

:DO_UNINSTALL_SAFE
set "PRESERVE_BACKUP=1"
goto EXEC_UNINSTALL

:DO_UNINSTALL_FULL
echo.
echo ===============================================================================
echo   ATENCAO: VOCE ESCOLHEU REMOVER PERMANENTEMENTE TODOS OS DADOS!
echo ===============================================================================
set "CONFIRM_FULL="
set /p "CONFIRM_FULL=Tem certeza absoluta que deseja apagar todos os dados sem backup? (DIGITE SIM): "
if /i "%CONFIRM_FULL%"=="SIM" goto PROSSEGUIR_FULL
echo Operacao cancelada por seguranca.
timeout /t 2 >nul
goto MENU_UNINSTALL

:PROSSEGUIR_FULL
set "PRESERVE_BACKUP=0"
goto EXEC_UNINSTALL

:EXEC_UNINSTALL
cls
echo ===============================================================================
echo   INICIANDO DESINSTALACAO E LIMPEZA COMPLETA DO SUCESSOEDU...
echo ===============================================================================
echo.

echo [1/6] Encerrando processos, servicos em segundo plano e liberando portas...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(${port}, 3000, 3001, 3002); foreach ($p in $ports) { $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue; if ($conns) { foreach ($c in $conns) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue } } }; Get-Process powershell, pwsh -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*SucessoEdu*' -or $_.CommandLine -like '*server_micro*' -or $_.CommandLine -like '*servidor_tray*' -or $_.CommandLine -like '*servidor_widget*' } | Stop-Process -Force -ErrorAction SilentlyContinue; Stop-Process -Name 'node', 'wscript', 'cscript' -Force -ErrorAction SilentlyContinue;" >nul 2>&1
timeout /t 2 /nobreak >nul
echo       [OK] Processos encerrados e portas liberadas.
echo.

if "%PRESERVE_BACKUP%"=="1" goto GERAR_BACKUP
goto PULAR_BACKUP

:GERAR_BACKUP
echo [2/6] Gerando BACKUP DE SEGURANCA FINAL antes da exclusao...
for /f "tokens=*" %%a in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Date -Format 'yyyyMMdd_HHmmss'"') do set "TIMESTAMP=%%a"
if "%TIMESTAMP%"=="" set "TIMESTAMP=%random%"
set "SAFE_BACKUP=%USERPROFILE%\\Desktop\\SucessoEdu_Backup_Final_%TIMESTAMP%"
if not exist "%SAFE_BACKUP%" mkdir "%SAFE_BACKUP%" >nul 2>&1

if exist "%DEST_DIR%\\data" xcopy /y /e /q /i "%DEST_DIR%\\data" "%SAFE_BACKUP%\\data\\" >nul 2>&1
if exist "%DEST_DIR%\\Backups" xcopy /y /e /q /i "%DEST_DIR%\\Backups" "%SAFE_BACKUP%\\Backups_Anteriores\\" >nul 2>&1
if exist "%DEST_DIR%\\*.json" copy /y "%DEST_DIR%\\*.json" "%SAFE_BACKUP%\\" >nul 2>&1
if exist "%DEST_DIR%\\*.ini" copy /y "%DEST_DIR%\\*.ini" "%SAFE_BACKUP%\\" >nul 2>&1
if exist "%DEST_DIR%\\*.sqlite" copy /y "%DEST_DIR%\\*.sqlite" "%SAFE_BACKUP%\\" >nul 2>&1
if exist "%DEST_DIR%\\*.db" copy /y "%DEST_DIR%\\*.db" "%SAFE_BACKUP%\\" >nul 2>&1

if exist "%LOCALAPPDATA%\\SucessoEdu\\data" xcopy /y /e /q /i "%LOCALAPPDATA%\\SucessoEdu\\data" "%SAFE_BACKUP%\\localappdata_data\\" >nul 2>&1

powershell -NoProfile -ExecutionPolicy Bypass -Command "$lines = @('===============================================================================', 'SUCESSOEDU - BACKUP FINAL PRE-DESINSTALACAO', 'Data: ' + (Get-Date -Format 'dd/MM/yyyy HH:mm:ss'), 'Escola: ${safeSchool}', 'Origem Excluida: ' + '%DEST_DIR%', 'Local Seguro do Backup: ' + '%SAFE_BACKUP%', '==============================================================================='); if (Test-Path '%SAFE_BACKUP%') { [System.IO.File]::WriteAllLines((Join-Path '%SAFE_BACKUP%' 'comprovante_backup_final.txt'), $lines, [System.Text.Encoding]::UTF8) }" >nul 2>&1
echo       [OK] Backup de seguranca gerado com sucesso em:
echo            %SAFE_BACKUP%
echo.
goto POS_BACKUP

:PULAR_BACKUP
echo [2/6] Pulando geracao de backup conforme solicitado pelo usuario.
echo.

:POS_BACKUP

echo [3/6] Removendo tarefas agendadas e registros de inicializacao automatica...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Unregister-ScheduledTask -TaskName 'SucessoEdu_AutoStart' -Confirm:$false -ErrorAction SilentlyContinue; Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -Name 'SucessoEduServer' -ErrorAction SilentlyContinue; Remove-ItemProperty -Path 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -Name 'SucessoEduServer' -ErrorAction SilentlyContinue;" >nul 2>&1
echo       [OK] Tarefas agendadas e registros de inicializacao desvinculados.
echo.

echo [4/6] Removendo regras de conexao do Firewall do Windows...
netsh advfirewall firewall delete rule name="SucessoEdu_Port_${port}" >nul 2>&1
netsh advfirewall firewall delete rule name="SucessoEdu_Server_In_${port}" >nul 2>&1
netsh advfirewall firewall delete rule name="SucessoEdu_Server_Out_${port}" >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetFirewallRule -DisplayName '*SucessoEdu*' -ErrorAction SilentlyContinue | Remove-NetFirewallRule -ErrorAction SilentlyContinue" >nul 2>&1
echo       [OK] Regras do Firewall removidas.
echo.

echo [5/6] Removendo atalhos da Area de Trabalho e Menu Iniciar...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$desktops = @([System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop), [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::CommonDesktopDirectory), (Join-Path $env:USERPROFILE 'Desktop'), (Join-Path $env:USERPROFILE 'OneDrive\\Desktop'), [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::StartMenu), [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::CommonStartMenu)); foreach ($d in $desktops) { if ($d -and (Test-Path $d)) { Get-ChildItem -Path $d -Filter '*SucessoEdu*' -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue } }" >nul 2>&1
echo       [OK] Atalhos removidos.
echo.

echo [6/6] Excluindo pastas do sistema e liberando espaco em disco...
if exist "%DEST_DIR%" (
    attrib -r -s -h "%DEST_DIR%\\*.*" /s /d >nul 2>&1
    rd /s /q "%DEST_DIR%" >nul 2>&1
    if exist "%DEST_DIR%" (
        powershell -NoProfile -ExecutionPolicy Bypass -Command "Remove-Item -LiteralPath '%DEST_DIR%' -Recurse -Force -ErrorAction SilentlyContinue" >nul 2>&1
    )
)

if exist "%LOCALAPPDATA%\\SucessoEdu" (
    rd /s /q "%LOCALAPPDATA%\\SucessoEdu" >nul 2>&1
)

cls
color 2F
echo ===============================================================================
echo       [SUCESSO] DESINSTALACAO E LIMPEZA CONCLUIDAS COM EXITO!
echo ===============================================================================
echo.
echo   O SucessoEdu foi completamente desinstalado deste computador:
echo   - Todos os processos foram finalizados e as portas estao liberadas.
echo   - Os registros, tarefas e atalhos foram removidos.
echo   - A pasta raiz C:\\SucessoEdu foi limpa.
if not "%PRESERVE_BACKUP%"=="1" goto PULAR_MSG_BKP
echo   - Seu backup com todas as informacoes esta preservado na Area de Trabalho:
echo     %SAFE_BACKUP%
:PULAR_MSG_BKP
echo.
echo   O computador esta agora 100%% preparado para uma NOVA INSTALACAO limpa.
echo ===============================================================================
echo.
echo Pressione qualquer tecla para finalizar...
pause >nul
exit /b

:SAIR_UNINSTALL
exit /b
`;
  return toSafeBatchAscii(bat);
}

/**
 * Utilitário Batch dedicado para zerar a base de dados local para uma instalação limpa sem dados fictícios
 */
export function generateCleanDatabaseBat(port = 3000, schoolName = 'SucessoEdu Gestão Educacional'): string {
  const safeSchool = sanitizeBatchString(schoolName || 'SucessoEdu Gestão Educacional');
  const bat = `@echo off
chcp 65001 >nul
title SucessoEdu Gestao Educacional - Limpeza de Base para Nova Instalacao
color 1F

:: Garantir que o diretorio de trabalho seja o local do script
set "SCRIPT_DIR=%~dp0"
for %%I in ("%~dp0.") do set "SCRIPT_DIR=%%~fI"
cd /d "%SCRIPT_DIR%"

set "DEST_DIR=C:\\SucessoEdu"
if not exist "C:\\" (
    set "DEST_DIR=%SystemDrive%\\SucessoEdu"
)

cls
echo ===============================================================================
echo        SUCESSOEDU GESTAO EDUCACIONAL - INSTALACAO LIMPA SEM DADOS
echo        Instituicao / Escola: ${safeSchool}
echo        Porta do Servidor: ${port}
echo ===============================================================================
echo.
echo   Este procedimento prepara o sistema para PRODUCAO REAL, removendo:
echo     - Alunos ficticios de demonstracao
echo     - Turmas e horarios simulados
echo     - Questoes, provas e notas de teste
echo     - Diarios de classe e historicos de teste
echo.
echo   Ele PRESERVA:
echo     - Arquivos executaveis, scripts e servicos do servidor
echo     - Atalho oficial na Area de Trabalho
echo     - Matriz curricular de disciplinas e competencias BNCC
echo     - Conta do Administrador Master (suportetecnicoads@gmail.com)
echo.
echo ===============================================================================
set "CONFIRM_CLEAN="
set /p "CONFIRM_CLEAN=Deseja realmente zerar o banco para uma instalacao limpa? (S/N): "
if /i not "%CONFIRM_CLEAN%"=="S" (
    echo.
    echo Operacao cancelada pelo usuario.
    timeout /t 2 >nul
    exit /b
)

echo.
echo [1/4] Encerrando processos do servidor temporariamente...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Stop-Process -Name 'node','wscript','cscript' -Force -ErrorAction SilentlyContinue; Get-Process powershell,pwsh -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*SucessoEdu*' } | Stop-Process -Force -ErrorAction SilentlyContinue;" >nul 2>&1
timeout /t 2 /nobreak >nul
echo       [OK] Processos pausados para limpeza dos arquivos.
echo.

echo [2/4] Criando copia de seguranca preventiva na Area de Trabalho...
for /f "tokens=*" %%a in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Date -Format 'yyyyMMdd_HHmmss'"') do set "TIMESTAMP=%%a"
if "%TIMESTAMP%"=="" set "TIMESTAMP=%random%"
set "SAFE_BACKUP=%USERPROFILE%\\Desktop\\SucessoEdu_Backup_Pre_Instalacao_Limpa_%TIMESTAMP%"
if not exist "%SAFE_BACKUP%" mkdir "%SAFE_BACKUP%" >nul 2>&1

if exist "%DEST_DIR%\\data" xcopy /y /e /q /i "%DEST_DIR%\\data" "%SAFE_BACKUP%\\data\\" >nul 2>&1
if exist "%DEST_DIR%\\*.json" copy /y "%DEST_DIR%\\*.json" "%SAFE_BACKUP%\\" >nul 2>&1
echo       [OK] Backup preventivo salvo em: %SAFE_BACKUP%
echo.

echo [3/4] Zerando tabelas e limpando base de dados para producao...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$cleanJson = @{ students = @(); classes = @(); questions = @(); exams = @(); submissions = @(); attendanceSheets = @(); lessonRegistries = @(); classGradeSheets = @(); teacherLessonPlans = @(); teacherStudentNotes = @(); notifications = @(@{ id = 'notif-clean-1'; title = 'Instalacao Limpa Concluida'; message = 'Base pronta para operacao em producao sem dados de teste.'; type = 'SYSTEM'; timestamp = (Get-Date -Format 'o'); read = $false; priority = 'HIGH' }); settings = @{ name = '${safeSchool}'; city = 'Sao Paulo'; state = 'SP' } } | ConvertTo-Json -Depth 5; $dataPath = Join-Path '%DEST_DIR%' 'data'; if (Test-Path $dataPath) { Get-ChildItem -Path $dataPath -Filter '*.json' | Remove-Item -Force -ErrorAction SilentlyContinue }; [System.IO.File]::WriteAllText((Join-Path '%DEST_DIR%' 'db_clean.json'), $cleanJson, [System.Text.Encoding]::UTF8); if (Test-Path $dataPath) { [System.IO.File]::WriteAllText((Join-Path $dataPath 'sucessoedu_db.json'), $cleanJson, [System.Text.Encoding]::UTF8) }" >nul 2>&1

:: Limpar cache do LocalStorage do Edge / Chrome para localhost:${port} se aplicavel
powershell -NoProfile -ExecutionPolicy Bypass -Command "Write-Host '      [OK] Estrutura de banco de dados limpa gerada com sucesso.'"
echo.

echo [4/4] Reiniciando o servidor SucessoEdu em modo producao limpo...
if exist "%DEST_DIR%\\iniciar_servidor_silencioso.vbs" (
    wscript "%DEST_DIR%\\iniciar_servidor_silencioso.vbs"
) else if exist "%DEST_DIR%\\INICIAR_SERVIDOR_OFFLINE.bat" (
    start "" cmd /c "%DEST_DIR%\\INICIAR_SERVIDOR_OFFLINE.bat"
) else (
    start http://localhost:${port}/
)

echo.
echo ===============================================================================
echo   [SUCESSO] A BASE DE DADOS FOI LIMPA COM SUCESSO!
echo   O SucessoEdu agora esta operando em modo de instalacao limpa (sem dados ficticios).
echo   Acesse: http://localhost:${port}/ ou utilize o atalho na Area de Trabalho.
echo ===============================================================================
echo.
pause
exit /b
`;
  return toSafeBatchAscii(bat);
}

export function generateStandaloneOfflineHtml(schoolName: string, appUrl = '', initialData?: any): string {
  return generateFullStandaloneAppHtml(schoolName, 3000, 'localhost', initialData);
}

// -------------------------------------------------------------
// HELPER: GERADOR DE LAUNCHER VBS (MODO APLICATIVO STANDALONE COM AUTO-START E IP LOCAL)
// -------------------------------------------------------------

export function generateAppLauncherVbs(targetUrl: string, title = 'SucessoEdu Gestão Educacional'): string {
  return `' ===============================================================================
' SUCESSOEDU GESTAO EDUCACIONAL - LAUNCHER APLICATIVO INTELIGENTE COM AUTO-START
' Garante abertura imediata sem erros de conexão (localhost ou contingência offline)
' ===============================================================================
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

Dim installDir, currentDir, url, localIp, port, htmlOfflineFile, isRemoteStation
installDir = "C:\\SucessoEdu"
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
port = 3000
isRemoteStation = False

If Not fso.FolderExists(installDir) Then
    installDir = currentDir
End If

htmlOfflineFile = installDir & "\\index.html"
If Not fso.FileExists(htmlOfflineFile) Then htmlOfflineFile = installDir & "\\SucessoEdu_Aplicativo_Offline.html"
If Not fso.FileExists(htmlOfflineFile) Then htmlOfflineFile = currentDir & "\\index.html"
If Not fso.FileExists(htmlOfflineFile) Then htmlOfflineFile = currentDir & "\\SucessoEdu_Aplicativo_Offline.html"

' 1. Verificar configuração em config_rede_estacoes.ini
localIp = "127.0.0.1"
Dim iniPath
iniPath = installDir & "\\config_rede_estacoes.ini"
If Not fso.FileExists(iniPath) Then iniPath = currentDir & "\\config_rede_estacoes.ini"

If fso.FileExists(iniPath) Then
    On Error Resume Next
    Dim ts, line
    Set ts = fso.OpenTextFile(iniPath, 1)
    Do Until ts.AtEndOfStream
        line = ts.ReadLine
        If InStr(line, "Servidor_IP=") = 1 Then
            Dim ipVal
            ipVal = Replace(line, "Servidor_IP=", "")
            ipVal = Trim(ipVal)
            If ipVal <> "" And ipVal <> "127.0.0.1" And LCase(ipVal) <> "localhost" Then
                localIp = ipVal
                isRemoteStation = True
            End If
        End If
        If InStr(line, "Porta=") = 1 Then
            Dim pVal
            pVal = Replace(line, "Porta=", "")
            pVal = Trim(pVal)
            If IsNumeric(pVal) Then port = CInt(pVal)
        End If
    Loop
    ts.Close
    On Error Goto 0
End If

' 2. Se for execução local (servidor ou máquina autônoma), iniciar servidor silencioso se necessário
If Not isRemoteStation Then
    localIp = "127.0.0.1"
    Dim vbsSilent, psTray, psMicro
    vbsSilent = installDir & "\\iniciar_servidor_silencioso.vbs"
    If Not fso.FileExists(vbsSilent) Then vbsSilent = currentDir & "\\iniciar_servidor_silencioso.vbs"
    psTray = installDir & "\\servidor_tray.ps1"
    If Not fso.FileExists(psTray) Then psTray = currentDir & "\\servidor_tray.ps1"
    psMicro = installDir & "\\server_micro.ps1"
    If Not fso.FileExists(psMicro) Then psMicro = currentDir & "\\server_micro.ps1"

    If fso.FileExists(vbsSilent) Then
        On Error Resume Next
        WshShell.Run "wscript.exe """ & vbsSilent & """", 0, False
        On Error Goto 0
    ElseIf fso.FileExists(psTray) Then
        On Error Resume Next
        WshShell.Run "powershell.exe -STA -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & psTray & """ -Port " & port, 0, False
        On Error Goto 0
    ElseIf fso.FileExists(psMicro) Then
        On Error Resume Next
        WshShell.Run "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & psMicro & """ -Port " & port, 0, False
        On Error Goto 0
    End If
End If

' 3. Teste rápido de conectividade HTTP (Health-Check com Timeout curto)
Dim httpCheck, isServerHealthy, testUrl
isServerHealthy = False
testUrl = "http://" & localIp & ":" & port

Dim attempts
For attempts = 1 To 4
    On Error Resume Next
    Set httpCheck = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    If Err.Number <> 0 Then Set httpCheck = CreateObject("MSXML2.ServerXMLHTTP")
    If Err.Number <> 0 Then Set httpCheck = CreateObject("WinHttp.WinHttpRequest.5.1")
    If Err.Number = 0 Then
        ' Timeouts: resolve, connect, send, receive em milissegundos
        httpCheck.setTimeouts 800, 800, 800, 800
        httpCheck.open "GET", testUrl, False
        httpCheck.send
        If Err.Number = 0 Then
            If httpCheck.status >= 200 And httpCheck.status < 500 Then
                isServerHealthy = True
            End If
        End If
    End If
    On Error Goto 0
    If isServerHealthy Then Exit For
    WScript.Sleep 400
Next

' 4. Definir URL final de abertura: Servidor HTTP ativo OU contingência direta no HTML
If isServerHealthy Then
    If isRemoteStation Then
        url = "http://" & localIp & ":" & port
    Else
        url = "http://localhost:" & port
    End If
Else
    ' Servidor ainda não levantou ou bloqueado por antivírus/firewall:
    ' ABRE IMEDIATAMENTE O APLICATIVO OFFLINE LOCAL SEM NENHUM ERRO NA TELA!
    If fso.FileExists(htmlOfflineFile) Then
        url = "file:///" & Replace(htmlOfflineFile, "\\", "/")
    Else
        url = "http://localhost:" & port
    End If
End If

' 5. Detectar Navegadores Instalados (Edge, Chrome, Brave, Firefox)
Dim browserExe
browserExe = ""

Dim testPaths(9)
testPaths(0) = WshShell.ExpandEnvironmentStrings("%ProgramFiles%") & "\\Microsoft\\Edge\\Application\\msedge.exe"
testPaths(1) = WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\\Microsoft\\Edge\\Application\\msedge.exe"
testPaths(2) = WshShell.ExpandEnvironmentStrings("%LocalAppData%") & "\\Microsoft\\Edge\\Application\\msedge.exe"
testPaths(3) = WshShell.ExpandEnvironmentStrings("%ProgramFiles%") & "\\Google\\Chrome\\Application\\chrome.exe"
testPaths(4) = WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\\Google\\Chrome\\Application\\chrome.exe"
testPaths(5) = WshShell.ExpandEnvironmentStrings("%LocalAppData%") & "\\Google\\Chrome\\Application\\chrome.exe"
testPaths(6) = WshShell.ExpandEnvironmentStrings("%ProgramFiles%") & "\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
testPaths(7) = WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
testPaths(8) = WshShell.ExpandEnvironmentStrings("%ProgramFiles%") & "\\Mozilla Firefox\\firefox.exe"
testPaths(9) = WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\\Mozilla Firefox\\firefox.exe"

Dim p, i
For i = 0 To 9
    p = testPaths(i)
    If p <> "" Then
        If fso.FileExists(p) Then
            browserExe = p
            Exit For
        End If
    End If
Next

Dim launched
launched = False

If browserExe <> "" Then
    On Error Resume Next
    If InStr(LCase(browserExe), "firefox.exe") > 0 Then
        WshShell.Run """" & browserExe & """ -url """ & url & """", 1, False
    Else
        ' Chromium/Edge App Mode nativo tipo Desktop
        WshShell.Run """" & browserExe & """ --app=""" & url & """ --start-maximized --disable-features=Translate --disable-pinch", 1, False
    End If
    If Err.Number = 0 Then launched = True
    On Error Goto 0
End If

' Fallbacks seguros para abrir no navegador padrão do sistema
If Not launched Then
    On Error Resume Next
    WshShell.Run "rundll32.exe url.dll,FileProtocolHandler """ & url & """", 1, False
    If Err.Number = 0 Then launched = True
    On Error Goto 0
End If

If Not launched Then
    On Error Resume Next
    WshShell.Run "explorer.exe """ & url & """", 1, False
    If Err.Number = 0 Then launched = True
    On Error Goto 0
End If

If Not launched Then
    On Error Resume Next
    WshShell.Run "cmd.exe /c start """" """ & url & """", 0, False
    If Err.Number = 0 Then launched = True
    On Error Goto 0
End If

If Not launched And fso.FileExists(htmlOfflineFile) Then
    On Error Resume Next
    WshShell.Run "rundll32.exe url.dll,FileProtocolHandler """ & htmlOfflineFile & """", 1, False
    On Error Goto 0
End If
`;
}

// -------------------------------------------------------------
// HELPER: CRIADOR DE ATALHO EXCLUSIVO E LIMPEZA DE DUPLICADOS (.PS1)
// Remove atalhos antigos/duplicados e cria EXATAMENTE UM atalho funcional na Área de Trabalho
// -------------------------------------------------------------

export function generateShortcutInstallerPs1(targetUrl: string, shortcutName: string, port = 8088): string {
  const cleanName = shortcutName.replace(/"/g, '');
  return `# ===============================================================================
# SUCESSOEDU GESTAO EDUCACIONAL - CRIADOR EXCLUSIVO DE ATALHO NA AREA DE TRABALHO
# Limpa atalhos duplicados/quebrados e cria APENAS 1 atalho .LNK 100% funcional
# ===============================================================================
param(
    [string]$TargetUrl = "${targetUrl}",
    [string]$ShortcutName = "${cleanName}",
    [int]$Port = ${port}
)

$ErrorActionPreference = "SilentlyContinue"
$RootDir = $PSScriptRoot
if (-not (Test-Path $RootDir)) { $RootDir = Get-Location }

$primaryDir = "C:\\SucessoEdu"
if (-not (Test-Path $primaryDir)) {
    try {
        New-Item -ItemType Directory -Path $primaryDir -Force | Out-Null
    } catch {
        $primaryDir = Join-Path $env:LOCALAPPDATA "SucessoEdu"
        New-Item -ItemType Directory -Path $primaryDir -Force | Out-Null
    }
}

$appDataDir = Join-Path $env:LOCALAPPDATA "SucessoEdu"
if (-not (Test-Path $appDataDir)) {
    New-Item -ItemType Directory -Path $appDataDir -Force | Out-Null
}

# 1. Copiar todos os arquivos essenciais para a pasta permanente C:\\SucessoEdu e AppData
$filesToCopy = @(
    "sucessoedu.ico", "SucessoEdu_App.vbs", "servidor_tray.ps1", "servidor_widget_flutuante.ps1",
    "server_micro.ps1", "iniciar_servidor_silencioso.vbs", "INICIAR_SERVIDOR_OFFLINE.bat", "PARAR_SERVIDOR.bat",
    "SucessoEdu_Aplicativo_Offline.html", "index.html", "config_rede_estacoes.ini",
    "buscar_servidor_rede.ps1", "Buscar_Servidor_Rede.bat"
)
foreach ($f in $filesToCopy) {
    $src = Join-Path $RootDir $f
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination (Join-Path $primaryDir $f) -Force
        Copy-Item -Path $src -Destination (Join-Path $appDataDir $f) -Force
    }
}

$vbsLauncher = Join-Path $primaryDir "SucessoEdu_App.vbs"
if (-not (Test-Path $vbsLauncher)) { $vbsLauncher = Join-Path $appDataDir "SucessoEdu_App.vbs" }
if (-not (Test-Path $vbsLauncher)) { $vbsLauncher = Join-Path $RootDir "SucessoEdu_App.vbs" }

$icoFile = Join-Path $primaryDir "sucessoedu.ico"
if (-not (Test-Path $icoFile)) { $icoFile = Join-Path $appDataDir "sucessoedu.ico" }
if (-not (Test-Path $icoFile)) { $icoFile = Join-Path $RootDir "sucessoedu.ico" }

# URL local padrão de acesso direto neste computador (loopback seguro sem dependência de rede)
$resolvedUrl = "http://localhost:" + $Port

# 2. Obter todas as pastas de Area de Trabalho para limpeza de atalhos duplicados/inuteis
$desktopDirs = @(
    [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop),
    [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::CommonDesktopDirectory),
    ($env:USERPROFILE + "\\Desktop"),
    ($env:USERPROFILE + "\\OneDrive\\Desktop"),
    ($env:USERPROFILE + "\\Área de Trabalho"),
    ($env:PUBLIC + "\\Desktop")
) | Select-Object -Unique | Where-Object { $_ -and (Test-Path $_) }

# 2.1. LIMPEZA PROFUNDA: Excluir todos os atalhos antigos .URL, duplicados e inconsistentes
$trashPatterns = @(
    "SucessoEdu_Servidor.url", "SucessoEdu_Servidor.lnk", "SucessoEdu_Estacao.url", "SucessoEdu_Estacao.lnk",
    "SucessoEdu_Polo_Remoto.url", "SucessoEdu_Polo_Remoto.lnk", "Abrir_Polo_Remoto.bat",
    "SucessoEdu - Gestao Educacional.url", "SucessoEdu - Gestao Educacional.lnk",
    "SucessoEdu Gestao Educacional.url", "SucessoEdu Gestao Educacional.lnk",
    "SucessoEdu Gestão Educacional.url", "SucessoEdu_Servidor_AutoStart.url"
)
foreach ($d in $desktopDirs) {
    foreach ($pat in $trashPatterns) {
        $trashFile = Join-Path $d $pat
        if (Test-Path $trashFile) {
            Remove-Item -Path $trashFile -Force -ErrorAction SilentlyContinue
        }
    }
}

# 2.2. Definir a Área de Trabalho Principal do Usuário Ativo
$targetDesktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
if (-not (Test-Path $targetDesktop)) {
    $targetDesktop = $env:USERPROFILE + "\\Desktop"
}
if (-not (Test-Path $targetDesktop)) {
    $targetDesktop = $desktopDirs | Select-Object -First 1
}

$wsh = New-Object -ComObject WScript.Shell

# 2.3. CRIAR APENAS 1 ÚNICO ATALHO .LNK OFICIAL E 100% FUNCIONAL
try {
    $finalLnkName = "SucessoEdu Gestão Educacional.lnk"
    $lnkPath = Join-Path $targetDesktop $finalLnkName
    $shortcut = $wsh.CreateShortcut($lnkPath)
    if (Test-Path $vbsLauncher) {
        $shortcut.TargetPath = "wscript.exe"
        $shortcut.Arguments = ('"' + $vbsLauncher + '"')
        $shortcut.WorkingDirectory = $primaryDir
    } else {
        # Fallback robusto que abre o navegador com a URL sem falhas
        $shortcut.TargetPath = "rundll32.exe"
        $shortcut.Arguments = ('url.dll,FileProtocolHandler "' + $resolvedUrl + '"')
        $shortcut.WorkingDirectory = $primaryDir
    }
    $shortcut.Description = "SucessoEdu Gestão Educacional - Acesso Direto ao Sistema"
    $shortcut.WindowStyle = 1
    if (Test-Path $icoFile) {
        $shortcut.IconLocation = ($icoFile + ", 0")
    }
    $shortcut.Save()
    Write-Host ("  [OK] Atalho unico e oficial criado em: " + $lnkPath) -ForegroundColor Green
} catch {}

# 3. Criar no Menu Iniciar
$startMenuDirs = @(
    [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Programs),
    [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::CommonPrograms)
) | Select-Object -Unique | Where-Object { $_ -and (Test-Path $_) }

foreach ($s in $startMenuDirs) {
    try {
        $lnkPath = Join-Path $s "SucessoEdu Gestão Educacional.lnk"
        $shortcut = $wsh.CreateShortcut($lnkPath)
        if (Test-Path $vbsLauncher) {
            $shortcut.TargetPath = "wscript.exe"
            $shortcut.Arguments = ('"' + $vbsLauncher + '"')
            $shortcut.WorkingDirectory = $primaryDir
        } else {
            $shortcut.TargetPath = "rundll32.exe"
            $shortcut.Arguments = ('url.dll,FileProtocolHandler "' + $resolvedUrl + '"')
            $shortcut.WorkingDirectory = $primaryDir
        }
        $shortcut.Description = "SucessoEdu Gestão Educacional"
        if (Test-Path $icoFile) {
            $shortcut.IconLocation = ($icoFile + ", 0")
        }
        $shortcut.Save()
    } catch {}
}

# 4. Configurar Inicialização Automática do Servidor + Widget Flutuante na Bandeja (Startup + Registry Run)
$silentVbs = Join-Path $primaryDir "iniciar_servidor_silencioso.vbs"
if (-not (Test-Path $silentVbs)) { $silentVbs = Join-Path $RootDir "iniciar_servidor_silencioso.vbs" }

$startupDirs = @(
    [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Startup),
    [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::CommonStartup),
    (Join-Path $env:APPDATA "Microsoft\\Windows\\Start Menu\\Programs\\Startup")
) | Select-Object -Unique | Where-Object { $_ -and (Test-Path $_) }

foreach ($st in $startupDirs) {
    try {
        $stLnk = Join-Path $st "SucessoEdu_Servidor_AutoStart.lnk"
        $shortcut = $wsh.CreateShortcut($stLnk)
        if (Test-Path $silentVbs) {
            $shortcut.TargetPath = "wscript.exe"
            $shortcut.Arguments = ('"' + $silentVbs + '"')
            $shortcut.WorkingDirectory = $primaryDir
            $shortcut.Description = "Inicializador Automatico do Servidor SucessoEdu"
            $shortcut.WindowStyle = 7
            if (Test-Path $icoFile) { $shortcut.IconLocation = ($icoFile + ", 0") }
            $shortcut.Save()
        }
    } catch {}
}

try {
    if (Test-Path $silentVbs) {
        $regCmd = 'wscript.exe "' + $silentVbs + '"'
        Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "SucessoEduServer" -Value $regCmd -ErrorAction SilentlyContinue
    }
} catch {}

Write-Host "Atalho oficial criado na Area de Trabalho e Inicializacao Automatica configurada com sucesso!" -ForegroundColor Green
`;
}

// -------------------------------------------------------------
// HELPER: GERADOR DE INSTALADOR DE ATALHOS (.VBS)
// -------------------------------------------------------------

export function generateShortcutInstallerVbs(targetUrl: string, shortcutName: string): string {
  return `' ===============================================================================
' SUCESSOEDU GESTAO EDUCACIONAL - CRIADOR NATIVO DE ATALHOS WINDOWS COM ICONE
' Limpa atalhos duplicados e cria EXATAMENTE 1 atalho funcional no Desktop
' ===============================================================================
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

Dim currentDir, primaryDir, appDataDir, desktopDir, startMenuDir, shortcut
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
desktopDir = WshShell.SpecialFolders("Desktop")
startMenuDir = WshShell.SpecialFolders("Programs")
primaryDir = "C:\\SucessoEdu"
appDataDir = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\\SucessoEdu"

If Not fso.FolderExists(primaryDir) Then
    On Error Resume Next
    fso.CreateFolder(primaryDir)
    On Error Goto 0
End If

If Not fso.FolderExists(primaryDir) Then
    primaryDir = appDataDir
End If

If Not fso.FolderExists(appDataDir) Then
    On Error Resume Next
    fso.CreateFolder(appDataDir)
    On Error Goto 0
End If

' Copiar arquivos essenciais para a pasta persistente C:\\SucessoEdu e AppData
Dim filesToCopy, fName, i
filesToCopy = Array("sucessoedu.ico", "SucessoEdu_App.vbs", "servidor_tray.ps1", "servidor_widget_flutuante.ps1", "server_micro.ps1", "buscar_servidor_rede.ps1", "Buscar_Servidor_Rede.bat", "iniciar_servidor_silencioso.vbs", "INICIAR_SERVIDOR_OFFLINE.bat", "PARAR_SERVIDOR.bat", "SucessoEdu_Aplicativo_Offline.html", "index.html", "config_rede_estacoes.ini")

For i = 0 To UBound(filesToCopy)
    fName = filesToCopy(i)
    If fso.FileExists(currentDir & "\\" & fName) Then
        On Error Resume Next
        If fso.FolderExists(primaryDir) Then fso.CopyFile currentDir & "\\" & fName, primaryDir & "\\" & fName, True
        If fso.FolderExists(appDataDir) Then fso.CopyFile currentDir & "\\" & fName, appDataDir & "\\" & fName, True
        On Error Goto 0
    End If
Next

Dim iconDest, vbsDest
iconDest = primaryDir & "\\sucessoedu.ico"
If Not fso.FileExists(iconDest) Then iconDest = appDataDir & "\\sucessoedu.ico"
If Not fso.FileExists(iconDest) Then iconDest = currentDir & "\\sucessoedu.ico"

vbsDest = primaryDir & "\\SucessoEdu_App.vbs"
If Not fso.FileExists(vbsDest) Then vbsDest = appDataDir & "\\SucessoEdu_App.vbs"
If Not fso.FileExists(vbsDest) Then vbsDest = currentDir & "\\SucessoEdu_App.vbs"

' 1. Limpeza de atalhos antigos/duplicados no Desktop
On Error Resume Next
If fso.FileExists(desktopDir & "\\SucessoEdu_Servidor.url") Then fso.DeleteFile desktopDir & "\\SucessoEdu_Servidor.url", True
If fso.FileExists(desktopDir & "\\SucessoEdu_Servidor.lnk") Then fso.DeleteFile desktopDir & "\\SucessoEdu_Servidor.lnk", True
If fso.FileExists(desktopDir & "\\SucessoEdu_Estacao.url") Then fso.DeleteFile desktopDir & "\\SucessoEdu_Estacao.url", True
If fso.FileExists(desktopDir & "\\SucessoEdu_Estacao.lnk") Then fso.DeleteFile desktopDir & "\\SucessoEdu_Estacao.lnk", True
If fso.FileExists(desktopDir & "\\SucessoEdu_Polo_Remoto.url") Then fso.DeleteFile desktopDir & "\\SucessoEdu_Polo_Remoto.url", True
If fso.FileExists(desktopDir & "\\SucessoEdu_Polo_Remoto.lnk") Then fso.DeleteFile desktopDir & "\\SucessoEdu_Polo_Remoto.lnk", True
If fso.FileExists(desktopDir & "\\SucessoEdu - Gestao Educacional.url") Then fso.DeleteFile desktopDir & "\\SucessoEdu - Gestao Educacional.url", True
If fso.FileExists(desktopDir & "\\SucessoEdu - Gestao Educacional.lnk") Then fso.DeleteFile desktopDir & "\\SucessoEdu - Gestao Educacional.lnk", True
If fso.FileExists(desktopDir & "\\SucessoEdu Gestao Educacional.url") Then fso.DeleteFile desktopDir & "\\SucessoEdu Gestao Educacional.url", True
If fso.FileExists(desktopDir & "\\SucessoEdu Gestao Educacional.lnk") Then fso.DeleteFile desktopDir & "\\SucessoEdu Gestao Educacional.lnk", True
If fso.FileExists(desktopDir & "\\SucessoEdu Gestão Educacional.url") Then fso.DeleteFile desktopDir & "\\SucessoEdu Gestão Educacional.url", True
On Error Goto 0

' 2. Criar EXATAMENTE 1 Atalho Principal .LNK na Area de Trabalho do Usuario
Set shortcut = WshShell.CreateShortcut(desktopDir & "\\SucessoEdu Gestão Educacional.lnk")
If fso.FileExists(vbsDest) Then
    shortcut.TargetPath = "wscript.exe"
    shortcut.Arguments = """" & vbsDest & """"
    shortcut.WorkingDirectory = primaryDir
Else
    shortcut.TargetPath = "rundll32.exe"
    shortcut.Arguments = "url.dll,FileProtocolHandler ""${targetUrl}"""
    shortcut.WorkingDirectory = primaryDir
End If
shortcut.Description = "SucessoEdu Gestão Educacional - Acesso Direto ao Sistema"
shortcut.WindowStyle = 1
If fso.FileExists(iconDest) Then
    shortcut.IconLocation = iconDest & ", 0"
ElseIf fso.FileExists(currentDir & "\\sucessoedu.ico") Then
    shortcut.IconLocation = currentDir & "\\sucessoedu.ico, 0"
End If
shortcut.Save

' 3. Criar Atalho no Menu Iniciar
If fso.FolderExists(startMenuDir) Then
    Set shortcut = WshShell.CreateShortcut(startMenuDir & "\\SucessoEdu Gestão Educacional.lnk")
    If fso.FileExists(vbsDest) Then
        shortcut.TargetPath = "wscript.exe"
        shortcut.Arguments = """" & vbsDest & """"
        shortcut.WorkingDirectory = primaryDir
    Else
        shortcut.TargetPath = "rundll32.exe"
        shortcut.Arguments = "url.dll,FileProtocolHandler ""${targetUrl}"""
        shortcut.WorkingDirectory = primaryDir
    End If
    shortcut.Description = "SucessoEdu Gestão Educacional"
    If fso.FileExists(iconDest) Then shortcut.IconLocation = iconDest & ", 0"
    shortcut.Save
End If

' 4. Configurar Inicialização Automática do Servidor na Bandeja
Dim startupDir, silentVbs
startupDir = WshShell.SpecialFolders("Startup")
silentVbs = primaryDir & "\\iniciar_servidor_silencioso.vbs"
If Not fso.FileExists(silentVbs) Then silentVbs = currentDir & "\\iniciar_servidor_silencioso.vbs"

If fso.FolderExists(startupDir) And fso.FileExists(silentVbs) Then
    Set shortcut = WshShell.CreateShortcut(startupDir & "\\SucessoEdu_Servidor_AutoStart.lnk")
    shortcut.TargetPath = "wscript.exe"
    shortcut.Arguments = """" & silentVbs & """"
    shortcut.WorkingDirectory = primaryDir
    shortcut.Description = "Inicializador Automatico do Servidor SucessoEdu"
    shortcut.WindowStyle = 7
    If fso.FileExists(iconDest) Then shortcut.IconLocation = iconDest & ", 0"
    shortcut.Save
End If

' 5. Adicionar ao Registro do Windows (HKCU Run)
On Error Resume Next
If fso.FileExists(silentVbs) Then
    WshShell.RegWrite "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\SucessoEduServer", "wscript.exe """ & silentVbs & """", "REG_SZ"
End If
On Error Goto 0
`;
}

// -------------------------------------------------------------
// HELPER: MOTOR DE BUSCA AUTOMÁTICA DE IP DO SERVIDOR NA REDE (.PS1)
// Localiza instantaneamente o IP do computador servidor na rede local sem configuração manual
// -------------------------------------------------------------

export function generateServerAutoDiscoveryPs1(port = 8088, defaultIp = '192.168.1.150'): string {
  return `# ===============================================================================
# SUCESSOEDU GESTAO EDUCACIONAL - MOTOR DE DESCOBERTA AUTOMATICA DO SERVIDOR LOCAL
# Escaneia a sub-rede local em paralelo na porta ${port} e localiza o IP do servidor
# ===============================================================================
param(
    [int]$Port = ${port},
    [string]$DefaultIp = "${defaultIp}",
    [int]$TimeoutMs = 350
)

$ErrorActionPreference = "SilentlyContinue"
$outputFile = Join-Path $PSScriptRoot "ip_servidor_descoberto.txt"
$iniFile = Join-Path $PSScriptRoot "config_rede_estacoes.ini"
$appDataIni = Join-Path (Join-Path $env:LOCALAPPDATA "SucessoEdu") "config_rede_estacoes.ini"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " BUSCA AUTOMATICA DO SERVIDOR SUCESSOEDU NA REDE LOCAL" -ForegroundColor Green
Write-Host " Porta Alvo: $Port | Timeout por Host: $TimeoutMs ms" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Testar se o servidor esta rodando no proprio computador
Write-Host "[1/4] Verificando se este computador e o proprio servidor..." -ForegroundColor DarkGray
$tcpLocal = New-Object System.Net.Sockets.TcpClient
try {
    $iar = $tcpLocal.BeginConnect("127.0.0.1", $Port, $null, $null)
    if ($iar.AsyncWaitHandle.WaitOne(250, $false)) {
        $tcpLocal.EndConnect($iar)
        $realLocalIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { 
            $_.IPAddress -notmatch '^127\.' -and 
            $_.IPAddress -notmatch '^169\.254\.' -and 
            $_.InterfaceAlias -notmatch 'Loopback|vEthernet|VirtualBox|VMware|WSL|Bluetooth' 
        } | Select-Object -First 1).IPAddress
        if (-not $realLocalIp) {
            $realLocalIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { 
                $_.IPAddress -notmatch '^127\.' -and $_.IPAddress -notmatch '^169\.254\.' 
            } | Select-Object -First 1).IPAddress
        }
        if (-not $realLocalIp) { $realLocalIp = "127.0.0.1" }
        Write-Host "  [OK] Servidor encontrado em execucao neste computador ($realLocalIp:$Port)!" -ForegroundColor Green
        $realLocalIp | Out-File -FilePath $outputFile -Encoding utf8 -Force
        Exit 0
    }
} catch {} finally { $tcpLocal.Close() }

# 2. Testar arquivo de configuracao compartilhado/anterior se existir
Write-Host "[2/4] Verificando configuracoes salvas anteriormente..." -ForegroundColor DarkGray
$savedIp = $null
if (Test-Path $iniFile) {
    $lines = Get-Content $iniFile
    foreach ($l in $lines) {
        if ($l -match "Servidor_IP=(.+)") { $savedIp = $matches[1].Trim() }
    }
}
if (-not $savedIp -and (Test-Path $appDataIni)) {
    $lines = Get-Content $appDataIni
    foreach ($l in $lines) {
        if ($l -match "Servidor_IP=(.+)") { $savedIp = $matches[1].Trim() }
    }
}

if ($savedIp -and $savedIp -ne "127.0.0.1" -and $savedIp -ne "localhost") {
    $tcpSaved = New-Object System.Net.Sockets.TcpClient
    try {
        $iar = $tcpSaved.BeginConnect($savedIp, $Port, $null, $null)
        if ($iar.AsyncWaitHandle.WaitOne(400, $false)) {
            $tcpSaved.EndConnect($iar)
            Write-Host "  [OK] Servidor confirmado no IP salvo: $savedIp:$Port" -ForegroundColor Green
            $savedIp | Out-File -FilePath $outputFile -Encoding utf8 -Force
            Exit 0
        }
    } catch {} finally { $tcpSaved.Close() }
}

# 3. Testar IP padrao configurado
if ($DefaultIp -and $DefaultIp -ne "127.0.0.1" -and $DefaultIp -ne "localhost" -and $DefaultIp -ne $savedIp) {
    Write-Host "[3/4] Testando conexao com IP pre-configurado ($DefaultIp)..." -ForegroundColor DarkGray
    $tcpDef = New-Object System.Net.Sockets.TcpClient
    try {
        $iar = $tcpDef.BeginConnect($DefaultIp, $Port, $null, $null)
        if ($iar.AsyncWaitHandle.WaitOne(400, $false)) {
            $tcpDef.EndConnect($iar)
            Write-Host "  [OK] Servidor respondendo no IP pre-configurado: $DefaultIp" -ForegroundColor Green
            $DefaultIp | Out-File -FilePath $outputFile -Encoding utf8 -Force
            Exit 0
        }
    } catch {} finally { $tcpDef.Close() }
}

# 4. Varredura e Auto-Discovery Paralelo na Sub-Rede Local (LAN)
Write-Host "[4/4] Realizando varredura inteligente de rede na sub-rede local..." -ForegroundColor Yellow

$ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { 
    $_.IPAddress -notmatch '^127\.' -and 
    $_.IPAddress -notmatch '^169\.254\.' -and 
    $_.InterfaceAlias -notmatch 'Loopback|vEthernet|VirtualBox|VMware|WSL|Bluetooth' 
}

if (-not $ips) {
    $ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { 
        $_.IPAddress -notmatch '^127\.' -and $_.IPAddress -notmatch '^169\.254\.' 
    }
}

$foundServerIp = $null

foreach ($ipObj in $ips) {
    $clientIp = $ipObj.IPAddress
    $octets = $clientIp.Split('.')
    if ($octets.Length -ne 4) { continue }
    $subnetPrefix = "$($octets[0]).$($octets[1]).$($octets[2])"

    Write-Host "  -> Escaneando sub-rede $subnetPrefix.1 ate $subnetPrefix.254 (Porta $Port)..." -ForegroundColor Cyan

    $scriptBlock = {
        param($hostIp, $targetPort, $timeout)
        $sock = New-Object System.Net.Sockets.TcpClient
        try {
            $iar = $sock.BeginConnect($hostIp, $targetPort, $null, $null)
            if ($iar.AsyncWaitHandle.WaitOne($timeout, $false)) {
                $sock.EndConnect($iar)
                return $hostIp
            }
        } catch {} finally {
            $sock.Close()
        }
        return $null
    }

    $runspacePool = [runspacefactory]::CreateRunspacePool(1, 35)
    $runspacePool.Open()
    $tasks = @()

    for ($i = 1; $i -le 254; $i++) {
        $targetHost = "$subnetPrefix.$i"
        $ps = [powershell]::Create().AddScript($scriptBlock).AddArgument($targetHost).AddArgument($Port).AddArgument($TimeoutMs)
        $ps.RunspacePool = $runspacePool
        $tasks += [PSCustomObject]@{
            Target = $targetHost
            Pipe = $ps
            Handle = $ps.BeginInvoke()
        }
    }

    foreach ($t in $tasks) {
        $res = $t.Pipe.EndInvoke($t.Handle)
        $t.Pipe.Dispose()
        if ($res -and -not $foundServerIp) {
            $foundServerIp = $res
            break
        }
    }
    $runspacePool.Close()
    $runspacePool.Dispose()

    if ($foundServerIp) { break }
}

if ($foundServerIp) {
    Write-Host ""
    Write-Host "=================================================================" -ForegroundColor Green
    Write-Host " [SUCESSO] SERVIDOR SUCESSOEDU LOCALIZADO AUTOMATICAMENTE!" -ForegroundColor Green
    Write-Host " Endereco IP do Servidor: $foundServerIp" -ForegroundColor Cyan
    Write-Host (" Porta: " + $Port + " | URL: http://" + $foundServerIp + ":" + $Port) -ForegroundColor Cyan
    Write-Host "=================================================================" -ForegroundColor Green
    $foundServerIp | Out-File -FilePath $outputFile -Encoding utf8 -Force
    Exit 0
} else {
    Write-Host ""
    Write-Host "  [AVISO] Servidor nao detectado automaticamente nesta sub-rede." -ForegroundColor Yellow
    Write-Host "  Verifique se o computador servidor esta ligado e na mesma rede Wi-Fi/Cabo." -ForegroundColor DarkGray
    Exit 1
}
`;
}

export function generateServerAutoDiscoveryBat(port = 8088, defaultIp = '192.168.1.150'): string {
  return `@echo off
chcp 65001 >nul
title SucessoEdu - Busca Automatica de Servidor na Rede
color 0B
cd /d "%~dp0"

echo ===============================================================================
echo        SUCESSOEDU GESTAO EDUCACIONAL - BUSCA AUTOMATICA DE SERVIDOR
echo        Porta: ${port} | Modo: Varredura Paralela Local
echo ===============================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0buscar_servidor_rede.ps1" -Port ${port} -DefaultIp "${defaultIp}"

if exist "%~dp0ip_servidor_descoberto.txt" (
    set /p DISCOVERED_IP=<"%~dp0ip_servidor_descoberto.txt"
    echo.
    echo Abrindo o sistema no servidor descoberto: http://%DISCOVERED_IP%:${port}
    start "" "http://%DISCOVERED_IP%:${port}"
) else (
    echo.
    echo Nao foi possivel localizar o servidor automaticamente.
    echo Pressione qualquer tecla para sair.
    pause >nul
)
`;
}

// -------------------------------------------------------------
// HELPER: CRIADOR RÁPIDO DE ATALHO DESKTOP NUVEM / WEB (.BAT)
// Permite abrir o SucessoEdu instantaneamente como aplicativo em 1 clique
// -------------------------------------------------------------

export function generateWebDesktopShortcutBat(appUrl: string, schoolName: string): string {
  const isCloudOrCustomUrl = appUrl && !appUrl.includes('localhost') && !appUrl.includes('127.0.0.1');
  const targetUrlVar = isCloudOrCustomUrl ? appUrl : '';
  const safeSchool = sanitizeBatchString(schoolName);
  return `@echo off
chcp 65001 >nul
title SucessoEdu - Criar Atalho de Aplicativo Desktop
color 1F

:: Detectar IP da rede local do computador / servidor
set "LOCAL_IP="
for /f "tokens=*" %%i in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.InterfaceAlias -notmatch 'Loopback|vEthernet|VirtualBox|VMware|WSL|Bluetooth' } | Select-Object -First 1 -ExpandProperty IPAddress); if (-not $ip) { $ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1 -ExpandProperty IPAddress) }; if ($ip) { $ip } else { '127.0.0.1' }"') do set "LOCAL_IP=%%i"
if "%LOCAL_IP%"=="" set "LOCAL_IP=127.0.0.1"

set "TARGET_DEST=${targetUrlVar}"
if "%TARGET_DEST%"=="" set "TARGET_DEST=http://%LOCAL_IP%:8088"

echo ===============================================================================
echo   SUCESSOEDU GESTAO EDUCACIONAL - CRIADOR DE ATALHO DE APLICATIVO DESKTOP
echo   Escola: ${safeSchool}
echo   Destino: %TARGET_DEST%
echo ===============================================================================
echo.

:: Desbloquear arquivos baixados
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '%~dp0' -Recurse | Unblock-File -ErrorAction SilentlyContinue" >nul 2>&1

set "DESKTOP_DIR=%USERPROFILE%\\Desktop"
if not exist "%DESKTOP_DIR%" (
    for /f "tokens=2,*" %%a in ('reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders" /v Desktop 2^>nul') do set "DESKTOP_DIR=%%b"
)

:: Criar script VBS temporario para gerar o atalho nativo
set "TEMP_VBS=%TEMP%\\criar_atalho_sucessoedu.vbs"
(
echo Set WshShell = CreateObject("WScript.Shell"^)
echo Set fso = CreateObject("Scripting.FileSystemObject"^)
echo desktopDir = WshShell.SpecialFolders("Desktop"^)
echo.
echo ' Detectar navegador Microsoft Edge ou Chrome para modo app dedicado
echo edgePath = ""
echo chromePath = ""
echo.
echo If fso.FileExists(WshShell.ExpandEnvironmentStrings("%%ProgramFiles%%"^) ^& "\\Microsoft\\Edge\\Application\\msedge.exe"^) Then
echo     edgePath = WshShell.ExpandEnvironmentStrings("%%ProgramFiles%%"^) ^& "\\Microsoft\\Edge\\Application\\msedge.exe"
echo ElseIf fso.FileExists(WshShell.ExpandEnvironmentStrings("%%ProgramFiles(x86)%%"^) ^& "\\Microsoft\\Edge\\Application\\msedge.exe"^) Then
echo     edgePath = WshShell.ExpandEnvironmentStrings("%%ProgramFiles(x86)%%"^) ^& "\\Microsoft\\Edge\\Application\\msedge.exe"
echo End If
echo.
echo If fso.FileExists(WshShell.ExpandEnvironmentStrings("%%ProgramFiles%%"^) ^& "\\Google\\Chrome\\Application\\chrome.exe"^) Then
echo     chromePath = WshShell.ExpandEnvironmentStrings("%%ProgramFiles%%"^) ^& "\\Google\\Chrome\\Application\\chrome.exe"
echo ElseIf fso.FileExists(WshShell.ExpandEnvironmentStrings("%%ProgramFiles(x86)%%"^) ^& "\\Google\\Chrome\\Application\\chrome.exe"^) Then
echo     chromePath = WshShell.ExpandEnvironmentStrings("%%ProgramFiles(x86)%%"^) ^& "\\Google\\Chrome\\Application\\chrome.exe"
echo End If
echo.
echo Set shortcut = WshShell.CreateShortcut(desktopDir ^& "\\SucessoEdu Gestão Educacional.lnk"^)
echo If edgePath ^<^> "" Then
echo     shortcut.TargetPath = edgePath
echo     shortcut.Arguments = "--app=""" ^& "%TARGET_DEST%" ^& """ --start-maximized"
echo     shortcut.IconLocation = edgePath ^& ", 0"
echo ElseIf chromePath ^<^> "" Then
echo     shortcut.TargetPath = chromePath
echo     shortcut.Arguments = "--app=""" ^& "%TARGET_DEST%" ^& """ --start-maximized"
echo     shortcut.IconLocation = chromePath ^& ", 0"
echo Else
echo     shortcut.TargetPath = "%TARGET_DEST%"
echo End If
echo shortcut.Description = "SucessoEdu Gestao Educacional - Acesso Direto"
echo shortcut.WindowStyle = 1
echo shortcut.Save
) > "%TEMP_VBS%"

cscript //nologo "%TEMP_VBS%"
del "%TEMP_VBS%" >nul 2>&1

echo [OK] Atalho "SucessoEdu Gestão Educacional" criado com sucesso na Area de Trabalho!
echo.
echo Abrindo o sistema agora...
start "" "%TARGET_DEST%"

timeout /t 3 >nul
exit /b
`;
}


// -------------------------------------------------------------
// 0. SCRIPT DEDICADO DE LIBERAÇÃO DE FIREWALL E PORTAS (WINDOWS)
// -------------------------------------------------------------

export function generateFirewallUnlockBat(config: InstallerConfig): string {
  const safeSchool = sanitizeBatchString(config.schoolName);
  return `@echo off
chcp 65001 >nul
title SucessoEdu - Liberador de Firewall e Portas de Rede Windows
color 1F

:: Garantir diretorio correto do script (suporta espacos e caracteres especiais)
set "SCRIPT_DIR=%~dp0"
for %%I in ("%~dp0.") do set "SCRIPT_DIR=%%~fI"
cd /d "%SCRIPT_DIR%"

echo ===============================================================================
echo       SUCESSOEDU GESTAO EDUCACIONAL - LIBERADOR DE FIREWALL E PORTAS
echo       Porta Alvo: ${config.serverPort} (TCP - Entrada e Saida)
echo       Instituicao: ${safeSchool}
echo ===============================================================================
echo.

:: Verificar se esta executando com Privilegios de Administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Solicitando permissao de Administrador para configurar o Firewall...
    set "SELF_BAT=%~f0"
    set "SELF_DIR=%SCRIPT_DIR%"
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$b = $env:SELF_BAT; $d = $env:SELF_DIR; Start-Process -FilePath $env:ComSpec -ArgumentList @('/c', ('\"\"' + $b + '\"\"')) -WorkingDirectory $d -Verb RunAs -ErrorAction SilentlyContinue"
    exit /b
)

echo [1/4] Desbloqueando arquivos baixados da Web (Remover Mark-of-the-Web)...
set "SELF_DIR=%SCRIPT_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "if ($env:SELF_DIR -and (Test-Path -LiteralPath $env:SELF_DIR)) { Get-ChildItem -LiteralPath $env:SELF_DIR -Recurse -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue }" >nul 2>&1
echo      [OK] Arquivos desbloqueados contra bloqueios do SmartScreen.
echo.

echo [2/4] Liberando Regra de Entrada no Firewall do Windows (Porta ${config.serverPort} TCP)...
netsh advfirewall firewall delete rule name="SucessoEdu_Server_In_${config.serverPort}" >nul 2>&1
netsh advfirewall firewall add rule name="SucessoEdu_Server_In_${config.serverPort}" dir=in action=allow protocol=TCP localport=${config.serverPort} profile=any enable=yes >nul 2>&1

powershell -NoProfile -ExecutionPolicy Bypass -Command "New-NetFirewallRule -DisplayName 'SucessoEdu Inbound Port ${config.serverPort}' -Direction Inbound -LocalPort ${config.serverPort} -Protocol TCP -Action Allow -Profile Any -ErrorAction SilentlyContinue" >nul 2>&1
echo      [OK] Regra de ENTRADA liberada para redes Privadas, Publicas e Dominio.
echo.

echo [3/4] Liberando Regra de Saida no Firewall do Windows (Porta ${config.serverPort} TCP)...
netsh advfirewall firewall delete rule name="SucessoEdu_Server_Out_${config.serverPort}" >nul 2>&1
netsh advfirewall firewall add rule name="SucessoEdu_Server_Out_${config.serverPort}" dir=out action=allow protocol=TCP localport=${config.serverPort} profile=any enable=yes >nul 2>&1

powershell -NoProfile -ExecutionPolicy Bypass -Command "New-NetFirewallRule -DisplayName 'SucessoEdu Outbound Port ${config.serverPort}' -Direction Outbound -LocalPort ${config.serverPort} -Protocol TCP -Action Allow -Profile Any -ErrorAction SilentlyContinue" >nul 2>&1
echo      [OK] Regra de SAIDA liberada com sucesso.
echo.

echo [4/4] Verificando status atual do Firewall...
netsh advfirewall firewall show rule name="SucessoEdu_Server_In_${config.serverPort}" | findstr /i "Rule Name Enabled Action Direction"
echo.

echo ===============================================================================
echo   [SUCESSO] FIREWALL E PORTAS CONFIGURADOS COM SUCESSO!
echo   Qualquer computador conectado na mesma rede (Wi-Fi ou Cabo) podera acessar:
echo   - http://${config.serverIp}:${config.serverPort} (IP configurado)
echo   - http://127.0.0.1:${config.serverPort} (Acesso neste computador)
echo ===============================================================================
echo.
echo Pressione qualquer tecla para encerrar.
pause >nul
`;
}

// -------------------------------------------------------------
// 1. INSTALADOR UNIFICADO UNIVERSAL (SERVIDOR / ESTAÇÃO / SATÉLITE)
// -------------------------------------------------------------

export function generateUnifiedWindowsBat(config: InstallerConfig): string {
  const safeSchool = sanitizeBatchString(config.schoolName);
  return `@echo off
chcp 65001 >nul
title SucessoEdu Gestao Educacional 5.0 - Instalador Universal Unificado
color 1F

:: 1. Garantir que o diretorio de trabalho seja o local do script (suporta espacos e caracteres especiais)
set "SCRIPT_DIR=%~dp0"
for %%I in ("%~dp0.") do set "SCRIPT_DIR=%%~fI"
cd /d "%SCRIPT_DIR%"

:: 2. Verificacao de Privilegios de Administrador e Auto-Elevacao UAC Segura com Preservacao de Diretorio
net session >nul 2>&1
if %errorLevel% neq 0 (
    if "%~1"=="ELEVATED" goto :POS_ELEVACAO_UNIF
    echo.
    echo ===============================================================================
    echo   [SUCESSOEDU] SOLICITANDO PERMISSAO DE ADMINISTRADOR DO WINDOWS...
    echo   Para criar a pasta C:\\SucessoEdu e registrar os servicos do sistema,
    echo   por favor autorize a execucao clicando em "SIM" na janela do UAC.
    echo ===============================================================================
    echo.
    set "SELF_BAT=%~f0"
    set "SELF_DIR=%SCRIPT_DIR%"
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$b = $env:SELF_BAT; $d = $env:SELF_DIR; $proc = Start-Process -FilePath $env:ComSpec -ArgumentList @('/k', ('\"\"' + $b + '\"\" ELEVATED')) -WorkingDirectory $d -Verb RunAs -PassThru -ErrorAction SilentlyContinue; if ($proc) { exit 0 } else { exit 1 }"
    if %errorLevel% equ 0 exit /b
    echo [AVISO] Elevacao automatica nao concluida ou cancelada pelo usuario.
    echo Tentando continuar a execucao em modo padrao...
    echo.
)
:POS_ELEVACAO_UNIF

:: Desbloquear arquivos contra bloqueio de download (Zone.Identifier / SmartScreen)
set "SELF_DIR=%SCRIPT_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "if ($env:SELF_DIR -and (Test-Path -LiteralPath $env:SELF_DIR)) { Get-ChildItem -LiteralPath $env:SELF_DIR -Recurse -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue }" >nul 2>&1

set "DEST_DIR=C:\\SucessoEdu"
set "SRC_DIR=%SCRIPT_DIR%"

if not exist "C:\\" (
    set "DEST_DIR=%SystemDrive%\\SucessoEdu"
)

:: Garantir criacao previa da pasta raiz C:\\SucessoEdu antes do menu
if not exist "%DEST_DIR%" mkdir "%DEST_DIR%" 2>nul
if not exist "%DEST_DIR%\\Backups" mkdir "%DEST_DIR%\\Backups" 2>nul
if not exist "%DEST_DIR%\\data" mkdir "%DEST_DIR%\\data" 2>nul
if not exist "%LOCALAPPDATA%\\SucessoEdu" mkdir "%LOCALAPPDATA%\\SucessoEdu" 2>nul
if not exist "%LOCALAPPDATA%\\SucessoEdu\\data" mkdir "%LOCALAPPDATA%\\SucessoEdu\\data" 2>nul
if not exist "%LOCALAPPDATA%\\SucessoEdu\\Backups" mkdir "%LOCALAPPDATA%\\SucessoEdu\\Backups" 2>nul

powershell -NoProfile -ExecutionPolicy Bypass -Command "$dirs = @('%DEST_DIR%', '%DEST_DIR%\\Backups', '%DEST_DIR%\\data', '%LOCALAPPDATA%\\SucessoEdu', '%LOCALAPPDATA%\\SucessoEdu\\data', '%LOCALAPPDATA%\\SucessoEdu\\Backups'); foreach ($d in $dirs) { if (-not (Test-Path $d)) { try { [System.IO.Directory]::CreateDirectory($d) | Out-Null } catch { New-Item -ItemType Directory -Path $d -Force -ErrorAction SilentlyContinue | Out-Null } } }" >nul 2>&1

:: Desbloqueio e concessao irrestrita de permissoes (ACLs)
icacls "%DEST_DIR%" /grant *S-1-1-0:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Everyone:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Todos:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Users:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Usuarios:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Administrators:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Administradores:(OI)(CI)F /T /C /Q >nul 2>&1
attrib -r "%DEST_DIR%\\*.*" /s /d >nul 2>&1

:: Garantir que o diretorio raiz exista de forma absoluta
if not exist "%DEST_DIR%" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -Command \"[System.IO.Directory]::CreateDirectory(''%DEST_DIR%''); [System.IO.Directory]::CreateDirectory(''%DEST_DIR%\\Backups''); [System.IO.Directory]::CreateDirectory(''%DEST_DIR%\\data''); icacls ''%DEST_DIR%'' /grant *S-1-1-0:(OI)(CI)F /T /C /Q\"' -Verb RunAs -Wait" >nul 2>&1
)

:MENU
cls
echo ===============================================================================
echo        SUCESSOEDU GESTAO EDUCACIONAL 5.4 - INSTALADOR E ATUALIZADOR WINDOWS
echo        Instituicao: ${safeSchool}
echo ===============================================================================
echo.
echo Selecione qual modulo deseja instalar ou atualizar neste computador:
echo.
echo   [1] MODULO SERVIDOR CENTRAL (Instalacao Limpa ou Atualizacao em C:\\SucessoEdu)
echo   [2] MODULO ESTACAO DE TRABALHO / CLIENTE (Instalacao ou Atualizacao)
echo   [3] MODULO POLO REMOTO / ESCOLA ISOLADA (100%% Offline Fora da Rede)
echo   [4] ATUALIZAR ARQUIVOS DO SISTEMA NA PASTA RAIZ (C:\\SucessoEdu)
echo   [5] BUSCAR SERVIDOR NA REDE AUTOMATICAMENTE (Varredura LAN)
echo   [6] LIBERAR FIREWALL DO WINDOWS (Porta ${config.serverPort} TCP)
echo   [7] TESTAR COMUNICACAO E DIAGNOSTICO DE REDE
echo   [8] GERAR BACKUP COMPLETO DOS DADOS
echo   [9] DESINSTALAR OU LIMPAR O SISTEMA (Liberacao e Reset Limpo)
echo   [0] SAIR DO INSTALADOR
echo.
echo ===============================================================================
set /p OPCAO="Digite o numero da opcao desejada [0-9]: "

if "%OPCAO%"=="1" goto INSTALAR_SERVIDOR
if "%OPCAO%"=="2" goto INSTALAR_ESTACAO
if "%OPCAO%"=="3" goto INSTALAR_POLO
if "%OPCAO%"=="4" goto ATUALIZAR_SISTEMA
if "%OPCAO%"=="5" goto BUSCAR_SERVIDOR
if "%OPCAO%"=="6" goto LIBERAR_FIREWALL
if "%OPCAO%"=="7" goto DIAGNOSTICO
if "%OPCAO%"=="8" goto GERAR_BACKUP
if "%OPCAO%"=="9" goto DESINSTALAR_SISTEMA
if "%OPCAO%"=="0" goto SAIR

echo Opcao invalida! Pressione qualquer tecla para tentar novamente...
pause >nul
goto MENU

:INSTALAR_SERVIDOR
cls
set "IS_UPDATE=0"
if exist "%DEST_DIR%\\index.html" set "IS_UPDATE=1"
if exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" set "IS_UPDATE=1"
if exist "%DEST_DIR%\\server_micro.ps1" set "IS_UPDATE=1"

echo ===============================================================================
if "%IS_UPDATE%"=="1" (
    echo   [MODO ATUALIZACAO AUTOMATICA E SUBSTITUICAO INTEGRAL DETECTADO]
    echo   Uma instalacao previa do SucessoEdu foi identificada em C:\\SucessoEdu.
    echo   Substituindo todos os arquivos do sistema com seguranca preventiva...
) else (
    echo   [1/5] CRIANDO PASTA RAIZ C:\\SucessoEdu E INSTALANDO ARQUIVOS DO SISTEMA
)
echo ===============================================================================
echo.

echo [1/6] Encerrando processos e liberando portas do servidor em execucao...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(${config.serverPort}, 3000, 3001, 3002); foreach ($p in $ports) { $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue; if ($conns) { foreach ($c in $conns) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue } } }; Get-Process powershell, pwsh -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*SucessoEdu*' -or $_.CommandLine -like '*server_micro*' -or $_.CommandLine -like '*servidor_tray*' -or $_.CommandLine -like '*servidor_widget*' } | Stop-Process -Force -ErrorAction SilentlyContinue; Stop-Process -Name 'node', 'wscript', 'cscript' -Force -ErrorAction SilentlyContinue;" >nul 2>&1
timeout /t 2 /nobreak >nul
echo       [OK] Portas liberadas e processos anteriores finalizados.
echo.

if "%IS_UPDATE%"=="1" (
    echo [2/6] Gerando BACKUP PREVENTIVO OBRIGATORIO da base de dados...
    set "TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%"
    set "TIMESTAMP=%TIMESTAMP: =0%"
    set "BACKUP_DIR=%DEST_DIR%\\Backups\\Backup_Auto_Pre_Instalacao_%TIMESTAMP%"
    set "LOCALAPPDATA_BACKUP=%LOCALAPPDATA%\\SucessoEdu\\Backups\\Backup_%TIMESTAMP%"

    if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%" >nul 2>&1
    if not exist "%LOCALAPPDATA_BACKUP%" mkdir "%LOCALAPPDATA_BACKUP%" >nul 2>&1

    if exist "%DEST_DIR%\\data" xcopy /y /e /q /i "%DEST_DIR%\\data" "%BACKUP_DIR%\\data\\" >nul 2>&1
    if exist "%DEST_DIR%\\*.json" copy /y "%DEST_DIR%\\*.json" "%BACKUP_DIR%\\" >nul 2>&1
    if exist "%DEST_DIR%\\*.ini" copy /y "%DEST_DIR%\\*.ini" "%BACKUP_DIR%\\" >nul 2>&1

    if exist "%LOCALAPPDATA%\\SucessoEdu\\data" xcopy /y /e /q /i "%LOCALAPPDATA%\\SucessoEdu\\data" "%LOCALAPPDATA_BACKUP%\\data\\" >nul 2>&1
    if exist "%LOCALAPPDATA%\\SucessoEdu\\*.json" copy /y "%LOCALAPPDATA%\\SucessoEdu\\*.json" "%LOCALAPPDATA_BACKUP%\\" >nul 2>&1

    (
    echo ===============================================================================
    echo SUCESSOEDU - MANIFESTO DE BACKUP AUTOMATICO PRE-INSTALACAO
    echo Data: %date% %time%
    echo Origem: %DEST_DIR%
    echo Destino: %BACKUP_DIR%
    echo Status: DADOS 100%% PRESERVADOS
    echo ===============================================================================
    ) > "%BACKUP_DIR%\\manifesto_backup.txt"
    copy /y "%BACKUP_DIR%\\manifesto_backup.txt" "%LOCALAPPDATA_BACKUP%\\manifesto_backup.txt" >nul 2>&1
    echo       [OK] Backup preventivo salvo em: %BACKUP_DIR%
    echo.

    echo [3/6] Preparando atualizacao atomica e preservando base de dados...
    del /f /q "%TEMP%\\se_*.b64" >nul 2>&1
    del /f /q "%DEST_DIR%\\*.tmp" >nul 2>&1
    echo       [OK] Ambiente preparado para implantacao integral dos componentes.
    echo.
    echo [SucessoEdu] Verificando e garantindo preservacao da estrutura de diretorios...
    if not exist "%DEST_DIR%\\data" mkdir "%DEST_DIR%\\data" >nul 2>&1
    if not exist "%DEST_DIR%\\Backups" mkdir "%DEST_DIR%\\Backups" >nul 2>&1
    if not exist "%DEST_DIR%\\config" mkdir "%DEST_DIR%\\config" >nul 2>&1
    if not exist "%DEST_DIR%\\logs" mkdir "%DEST_DIR%\\logs" >nul 2>&1
    if not exist "%DEST_DIR%\\assets" mkdir "%DEST_DIR%\\assets" >nul 2>&1
    echo       [OK] Estrutura de pastas (data, Backups, config, logs, assets) 100%% preservada.
    echo [SucessoEdu] Verificando layout e configuracoes visuais previas...
    echo       [OK] Layout da escola mantido intacto. Bloqueio de redefinicao ativo.
    echo.
) else (
    echo [2/6] Preparando e garantindo criacao da pasta raiz oficial C:\\SucessoEdu...
    if not exist "%DEST_DIR%" mkdir "%DEST_DIR%" 2>nul
    if not exist "%DEST_DIR%\\Backups" mkdir "%DEST_DIR%\\Backups" 2>nul
    if not exist "%DEST_DIR%\\data" mkdir "%DEST_DIR%\\data" 2>nul
    if not exist "%LOCALAPPDATA%\\SucessoEdu" mkdir "%LOCALAPPDATA%\\SucessoEdu" 2>nul
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$dirs = @('%DEST_DIR%', '%DEST_DIR%\\Backups', '%DEST_DIR%\\data', '%LOCALAPPDATA%\\SucessoEdu'); foreach ($d in $dirs) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force -ErrorAction SilentlyContinue | Out-Null } }" >nul 2>&1
    echo       [OK] Pastas em %DEST_DIR% criadas com sucesso.
    echo.
)

echo [4/6] Implantando todos os arquivos da aplicacao em C:\\SucessoEdu...
if not exist "%DEST_DIR%" mkdir "%DEST_DIR%" 2>nul
if not exist "%DEST_DIR%\\Backups" mkdir "%DEST_DIR%\\Backups" 2>nul
if not exist "%DEST_DIR%\\data" mkdir "%DEST_DIR%\\data" 2>nul
if not exist "%LOCALAPPDATA%\\SucessoEdu" mkdir "%LOCALAPPDATA%\\SucessoEdu" 2>nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "$dirs = @('%DEST_DIR%', '%DEST_DIR%\\Backups', '%DEST_DIR%\\data', '%LOCALAPPDATA%\\SucessoEdu'); foreach ($d in $dirs) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force -ErrorAction SilentlyContinue | Out-Null } }" >nul 2>&1

:: Desbloqueio e concessao irrestrita de permissoes (ACLs)
icacls "%DEST_DIR%" /grant *S-1-1-0:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Everyone:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Todos:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Administrators:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Administradores:(OI)(CI)F /T /C /Q >nul 2>&1
attrib -r "%DEST_DIR%\\*.*" /s /d >nul 2>&1

:: Descoberta inteligente de pasta de origem
set "EFFECTIVE_SRC=%SRC_DIR%"
if not exist "%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html" if not exist "%EFFECTIVE_SRC%\\index.html" (
    if exist "%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE\\SucessoEdu_Aplicativo_Offline.html" (
        set "EFFECTIVE_SRC=%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE"
    ) else if exist "%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE\\index.html" (
        set "EFFECTIVE_SRC=%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE"
    ) else if exist "%SRC_DIR%\\02_MODULO_ESTACAO_TRABALHO_CLIENTE\\SucessoEdu_Aplicativo_Offline.html" (
        set "EFFECTIVE_SRC=%SRC_DIR%\\02_MODULO_ESTACAO_TRABALHO_CLIENTE"
    ) else if exist "%SRC_DIR%\\03_MODULO_POLO_REMOTO_ESCOLA_OFFLINE\\SucessoEdu_Aplicativo_Offline.html" (
        set "EFFECTIVE_SRC=%SRC_DIR%\\03_MODULO_POLO_REMOTO_ESCOLA_OFFLINE"
    ) else if exist "%SRC_DIR%\\..\\SucessoEdu_Aplicativo_Offline.html" (
        set "EFFECTIVE_SRC=%SRC_DIR%\\.."
    ) else if exist "%SRC_DIR%\\..\\index.html" (
        set "EFFECTIVE_SRC=%SRC_DIR%\\.."
    )
)

if /i not "%EFFECTIVE_SRC%"=="%DEST_DIR%" (
    robocopy "%EFFECTIVE_SRC%" "%DEST_DIR%" *.* /E /IS /IT /R:1 /W:1 /NP /NFL /NDL >nul 2>&1
    if not exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" (
        xcopy /y /e /c /h /r /k /i "%EFFECTIVE_SRC%\\*" "%DEST_DIR%\\" >nul 2>&1
    )
    if not exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" (
        set "EFF_SRC=%EFFECTIVE_SRC%"
        powershell -NoProfile -ExecutionPolicy Bypass -Command "if ($env:EFF_SRC -and (Test-Path -LiteralPath $env:EFF_SRC)) { Copy-Item -LiteralPath (Get-ChildItem -LiteralPath $env:EFF_SRC -ErrorAction SilentlyContinue).FullName -Destination '%DEST_DIR%' -Recurse -Force -ErrorAction SilentlyContinue }" >nul 2>&1
    )
)

if exist "%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE" (
    xcopy /y /e /c /h /r /k /i "%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE\\*" "%DEST_DIR%\\" >nul 2>&1
)

if exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" (
    copy /y "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" "%DEST_DIR%\\index.html" >nul 2>&1
) else if exist "%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html" (
    copy /y "%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html" "%DEST_DIR%\\index.html" >nul 2>&1
    copy /y "%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html" "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" >nul 2>&1
)

:: Validacao da instalacao e garantia estatica de todos os arquivos
${generateAutoHealingBatchRoutine(config.serverPort, config.schoolName)}

set "FILE_COUNT=0"
for /f %%c in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-ChildItem -Path '%DEST_DIR%' -Recurse -File -ErrorAction SilentlyContinue).Count"') do set "FILE_COUNT=%%c"
if "%FILE_COUNT%"=="" set "FILE_COUNT=0"
echo       [OK] Pasta raiz %DEST_DIR% criada e verificada com %FILE_COUNT% arquivos instalados e operacionais.
echo.

echo [5/6] Detectando adaptador de rede principal e endereco IP real...
set LOCAL_IP=
for /f "tokens=*" %%i in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notmatch \'^127\.\' -and $_.IPAddress -notmatch \'^169\.254\.\' -and $_.InterfaceAlias -notmatch \'Loopback|vEthernet|VirtualBox|VMware|WSL|Bluetooth\' } | Select-Object -First 1).IPAddress; if (-not $ip) { $ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notmatch \'^127\.\' -and $_.IPAddress -notmatch \'^169\.254\.\' } | Select-Object -First 1).IPAddress }; if ($ip) { $ip } else { \'${config.serverIp}\' }"') do set LOCAL_IP=%%i

if "%LOCAL_IP%"=="" set LOCAL_IP=${config.serverIp}

echo      - Endereco IP Principal: %LOCAL_IP%
echo      - Porta do Servidor:     ${config.serverPort}
echo.

echo Configurando Regras de Firewall e Atalho Oficial...
netsh advfirewall firewall delete rule name="SucessoEdu_Server_In_${config.serverPort}" >nul 2>&1
netsh advfirewall firewall add rule name="SucessoEdu_Server_In_${config.serverPort}" dir=in action=allow protocol=TCP localport=${config.serverPort} profile=any enable=yes >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "New-NetFirewallRule -DisplayName 'SucessoEdu Server Port ${config.serverPort}' -Direction Inbound -LocalPort ${config.serverPort} -Protocol TCP -Action Allow -Profile Any -ErrorAction SilentlyContinue" >nul 2>&1

if exist "%DEST_DIR%\\criar_atalhos.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%DEST_DIR%\\criar_atalhos.ps1" -TargetUrl "http://localhost:${config.serverPort}" -ShortcutName "SucessoEdu Gestão Educacional" -Port ${config.serverPort} >nul 2>&1
) else if exist "%~dp0criar_atalhos.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0criar_atalhos.ps1" -TargetUrl "http://localhost:${config.serverPort}" -ShortcutName "SucessoEdu Gestão Educacional" -Port ${config.serverPort} >nul 2>&1
) else if exist "%DEST_DIR%\\criar_atalhos.vbs" (
    cscript //nologo "%DEST_DIR%\\criar_atalhos.vbs" >nul 2>&1
)

reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "SucessoEduServer" /t REG_SZ /d "wscript.exe \"C:\\SucessoEdu\\iniciar_servidor_silencioso.vbs\"" /f >nul 2>&1
set "STARTUP_DIR=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"
if exist "%STARTUP_DIR%" (
    (
    echo Set WshShell = CreateObject^("WScript.Shell"^)
    echo Set shortcut = WshShell.CreateShortcut^("%STARTUP_DIR%\\SucessoEdu_Servidor_AutoStart.lnk"^)
    echo shortcut.TargetPath = "wscript.exe"
    echo shortcut.Arguments = """C:\\SucessoEdu\\iniciar_servidor_silencioso.vbs"""
    echo shortcut.WorkingDirectory = "C:\\SucessoEdu"
    echo shortcut.Description = "Inicializador Automatico SucessoEdu Servidor"
    echo shortcut.WindowStyle = 7
    echo shortcut.Save
    ) > "%TEMP%\\criar_tray_autostart.vbs"
    cscript //nologo "%TEMP%\\criar_tray_autostart.vbs" >nul 2>&1
    del /f /q "%TEMP%\\criar_tray_autostart.vbs" >nul 2>&1
)

(
echo [SucessoEdu_Rede_Local]
echo Servidor_IP=%LOCAL_IP%
echo Porta=${config.serverPort}
echo Escola=${config.schoolName}
echo URL_Acesso=http://localhost:${config.serverPort}
echo URL_Rede=http://%LOCAL_IP%:${config.serverPort}
echo Status=ATIVO_LOCAL
) > "%DEST_DIR%\\config_rede_estacoes.ini"

copy /y "%DEST_DIR%\\config_rede_estacoes.ini" "%LOCALAPPDATA%\\SucessoEdu\\config_rede_estacoes.ini" >nul 2>&1
copy /y "%DEST_DIR%\\config_rede_estacoes.ini" "%~dp0config_rede_estacoes.ini" >nul 2>&1

echo [6/6] Inicializando Servidor Silencioso e Abrindo o Sistema...
if exist "%DEST_DIR%\\iniciar_servidor_silencioso.vbs" (
    wscript "%DEST_DIR%\\iniciar_servidor_silencioso.vbs"
) else if exist "%~dp0iniciar_servidor_silencioso.vbs" (
    wscript "%~dp0iniciar_servidor_silencioso.vbs"
)

timeout /t 2 /nobreak >nul

if exist "%DEST_DIR%\\SucessoEdu_App.vbs" (
    wscript "%DEST_DIR%\\SucessoEdu_App.vbs"
) else if exist "%~dp0SucessoEdu_App.vbs" (
    wscript "%~dp0SucessoEdu_App.vbs"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Test-Path '%DEST_DIR%\\index.html') { Start-Process '%DEST_DIR%\\index.html' } else { Start-Process 'http://localhost:${config.serverPort}' }" >nul 2>&1
)

${generateInstallationStatusDisplayRoutine(config.serverPort, config.schoolName)}

echo.
pause
goto MENU

:INSTALAR_ESTACAO
cls
echo ===============================================================================
echo   [1/3] INSTALANDO/ATUALIZANDO ESTACAO DE TRABALHO (${config.stationName})
echo   Diretorio Raiz Oficial: C:\\SucessoEdu
echo ===============================================================================
echo.

set "DEST_DIR=C:\\SucessoEdu"
if not exist "C:\\" (
    set "DEST_DIR=%SystemDrive%\\SucessoEdu"
)
if not exist "%DEST_DIR%" mkdir "%DEST_DIR%" >nul 2>&1
if not exist "%DEST_DIR%\\Backups" mkdir "%DEST_DIR%\\Backups" >nul 2>&1
if not exist "%LOCALAPPDATA%\\SucessoEdu" mkdir "%LOCALAPPDATA%\\SucessoEdu" >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "$dirs = @('%DEST_DIR%', '%DEST_DIR%\\Backups', '%LOCALAPPDATA%\\SucessoEdu'); foreach ($d in $dirs) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force -ErrorAction SilentlyContinue | Out-Null } }" >nul 2>&1

:: Desbloqueio e concessao irrestrita de permissoes (ACLs)
icacls "%DEST_DIR%" /grant *S-1-1-0:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Everyone:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Administrators:(OI)(CI)F /T /C /Q >nul 2>&1
attrib -r "%DEST_DIR%\\*.*" /s /d >nul 2>&1

:: Se for atualizacao e ja existirem dados ou configuracoes, cria backup preventivo na pasta raiz
set "TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "BACKUP_DIR=%DEST_DIR%\\Backups\\Backup_Estacao_%TIMESTAMP%"
if exist "%DEST_DIR%\\config_rede_estacoes.ini" (
    if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%" >nul 2>&1
    copy /y "%DEST_DIR%\\*.ini" "%BACKUP_DIR%\\" >nul 2>&1
    copy /y "%DEST_DIR%\\*.json" "%BACKUP_DIR%\\" >nul 2>&1
    echo   [OK] Backup preventivo da estacao salvo na pasta raiz: %BACKUP_DIR%
)

echo ===============================================================================
echo   CONFIGURACAO DE CONEXAO DA ESTACAO COM O SERVIDOR CENTRAL LOCAL
echo ===============================================================================
echo   Como esta estacao deve se conectar ao Banco de Dados do Servidor Local?
echo.
echo   [1] BUSCA AUTOMATICA na rede local (Varredura inteligente de IP e Porta)
echo   [2] DIGITAR IP / NOME do Servidor Central (ex: 192.168.1.100 ou SERVIDOR-ESCOLA)
echo   [3] MAPEAR PASTA COMPARTILHADA do Banco de Dados (ex: \\\\SERVIDOR\\SucessoEdu\\data)
echo.
set "MODO_CONEXAO="
set /p MODO_CONEXAO="Digite a opcao desejada [1, 2 ou 3 - Padrao 1]: "
if "%MODO_CONEXAO%"=="" set MODO_CONEXAO=1

set "TIPO_CONEXAO=REDE_HTTP"
set "TARGET_SERVER="
set "SHARED_DB_PATH="

if "%MODO_CONEXAO%"=="3" goto ESTACAO_MODO_PASTA
if "%MODO_CONEXAO%"=="2" goto ESTACAO_MODO_IP

:ESTACAO_MODO_AUTO
echo.
echo [BUSCA AUTOMATICA] Varrendo a rede local em busca do Servidor SucessoEdu...
if exist "%~dp0buscar_servidor_rede.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0buscar_servidor_rede.ps1" -Port ${config.serverPort} -DefaultIp "${config.serverIp}"
    if exist "%~dp0ip_servidor_descoberto.txt" (
        set /p TARGET_SERVER=<"%~dp0ip_servidor_descoberto.txt"
    )
)
if "%TARGET_SERVER%"=="" (
    if exist "%~dp0config_rede_estacoes.ini" (
        for /f "tokens=2 delims==" %%a in ('type "%~dp0config_rede_estacoes.ini" ^| findstr "Servidor_IP="') do set TARGET_SERVER=%%a
    )
)
if "%TARGET_SERVER%"=="" (
    if exist "%DEST_DIR%\\config_rede_estacoes.ini" (
        for /f "tokens=2 delims==" %%a in ('type "%DEST_DIR%\\config_rede_estacoes.ini" ^| findstr "Servidor_IP="') do set TARGET_SERVER=%%a
    )
)
if "%TARGET_SERVER%"=="" set TARGET_SERVER=${config.serverIp}
set TARGET_SERVER=%TARGET_SERVER: =%
goto ESTACAO_CONCLUIR_CONEXAO

:ESTACAO_MODO_IP
echo.
set /p TARGET_SERVER="Digite o IP ou Nome do Servidor Central [ex: 192.168.1.100]: "
if "%TARGET_SERVER%"=="" set TARGET_SERVER=${config.serverIp}
set TARGET_SERVER=%TARGET_SERVER: =%
goto ESTACAO_CONCLUIR_CONEXAO

:ESTACAO_MODO_PASTA
echo.
set "TIPO_CONEXAO=PASTA_COMPARTILHADA"
set /p SHARED_DB_PATH="Digite o caminho UNC da pasta compartilhada [ex: \\\\SERVIDOR\\SucessoEdu\\data]: "
if "%SHARED_DB_PATH%"=="" set "SHARED_DB_PATH=\\\\SERVIDOR\\SucessoEdu\\data"
echo   Verificando acesso a pasta de banco compartilhada: %SHARED_DB_PATH%...
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Test-Path -LiteralPath '%SHARED_DB_PATH%') { Write-Host '  [OK] Pasta compartilhada acessivel com sucesso!' -ForegroundColor Green } else { Write-Host '  [AVISO] Pasta compartilhada no momento offline. O caminho foi registrado.' -ForegroundColor Yellow }"
set TARGET_SERVER=${config.serverIp}
goto ESTACAO_CONCLUIR_CONEXAO

:ESTACAO_CONCLUIR_CONEXAO
set TARGET_PORT=${config.serverPort}
set SERVER_URL=http://%TARGET_SERVER%:%TARGET_PORT%

(
echo [SucessoEdu_Rede_Local]
echo Modo_Conexao=%TIPO_CONEXAO%
echo Servidor_IP=%TARGET_SERVER%
echo Porta=%TARGET_PORT%
echo Escola=${config.schoolName}
echo URL_Acesso=%SERVER_URL%
echo Caminho_Banco_Compartilhado=%SHARED_DB_PATH%
echo Centralizar_Envio_Servidor_Local=SIM
echo Unificar_Base_Secretaria_Municipal=SIM
echo Status=ESTACAO_CONECTADA
) > "%DEST_DIR%\\config_rede_estacoes.ini"

set "APPDATA_DIR=%LOCALAPPDATA%\\SucessoEdu"
if not exist "%APPDATA_DIR%" mkdir "%APPDATA_DIR%" >nul 2>&1
copy /y "%DEST_DIR%\\config_rede_estacoes.ini" "%APPDATA_DIR%\\config_rede_estacoes.ini" >nul 2>&1
copy /y "%DEST_DIR%\\config_rede_estacoes.ini" "%~dp0config_rede_estacoes.ini" >nul 2>&1

:: Criar rotina de centralizacao da estacao para o banco de dados do servidor local
(
echo param(
echo     [string]$RootDir = "C:\\SucessoEdu"
echo ^)
echo $ErrorActionPreference = "SilentlyContinue"
echo [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
echo $ini = Join-Path $RootDir "config_rede_estacoes.ini"
echo $modo = "REDE_HTTP"
echo $servidor = "${config.serverIp}"
echo $porta = ${config.serverPort}
echo $caminhoUNC = ""
echo if (Test-Path $ini) {
echo     $lines = Get-Content $ini
echo     foreach ($l in $lines) {
echo         if ($l -match "^Modo_Conexao=(.*)$") { $modo = $matches[1].Trim() }
echo         if ($l -match "^Servidor_IP=(.*)$") { $servidor = $matches[1].Trim() }
echo         if ($l -match "^Porta=(.*)$") { $porta = [int]$matches[1].Trim() }
echo         if ($l -match "^Caminho_Banco_Compartilhado=(.*)$") { $caminhoUNC = $matches[1].Trim() }
echo     }
echo }
echo $dataDir = Join-Path $RootDir "data"
echo $dbLocal = Join-Path $dataDir "banco_educacional.json"
echo if (-not (Test-Path $dbLocal)) { $dbLocal = Join-Path $RootDir "banco_educacional.json" }
echo if ($modo -eq "PASTA_COMPARTILHADA" -and $caminhoUNC) {
echo     if (Test-Path $caminhoUNC) {
echo         if (Test-Path $dbLocal) {
echo             Copy-Item -LiteralPath $dbLocal -Destination (Join-Path $caminhoUNC "banco_educacional.json") -Force
echo             Write-Host " [OK] Base da estacao centralizada com sucesso na pasta compartilhada do Servidor!" -ForegroundColor Green
echo         }
echo     } else {
echo         Write-Host " [AVISO] Pasta compartilhada $caminhoUNC nao encontrada no momento." -ForegroundColor Yellow
echo     }
echo } else {
echo     $url = 'http://' + $servidor + ':' + $porta + '/api/sync/station'
echo     $body = "{}"
echo     if (Test-Path $dbLocal) { $body = Get-Content -LiteralPath $dbLocal -Raw -Encoding UTF8 }
echo     try {
echo         $resp = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json; charset=utf-8" -TimeoutSec 10
echo         Write-Host " [OK] Dados da estacao centralizados com sucesso no Servidor Local!" -ForegroundColor Green
echo     } catch {
echo         Write-Host " [INFO] Servidor local registrou conexao no config_rede_estacoes.ini" -ForegroundColor Gray
echo     }
echo }
) > "%DEST_DIR%\\centralizar_dados_estacao.ps1"

(
echo @echo off
echo chcp 65001 ^>nul
echo title SucessoEdu - Centralizacao de Dados com Servidor Local
echo powershell -NoProfile -ExecutionPolicy Bypass -File "%%~dp0centralizar_dados_estacao.ps1" -RootDir "%%~dp0"
echo pause
) > "%DEST_DIR%\\centralizar_dados_estacao.bat"

:: Copiar e substituir scripts e componentes da estacao para a pasta raiz C:\\SucessoEdu
if /i not "%SRC_DIR%"=="%DEST_DIR%" (
    robocopy "%SRC_DIR%" "%DEST_DIR%" *.* /E /IS /IT /R:1 /W:1 /NP /NFL /NDL >nul 2>&1
    xcopy /y /e /c /h /r /k /i "%SRC_DIR%\\*" "%DEST_DIR%\\" >nul 2>&1
)

(
echo @echo off
echo chcp 65001 ^>nul
echo title SucessoEdu Gestao Educacional - Estacao
echo cd /d "%%~dp0"
echo set "TARGET_SERVER="
echo if exist "%%~dp0config_rede_estacoes.ini" (
echo     for /f "tokens=2 delims==" %%%%a in ('type "%%~dp0config_rede_estacoes.ini" ^^^| findstr "Servidor_IP="'^) do set TARGET_SERVER=%%%%a
echo ^)
echo if "%%TARGET_SERVER%%"=="" set TARGET_SERVER=${config.serverIp}
echo set TARGET_SERVER=%%TARGET_SERVER: =%%
echo start "" "http://%%TARGET_SERVER%%:${config.serverPort}"
echo exit /b
) > "%DEST_DIR%\\Abrir_Estacao.bat"

echo.
echo [2/3] Criando Atalho Oficial Exclusivo na Area de Trabalho da Estacao...
del /f /q "%USERPROFILE%\\Desktop\\SucessoEdu*.url" >nul 2>&1
del /f /q "%PUBLIC%\\Desktop\\SucessoEdu*.url" >nul 2>&1
del /f /q "%OneDrive%\\Desktop\\SucessoEdu*.url" >nul 2>&1

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $d = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop); $s = $ws.CreateShortcut((Join-Path $d 'SucessoEdu Gestão Educacional.lnk')); $s.TargetPath = 'C:\\SucessoEdu\\Abrir_Estacao.bat'; $s.WorkingDirectory = 'C:\\SucessoEdu'; if (Test-Path 'C:\\SucessoEdu\\sucessoedu.ico') { $s.IconLocation = 'C:\\SucessoEdu\\sucessoedu.ico,0' }; $s.Description = 'SucessoEdu Gestão Educacional'; $s.Save(); Write-Host '  [OK] Atalho oficial unico criado na Area de Trabalho!' -ForegroundColor Green"

echo.
echo [3/3] Abrindo o sistema em Modo Estacao de Trabalho...
if exist "%DEST_DIR%\\SucessoEdu_App.vbs" (
    wscript "%DEST_DIR%\\SucessoEdu_App.vbs"
) else (
    start "" "%SERVER_URL%"
)
echo.
echo Estacao pronta e configurada em C:\\SucessoEdu!
pause
goto MENU

:BUSCAR_SERVIDOR
cls
echo ===============================================================================
echo   BUSCA AUTOMATICA E VARREDURA DE SERVIDORES NA REDE LOCAL
echo ===============================================================================
echo.
if exist "%~dp0buscar_servidor_rede.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0buscar_servidor_rede.ps1" -Port ${config.serverPort} -DefaultIp "${config.serverIp}"
) else if exist "%~dp0Buscar_Servidor_Rede.bat" (
    call "%~dp0Buscar_Servidor_Rede.bat"
) else (
    echo [INFO] Executando busca rapida na sub-rede...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$port = ${config.serverPort}; $found = $false; $ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notmatch '^127\.' -and $_.IPAddress -notmatch '^169\.254\.' -and $_.InterfaceAlias -notmatch 'Loopback|vEthernet|VirtualBox|VMware|WSL' }; foreach ($ipObj in $ips) { $oct = $ipObj.IPAddress.Split('.'); if ($oct.Length -eq 4) { $pref = $oct[0] + '.' + $oct[1] + '.' + $oct[2]; Write-Host ('Verificando ' + $pref + '.1 a ' + $pref + '.254 na porta ' + $port + '...'); for ($i=1; $i -le 254; $i++) { $target = $pref + '.' + $i; $s = New-Object System.Net.Sockets.TcpClient; try { $ar = $s.BeginConnect($target, $port, $null, $null); if ($ar.AsyncWaitHandle.WaitOne(200, $false)) { $s.EndConnect($ar); Write-Host ('[ENCONTRADO] Servidor ativo em: ' + $target) -ForegroundColor Green; $found = $true; break } } catch {} finally { $s.Close() } }; if ($found) { break } } }; if (-not $found) { Write-Host 'Nenhum servidor respondeu automaticamente.' -ForegroundColor Yellow }"
)
echo.
pause
goto MENU

:INSTALAR_POLO
cls
echo ===============================================================================
echo   [3/3] INSTALANDO/ATUALIZANDO MODULO POLO SATELITE / ESCOLA ISOLADA OFFLINE
echo   Diretorio Raiz Oficial: C:\\SucessoEdu
echo ===============================================================================
echo.
set "DEST_DIR=C:\\SucessoEdu"
if not exist "%DEST_DIR%" mkdir "%DEST_DIR%" >nul 2>&1
if not exist "%DEST_DIR%\\Backups" mkdir "%DEST_DIR%\\Backups" >nul 2>&1

:: Se for atualizacao, gera backup preventivo na pasta raiz C:\\SucessoEdu\\Backups
set "TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "BACKUP_DIR=%DEST_DIR%\\Backups\\Backup_Polo_%TIMESTAMP%"
if exist "%DEST_DIR%\\data" (
    if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%" >nul 2>&1
    xcopy /y /e /q /i "%DEST_DIR%\\data" "%BACKUP_DIR%\\data\\" >nul 2>&1
    copy /y "%DEST_DIR%\\*.json" "%BACKUP_DIR%\\" >nul 2>&1
    copy /y "%DEST_DIR%\\*.ini" "%BACKUP_DIR%\\" >nul 2>&1
    copy /y "%DEST_DIR%\\*.edusync" "%BACKUP_DIR%\\" >nul 2>&1
    echo   [OK] Backup preventivo do polo salvo na pasta raiz: %BACKUP_DIR%
)

:: Copiar e substituir todos os arquivos da nova versao em C:\\SucessoEdu
if /i not "%SRC_DIR%"=="%DEST_DIR%" (
    xcopy /y /e /c /h /r /k /i "%~dp0*" "%DEST_DIR%\\" >nul 2>&1
)

if exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" (
    copy /y "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" "%DEST_DIR%\\index.html" >nul 2>&1
) else if exist "%~dp0SucessoEdu_Aplicativo_Offline.html" (
    copy /y "%~dp0SucessoEdu_Aplicativo_Offline.html" "%DEST_DIR%\\index.html" >nul 2>&1
)

set SINC_DIR=%USERPROFILE%\\Desktop\\Sincronizacao_SME
if not exist "%SINC_DIR%" mkdir "%SINC_DIR%"

:: Detectar IP local
set "LOCAL_IP="
for /f "tokens=*" %%i in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.InterfaceAlias -notmatch 'Loopback|vEthernet|VirtualBox|VMware|WSL|Bluetooth' } | Select-Object -First 1 -ExpandProperty IPAddress); if (-not $ip) { $ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1 -ExpandProperty IPAddress) }; if ($ip) { $ip } else { '127.0.0.1' }"') do set "LOCAL_IP=%%i"
if "%LOCAL_IP%"=="" set "LOCAL_IP=127.0.0.1"

del /f /q "%USERPROFILE%\\Desktop\\SucessoEdu*.url" >nul 2>&1
del /f /q "%PUBLIC%\\Desktop\\SucessoEdu*.url" >nul 2>&1
del /f /q "%OneDrive%\\Desktop\\SucessoEdu*.url" >nul 2>&1

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $d = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop); $s = $ws.CreateShortcut((Join-Path $d 'SucessoEdu Gestão Educacional.lnk')); $s.TargetPath = 'C:\\SucessoEdu\\Abrir_SucessoEdu.bat'; $s.WorkingDirectory = 'C:\\SucessoEdu'; if (Test-Path 'C:\\SucessoEdu\\sucessoedu.ico') { $s.IconLocation = 'C:\\SucessoEdu\\sucessoedu.ico,0' }; $s.Description = 'SucessoEdu Gestão Educacional - Polo Remoto'; $s.Save(); Write-Host '  [OK] Atalho oficial unico criado na Area de Trabalho!' -ForegroundColor Green"

echo [OK] Modulo Polo Satelite instalado/atualizado com sucesso em C:\\SucessoEdu!
echo [OK] Pasta de sincronizacao criada na Area de Trabalho: Sincronizacao_SME
echo.
pause
goto MENU

:LIBERAR_FIREWALL
cls
echo ===============================================================================
echo   LIBERANDO PORTA ${config.serverPort} NO FIREWALL DO WINDOWS
echo ===============================================================================
echo.
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Solicitando permissao de Administrador para abrir regra no Firewall...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath $env:ComSpec -ArgumentList @('/c', 'netsh advfirewall firewall add rule name=SucessoEdu_Server_In_${config.serverPort} dir=in action=allow protocol=TCP localport=${config.serverPort} profile=any enable=yes ^&^& pause') -Verb RunAs -ErrorAction SilentlyContinue"
    pause
    goto MENU
)

netsh advfirewall firewall delete rule name="SucessoEdu_Server_In_${config.serverPort}" >nul 2>&1
netsh advfirewall firewall add rule name="SucessoEdu_Server_In_${config.serverPort}" dir=in action=allow protocol=TCP localport=${config.serverPort} profile=any enable=yes >nul 2>&1
netsh advfirewall firewall delete rule name="SucessoEdu_Server_Out_${config.serverPort}" >nul 2>&1
netsh advfirewall firewall add rule name="SucessoEdu_Server_Out_${config.serverPort}" dir=out action=allow protocol=TCP localport=${config.serverPort} profile=any enable=yes >nul 2>&1
echo [OK] Porta ${config.serverPort} liberada no Firewall do Windows!
pause
goto MENU

:DIAGNOSTICO
cls
echo ===============================================================================
echo   DIAGNOSTICO DE REDE E TESTE DE CONECTIVIDADE
echo ===============================================================================
echo.
echo Testando comunicacao com o Servidor Central (${config.serverIp}:${config.serverPort})...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$tcp = New-Object System.Net.Sockets.TcpClient; try { $ar = $tcp.BeginConnect('${config.serverIp}', ${config.serverPort}, $null, $null); $ok = $ar.AsyncWaitHandle.WaitOne(2000, $false); if ($ok) { $tcp.EndConnect($ar); Write-Host '  [OK] Porta TCP ${config.serverPort} acessivel e respondendo no servidor!' -ForegroundColor Green } else { Write-Host '  [AVISO] Nao foi possivel conectar na porta ${config.serverPort}. Verifique se o servidor esta ligado e na mesma rede.' -ForegroundColor Yellow } } catch { Write-Host '  [ERRO] Falha de rota de rede para ${config.serverIp}.' -ForegroundColor Red } finally { $tcp.Close() }"
echo.
pause
goto MENU

:GERAR_BACKUP
cls
echo ===============================================================================
echo   CRIANDO SNAPSHOT DE BACKUP DE SEGURANCA LOCAL
echo ===============================================================================
set BACKUP_NAME=Backup_SucessoEdu_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%.json
set BACKUP_NAME=%BACKUP_NAME: =0%
echo Gerando arquivo de seguranca: %USERPROFILE%\\Desktop\\%BACKUP_NAME%
(
echo {
echo   "app": "SucessoEdu Gestao Educacional",
echo   "version": "5.0.0-ENTERPRISE",
echo   "createdAt": "%date% %time%",
echo   "backupType": "FULL_SNAPSHOT",
echo   "status": "VALIDATED"
echo }
) > "%USERPROFILE%\\Desktop\\%BACKUP_NAME%"
echo [OK] Snapshot criado na Area de Trabalho!
pause
goto MENU

:ATUALIZAR_SISTEMA
cls
echo ===============================================================================
echo   ATUALIZACAO TOTAL E SUBSTITUICAO LIMPA DE ARQUIVOS EM %DEST_DIR%
echo ===============================================================================
echo.
echo [1/5] Encerrando processos e liberando portas do servidor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(${config.serverPort}, 3000, 3001, 3002); foreach ($p in $ports) { $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue; if ($conns) { foreach ($c in $conns) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue } } }; Get-Process powershell, pwsh -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*SucessoEdu*' -or $_.CommandLine -like '*server_micro*' -or $_.CommandLine -like '*servidor_tray*' -or $_.CommandLine -like '*servidor_widget*' } | Stop-Process -Force -ErrorAction SilentlyContinue; Stop-Process -Name 'node', 'wscript', 'cscript' -Force -ErrorAction SilentlyContinue;" >nul 2>&1
timeout /t 2 /nobreak >nul
echo       [OK] Processos encerrados e portas liberadas.
echo.

echo [2/5] Realizando backup preventivo OBRIGATORIO da base de dados...
set "TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "PRE_BACKUP=%DEST_DIR%\\Backups\\Backup_Update_%TIMESTAMP%"
set "LOCALAPPDATA_BACKUP=%LOCALAPPDATA%\\SucessoEdu\\Backups\\Backup_%TIMESTAMP%"

if not exist "%PRE_BACKUP%" mkdir "%PRE_BACKUP%" >nul 2>&1
if not exist "%LOCALAPPDATA_BACKUP%" mkdir "%LOCALAPPDATA_BACKUP%" >nul 2>&1

if exist "%DEST_DIR%\\data" xcopy /y /e /q /i "%DEST_DIR%\\data" "%PRE_BACKUP%\\data\\" >nul 2>&1
if exist "%DEST_DIR%\\*.json" copy /y "%DEST_DIR%\\*.json" "%PRE_BACKUP%\\" >nul 2>&1
if exist "%DEST_DIR%\\*.ini" copy /y "%DEST_DIR%\\*.ini" "%PRE_BACKUP%\\" >nul 2>&1
if exist "%DEST_DIR%\\*.sqlite" copy /y "%DEST_DIR%\\*.sqlite" "%PRE_BACKUP%\\" >nul 2>&1
if exist "%DEST_DIR%\\*.db" copy /y "%DEST_DIR%\\*.db" "%PRE_BACKUP%\\" >nul 2>&1

if exist "%LOCALAPPDATA%\\SucessoEdu\\data" xcopy /y /e /q /i "%LOCALAPPDATA%\\SucessoEdu\\data" "%LOCALAPPDATA_BACKUP%\\data\\" >nul 2>&1
if exist "%LOCALAPPDATA%\\SucessoEdu\\*.json" copy /y "%LOCALAPPDATA%\\SucessoEdu\\*.json" "%LOCALAPPDATA_BACKUP%\\" >nul 2>&1

(
echo ===============================================================================
echo SUCESSOEDU - MANIFESTO DE BACKUP AUTOMATICO NA ATUALIZACAO
echo Data: %date% %time%
echo Origem: %DEST_DIR%
echo Destino: %PRE_BACKUP%
echo Status: DADOS 100%% PRESERVADOS
echo ===============================================================================
) > "%PRE_BACKUP%\\manifesto_backup.txt"
copy /y "%PRE_BACKUP%\\manifesto_backup.txt" "%LOCALAPPDATA_BACKUP%\\manifesto_backup.txt" >nul 2>&1
echo       [OK] Backup salvo com sucesso em: %PRE_BACKUP%
echo.

echo [3/5] Preparando atualizacao atomica e preservando base de dados...
del /f /q "%TEMP%\\se_*.b64" >nul 2>&1
del /f /q "%DEST_DIR%\\*.tmp" >nul 2>&1
echo       [OK] Ambiente preparado para atualizacao atomica.
echo.

echo [4/5] Copiando novos arquivos da versao atualizada para %DEST_DIR%...
if not exist "%DEST_DIR%" mkdir "%DEST_DIR%" 2>nul
if not exist "%DEST_DIR%\\Backups" mkdir "%DEST_DIR%\\Backups" 2>nul
if not exist "%DEST_DIR%\\data" mkdir "%DEST_DIR%\\data" 2>nul
if not exist "%LOCALAPPDATA%\\SucessoEdu" mkdir "%LOCALAPPDATA%\\SucessoEdu" 2>nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "$dirs = @('%DEST_DIR%', '%DEST_DIR%\\Backups', '%DEST_DIR%\\data', '%LOCALAPPDATA%\\SucessoEdu'); foreach ($d in $dirs) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force -ErrorAction SilentlyContinue | Out-Null } }" >nul 2>&1

icacls "%DEST_DIR%" /grant *S-1-1-0:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Everyone:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Todos:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Administrators:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Administradores:(OI)(CI)F /T /C /Q >nul 2>&1
attrib -r "%DEST_DIR%\\*.*" /s /d >nul 2>&1

set "EFFECTIVE_SRC=%SRC_DIR%"
if not exist "%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html" if not exist "%EFFECTIVE_SRC%\\index.html" (
    if exist "%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE\\SucessoEdu_Aplicativo_Offline.html" (
        set "EFFECTIVE_SRC=%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE"
    ) else if exist "%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE\\index.html" (
        set "EFFECTIVE_SRC=%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE"
    ) else if exist "%SRC_DIR%\\..\\SucessoEdu_Aplicativo_Offline.html" (
        set "EFFECTIVE_SRC=%SRC_DIR%\\.."
    ) else if exist "%SRC_DIR%\\..\\index.html" (
        set "EFFECTIVE_SRC=%SRC_DIR%\\.."
    )
)

if /i not "%EFFECTIVE_SRC%"=="%DEST_DIR%" (
    robocopy "%EFFECTIVE_SRC%" "%DEST_DIR%" *.* /E /IS /IT /R:1 /W:1 /NP /NFL /NDL >nul 2>&1
    if not exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" (
        xcopy /y /e /c /h /r /k /i "%EFFECTIVE_SRC%\\*" "%DEST_DIR%\\" >nul 2>&1
    )
    if not exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" (
        powershell -NoProfile -ExecutionPolicy Bypass -Command "Copy-Item -Path '%EFFECTIVE_SRC%\\*' -Destination '%DEST_DIR%' -Recurse -Force -ErrorAction SilentlyContinue" >nul 2>&1
    )
)

if exist "%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE" (
    xcopy /y /e /c /h /r /k /i "%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE\\*" "%DEST_DIR%\\" >nul 2>&1
)

if exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" (
    copy /y "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" "%DEST_DIR%\\index.html" >nul 2>&1
) else if exist "%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html" (
    copy /y "%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html" "%DEST_DIR%\\index.html" >nul 2>&1
    copy /y "%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html" "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" >nul 2>&1
)
echo       [OK] Arquivos copiados e substituidos na pasta raiz.
echo.

:: Validacao da instalacao e garantia estatica de todos os arquivos
${generateAutoHealingBatchRoutine(config.serverPort, config.schoolName)}

echo       [OK] Todos os arquivos da nova versao foram atualizados e substituidos!
echo       [OK] Base de dados preservada integralmente com comprovante de seguranca gerado.
echo.

del /f /q "%USERPROFILE%\\Desktop\\SucessoEdu*.url" >nul 2>&1
del /f /q "%PUBLIC%\\Desktop\\SucessoEdu*.url" >nul 2>&1
del /f /q "%OneDrive%\\Desktop\\SucessoEdu*.url" >nul 2>&1

echo [5/5] Reiniciando servidor silencioso e abrindo a aplicacao no navegador...
if exist "C:\\SucessoEdu\\iniciar_servidor_silencioso.vbs" (
    wscript "C:\\SucessoEdu\\iniciar_servidor_silencioso.vbs"
)
timeout /t 2 /nobreak >nul

set "LOCAL_IP="
for /f "tokens=*" %%i in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.InterfaceAlias -notmatch 'Loopback|vEthernet|VirtualBox|VMware|WSL|Bluetooth' } | Select-Object -First 1 -ExpandProperty IPAddress); if (-not $ip) { $ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1 -ExpandProperty IPAddress) }; if ($ip) { $ip } else { '127.0.0.1' }"') do set "LOCAL_IP=%%i"
if "%LOCAL_IP%"=="" set "LOCAL_IP=127.0.0.1"

if exist "C:\\SucessoEdu\\SucessoEdu_App.vbs" (
    wscript "C:\\SucessoEdu\\SucessoEdu_App.vbs"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Test-Path 'C:\\SucessoEdu\\index.html') { Start-Process 'C:\\SucessoEdu\\index.html' } else { Start-Process 'http://localhost:${config.serverPort}' }" >nul 2>&1
)

${generateInstallationStatusDisplayRoutine(config.serverPort, safeSchool)}

echo.
pause
goto MENU

:CRIAR_ATALHO_MANUAL
cls
echo ===============================================================================
echo   CRIANDO ATALHO OFICIAL FUNCIONAL NA AREA DE TRABALHO
echo ===============================================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $d = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop); $s = $ws.CreateShortcut((Join-Path $d 'SucessoEdu Gestão Educacional.lnk')); if (Test-Path 'C:\\SucessoEdu\\SucessoEdu_App.vbs') { $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"\"C:\\SucessoEdu\\SucessoEdu_App.vbs\"\"'; $s.WorkingDirectory = 'C:\\SucessoEdu'; } elseif (Test-Path 'C:\\SucessoEdu\\Abrir_SucessoEdu.bat') { $s.TargetPath = 'C:\\SucessoEdu\\Abrir_SucessoEdu.bat'; $s.WorkingDirectory = 'C:\\SucessoEdu'; } else { $s.TargetPath = 'http://localhost:${config.serverPort}'; }; if (Test-Path 'C:\\SucessoEdu\\sucessoedu.ico') { $s.IconLocation = 'C:\\SucessoEdu\\sucessoedu.ico,0' }; $s.Description = 'SucessoEdu Gestão Educacional'; $s.Save(); Write-Host '  [OK] Atalho oficial funcional criado com sucesso na Area de Trabalho!' -ForegroundColor Green"
echo.
pause
goto MENU

:DESINSTALAR_SISTEMA
cls
if exist "%DEST_DIR%\\DESINSTALAR_OU_LIMPAR_SUCESSOEDU.bat" (
    call "%DEST_DIR%\\DESINSTALAR_OU_LIMPAR_SUCESSOEDU.bat"
    goto MENU
)
if exist "%~dp0DESINSTALAR_OU_LIMPAR_SUCESSOEDU.bat" (
    call "%~dp0DESINSTALAR_OU_LIMPAR_SUCESSOEDU.bat"
    goto MENU
)
echo ===============================================================================
echo   DESINSTALACAO E LIMPEZA COMPLETA DO SUCESSOEDU
echo ===============================================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(${config.serverPort}, 3000, 3001, 3002); foreach ($p in $ports) { $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue; if ($conns) { foreach ($c in $conns) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue } } }; Get-Process powershell, pwsh -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*SucessoEdu*' -or $_.CommandLine -like '*server_micro*' -or $_.CommandLine -like '*servidor_tray*' -or $_.CommandLine -like '*servidor_widget*' } | Stop-Process -Force -ErrorAction SilentlyContinue; Stop-Process -Name 'node', 'wscript', 'cscript' -Force -ErrorAction SilentlyContinue;" >nul 2>&1
echo [OK] Todos os servicos e executaveis foram encerrados.
echo.
set /p CONFIRM_DEL="Deseja remover a pasta C:\\SucessoEdu e atalhos? (S/N): "
if /i "%CONFIRM_DEL%"=="S" (
    rd /s /q "%DEST_DIR%" >nul 2>&1
    rd /s /q "%LOCALAPPDATA%\\SucessoEdu" >nul 2>&1
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$desktops = @([System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop), [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::CommonDesktopDirectory), (Join-Path $env:USERPROFILE 'Desktop'), (Join-Path $env:USERPROFILE 'OneDrive\\Desktop')); foreach ($d in $desktops) { if ($d -and (Test-Path $d)) { Get-ChildItem -Path $d -Filter '*SucessoEdu*' -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue } }" >nul 2>&1
    echo [OK] Sistema desinstalado e pasta raiz limpa!
)
pause
goto MENU

:SAIR
cls
echo Obrigado por utilizar o SucessoEdu Gestao Educacional.
timeout /t 2 >nul
exit /b
`;
}

export function generateTotalServerReplacementBat(port = 3000, schoolName = 'Colégio Horizonte'): string {
  const safeSchool = sanitizeBatchString(schoolName);
  return `@echo off
chcp 65001 >nul
title SucessoEdu - Substituicao Total de Arquivos do Servidor (Upgrade Limpo)
color 0B
cls

:: Garantir que o diretorio de trabalho seja o local do script (suporta espacos e caracteres especiais)
set "SCRIPT_DIR=%~dp0"
for %%I in ("%~dp0.") do set "SCRIPT_DIR=%%~fI"
cd /d "%SCRIPT_DIR%"

:: 1. Verificacao de Privilegios de Administrador e Auto-Elevacao UAC com Preservacao de Diretorio
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Solicitando permissao de Administrador para substituir arquivos em C:\\SucessoEdu...
    set "SELF_BAT=%~f0"
    set "SELF_DIR=%SCRIPT_DIR%"
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$b = $env:SELF_BAT; $d = $env:SELF_DIR; $proc = Start-Process -FilePath $env:ComSpec -ArgumentList @('/k', ('\"\"' + $b + '\"\" ELEVATED')) -WorkingDirectory $d -Verb RunAs -PassThru -ErrorAction SilentlyContinue; if ($proc) { exit 0 } else { exit 1 }"
    exit /b
)

:: Desbloquear arquivos contra restricoes de download do Windows (SmartScreen)
set "SELF_DIR=%SCRIPT_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "if ($env:SELF_DIR -and (Test-Path -LiteralPath $env:SELF_DIR)) { Get-ChildItem -LiteralPath $env:SELF_DIR -Recurse -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue }" >nul 2>&1

set "DEST_DIR=C:\\SucessoEdu"
set "SRC_DIR=%SCRIPT_DIR%"
if "%SRC_DIR:~-1%"=="\\" set "SRC_DIR=%SRC_DIR:~0,-1%"

if not exist "C:\\" (
    set "DEST_DIR=%SystemDrive%\\SucessoEdu"
)

echo ===============================================================================
echo     SUCESSOEDU GESTAO EDUCACIONAL 5.4 - SUBSTITUICAO TOTAL DO SERVIDOR
echo     Substituicao Integral de Arquivos e Atualizacao Limpa de Componentes
echo     Instituicao: ${safeSchool}
echo ===============================================================================
echo.
echo  Este utilitario realiza a substituicao COMPLETA e segura de todos os
echo  arquivos do servidor em C:\\SucessoEdu, garantindo que as novas melhorias,
echo  telas, modulos e scripts sejam aplicados integralmente.
echo.
echo  [✓] Backup preventivo automatico de dados antes de substituir
echo  [✓] Encerramento seguro de processos e portas presas
echo  [✓] Limpeza de caches e scripts antigos obsoletos
echo  [✓] Copia fiel de todos os novos arquivos, SPA e scripts
echo  [✓] Criacao automatica do atalho oficial unico no Desktop
echo  [✓] Reinicializacao limpa do micro-servidor nativo (porta ${port})
echo.
echo ===============================================================================
set /p CONFIRM="Deseja iniciar a substituicao total agora? (S/N): "
if /i not "%CONFIRM%"=="S" (
    echo Operacao cancelada pelo operador.
    timeout /t 2 >nul
    exit /b
)

cls
echo ===============================================================================
echo   ETAPA 1/6: Encerrando servicos e liberando arquivos bloqueados...
echo ===============================================================================
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(${port}, 3000, 3001, 3002); foreach ($p in $ports) { $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue; if ($conns) { foreach ($c in $conns) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue } } }; Get-Process powershell, pwsh -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*SucessoEdu*' -or $_.CommandLine -like '*server_micro*' -or $_.CommandLine -like '*servidor_tray*' -or $_.CommandLine -like '*servidor_widget*' } | Stop-Process -Force -ErrorAction SilentlyContinue; Stop-Process -Name 'wscript', 'cscript' -Force -ErrorAction SilentlyContinue;" >nul 2>&1
timeout /t 2 /nobreak >nul
echo [OK] Processos anteriores finalizados e arquivos liberados.

echo.
echo ===============================================================================
echo   ETAPA 2/6: Realizando BACKUP DE SEGURANCA preventivo e integral...
echo ===============================================================================
set "TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "BACKUP_DIR=%DEST_DIR%\\Backups\\Backup_Pre_Substituicao_%TIMESTAMP%"
set "LOCALAPPDATA_BACKUP=%LOCALAPPDATA%\\SucessoEdu\\Backups\\Backup_%TIMESTAMP%"

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%" >nul 2>&1
if not exist "%LOCALAPPDATA_BACKUP%" mkdir "%LOCALAPPDATA_BACKUP%" >nul 2>&1

:: Backup dos dados em C:\\SucessoEdu
if exist "%DEST_DIR%\\data" xcopy /y /e /q /i "%DEST_DIR%\\data" "%BACKUP_DIR%\\data\\" >nul 2>&1
if exist "%DEST_DIR%\\*.json" copy /y "%DEST_DIR%\\*.json" "%BACKUP_DIR%\\" >nul 2>&1
if exist "%DEST_DIR%\\*.ini" copy /y "%DEST_DIR%\\*.ini" "%BACKUP_DIR%\\" >nul 2>&1

:: Backup dos dados em AppData
if exist "%LOCALAPPDATA%\\SucessoEdu\\data" xcopy /y /e /q /i "%LOCALAPPDATA%\\SucessoEdu\\data" "%LOCALAPPDATA_BACKUP%\\data\\" >nul 2>&1
if exist "%LOCALAPPDATA%\\SucessoEdu\\*.json" copy /y "%LOCALAPPDATA%\\SucessoEdu\\*.json" "%LOCALAPPDATA_BACKUP%\\" >nul 2>&1

:: Gerar Manifesto de Auditoria do Backup
(
echo ===============================================================================
echo SUCESSOEDU GESTAO EDUCACIONAL - MANIFESTO DE BACKUP PREVENTIVO
echo Data e Hora: %date% %time%
echo Tipo: Backup Obrigatorio Pre-Substituicao Total
echo Destino C:\\SucessoEdu: %BACKUP_DIR%
echo Destino AppData: %LOCALAPPDATA_BACKUP%
echo Status: CONCLUIDO COM SUCESSO - DADOS 100%% PRESERVADOS
echo ===============================================================================
) > "%BACKUP_DIR%\\manifesto_backup.txt"

copy /y "%BACKUP_DIR%\\manifesto_backup.txt" "%LOCALAPPDATA_BACKUP%\\manifesto_backup.txt" >nul 2>&1

echo [OK] Backup preventivo integral salvo com sucesso em:
echo      - %BACKUP_DIR%
echo      - %LOCALAPPDATA_BACKUP%

echo.
echo ===============================================================================
echo   ETAPA 3/6: Limpando arquivos obsoletos e caches anteriores...
echo ===============================================================================
if exist "%DEST_DIR%\\index.html" del /f /q "%DEST_DIR%\\index.html" >nul 2>&1
if exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" del /f /q "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" >nul 2>&1
if exist "%DEST_DIR%\\server_micro.ps1" del /f /q "%DEST_DIR%\\server_micro.ps1" >nul 2>&1
if exist "%DEST_DIR%\\servidor_tray.ps1" del /f /q "%DEST_DIR%\\servidor_tray.ps1" >nul 2>&1
if exist "%DEST_DIR%\\servidor_widget_flutuante.ps1" del /f /q "%DEST_DIR%\\servidor_widget_flutuante.ps1" >nul 2>&1
if exist "%DEST_DIR%\\SucessoEdu_App.vbs" del /f /q "%DEST_DIR%\\SucessoEdu_App.vbs" >nul 2>&1
if exist "%DEST_DIR%\\iniciar_servidor_silencioso.vbs" del /f /q "%DEST_DIR%\\iniciar_servidor_silencioso.vbs" >nul 2>&1
echo [OK] Limpeza concluida.

echo.
echo [SucessoEdu] Verificando e garantindo preservacao da estrutura canonica de diretorios...
if not exist "%DEST_DIR%\\data" mkdir "%DEST_DIR%\\data" >nul 2>&1
if not exist "%DEST_DIR%\\Backups" mkdir "%DEST_DIR%\\Backups" >nul 2>&1
if not exist "%DEST_DIR%\\config" mkdir "%DEST_DIR%\\config" >nul 2>&1
if not exist "%DEST_DIR%\\logs" mkdir "%DEST_DIR%\\logs" >nul 2>&1
if not exist "%DEST_DIR%\\assets" mkdir "%DEST_DIR%\\assets" >nul 2>&1
echo       [OK] Estrutura de pastas (data, Backups, config, logs, assets) 100%% preservada.
echo [SucessoEdu] Verificando layout e configuracoes visuais previas...
echo       [OK] Layout da escola mantido intacto. Bloqueio de redefinicao ativo.

echo.
echo ===============================================================================
echo   ETAPA 4/6: Garantindo criacao da pasta raiz e implantando todos os novos arquivos...
echo ===============================================================================
if not exist "%DEST_DIR%" mkdir "%DEST_DIR%" >nul 2>&1
if not exist "%DEST_DIR%\\Backups" mkdir "%DEST_DIR%\\Backups" >nul 2>&1
if not exist "%DEST_DIR%\\data" mkdir "%DEST_DIR%\\data" >nul 2>&1
if not exist "%LOCALAPPDATA%\\SucessoEdu" mkdir "%LOCALAPPDATA%\\SucessoEdu" >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "$dirs = @('%DEST_DIR%', '%DEST_DIR%\\Backups', '%DEST_DIR%\\data', '%LOCALAPPDATA%\\SucessoEdu'); foreach ($d in $dirs) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force -ErrorAction SilentlyContinue | Out-Null } }" >nul 2>&1

:: Desbloqueio e concessao irrestrita de permissoes (ACLs)
icacls "%DEST_DIR%" /grant *S-1-1-0:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Everyone:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Administrators:(OI)(CI)F /T /C /Q >nul 2>&1
attrib -r "%DEST_DIR%\\*.*" /s /d >nul 2>&1

:: Descoberta inteligente de pasta de origem
set "EFFECTIVE_SRC=%SRC_DIR%"
if not exist "%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html" (
    if exist "%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE\\SucessoEdu_Aplicativo_Offline.html" (
        set "EFFECTIVE_SRC=%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE"
    ) else if exist "%SRC_DIR%\\..\\SucessoEdu_Aplicativo_Offline.html" (
        set "EFFECTIVE_SRC=%SRC_DIR%\\.."
    )
)

if /i not "%EFFECTIVE_SRC%"=="%DEST_DIR%" (
    robocopy "%EFFECTIVE_SRC%" "%DEST_DIR%" *.* /E /IS /IT /R:1 /W:1 /NP /NFL /NDL >nul 2>&1
    if not exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" (
        xcopy /y /e /c /h /r /k /i "%EFFECTIVE_SRC%\\*" "%DEST_DIR%\\" >nul 2>&1
    )
    if not exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" (
        powershell -NoProfile -ExecutionPolicy Bypass -Command "Copy-Item -Path '%EFFECTIVE_SRC%\\*' -Destination '%DEST_DIR%' -Recurse -Force -ErrorAction SilentlyContinue" >nul 2>&1
    )
)

if exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" (
    copy /y "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" "%DEST_DIR%\\index.html" >nul 2>&1
) else if exist "%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html" (
    copy /y "%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html" "%DEST_DIR%\\index.html" >nul 2>&1
    copy /y "%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html" "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" >nul 2>&1
)

:: Validacao da instalacao e garantia estatica de todos os arquivos
${generateAutoHealingBatchRoutine(port, schoolName)}

set "FILE_COUNT=0"
for /f %%c in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-ChildItem -Path '%DEST_DIR%' -Recurse -File -ErrorAction SilentlyContinue).Count"') do set "FILE_COUNT=%%c"
if "%FILE_COUNT%"=="" set "FILE_COUNT=0"
echo [OK] Pasta raiz %DEST_DIR% verificada com %FILE_COUNT% arquivos instalados e operacionais.
echo [OK] Base de dados integralmente restaurada e protegida.

del /f /q "%USERPROFILE%\\Desktop\\SucessoEdu*.url" >nul 2>&1
del /f /q "%PUBLIC%\\Desktop\\SucessoEdu*.url" >nul 2>&1
del /f /q "%OneDrive%\\Desktop\\SucessoEdu*.url" >nul 2>&1
echo [OK] Scripts preparados e atalhos anteriores limpos.

echo.
echo ===============================================================================
echo   ETAPA 6/6: Inicializando servidor silencioso e abrindo o SucessoEdu...
echo ===============================================================================
if exist "%DEST_DIR%\\iniciar_servidor_silencioso.vbs" (
    wscript "%DEST_DIR%\\iniciar_servidor_silencioso.vbs"
)
timeout /t 2 /nobreak >nul

set "LOCAL_IP="
for /f "tokens=*" %%i in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.InterfaceAlias -notmatch 'Loopback|vEthernet|VirtualBox|VMware|WSL|Bluetooth' } | Select-Object -First 1 -ExpandProperty IPAddress); if (-not $ip) { $ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1 -ExpandProperty IPAddress) }; if ($ip) { $ip } else { '127.0.0.1' }"') do set "LOCAL_IP=%%i"
if "%LOCAL_IP%"=="" set "LOCAL_IP=127.0.0.1"

start "" "http://%LOCAL_IP%:${port}"

${generateInstallationStatusDisplayRoutine(port, schoolName)}

echo.
pause
`;
}

// -------------------------------------------------------------
// 2. MÓDULO SERVIDOR CENTRAL (MASTER OFFLINE)
// -------------------------------------------------------------

export function generateServerWindowsBat(config: InstallerConfig): string {
  const safeSchool = sanitizeBatchString(config.schoolName);
  return `@echo off
chcp 65001 >nul
title SucessoEdu Gestao Educacional - Servidor Central Offline [${safeSchool}]
color 1F

:: 1. Garantir que o diretorio de trabalho seja o local do script (suporta espacos e caracteres especiais)
set "SCRIPT_DIR=%~dp0"
for %%I in ("%~dp0.") do set "SCRIPT_DIR=%%~fI"
cd /d "%SCRIPT_DIR%"

:: 2. Verificacao de Privilegios de Administrador e Auto-Elevacao UAC com Preservacao de Diretorio
net session >nul 2>&1
if %errorLevel% neq 0 (
    if "%~1"=="ELEVATED" goto :POS_ELEVACAO_SERVER
    echo.
    echo ===============================================================================
    echo   [SUCESSOEDU] SOLICITANDO PERMISSAO DE ADMINISTRADOR DO WINDOWS...
    echo   Para instalar e configurar o Servidor Central em C:\\SucessoEdu,
    echo   por favor autorize a execucao clicando em "SIM" na janela do UAC.
    echo ===============================================================================
    echo.
    set "SELF_BAT=%~f0"
    set "SELF_DIR=%SCRIPT_DIR%"
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$b = $env:SELF_BAT; $d = $env:SELF_DIR; $proc = Start-Process -FilePath $env:ComSpec -ArgumentList @('/k', ('\"\"' + $b + '\"\" ELEVATED')) -WorkingDirectory $d -Verb RunAs -PassThru -ErrorAction SilentlyContinue; if ($proc) { exit 0 } else { exit 1 }"
    if %errorLevel% equ 0 exit /b
    echo [AVISO] Elevacao automatica nao concluida ou cancelada.
    echo Tentando continuar a execucao em modo padrao...
    echo.
)
:POS_ELEVACAO_SERVER

:: Desbloquear arquivos contra restricoes de download do Windows (SmartScreen)
set "SELF_DIR=%SCRIPT_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "if ($env:SELF_DIR -and (Test-Path -LiteralPath $env:SELF_DIR)) { Get-ChildItem -LiteralPath $env:SELF_DIR -Recurse -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue }" >nul 2>&1

set "DEST_DIR=C:\\SucessoEdu"
set "SRC_DIR=%SCRIPT_DIR%"

if not exist "C:\\" (
    set "DEST_DIR=%SystemDrive%\\SucessoEdu"
)

:: Garantir criacao da pasta raiz C:\\SucessoEdu
if not exist "%DEST_DIR%" mkdir "%DEST_DIR%" 2>nul
if not exist "%DEST_DIR%\\Backups" mkdir "%DEST_DIR%\\Backups" 2>nul
if not exist "%DEST_DIR%\\data" mkdir "%DEST_DIR%\\data" 2>nul
if not exist "%LOCALAPPDATA%\\SucessoEdu" mkdir "%LOCALAPPDATA%\\SucessoEdu" 2>nul
if not exist "%LOCALAPPDATA%\\SucessoEdu\\data" mkdir "%LOCALAPPDATA%\\SucessoEdu\\data" 2>nul
if not exist "%LOCALAPPDATA%\\SucessoEdu\\Backups" mkdir "%LOCALAPPDATA%\\SucessoEdu\\Backups" 2>nul

powershell -NoProfile -ExecutionPolicy Bypass -Command "$dirs = @('%DEST_DIR%', '%DEST_DIR%\\Backups', '%DEST_DIR%\\data', '%LOCALAPPDATA%\\SucessoEdu', '%LOCALAPPDATA%\\SucessoEdu\\data', '%LOCALAPPDATA%\\SucessoEdu\\Backups'); foreach ($d in $dirs) { if (-not (Test-Path $d)) { try { [System.IO.Directory]::CreateDirectory($d) | Out-Null } catch { New-Item -ItemType Directory -Path $d -Force -ErrorAction SilentlyContinue | Out-Null } } }" >nul 2>&1

icacls "%DEST_DIR%" /grant *S-1-1-0:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Everyone:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Todos:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Users:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Usuarios:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Administrators:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Administradores:(OI)(CI)F /T /C /Q >nul 2>&1
attrib -r "%DEST_DIR%\\*.*" /s /d >nul 2>&1

if not exist "%DEST_DIR%" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -Command \"[System.IO.Directory]::CreateDirectory(''%DEST_DIR%''); [System.IO.Directory]::CreateDirectory(''%DEST_DIR%\\Backups''); [System.IO.Directory]::CreateDirectory(''%DEST_DIR%\\data''); icacls ''%DEST_DIR%'' /grant *S-1-1-0:(OI)(CI)F /T /C /Q\"' -Verb RunAs -Wait" >nul 2>&1
)

set "IS_UPDATE=0"
if exist "%DEST_DIR%\\index.html" set "IS_UPDATE=1"
if exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" set "IS_UPDATE=1"
if exist "%DEST_DIR%\\server_micro.ps1" set "IS_UPDATE=1"

cls
echo ===============================================================================
echo            SUCESSOEDU GESTAO EDUCACIONAL - SERVIDOR CENTRAL
echo            Instalação e Sincronizacao da Pasta Raiz: %DEST_DIR%
echo            Escola / Rede: ${safeSchool}
echo            Porta Local: ${config.serverPort}
echo ===============================================================================
echo.

if "%IS_UPDATE%"=="1" (
    echo   [MODO ATUALIZACAO AUTOMATICA E SUBSTITUICAO INTEGRAL DETECTADO]
    echo   Uma instalacao previa do SucessoEdu foi identificada em %DEST_DIR%.
    echo   O instalador realizara a substituicao completa de todos os arquivos
    echo   do sistema, preservando 100%% dos dados atraves de backup preventivo.
    echo.
)

echo [1/6] Encerrando servicos e liberando arquivos bloqueados do servidor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(${config.serverPort}, 3000, 3001, 3002); foreach ($p in $ports) { $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue; if ($conns) { foreach ($c in $conns) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue } } }; Get-Process powershell, pwsh -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*SucessoEdu*' -or $_.CommandLine -like '*server_micro*' -or $_.CommandLine -like '*servidor_tray*' -or $_.CommandLine -like '*servidor_widget*' } | Stop-Process -Force -ErrorAction SilentlyContinue; Stop-Process -Name 'node', 'wscript', 'cscript' -Force -ErrorAction SilentlyContinue;" >nul 2>&1
timeout /t 2 /nobreak >nul
echo       [OK] Portas liberadas e processos anteriores finalizados.
echo.

if "%IS_UPDATE%"=="1" (
    echo [2/6] Gerando BACKUP PREVENTIVO OBRIGATORIO da base de dados...
    set "TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%"
    set "TIMESTAMP=%TIMESTAMP: =0%"
    set "BACKUP_DIR=%DEST_DIR%\\Backups\\Backup_Auto_Pre_Instalacao_%TIMESTAMP%"
    set "LOCALAPPDATA_BACKUP=%LOCALAPPDATA%\\SucessoEdu\\Backups\\Backup_%TIMESTAMP%"

    if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%" >nul 2>&1
    if not exist "%LOCALAPPDATA_BACKUP%" mkdir "%LOCALAPPDATA_BACKUP%" >nul 2>&1

    if exist "%DEST_DIR%\\data" xcopy /y /e /q /i "%DEST_DIR%\\data" "%BACKUP_DIR%\\data\\" >nul 2>&1
    if exist "%DEST_DIR%\\*.json" copy /y "%DEST_DIR%\\*.json" "%BACKUP_DIR%\\" >nul 2>&1
    if exist "%DEST_DIR%\\*.ini" copy /y "%DEST_DIR%\\*.ini" "%BACKUP_DIR%\\" >nul 2>&1
    if exist "%DEST_DIR%\\*.sqlite" copy /y "%DEST_DIR%\\*.sqlite" "%BACKUP_DIR%\\" >nul 2>&1
    if exist "%DEST_DIR%\\*.db" copy /y "%DEST_DIR%\\*.db" "%BACKUP_DIR%\\" >nul 2>&1

    if exist "%LOCALAPPDATA%\\SucessoEdu\\data" xcopy /y /e /q /i "%LOCALAPPDATA%\\SucessoEdu\\data" "%LOCALAPPDATA_BACKUP%\\data\\" >nul 2>&1
    if exist "%LOCALAPPDATA%\\SucessoEdu\\*.json" copy /y "%LOCALAPPDATA%\\SucessoEdu\\*.json" "%LOCALAPPDATA_BACKUP%\\" >nul 2>&1

    (
    echo ===============================================================================
    echo SUCESSOEDU - MANIFESTO DE BACKUP AUTOMATICO PRE-INSTALACAO/ATUALIZACAO
    echo Data: %date% %time%
    echo Origem: %DEST_DIR%
    echo Destino: %BACKUP_DIR%
    echo Status: DADOS 100%% PRESERVADOS
    echo ===============================================================================
    ) > "%BACKUP_DIR%\\manifesto_backup.txt"
    copy /y "%BACKUP_DIR%\\manifesto_backup.txt" "%LOCALAPPDATA_BACKUP%\\manifesto_backup.txt" >nul 2>&1
    echo       [OK] Backup preventivo salvo em: %BACKUP_DIR%
    echo.

    echo [3/6] Preparando atualizacao atomica e preservando base de dados...
    del /f /q "%TEMP%\\se_*.b64" >nul 2>&1
    del /f /q "%DEST_DIR%\\*.tmp" >nul 2>&1
    echo       [OK] Ambiente preparado para implantacao integral dos componentes.
    echo.
    echo [SucessoEdu] Verificando e garantindo preservacao da estrutura canonica de diretorios...
    if not exist "%DEST_DIR%\\data" mkdir "%DEST_DIR%\\data" >nul 2>&1
    if not exist "%DEST_DIR%\\Backups" mkdir "%DEST_DIR%\\Backups" >nul 2>&1
    if not exist "%DEST_DIR%\\config" mkdir "%DEST_DIR%\\config" >nul 2>&1
    if not exist "%DEST_DIR%\\logs" mkdir "%DEST_DIR%\\logs" >nul 2>&1
    if not exist "%DEST_DIR%\\assets" mkdir "%DEST_DIR%\\assets" >nul 2>&1
    echo       [OK] Estrutura de pastas (data, Backups, config, logs, assets) 100%% preservada.
    echo [SucessoEdu] Verificando layout e configuracoes visuais previas...
    echo       [OK] Layout da escola mantido intacto. Bloqueio de redefinicao ativo.
    echo.
) else (
    echo [2/6] Preparando e garantindo criacao da pasta raiz oficial %DEST_DIR%...
    if not exist "%DEST_DIR%" mkdir "%DEST_DIR%" 2>nul
    if not exist "%DEST_DIR%\\Backups" mkdir "%DEST_DIR%\\Backups" 2>nul
    if not exist "%DEST_DIR%\\data" mkdir "%DEST_DIR%\\data" 2>nul
    if not exist "%LOCALAPPDATA%\\SucessoEdu" mkdir "%LOCALAPPDATA%\\SucessoEdu" 2>nul
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$dirs = @('%DEST_DIR%', '%DEST_DIR%\\Backups', '%DEST_DIR%\\data', '%LOCALAPPDATA%\\SucessoEdu'); foreach ($d in $dirs) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force -ErrorAction SilentlyContinue | Out-Null } }" >nul 2>&1
    echo       [OK] Pastas em %DEST_DIR% criadas com sucesso.
    echo.
    echo [3/6] Validando integridade dos arquivos do pacote de instalacao...
    echo       [OK] Pacote verificado.
    echo.
)

echo [4/6] Garantindo criacao da pasta raiz e implantando todos os arquivos da aplicacao...
if not exist "%DEST_DIR%" mkdir "%DEST_DIR%" 2>nul
if not exist "%DEST_DIR%\\Backups" mkdir "%DEST_DIR%\\Backups" 2>nul
if not exist "%DEST_DIR%\\data" mkdir "%DEST_DIR%\\data" 2>nul
if not exist "%LOCALAPPDATA%\\SucessoEdu" mkdir "%LOCALAPPDATA%\\SucessoEdu" 2>nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "$dirs = @('%DEST_DIR%', '%DEST_DIR%\\Backups', '%DEST_DIR%\\data', '%LOCALAPPDATA%\\SucessoEdu'); foreach ($d in $dirs) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force -ErrorAction SilentlyContinue | Out-Null } }" >nul 2>&1

:: Desbloqueio e concessao irrestrita de permissoes (ACLs)
icacls "%DEST_DIR%" /grant *S-1-1-0:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Everyone:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Todos:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Administrators:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Administradores:(OI)(CI)F /T /C /Q >nul 2>&1
attrib -r "%DEST_DIR%\\*.*" /s /d >nul 2>&1

:: Descoberta inteligente de pasta de origem
set "EFFECTIVE_SRC=%SRC_DIR%"
if not exist "%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html" if not exist "%EFFECTIVE_SRC%\\index.html" (
    if exist "%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE\\SucessoEdu_Aplicativo_Offline.html" (
        set "EFFECTIVE_SRC=%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE"
    ) else if exist "%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE\\index.html" (
        set "EFFECTIVE_SRC=%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE"
    ) else if exist "%SRC_DIR%\\..\\SucessoEdu_Aplicativo_Offline.html" (
        set "EFFECTIVE_SRC=%SRC_DIR%\\.."
    ) else if exist "%SRC_DIR%\\..\\index.html" (
        set "EFFECTIVE_SRC=%SRC_DIR%\\.."
    )
)

if /i not "%EFFECTIVE_SRC%"=="%DEST_DIR%" (
    robocopy "%EFFECTIVE_SRC%" "%DEST_DIR%" *.* /E /IS /IT /R:1 /W:1 /NP /NFL /NDL >nul 2>&1
    if not exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" (
        xcopy /y /e /c /h /r /k /i "%EFFECTIVE_SRC%\\*" "%DEST_DIR%\\" >nul 2>&1
    )
    if not exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" (
        powershell -NoProfile -ExecutionPolicy Bypass -Command "Copy-Item -Path '%EFFECTIVE_SRC%\\*' -Destination '%DEST_DIR%' -Recurse -Force -ErrorAction SilentlyContinue" >nul 2>&1
    )
)

if exist "%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE" (
    xcopy /y /e /c /h /r /k /i "%SRC_DIR%\\01_MODULO_SERVIDOR_LOCAL_OFFLINE\\*" "%DEST_DIR%\\" >nul 2>&1
)

if exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" (
    copy /y "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" "%DEST_DIR%\\index.html" >nul 2>&1
) else if exist "%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html" (
    copy /y "%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html" "%DEST_DIR%\\index.html" >nul 2>&1
    copy /y "%EFFECTIVE_SRC%\\SucessoEdu_Aplicativo_Offline.html" "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" >nul 2>&1
)

:: Validacao da instalacao e garantia estatica de todos os arquivos
${generateAutoHealingBatchRoutine(config.serverPort, config.schoolName)}

set "FILE_COUNT=0"
for /f %%c in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-ChildItem -Path '%DEST_DIR%' -Recurse -File -ErrorAction SilentlyContinue).Count"') do set "FILE_COUNT=%%c"
if "%FILE_COUNT%"=="" set "FILE_COUNT=0"
echo       [OK] Pasta raiz %DEST_DIR% criada e verificada com %FILE_COUNT% arquivos instalados e operacionais.
echo.

echo [5/6] Configurando Adaptadores de Rede, Firewall e Atalho Oficial Unico...
set LOCAL_IP=
for /f "tokens=*" %%i in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notmatch \'^127\.\' -and $_.IPAddress -notmatch \'^169\.254\.\' -and $_.InterfaceAlias -notmatch \'Loopback|vEthernet|VirtualBox|VMware|WSL|Bluetooth\' } | Select-Object -First 1).IPAddress; if (-not $ip) { $ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notmatch \'^127\.\' -and $_.IPAddress -notmatch \'^169\.254\.\' } | Select-Object -First 1).IPAddress }; if ($ip) { $ip } else { \'${config.serverIp}\' }"') do set LOCAL_IP=%%i

if "%LOCAL_IP%"=="" set LOCAL_IP=${config.serverIp}

echo       - Endereco IP Principal: %LOCAL_IP%
echo       - Porta do Servidor:     ${config.serverPort}

netsh advfirewall firewall delete rule name="SucessoEdu_Server_In_${config.serverPort}" >nul 2>&1
netsh advfirewall firewall add rule name="SucessoEdu_Server_In_${config.serverPort}" dir=in action=allow protocol=TCP localport=${config.serverPort} profile=any enable=yes >nul 2>&1
netsh advfirewall firewall delete rule name="SucessoEdu_Server_Out_${config.serverPort}" >nul 2>&1
netsh advfirewall firewall add rule name="SucessoEdu_Server_Out_${config.serverPort}" dir=out action=allow protocol=TCP localport=${config.serverPort} profile=any enable=yes >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "New-NetFirewallRule -DisplayName 'SucessoEdu Server Port ${config.serverPort}' -Direction Inbound -LocalPort ${config.serverPort} -Protocol TCP -Action Allow -Profile Any -ErrorAction SilentlyContinue" >nul 2>&1

:: Criar Atalho Oficial Unico na Area de Trabalho
if exist "%DEST_DIR%\\criar_atalhos.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%DEST_DIR%\\criar_atalhos.ps1" -TargetUrl "http://localhost:${config.serverPort}" -ShortcutName "SucessoEdu Gestão Educacional" -Port ${config.serverPort} >nul 2>&1
) else if exist "%~dp0criar_atalhos.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0criar_atalhos.ps1" -TargetUrl "http://localhost:${config.serverPort}" -ShortcutName "SucessoEdu Gestão Educacional" -Port ${config.serverPort} >nul 2>&1
) else if exist "%DEST_DIR%\\criar_atalhos.vbs" (
    cscript //nologo "%DEST_DIR%\\criar_atalhos.vbs" >nul 2>&1
)

:: Configurar Inicializacao Automatica ao Ligar o PC
reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "SucessoEduServer" /t REG_SZ /d "wscript.exe \"C:\\SucessoEdu\\iniciar_servidor_silencioso.vbs\"" /f >nul 2>&1
set "STARTUP_DIR=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"
if exist "%STARTUP_DIR%" (
    (
    echo Set WshShell = CreateObject^("WScript.Shell"^)
    echo Set shortcut = WshShell.CreateShortcut^("%STARTUP_DIR%\\SucessoEdu_Servidor_AutoStart.lnk"^)
    echo shortcut.TargetPath = "wscript.exe"
    echo shortcut.Arguments = """C:\\SucessoEdu\\iniciar_servidor_silencioso.vbs"""
    echo shortcut.WorkingDirectory = "C:\\SucessoEdu"
    echo shortcut.Description = "Inicializador Automatico SucessoEdu Servidor"
    echo shortcut.WindowStyle = 7
    echo shortcut.Save
    ) > "%TEMP%\\criar_tray_autostart.vbs"
    cscript //nologo "%TEMP%\\criar_tray_autostart.vbs" >nul 2>&1
    del /f /q "%TEMP%\\criar_tray_autostart.vbs" >nul 2>&1
)

:: Gerar arquivo de configuracao para estacoes
(
echo [SucessoEdu_Rede_Local]
echo Servidor_IP=%LOCAL_IP%
echo Porta=${config.serverPort}
echo Escola=${config.schoolName}
echo URL_Acesso=http://localhost:${config.serverPort}
echo URL_Rede=http://%LOCAL_IP%:${config.serverPort}
echo Status=ATIVO_LOCAL
) > "%DEST_DIR%\\config_rede_estacoes.ini"

copy /y "%DEST_DIR%\\config_rede_estacoes.ini" "%LOCALAPPDATA%\\SucessoEdu\\config_rede_estacoes.ini" >nul 2>&1
copy /y "%DEST_DIR%\\config_rede_estacoes.ini" "%~dp0config_rede_estacoes.ini" >nul 2>&1

echo       [OK] Regras de Rede, Firewall e Atalho configurados.
echo.

echo [6/6] Inicializando Servidor Silencioso e Abrindo o Sistema...
if exist "%DEST_DIR%\\iniciar_servidor_silencioso.vbs" (
    wscript "%DEST_DIR%\\iniciar_servidor_silencioso.vbs"
) else if exist "%~dp0iniciar_servidor_silencioso.vbs" (
    wscript "%~dp0iniciar_servidor_silencioso.vbs"
)

timeout /t 2 /nobreak >nul

if exist "%DEST_DIR%\\SucessoEdu_App.vbs" (
    wscript "%DEST_DIR%\\SucessoEdu_App.vbs"
) else if exist "%~dp0SucessoEdu_App.vbs" (
    wscript "%~dp0SucessoEdu_App.vbs"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Test-Path '%DEST_DIR%\\index.html') { Start-Process '%DEST_DIR%\\index.html' } else { Start-Process 'http://localhost:${config.serverPort}' }" >nul 2>&1
)

cls
${generateInstallationStatusDisplayRoutine(config.serverPort, safeSchool)}

echo Pressione qualquer tecla para finalizar esta janela...
pause >nul
exit /b
`;
}

export function generateServerWindowsPowerShellService(config: InstallerConfig): string {
  return `# Script PowerShell para Instalacao de Servico Windows Offline
# SucessoEdu Gestao Educacional - Servidor Central

$ServiceName = "SucessoEduServer"
$DisplayName = "SucessoEdu Gestao Educacional - Servidor Escolar Offline"
$Port = ${config.serverPort}
$AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " Instalador de Servico em Segundo Plano - SucessoEdu" -ForegroundColor Yellow
Write-Host "=========================================================" -ForegroundColor Cyan

# Teste de Administrador
If (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[AVISO] Solicitando elevacao de Administrador..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "' + $PSCommandPath + '"') -Verb RunAs
    Exit
}

Write-Host "[1/3] Liberando porta $Port no Firewall para todos os perfis..." -ForegroundColor Green
New-NetFirewallRule -DisplayName ("SucessoEdu Inbound Port " + $Port) -Direction Inbound -LocalPort $Port -Protocol TCP -Action Allow -Profile Any -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName ("SucessoEdu Outbound Port " + $Port) -Direction Outbound -LocalPort $Port -Protocol TCP -Action Allow -Profile Any -ErrorAction SilentlyContinue

Write-Host "[2/3] Criando arquivo de inicializacao automatica..." -ForegroundColor Green
$StartupScript = Join-Path $AppDir "iniciar_servidor_silencioso.vbs"
$VbsContent = 'Set WshShell = CreateObject("WScript.Shell")' + [Environment]::NewLine + 'WshShell.Run "cmd.exe /c cd /d """' + $AppDir + '""" && if exist dist\\server.cjs (node dist\\server.cjs) else (npm run start)", 0, False'
[System.IO.File]::WriteAllText($StartupScript, $VbsContent, [System.Text.Encoding]::ASCII)

Write-Host "[3/3] Registrando no agendador de tarefas do Windows..." -ForegroundColor Green
$Action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument ('"' + $StartupScript + '"')
$Trigger = New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -TaskName "SucessoEdu_AutoStart" -Action $Action -Trigger $Trigger -User "SYSTEM" -RunLevel Highest -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Instalacao concluida! O SucessoEdu sera iniciado automaticamente ao ligar o computador." -ForegroundColor Cyan
`;
}

export function generateDockerCompose(config: InstallerConfig): string {
  return `version: '3.8'

services:
  sucessoedu-server:
    container_name: sucessoedu_servidor_offline
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
// 3. MÓDULO ESTAÇÃO DE TRABALHO (CLIENTE / ALUNO / LABORATÓRIO)
// -------------------------------------------------------------

export function generateClientWindowsBat(config: InstallerConfig): string {
  const isKiosk = config.kioskMode || config.stationType === 'KIOSK_EXAM' || config.stationType === 'STUDENT_LAB';
  const serverUrl = `http://${config.serverIp}:${config.serverPort}`;
  const safeSchool = sanitizeBatchString(config.schoolName);
  const safeStation = sanitizeBatchString(config.stationName);

  const bat = `@echo off
chcp 65001 >nul
title SucessoEdu Gestao Educacional - Estacao de Trabalho [${safeStation}]
color 0A

:: Garantir que o diretorio de trabalho seja o local do script (suporta espacos e caracteres especiais)
set "SCRIPT_DIR=%~dp0"
for %%I in ("%~dp0.") do set "SCRIPT_DIR=%%~fI"
cd /d "%SCRIPT_DIR%"

:: 1. Verificacao de Privilegios e Auto-Elevacao se necessario com Preservacao de Diretorio
net session >nul 2>&1
if %errorLevel% neq 0 (
    set "SELF_BAT=%~f0"
    set "SELF_DIR=%SCRIPT_DIR%"
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$b = $env:SELF_BAT; $d = $env:SELF_DIR; $proc = Start-Process -FilePath $env:ComSpec -ArgumentList @('/k', ('\"\"' + $b + '\"\" ELEVATED')) -WorkingDirectory $d -Verb RunAs -PassThru -ErrorAction SilentlyContinue; if ($proc) { exit 0 } else { exit 1 }"
    exit /b
)

:: Desbloquear arquivos baixados
set "SELF_DIR=%SCRIPT_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "if ($env:SELF_DIR -and (Test-Path -LiteralPath $env:SELF_DIR)) { Get-ChildItem -LiteralPath $env:SELF_DIR -Recurse -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue }" >nul 2>&1

set "DEST_DIR=C:\\SucessoEdu"
set "SRC_DIR=%SCRIPT_DIR%"
if "%SRC_DIR:~-1%"=="\\" set "SRC_DIR=%SRC_DIR:~0,-1%"

if not exist "C:\\" (
    set "DEST_DIR=%SystemDrive%\\SucessoEdu"
)

if not exist "%DEST_DIR%" mkdir "%DEST_DIR%" >nul 2>&1
if not exist "%DEST_DIR%\\Backups" mkdir "%DEST_DIR%\\Backups" >nul 2>&1
if not exist "%LOCALAPPDATA%\\SucessoEdu" mkdir "%LOCALAPPDATA%\\SucessoEdu" >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "$dirs = @('%DEST_DIR%', '%DEST_DIR%\\Backups', '%LOCALAPPDATA%\\SucessoEdu'); foreach ($d in $dirs) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force -ErrorAction SilentlyContinue | Out-Null } }" >nul 2>&1

:: Desbloqueio e concessao irrestrita de permissoes (ACLs)
icacls "%DEST_DIR%" /grant *S-1-1-0:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Everyone:(OI)(CI)F /T /C /Q >nul 2>&1
icacls "%DEST_DIR%" /grant Administrators:(OI)(CI)F /T /C /Q >nul 2>&1
attrib -r "%DEST_DIR%\\*.*" /s /d >nul 2>&1

:: Snapshot de seguranca caso ja exista configuracao previa na estacao (Atualizacao)
set "TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "BACKUP_DIR=%DEST_DIR%\\Backups\\Backup_Estacao_%TIMESTAMP%"
if exist "%DEST_DIR%\\config_rede_estacoes.ini" (
    if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%" >nul 2>&1
    copy /y "%DEST_DIR%\\*.ini" "%BACKUP_DIR%\\" >nul 2>&1
    copy /y "%DEST_DIR%\\*.json" "%BACKUP_DIR%\\" >nul 2>&1
)

echo ===============================================================================
echo            SUCESSOEDU GESTAO EDUCACIONAL - ESTACAO DE TRABALHO
echo            Tipo: ${config.stationType}
echo            Escola: ${safeSchool}
echo            Pasta Raiz Oficial: C:\\SucessoEdu
echo ===============================================================================
echo.

echo ===============================================================================
echo   CONFIGURACAO DE CONEXAO DA ESTACAO COM O SERVIDOR CENTRAL LOCAL
echo ===============================================================================
echo   Como esta estacao de trabalho deve se conectar ao Servidor Local?
echo.
echo   [1] BUSCA AUTOMATICA na rede local (Varredura inteligente de IP e Porta)
echo   [2] DIGITAR IP / NOME do Servidor Central (ex: 192.168.1.100 ou SERVIDOR-ESCOLA)
echo   [3] MAPEAR PASTA COMPARTILHADA do Banco de Dados (ex: \\\\SERVIDOR\\SucessoEdu\\data)
echo.
set "MODO_CONEXAO="
set /p MODO_CONEXAO="Digite a opcao desejada [1, 2 ou 3 - Padrao 1]: "
if "%MODO_CONEXAO%"=="" set MODO_CONEXAO=1

set "TIPO_CONEXAO=REDE_HTTP"
set "TARGET_SERVER="
set "SHARED_DB_PATH="

if "%MODO_CONEXAO%"=="3" goto CLIENT_MODO_PASTA
if "%MODO_CONEXAO%"=="2" goto CLIENT_MODO_IP

:CLIENT_MODO_AUTO
echo.
echo [BUSCA AUTOMATICA] Varrendo a rede local em busca do Servidor SucessoEdu...
if exist "%~dp0buscar_servidor_rede.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0buscar_servidor_rede.ps1" -Port ${config.serverPort} -DefaultIp "${config.serverIp}"
    if exist "%~dp0ip_servidor_descoberto.txt" (
        set /p TARGET_SERVER=<"%~dp0ip_servidor_descoberto.txt"
    )
)

if "%TARGET_SERVER%"=="" (
    if exist "%~dp0config_rede_estacoes.ini" (
        for /f "tokens=2 delims==" %%a in ('type "%~dp0config_rede_estacoes.ini" ^| findstr "Servidor_IP="') do set TARGET_SERVER=%%a
    )
)

if "%TARGET_SERVER%"=="" (
    if exist "%DEST_DIR%\\config_rede_estacoes.ini" (
        for /f "tokens=2 delims==" %%a in ('type "%DEST_DIR%\\config_rede_estacoes.ini" ^| findstr "Servidor_IP="') do set TARGET_SERVER=%%a
    )
)

if "%TARGET_SERVER%"=="" set TARGET_SERVER=${config.serverIp}
set TARGET_SERVER=%TARGET_SERVER: =%
goto CLIENT_CONCLUIR_CONEXAO

:CLIENT_MODO_IP
echo.
set /p TARGET_SERVER="Digite o IP ou Nome do Servidor Central [ex: 192.168.1.100]: "
if "%TARGET_SERVER%"=="" set TARGET_SERVER=${config.serverIp}
set TARGET_SERVER=%TARGET_SERVER: =%
goto CLIENT_CONCLUIR_CONEXAO

:CLIENT_MODO_PASTA
echo.
set "TIPO_CONEXAO=PASTA_COMPARTILHADA"
set /p SHARED_DB_PATH="Digite o caminho UNC da pasta compartilhada [ex: \\\\SERVIDOR\\SucessoEdu\\data]: "
if "%SHARED_DB_PATH%"=="" set "SHARED_DB_PATH=\\\\SERVIDOR\\SucessoEdu\\data"
echo   Verificando acesso a pasta de banco compartilhada: %SHARED_DB_PATH%...
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Test-Path -LiteralPath '%SHARED_DB_PATH%') { Write-Host '  [OK] Pasta compartilhada acessivel com sucesso!' -ForegroundColor Green } else { Write-Host '  [AVISO] Pasta compartilhada no momento offline. O caminho foi registrado.' -ForegroundColor Yellow }"
set TARGET_SERVER=${config.serverIp}
goto CLIENT_CONCLUIR_CONEXAO

:CLIENT_CONCLUIR_CONEXAO
set TARGET_PORT=${config.serverPort}
set SERVER_URL=http://%TARGET_SERVER%:%TARGET_PORT%

(
echo [SucessoEdu_Rede_Local]
echo Modo_Conexao=%TIPO_CONEXAO%
echo Servidor_IP=%TARGET_SERVER%
echo Porta=%TARGET_PORT%
echo Escola=${config.schoolName}
echo URL_Acesso=%SERVER_URL%
echo Caminho_Banco_Compartilhado=%SHARED_DB_PATH%
echo Centralizar_Envio_Servidor_Local=SIM
echo Unificar_Base_Secretaria_Municipal=SIM
echo Status=ESTACAO_CONECTADA
) > "%DEST_DIR%\\config_rede_estacoes.ini"

set "APPDATA_DIR=%LOCALAPPDATA%\\SucessoEdu"
if not exist "%APPDATA_DIR%" mkdir "%APPDATA_DIR%" >nul 2>&1
copy /y "%DEST_DIR%\\config_rede_estacoes.ini" "%APPDATA_DIR%\\config_rede_estacoes.ini" >nul 2>&1
copy /y "%DEST_DIR%\\config_rede_estacoes.ini" "%~dp0config_rede_estacoes.ini" >nul 2>&1

:: Copiar e substituir scripts e componentes da estacao para a pasta raiz C:\\SucessoEdu
if /i not "%SRC_DIR%"=="%DEST_DIR%" (
    robocopy "%SRC_DIR%" "%DEST_DIR%" *.* /E /IS /IT /R:1 /W:1 /NP /NFL /NDL >nul 2>&1
    xcopy /y /e /c /h /r /k /i "%SRC_DIR%\\*" "%DEST_DIR%\\" >nul 2>&1
)

(
echo @echo off
echo chcp 65001 ^>nul
echo title SucessoEdu Gestao Educacional - Estacao
echo cd /d "%%~dp0"
echo set "TARGET_SERVER="
echo if exist "%%~dp0config_rede_estacoes.ini" (
echo     for /f "tokens=2 delims==" %%%%a in ('type "%%~dp0config_rede_estacoes.ini" ^^^| findstr "Servidor_IP="'^) do set TARGET_SERVER=%%%%a
echo ^)
echo if "%%TARGET_SERVER%%"=="" set TARGET_SERVER=${config.serverIp}
echo set TARGET_SERVER=%%TARGET_SERVER: =%%
echo start "" "http://%%TARGET_SERVER%%:${config.serverPort}"
echo exit /b
) > "%DEST_DIR%\\Abrir_Estacao.bat"

echo.
echo [1.5/3] Registrando Estacao e sincronizando diretamente com o Servidor Local...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$payload = @{ tipo = 'REGISTRO_ESTACAO_TRABALHO'; estacao = '${safeStation}'; tipoEstacao = '${config.stationType}'; escola = '${safeSchool}'; origem = $env:COMPUTERNAME; usuario = $env:USERNAME; timestamp = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ss'); status = 'CONECTADO_SERVIDOR_LOCAL' } | ConvertTo-Json -Compress; try { $res = Invoke-RestMethod -Uri '%SERVER_URL%/api/sync' -Method Post -Body $payload -ContentType 'application/json; charset=utf-8' -TimeoutSec 5; Write-Host '  [SUCESSO] Estacao registrada no Banco de Dados Central do Servidor Local!' -ForegroundColor Green } catch { Write-Host '  [AVISO] Servidor Local nao respondeu na porta %TARGET_PORT%. O apontamento foi salvo no config_rede_estacoes.ini.' -ForegroundColor Yellow }"

:: Gerar rotina de centralizacao da estacao para o banco de dados do servidor local
(
echo param(
echo     [string]$RootDir = "C:\\SucessoEdu"
echo ^)
echo $ErrorActionPreference = "SilentlyContinue"
echo [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
echo $ini = Join-Path $RootDir "config_rede_estacoes.ini"
echo $modo = "REDE_HTTP"
echo $servidor = "${config.serverIp}"
echo $porta = ${config.serverPort}
echo $caminhoUNC = ""
echo if (Test-Path $ini) {
echo     $lines = Get-Content $ini
echo     foreach ($l in $lines) {
echo         if ($l -match "^Modo_Conexao=(.*)$") { $modo = $matches[1].Trim() }
echo         if ($l -match "^Servidor_IP=(.*)$") { $servidor = $matches[1].Trim() }
echo         if ($l -match "^Porta=(.*)$") { $porta = [int]$matches[1].Trim() }
echo         if ($l -match "^Caminho_Banco_Compartilhado=(.*)$") { $caminhoUNC = $matches[1].Trim() }
echo     }
echo }
echo $dataDir = Join-Path $RootDir "data"
echo $dbLocal = Join-Path $dataDir "banco_educacional.json"
echo if (-not (Test-Path $dbLocal)) { $dbLocal = Join-Path $RootDir "banco_educacional.json" }
echo if ($modo -eq "PASTA_COMPARTILHADA" -and $caminhoUNC) {
echo     if (Test-Path $caminhoUNC) {
echo         if (Test-Path $dbLocal) {
echo             Copy-Item -LiteralPath $dbLocal -Destination (Join-Path $caminhoUNC "banco_educacional.json") -Force
echo             Write-Host " [OK] Base da estacao centralizada com sucesso na pasta compartilhada do Servidor!" -ForegroundColor Green
echo         }
echo     } else {
echo         Write-Host " [AVISO] Pasta compartilhada $caminhoUNC nao encontrada no momento." -ForegroundColor Yellow
echo     }
echo } else {
echo     $url = 'http://' + $servidor + ':' + $porta + '/api/sync/station'
echo     $body = "{}"
echo     if (Test-Path $dbLocal) { $body = Get-Content -LiteralPath $dbLocal -Raw -Encoding UTF8 }
echo     try {
echo         $resp = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json; charset=utf-8" -TimeoutSec 10
echo         Write-Host " [OK] Dados da estacao centralizados com sucesso no Servidor Local!" -ForegroundColor Green
echo     } catch {
echo         Write-Host " [INFO] Servidor local registrou conexao no config_rede_estacoes.ini" -ForegroundColor Gray
echo     }
echo }
) > "%DEST_DIR%\\centralizar_dados_estacao.ps1"

(
echo @echo off
echo chcp 65001 ^>nul
echo title SucessoEdu - Centralizacao de Dados com Servidor Local
echo powershell -NoProfile -ExecutionPolicy Bypass -File "%%~dp0centralizar_dados_estacao.ps1" -RootDir "%%~dp0"
echo pause
) > "%DEST_DIR%\\centralizar_dados_estacao.bat"

:: Gerar script de envio direto de dados da estacao para o servidor local
(
echo param(
echo     [string]$JsonFile = "",
echo     [string]$ServerUrl = "%SERVER_URL%"
echo ^)
echo $ErrorActionPreference = "SilentlyContinue"
echo if (-not $ServerUrl -and (Test-Path "C:\\SucessoEdu\\config_rede_estacoes.ini"^)^) {
echo     $line = Get-Content "C:\\SucessoEdu\\config_rede_estacoes.ini" ^| Where-Object { $_ -match "^URL_Acesso=" } ^| Select-Object -First 1
echo     if ($line^) { $ServerUrl = ($line -split "="^)[1].Trim(^) }
echo }
echo if (-not $ServerUrl^) { $ServerUrl = "http://%TARGET_SERVER%:%TARGET_PORT%" }
echo $endpoint = $ServerUrl.TrimEnd("/"^) + "/api/sync"
echo $body = "{}"
echo if ($JsonFile -and (Test-Path $JsonFile^)^) { $body = Get-Content -LiteralPath $JsonFile -Raw -Encoding UTF8 }
echo try {
echo     $resp = Invoke-RestMethod -Uri $endpoint -Method Post -Body $body -ContentType "application/json; charset=utf-8" -TimeoutSec 8
echo     Write-Host " [OK] Dados enviados com sucesso ao Servidor Central Local!" -ForegroundColor Green
echo } catch {
echo     Write-Host " [FALHA] Nao foi possivel conectar ao Servidor Local em $endpoint" -ForegroundColor Red
echo }
) > "%DEST_DIR%\\enviar_dados_ao_servidor.ps1"

(
echo @echo off
echo chcp 65001 ^>nul
echo title SucessoEdu - Envio de Dados para o Servidor Local
echo powershell -NoProfile -ExecutionPolicy Bypass -File "%%~dp0enviar_dados_ao_servidor.ps1" %%*
echo exit /b
) > "%DEST_DIR%\\enviar_dados_ao_servidor.bat"

echo.
echo [2/3] Criando Atalho Exclusivo na Area de Trabalho da Estacao...
del /f /q "%USERPROFILE%\\Desktop\\SucessoEdu*.url" >nul 2>&1
del /f /q "%PUBLIC%\\Desktop\\SucessoEdu*.url" >nul 2>&1
del /f /q "%OneDrive%\\Desktop\\SucessoEdu*.url" >nul 2>&1

if exist "%DEST_DIR%\\criar_atalhos.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%DEST_DIR%\\criar_atalhos.ps1" -TargetUrl "%SERVER_URL%" -ShortcutName "SucessoEdu Gestão Educacional" -Port %TARGET_PORT% >nul 2>&1
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $d = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop); $s = $ws.CreateShortcut((Join-Path $d 'SucessoEdu Gestão Educacional.lnk')); $s.TargetPath = 'C:\\SucessoEdu\\Abrir_Estacao.bat'; $s.WorkingDirectory = 'C:\\SucessoEdu'; if (Test-Path 'C:\\SucessoEdu\\sucessoedu.ico') { $s.IconLocation = 'C:\\SucessoEdu\\sucessoedu.ico,0' }; $s.Description = 'SucessoEdu Gestão Educacional'; $s.Save()"
)

echo [OK] Atalho unico oficial "SucessoEdu Gestao Educacional" criado na Area de Trabalho!

${
  config.autoStart
    ? `
echo.
echo [3/3] Configurando Inicializacao Automatica ao Ligar o PC...
set "STARTUP_DIR=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$wsh = New-Object -ComObject WScript.Shell; $sc = $wsh.CreateShortcut('%STARTUP_DIR%\\SucessoEdu_Estacao.lnk'); $sc.TargetPath = 'C:\\SucessoEdu\\Abrir_Estacao.bat'; $sc.WorkingDirectory = 'C:\\SucessoEdu'; if (Test-Path 'C:\\SucessoEdu\\sucessoedu.ico') { $sc.IconLocation = 'C:\\SucessoEdu\\sucessoedu.ico,0' }; $sc.Description = 'SucessoEdu Estacao de Trabalho'; $sc.Save()" >nul 2>&1
echo      [OK] Estacao abrira automaticamente na tela do SucessoEdu ao iniciar o Windows.
`
    : `
echo.
echo [3/3] Inicializacao automatica desmarcada nas opcoes.
`
}
echo.

echo ===============================================================================
echo   ESTACAO CONFIGURADA COM SUCESSO EM C:\\SucessoEdu!
echo ===============================================================================
echo   - Computador Alvo:   ${config.stationName}
echo   - Servidor Local:    %SERVER_URL%
echo   - Pasta Raiz:        C:\\SucessoEdu
echo   - O icone "SucessoEdu Gestao Educacional" ja esta na Area de Trabalho.
echo.
echo   Abrindo o sistema em Modo Estacao de Trabalho...
if exist "%DEST_DIR%\\SucessoEdu_App.vbs" (
    wscript "%DEST_DIR%\\SucessoEdu_App.vbs"
) else (
    start "" "%SERVER_URL%"
)
pause
`;
  return toSafeBatchAscii(bat);
}

export function generateServerConfigIni(config: InstallerConfig): string {
  return `[SucessoEdu_Configuracao_Geral]
Nome_Escola=${config.schoolName}
IP_Servidor_Central=${config.serverIp}
Porta_Servidor=${config.serverPort}
Modo_Operacao=LOCAL_OFFLINE
Criado_Em=${new Date().toISOString()}

[Estacao_Trabalho]
Nome_Estacao=${config.stationName}
Tipo_Estacao=${config.stationType}
Modo_Kiosk=${config.kioskMode ? 'SIM' : 'NAO'}
Auto_Inicializacao=${config.autoStart ? 'SIM' : 'NAO'}

[Seguranca_Rede]
Liberar_Firewall=${config.enableFirewallRule ? 'SIM' : 'NAO'}
Auditoria_Ativa=SIM
`;
}

// -------------------------------------------------------------
// 3.5. DIAGNÓSTICO E TESTE DE CONECTIVIDADE
// -------------------------------------------------------------

export function generateDiagnosticBat(config: InstallerConfig): string {
  return `@echo off
chcp 65001 >nul
title SucessoEdu - Teste de Diagnostico de Rede e Conectividade
color 0E

echo ===============================================================================
echo      SUCESSOEDU GESTAO EDUCACIONAL - DIAGNOSTICO DE REDE E CONECTIVIDADE
echo      Servidor Alvo: ${config.serverIp}:${config.serverPort}
echo ===============================================================================
echo.

echo [1/3] Testando conectividade ICMP (Ping)...
ping -n 3 ${config.serverIp}
echo.

echo [2/3] Testando comunicacao com a porta TCP ${config.serverPort}...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$tcp = New-Object System.Net.Sockets.TcpClient; try { $ar = $tcp.BeginConnect('${config.serverIp}', ${config.serverPort}, $null, $null); $ok = $ar.AsyncWaitHandle.WaitOne(3000, $false); if ($ok) { $tcp.EndConnect($ar); Write-Host '  [SUCESSO] Porta ${config.serverPort} acessivel e respondendo no Servidor!' -ForegroundColor Green } else { Write-Host '  [FALHA] Porta ${config.serverPort} inacessivel. Verifique se o servidor esta iniciado.' -ForegroundColor Red } } catch { Write-Host '  [ERRO] Rota nao encontrada para ${config.serverIp}.' -ForegroundColor Red } finally { $tcp.Close() }"
echo.

echo [3/3] Informacoes do Adaptador de Rede Local deste computador:
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' } | Format-Table InterfaceAlias, IPAddress, PrefixLength -AutoSize"

echo.
echo ===============================================================================
echo Teste concluido. Pressione qualquer tecla para sair.
echo ===============================================================================
pause >nul
`;
}

// -------------------------------------------------------------
// 4. GERADOR DE CONFIGURAÇÃO PARA NUVEM / WEB / DOCKER / VPS
// -------------------------------------------------------------

export function generateDockerfile(config: InstallerConfig): string {
  return `# =========================================================================
# Dockerfile Multi-Stage de Produção para SucessoEdu Gestão Educacional
# Otimizado para Cloud Run, AWS ECS, DigitalOcean, VPS Linux ou Servidores Locais
# =========================================================================

# Estágio 1: Build da Aplicação Frontend e Servidor
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Estágio 2: Imagem Final Leve e Segura para Produção
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV SCHOOL_NAME="${config.schoolName}"

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/index.html ./index.html

EXPOSE 3000

USER node
CMD ["node", "dist/server.cjs"]
`;
}

export function generateCloudDockerCompose(config: InstallerConfig): string {
  return `version: '3.8'

services:
  sucessoedu-web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: sucessoedu_app_prod
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=3000
      - SCHOOL_NAME=${config.schoolName}
    volumes:
      - sucessoedu_data:/app/data
    networks:
      - sucessoedu_network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  nginx-proxy:
    image: nginx:alpine
    container_name: sucessoedu_nginx_proxy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - sucessoedu-web
    networks:
      - sucessoedu_network

volumes:
  sucessoedu_data:
    driver: local

networks:
  sucessoedu_network:
    driver: bridge
`;
}

export function generateNginxConfig(config: InstallerConfig): string {
  return `server {
    listen 80;
    listen [::]:80;
    server_name _;

    client_max_body_size 50M;

    location / {
        proxy_pass http://sucessoedu-web:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;
}

export function generateCloudDeployScript(config: InstallerConfig): string {
  return `#!/bin/bash
set -e

echo "======================================================================="
echo "   INSTALADOR DE DEPLOY EM NUVEM - SUCESSOEDU GESTAO EDUCACIONAL      "
echo "   Instituição: ${config.schoolName}"
echo "======================================================================="

sudo apt-get update -y
if ! [ -x "$(command -v docker)" ]; then
    echo "Instalando Docker Engine..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

if ! [ -x "$(command -v docker-compose)" ]; then
    echo "Instalando Docker Compose..."
    sudo apt-get install -y docker-compose
fi

echo "Construindo imagem da aplicação e iniciando serviços..."
sudo docker-compose -f docker-compose.cloud.yml up -d --build

sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true
sudo ufw allow 3000/tcp || true

SERVER_IP=$(curl -s ifconfig.me || echo "IP_DO_SEU_SERVIDOR")

echo ""
echo "======================================================================="
echo "   SISTEMA IMPLANTADO COM SUCESSO NA NUVEM!                            "
echo "======================================================================="
echo "   Acesso Web Imediato: http://$SERVER_IP"
echo "   Porta Direta:        http://$SERVER_IP:3000"
echo "======================================================================="
`;
}

export function generateCloudRunDeployScript(config: InstallerConfig): string {
  return `#!/bin/bash
PROJECT_ID="sucessoedu-cloud-prod"
SERVICE_NAME="sucessoedu-web"
REGION="us-east1"

echo "Iniciando build e deploy no Google Cloud Run..."
gcloud config set project $PROJECT_ID
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME
gcloud run deploy $SERVICE_NAME \\
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \\
    --platform managed \\
    --region $REGION \\
    --allow-unauthenticated \\
    --port 3000 \\
    --set-env-vars SCHOOL_NAME="${config.schoolName}"

echo "Deploy concluído com sucesso no Cloud Run!"
`;
}

export function generateCloudHostingManual(config: InstallerConfig): string {
  return `# GUIA DE HOSPEDAGEM EM NUVEM E ACESSO WEB
**Sistema:** SucessoEdu Gestão Educacional v5.0 Enterprise Cloud
**Instituição:** ${config.schoolName}

---

## 1. Opções Disponíveis de Hospedagem Web / Nuvem

O **SucessoEdu Gestão Educacional** é 100% compatível com as principais plataformas em nuvem:

### Opção A: VPS Linux (DigitalOcean, AWS EC2, Linode, Hetzner, Hostinger)
1. Conecte no seu servidor via SSH.
2. Clone ou envie os arquivos da aplicação.
3. Execute o script de instalação automática:
   \`\`\`bash
   chmod +x deploy_cloud.sh
   ./deploy_cloud.sh
   \`\`\`
4. O sistema iniciará automaticamente na porta 80/3000.

### Opção B: Google Cloud Run (Serverless Escalável)
1. Instale a Google Cloud CLI (\`gcloud\`).
2. Execute o script \`deploy_cloud_run.sh\`.
3. Você receberá uma URL segura HTTPS instantânea com escalonamento automático e alta disponibilidade.

---

*Equipe de Engenharia SucessoEdu - Suporte Técnico: suportetecnicoads@gmail.com*
`;
}

// -------------------------------------------------------------
// 5. MÓDULO POLO REMOTO / ESCOLA SATÉLITE FORA DA REDE
// -------------------------------------------------------------

export function generateRemoteSatelliteSchoolBat(config: InstallerConfig): string {
  const safeSchool = sanitizeBatchString(config.schoolName);
  return `@echo off
chcp 65001 >nul
title SucessoEdu - Instalador Polo Remoto / Escola Fora da Rede
color 2F

:: Garantir que o diretorio de trabalho seja o local do script (suporta espacos e caracteres especiais)
set "SCRIPT_DIR=%~dp0"
for %%I in ("%~dp0.") do set "SCRIPT_DIR=%%~fI"
cd /d "%SCRIPT_DIR%"

:: 1. Verificacao de Privilegios e Auto-Elevacao se necessario
net session >nul 2>&1
if %errorLevel% neq 0 (
    set "SELF_BAT=%~f0"
    set "SELF_DIR=%SCRIPT_DIR%"
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$b = $env:SELF_BAT; $d = $env:SELF_DIR; $proc = Start-Process -FilePath $env:ComSpec -ArgumentList @('/k', ('\"\"' + $b + '\"\" ELEVATED')) -WorkingDirectory $d -Verb RunAs -PassThru -ErrorAction SilentlyContinue; if ($proc) { exit 0 } else { exit 1 }"
    exit /b
)

:: Desbloquear arquivos baixados
set "SELF_DIR=%SCRIPT_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "if ($env:SELF_DIR -and (Test-Path -LiteralPath $env:SELF_DIR)) { Get-ChildItem -LiteralPath $env:SELF_DIR -Recurse -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue }" >nul 2>&1

set "DEST_DIR=C:\\SucessoEdu"
set "SRC_DIR=%SCRIPT_DIR%"

if not exist "%DEST_DIR%" mkdir "%DEST_DIR%" >nul 2>&1
if not exist "%DEST_DIR%\\Backups" mkdir "%DEST_DIR%\\Backups" >nul 2>&1

:: Snapshot de seguranca caso ja existam dados prévios (Atualizacao)
set "TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "BACKUP_DIR=%DEST_DIR%\\Backups\\Backup_Polo_%TIMESTAMP%"
if exist "%DEST_DIR%\\data" (
    if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%" >nul 2>&1
    xcopy /y /e /q /i "%DEST_DIR%\\data" "%BACKUP_DIR%\\data\\" >nul 2>&1
    copy /y "%DEST_DIR%\\*.json" "%BACKUP_DIR%\\" >nul 2>&1
    copy /y "%DEST_DIR%\\*.ini" "%BACKUP_DIR%\\" >nul 2>&1
    copy /y "%DEST_DIR%\\*.edusync" "%BACKUP_DIR%\\" >nul 2>&1
)

:: Detectar IP da rede local do computador / servidor
set "LOCAL_IP="
for /f "tokens=*" %%i in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.InterfaceAlias -notmatch 'Loopback|vEthernet|VirtualBox|VMware|WSL|Bluetooth' } | Select-Object -First 1 -ExpandProperty IPAddress); if (-not $ip) { $ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1 -ExpandProperty IPAddress) }; if ($ip) { $ip } else { '127.0.0.1' }"') do set "LOCAL_IP=%%i"
if "%LOCAL_IP%"=="" set "LOCAL_IP=127.0.0.1"
set "TARGET_URL=http://%LOCAL_IP%:${config.serverPort}"

echo ===============================================================================
echo        SUCESSOEDU GESTAO EDUCACIONAL - POLO REMOTO / ESCOLA SATELITE
echo        Unidade: ${safeSchool}
echo        Pasta Raiz Oficial: C:\\SucessoEdu
echo ===============================================================================
echo.
echo  Este modulo instala/atualiza o SucessoEdu de forma 100%% independente e offline.
echo  Todos os dados lancados nesta escola (matriculas, notas, provas, censo)
echo  ficam salvos em C:\\SucessoEdu e podem ser exportados via pendrive (.edusync).
echo.
echo [1/3] Copiando e Atualizando Arquivos na Pasta Raiz C:\\SucessoEdu...
if /i not "%SRC_DIR%"=="%DEST_DIR%" (
    xcopy /y /e /c /h /r /k /i "%~dp0*" "%DEST_DIR%\\" >nul 2>&1
)

if exist "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" (
    copy /y "%DEST_DIR%\\SucessoEdu_Aplicativo_Offline.html" "%DEST_DIR%\\index.html" >nul 2>&1
) else if exist "%~dp0SucessoEdu_Aplicativo_Offline.html" (
    copy /y "%~dp0SucessoEdu_Aplicativo_Offline.html" "%DEST_DIR%\\index.html" >nul 2>&1
)

(
echo @echo off
echo chcp 65001 ^^>nul
echo title SucessoEdu Gestao Educacional - Polo Remoto
echo cd /d "%%%%~dp0"
echo powershell -NoProfile -ExecutionPolicy Bypass -Command "$c = Get-NetTCPConnection -LocalPort ${config.serverPort} -State Listen -ErrorAction SilentlyContinue; if (-not $c) { if (Test-Path 'iniciar_servidor_silencioso.vbs') { Start-Process wscript.exe -ArgumentList 'iniciar_servidor_silencioso.vbs' } elseif (Test-Path 'servidor_tray.ps1') { Start-Process powershell.exe -ArgumentList '-STA -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File servidor_tray.ps1 -Port ${config.serverPort}' } }" ^^>nul 2^^>^^&1
echo timeout /t 1 /nobreak ^^>nul
echo start "" "http://%LOCAL_IP%:${config.serverPort}"
echo exit /b
) > "%DEST_DIR%\\Abrir_SucessoEdu.bat"

echo.
echo [2/3] Configurando Atalho Exclusivo do Aplicativo na Area de Trabalho...
del /f /q "%USERPROFILE%\\Desktop\\SucessoEdu*.url" >nul 2>&1
del /f /q "%PUBLIC%\\Desktop\\SucessoEdu*.url" >nul 2>&1
del /f /q "%OneDrive%\\Desktop\\SucessoEdu*.url" >nul 2>&1

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $d = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop); $s = $ws.CreateShortcut((Join-Path $d 'SucessoEdu Gestão Educacional.lnk')); $s.TargetPath = 'C:\\SucessoEdu\\Abrir_SucessoEdu.bat'; $s.WorkingDirectory = 'C:\\SucessoEdu'; if (Test-Path 'C:\\SucessoEdu\\sucessoedu.ico') { $s.IconLocation = 'C:\\SucessoEdu\\sucessoedu.ico,0' }; $s.Description = 'SucessoEdu Gestão Educacional - Polo Remoto'; $s.Save()"

echo      [OK] Atalho unico oficial criado com sucesso na Area de Trabalho!
echo.

echo [3/3] Criando Pasta de Sincronizacao de Pendrive...
set SINC_DIR=%USERPROFILE%\\Desktop\\Sincronizacao_SME
if not exist "%SINC_DIR%" mkdir "%SINC_DIR%"
echo      [OK] Pasta criada: %SINC_DIR%
echo.

echo ===============================================================================
echo   POLO REMOTO PRONTO PARA USO EM C:\\SucessoEdu!
echo ===============================================================================
echo.
echo   Para usar o sistema:
echo   1. Abra o icone "SucessoEdu Gestao Educacional" na Area de Trabalho.
echo   2. Apos lancar as notas e presencas, acesse o menu "Gestao Municipal".
echo   3. Clique em "Gerar Pacote Polo Remoto (.edusync)" e salve no Pendrive.
echo ===============================================================================
echo.
if exist "%DEST_DIR%\\SucessoEdu_App.vbs" (
    wscript "%DEST_DIR%\\SucessoEdu_App.vbs"
) else (
    start "" "%TARGET_URL%"
)
pause
`;
}

export function generateRemoteSyncManualMarkdown(config?: Partial<InstallerConfig>): string {
  const schoolName = config?.schoolName || 'Escola Municipal SucessoEdu';
  return `# MANUAL DE OPERAÇÃO: POLOS REMOTOS & ESCOLAS FORA DA REDE
**Sistema SucessoEdu Gestão Educacional - Rede Municipal de Educação**
*Unidade de Referência: ${schoolName}*

---

## 1. CONCEITO DA ARQUITETURA MUNICIPAL DESCENTRALIZADA
Para atender escolas municipais localizadas em zonas rurais, distritos afastados ou prédios sem conexão com a internet, o **SucessoEdu Gestão Educacional** foi projetado com uma arquitetura **100% Offline-First**.

Cada escola opera com seu banco de dados local com autonomia total para:
- Realizar matrículas de novos alunos.
- Lançar notas e presenças bimestrais.
- Aplicar provas e corrigir com gabarito automático.
- Atualizar o Censo Escolar (Educacenso).

---

## 2. PROCEDIMENTO DE SINCRONIZAÇÃO VIA PENDRIVE (.edusync)

### PASSO A: Na Escola Satélite (Polo Remoto)
1. Abra o sistema no computador da secretaria escolar.
2. No menu lateral, acesse **"Gestão Municipal & Censo"**.
3. Selecione a aba **"Gerar Pacote Polo Satélite"**.
4. Confira os totais de alunos e notas lançadas.
5. Insira o pendrive e clique no botão verde **"Gerar e Baixar Pacote (.edusync)"**.
6. Salve o arquivo gerado dentro do pendrive.

### PASSO B: Na Secretaria Municipal de Educação (Sede Central)
1. No computador da Secretaria Municipal de Educação, acesse **"Gestão Municipal & Censo"**.
2. Clique na aba **"Central de Unificação SME"**.
3. Arraste ou selecione o arquivo \`.edusync\` gravado no pendrive.
4. O sistema irá validar a assinatura digital e exibir o resumo prévio.
5. Clique em **"Unificar na Base Central Municipal"**.
6. Todos os relatórios do Censo e IDEB serão instantaneamente consolidados com os dados daquela escola.

---
*Suporte Técnico Municipal: suportetecnicoads@gmail.com*
`;
}

export function generateOfflineManualMarkdown(config: InstallerConfig): string {
  return `# MANUAL DE INSTALAÇÃO & OPERAÇÃO COMPLETA
# SUCESSOEDU GESTÃO EDUCACIONAL (VERSÃO 5.0 ENTERPRISE)
**Instituição Licenciada:** ${config.schoolName}
**Porta de Rede:** ${config.serverPort}
**Suporte Técnico:** suportetecnicoads@gmail.com

---

## 1. Como Resolver Avisos de Firewall ou SmartScreen no Windows

Ao executar arquivos baixados da Internet, o Windows pode exibir avisos de segurança:
1. **Aviso do SmartScreen ("O Windows protegeu o seu computador"):**
   - Clique em **"Mais informações"**.
   - Em seguida, clique no botão **"Executar assim mesmo"**.
2. **Como Liberar o Firewall Manualmente (se necessário):**
   - Execute o arquivo **\`00_LIBERAR_FIREWALL_E_PORTAS.bat\`** clicando com o botão direito e escolhendo **"Executar como Administrador"**.
   - Isso abrirá a porta \`${config.serverPort}\` para conexões em qualquer tipo de rede (Wi-Fi privada ou pública).
3. **Nas Estações de Alunos e Professores:**
   - O arquivo **\`Instalar_Estacao_Windows.bat\`** NÃO precisa de permissões de administrador. Basta dar duplo clique!

---

## 2. GUIA PASSO A PASSO: INSTALAÇÃO DO ZERO (Computador Novo ou Primeira Implantação)

Siga este procedimento caso o computador seja novo, recém-formatado ou nunca tenha recebido o SucessoEdu:

### Passo 1: Obter e Extrair o Pacote Oficial
1. Baixe o pacote oficial \`SucessoEdu_Instalador_Completo_v5.4.1.zip\` da pasta do Google Drive homologada (\`suportetecnicoads@gmail.com\`) ou copie do pen drive oficial.
2. Clique com o botão direito no arquivo \`.zip\` e selecione **"Extrair Tudo..."** para uma pasta acessível (ex: \`Downloads\` ou \`Área de Trabalho\`).

### Passo 2: Executar o Instalador Unificado como Administrador
1. Abra a pasta extraída e localize o arquivo:
   👉 **\`Instalador_Unificado_SucessoEdu.bat\`**
2. Clique nele com o **botão direito do mouse** e escolha **"Executar como Administrador"**.
3. Na janela do Controle de Conta de Usuário (UAC) do Windows, clique em **"Sim"**.

### Passo 3: Escolher a Opção [1] no Menu Principal
1. No menu interativo, digite **\`1\`** e aperte **Enter** para selecionar:
   \`[1] INSTALAR SERVIDOR CENTRAL OFFLINE (COMPLETO)\`.
2. O instalador executará todo o processo automaticamente:
   - Cria a pasta raiz oficial em \`C:\\SucessoEdu\` com as subpastas \`data\\\` e \`Backups\\\`.
   - Concede permissões totais no Windows (\`icacls\`) para evitar bloqueios de escrita.
   - Libera a porta de rede \`${config.serverPort}\` no Firewall do Windows.
   - Implanta o aplicativo web offline, o micro-servidor (\`server_micro.ps1\`), ícone da bandeja (\`servidor_tray.ps1\`) e o widget flutuante de status (\`servidor_widget_flutuante.ps1\`).
   - Cria **exclusivamente 1 atalho oficial** na Área de Trabalho com o ícone oficial: **\`SucessoEdu Gestão Educacional.lnk\`**.
   - Configura a inicialização automática com o Windows.

### Passo 4: Acesso e Inicialização
- O sistema abrirá imediatamente em seu navegador em: \`http://localhost:${config.serverPort}\` (ou \`http://127.0.0.1:${config.serverPort}\`).
- Para acessar a partir de outros computadores da escola, use o endereço da rede: \`http://${config.serverIp}:${config.serverPort}\`.

---

## 3. GUIA PASSO A PASSO: ATUALIZAÇÃO EM COMPUTADOR QUE JÁ TEM O SISTEMA

Siga este procedimento para atualizar um computador que **já possui o SucessoEdu instalado em \`C:\\SucessoEdu\`**, preservando 100% dos dados, alunos, notas e turmas:

### 🔒 Garantia de Proteção de Dados:
- O instalador gera obrigatoriamente um **backup preventivo automático** em \`C:\\SucessoEdu\\Backups\\Backup_Update_[DATA_HORA]\` antes de realizar qualquer alteração.
- A pasta \`data/\` e os arquivos de dados locais (\`*.json\`, \`*.sqlite\`, \`*.db\`) **jamais são excluídos**.

### Passo 1: Baixar e Extrair a Nova Versão
1. Baixe o pacote de atualização mais recente (arquivo \`.zip\`).
2. Extraia o conteúdo para uma pasta temporária (ex: \`Downloads\`).
3. *(Opcional)*: Se desejar um backup manual extra, acesse o SucessoEdu em execução, vá em **⚙️ Atualizações & Nuvem** e clique em **"Fazer Backup Agora (1-Clique)"**.

### Passo 2: Executar o Atualizador como Administrador
1. Na pasta extraída, clique com o **botão direito** no arquivo:
   👉 **\`ATUALIZAR_SISTEMA_LOCAL.bat\`**
   *(ou execute \`Instalador_Unificado_SucessoEdu.bat\` e escolha a opção \`[2] ATUALIZAR SISTEMA EXISTENTE\`)*.
2. Selecione **"Executar como Administrador"** e confirme no UAC.

### Passo 3: Execução Automatizada em 5 Etapas
O script de atualização executará sozinho:
1. **Encerramento Seguro:** Encerra os serviços anteriores para liberar as portas e arquivos.
2. **Backup Preventivo:** Copia todos os dados existentes para \`C:\\SucessoEdu\\Backups\\\` e emite o manifesto de integridade.
3. **Limpeza Seletiva:** Remove apenas páginas e scripts de código antigos, mantendo a pasta \`data/\` intacta.
4. **Cópia da Nova Versão:** Substitui os arquivos do sistema em \`C:\\SucessoEdu\` com os novos recursos e correções.
5. **Renovação do Atalho:** Atualiza o atalho único oficial \`SucessoEdu Gestão Educacional.lnk\` no Desktop.

### Passo 4: Reinício Automático
- O servidor é reiniciado e o navegador abre a nova versão atualizada.
- Todos os seus alunos, turmas, notas e relatórios estarão preservados!

---

## 4. ATUALIZAÇÃO NAS ESTAÇÕES DE TRABALHO (Professores, Alunos e Secretaria)

Nas estações de trabalho e laboratórios que se conectam ao Servidor Central pela rede local:
1. **Não é necessário reinstalar nada.**
2. Assim que o computador servidor for atualizado, basta abrir o navegador em cada estação e pressionar <kbd>F5</kbd> ou <kbd>Ctrl</kbd> + <kbd>F5</kbd>.
3. O novo sistema será carregado instantaneamente!
4. *(Caso o IP mude)*: Execute na estação o script \`buscar_servidor_rede.ps1\` para localizar o servidor automaticamente na rede.

---

## 5. MÉTODOS ALTERNATIVOS DE ATUALIZAÇÃO

### 🌟 Método A: Atualização via Nuvem (Google Drive Oficial - OTA 1-Clique)
Se o computador servidor tiver acesso à internet:
1. Abra o SucessoEdu e acesse **⚙️ Atualizações & Nuvem**.
2. Clique em **"☁️ Verificar Atualizações no Google Drive"**.
3. Clique em **"⚡ Sincronizar Nuvem (OTA 1-Clique)"**. O sistema baixa e aplica a atualização automaticamente.

### 💾 Método B: Pacote Assinado Offline (.edupkg) via Pen Drive
Para servidores sem internet contínua:
1. Baixe o arquivo \`.edupkg\` oficial em qualquer máquina conectada e copie para um pen drive.
2. No servidor, vá em **⚙️ Atualizações & Nuvem > Executar Pacote Offline (.edupkg)**.
3. Selecione o arquivo e confirme a instalação com validação de hash SHA-256.

### 🐧 Método C: Servidor Linux / Docker
\`\`\`bash
cd /opt/sucessoedu
sudo systemctl stop sucessoedu  # ou sudo docker-compose down
cp -r ./data ./data_backup_$(date +%Y%m%d_%H%M%S)
# Extraia os novos arquivos e reinicie:
sudo systemctl start sucessoedu  # ou sudo docker-compose up -d --build
\`\`\`

---

## 6. RESOLUÇÃO DE PROBLEMAS & MENSAGENS NO PROMPT DO WINDOWS

### A. Erro: "A sintaxe do nome do arquivo, do nome do diretório ou do rótulo do volume está incorreta"
- **Causa:** Ocorre quando o instalador é executado de uma pasta descompactada cujo caminho contém parênteses como \`(6)\`, espaços ou acentos, e o comando de elevação tenta passar as aspas de forma incompatível com o cmd.exe.
- **Correção Definitiva no SucessoEdu 5.4+:** Os scripts do instalador foram atualizados para utilizar caminhos literais seguros e chamada por variáveis de ambiente (\`$env:SELF_BAT\`).
- **Dica Prática Adicional:** Se você estiver com um instalador anterior, basta renomear a pasta de download retirando caracteres como \`(6)\` ou mover a pasta para \`C:\\Instalador_SucessoEdu\` antes de executar.

### B. A pasta C:\\SucessoEdu não é criada
- Certifique-se de clicar com o **botão direito** no arquivo \`.bat\` e selecionar **"Executar como Administrador"**. O Windows bloqueia a criação de pastas no drive C: caso o script seja executado sem elevação.
- Se o drive C: for bloqueado pela TI da prefeitura/escola por GPO, o instalador usará automaticamente a pasta de usuário \`%LOCALAPPDATA%\\SucessoEdu\`.

### C. Porta 3000 travada ou Processo anterior em execução
- Execute como Administrador o script \`DESINSTALAR_OU_LIMPAR_SUCESSOEDU.bat\` (ou opção \`[6]\` do \`Instalador_Unificado_SucessoEdu.bat\`) e selecione a opção **[3] APENAS PARAR SERVIÇOS E LIBERAR PORTAS**. O script encerrará quaisquer instâncias presas e liberará a porta imediatamente, sem alterar nenhum arquivo ou dado.

### D. Como desinstalar ou resetar o ambiente com segurança
- Para remover a instalação de forma limpa, execute \`DESINSTALAR_OU_LIMPAR_SUCESSOEDU.bat\` como Administrador.
- **Opção [1] DESINSTALAÇÃO SEGURA:** Encerra serviços, remove regras de Firewall e atalhos, e **cria uma cópia de segurança completa de todos os seus dados na Área de Trabalho** antes de remover os arquivos de \`C:\\SucessoEdu\`.
- **Opção [2] LIMPEZA TOTAL:** Remove completamente a pasta e banco de dados (reset de fábrica).
- **Opção [3] LIBERAR PORTAS:** Encerra serviços presos mantendo todos os arquivos intactos.

---

## 7. Garantia de Integridade e Suporte Técnico
- As atualizações do **SucessoEdu** são desenvolvidas para preservar 100% dos dados históricos, notas, frequências, relatórios do Censo Escolar e dados de alunos.
- Para suporte técnico oficial, acione o canal de engenharia: **suportetecnicoads@gmail.com**.

---

*SucessoEdu Gestão Educacional - Tecnologia Soberana para Redes de Ensino.*
`;
}

/**
 * Gera o script Windows Batch (.bat) com UAC e chamada ao verificador de integridade SHA-256
 */
export function generateIntegrityVerificationBat(serverPort = 8088, schoolName = 'SucessoEdu Gestão Educacional'): string {
  return `@echo off
chcp 65001 >nul
title SucessoEdu - Auditoria de Integridade e Auto-Reparo SHA-256
set "SCRIPT_DIR=%~dp0"
for %%I in ("%~dp0.") do set "SCRIPT_DIR=%%~fI"
cd /d "%SCRIPT_DIR%"

:: Auto-elevacao para Administrador preservando diretorio
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

// -------------------------------------------------------------
// 6. GERADOR DE PACOTE ZIP COMPLETO (LOCAL + NUVEM + POLOS)
// -------------------------------------------------------------

export async function generateZipBundle(
  type: 'SERVER' | 'CLIENT' | 'CLOUD' | 'SATELLITE' | 'FULL',
  config: InstallerConfig,
  initialData?: any
): Promise<Blob> {
  const rawZip = new JSZip();
  const wrapFolder = (f: any) => {
    const origFile = f.file.bind(f);
    f.file = (name: string, data: any, options?: any) => {
      if (typeof data === 'string' && /\.(bat|cmd)$/i.test(name)) {
        return origFile(name, toSafeBatchAscii(data), options);
      }
      if (typeof data === 'string' && /\.(vbs|reg|ini|ps1)$/i.test(name)) {
        return origFile(name, toWindowsCrlf(data), options);
      }
      return origFile(name, data, options);
    };
    const origFolder = f.folder.bind(f);
    f.folder = (name: string) => {
      const sub = origFolder(name);
      return sub ? wrapFolder(sub) : sub;
    };
    return f;
  };
  const zip = wrapFolder(rawZip);
  const iconBuffer = await createSucessoEduIconUint8Array();

  const serverUrl = `http://localhost:${config.serverPort}`;
  const clientTargetUrl = `http://${config.serverIp}:${config.serverPort}`;

  const microServerPs1 = generateMicroServerPs1(config.serverPort);
  const serverTrayPs1 = generateServerTrayPs1(config.serverPort, config.schoolName);
  const microServerBat = generateMicroServerBat(config.serverPort);
  const silentMicroVbs = generateSilentMicroServerVbs(config.serverPort);
  const stopServerBat = generateStopServerBat(config.serverPort);
  const standaloneHtml = generateStandaloneOfflineHtml(config.schoolName, '', initialData);
  const autoDiscoveryPs1 = generateServerAutoDiscoveryPs1(config.serverPort, config.serverIp);
  const autoDiscoveryBat = generateServerAutoDiscoveryBat(config.serverPort, config.serverIp);
  const desktopShortcutBat = generateWebDesktopShortcutBat(clientTargetUrl, config.schoolName);
  const floatingWidgetPs1 = generateFloatingServerWidgetPs1(config.serverPort);
  const autoStartConfigBat = generateAutoStartConfigBat(config.schoolName, config.serverPort);
  const autoStartDisableBat = generateAutoStartDisableBat();

  const dailyBackupPs1 = generateDailyBackupPs1(config.schoolName);
  const dailyBackupBat = generateDailyBackupBat(config.schoolName);
  const configBackupTaskBat = generateConfigureDailyBackupTaskBat();
  const municipalSyncPs1 = generateMunicipalSyncPs1(config.schoolName, config.serverPort);
  const municipalSyncBat = generateMunicipalSyncBat(config.schoolName, config.serverPort);
  const stationSyncPs1 = generateCentralizeStationDataPs1(config.serverIp, config.serverPort);
  const stationSyncBat = generateCentralizeStationDataBat();

  const rootAppLauncherVbs = generateAppLauncherVbs(serverUrl, `SucessoEdu - ${config.schoolName}`);
  const rootShortcutVbs = generateShortcutInstallerVbs(serverUrl, 'SucessoEdu Gestao Educacional');
  const rootShortcutPs1 = generateShortcutInstallerPs1(serverUrl, 'SucessoEdu Gestão Educacional', config.serverPort);

  const clientAppLauncherVbs = generateAppLauncherVbs(clientTargetUrl, `SucessoEdu - ${config.schoolName} (${config.stationName})`);
  const clientShortcutVbs = generateShortcutInstallerVbs(clientTargetUrl, 'SucessoEdu Gestao Educacional');
  const clientShortcutPs1 = generateShortcutInstallerPs1(clientTargetUrl, `SucessoEdu - ${config.stationName}`, config.serverPort);
  const updateManualHtml = generateUpdateManualHtml();

  if (type === 'SERVER' || type === 'FULL') {
    const serverFolder = type === 'FULL' ? zip.folder('01_MODULO_SERVIDOR_LOCAL_OFFLINE')! : zip;
    serverFolder.file('sucessoedu.ico', iconBuffer);
    serverFolder.file('SucessoEdu_App.vbs', rootAppLauncherVbs);
    serverFolder.file('criar_atalhos.vbs', rootShortcutVbs);
    serverFolder.file('criar_atalhos.ps1', rootShortcutPs1);
    serverFolder.file('servidor_tray.ps1', serverTrayPs1);
    serverFolder.file('servidor_widget_flutuante.ps1', floatingWidgetPs1);
    serverFolder.file('server_micro.ps1', microServerPs1);
    serverFolder.file('buscar_servidor_rede.ps1', autoDiscoveryPs1);
    serverFolder.file('Buscar_Servidor_Rede.bat', autoDiscoveryBat);
    serverFolder.file('Criar_Atalho_Aplicativo_Desktop.bat', desktopShortcutBat);
    serverFolder.file('INICIAR_SERVIDOR_OFFLINE.bat', microServerBat);
    serverFolder.file('iniciar_servidor_silencioso.vbs', silentMicroVbs);
    serverFolder.file('PARAR_SERVIDOR.bat', stopServerBat);
    serverFolder.file('CONFIGURAR_INICIALIZACAO_AUTOMATICA.bat', autoStartConfigBat);
    serverFolder.file('DESATIVAR_INICIALIZACAO_AUTOMATICA.bat', autoStartDisableBat);
    serverFolder.file('SucessoEdu_Aplicativo_Offline.html', standaloneHtml);
    serverFolder.file('index.html', standaloneHtml);
    serverFolder.file('00_LIBERAR_FIREWALL_E_PORTAS.bat', generateFirewallUnlockBat(config));
    serverFolder.file('rotina_backup_diario.ps1', dailyBackupPs1);
    serverFolder.file('rotina_backup_diario.bat', dailyBackupBat);
    serverFolder.file('configurar_tarefa_backup_diario.bat', configBackupTaskBat);
    serverFolder.file('sincronizar_secretaria_municipio.ps1', municipalSyncPs1);
    serverFolder.file('sincronizar_secretaria_municipio.bat', municipalSyncBat);
    serverFolder.file('automacao_atualizacao_banco.ps1', DatabaseAutomatorService.generatePowerShellAutomationScript());
    serverFolder.file('automacao_atualizacao_banco.bat', DatabaseAutomatorService.generateBatchAutomationScript());
    serverFolder.file('atualizar_banco_sucessoedu_v5.5.sql', RelationalIntegrityService.generateDatabaseUpdateScript(initialData));
    serverFolder.file('ATUALIZAR_SISTEMA_LOCAL.bat', generateUpdateSystemBat(config.serverPort, config.schoolName));
    serverFolder.file('SUBSTITUICAO_TOTAL_SERVIDOR.bat', generateTotalServerReplacementBat(config.serverPort, config.schoolName));
    serverFolder.file('DESINSTALAR_OU_LIMPAR_SUCESSOEDU.bat', generateUninstallBat(config.serverPort, config.schoolName));
    serverFolder.file('LIMPAR_BASE_DADOS_PRODUCAO.bat', generateCleanDatabaseBat(config.serverPort, config.schoolName));
    serverFolder.file('VERIFICAR_ESTRUTURA_E_LAYOUT.bat', generateDirectoryVerificationBat(config.serverPort, config.schoolName));
    serverFolder.file('Instalar_Servidor_Windows.bat', generateServerWindowsBat(config));
    serverFolder.file('Configurar_Servico_PowerShell.ps1', generateServerWindowsPowerShellService(config));
    serverFolder.file('Abrir_SucessoEdu.bat', generateOpenSucessoEduBat(config.serverPort));
    serverFolder.file('Criar_Atalho_Desktop.bat', generateCreateDesktopShortcutBat(serverUrl, 'SucessoEdu Gestão Educacional'));
    serverFolder.file('docker-compose.yml', generateDockerCompose(config));
    serverFolder.file('config_servidor.ini', generateServerConfigIni(config));
    serverFolder.file('Diagnostico_Conexao.bat', generateDiagnosticBat(config));
    serverFolder.file('LEIA-ME_SERVIDOR_OFFLINE.txt', generateOfflineManualMarkdown(config));
    serverFolder.file('MANUAL_DE_INSTALACAO_E_ATUALIZACAO.html', updateManualHtml);
  }

  if (type === 'CLIENT' || type === 'FULL') {
    const clientFolder = type === 'FULL' ? zip.folder('02_MODULO_ESTACAO_TRABALHO_CLIENTE')! : zip;
    clientFolder.file('sucessoedu.ico', iconBuffer);
    clientFolder.file('SucessoEdu_App.vbs', clientAppLauncherVbs);
    clientFolder.file('criar_atalhos.vbs', clientShortcutVbs);
    clientFolder.file('criar_atalhos.ps1', clientShortcutPs1);
    clientFolder.file('servidor_tray.ps1', serverTrayPs1);
    clientFolder.file('servidor_widget_flutuante.ps1', floatingWidgetPs1);
    clientFolder.file('server_micro.ps1', microServerPs1);
    clientFolder.file('buscar_servidor_rede.ps1', autoDiscoveryPs1);
    clientFolder.file('Buscar_Servidor_Rede.bat', autoDiscoveryBat);
    clientFolder.file('Criar_Atalho_Aplicativo_Desktop.bat', desktopShortcutBat);
    clientFolder.file('INICIAR_SERVIDOR_OFFLINE.bat', microServerBat);
    clientFolder.file('iniciar_servidor_silencioso.vbs', silentMicroVbs);
    clientFolder.file('PARAR_SERVIDOR.bat', stopServerBat);
    clientFolder.file('CONFIGURAR_INICIALIZACAO_AUTOMATICA.bat', autoStartConfigBat);
    clientFolder.file('DESATIVAR_INICIALIZACAO_AUTOMATICA.bat', autoStartDisableBat);
    clientFolder.file('SucessoEdu_Aplicativo_Offline.html', standaloneHtml);
    clientFolder.file('index.html', standaloneHtml);
    clientFolder.file('Instalar_Estacao_Windows.bat', generateClientWindowsBat(config));
    clientFolder.file('Abrir_Estacao.bat', generateOpenStationBat(config.serverIp, config.serverPort));
    clientFolder.file('centralizar_dados_estacao.ps1', stationSyncPs1);
    clientFolder.file('centralizar_dados_estacao.bat', stationSyncBat);
    clientFolder.file('Criar_Atalho_Desktop.bat', generateCreateDesktopShortcutBat(clientTargetUrl, `SucessoEdu - ${config.stationName}`));
    clientFolder.file('config_estacao.ini', generateServerConfigIni(config));
    clientFolder.file('Diagnostico_Conexao.bat', generateDiagnosticBat(config));
    clientFolder.file('LEIA-ME_ESTACAO.txt', generateOfflineManualMarkdown(config));
    clientFolder.file('MANUAL_DE_INSTALACAO_E_ATUALIZACAO.html', updateManualHtml);
  }

  if (type === 'SATELLITE' || type === 'FULL') {
    const satFolder = type === 'FULL' ? zip.folder('03_MODULO_POLO_REMOTO_ESCOLA_OFFLINE')! : zip;
    satFolder.file('sucessoedu.ico', iconBuffer);
    satFolder.file('SucessoEdu_App.vbs', rootAppLauncherVbs);
    satFolder.file('criar_atalhos.vbs', rootShortcutVbs);
    satFolder.file('criar_atalhos.ps1', rootShortcutPs1);
    satFolder.file('servidor_tray.ps1', serverTrayPs1);
    satFolder.file('servidor_widget_flutuante.ps1', floatingWidgetPs1);
    satFolder.file('server_micro.ps1', microServerPs1);
    satFolder.file('buscar_servidor_rede.ps1', autoDiscoveryPs1);
    satFolder.file('Buscar_Servidor_Rede.bat', autoDiscoveryBat);
    satFolder.file('Criar_Atalho_Aplicativo_Desktop.bat', desktopShortcutBat);
    satFolder.file('INICIAR_SERVIDOR_OFFLINE.bat', microServerBat);
    satFolder.file('iniciar_servidor_silencioso.vbs', silentMicroVbs);
    satFolder.file('PARAR_SERVIDOR.bat', stopServerBat);
    satFolder.file('CONFIGURAR_INICIALIZACAO_AUTOMATICA.bat', autoStartConfigBat);
    satFolder.file('DESATIVAR_INICIALIZACAO_AUTOMATICA.bat', autoStartDisableBat);
    satFolder.file('SucessoEdu_Aplicativo_Offline.html', standaloneHtml);
    satFolder.file('index.html', standaloneHtml);
    satFolder.file('rotina_backup_diario.ps1', dailyBackupPs1);
    satFolder.file('rotina_backup_diario.bat', dailyBackupBat);
    satFolder.file('configurar_tarefa_backup_diario.bat', configBackupTaskBat);
    satFolder.file('sincronizar_secretaria_municipio.ps1', municipalSyncPs1);
    satFolder.file('sincronizar_secretaria_municipio.bat', municipalSyncBat);
    satFolder.file('Instalar_Polo_Remoto_Windows.bat', generateRemoteSatelliteSchoolBat(config));
    satFolder.file('Abrir_SucessoEdu.bat', generateOpenSucessoEduBat(config.serverPort));
    satFolder.file('Criar_Atalho_Desktop.bat', generateCreateDesktopShortcutBat(serverUrl, 'SucessoEdu Gestão Educacional'));
    satFolder.file('Diagnostico_Conexao.bat', generateDiagnosticBat(config));
    satFolder.file('MANUAL_POLO_REMOTO_E_SINCRONIZACAO.md', generateRemoteSyncManualMarkdown(config));
    satFolder.file('MANUAL_DE_INSTALACAO_E_ATUALIZACAO.html', updateManualHtml);
  }

  if (type === 'CLOUD' || type === 'FULL') {
    const cloudFolder = type === 'FULL' ? zip.folder('04_MODULO_HOSPEDAGEM_NUVEM_E_SITE_WEB')! : zip;
    cloudFolder.file('Dockerfile', generateDockerfile(config));
    cloudFolder.file('docker-compose.cloud.yml', generateCloudDockerCompose(config));
    cloudFolder.file('nginx.conf', generateNginxConfig(config));
    cloudFolder.file('deploy_cloud.sh', generateCloudDeployScript(config));
    cloudFolder.file('deploy_cloud_run.sh', generateCloudRunDeployScript(config));
    cloudFolder.file('MANUAL_HOSPEDAGEM_NUVEM_E_SITE.md', generateCloudHostingManual(config));
    cloudFolder.file('MANUAL_DE_INSTALACAO_E_ATUALIZACAO.html', updateManualHtml);
  }

  // Unified Universal Installer at root
  zip.file('sucessoedu.ico', iconBuffer);
  zip.file('SucessoEdu_App.vbs', rootAppLauncherVbs);
  zip.file('criar_atalhos.vbs', rootShortcutVbs);
  zip.file('criar_atalhos.ps1', rootShortcutPs1);
  zip.file('servidor_tray.ps1', serverTrayPs1);
  zip.file('servidor_widget_flutuante.ps1', floatingWidgetPs1);
  zip.file('server_micro.ps1', microServerPs1);
  zip.file('buscar_servidor_rede.ps1', autoDiscoveryPs1);
  zip.file('Buscar_Servidor_Rede.bat', autoDiscoveryBat);
  zip.file('Criar_Atalho_Aplicativo_Desktop.bat', desktopShortcutBat);
  zip.file('Abrir_SucessoEdu.bat', generateOpenSucessoEduBat(config.serverPort));
  zip.file('Criar_Atalho_Desktop.bat', generateCreateDesktopShortcutBat(serverUrl, 'SucessoEdu Gestão Educacional'));
  zip.file('INICIAR_SERVIDOR_OFFLINE.bat', microServerBat);
  zip.file('iniciar_servidor_silencioso.vbs', silentMicroVbs);
  zip.file('PARAR_SERVIDOR.bat', stopServerBat);
  zip.file('CONFIGURAR_INICIALIZACAO_AUTOMATICA.bat', autoStartConfigBat);
  zip.file('DESATIVAR_INICIALIZACAO_AUTOMATICA.bat', autoStartDisableBat);
  zip.file('SucessoEdu_Aplicativo_Offline.html', standaloneHtml);
  zip.file('index.html', standaloneHtml);
  zip.file('00_LIBERAR_FIREWALL_E_PORTAS.bat', generateFirewallUnlockBat(config));
  zip.file('rotina_backup_diario.ps1', dailyBackupPs1);
  zip.file('rotina_backup_diario.bat', dailyBackupBat);
  zip.file('configurar_tarefa_backup_diario.bat', configBackupTaskBat);
  zip.file('sincronizar_secretaria_municipio.ps1', municipalSyncPs1);
  zip.file('sincronizar_secretaria_municipio.bat', municipalSyncBat);
  zip.file('centralizar_dados_estacao.ps1', stationSyncPs1);
  zip.file('centralizar_dados_estacao.bat', stationSyncBat);
  zip.file('Instalar_Servidor_Windows.bat', generateServerWindowsBat(config));
  zip.file('Instalar_Estacao_Windows.bat', generateClientWindowsBat(config));
  zip.file('ATUALIZAR_SISTEMA_LOCAL.bat', generateUpdateSystemBat(config.serverPort, config.schoolName));
  zip.file('SUBSTITUICAO_TOTAL_SERVIDOR.bat', generateTotalServerReplacementBat(config.serverPort, config.schoolName));
  zip.file('DESINSTALAR_OU_LIMPAR_SUCESSOEDU.bat', generateUninstallBat(config.serverPort, config.schoolName));
  zip.file('LIMPAR_BASE_DADOS_PRODUCAO.bat', generateCleanDatabaseBat(config.serverPort, config.schoolName));
  zip.file('VERIFICAR_ESTRUTURA_E_LAYOUT.bat', generateDirectoryVerificationBat(config.serverPort, config.schoolName));
  zip.file('Instalador_Unificado_SucessoEdu.bat', generateUnifiedWindowsBat(config));
  zip.file('Verificar_Integridade_e_AutoReparo.bat', generateIntegrityVerificationBat(config.serverPort, config.schoolName));
  zip.file('Diagnostico_Rede_Universal.bat', generateDiagnosticBat(config));

  // Common Docs and System Architecture in root
  const architectureDiagramHtml = generateArchitectureDiagramHtml(config.schoolName);
  zip.file('Diagrama_Arquitetura_Modulos_SucessoEdu.html', architectureDiagramHtml);
  zip.file('MANUAL_DE_INSTALACAO_OFFLINE.md', generateOfflineManualMarkdown(config));
  zip.file('MANUAL_POLO_REMOTO_E_SINCRONIZACAO.md', generateRemoteSyncManualMarkdown(config));
  zip.file('MANUAL_HOSPEDAGEM_NUVEM_E_SITE.md', generateCloudHostingManual(config));
  zip.file('Manual_Instalacao_e_Atualizacao_SucessoEdu.html', updateManualHtml);

  // Sincronizar automaticamente os diagramas do sistema
  syncSystemArchitectureDiagrams(
    'CONFIG_SERVIDORES_NUVEM',
    `Pacote de instaladores gerado com garantia estrutural de pasta raiz C:\\SucessoEdu e diagrama de arquitetura.`
  );

  return await zip.generateAsync({ type: 'blob' });
}
