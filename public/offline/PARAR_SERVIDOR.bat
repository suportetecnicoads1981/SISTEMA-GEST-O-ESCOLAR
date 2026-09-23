@echo off
rem SucessoEdu - para o servidor (precisa de Administrador)
fltmc >nul 2>&1
if %errorlevel% neq 0 (
  if "%~1"=="elevado" (
    echo Nao foi possivel obter permissao de Administrador. Clique com o botao direito e use "Executar como administrador".
    pause
    exit /b 1
  )
  echo Solicitando permissao de Administrador...
  set "SUCESSOEDU_SELF=%~f0"
  powershell -NoProfile -Command "Start-Process -FilePath $env:SUCESSOEDU_SELF -ArgumentList elevado -Verb RunAs"
  exit /b
)
cd /d "%~dp0"
schtasks /End /TN "SucessoEdu Servidor"
echo Servidor parado. Para iniciar novamente use INICIAR_SERVIDOR.bat ou reinicie o computador.
pause
