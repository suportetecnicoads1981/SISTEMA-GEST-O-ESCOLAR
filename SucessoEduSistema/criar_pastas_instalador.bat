@echo off
:: ============================================================================
:: SucessoEduSistema - Criador da Pasta Padrao do Instalador no Diretorio Raiz
:: Diretorio Alvo: C:\SucessoEduSistema
:: ============================================================================
chcp 65001 >nul
title Criar Pasta Padrao SucessoEduSistema

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [SucessoEduSistema] Solicitando privilegios de Administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

set ROOT_DIR=C:\SucessoEduSistema

echo [*] Criando pasta padrao no diretorio raiz: %ROOT_DIR%
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

echo [*] Aplicando permissoes completas de leitura e gravacao (icacls)...
icacls "%ROOT_DIR%" /grant administrators:F /grant "%USERNAME%":F /grant users:(OI)(CI)M /T /C /Q >nul 2>&1

echo [*] Criando arquivo de manifesto de instalacao...
(
echo [SucessoEduSistema]
echo InstaladorRaiz=%ROOT_DIR%
echo CriadoEm=%DATE% %TIME%
echo Status=PRONTO_PARA_COMPILACAO
echo Versao=16.1.0-Enterprise
) > "%ROOT_DIR%\Config\manifesto_raiz.ini"

echo.
echo ============================================================================
echo   PASTA PADRAO %ROOT_DIR% CRIADA E PROVISIONADA COM SUCESSO!
echo ============================================================================
echo Os arquivos do instalador Inno Setup e do sistema agora podem ser gerados.
echo.
pause
exit /b 0
