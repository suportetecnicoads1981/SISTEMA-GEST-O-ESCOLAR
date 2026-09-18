@echo off
:: ============================================================================
:: SucessoEdu Gestão Educacional - Lançador Universal Inteligente
:: Diretorio Alvo: C:\SucessoEduSistema
:: ============================================================================
chcp 65001 >nul
title SucessoEdu Gestão Educacional
cd /d "%~dp0"

:: 1. Se existir executável binário compilado dedicado, executa diretamente
if exist "%~dp0SucessoEdu_App.exe" (
    start "" "%~dp0SucessoEdu_App.exe"
    exit /b 0
)

:: 2. Se existir lançador silencioso VBScript, executa sem piscar janela de prompt
if exist "%~dp0SucessoEdu_App.vbs" (
    start "" wscript.exe "%~dp0SucessoEdu_App.vbs"
    exit /b 0
)

:: 3. Se existir aplicativo offline HTML standalone (SPA), abre no navegador padrão
if exist "%~dp0SucessoEdu_Aplicativo_Offline.html" (
    start "" "%~dp0SucessoEdu_Aplicativo_Offline.html"
    exit /b 0
)
if exist "%~dp0index.html" (
    start "" "%~dp0index.html"
    exit /b 0
)

:: 4. Se o servidor local HTTP estiver ativo ou configurado, abre no navegador padrão
start "" "http://localhost:3000/"
exit /b 0
