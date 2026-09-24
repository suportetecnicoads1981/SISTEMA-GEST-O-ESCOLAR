# =============================================================================
#  SucessoEdu - Instalacao do servidor da rede local (Servidor Remoto ou Sede)
#  Executado pelo INSTALAR_SERVIDOR.bat (como Administrador).
# =============================================================================
$ErrorActionPreference = 'Stop'
$Source = Split-Path -Parent $MyInvocation.MyCommand.Path
$Dest = 'C:\SucessoEdu'
$TaskName = 'SucessoEdu Servidor'

function Step([string]$m) { Write-Host ''; Write-Host ('>> ' + $m) -ForegroundColor Cyan }
function Ok([string]$m) { Write-Host ('   [OK] ' + $m) -ForegroundColor Green }
function Warn([string]$m) { Write-Host ('   [AVISO] ' + $m) -ForegroundColor Yellow }

$cfg = Get-Content -Raw -Encoding UTF8 (Join-Path $Source 'config.json') | ConvertFrom-Json
$Port = 8088; if ($cfg.port) { $Port = [int]$cfg.port }
$Key = ''; if ($cfg.accessKey) { $Key = [string]$cfg.accessKey }
$KeyQuery = ''; if ($Key) { $KeyQuery = '/?chave=' + $Key }
$RoleLabel = 'Servidor Remoto (escola)'; if ($cfg.role -eq 'SEDE') { $RoleLabel = 'Servidor da Sede (Secretaria)' }

Write-Host '==============================================================='
Write-Host ('  SucessoEdu - Instalacao do ' + $RoleLabel)
Write-Host ('  ' + $cfg.serverName)
Write-Host '==============================================================='

Step 'Parando o servidor anterior (se existir)'
# Comandos do Windows (netsh/schtasks) escrevem avisos no erro padrao; nao sao falhas.
$ErrorActionPreference = 'Continue'
cmd /c "schtasks /End /TN ""$TaskName"" >nul 2>&1"
$ErrorActionPreference = 'Stop'
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*servidor_sucessoedu.ps1*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 1
Ok 'Pronto'

Step ('Copiando o sistema para ' + $Dest + ' (o banco de dados existente e preservado)')
if (-not (Test-Path $Dest)) { New-Item -ItemType Directory -Path $Dest -Force | Out-Null }
$srcFull = [System.IO.Path]::GetFullPath($Source).TrimEnd('\')
if ($srcFull -ne $Dest) {
    if (Test-Path (Join-Path $Dest 'app')) { Remove-Item -Recurse -Force (Join-Path $Dest 'app') }
    Get-ChildItem -Path $Source -Force | Where-Object { $_.Name -ne 'data' } | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $Dest -Recurse -Force
    }
}
New-Item -ItemType Directory -Path (Join-Path $Dest 'data') -Force | Out-Null
Ok 'Arquivos copiados'

# Servidor Remoto gerado com a escola escolhida: o banco nasce com a escola, turmas e alunos
# vindos da Sede. So vale para servidor novo (banco inexistente ou vazio); nunca apaga dados.
$SeedFile = Join-Path $Source 'data_inicial\banco_sucessoedu.json'
$DbFile = Join-Path $Dest 'data\banco_sucessoedu.json'
if (Test-Path $SeedFile) {
    Step 'Dados iniciais da escola (vindos da Sede)'
    $useSeed = -not (Test-Path $DbFile)
    if (-not $useSeed) {
        try {
            $cur = Get-Content -Raw -Encoding UTF8 $DbFile | ConvertFrom-Json
            $nUnits = @($cur.schoolUnits | Where-Object { $_ }).Count
            $nStudents = @($cur.students | Where-Object { $_ }).Count
            if ($nUnits -eq 0 -and $nStudents -eq 0) { $useSeed = $true }
        } catch { $useSeed = $false }
    }
    if ($useSeed) {
        $hist = Join-Path $Dest 'data\historico'
        New-Item -ItemType Directory -Path $hist -Force | Out-Null
        if (Test-Path $DbFile) { Copy-Item -Force $DbFile (Join-Path $hist ('banco_antes_dados_iniciais_' + (Get-Date -Format 'yyyyMMdd_HHmmss') + '.json')) }
        Copy-Item -Force $SeedFile $DbFile
        $meta = Join-Path $Dest 'data\banco_sucessoedu.versao'
        if (Test-Path $meta) { Remove-Item -Force $meta }
        Ok 'Escola, turmas e alunos da Sede carregados neste servidor'
    } else {
        Ok 'Este servidor ja tem dados: foram mantidos (a atualizacao vem da Sede pela internet)'
    }
}

Step ('Liberando a porta ' + $Port + ' no Firewall do Windows (rede local)')
$ErrorActionPreference = 'Continue'
cmd /c "netsh advfirewall firewall delete rule name=""SucessoEdu Servidor"" >nul 2>&1"
cmd /c "netsh advfirewall firewall add rule name=""SucessoEdu Servidor"" dir=in action=allow protocol=TCP localport=$Port profile=any remoteip=localsubnet >nul 2>&1"
$ErrorActionPreference = 'Stop'
Ok 'Regra de firewall criada'

Step 'Autorizando o servidor a atender a rede'
$ErrorActionPreference = 'Continue'
cmd /c "netsh http delete urlacl url=http://+:$Port/ >nul 2>&1"
cmd /c "netsh http add urlacl url=http://+:$Port/ sddl=D:(A;;GX;;;WD) >nul 2>&1"
$ErrorActionPreference = 'Stop'
Ok 'Autorizado'

Step 'Configurando para iniciar junto com o Windows (mesmo sem ninguem entrar no computador)'
$ps = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$action = New-ScheduledTaskAction -Execute $ps -Argument ('-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + (Join-Path $Dest 'servidor_sucessoedu.ps1') + '"') -WorkingDirectory $Dest
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero)
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
Ok 'Inicializacao automatica configurada'

Step 'Configurando a verificacao de atualizacoes (so baixa e confere; o administrador aprova no sistema)'
try {
    $upd = Join-Path $Dest 'atualizador_sucessoedu.ps1'
    $uAction = New-ScheduledTaskAction -Execute $ps -Argument ('-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $upd + '"') -WorkingDirectory $Dest
    $uT1 = New-ScheduledTaskTrigger -Once -At ((Get-Date).Date.AddHours(2)) -RepetitionInterval (New-TimeSpan -Hours 6) -RepetitionDuration (New-TimeSpan -Days 3650)
    $uT2 = New-ScheduledTaskTrigger -AtStartup
    $uSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 2)
    Register-ScheduledTask -TaskName 'SucessoEdu Atualizador' -Action $uAction -Trigger @($uT1, $uT2) -Settings $uSettings -Principal $principal -Force | Out-Null
    Ok 'Verificacao de atualizacoes a cada 6 horas (quando houver internet)'
} catch { Warn ('Verificacao automatica de atualizacoes nao configurada: ' + $_.Exception.Message) }

Step 'Evitando que o computador servidor entre em suspensao na tomada'
$ErrorActionPreference = 'Continue'
cmd /c "powercfg /change standby-timeout-ac 0 >nul 2>&1"
cmd /c "powercfg /change hibernate-timeout-ac 0 >nul 2>&1"
$ErrorActionPreference = 'Stop'
Ok 'Suspensao desativada (na tomada)'

Step 'Iniciando o servidor'
Start-ScheduledTask -TaskName $TaskName
$healthy = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 1
    try {
        $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 ('http://localhost:' + $Port + '/api/local/health')
        if ($r.StatusCode -eq 200) { $healthy = $true; break }
    } catch { }
}
if ($healthy) { Ok 'Servidor funcionando' } else { Warn ('O servidor nao respondeu. Veja o arquivo ' + (Join-Path $Dest 'data\servidor.log')) }

Step 'Criando o atalho na Area de Trabalho'
try {
    & (Join-Path $Dest 'criar_atalho.ps1') -Url ('http://localhost:' + $Port + $KeyQuery) -AllUsers
    Ok 'Atalho "SucessoEdu Gestao Educacional" criado'
} catch {
    # O atalho nao impede o funcionamento do servidor.
    Warn ('Nao foi possivel criar o atalho: ' + $_.Exception.Message)
    Warn ('Abra no navegador: http://localhost:' + $Port + $KeyQuery)
}

$ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' -and $_.InterfaceAlias -notmatch 'Loopback|vEthernet|VirtualBox|VMware|WSL|Bluetooth' } |
    Select-Object -ExpandProperty IPAddress
Write-Host ''
Write-Host '==============================================================='
Write-Host '  INSTALACAO CONCLUIDA' -ForegroundColor Green
Write-Host '==============================================================='
Write-Host ('  Neste computador: http://localhost:' + $Port)
foreach ($ip in $ips) { Write-Host ('  Nas estacoes da rede:  http://' + $ip + ':' + $Port) -ForegroundColor Yellow }
if ($Key) {
    Write-Host ''
    Write-Host ('  CHAVE DE ACESSO DA ESCOLA: ' + $Key) -ForegroundColor Cyan
    Write-Host '  (as estacoes pedem esta chave no primeiro acesso; ela tambem esta no LEIA-ME.txt)'
}
Write-Host ''
Write-Host '  IMPORTANTE: fixe o IP deste computador no roteador (reserva de DHCP)'
Write-Host '  para o endereco das estacoes nao mudar.'
Write-Host '  Banco de dados: C:\SucessoEdu\data  (copias automaticas em data\historico)'
Write-Host '==============================================================='
