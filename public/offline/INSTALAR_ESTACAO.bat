@echo off
rem SucessoEdu - configura esta estacao de trabalho (cria o atalho para o servidor)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0instalar_estacao.ps1"
echo.
pause
