# SucessoEdu - cria o atalho "SucessoEdu Gestao Educacional" na Area de Trabalho.
# Abre o sistema em janela propria (modo aplicativo) no Edge ou no Chrome.
param(
    [Parameter(Mandatory = $true)][string]$Url,
    [switch]$AllUsers
)
$ErrorActionPreference = 'Stop'
$name = 'SucessoEdu Gest' + [char]0x00E3 + 'o Educacional'

$candidates = @(
    (Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'),
    (Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe'),
    (Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'),
    (Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'),
    (Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe')
)
$browser = $candidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

if ($AllUsers) { $desktop = [Environment]::GetFolderPath('CommonDesktopDirectory') } else { $desktop = [Environment]::GetFolderPath('Desktop') }
$lnkPath = Join-Path $desktop ($name + '.lnk')

$shell = New-Object -ComObject WScript.Shell
$lnk = $shell.CreateShortcut($lnkPath)
if ($browser) {
    $lnk.TargetPath = $browser
    $lnk.Arguments = '--app=' + $Url
    $lnk.IconLocation = $browser + ',0'
} else {
    $lnk.TargetPath = Join-Path $env:SystemRoot 'explorer.exe'
    $lnk.Arguments = $Url
}
$lnk.Description = 'SucessoEdu - Sistema de Gestao Escolar'
$lnk.Save()
Write-Host ('Atalho criado: ' + $lnkPath)
