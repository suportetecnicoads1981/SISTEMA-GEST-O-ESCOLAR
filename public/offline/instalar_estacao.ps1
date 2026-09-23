# =============================================================================
#  SucessoEdu - Configuracao de uma estacao de trabalho
#  Localiza o servidor da escola na rede e cria o atalho na Area de Trabalho.
#  A estacao NAO guarda o banco: todos os dados ficam no servidor.
# =============================================================================
$ErrorActionPreference = 'Stop'
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Port = 8088
$ServerIp = ''
$Key = ''
$cfgFile = Join-Path $Here 'estacao.json'
if (Test-Path $cfgFile) {
    try {
        $cfg = Get-Content -Raw -Encoding UTF8 $cfgFile | ConvertFrom-Json
        if ($cfg.port) { $Port = [int]$cfg.port }
        if ($cfg.serverIp) { $ServerIp = [string]$cfg.serverIp }
        if ($cfg.accessKey) { $Key = [string]$cfg.accessKey }
    } catch { }
}

function Test-Server([string]$ip) {
    try {
        $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 ('http://' + $ip + ':' + $Port + '/api/local/health')
        return ($r.StatusCode -eq 200 -and $r.Content -like '*sucessoedu-local*')
    } catch { return $false }
}

Write-Host '==============================================================='
Write-Host '  SucessoEdu - Configuracao da estacao de trabalho'
Write-Host '==============================================================='

if ($ServerIp -and -not (Test-Server $ServerIp)) {
    Write-Host ('O servidor ' + $ServerIp + ' nao respondeu. Vou procurar na rede...') -ForegroundColor Yellow
    $ServerIp = ''
}

if (-not $ServerIp) {
    Write-Host 'Procurando o servidor SucessoEdu na rede local (pode levar ate 1 minuto)...'
    $myIps = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' -and $_.PrefixLength -ge 16 } |
        Select-Object -ExpandProperty IPAddress
    foreach ($my in $myIps) {
        $prefix = ($my.Split('.')[0..2]) -join '.'
        $jobs = @()
        foreach ($n in 1..254) {
            $ip = $prefix + '.' + $n
            $client = New-Object System.Net.Sockets.TcpClient
            $jobs += [pscustomobject]@{ Ip = $ip; Client = $client; Task = $client.ConnectAsync($ip, $Port) }
        }
        Start-Sleep -Milliseconds 1500
        foreach ($j in $jobs) {
            $open = $j.Task.IsCompleted -and -not $j.Task.IsFaulted -and $j.Client.Connected
            $j.Client.Close()
            if ($open -and -not $ServerIp -and (Test-Server $j.Ip)) { $ServerIp = $j.Ip }
        }
        if ($ServerIp) { break }
    }
}

if (-not $ServerIp) {
    Write-Host 'Nao encontrei o servidor automaticamente.' -ForegroundColor Yellow
    $ServerIp = Read-Host 'Digite o IP do computador servidor (ex.: 192.168.0.10)'
    if (-not (Test-Server $ServerIp)) {
        Write-Host ('O servidor ' + $ServerIp + ' nao respondeu na porta ' + $Port + '. Verifique se ele esta ligado e na mesma rede.') -ForegroundColor Red
        Read-Host 'Pressione ENTER para sair'
        exit 1
    }
}

$url = 'http://' + $ServerIp + ':' + $Port
Write-Host ('Servidor encontrado: ' + $url) -ForegroundColor Green

function Test-Key([string]$k) {
    try {
        $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 4 -Headers @{ 'X-Chave' = $k } ($url + '/api/local/version')
        return ($r.StatusCode -eq 200)
    } catch { return $false }
}
while (-not (Test-Key $Key)) {
    if ($Key) { Write-Host 'Chave incorreta.' -ForegroundColor Yellow }
    $Key = (Read-Host 'Digite a CHAVE DE ACESSO da escola (aparece no fim da instalacao do servidor e no LEIA-ME)').Trim().ToUpper()
}
$shortcutUrl = $url
if ($Key) { $shortcutUrl = $url + '/?chave=' + $Key }
& (Join-Path $Here 'criar_atalho.ps1') -Url $shortcutUrl
Write-Host ''
Write-Host 'Pronto! Use o atalho "SucessoEdu Gestao Educacional" na Area de Trabalho.' -ForegroundColor Green
Write-Host 'Cada pessoa entra com o proprio usuario e senha.'
