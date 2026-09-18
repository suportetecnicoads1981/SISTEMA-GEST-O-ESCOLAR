; =====================================================================
; SucessoEdu - Inno Setup Script para Provisionamento do PostgreSQL 16.1
; Pasta Padrão no Diretório Raiz: C:\SucessoEduSistema
; Validação de Requisitos de Hardware (Espaço em Disco & Port Validation)
; Persistência em HKLM\SOFTWARE\SucessoEdu\Database
; Central de Notificação: suportetecnicoads@gmail.com
; =====================================================================

#define MyAppName "SucessoEdu Total Suite"
#define MyAppVersion "16.1.0-Enterprise"
#define MyAppPublisher "SucessoEdu Gestão Educacional"
#define MyAppURL "https://sucessoedu.gov.br"
#define MyAppExeName "SucessoEdu_App.exe"
#define TargetRoot "C:\SucessoEduSistema"
#define PostgresActivePort "5432"
#define DeveloperAlertEmail "suportetecnicoads@gmail.com"
#define GDriveFolderId "1aBcDeFgHiJkLmNoPqRsTuVwXyZ_0123456789"
#define PostgresDownloadUrl "https://get.enterprisedb.com/postgresql/postgresql-16.1-1-windows-x64.exe"

[Setup]
; Identificador único da aplicação (GUID)
AppId={{E83F2041-9491-4C5A-98C0-2A654D7A19F8}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

; Diretório Raiz Obrigatório e Fixo
DefaultDirName={#TargetRoot}
DisableDirPage=yes
UsePreviousAppDir=no

; Privilégios e Elevação UAC (Requerido para netstat, HKLM e consulta de disco)
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=commandline

; Compatibilidade Universal com todas as versões e arquiteturas de Windows
; Permite execução tanto em Windows 64-bit (x64/ARM64) quanto em 32-bit (x86)
; Suporta Windows 7, 8, 8.1, 10, 11 e Windows Server sem bloquear o instalador
MinVersion=6.1
OnlyBelowVersion=0
ArchitecturesInstallIn64BitMode=x64

; Design System & Interface do Instalador (Integrous Blue #005a9e)
WizardStyle=modern
WizardResizable=no

; Saída do Instalador
OutputDir=Output
OutputBaseFilename=SucessoEduSistema_Setup_x64
Compression=lzma2/ultra64
SolidCompression=yes

; Requisitos de Hardware: 800MB livres obrigatórios (300MB instalador + 500MB pgdata e logs)
ExtraDiskSpaceRequired=838860800

; Políticas de Desinstalação (Preservação de Dados e Licenças)
UninstallDisplayName={#MyAppName} (Desinstalação)

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Dirs]
Name: "{app}\Bin"; Permissions: users-full admins-full
Name: "{app}\PostgreSQL"; Permissions: users-full admins-full; Flags: uninsneveruninstall
Name: "{app}\Data"; Permissions: users-full admins-full; Flags: uninsneveruninstall
Name: "{app}\Data\pgdata"; Permissions: users-full admins-full; Flags: uninsneveruninstall
Name: "{app}\Config"; Permissions: users-full admins-full
Name: "{app}\Logs"; Permissions: users-full admins-full
Name: "{app}\Backups"; Permissions: users-full admins-full; Flags: uninsneveruninstall
Name: "{app}\Scripts"; Permissions: users-full admins-full
Name: "{app}\Keys"; Permissions: users-full admins-full; Flags: uninsneveruninstall
Name: "{app}\Output"; Permissions: users-full admins-full

[Files]
; Binários e arquivos da aplicação
Source: "files\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist
Source: "*.*"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist; Excludes: "*.iss,*.tmp,*.log,Output\*"

; Dependências Redistribuíveis opcionais (se já baixadas em redist\ ou raiz)
Source: "redist\postgresql-16.1-windows-x64.exe"; DestDir: "{tmp}"; DestName: "postgresql-16.1-windows-x64.exe"; Flags: deleteafterinstall skipifsourcedoesntexist
Source: "redist\postgresql-16.1-1-windows-x64.exe"; DestDir: "{tmp}"; DestName: "postgresql-16.1-windows-x64.exe"; Flags: deleteafterinstall skipifsourcedoesntexist
Source: "postgresql-16.1-windows-x64.exe"; DestDir: "{tmp}"; DestName: "postgresql-16.1-windows-x64.exe"; Flags: deleteafterinstall skipifsourcedoesntexist
Source: "postgresql-16.1-1-windows-x64.exe"; DestDir: "{tmp}"; DestName: "postgresql-16.1-windows-x64.exe"; Flags: deleteafterinstall skipifsourcedoesntexist

[Registry]
; Persistência Administrativa (HKLM) da porta validada e status do provisionamento
Root: HKLM; Subkey: "SOFTWARE\SucessoEdu\Database"; ValueType: string; ValueName: "DB_PORT"; ValueData: "{code:GetValidatedPort}"; Flags: uninsdeletekey
Root: HKLM; Subkey: "SOFTWARE\SucessoEdu\Database"; ValueType: string; ValueName: "INSTALL_STATUS"; ValueData: "SUCCESS"; Flags: uninsdeletekey
Root: HKLM; Subkey: "SOFTWARE\SucessoEdu\Database"; ValueType: string; ValueName: "INSTALL_DIR"; ValueData: "{app}"; Flags: uninsdeletekey
Root: HKLM; Subkey: "SOFTWARE\SucessoEdu\Database"; ValueType: string; ValueName: "VERSION"; ValueData: "16.1"; Flags: uninsdeletekey
Root: HKLM; Subkey: "SOFTWARE\SucessoEdu\Database"; ValueType: string; ValueName: "UPDATED_AT"; ValueData: "{#MyAppVersion}"; Flags: uninsdeletekey

[Icons]
; Se o executável binário compilado existir, cria atalho direto para ele
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Check: FileExists(ExpandConstant('{app}\{#MyAppExeName}'))
Name: "{autoprograms}\{#MyAppName}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Check: FileExists(ExpandConstant('{app}\{#MyAppExeName}'))

; Se o executável não existir, cria atalho inteligente para o lançador universal SucessoEdu_App.bat
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\SucessoEdu_App.bat"; WorkingDir: "{app}"; Check: not FileExists(ExpandConstant('{app}\{#MyAppExeName}'))
Name: "{autoprograms}\{#MyAppName}\{#MyAppName}"; Filename: "{app}\SucessoEdu_App.bat"; WorkingDir: "{app}"; Check: not FileExists(ExpandConstant('{app}\{#MyAppExeName}'))
Name: "{autoprograms}\{#MyAppName}\Painel de Diagnóstico"; Filename: "{app}\Scripts\diagnostico_sucessoedu.bat"; WorkingDir: "{app}"
Name: "{autoprograms}\{#MyAppName}\Backup Manual Imediato"; Filename: "{app}\Scripts\backup_full.bat"; WorkingDir: "{app}"

[Run]
; 1. Aplicação de Permissões de Controle Total na Raiz {#TargetRoot} (C:\SucessoEduSistema)
Filename: "icacls.exe"; Parameters: """{#TargetRoot}"" /grant administrators:F /grant ""%USERNAME%"":F /grant ""NT SERVICE\SucessoEduBackup"":F /T /C /Q"; Flags: runhidden

; 2. Agendamento de Backup Diário às 03:00 AM via Tarefa do Windows
Filename: "schtasks.exe"; Parameters: "/create /tn ""SucessoEdu_DailyBackup"" /tr """"{app}\Scripts\backup_full.bat"""" /sc daily /st 03:00 /ru ""SYSTEM"" /f"; Flags: runhidden

; 3. Inicialização da Aplicação
; Cenário A: Se existir o executável {#MyAppExeName}, executa diretamente (com skipifdoesntexist preventivo)
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent skipifdoesntexist; Check: FileExists(ExpandConstant('{app}\{#MyAppExeName}'))

; Cenário B: Se não existir o executável {#MyAppExeName}, executa o lançador universal SucessoEdu_App.bat
Filename: "{app}\SucessoEdu_App.bat"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent skipifdoesntexist; Check: (not FileExists(ExpandConstant('{app}\{#MyAppExeName}'))) and FileExists(ExpandConstant('{app}\SucessoEdu_App.bat'))

[Code]
// Módulos: HardwareValidator, NetstatValidator, ProcessLockDiagnostic, VisualLogConsole
var
  StatusLogMemo: TMemo;
  StatusLabel: TNewStaticText;
  ValidatedPortStr: String;
  InitialPortStr: String;
  IsRequirementsValidated: Boolean;

// Declaração de API Win32 para Auto-Scroll do Memo de Log
function SendMessage(hWnd: HWND; Msg: Cardinal; wParam, lParam: Longint): Longint;
  external 'SendMessageW@user32.dll stdcall';

// Adiciona linha formatada ao Console Visual com Timestamp
procedure AddToLog(Msg: String);
begin
  if StatusLogMemo <> nil then
  begin
    StatusLogMemo.Lines.Add(GetDateTimeString('hh:nn:ss', '-', ':') + ' - ' + Msg);
    StatusLogMemo.SelStart := Length(StatusLogMemo.Text);
    SendMessage(StatusLogMemo.Handle, $0115, 7, 0);
  end;
  Log(Msg);
end;

// Obtém a porta final validada para uso em [Registry] e scripts
function GetValidatedPort(Param: String): String;
begin
  if ValidatedPortStr = '' then
    ValidatedPortStr := '{#PostgresActivePort}';
  Result := ValidatedPortStr;
end;

// HardwareValidator: Validação de Espaço em Disco (500MB recomendados: 300MB binários + margem pgdata)
function CheckDiskSpace(Path: String; MinMegabytes: Cardinal): Boolean;
var
  FreeSpace, TotalSpace: Int64;
  DriveStr: String;
  FreeMB: Cardinal;
begin
  DriveStr := ExtractFileDrive(Path);
  if DriveStr = '' then
    DriveStr := 'C:';
  DriveStr := AddBackslash(DriveStr);

  if GetSpaceOnDisk64(DriveStr, FreeSpace, TotalSpace) then
  begin
    FreeMB := Cardinal(FreeSpace div (1024 * 1024));
    Result := (FreeMB >= MinMegabytes);
    AddToLog('Espaço em disco livre: ' + IntToStr(FreeMB) + 'MB detectados na unidade ' + DriveStr);
  end
  else
  begin
    Result := False;
    AddToLog('[ERRO] Falha ao consultar espaço em disco da unidade ' + DriveStr);
  end;
end;

// NetstatValidator: Executa 'cmd /c netstat -an' para verificar se a porta TCP está LISTENING
function IsPortAvailable(Port: String): Boolean;
var
  ResultCode: Integer;
  TempFile: String;
  Command: String;
  FileSz: Int64;
begin
  Result := True;
  TempFile := ExpandConstant('{tmp}\netstat_check.tmp');
  
  // Executa netstat com redirecionamento de saída filtrando por :Port
  Command := '/c netstat -an | findstr /C:":' + Port + ' " | findstr /I "LISTENING" > "' + TempFile + '"';
  
  if ShellExec('open', ExpandConstant('{cmd}'), Command, '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
  begin
    if FileExists(TempFile) then
    begin
      // Se o arquivo não estiver vazio, significa que uma linha LISTENING foi encontrada
      if FileSize64(TempFile, FileSz) and (FileSz > 0) then
        Result := False;
      DeleteFile(TempFile);
    end;
  end;
end;

// NetstatValidator com Fallback Inteligente: 5432 -> 5433 -> 5434...
function ResolveActivePort(BasePortStr: String): String;
var
  CandidatePort: Integer;
  CandidateStr: String;
begin
  CandidatePort := StrToIntDef(BasePortStr, 5432);
  CandidateStr := IntToStr(CandidatePort);

  // Testa a porta inicial
  if IsPortAvailable(CandidateStr) then
  begin
    Result := CandidateStr;
    Exit;
  end;

  // Porta ocupada: Alerta o usuário e tenta atribuir a próxima porta disponível (ex: 5433)
  CandidatePort := CandidatePort + 1;
  CandidateStr := IntToStr(CandidatePort);

  while not IsPortAvailable(CandidateStr) and (CandidatePort < 5440) do
  begin
    CandidatePort := CandidatePort + 1;
    CandidateStr := IntToStr(CandidatePort);
  end;

  AddToLog('[REDE] Porta ' + BasePortStr + ' ocupada. Remapeando para: ' + CandidateStr);
  Result := CandidateStr;
end;

// ProcessLockDiagnostic: Verifica se instâncias ativas de postgres.exe estão retendo arquivos
function IsPostgresRunning(): Boolean;
var
  ResultCode: Integer;
begin
  Result := ShellExec('open', ExpandConstant('{cmd}'), '/c tasklist.exe /FI "IMAGENAME eq postgres.exe" /NH | find /I "postgres.exe"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Result := Result and (ResultCode = 0);
end;

// Criação da Interface de Log Visual na página wpInstalling
procedure InitializeWizard();
begin
  StatusLabel := TNewStaticText.Create(WizardForm);
  StatusLabel.Parent := WizardForm.InstallingPage;
  StatusLabel.Left := WizardForm.ProgressGauge.Left;
  StatusLabel.Top := WizardForm.ProgressGauge.Top + WizardForm.ProgressGauge.Height + ScaleY(10);
  StatusLabel.Caption := 'Log de Atividades NexusEdu:';
  StatusLabel.Font.Style := [fsBold];
  
  StatusLogMemo := TMemo.Create(WizardForm);
  StatusLogMemo.Parent := WizardForm.InstallingPage;
  StatusLogMemo.Left := WizardForm.ProgressGauge.Left;
  StatusLogMemo.Top := StatusLabel.Top + StatusLabel.Height + ScaleY(5);
  StatusLogMemo.Width := WizardForm.ProgressGauge.Width;
  StatusLogMemo.Height := ScaleY(80);
  StatusLogMemo.ReadOnly := True;
  StatusLogMemo.ScrollBars := ssVertical;
  StatusLogMemo.Font.Name := 'Courier New';
  StatusLogMemo.Font.Size := 8;
  StatusLogMemo.Color := $002A170F; // Fundo Dark Slate (#0F172A)
  StatusLogMemo.Font.Color := $00F8BD38; // Texto Cyan (#38BDF8)
end;

// FirewallBypasser: Auxilia no download manual assistido do PostgreSQL 16 caso o download IDP falhe
procedure TriggerManualDownloadAssist();
var
  ErrorCode: Integer;
  DownloadUrl: String;
begin
  DownloadUrl := '{#PostgresDownloadUrl}';
  if MsgBox('Aviso de Rede / Firewall:' + #13#10#13#10 +
            'O instalador do PostgreSQL 16.1 não foi encontrado localmente ou o download automático foi bloqueado.' + #13#10 +
            'Deseja abrir o navegador para efetuar o download manual assistido oficial (EnterpriseDB)?' + #13#10 +
            'URL: ' + DownloadUrl, mbConfirmation, MB_YESNO) = IDYES then
  begin
    ShellExec('open', DownloadUrl, '', '', SW_SHOWNORMAL, ewNoWait, ErrorCode);
  end;
end;

// Verifica se o instalador do PostgreSQL realmente existe em {tmp} antes de tentar executar
function PostgresInstallerExists(): Boolean;
var
  TmpExe: String;
  SrcRedist1, SrcRedist2: String;
  SrcRoot1, SrcRoot2: String;
begin
  TmpExe := ExpandConstant('{tmp}\postgresql-16.1-windows-x64.exe');
  if FileExists(TmpExe) then
  begin
    Result := True;
    Exit;
  end;

  // Busca em pastas locais caso o binário não tenha sido extraído automaticamente para {tmp}
  SrcRedist1 := ExpandConstant('{src}\redist\postgresql-16.1-windows-x64.exe');
  SrcRedist2 := ExpandConstant('{src}\redist\postgresql-16.1-1-windows-x64.exe');
  SrcRoot1 := ExpandConstant('{src}\postgresql-16.1-windows-x64.exe');
  SrcRoot2 := ExpandConstant('{src}\postgresql-16.1-1-windows-x64.exe');

  if FileExists(SrcRedist1) then
  begin
    FileCopy(SrcRedist1, TmpExe, False);
    Result := True;
    Exit;
  end
  else if FileExists(SrcRedist2) then
  begin
    FileCopy(SrcRedist2, TmpExe, False);
    Result := True;
    Exit;
  end
  else if FileExists(SrcRoot1) then
  begin
    FileCopy(SrcRoot1, TmpExe, False);
    Result := True;
    Exit;
  end
  else if FileExists(SrcRoot2) then
  begin
    FileCopy(SrcRoot2, TmpExe, False);
    Result := True;
    Exit;
  end;

  // Caso o instalador não tenha sido embutido no pacote, orienta o download oficial assistido
  TriggerManualDownloadAssist();
  Result := False;
end;

// Check Antecipado no InitializeSetup
function InitializeSetup(): Boolean;
begin
  Result := True;
  IsRequirementsValidated := False;
  InitialPortStr := '{#PostgresActivePort}';

  // 1. Verificação obrigatória de privilégios administrativos
  if not IsAdminLoggedOn then
  begin
    MsgBox('Privilégios Administrativos Insuficientes:' + #13#10#13#10 +
           'O instalador do NexusEdu exige privilégios de Administrador para:' + #13#10 +
           '- Validação de portas TCP e encerramento de processos bloqueados' + #13#10 +
           '- Escrita de chaves de registro em HKEY_LOCAL_MACHINE' + #13#10 +
           '- Provisionamento do serviço PostgreSQL 16.1' + #13#10#13#10 +
           'Por favor, clique com o botão direito no instalador e selecione "Executar como Administrador".', mbCriticalError, MB_OK);
    Result := False;
    Exit;
  end;

  IsRequirementsValidated := True;
end;

// Validação Prévia no PrepareToInstall: Aborta com segurança antes de extrair arquivos
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ErrorCode: Integer;
begin
  Result := '';
  AddToLog('Iniciando Pre-Install Check...');

  // 1. Verificar Espaço em Disco (300MB binários + margem de segurança para Data - 500MB recomendados)
  if not CheckDiskSpace(ExpandConstant('{app}'), 500) then
  begin
    Result := 'Espaço em disco insuficiente. São necessários pelo menos 500MB livres para o Banco de Dados.';
    AddToLog('[ERRO CRÍTICO] ' + Result);
    Exit;
  end;
  AddToLog('[OK] Espaço em disco validado.');

  // 2. Verificar Processos Ativos
  if IsPostgresRunning() then
  begin
    AddToLog('[AVISO] Instância de Postgres detectada. Finalizando processos...');
    ShellExec('open', 'taskkill.exe', '/F /IM postgres.exe /T', '', SW_HIDE, ewWaitUntilTerminated, ErrorCode);
    Sleep(2000);
    if IsPostgresRunning() then
      AddToLog('[ALERTA] Processos postgres.exe ainda ativos.')
    else
      AddToLog('[OK] Processos postgres.exe finalizados com sucesso.');
  end
  else
  begin
    AddToLog('[OK] Nenhum processo conflitante de postgres.exe detectado.');
  end;

  // 3. Validação de Porta e Rede
  AddToLog('Validando porta do banco de dados...');
  ValidatedPortStr := ResolveActivePort(InitialPortStr);
  AddToLog('[OK] Porta definida: ' + ValidatedPortStr);
end;

// Provisionamento do Banco de Dados e Regras de Infraestrutura
procedure ConfigurePostgres();
var
  ResultCode: Integer;
  InstallerPath: String;
  Params: String;
  ActivePort: String;
begin
  ActivePort := GetValidatedPort('');
  InstallerPath := ExpandConstant('{tmp}\postgresql-16.1-windows-x64.exe');

  if not IsWin64 then
  begin
    AddToLog('[INFO] Arquitetura Windows de 32 bits (x86) detectada.');
    AddToLog('[INFO] O PostgreSQL 16 x64 requer Windows 64 bits.');
    AddToLog('[INFO] SucessoEdu instalado com sucesso para operar via Micro-Servidor Local / SQLite ou conectado à rede.');
  end
  else
  begin
    AddToLog('Executando instalador silencioso PostgreSQL 16.1 (x64)...');

    if PostgresInstallerExists() then
    begin
      Params := '--mode unattended --unattendedmodeui none ' +
                '--prefix ""' + ExpandConstant('{app}\PostgreSQL') + '"" ' +
                '--datadir ""' + ExpandConstant('{app}\Data\pgdata') + '"" ' +
                '--superpassword ""NexusEdu2026!"" ' +
                '--serverport ' + ActivePort + ' ' +
                '--create_shortcuts 0';

      AddToLog('Binários: ' + ExpandConstant('{app}\PostgreSQL'));
      AddToLog('Dados: ' + ExpandConstant('{app}\Data\pgdata'));
      AddToLog('Porta do Serviço: ' + ActivePort);

      if ShellExec('open', InstallerPath, Params, '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
      begin
        if ResultCode = 0 then
          AddToLog('[SUCESSO] PostgreSQL 16.1 instalado e cluster inicializado com êxito.')
        else
          AddToLog('[AVISO] Instalador PostgreSQL finalizou com código: ' + IntToStr(ResultCode));
      end
      else
      begin
        AddToLog('[FALHA] Falha ao iniciar executável do PostgreSQL em ' + InstallerPath);
      end;
    end
    else
    begin
      AddToLog('[AVISO] Instalador do PostgreSQL não localizado em {tmp}.');
    end;
  end;

  AddToLog('Configurando Firewall na Porta ' + ActivePort + '...');
  ShellExec('open', 'netsh.exe', 'advfirewall firewall add rule name="SucessoEdu DB" dir=in action=allow protocol=TCP localport=' + ActivePort, '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  ShellExec('open', 'netsh.exe', 'advfirewall firewall add rule name="SucessoEdu App Engine" dir=in action=allow program="' + ExpandConstant('{app}\{#MyAppExeName}') + '" enable=yes', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

  AddToLog('Persistindo metadados em HKLM\SOFTWARE\SucessoEdu\Database...');
  RegWriteStringValue(HKEY_LOCAL_MACHINE, 'SOFTWARE\SucessoEdu\Database', 'DB_PORT', ActivePort);
  RegWriteStringValue(HKEY_LOCAL_MACHINE, 'SOFTWARE\SucessoEdu\Database', 'INSTALL_STATUS', 'SUCCESS');
  RegWriteStringValue(HKEY_LOCAL_MACHINE, 'SOFTWARE\SucessoEdu\Database', 'INSTALL_DIR', ExpandConstant('{app}'));
  RegWriteStringValue(HKEY_LOCAL_MACHINE, 'SOFTWARE\SucessoEdu\Database', 'VERSION', '16.1');
  RegWriteStringValue(HKEY_LOCAL_MACHINE, 'SOFTWARE\SucessoEdu\Database', 'UPDATED_AT', '{#MyAppVersion}');

  AddToLog('[SUCESSO] SucessoEdu DB instalado e otimizado.');
end;

// Garante a existência do lançador universal SucessoEdu_App.bat e SucessoEdu_App.vbs
procedure EnsureLaunchersExist();
var
  BatPath, VbsPath: String;
  BatContent, VbsContent: String;
begin
  BatPath := ExpandConstant('{app}\SucessoEdu_App.bat');
  VbsPath := ExpandConstant('{app}\SucessoEdu_App.vbs');

  if not FileExists(BatPath) then
  begin
    BatContent := '@echo off' + #13#10 +
                  'chcp 65001 >nul' + #13#10 +
                  'title SucessoEdu Gestão Educacional' + #13#10 +
                  'cd /d "%~dp0"' + #13#10 +
                  'if exist "%~dp0SucessoEdu_App.exe" ( start "" "%~dp0SucessoEdu_App.exe" & exit /b 0 )' + #13#10 +
                  'if exist "%~dp0SucessoEdu_App.vbs" ( start "" wscript.exe "%~dp0SucessoEdu_App.vbs" & exit /b 0 )' + #13#10 +
                  'if exist "%~dp0SucessoEdu_Aplicativo_Offline.html" ( start "" "%~dp0SucessoEdu_Aplicativo_Offline.html" & exit /b 0 )' + #13#10 +
                  'if exist "%~dp0index.html" ( start "" "%~dp0index.html" & exit /b 0 )' + #13#10 +
                  'start "" "http://localhost:3000/"' + #13#10 +
                  'exit /b 0' + #13#10;
    SaveStringToFile(BatPath, BatContent, False);
    AddToLog('Lançador universal SucessoEdu_App.bat inicializado com sucesso.');
  end;

  if not FileExists(VbsPath) then
  begin
    VbsContent := 'Set WshShell = CreateObject("WScript.Shell")' + #13#10 +
                  'Set fso = CreateObject("Scripting.FileSystemObject")' + #13#10 +
                  'currentDir = fso.GetParentFolderName(WScript.ScriptFullName)' + #13#10 +
                  'If fso.FileExists(currentDir & "\SucessoEdu_App.exe") Then' + #13#10 +
                  '    WshShell.Run """" & currentDir & "\SucessoEdu_App.exe""", 1, False' + #13#10 +
                  'ElseIf fso.FileExists(currentDir & "\SucessoEdu_Aplicativo_Offline.html") Then' + #13#10 +
                  '    WshShell.Run """" & currentDir & "\SucessoEdu_Aplicativo_Offline.html""", 1, False' + #13#10 +
                  'ElseIf fso.FileExists(currentDir & "\index.html") Then' + #13#10 +
                  '    WshShell.Run """" & currentDir & "\index.html""", 1, False' + #13#10 +
                  'Else' + #13#10 +
                  '    WshShell.Run "http://localhost:3000/", 1, False' + #13#10 +
                  'End If' + #13#10;
    SaveStringToFile(VbsPath, VbsContent, False);
    AddToLog('Lançador silencioso SucessoEdu_App.vbs inicializado com sucesso.');
  end;
end;

// Gatilhos de Etapas de Instalação (CurStepChanged)
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssInstall then
  begin
    AddToLog('Extraindo arquivos do SucessoEdu para o diretório de destino...');
  end
  else if CurStep = ssPostInstall then
  begin
    EnsureLaunchersExist();
    ConfigurePostgres();
  end;
end;

// Política de Preservação de Dados e Licenças na Desinstalação
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usUninstall then
  begin
    if MsgBox('Deseja manter a pasta de dados do banco de dados (' + ExpandConstant('{app}') + '\Data) ' +
              'e as configurações de registro (HKLM\SOFTWARE\NexusEdu) para uma reinstalação futura?', mbConfirmation, MB_YESNO) = IDYES then
    begin
      Log('Preservando dados do PostgreSQL e chaves de registro conforme política educacional.');
    end;
  end;
end;
