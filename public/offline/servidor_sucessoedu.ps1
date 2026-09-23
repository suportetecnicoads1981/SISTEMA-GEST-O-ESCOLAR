# =============================================================================
#  SucessoEdu - Servidor da rede local (Servidor Remoto da escola / Servidor da Sede)
#
#  - Entrega o sistema (pasta app) para as estacoes da rede: http://IP-DESTE-PC:8088
#  - Guarda o banco UNICO da escola em data\banco_sucessoedu.json
#  - Cada gravacao usa numero de versao: duas estacoes gravando ao mesmo tempo nao
#    apagam o trabalho uma da outra (o sistema reaplica as mudancas e grava de novo).
#  - Copias de seguranca automaticas em data\historico (ultimas 60).
#  - So atende computadores da rede local (IPs privados).
#
#  Funciona no Windows PowerShell 5.1 (ja vem no Windows 10/11). Nao precisa de internet.
# =============================================================================

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppDir = Join-Path $Root 'app'
$DataDir = Join-Path $Root 'data'
$HistDir = Join-Path $DataDir 'historico'
$DbFile = Join-Path $DataDir 'banco_sucessoedu.json'
$MetaFile = Join-Path $DataDir 'banco_sucessoedu.versao'
$LogFile = Join-Path $DataDir 'servidor.log'
$ConfigFile = Join-Path $Root 'config.json'
$Utf8 = New-Object System.Text.UTF8Encoding($false)

foreach ($d in @($DataDir, $HistDir)) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null } }

# ---------------------------------------------------------------- configuracao
$Role = 'REMOTO'
$ServerName = 'Servidor Remoto SucessoEdu'
$Port = 8088
$AccessKey = ''
if (Test-Path $ConfigFile) {
    try {
        $cfg = Get-Content -Raw -Encoding UTF8 $ConfigFile | ConvertFrom-Json
        if ($cfg.role -eq 'SEDE') { $Role = 'SEDE' }
        if ($cfg.serverName) { $ServerName = [string]$cfg.serverName }
        if ($cfg.port) { $Port = [int]$cfg.port }
        if ($cfg.accessKey) { $AccessKey = ([string]$cfg.accessKey).Trim().ToUpper() }
    } catch { }
}
if ($env:SUCESSOEDU_PORT) { $Port = [int]$env:SUCESSOEDU_PORT }

function Write-Log([string]$msg) {
    $line = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '  ' + $msg
    try {
        if ((Test-Path $LogFile) -and ((Get-Item $LogFile).Length -gt 5MB)) {
            Move-Item -Force $LogFile ($LogFile + '.anterior')
        }
        [System.IO.File]::AppendAllText($LogFile, $line + [Environment]::NewLine, $Utf8)
    } catch { }
    Write-Host $line
}

# ---------------------------------------------------------------- banco
$script:Version = 0
$script:UpdatedAt = ''
$script:DataText = $null

if (Test-Path $MetaFile) {
    try {
        $parts = ([System.IO.File]::ReadAllText($MetaFile, $Utf8)).Trim().Split('|')
        $script:Version = [int64]$parts[0]
        if ($parts.Length -gt 1) { $script:UpdatedAt = $parts[1] }
    } catch { $script:Version = 0 }
}
# Recupera gravacao interrompida (queda de energia no meio da gravacao).
if (-not (Test-Path $DbFile) -and (Test-Path ($DbFile + '.tmp'))) { Move-Item -Force ($DbFile + '.tmp') $DbFile }
if (Test-Path $DbFile) {
    $script:DataText = [System.IO.File]::ReadAllText($DbFile, $Utf8)
    if ([string]::IsNullOrWhiteSpace($script:DataText)) { $script:DataText = $null }
}
# A cada inicio a versao avanca: se o computador desligou no meio de uma gravacao,
# as estacoes releem o banco em vez de confiar numa versao antiga.
if ($script:DataText) {
    $script:Version = $script:Version + 1
    $script:UpdatedAt = (Get-Date).ToUniversalTime().ToString('o')
    [System.IO.File]::WriteAllText($MetaFile, ([string]$script:Version) + '|' + $script:UpdatedAt, $Utf8)
}

function Save-Database([string]$text) {
    # Copia de seguranca da versao anterior (no maximo uma a cada 30 minutos).
    if (Test-Path $DbFile) {
        $last = Get-ChildItem -Path $HistDir -Filter 'banco_*.json' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if (-not $last -or ((Get-Date) - $last.LastWriteTime).TotalMinutes -ge 30) {
            Copy-Item -Force $DbFile (Join-Path $HistDir ('banco_' + (Get-Date -Format 'yyyyMMdd_HHmmss') + '.json'))
            Get-ChildItem -Path $HistDir -Filter 'banco_*.json' | Sort-Object LastWriteTime -Descending | Select-Object -Skip 60 | Remove-Item -Force -ErrorAction SilentlyContinue
        }
    }
    # Gravacao segura: escreve em arquivo temporario e so depois substitui o banco.
    $tmp = $DbFile + '.tmp'
    [System.IO.File]::WriteAllText($tmp, $text, $Utf8)
    if (Test-Path $DbFile) { [System.IO.File]::Replace($tmp, $DbFile, [NullString]::Value) } else { Move-Item -Force $tmp $DbFile }
    $script:Version = $script:Version + 1
    $script:UpdatedAt = (Get-Date).ToUniversalTime().ToString('o')
    [System.IO.File]::WriteAllText($MetaFile, ([string]$script:Version) + '|' + $script:UpdatedAt, $Utf8)
    $script:DataText = $text
}

# ---------------------------------------------------------------- http
function Test-LocalNetwork($address) {
    if ($null -eq $address) { return $false }
    if ([System.Net.IPAddress]::IsLoopback($address)) { return $true }
    if ($address.IsIPv4MappedToIPv6) { $address = $address.MapToIPv4() }
    $b = $address.GetAddressBytes()
    if ($b.Length -eq 4) {
        if ($b[0] -eq 10) { return $true }
        if ($b[0] -eq 172 -and $b[1] -ge 16 -and $b[1] -le 31) { return $true }
        if ($b[0] -eq 192 -and $b[1] -eq 168) { return $true }
        if ($b[0] -eq 169 -and $b[1] -eq 254) { return $true }
        if ($b[0] -eq 100 -and $b[1] -ge 64 -and $b[1] -le 127) { return $true }
        return $false
    }
    if ($address.IsIPv6LinkLocal -or $address.IsIPv6SiteLocal) { return $true }
    if (($b[0] -band 0xFE) -eq 0xFC) { return $true }
    return $false
}

function Send-Text($ctx, [int]$status, [string]$text, [string]$type) {
    $res = $ctx.Response
    try {
        $bytes = $Utf8.GetBytes($text)
        $res.StatusCode = $status
        $res.ContentType = $type
        $res.Headers['Cache-Control'] = 'no-store'
        $res.Headers['X-Content-Type-Options'] = 'nosniff'
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch { } finally { try { $res.OutputStream.Close() } catch { } }
}

function Send-Json($ctx, [int]$status, [string]$json) { Send-Text $ctx $status $json 'application/json; charset=utf-8' }

function ConvertTo-JsonString([string]$s) {
    return '"' + ($s -replace '\\', '\\' -replace '"', '\"') + '"'
}

$MimeTypes = @{
    '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.mjs' = 'text/javascript; charset=utf-8'
    '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json; charset=utf-8'; '.svg' = 'image/svg+xml'
    '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.gif' = 'image/gif'; '.webp' = 'image/webp'
    '.ico' = 'image/x-icon'; '.woff' = 'font/woff'; '.woff2' = 'font/woff2'; '.ttf' = 'font/ttf'; '.txt' = 'text/plain; charset=utf-8'
    '.map' = 'application/json'; '.webmanifest' = 'application/manifest+json'; '.wasm' = 'application/wasm'
}

function Send-StaticFile($ctx, [string]$urlPath) {
    $rel = [System.Uri]::UnescapeDataString($urlPath.TrimStart('/')).Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    if ($rel -eq '') { $rel = 'index.html' }
    $appFull = [System.IO.Path]::GetFullPath($AppDir)
    $full = [System.IO.Path]::GetFullPath((Join-Path $AppDir $rel))
    if (-not $full.StartsWith($appFull, [System.StringComparison]::OrdinalIgnoreCase)) { Send-Text $ctx 403 'Acesso negado' 'text/plain; charset=utf-8'; return }
    if (-not (Test-Path -LiteralPath $full -PathType Leaf)) {
        if ([System.IO.Path]::GetExtension($rel) -ne '') { Send-Text $ctx 404 'Arquivo nao encontrado' 'text/plain; charset=utf-8'; return }
        $full = Join-Path $AppDir 'index.html'   # rotas internas do sistema
    }
    if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { Send-Text $ctx 500 'Sistema nao instalado: pasta app vazia.' 'text/plain; charset=utf-8'; return }
    $ext = [System.IO.Path]::GetExtension($full).ToLower()
    $type = $MimeTypes[$ext]; if (-not $type) { $type = 'application/octet-stream' }
    $res = $ctx.Response
    try {
        $bytes = [System.IO.File]::ReadAllBytes($full)
        $res.StatusCode = 200
        $res.ContentType = $type
        if ($full -like '*\assets\*' -or $full -like '*/assets/*') { $res.Headers['Cache-Control'] = 'public, max-age=31536000, immutable' }
        else { $res.Headers['Cache-Control'] = 'no-cache' }
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch { } finally { try { $res.OutputStream.Close() } catch { } }
}

function Read-Body($ctx) {
    $reader = New-Object System.IO.StreamReader($ctx.Request.InputStream, $Utf8)
    try { return $reader.ReadToEnd() } finally { $reader.Close() }
}

function Get-StoreJson {
    $data = 'null'
    if ($script:DataText) { $data = $script:DataText }
    return '{"version":' + $script:Version + ',"updatedAt":' + (ConvertTo-JsonString $script:UpdatedAt) + ',"data":' + $data + '}'
}

function Handle-Api($ctx, [string]$path, [string]$method) {
    # Somente estacoes com a chave da escola leem ou gravam o banco.
    if ($path -ne '/api/local/health' -and $AccessKey -ne '') {
        $given = [string]$ctx.Request.Headers['X-Chave']
        if ($given.Trim().ToUpper() -ne $AccessKey) {
            Send-Json $ctx 401 '{"error":"chave-de-acesso-invalida"}'
            return
        }
    }
    switch ($path) {
        '/api/local/health' {
            Send-Json $ctx 200 ('{"app":"sucessoedu-local","role":"' + $Role + '","serverName":' + (ConvertTo-JsonString $ServerName) + ',"version":' + $script:Version + ',"port":' + $Port + ',"needsKey":' + ($(if ($AccessKey -ne '') { 'true' } else { 'false' })) + '}')
            return
        }
        '/api/local/version' {
            Send-Json $ctx 200 ('{"version":' + $script:Version + ',"updatedAt":' + (ConvertTo-JsonString $script:UpdatedAt) + '}')
            return
        }
        '/api/local/store' {
            if ($method -eq 'GET') { Send-Json $ctx 200 (Get-StoreJson); return }
            if ($method -eq 'PUT' -or $method -eq 'POST') {
                $base = $ctx.Request.Headers['X-Base-Version']
                $station = $ctx.Request.Headers['X-Station']
                if ($null -eq $base -or [int64]$base -ne $script:Version) {
                    Send-Json $ctx 409 ('{"error":"versao-desatualizada","version":' + $script:Version + '}')
                    return
                }
                $body = Read-Body $ctx
                $trim = $body.TrimStart()
                if ($trim.Length -lt 2 -or $trim[0] -ne '{') { Send-Json $ctx 400 '{"error":"conteudo-invalido"}'; return }
                Save-Database $body
                Write-Log ('Banco gravado pela estacao ' + $station + ' (' + $ctx.Request.RemoteEndPoint.Address + ') - versao ' + $script:Version + ', ' + [math]::Round($body.Length / 1KB) + ' KB')
                Send-Json $ctx 200 ('{"version":' + $script:Version + ',"updatedAt":' + (ConvertTo-JsonString $script:UpdatedAt) + '}')
                return
            }
            Send-Json $ctx 405 '{"error":"metodo-nao-permitido"}'
            return
        }
        default {
            Send-Json $ctx 404 '{"error":"recurso-indisponivel-no-servidor-local"}'
            return
        }
    }
}

# ---------------------------------------------------------------- inicio
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://+:' + $Port + '/')
try {
    $listener.Start()
} catch {
    Write-Log ('Sem permissao para atender a rede na porta ' + $Port + ' (execute o instalador como Administrador). Atendendo somente este computador.')
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add('http://localhost:' + $Port + '/')
    $listener.Start()
}

$ips = @()
try {
    $ips = [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) | Where-Object { $_.AddressFamily -eq 'InterNetwork' -and -not [System.Net.IPAddress]::IsLoopback($_) } | ForEach-Object { $_.ToString() }
} catch { }
Write-Log ('SucessoEdu ' + $ServerName + ' (' + $Role + ') iniciado na porta ' + $Port + '. Banco versao ' + $script:Version + '.')
foreach ($ip in $ips) { Write-Log ('  Estacoes acessam: http://' + $ip + ':' + $Port) }

while ($listener.IsListening) {
    $ctx = $null
    try {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        if (-not (Test-LocalNetwork $req.RemoteEndPoint.Address)) {
            Send-Text $ctx 403 'Acesso permitido somente na rede local da escola.' 'text/plain; charset=utf-8'
            continue
        }
        $path = $req.Url.AbsolutePath
        if ($path.StartsWith('/api/')) { Handle-Api $ctx $path $req.HttpMethod.ToUpper() }
        elseif ($req.HttpMethod -eq 'GET' -or $req.HttpMethod -eq 'HEAD') { Send-StaticFile $ctx $path }
        else { Send-Text $ctx 405 'Metodo nao permitido' 'text/plain; charset=utf-8' }
    } catch {
        Write-Log ('Erro ao atender requisicao: ' + $_.Exception.Message)
        if ($ctx) { try { Send-Json $ctx 500 '{"error":"erro-interno"}' } catch { } }
    }
}
