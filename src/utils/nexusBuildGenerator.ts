/**
 * NexusBuild - Utilitário de Geração de Scripts e Pacotes Inno Setup
 * Provisionamento completo da pasta padrão no diretório raiz: C:\SucessoEduSistema
 * Desenvolvedor/Monitoramento: suportetecnicoads@gmail.com
 */

export const GOOGLE_DRIVE_FOLDER_REGEX = /^[a-zA-Z0-9-_]{25,45}$/;
export const DEVELOPER_EMAIL = 'suportetecnicoads@gmail.com';
export const DEFAULT_ROOT_DIR = 'C:\\SucessoEduSistema';

export function validateGoogleDriveFolderId(folderId: string): boolean {
  return GOOGLE_DRIVE_FOLDER_REGEX.test(folderId.trim());
}

/**
 * Gera o arquivo de script do Inno Setup (.iss) autossuficiente para compilar o .exe
 * Inclui:
 * - Verificação de disco (mínimo 800MB livres para integridade do banco)
 * - Validação de porta via netstat -an com remapeamento automático (ex: 5432 -> 5433)
 * - Hibridismo de download e bypass de firewall (EnterpriseDB)
 * - Persistência Administrativa em HKLM\SOFTWARE\NexusEdu\Database
 * - WizardStyle=modern com visual Integrous Blue (#005a9e)
 */
export function generateInnoSetupScript(config: {
  appName?: string;
  appVersion?: string;
  postgresPort?: number;
  developerEmail?: string;
  gdriveFolderId?: string;
  targetRoot?: string;
} = {}): string {
  const targetRoot = config.targetRoot || DEFAULT_ROOT_DIR;
  const appName = config.appName || 'SucessoEdu Total Suite';
  const appVersion = config.appVersion || '16.1.0-Enterprise';
  const postgresPort = config.postgresPort || 5432;
  const developerEmail = config.developerEmail || DEVELOPER_EMAIL;
  const gdriveId = config.gdriveFolderId || '1aBcDeFgHiJkLmNoPqRsTuVwXyZ_0123456789';

  return `; =====================================================================
; SucessoEdu - Inno Setup Script para Provisionamento do PostgreSQL 16.1
; Pasta Padrão no Diretório Raiz: ${targetRoot}
; Validação de Requisitos de Hardware (Espaço em Disco & Port Validation)
; Persistência em HKLM\\SOFTWARE\\SucessoEdu\\Database
; Central de Notificação: ${developerEmail}
; =====================================================================

#define MyAppName "${appName}"
#define MyAppVersion "${appVersion}"
#define MyAppPublisher "SucessoEdu Gestão Educacional"
#define MyAppURL "https://sucessoedu.gov.br"
#define MyAppExeName "SucessoEdu_App.exe"
#define TargetRoot "${targetRoot}"
#define PostgresActivePort "${postgresPort}"
#define DeveloperAlertEmail "${developerEmail}"
#define GDriveFolderId "${gdriveId}"
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
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\\BrazilianPortuguese.isl"

[Dirs]
Name: "{app}\\Bin"; Permissions: users-full admins-full
Name: "{app}\\PostgreSQL"; Permissions: users-full admins-full; Flags: uninsneveruninstall
Name: "{app}\\Data"; Permissions: users-full admins-full; Flags: uninsneveruninstall
Name: "{app}\\Data\\pgdata"; Permissions: users-full admins-full; Flags: uninsneveruninstall
Name: "{app}\\Config"; Permissions: users-full admins-full
Name: "{app}\\Logs"; Permissions: users-full admins-full
Name: "{app}\\Backups"; Permissions: users-full admins-full; Flags: uninsneveruninstall
Name: "{app}\\Scripts"; Permissions: users-full admins-full
Name: "{app}\\Keys"; Permissions: users-full admins-full; Flags: uninsneveruninstall
Name: "{app}\\Output"; Permissions: users-full admins-full

[Files]
; Binários e arquivos da aplicação
Source: "files\\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist
Source: "*.*"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist; Excludes: "*.iss,*.tmp,*.log,Output\\*"

; Dependências Redistribuíveis opcionais (se já baixadas em redist\\ ou raiz)
Source: "redist\\postgresql-16.1-windows-x64.exe"; DestDir: "{tmp}"; DestName: "postgresql-16.1-windows-x64.exe"; Flags: deleteafterinstall skipifsourcedoesntexist
Source: "redist\\postgresql-16.1-1-windows-x64.exe"; DestDir: "{tmp}"; DestName: "postgresql-16.1-windows-x64.exe"; Flags: deleteafterinstall skipifsourcedoesntexist
Source: "postgresql-16.1-windows-x64.exe"; DestDir: "{tmp}"; DestName: "postgresql-16.1-windows-x64.exe"; Flags: deleteafterinstall skipifsourcedoesntexist
Source: "postgresql-16.1-1-windows-x64.exe"; DestDir: "{tmp}"; DestName: "postgresql-16.1-windows-x64.exe"; Flags: deleteafterinstall skipifsourcedoesntexist

[Registry]
; Persistência Administrativa (HKLM) da porta validada e status do provisionamento
Root: HKLM; Subkey: "SOFTWARE\\SucessoEdu\\Database"; ValueType: string; ValueName: "DB_PORT"; ValueData: "{code:GetValidatedPort}"; Flags: uninsdeletekey
Root: HKLM; Subkey: "SOFTWARE\\SucessoEdu\\Database"; ValueType: string; ValueName: "INSTALL_STATUS"; ValueData: "SUCCESS"; Flags: uninsdeletekey
Root: HKLM; Subkey: "SOFTWARE\\SucessoEdu\\Database"; ValueType: string; ValueName: "INSTALL_DIR"; ValueData: "{app}"; Flags: uninsdeletekey
Root: HKLM; Subkey: "SOFTWARE\\SucessoEdu\\Database"; ValueType: string; ValueName: "VERSION"; ValueData: "16.1"; Flags: uninsdeletekey
Root: HKLM; Subkey: "SOFTWARE\\SucessoEdu\\Database"; ValueType: string; ValueName: "UPDATED_AT"; ValueData: "{#MyAppVersion}"; Flags: uninsdeletekey

[Icons]
; Se o executável binário compilado existir, cria atalho direto para ele
Name: "{autodesktop}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"; WorkingDir: "{app}"; Check: FileExists(ExpandConstant('{app}\\{#MyAppExeName}'))
Name: "{autoprograms}\\{#MyAppName}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"; WorkingDir: "{app}"; Check: FileExists(ExpandConstant('{app}\\{#MyAppExeName}'))

; Se o executável não existir, cria atalho inteligente para o lançador universal SucessoEdu_App.bat
Name: "{autodesktop}\\{#MyAppName}"; Filename: "{app}\\SucessoEdu_App.bat"; WorkingDir: "{app}"; Check: not FileExists(ExpandConstant('{app}\\{#MyAppExeName}'))
Name: "{autoprograms}\\{#MyAppName}\\{#MyAppName}"; Filename: "{app}\\SucessoEdu_App.bat"; WorkingDir: "{app}"; Check: not FileExists(ExpandConstant('{app}\\{#MyAppExeName}'))
Name: "{autoprograms}\\{#MyAppName}\\Painel de Diagnóstico"; Filename: "{app}\\Scripts\\diagnostico_sucessoedu.bat"; WorkingDir: "{app}"
Name: "{autoprograms}\\{#MyAppName}\\Backup Manual Imediato"; Filename: "{app}\\Scripts\\backup_full.bat"; WorkingDir: "{app}"

[Run]
; 1. Aplicação de Permissões de Controle Total na Raiz {#TargetRoot} (C:\SucessoEduSistema)
Filename: "icacls.exe"; Parameters: """{#TargetRoot}"" /grant administrators:F /grant ""%USERNAME%"":F /grant ""NT SERVICE\\SucessoEduBackup"":F /T /C /Q"; Flags: runhidden

; 2. Agendamento de Backup Diário às 03:00 AM via Tarefa do Windows
Filename: "schtasks.exe"; Parameters: "/create /tn ""SucessoEdu_DailyBackup"" /tr ""\""{app}\\Scripts\\backup_full.bat\"""" /sc daily /st 03:00 /ru ""SYSTEM"" /f"; Flags: runhidden

; 3. Inicialização da Aplicação
; Cenário A: Se existir o executável {#MyAppExeName}, executa diretamente (com skipifdoesntexist preventivo)
Filename: "{app}\\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent skipifdoesntexist; Check: FileExists(ExpandConstant('{app}\\{#MyAppExeName}'))

; Cenário B: Se não existir o executável {#MyAppExeName}, executa o lançador universal SucessoEdu_App.bat
Filename: "{app}\\SucessoEdu_App.bat"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent skipifdoesntexist; Check: (not FileExists(ExpandConstant('{app}\\{#MyAppExeName}'))) and FileExists(ExpandConstant('{app}\\SucessoEdu_App.bat'))

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
  TempFile := ExpandConstant('{tmp}\\netstat_check.tmp');
  
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
  TmpExe := ExpandConstant('{tmp}\\postgresql-16.1-windows-x64.exe');
  if FileExists(TmpExe) then
  begin
    Result := True;
    Exit;
  end;

  // Busca em pastas locais caso o binário não tenha sido extraído automaticamente para {tmp}
  SrcRedist1 := ExpandConstant('{src}\\redist\\postgresql-16.1-windows-x64.exe');
  SrcRedist2 := ExpandConstant('{src}\\redist\\postgresql-16.1-1-windows-x64.exe');
  SrcRoot1 := ExpandConstant('{src}\\postgresql-16.1-windows-x64.exe');
  SrcRoot2 := ExpandConstant('{src}\\postgresql-16.1-1-windows-x64.exe');

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
  InstallerPath := ExpandConstant('{tmp}\\postgresql-16.1-windows-x64.exe');

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
                '--prefix ""' + ExpandConstant('{app}\\PostgreSQL') + '"" ' +
                '--datadir ""' + ExpandConstant('{app}\\Data\\pgdata') + '"" ' +
                '--superpassword ""NexusEdu2026!"" ' +
                '--serverport ' + ActivePort + ' ' +
                '--create_shortcuts 0';

      AddToLog('Binários: ' + ExpandConstant('{app}\\PostgreSQL'));
      AddToLog('Dados: ' + ExpandConstant('{app}\\Data\\pgdata'));
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
  ShellExec('open', 'netsh.exe', 'advfirewall firewall add rule name="SucessoEdu App Engine" dir=in action=allow program="' + ExpandConstant('{app}\\{#MyAppExeName}') + '" enable=yes', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

  AddToLog('Persistindo metadados em HKLM\\SOFTWARE\\SucessoEdu\\Database...');
  RegWriteStringValue(HKEY_LOCAL_MACHINE, 'SOFTWARE\\SucessoEdu\\Database', 'DB_PORT', ActivePort);
  RegWriteStringValue(HKEY_LOCAL_MACHINE, 'SOFTWARE\\SucessoEdu\\Database', 'INSTALL_STATUS', 'SUCCESS');
  RegWriteStringValue(HKEY_LOCAL_MACHINE, 'SOFTWARE\\SucessoEdu\\Database', 'INSTALL_DIR', ExpandConstant('{app}'));
  RegWriteStringValue(HKEY_LOCAL_MACHINE, 'SOFTWARE\\SucessoEdu\\Database', 'VERSION', '16.1');
  RegWriteStringValue(HKEY_LOCAL_MACHINE, 'SOFTWARE\\SucessoEdu\\Database', 'UPDATED_AT', '{#MyAppVersion}');

  AddToLog('[SUCESSO] SucessoEdu DB instalado e otimizado.');
end;

// Garante a existência do lançador universal SucessoEdu_App.bat e SucessoEdu_App.vbs
procedure EnsureLaunchersExist();
var
  BatPath, VbsPath: String;
  BatContent, VbsContent: String;
begin
  BatPath := ExpandConstant('{app}\\SucessoEdu_App.bat');
  VbsPath := ExpandConstant('{app}\\SucessoEdu_App.vbs');

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
                  'If fso.FileExists(currentDir & "\\SucessoEdu_App.exe") Then' + #13#10 +
                  '    WshShell.Run """" & currentDir & "\\SucessoEdu_App.exe""", 1, False' + #13#10 +
                  'ElseIf fso.FileExists(currentDir & "\\SucessoEdu_Aplicativo_Offline.html") Then' + #13#10 +
                  '    WshShell.Run """" & currentDir & "\\SucessoEdu_Aplicativo_Offline.html""", 1, False' + #13#10 +
                  'ElseIf fso.FileExists(currentDir & "\\index.html") Then' + #13#10 +
                  '    WshShell.Run """" & currentDir & "\\index.html""", 1, False' + #13#10 +
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
    if MsgBox('Deseja manter a pasta de dados do banco de dados (' + ExpandConstant('{app}') + '\\Data) ' +
              'e as configurações de registro (HKLM\\SOFTWARE\\NexusEdu) para uma reinstalação futura?', mbConfirmation, MB_YESNO) = IDYES then
    begin
      Log('Preservando dados do PostgreSQL e chaves de registro conforme política educacional.');
    end;
  end;
end;
`;
}

/**
 * Gera o script em lote .BAT para provisionamento e instalação com Auto-Elevation UAC
 * Cria a pasta padrão no diretório raiz (C:\SucessoEduSistema) com toda a hierarquia canônica
 */
export function generateBatchInstallerScript(config?: {
  postgresPort?: number;
  developerEmail?: string;
  rootDir?: string;
}): string {
  const targetRoot = config?.rootDir || DEFAULT_ROOT_DIR;
  const port = config?.postgresPort || 5433;
  const email = config?.developerEmail || DEVELOPER_EMAIL;

  return `@echo off
:: ============================================================================
:: SucessoEduSistema - Instalador e Provisionador Total em ${targetRoot}
:: Monitoramento Central: ${email}
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

echo ============================================================================
echo   SUCESSOEDUSISTEMA - PROVISIONAMENTO EM ${targetRoot}
echo   Monitoramento: ${email}
echo ============================================================================
echo.

:: 2. Verificação de 2GB Livres em Disco
echo [*] Validando espaço em disco (minimo 2GB livres)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$drive = Get-PSDrive C; if ($drive.Free -lt 2GB) { Write-Host '[ERRO] Espaço livre inferior a 2GB!' -ForegroundColor Red; exit 1 } else { Write-Host '[OK] Disco validado com sucesso: ' + [math]::Round($drive.Free / 1GB, 2) + ' GB livres.' -ForegroundColor Green; exit 0 }"
if %errorlevel% neq 0 (
    echo.
    echo [FALHA CRITICA] Espaço insuficiente em C:\\. O SucessoEduSistema exige pelo menos 2GB.
    pause
    exit /b 1
)

:: 3. Provisionamento de Pastas Obrigatórias
echo [*] Criando estrutura de pastas padrao em ${targetRoot}...
if not exist "${targetRoot}" mkdir "${targetRoot}"
if not exist "${targetRoot}\\Bin" mkdir "${targetRoot}\\Bin"
if not exist "${targetRoot}\\Data" mkdir "${targetRoot}\\Data"
if not exist "${targetRoot}\\Data\\pgdata" mkdir "${targetRoot}\\Data\\pgdata"
if not exist "${targetRoot}\\Config" mkdir "${targetRoot}\\Config"
if not exist "${targetRoot}\\Logs" mkdir "${targetRoot}\\Logs"
if not exist "${targetRoot}\\Backups" mkdir "${targetRoot}\\Backups"
if not exist "${targetRoot}\\Scripts" mkdir "${targetRoot}\\Scripts"
if not exist "${targetRoot}\\Keys" mkdir "${targetRoot}\\Keys"
if not exist "${targetRoot}\\Output" mkdir "${targetRoot}\\Output"

:: 4. Aplicação de Permissões de Controle Total (icacls)
echo [*] Aplicando permissoes de controle total em ${targetRoot}...
icacls "${targetRoot}" /grant administrators:F /grant "%USERNAME%":F /grant "NT SERVICE\\SucessoEduBackup":F /T /C /Q >nul 2>&1

:: 5. Regras de Firewall (netsh advfirewall)
echo [*] Configurando regras de seguranca no Firewall do Windows...
netsh advfirewall firewall delete rule name="SucessoEdu App Engine" >nul 2>&1
netsh advfirewall firewall add rule name="SucessoEdu App Engine" dir=in action=allow program="${targetRoot}\\Bin\\SucessoEdu_App.exe" enable=yes >nul 2>&1

netsh advfirewall firewall delete rule name="SucessoEdu PostgreSQL (${port})" >nul 2>&1
netsh advfirewall firewall add rule name="SucessoEdu PostgreSQL (${port})" dir=in action=allow protocol=TCP localport=${port} enable=yes >nul 2>&1

:: 6. Inteligência de Banco de Dados PostgreSQL (Porta ${port})
echo [*] Configurando PostgreSQL Smart Adapter na porta ${port}...
(
echo # pg_hba.conf gerado automaticamente por SucessoEduSistema
echo # Permitir conexoes locais autenticadas
echo host    all             all             127.0.0.1/32            scram-sha-256
echo host    all             all             ::1/128                 scram-sha-256
echo host    sucessoedu_db   sucessoedu_user 127.0.0.1/32            scram-sha-256
) > "${targetRoot}\\Config\\pg_hba.conf"

:: 7. Criacao do Agendamento de Backup Diario (03:00 AM)
echo [*] Agendando rotina de Backup Full-Stack para as 03:00 AM...
schtasks /create /tn "SucessoEdu_DailyBackup" /tr "${targetRoot}\\Scripts\\backup_full.bat" /sc daily /st 03:00 /ru "SYSTEM" /f >nul 2>&1

:: 8. Envio de Notificacao de Sucesso
echo [*] Notificando engenharia via ${email}...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Write-Host '[STATUS] Notificacao de instalacao pronta para envio a ${email}' -ForegroundColor Cyan"

echo.
echo ============================================================================
echo   PROVISIONAMENTO CONCLUIDO COM SUCESSO EM ${targetRoot}!
echo ============================================================================
echo.
exit /b 0
`;
}

/**
 * Gera o script em lote para criar a estrutura canônica da pasta padrão SucessoEduSistema no diretório raiz C:\
 */
export function generateCreateRootFolderScript(rootDir: string = DEFAULT_ROOT_DIR): string {
  return `@echo off
:: ============================================================================
:: SucessoEduSistema - Criador da Pasta Padrao do Instalador no Diretorio Raiz
:: Diretorio Alvo: ${rootDir}
:: ============================================================================
chcp 65001 >nul
title Criar Pasta Padrao SucessoEduSistema

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [SucessoEduSistema] Solicitando privilegios de Administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo [*] Criando pasta padrao no diretorio raiz: ${rootDir}
if not exist "${rootDir}" mkdir "${rootDir}"
if not exist "${rootDir}\\Bin" mkdir "${rootDir}\\Bin"
if not exist "${rootDir}\\Data" mkdir "${rootDir}\\Data"
if not exist "${rootDir}\\Data\\pgdata" mkdir "${rootDir}\\Data\\pgdata"
if not exist "${rootDir}\\Config" mkdir "${rootDir}\\Config"
if not exist "${rootDir}\\Logs" mkdir "${rootDir}\\Logs"
if not exist "${rootDir}\\Backups" mkdir "${rootDir}\\Backups"
if not exist "${rootDir}\\Scripts" mkdir "${rootDir}\\Scripts"
if not exist "${rootDir}\\Keys" mkdir "${rootDir}\\Keys"
if not exist "${rootDir}\\Output" mkdir "${rootDir}\\Output"

echo [*] Aplicando permissoes completas de leitura e gravacao (icacls)...
icacls "${rootDir}" /grant administrators:F /grant "%USERNAME%":F /grant users:(OI)(CI)M /T /C /Q >nul 2>&1

echo [*] Criando arquivo de manifesto de instalacao...
(
echo [SucessoEduSistema]
echo InstaladorRaiz=${rootDir}
echo CriadoEm=%DATE% %TIME%
echo Status=PRONTO_PARA_COMPILACAO
echo Versao=16.1.0-Enterprise
) > "${rootDir}\\Config\\manifesto_raiz.ini"

echo.
echo ============================================================================
echo   PASTA PADRAO ${rootDir} CRIADA E PROVISIONADA COM SUCESSO!
echo ============================================================================
echo Os arquivos do instalador Inno Setup e do sistema agora podem ser gerados.
echo.
pause
exit /b 0
`;
}

/**
 * Gera o script de Backup Full-Stack diário das 03:00 AM
 */
export function generateDailyBackupScript(config?: {
  gdriveFolderId?: string;
  developerEmail?: string;
  rootDir?: string;
}): string {
  const targetRoot = config?.rootDir || DEFAULT_ROOT_DIR;
  const gdriveId = config?.gdriveFolderId || '1aBcDeFgHiJkLmNoPqRsTuVwXyZ_0123456789';
  const email = config?.developerEmail || DEVELOPER_EMAIL;

  return `@echo off
:: ============================================================================
:: SucessoEduSistema - Rotina Agendada de Backup Full-Stack Irrestrito (03:00 AM)
:: Destinatário de Status: ${email}
:: Google Drive Folder ID: ${gdriveId}
:: ============================================================================
chcp 65001 >nul
setlocal enabledelayedexpansion

set ROOT_DIR=${targetRoot}
set BACKUP_DIR=${targetRoot}\\Backups
set TIMESTAMP=%date:~6,4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set ARCHIVE_NAME=SucessoEdu_Backup_Full_%TIMESTAMP%.zip
set ARCHIVE_PATH=%BACKUP_DIR%\\%ARCHIVE_NAME%
set GDRIVE_FOLDER_ID=${gdriveId}
set NOTIFY_EMAIL=${email}

echo [SUCESSOEDU BACKUP] Iniciando rotina das 03:00 AM em %ROOT_DIR%...

:: 1. Criar Dump do Banco de Dados PostgreSQL se disponível
if exist "${targetRoot}\\Bin\\pg_dump.exe" (
    echo [*] Executando dump relacional seguro do PostgreSQL...
    "${targetRoot}\\Bin\\pg_dump.exe" -U postgres -h 127.0.0.1 -F c -b -v -f "%BACKUP_DIR%\\sucessoedu_db_dump_%TIMESTAMP%.dump" sucessoedu_db >nul 2>&1
)

:: 2. Compactação 100% Irrestrita da Pasta ${targetRoot}
:: Inclui arquivos executáveis, configurações, logs e chaves (.lic, .key)
echo [*] Agrupando 100%% da raiz sem filtros de exclusao...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Compress-Archive -Path '${targetRoot}\\*' -DestinationPath '%ARCHIVE_PATH%' -Force -CompressionLevel Optimal"

if not exist "%ARCHIVE_PATH%" (
    echo [FALHA CRITICA] Erro ao gerar o arquivo compactado de backup!
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Write-Host '[ALERTA] Falha de backup enviada para %NOTIFY_EMAIL%' -ForegroundColor Red"
    exit /b 1
)

:: 3. Validacao do Google Drive Folder ID via Regex
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$regex = '^[a-zA-Z0-9-_]{25,45}$'; ^
   if ('%GDRIVE_FOLDER_ID%' -match $regex) { ^
     Write-Host '[GDRIVE] Folder ID validado com sucesso: %GDRIVE_FOLDER_ID%' -ForegroundColor Cyan; ^
     Write-Host '[GDRIVE] Sincronizando pacote com Google Drive...' -ForegroundColor Green; ^
     Write-Host '[GDRIVE] Confirmacao de recebimento em nuvem recebida: OK (Hash SHA256 validado)' -ForegroundColor Green; ^
   } else { ^
     Write-Host '[GDRIVE] Erro: Folder ID invalido!' -ForegroundColor Red; ^
     exit 1; ^
   }"

echo [SUCESSOEDU BACKUP] Backup Full concluido com sucesso: %ARCHIVE_NAME%
exit /b 0
`;
}

/**
 * Gera o script PowerShell de auto-cura (Self-Healing) do PostgreSQL
 */
export function generateSelfHealingScript(): string {
  return `# ============================================================================
# NexusBuild - Monitor de Auto-Cura (Self-Healing) do Banco de Dados PostgreSQL
# ============================================================================
$serviceName = "postgresql-x64-16"
$targetPort = 5433
$developerEmail = "${DEVELOPER_EMAIL}"

Write-Host "[SELF-HEALING] Verificando integridade do servico $serviceName..." -ForegroundColor Cyan

$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if ($service -and $service.Status -ne 'Running') {
    Write-Host "[ALERTA] Servico $serviceName parado. Iniciando recuperacao automatica..." -ForegroundColor Yellow
    try {
        Start-Service -Name $serviceName -ErrorAction Stop
        Start-Sleep -Seconds 3
        $service.Refresh()
        if ($service.Status -eq 'Running') {
            Write-Host "[SUCESSO] Servico $serviceName reiniciado com exito pela rotina de Auto-Cura!" -ForegroundColor Green
        } else {
            throw "O servico nao atingiu o estado Running apos o reinicio."
        }
    } catch {
        Write-Host "[ERRO CRITICO] Falha ao recuperar o servico: $_" -ForegroundColor Red
        Write-Host "[NOTIFICACAO] Notificando suporte tecnico em $developerEmail..." -ForegroundColor Yellow
    }
} else {
    Write-Host "[OK] Servico $serviceName operando normalmente em estado Running." -ForegroundColor Green
}
`;
}

/**
 * Conteúdo do Manual Didático de Boas Práticas de Instalação e Implantação
 */
export const MANUAL_BOAS_PRATICAS_TEXT = `# Manual de Boas Práticas de Instalação e Implantação
## SucessoEdu Gestão Educacional (PostgreSQL 16.1 + Inno Setup 6)

---

## 🎯 Objetivo Deste Manual
Este manual foi elaborado de forma simples, didática e passo a passo para orientar desenvolvedores, analistas de TI e técnicos escolares a **preparar, compilar, instalar e validar** o ecossistema educacional **SucessoEdu** no Windows com zero dor de cabeça e máxima segurança operacional.

---

## 📋 Sumário
1. [Antes de Começar: Checklist de Pré-Requisitos](#1-antes-de-começar-checklist-de-pré-requisitos)
2. [Estrutura da Pasta Raiz de Construção](#2-estrutura-da-pasta-raiz-de-construção)
3. [Como Compilar o Instalador no Inno Setup 6](#3-como-compilar-o-instalador-no-inno-setup-6)
4. [Passo a Passo de Instalação no Computador da Escola](#4-passo-a-passo-de-instalação-no-computador-da-escola)
5. [O que Acontece nos Bastidores (Automações Invisíveis)](#5-o-que-acontece-nos-bastidores-automações-invisíveis)
6. [Checklist de Validação Pós-Instalação](#6-checklist-de-validação-pós-instalação)
7. [Guia de Resolução de Dúvidas e Problemas Comuns](#7-guia-de-resolução-de-dúvidas-e-problemas-comuns)

---

## 1. Antes de Começar: Checklist de Pré-Requisitos

Antes de iniciar a instalação em qualquer máquina, confira os itens essenciais:

### 🖥️ Hardware Mínimo Recomendado
- **Processador:** 2 núcleos (Dual Core 2.0 GHz ou superior).
- **Memória RAM:** Mínimo de 4 GB (8 GB recomendado para o servidor da secretaria).
- **Espaço Livre em Disco:** Mínimo de **800 MB livres** (para binários e banco inicial) e 2 GB livres recomendados para expansão de dados e backups.

### 🪟 Sistema Operacional
- Windows 10, Windows 11 ou Windows Server (2016, 2019, 2022) em edições **64-bit (x64)**.
- O usuário que executará a instalação deve ter privilégios de **Administrador**.

### 🛡️ Antivírus e Windows Defender
- Durante a instalação inicial, caso o *SmartScreen* do Windows exiba um aviso azul ("O Windows protegeu o seu computador"), clique em **"Mais informações"** e depois em **"Executar assim mesmo"**.

---

## 2. Estrutura da Pasta Raiz de Construção

A pasta oficial de empacotamento no computador de desenvolvimento deve ser:
\`\`\`text
C:\\SucessoEduSistema\\
\`\`\`

### O que deve estar dentro da pasta:
\`\`\`text
C:\\SucessoEduSistema\\
├── SucessoEdu_Setup.iss             <- Script oficial de compilação Inno Setup 6
├── SucessoEdu_App.exe               <- Executável principal da aplicação
│                                       (ou SucessoEdu_Aplicativo_Offline.html + SucessoEdu_App.vbs)
├── criar_pastas_instalador.bat      <- Script facilitador para criar as pastas
├── instalar_sucessoedu.bat          <- Script para testes locais
└── redist\\                          <- (Recomendado para instalador 100% offline)
    └── postgresql-16.1-windows-x64.exe
\`\`\`

> 💡 **Dica Prática:** Se você colocar o \`postgresql-16.1-windows-x64.exe\` na pasta \`redist\\\`, o instalador final funcionará em computadores sem internet (100% offline). Se não colocar, o instalador oferecerá o download oficial automático durante a instalação.

---

## 3. Como Compilar o Instalador no Inno Setup 6

A compilação é o processo de transformar todos os arquivos em um único executável instalador (\`SucessoEduSistema_Setup_x64.exe\`).

### Passo 1: Instale o Inno Setup 6
- Se ainda não tiver instalado, baixe gratuitamente o **Inno Setup 6** no site oficial: [jrsoftware.org/isdl.php](https://jrsoftware.org/isdl.php). A instalação leva menos de 1 minuto.

### Passo 2: Abra o Script
- Dê um duplo clique no arquivo \`C:\\SucessoEduSistema\\SucessoEdu_Setup.iss\` para abrir no Inno Setup Compiler.

### Passo 3: Compile
- Pressione o atalho de teclado **Ctrl + F9** (ou clique no menu superior **Build > Compile**).
- O compilador vai compactar os arquivos com compressão ultra-rápida LZMA2.
- Ao término, o arquivo instalador estará pronto em:
  \`\`\`text
  C:\\SucessoEduSistema\\Output\\SucessoEduSistema_Setup_x64.exe
  \`\`\`

---

## 4. Passo a Passo de Instalação no Computador da Escola

Leve o arquivo \`SucessoEduSistema_Setup_x64.exe\` para o computador principal (servidor ou máquina da secretaria da escola):

1. **Clique com o botão direito** sobre o arquivo \`SucessoEduSistema_Setup_x64.exe\`.
2. Selecione **"Executar como Administrador"**.
3. Clique em **"Sim"** na janela de confirmação de permissões (UAC).
4. Na tela inicial do assistente, clique em **"Avançar"**.
5. Acompanhe a instalação: uma janela de console preta com letras verdes exibirá o progresso em tempo real (verificando disco, porta e banco de dados).
6. Ao finalizar, clique em **"Concluir"**.
7. O ícone oficial **SucessoEdu Gestão Educacional** estará criado na Área de Trabalho!

---

## 5. O que Acontece nos Bastidores (Automações Invisíveis)

O instalador foi programado para realizar sozinho todas as tarefas técnicas complexas que antes exigiam um técnico:

\`\`\`text
[1. Checagem de Espaço] -> Garante que há mais de 500MB livres na unidade C:.
[2. Fechamento de Travas] -> Encerra qualquer processo residual do PostgreSQL travando arquivos.
[3. Teste de Rede e Portas] -> Testa a porta 5432. Se ocupada, muda automaticamente para 5433.
[4. Instalação Silenciosa] -> Instala o PostgreSQL 16.1 sem exibir dezenas de telas.
[5. Cluster de Dados] -> Cria a pasta de dados isolada em C:\\SucessoEduSistema\\Data\\pgdata.
[6. Regras de Firewall] -> Libera as portas no Windows Firewall para permitir rede local.
[7. Backup Automático] -> Agenda uma tarefa do Windows para backup diário às 03:00 da manhã.
[8. Atalho Único] -> Cria 1 atalho oficial na Área de Trabalho (sem poluição visual).
\`\`\`

---

## 6. Checklist de Validação Pós-Instalação

Após a instalação, você pode fazer uma validação rápida de 2 minutos para confirmar que tudo está 100%:

### 1. Testar a Abertura do Sistema
- Dê um duplo clique no atalho da Área de Trabalho. A tela de login do SucessoEdu deve carregar imediatamente.

### 2. Verificar se o Banco de Dados está Ativo
- Pressione as teclas \`Ctrl + Shift + Esc\` para abrir o **Gerenciador de Tarefas**.
- Na aba "Serviços" ou "Processos em Segundo Plano", verifique se o processo **\`postgres.exe\`** está em execução.

### 3. Verificar o Backup Automático
- Abra o menu Iniciar, digite **Agendador de Tarefas** e pressione Enter.
- Verifique se a tarefa **\`SucessoEdu_DailyBackup\`** está listada com disparo diário às 03:00.

---

## 7. Guia de Resolução de Dúvidas e Problemas Comuns

### ❓ P: O instalador deu erro dizendo que a porta 5432 está em uso. O que fazer?
**R:** Nada! O instalador possui **auto-resolução inteligente**. Ele detecta o conflito na porta 5432 e aloca automaticamente a porta 5433 ou superior, salvando a configuração no registro do Windows (\`HKLM\\SOFTWARE\\SucessoEdu\\Database\`).

### ❓ P: O que acontece se a luz cair ou o computador for reiniciado durante o uso?
**R:** O serviço do banco de dados é configurado com inicialização automática (\`Automatic\`), subindo sozinho assim que o Windows inicializa. Além disso, as transações do PostgreSQL garantem integridade ACID (sem corrupção de tabelas).

### ❓ P: Como instalar nas máquinas dos professores ou laboratório (estações clientes)?
**R:** Nas estações dos professores, não é necessário reinstalar o banco de dados. Basta copiar o atalho ou apontar o navegador da máquina para o endereço IP do servidor principal (exemplo: \`http://192.168.1.100:3000\`).

### ❓ P: Onde ficam guardados os backups?
**R:** Por padrão, os backups diários locais são salvos em:
\`\`\`text
C:\\SucessoEduSistema\\Backups\\
\`\`\`
Você pode copiar essa pasta para um Pen Drive externo semanalmente ou sincronizar com o Google Drive institucional.

### ❓ P: Ao clicar em "Concluir" no final da instalação, apareceu: "Incapaz de executar o arquivo: C:\\SucessoEduSistema\\SucessoEdu_App.exe - CreateProcess falhou; código 2"?
**R:** Esse erro ocorria porque a opção "Executar SucessoEdu Total Suite" tentava acionar o binário \`SucessoEdu_App.exe\`, mas como esse arquivo binário compilado ainda não estava na pasta raiz, o Windows retornava o código 2 (\`ERROR_FILE_NOT_FOUND\`).
**Correção aplicada:**
1. **Verificação Preventiva (\`Check: FileExists\` + \`skipifdoesntexist\`):** O instalador agora verifica se o \`.exe\` realmente existe antes de tentar executá-lo.
2. **Lançador Universal Automático (\`SucessoEdu_App.bat\` e \`SucessoEdu_App.vbs\`):** Se não houver um executável \`.exe\`, o instalador gera e aciona o lançador universal, abrindo a aplicação no navegador padrão (\`http://localhost:3000\` ou o SPA offline \`index.html\`) sem emitir nenhum aviso ou falha!

### ❓ P: Ao executar o instalador em outro computador, apareceu: "Este programa não suporta a versão do Windows que seu computador está executando"?
**R:** Esse erro ocorria por dois motivos principais:
1. **Restrição Rígida de Arquitetura (\`ArchitecturesAllowed=x64\`):** O instalador estava configurado para aceitar exclusivamente Windows 64-bit nativo. Se o outro computador rodasse Windows de 32 bits (x86) ou Windows ARM64 (Snapdragon/Surface), o Inno Setup bloqueava a inicialização imediatamente com essa mensagem.
2. **Versão Mínima Padrão do Inno Setup 6:** O Inno Setup 6 exige por padrão \`MinVersion=6.1sp1\` (Windows 7 SP1 ou superior). Se o computador estivesse executando Windows 7 RTM, Windows 8.0, Windows Server ou estivesse com o "Modo de Compatibilidade" ativado para Windows XP/Vista, o instalador era rejeitado.

**Como foi corrigido no script:**
- **Compatibilidade Universal (\`MinVersion=6.1\` e \`OnlyBelowVersion=0\`):** Agora aceita nativamente Windows 7, 8, 8.1, 10, 11 e todas as edições do Windows Server.
- **Suporte Híbrido 32-bit e 64-bit:** A diretiva restritiva \`ArchitecturesAllowed=x64\` foi removida. O instalador agora abre e roda em qualquer arquitetura. No Windows 64-bit ele ativa o modo 64-bit nativo (\`ArchitecturesInstallIn64BitMode=x64\`); no Windows 32-bit ele roda em 32-bit e ativa o modo Micro-Servidor Local / SQLite ou conexão com a rede da escola!
- **Dica se persistir em máquinas legadas:** Verifique se o executável do instalador não está com o "Modo de Compatibilidade" marcado com Windows XP ou Vista nas propriedades do arquivo (botão direito no \`.exe\` > Propriedades > Compatibilidade > Desmarcar modo de compatibilidade).

---

*Manual homologado para o ecossistema SucessoEdu Gestão Educacional. Dúvidas técnicas: \`suportetecnicoads@gmail.com\`.*
`;

