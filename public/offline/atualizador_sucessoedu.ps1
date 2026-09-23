# =============================================================================
#  SucessoEdu - Atualizador seguro do servidor da rede local
#
#  So BAIXA e CONFERE a versao nova; nunca aplica sozinho.
#   1. Le o endereco oficial do sistema publicado (config.json ou data\atualizacao_config.json).
#   2. Baixa a lista de arquivos da versao (offline-manifest.json, com SHA-256 de cada arquivo).
#   3. Baixa os arquivos para uma pasta separada (update\baixando) e confere o SHA-256 de cada um.
#   4. Tudo conferido: a versao fica em update\pronta, aguardando o administrador aprovar no sistema.
#  O banco de dados (pasta data) nunca e alterado. Sem internet, apenas registra e sai.
# =============================================================================
param([switch]$Force)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$DataDir = Join-Path $Root 'data'
$AppDir = Join-Path $Root 'app'
$UpdDir = Join-Path $Root 'update'
$Tmp = Join-Path $UpdDir 'baixando'
$Ready = Join-Path $UpdDir 'pronta'
$StatusFile = Join-Path $DataDir 'atualizacao.json'
$LockFile = Join-Path $DataDir 'atualizacao.lock'
$Utf8 = New-Object System.Text.UTF8Encoding($false)
$MaxBytes = 200MB

foreach ($d in @($DataDir, $UpdDir)) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null } }

# Conexao segura (Windows mais antigos usam TLS 1.0 por padrao).
try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch { }

function Read-Json([string]$path) {
    if (-not (Test-Path $path)) { return $null }
    try { return ([System.IO.File]::ReadAllText($path, $Utf8) | ConvertFrom-Json) } catch { return $null }
}

function Save-Status([hashtable]$s) {
    $s['checkedAt'] = (Get-Date).ToUniversalTime().ToString('o')
    $json = $s | ConvertTo-Json -Depth 5
    $tmpFile = $StatusFile + '.tmp'
    [System.IO.File]::WriteAllText($tmpFile, $json, $Utf8)
    Move-Item -Force $tmpFile $StatusFile
}

function Get-UpdateUrl {
    $u = ''
    $cfg = Read-Json (Join-Path $Root 'config.json')
    if ($cfg -and $cfg.updateUrl) { $u = [string]$cfg.updateUrl }
    $over = Read-Json (Join-Path $DataDir 'atualizacao_config.json')
    if ($over -and $over.updateUrl) { $u = [string]$over.updateUrl }
    return $u.Trim().TrimEnd('/')
}

function Test-SafeRelPath([string]$rel) {
    if ([string]::IsNullOrWhiteSpace($rel)) { return $false }
    if ($rel.Contains('..') -or $rel.Contains(':') -or $rel.StartsWith('/') -or $rel.Contains('\')) { return $false }
    return ($rel -match '^[A-Za-z0-9._/\-]+$')
}

# Data da versao lida como texto (o PowerShell 7 converteria a data ISO para outro formato).
function Get-BuiltAtText([string]$text) {
    $m = [regex]::Match([string]$text, '"builtAt"\s*:\s*"([^"]+)"')
    if ($m.Success) { return $m.Groups[1].Value }
    return ''
}
function Get-BuiltAtFile([string]$path) {
    if (-not (Test-Path $path)) { return '' }
    return Get-BuiltAtText ([System.IO.File]::ReadAllText($path, $Utf8))
}

function Get-Sha([string]$path) { return (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLower() }

# Uma execucao por vez (trava antiga, de mais de 30 minutos, e descartada).
if (Test-Path $LockFile) {
    if (((Get-Date) - (Get-Item $LockFile).LastWriteTime).TotalMinutes -lt 30) { exit 0 }
}
[System.IO.File]::WriteAllText($LockFile, [string]$PID, $Utf8)

$currentBuiltAt = Get-BuiltAtFile (Join-Path $AppDir 'versao_app.json')
$url = Get-UpdateUrl

function Invoke-Update {
    if (-not $url) {
        Save-Status @{ state = 'sem-endereco'; current = $currentBuiltAt; message = 'Informe o endereco do sistema publicado para buscar atualizacoes.' }
        return
    }
    if (-not $url.StartsWith('https://') -and $env:SUCESSOEDU_ALLOW_HTTP_UPDATE -ne '1') {
        Save-Status @{ state = 'erro'; current = $currentBuiltAt; source = $url; message = 'Por seguranca, o endereco de atualizacao precisa comecar com https://' }
        return
    }

    try {
        $resp = Invoke-WebRequest -UseBasicParsing -TimeoutSec 60 -Uri ($url + '/offline-manifest.json?t=' + [DateTime]::UtcNow.Ticks)
    } catch {
        Save-Status @{ state = 'sem-internet'; current = $currentBuiltAt; source = $url; message = 'Nao foi possivel acessar o sistema publicado (sem internet ou endereco incorreto).' }
        return
    }
    $manifest = $resp.Content | ConvertFrom-Json
    $newBuiltAt = Get-BuiltAtText $resp.Content
    if (-not $newBuiltAt -or -not $manifest.hashes -or -not $manifest.files) {
        Save-Status @{ state = 'erro'; current = $currentBuiltAt; source = $url; message = 'A versao publicada nao informa a conferencia SHA-256 dos arquivos. Atualizacao recusada.' }
        return
    }

    if ($newBuiltAt -eq $currentBuiltAt) {
        Save-Status @{ state = 'atualizado'; current = $currentBuiltAt; source = $url; message = 'O sistema ja esta na versao mais recente.' }
        return
    }
    if ((Get-BuiltAtFile (Join-Path $Ready 'versao_app.json')) -eq $newBuiltAt -and -not $Force) {
        Save-Status @{ state = 'pronta'; current = $currentBuiltAt; available = $newBuiltAt; source = $url; message = 'Nova versao baixada e conferida. Aguardando aprovacao do administrador.' }
        return
    }

    Save-Status @{ state = 'baixando'; current = $currentBuiltAt; available = $newBuiltAt; source = $url; message = 'Baixando a nova versao...' }
    if (Test-Path $Tmp) { Remove-Item -Recurse -Force $Tmp }
    New-Item -ItemType Directory -Path $Tmp -Force | Out-Null

    $total = 0
    foreach ($rel in $manifest.files) {
        $rel = [string]$rel
        if (-not (Test-SafeRelPath $rel)) { throw ('Nome de arquivo invalido na lista da versao: ' + $rel) }
        $expected = [string]($manifest.hashes.$rel)
        if (-not $expected -or $expected.Length -ne 64) { throw ('Arquivo sem codigo SHA-256 na lista: ' + $rel) }
        $dest = Join-Path $Tmp ($rel.Replace('/', [System.IO.Path]::DirectorySeparatorChar))
        $destDir = Split-Path -Parent $dest
        if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
        $ok = $false
        for ($try = 1; $try -le 3 -and -not $ok; $try++) {
            try {
                Invoke-WebRequest -UseBasicParsing -TimeoutSec 300 -Uri ($url + '/' + $rel) -OutFile $dest
                $ok = ((Get-Sha $dest) -eq $expected.ToLower())
            } catch { $ok = $false }
            if (-not $ok) { Start-Sleep -Seconds (5 * $try) }
        }
        if (-not $ok) { throw ('O arquivo ' + $rel + ' nao passou na conferencia SHA-256 (download incompleto ou alterado).') }
        $total += (Get-Item $dest).Length
        if ($total -gt $MaxBytes) { throw 'A versao publicada e maior que o limite de seguranca (200 MB).' }
    }
    if (-not (Test-Path (Join-Path $Tmp 'index.html'))) { throw 'A versao baixada nao contem index.html.' }

    # Guarda a lista conferida junto da versao (o servidor confere de novo antes de aplicar).
    $info = @{ builtAt = $newBuiltAt; hashes = $manifest.hashes; files = $manifest.files; scriptHashes = $manifest.scriptHashes; source = $url; downloadedAt = (Get-Date).ToUniversalTime().ToString('o') }
    [System.IO.File]::WriteAllText((Join-Path $Tmp 'versao_app.json'), ($info | ConvertTo-Json -Depth 5), $Utf8)

    if (Test-Path $Ready) { Remove-Item -Recurse -Force $Ready }
    Move-Item -Force $Tmp $Ready

    # Scripts do servidor mudaram? (esses exigem reinstalar o pacote)
    $scriptsChanged = @()
    if ($manifest.scriptHashes) {
        foreach ($p in $manifest.scriptHashes.PSObject.Properties) {
            $local = Join-Path $Root $p.Name
            if ((Test-Path $local) -and $p.Name -like '*.ps1') {
                $bytes = [System.IO.File]::ReadAllText($local, $Utf8).Replace("`r`n", "`n")
                $sha = [System.BitConverter]::ToString((New-Object System.Security.Cryptography.SHA256Managed).ComputeHash($Utf8.GetBytes($bytes))).Replace('-', '').ToLower()
                if ($sha -ne [string]$p.Value) { $scriptsChanged += $p.Name }
            }
        }
    }
    $msg = 'Nova versao baixada e conferida (SHA-256). Aguardando aprovacao do administrador.'
    if ($scriptsChanged.Count -gt 0) { $msg += ' Esta versao tambem muda os programas do servidor: depois de aplicar, reinstale o pacote do servidor quando possivel.' }
    Save-Status @{ state = 'pronta'; current = $currentBuiltAt; available = $newBuiltAt; source = $url; bytes = $total; files = @($manifest.files).Count; scriptsChanged = $scriptsChanged; message = $msg }
}

try {
    Invoke-Update
} catch {
    if (Test-Path $Tmp) { Remove-Item -Recurse -Force $Tmp -ErrorAction SilentlyContinue }
    Save-Status @{ state = 'erro'; current = $currentBuiltAt; source = $url; message = ('Atualizacao nao baixada: ' + $_.Exception.Message) }
} finally {
    Remove-Item -Force $LockFile -ErrorAction SilentlyContinue
}
