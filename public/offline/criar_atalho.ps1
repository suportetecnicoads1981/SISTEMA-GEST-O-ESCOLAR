# SucessoEdu - cria o atalho "SucessoEdu Gestao Educacional" na Area de Trabalho.
# Abre o sistema em janela propria (modo aplicativo) no Edge ou no Chrome.
param(
    [Parameter(Mandatory = $true)][string]$Url,
    [switch]$AllUsers
)
$ErrorActionPreference = 'Stop'
$name = 'SucessoEdu Gest' + [char]0x00E3 + 'o Educacional'

# Algumas pastas do Windows podem nao existir (ex.: Windows 32 bits nao tem "Program Files (x86)").
# So entram na busca as pastas que existem neste computador.
$bases = @(${env:ProgramFiles(x86)}, $env:ProgramFiles, $env:ProgramW6432, $env:LOCALAPPDATA) | Where-Object { $_ -and (Test-Path $_) }
$relatives = @('Microsoft\Edge\Application\msedge.exe', 'Google\Chrome\Application\chrome.exe')
$browser = $null
foreach ($rel in $relatives) {
    foreach ($base in $bases) {
        $candidate = Join-Path $base $rel
        if (Test-Path $candidate) { $browser = $candidate; break }
    }
    if ($browser) { break }
}

if ($AllUsers) { $desktop = [Environment]::GetFolderPath('CommonDesktopDirectory') } else { $desktop = [Environment]::GetFolderPath('Desktop') }
if (-not $desktop) { $desktop = [Environment]::GetFolderPath('Desktop') }
if (-not $desktop -and $env:PUBLIC) { $desktop = Join-Path $env:PUBLIC 'Desktop' }
if (-not $desktop) { throw 'Pasta da Area de Trabalho nao encontrada.' }
$lnkPath = Join-Path $desktop ($name + '.lnk')

# Icone do sistema: no servidor fica em C:\SucessoEdu\app; na estacao vem junto do pacote.
# Copiado para uma pasta fixa, para o atalho nao perder o icone se o pacote for apagado.
$icon = $null
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
foreach ($c in @((Join-Path $here 'app\sucessoedu.ico'), (Join-Path $here 'sucessoedu.ico'))) {
    if (Test-Path $c) {
        try {
            if ($AllUsers -and $env:ProgramData) { $iconDir = Join-Path $env:ProgramData 'SucessoEdu' } else { $iconDir = Join-Path $env:LOCALAPPDATA 'SucessoEdu' }
            if (-not (Test-Path $iconDir)) { New-Item -ItemType Directory -Path $iconDir -Force | Out-Null }
            $icon = Join-Path $iconDir 'sucessoedu.ico'
            Copy-Item -Path $c -Destination $icon -Force
        } catch { $icon = $c }
        break
    }
}

$shell = New-Object -ComObject WScript.Shell
$lnk = $shell.CreateShortcut($lnkPath)
if ($browser) {
    $lnk.TargetPath = $browser
    $lnk.Arguments = '--app=' + $Url
    $lnk.IconLocation = $browser + ',0'
} else {
    $lnk.TargetPath = Join-Path $env:windir 'explorer.exe'
    $lnk.Arguments = $Url
}
if ($icon) { $lnk.IconLocation = $icon + ',0' }
$lnk.Description = 'SucessoEdu - Sistema de Gestao Escolar'
$lnk.Save()
Write-Host ('Atalho criado: ' + $lnkPath)
