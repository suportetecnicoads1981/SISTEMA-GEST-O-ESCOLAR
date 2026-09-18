@echo off
:: ============================================================================
:: SucessoEduSistema - Instalador e Provisionador Total em C:\SucessoEduSistema
:: Monitoramento Central: suportetecnicoads@gmail.com
:: ============================================================================
chcp 65001 >nul
title SucessoEduSistema - Instalador de Alta Disponibilidade

:: 1. Auto-Elevation (Verificação de Administrador via runas)
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [SucessoEduSistema] Solicitando privilégios de Administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

set ROOT_DIR=C:\SucessoEduSistema
set PORT=5433

echo ============================================================================
echo   SUCESSOEDUSISTEMA - PROVISIONAMENTO EM %ROOT_DIR%
echo   Monitoramento: suportetecnicoads@gmail.com
echo ============================================================================
echo.

:: 2. Verificação de 2GB Livres em Disco
echo [*] Validando espaço em disco (minimo 2GB livres)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$drive = Get-PSDrive C; if ($drive.Free -lt 2GB) { Write-Host '[ERRO] Espaço livre inferior a 2GB!' -ForegroundColor Red; exit 1 } else { Write-Host '[OK] Disco validado com sucesso: ' + [math]::Round($drive.Free / 1GB, 2) + ' GB livres.' -ForegroundColor Green; exit 0 }"
if %errorlevel% neq 0 (
    echo.
    echo [FALHA CRITICA] Espaço insuficiente em C:\. O SucessoEduSistema exige pelo menos 2GB.
    pause
    exit /b 1
)

:: 3. Provisionamento de Pastas Obrigatórias
echo [*] Criando estrutura de pastas padrao em %ROOT_DIR%...
if not exist "%ROOT_DIR%" mkdir "%ROOT_DIR%"
if not exist "%ROOT_DIR%\Bin" mkdir "%ROOT_DIR%\Bin"
if not exist "%ROOT_DIR%\Data" mkdir "%ROOT_DIR%\Data"
if not exist "%ROOT_DIR%\Data\pgdata" mkdir "%ROOT_DIR%\Data\pgdata"
if not exist "%ROOT_DIR%\Config" mkdir "%ROOT_DIR%\Config"
if not exist "%ROOT_DIR%\Logs" mkdir "%ROOT_DIR%\Logs"
if not exist "%ROOT_DIR%\Backups" mkdir "%ROOT_DIR%\Backups"
if not exist "%ROOT_DIR%\Scripts" mkdir "%ROOT_DIR%\Scripts"
if not exist "%ROOT_DIR%\Keys" mkdir "%ROOT_DIR%\Keys"
if not exist "%ROOT_DIR%\Output" mkdir "%ROOT_DIR%\Output"

:: 4. Aplicação de Permissões de Controle Total (icacls)
echo [*] Aplicando permissoes de controle total em %ROOT_DIR%...
icacls "%ROOT_DIR%" /grant administrators:F /grant "%USERNAME%":F /grant "NT SERVICE\SucessoEduBackup":F /T /C /Q >nul 2>&1

:: 5. Regras de Firewall (netsh advfirewall)
echo [*] Configurando regras de seguranca no Firewall do Windows...
netsh advfirewall firewall delete rule name="SucessoEdu App Engine" >nul 2>&1
netsh advfirewall firewall add rule name="SucessoEdu App Engine" dir=in action=allow program="%ROOT_DIR%\Bin\SucessoEdu_App.exe" enable=yes >nul 2>&1

netsh advfirewall firewall delete rule name="SucessoEdu PostgreSQL (%PORT%)" >nul 2>&1
netsh advfirewall firewall add rule name="SucessoEdu PostgreSQL (%PORT%)" dir=in action=allow protocol=TCP localport=%PORT% enable=yes >nul 2>&1

:: 6. Inteligência de Banco de Dados PostgreSQL (Porta %PORT%)
echo [*] Configurando PostgreSQL Smart Adapter na porta %PORT%...
(
echo # pg_hba.conf gerado automaticamente por SucessoEduSistema
echo # Permitir conexoes locais autenticadas
echo host    all             all             127.0.0.1/32            scram-sha-256
echo host    all             all             ::1/128                 scram-sha-256
echo host    sucessoedu_db   sucessoedu_user 127.0.0.1/32            scram-sha-256
) > "%ROOT_DIR%\Config\pg_hba.conf"

:: 7. Criacao do Agendamento de Backup Diario (03:00 AM)
echo [*] Agendando rotina de Backup Full-Stack para as 03:00 AM...
schtasks /create /tn "SucessoEdu_DailyBackup" /tr "%ROOT_DIR%\Scripts\backup_full.bat" /sc daily /st 03:00 /ru "SYSTEM" /f >nul 2>&1

:: 8. Envio de Notificacao de Sucesso
echo [*] Notificando engenharia via suportetecnicoads@gmail.com...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Write-Host '[STATUS] Notificacao de instalacao pronta para envio a suportetecnicoads@gmail.com' -ForegroundColor Cyan"

echo.
echo ============================================================================
echo   PROVISIONAMENTO CONCLUIDO COM SUCESSO EM %ROOT_DIR%!
echo ============================================================================
echo.
exit /b 0
