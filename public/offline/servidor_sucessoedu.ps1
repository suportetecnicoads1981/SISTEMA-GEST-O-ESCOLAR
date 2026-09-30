# =============================================================================
#  SucessoEdu - Servidor da rede local (Servidor Remoto da escola / Servidor da Sede)
#
#  - Entrega o sistema (pasta app) para as estacoes da rede: http://IP-DESTE-PC:8088
#  - Guarda o banco UNICO da escola em data\banco_sucessoedu.json
#  - Cada gravacao usa numero de versao: duas estacoes gravando ao mesmo tempo nao
#    apagam o trabalho uma da outra (o sistema reaplica as mudancas e grava de novo).
#  - Copias de seguranca automaticas em data\historico (ultimas 60).
#  - So atende computadores da rede local (IPs privados).
#  - Confere o usuario e as permissoes de cada gravacao (sessao aberta no login).
#
#  Funciona no Windows PowerShell 5.1 (ja vem no Windows 10/11). Nao precisa de internet.
# =============================================================================

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppDir = Join-Path $Root 'app'
$DataDir = Join-Path $Root 'data'
# Scripts que este servidor entrega em /offline/ (para gerar pacotes de Sede, Remoto e Estacao).
$OfflineScripts = @('servidor_sucessoedu.ps1','atualizador_sucessoedu.ps1','instalar_servidor.ps1','criar_atalho.ps1','INSTALAR_SERVIDOR.bat','PARAR_SERVIDOR.bat','INICIAR_SERVIDOR.bat','instalar_estacao.ps1','INSTALAR_ESTACAO.bat')
$HistDir = Join-Path $DataDir 'historico'
$DbFile = Join-Path $DataDir 'banco_sucessoedu.json'
$MetaFile = Join-Path $DataDir 'banco_sucessoedu.versao'
$LogFile = Join-Path $DataDir 'servidor.log'
$ConfigFile = Join-Path $Root 'config.json'
$Utf8 = New-Object System.Text.UTF8Encoding($false)

foreach ($d in @($DataDir, $HistDir)) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null } }

# ---------------------------------------------------------------- configuracao
$Role = 'REMOTO'
$ServerName = 'Servidor Remoto SucessoEdu'
$Port = 8088
$AccessKey = ''
$SchoolUnitId = ''
$SchoolInep = ''
$SchoolName = ''
if (Test-Path $ConfigFile) {
    try {
        $cfg = Get-Content -Raw -Encoding UTF8 $ConfigFile | ConvertFrom-Json
        if ($cfg.role -eq 'SEDE') { $Role = 'SEDE' }
        if ($cfg.serverName) { $ServerName = [string]$cfg.serverName }
        if ($cfg.port) { $Port = [int]$cfg.port }
        if ($cfg.accessKey) { $AccessKey = ([string]$cfg.accessKey).Trim().ToUpper() }
        if ($cfg.schoolUnitId) { $SchoolUnitId = [string]$cfg.schoolUnitId }
        if ($cfg.schoolInep) { $SchoolInep = [string]$cfg.schoolInep }
        if ($cfg.schoolName) { $SchoolName = [string]$cfg.schoolName }
    } catch { }
}
if ($env:SUCESSOEDU_PORT) { $Port = [int]$env:SUCESSOEDU_PORT }

function Write-Log([string]$msg) {
    $line = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '  ' + $msg
    try {
        if ((Test-Path $LogFile) -and ((Get-Item $LogFile).Length -gt 5MB)) {
            Move-Item -Force $LogFile ($LogFile + '.anterior')
        }
        [System.IO.File]::AppendAllText($LogFile, $line + [Environment]::NewLine, $Utf8)
    } catch { }
    Write-Host $line
}

# ---------------------------------------------------------------- banco
$script:Version = 0
$script:UpdatedAt = ''
$script:DataText = $null

if (Test-Path $MetaFile) {
    try {
        $parts = ([System.IO.File]::ReadAllText($MetaFile, $Utf8)).Trim().Split('|')
        $script:Version = [int64]$parts[0]
        if ($parts.Length -gt 1) { $script:UpdatedAt = $parts[1] }
    } catch { $script:Version = 0 }
}
# Recupera gravacao interrompida (queda de energia no meio da gravacao).
if (-not (Test-Path $DbFile) -and (Test-Path ($DbFile + '.tmp'))) { Move-Item -Force ($DbFile + '.tmp') $DbFile }
if (Test-Path $DbFile) {
    $script:DataText = [System.IO.File]::ReadAllText($DbFile, $Utf8)
    if ([string]::IsNullOrWhiteSpace($script:DataText)) { $script:DataText = $null }
}
# A cada inicio a versao avanca: se o computador desligou no meio de uma gravacao,
# as estacoes releem o banco em vez de confiar numa versao antiga.
if ($script:DataText) {
    $script:Version = $script:Version + 1
    $script:UpdatedAt = (Get-Date).ToUniversalTime().ToString('o')
    [System.IO.File]::WriteAllText($MetaFile, ([string]$script:Version) + '|' + $script:UpdatedAt, $Utf8)
}

function Save-Database([string]$text, [bool]$keepObject = $false) {
    # Copia de seguranca da versao anterior (no maximo uma a cada 30 minutos).
    if (Test-Path $DbFile) {
        $last = Get-ChildItem -Path $HistDir -Filter 'banco_*.json' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if (-not $last -or ((Get-Date) - $last.LastWriteTime).TotalMinutes -ge 30) {
            Copy-Item -Force $DbFile (Join-Path $HistDir ('banco_' + (Get-Date -Format 'yyyyMMdd_HHmmss') + '.json'))
            Get-ChildItem -Path $HistDir -Filter 'banco_*.json' | Sort-Object LastWriteTime -Descending | Select-Object -Skip 60 | Remove-Item -Force -ErrorAction SilentlyContinue
        }
    }
    # Gravacao segura: escreve em arquivo temporario e so depois substitui o banco.
    $tmp = $DbFile + '.tmp'
    [System.IO.File]::WriteAllText($tmp, $text, $Utf8)
    if (Test-Path $DbFile) { [System.IO.File]::Replace($tmp, $DbFile, [NullString]::Value) } else { Move-Item -Force $tmp $DbFile }
    $script:Version = $script:Version + 1
    $script:UpdatedAt = (Get-Date).ToUniversalTime().ToString('o')
    [System.IO.File]::WriteAllText($MetaFile, ([string]$script:Version) + '|' + $script:UpdatedAt, $Utf8)
    $script:DataText = $text
    # Gravacao do banco inteiro: a copia em memoria e relida na proxima conferencia.
    if (-not $keepObject) { $script:DbObj = $null }
}

# ---------------------------------------------------------------- http
function Test-LocalNetwork($address) {
    if ($null -eq $address) { return $false }
    if ([System.Net.IPAddress]::IsLoopback($address)) { return $true }
    if ($address.IsIPv4MappedToIPv6) { $address = $address.MapToIPv4() }
    $b = $address.GetAddressBytes()
    if ($b.Length -eq 4) {
        if ($b[0] -eq 10) { return $true }
        if ($b[0] -eq 172 -and $b[1] -ge 16 -and $b[1] -le 31) { return $true }
        if ($b[0] -eq 192 -and $b[1] -eq 168) { return $true }
        if ($b[0] -eq 169 -and $b[1] -eq 254) { return $true }
        if ($b[0] -eq 100 -and $b[1] -ge 64 -and $b[1] -le 127) { return $true }
        return $false
    }
    if ($address.IsIPv6LinkLocal -or $address.IsIPv6SiteLocal) { return $true }
    if (($b[0] -band 0xFE) -eq 0xFC) { return $true }
    return $false
}

function Send-Text($ctx, [int]$status, [string]$text, [string]$type) {
    $res = $ctx.Response
    try {
        $bytes = $Utf8.GetBytes($text)
        $res.StatusCode = $status
        $res.ContentType = $type
        $res.Headers['Cache-Control'] = 'no-store'
        $res.Headers['X-Content-Type-Options'] = 'nosniff'
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch { } finally { try { $res.OutputStream.Close() } catch { } }
}

function Send-Json($ctx, [int]$status, [string]$json) { Send-Text $ctx $status $json 'application/json; charset=utf-8' }

function ConvertTo-JsonString([string]$s) {
    return '"' + ($s -replace '\\', '\\' -replace '"', '\"') + '"'
}

$MimeTypes = @{
    '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.mjs' = 'text/javascript; charset=utf-8'
    '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json; charset=utf-8'; '.svg' = 'image/svg+xml'
    '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.gif' = 'image/gif'; '.webp' = 'image/webp'
    '.ico' = 'image/x-icon'; '.woff' = 'font/woff'; '.woff2' = 'font/woff2'; '.ttf' = 'font/ttf'; '.txt' = 'text/plain; charset=utf-8'
    '.map' = 'application/json'; '.webmanifest' = 'application/manifest+json'; '.wasm' = 'application/wasm'
}

function Send-StaticFile($ctx, [string]$urlPath) {
    $rel = [System.Uri]::UnescapeDataString($urlPath.TrimStart('/')).Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    if ($rel -eq '') { $rel = 'index.html' }
    # Gerar pacotes a partir deste servidor: a lista de arquivos e os scripts nao ficam em app\.
    # offline-manifest.json -> app\versao_app.json; offline\<script> -> script da pasta do servidor.
    if ($rel -eq 'offline-manifest.json' -and -not (Test-Path -LiteralPath (Join-Path $AppDir $rel) -PathType Leaf)) {
        $ver = Join-Path $AppDir 'versao_app.json'
        if (Test-Path -LiteralPath $ver -PathType Leaf) { $rel = 'versao_app.json' }
    }
    $scriptName = ''
    if ($rel.StartsWith('offline' + [System.IO.Path]::DirectorySeparatorChar)) { $scriptName = $rel.Substring(8) }
    if ($scriptName -ne '' -and $OfflineScripts -contains $scriptName -and -not (Test-Path -LiteralPath (Join-Path $AppDir $rel) -PathType Leaf)) {
        $scriptFull = Join-Path $Root $scriptName
        if (Test-Path -LiteralPath $scriptFull -PathType Leaf) {
            $res = $ctx.Response
            try {
                $bytes = [System.IO.File]::ReadAllBytes($scriptFull)
                $res.StatusCode = 200
                $res.ContentType = 'text/plain; charset=utf-8'
                $res.Headers['Cache-Control'] = 'no-cache'
                $res.ContentLength64 = $bytes.Length
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch { } finally { try { $res.OutputStream.Close() } catch { } }
            return
        }
    }
    $appFull = [System.IO.Path]::GetFullPath($AppDir)
    $full = [System.IO.Path]::GetFullPath((Join-Path $AppDir $rel))
    if (-not $full.StartsWith($appFull, [System.StringComparison]::OrdinalIgnoreCase)) { Send-Text $ctx 403 'Acesso negado' 'text/plain; charset=utf-8'; return }
    if (-not (Test-Path -LiteralPath $full -PathType Leaf)) {
        if ([System.IO.Path]::GetExtension($rel) -ne '') { Send-Text $ctx 404 'Arquivo nao encontrado' 'text/plain; charset=utf-8'; return }
        $full = Join-Path $AppDir 'index.html'   # rotas internas do sistema
    }
    if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { Send-Text $ctx 500 'Sistema nao instalado: pasta app vazia.' 'text/plain; charset=utf-8'; return }
    $ext = [System.IO.Path]::GetExtension($full).ToLower()
    $type = $MimeTypes[$ext]; if (-not $type) { $type = 'application/octet-stream' }
    $res = $ctx.Response
    try {
        $bytes = [System.IO.File]::ReadAllBytes($full)
        $res.StatusCode = 200
        $res.ContentType = $type
        if ($full -like '*\assets\*' -or $full -like '*/assets/*') { $res.Headers['Cache-Control'] = 'public, max-age=31536000, immutable' }
        else { $res.Headers['Cache-Control'] = 'no-cache' }
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch { } finally { try { $res.OutputStream.Close() } catch { } }
}

function Read-Body($ctx) {
    $reader = New-Object System.IO.StreamReader($ctx.Request.InputStream, $Utf8)
    try { return $reader.ReadToEnd() } finally { $reader.Close() }
}

function Get-StoreJson {
    $data = 'null'
    if ($script:DataText) { $data = $script:DataText }
    return '{"version":' + $script:Version + ',"updatedAt":' + (ConvertTo-JsonString $script:UpdatedAt) + ',"data":' + $data + '}'
}

# ---------------------------------------------------------------- privilegios dos usuarios
# O servidor confere QUEM esta gravando e O QUE essa pessoa pode fazer, antes de gravar.
#  - Cada usuario abre uma sessao no login (/api/local/login): o servidor confere a senha
#    no banco dele e devolve um codigo de sessao assinado (vale 12 horas).
#  - Cada gravacao (/api/local/ops) chega como lista de operacoes (incluir, alterar, excluir).
#    O servidor compara com o banco e recusa o que o usuario nao tem permissao de fazer,
#    mesmo que o pedido venha de fora do sistema.
#  - Usuarios, senhas, setores, permissoes e dados do desenvolvedor: so o Master altera.
#  - Tudo fica registrado no servidor.log (quem gravou, de qual estacao, o que foi recusado).
#  As regras abaixo sao as mesmas do sistema (src/services/rbac/accessControl.ts).
$SessionSecretFile = Join-Path $DataDir 'sessoes.chave'
$SessionHours = 12
$script:JsonSer = $null
try {
    Add-Type -AssemblyName System.Web.Extensions -ErrorAction Stop
    $script:JsonSer = New-Object System.Web.Script.Serialization.JavaScriptSerializer
    $script:JsonSer.MaxJsonLength = [int]::MaxValue
    $script:JsonSer.RecursionLimit = 1000
} catch { $script:JsonSer = $null }

# Mesmo formato do JavaScriptSerializer (Dictionary[string,object] e object[]); usado nos testes
# automaticos, que rodam fora do Windows.
function ConvertTo-GenericShape($v) {
    if ($v -is [System.Collections.IDictionary]) {
        $d = New-Object 'System.Collections.Generic.Dictionary[string,object]'
        foreach ($k in @($v.Keys)) { $d[[string]$k] = ConvertTo-GenericShape $v[$k] }
        return ,$d
    }
    if ($null -ne $v -and -not ($v -is [string]) -and ($v -is [System.Collections.IEnumerable])) {
        $out = New-Object 'object[]' (@($v).Count)
        $i = 0
        foreach ($item in $v) { $out[$i] = ConvertTo-GenericShape $item; $i++ }
        return ,$out
    }
    return $v
}
function ConvertFrom-JsonText([string]$text) {
    if ($script:JsonSer) { return ,($script:JsonSer.DeserializeObject($text)) }
    $parsed = ConvertFrom-Json -InputObject $text -AsHashtable -Depth 200
    if ($env:SUCESSOEDU_TEST_GENERIC -eq '1') { return ,(ConvertTo-GenericShape $parsed) }
    return ,$parsed
}
# Copia sem os "embrulhos" do PowerShell (PSObject). Valores que passam pelo retorno de uma
# funcao podem ficar embrulhados; o JavaScriptSerializer nao sabe gravar esse embrulho e falha
# com "referencia circular ... PSParameterizedProperty". Aqui cada valor volta ao objeto original.
function ConvertTo-PlainValue($v) {
    if ($null -eq $v) { return $null }
    $b = $v.psobject.BaseObject
    if ($b -is [System.Collections.IDictionary]) {
        $d = New-Object 'System.Collections.Generic.Dictionary[string,object]'
        foreach ($k in @($b.Keys)) {
            $c = ConvertTo-PlainValue $b[$k]
            if ($null -ne $c) { $c = $c.psobject.BaseObject }
            $d[[string]$k] = $c
        }
        return ,$d
    }
    if (-not ($b -is [string]) -and ($b -is [System.Collections.IEnumerable])) {
        $l = New-Object System.Collections.ArrayList
        foreach ($item in $b) {
            $c = ConvertTo-PlainValue $item
            if ($null -ne $c) { $c = $c.psobject.BaseObject }
            [void]$l.Add($c)
        }
        return ,$l
    }
    return $b
}
function ConvertTo-JsonText($value) {
    if ($script:JsonSer) {
        try { return $script:JsonSer.Serialize($value) }
        catch {
            # Algum valor ficou embrulhado: grava a copia limpa (nada se perde).
            $plain = ConvertTo-PlainValue $value
            if ($null -ne $plain) { $plain = $plain.psobject.BaseObject }
            return $script:JsonSer.Serialize($plain)
        }
    }
    return (ConvertTo-Json -InputObject $value -Depth 100 -Compress)
}

$AccessRulesJson = @'
{"students":{"keys":["secretaria"],"label":"alunos"},"academicHistories":{"keys":["secretaria","documentos"],"label":"hist\u00f3ricos escolares"},"classes":{"keys":["turmas"],"label":"turmas"},"subjects":{"keys":["turmas"],"label":"disciplinas"},"courses":{"keys":["turmas"],"label":"cursos"},"schoolUnits":{"keys":["gestaoMunicipal"],"label":"escolas","ignore":["totalStudents","totalClasses","totalTeachers","syncStatus","lastSync"]},"municipalSecretary":{"keys":["gestaoMunicipal"],"label":"cadastro da SEMED"},"questions":{"keys":["questoes"],"label":"quest\u00f5es"},"bnccSkills":{"keys":["questoes"],"label":"habilidades BNCC"},"exams":{"keys":["provas"],"label":"provas"},"submissions":{"keys":["provas"],"label":"respostas de provas","createNeedsRead":true},"bnccAssessments":{"keys":["relatorios","portalProfessor","diarioClasse"],"label":"lan\u00e7amentos de habilidades BNCC"},"attendanceSheets":{"keys":["diarioClasse","portalProfessor"],"label":"frequ\u00eancia"},"lessonRegistries":{"keys":["diarioClasse","portalProfessor"],"label":"registros de aula"},"classGradeSheets":{"keys":["diarioClasse","portalProfessor"],"label":"notas"},"teacherLessonPlans":{"keys":["portalProfessor","diarioClasse"],"label":"planos de aula"},"teacherStudentNotes":{"keys":["portalProfessor","diarioClasse"],"label":"anota\u00e7\u00f5es do professor"},"communications":{"keys":["comunicacao"],"label":"comunicados","ignore":["readBy","reads","readCount","readReceipts","confirmedBy","views","viewCount","acknowledgedBy"]},"whatsappTemplates":{"keys":["comunicacao"],"label":"modelos de WhatsApp"},"whatsappConfig":{"keys":["comunicacao"],"label":"configura\u00e7\u00e3o do WhatsApp"},"dropoutAlertConfig":{"keys":["secretaria"],"label":"crit\u00e9rio do alerta de evas\u00e3o"},"settings":{"keys":["configuracoes"],"label":"configura\u00e7\u00f5es do sistema","ignore":["systemVersion","logoUrl","managementLogoUrl","lastBackupAt","lastBackupDate","lastSync","lastSyncAt","lastUpdateCheck"]},"userAccounts":{"keys":"MASTER","label":"usu\u00e1rios e permiss\u00f5es","ignore":["password","lastLogin","lastLoginAt","lastAccess","lastActivity","lastSeen","loginAttempts","mustChangePassword"]},"developerContact":{"keys":"MASTER","label":"dados do desenvolvedor"}}
'@
$SectorDefaultsJson = @'
{"MASTER":{"dashboard":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":true,"canApprove":true},"portalProfessor":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":true,"canApprove":true},"diarioClasse":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":true,"canApprove":true},"secretaria":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":true,"canApprove":true},"turmas":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":true,"canApprove":true},"documentos":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":true,"canApprove":true},"comunicacao":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":true,"canApprove":true},"questoes":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":true,"canApprove":true},"provas":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":true,"canApprove":true},"relatorios":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":true,"canApprove":true},"gestaoMunicipal":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":true,"canApprove":true},"usuarios":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":true,"canApprove":true},"configuracoes":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":true,"canApprove":true}},"DIRETORIA":{"dashboard":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"portalProfessor":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"diarioClasse":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"secretaria":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"turmas":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"documentos":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"comunicacao":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"questoes":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"provas":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"relatorios":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"gestaoMunicipal":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"usuarios":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"configuracoes":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true}},"COORDENACAO":{"dashboard":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"portalProfessor":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"diarioClasse":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"secretaria":{"canRead":true,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"turmas":{"canRead":true,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"documentos":{"canRead":true,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"comunicacao":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"questoes":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"provas":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"relatorios":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"gestaoMunicipal":{"canRead":true,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"usuarios":{"canRead":true,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"configuracoes":{"canRead":true,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false}},"SECRETARIA":{"dashboard":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"portalProfessor":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"diarioClasse":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"secretaria":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"turmas":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"documentos":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"comunicacao":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"questoes":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"provas":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"relatorios":{"canRead":true,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"gestaoMunicipal":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"usuarios":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"configuracoes":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false}},"PROFESSOR":{"dashboard":{"canRead":true,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"portalProfessor":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":false},"diarioClasse":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":false},"secretaria":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"turmas":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"documentos":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"comunicacao":{"canRead":true,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"questoes":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":false},"provas":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":false},"relatorios":{"canRead":true,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"gestaoMunicipal":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"usuarios":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"configuracoes":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false}},"GESTOR_MUNICIPAL":{"dashboard":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"portalProfessor":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"diarioClasse":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"secretaria":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"turmas":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"documentos":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"comunicacao":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"questoes":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"provas":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"relatorios":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"gestaoMunicipal":{"canRead":true,"canCreate":true,"canEdit":true,"canDelete":false,"canApprove":true},"usuarios":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"configuracoes":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false}},"ALUNO":{"dashboard":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"portalProfessor":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"diarioClasse":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"secretaria":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"turmas":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"documentos":{"canRead":true,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"comunicacao":{"canRead":true,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"questoes":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"provas":{"canRead":true,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"relatorios":{"canRead":true,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"gestaoMunicipal":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"usuarios":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"configuracoes":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false}},"RESPONSAVEL":{"dashboard":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"portalProfessor":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"diarioClasse":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"secretaria":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"turmas":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"documentos":{"canRead":true,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"comunicacao":{"canRead":true,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"questoes":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"provas":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"relatorios":{"canRead":true,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"gestaoMunicipal":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"usuarios":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false},"configuracoes":{"canRead":false,"canCreate":false,"canEdit":false,"canDelete":false,"canApprove":false}}}
'@
$script:AccessRules = ConvertFrom-JsonText $AccessRulesJson
$script:SectorDefaults = ConvertFrom-JsonText $SectorDefaultsJson
$SyncFields = @('updatedAt', 'rowVersion', 'serverUpdatedAt', 'baseVersion', 'syncedAt', 'lastSyncAt')

function Test-IsMap($v) { return ($v -is [System.Collections.IDictionary]) }
function Test-IsList($v) { return ($null -ne $v -and -not ($v -is [string]) -and -not (Test-IsMap $v) -and ($v -is [System.Collections.IEnumerable])) }
function Get-Val($map, [string]$name) {
    # A virgula preserva listas de um item so (o PowerShell desmontaria a lista no retorno).
    if ((Test-IsMap $map) -and ([System.Collections.IDictionary]$map).Contains($name)) { return ,$map[$name] }
    return $null
}

# Forma canonica (chaves em ordem, sem campos ignorados) para comparar dois registros.
function Get-Sorted($value, $ignore) {
    if (Test-IsMap $value) {
        $out = New-Object 'System.Collections.Generic.SortedDictionary[string,object]' ([System.StringComparer]::Ordinal)
        foreach ($k in @($value.Keys)) {
            $key = [string]$k
            if ($ignore -and ($ignore -contains $key)) { continue }
            if ($key.StartsWith('_')) { continue }
            $c = Get-Sorted $value[$k] $null
            if ($null -ne $c) { $c = $c.psobject.BaseObject }
            $out[$key] = $c
        }
        return ,$out
    }
    if (Test-IsList $value) {
        $arr = New-Object System.Collections.ArrayList
        foreach ($item in $value) {
            $c = Get-Sorted $item $null
            if ($null -ne $c) { $c = $c.psobject.BaseObject }
            [void]$arr.Add($c)
        }
        return ,$arr
    }
    return $value
}
function Get-Canon($value, $ignore) { return (ConvertTo-JsonText (Get-Sorted $value $ignore)) }
function Test-SameRecord($a, $b, $ignore) { return ((Get-Canon $a $ignore) -ceq (Get-Canon $b $ignore)) }

function Get-RecordId($item, [int]$index) {
    $id = Get-Val $item 'id'
    if ($null -ne $id) { return [string]$id }
    return ('#' + $index)
}
function Find-Record($list, [string]$id) {
    if (-not (Test-IsList $list)) { return $null }
    $i = 0
    foreach ($item in $list) {
        if ((Get-RecordId $item $i) -eq $id) { return ,$item }
        $i++
    }
    return $null
}

# Quantas inclusoes, alteracoes e exclusoes existem entre dois valores de uma chave.
function Get-Diff($before, $after, $ignore) {
    $d = @{ created = 0; edited = 0; deleted = 0 }
    if (((Test-IsList $before) -or (Test-IsList $after)) -and -not (Test-IsMap $before) -and -not (Test-IsMap $after)) {
        $old = @{}
        $i = 0
        if ($before) { foreach ($r in $before) { $old[(Get-RecordId $r $i)] = $r; $i++ } }
        $seen = @{}
        $i = 0
        if ($after) {
            foreach ($r in $after) {
                $id = Get-RecordId $r $i
                $seen[$id] = $true
                if (-not $old.ContainsKey($id)) { $d.created++ }
                elseif (-not (Test-SameRecord $old[$id] $r $ignore)) { $d.edited++ }
                $i++
            }
        }
        foreach ($id in @($old.Keys)) { if (-not $seen.ContainsKey($id)) { $d.deleted++ } }
        return $d
    }
    if ($null -eq $before -and $null -ne $after) { $d.created = 1 }
    elseif ($null -ne $before -and $null -eq $after) { $d.deleted = 1 }
    elseif (-not (Test-SameRecord $before $after $ignore)) { $d.edited = 1 }
    return $d
}

function Test-IsMasterUser($user) {
    if (-not $user) { return $false }
    if ((Get-Val $user 'isMaster') -eq $true) { return $true }
    return ([string](Get-Val $user 'sector') -eq 'MASTER')
}

function Test-UserCan($user, [string]$moduleKey, [string]$action) {
    if (-not $user) { return $false }
    if (Test-IsMasterUser $user) { return $true }
    if ((Get-Val $user 'active') -eq $false) { return $false }
    $matrix = Get-Val $user 'permissions'
    if (-not (Test-IsMap $matrix) -or $matrix.Count -eq 0) { $matrix = Get-Val $script:SectorDefaults ([string](Get-Val $user 'sector')) }
    $perm = Get-Val $matrix $moduleKey
    return ((Get-Val $perm $action) -eq $true)
}

$ActionLabel = @{ canCreate = 'incluir'; canEdit = 'alterar'; canDelete = 'excluir'; canRead = 'abrir' }

# Escola de lotacao (mesmas regras de src/services/rbac/schoolScope.ts): quem tem escola no
# cadastro de usuarios so grava registros da propria escola. Master e "Rede" gravam em todas.
$SchoolScopedJson = @'
["schoolUnits","students","classes","attendanceSheets","lessonRegistries","classGradeSheets","academicHistories","exams","submissions","bnccAssessments","teacherLessonPlans","teacherStudentNotes"]
'@
$script:SchoolScoped = ConvertFrom-JsonText $SchoolScopedJson
$script:NetworkWideAllowed = @('exams')

function Get-UserSchoolScope($user) {
    if (-not $user) { return '' }
    if (Test-IsMasterUser $user) { return '' }
    $id = Get-Val $user 'schoolUnitId'
    if ($null -eq $id) { return '' }
    return ([string]$id).Trim()
}
function Get-TextVal($map, [string]$name) {
    $v = Get-Val $map $name
    if ($null -eq $v) { return '' }
    return ([string]$v).Trim()
}
# Escola do registro ('' quando nao esta ligado a nenhuma escola).
function Get-RecordSchool([string]$k, $rec, $work, $db) {
    if (-not (Test-IsMap $rec)) { return '' }
    if ($k -eq 'schoolUnits') { return (Get-TextVal $rec 'id') }
    $own = Get-TextVal $rec 'schoolUnitId'
    if ($own) { return $own }
    if ($k -eq 'classes') { return '' }
    $classId = Get-TextVal $rec 'classId'
    if ($classId) {
        $cls = Find-WorkRecord $work $db 'classes' $classId
        $cs = Get-TextVal $cls 'schoolUnitId'
        if ($cs) { return $cs }
    }
    if ($k -eq 'students') { return '' }
    $studentId = Get-TextVal $rec 'studentId'
    if ($studentId) {
        $st = Find-WorkRecord $work $db 'students' $studentId
        if ($st) { return (Get-RecordSchool 'students' $st $work $db) }
    }
    return ''
}
function Test-InSchool([string]$k, $rec, [string]$scope, $work, $db) {
    $school = Get-RecordSchool $k $rec $work $db
    if ($school) { return ($school -eq $scope) }
    return ($script:NetworkWideAllowed -contains $k)
}
function Test-SchoolScopeOp($user, $op, $db, $work, [string]$label) {
    $scope = Get-UserSchoolScope $user
    if (-not $scope) { return '' }
    $k = [string](Get-Val $op 'k')
    if (-not ($script:SchoolScoped -contains $k)) { return '' }
    $t = [string](Get-Val $op 't')
    $msg = 'Usuario lotado em uma escola: ' + $label + ' de outra escola nao podem ser gravados (transferencias sao feitas pela Sede).'
    if ($t -eq 's') { return $msg }
    $old = Find-WorkRecord $work $db $k ([string](Get-Val $op 'id'))
    if ($null -ne $old -and -not (Test-InSchool $k $old $scope $work $db)) { return $msg }
    if ($t -eq 'u' -and -not (Test-InSchool $k (Get-Val $op 'v') $scope $work $db)) { return $msg }
    return ''
}

# Confere uma operacao. Devolve '' se pode gravar, ou o motivo da recusa.
function Test-OpAllowed($user, $op, $db, [bool]$fromServerPc, $work) {
    $k = [string](Get-Val $op 'k')
    $rule = Get-Val $script:AccessRules $k
    if (-not $rule) { return '' }
    $keys = Get-Val $rule 'keys'
    $masterOnly = ($keys -is [string] -and $keys -eq 'MASTER')
    $label = [string](Get-Val $rule 'label')
    $ignore = @($SyncFields)
    $ign = Get-Val $rule 'ignore'
    if ($ign) { foreach ($x in $ign) { $ignore += [string]$x } }

    # Dados recebidos da nuvem pelo motor de sincronizacao (ja conferidos la).
    if ((Get-Val $op 'o') -eq 'n') {
        if (-not $masterOnly) { return '' }
        if ($fromServerPc -or (Test-IsMasterUser $user)) { return '' }
        return ('Cadastro de ' + $label + ' vindo da nuvem: aceito so no computador do servidor ou com a conta Master.')
    }
    if (Test-IsMasterUser $user) { return '' }
    if ((Get-Val $user 'active') -eq $false) { return 'Usuario inativo.' }

    $t = [string](Get-Val $op 't')
    # Senha e dados de login: cada um so mexe nos proprios (nunca na conta de outra pessoa).
    if ($k -eq 'userAccounts' -and [string](Get-Val $op 'id') -ne [string](Get-Val $user 'id')) { $ignore = @($SyncFields) }
    $current = Get-Val $db $k
    $d = @{ created = 0; edited = 0; deleted = 0 }
    if ($t -eq 'u') {
        $old = Find-WorkRecord $work $db $k ([string](Get-Val $op 'id'))
        if ($null -eq $old) { $d.created = 1 }
        elseif (-not (Test-SameRecord $old (Get-Val $op 'v') $ignore)) { $d.edited = 1 }
    } elseif ($t -eq 'd') {
        if ($null -ne (Find-WorkRecord $work $db $k ([string](Get-Val $op 'id')))) { $d.deleted = 1 }
    } elseif ($t -eq 's') {
        $d = Get-Diff (Get-WorkValue $work $db $k) (Get-Val $op 'v') $ignore
    } else {
        return 'Operacao desconhecida.'
    }

    foreach ($action in @('canCreate', 'canEdit', 'canDelete')) {
        $count = 0
        if ($action -eq 'canCreate') { $count = $d.created }
        if ($action -eq 'canEdit') { $count = $d.edited }
        if ($action -eq 'canDelete') { $count = $d.deleted }
        if ($count -le 0) { continue }
        if ($masterOnly) { return ('Somente o Administrador Master pode ' + $ActionLabel[$action] + ' ' + $label + '.') }
        $ok = $false
        foreach ($mk in $keys) {
            $need = $action
            if ($action -eq 'canCreate' -and (Get-Val $rule 'createNeedsRead') -eq $true) { $need = 'canRead' }
            if (Test-UserCan $user ([string]$mk) $need) { $ok = $true; break }
        }
        if (-not $ok) { return ('Sem permissao para ' + $ActionLabel[$action] + ' ' + $label + '.') }
    }
    return (Test-SchoolScopeOp $user $op $db $work $label)
}

# Listas em trabalho durante uma gravacao: indice por id (rapido mesmo com milhares de alunos).
$script:Removed = New-Object object
function Get-Work($work, $db, [string]$k) {
    if ($work.ContainsKey($k)) { return $work[$k] }
    $list = New-Object System.Collections.ArrayList
    $idx = New-Object 'System.Collections.Generic.Dictionary[string,int]'
    $current = Get-Val $db $k
    if (Test-IsList $current) {
        $i = 0
        foreach ($item in $current) { [void]$list.Add($item); $idx[(Get-RecordId $item $i)] = $i; $i++ }
    }
    $w = @{ list = $list; idx = $idx; replaced = $false; value = $null; touched = $false }
    $work[$k] = $w
    return $w
}
function Find-WorkRecord($work, $db, [string]$k, [string]$id) {
    $w = Get-Work $work $db $k
    if ($w.replaced -and -not (Test-IsList $w.value)) { return $null }
    $pos = 0
    if ($w.idx.TryGetValue($id, [ref]$pos)) { return ,$w.list[$pos] }
    return $null
}
function Get-WorkValue($work, $db, [string]$k) {
    if ($work.ContainsKey($k)) {
        $w = $work[$k]
        if ($w.replaced) { return ,$w.value }
        if ($w.touched) {
            $alive = New-Object System.Collections.ArrayList
            foreach ($item in $w.list) { if (-not [object]::ReferenceEquals($item, $script:Removed)) { [void]$alive.Add($item) } }
            return ,$alive
        }
    }
    return ,(Get-Val $db $k)
}
# Aplica uma operacao ja conferida (mesma regra do sistema: storeOps.applyOps).
function Invoke-ApplyOp($work, $db, $op) {
    $k = [string](Get-Val $op 'k')
    $t = [string](Get-Val $op 't')
    if ($t -eq 's') {
        $v = Get-Val $op 'v'
        if ($null -ne $v) { $v = $v.psobject.BaseObject }
        $db[$k] = $v
        $work.Remove($k)
        return
    }
    $w = Get-Work $work $db $k
    $w.touched = $true
    $id = [string](Get-Val $op 'id')
    $pos = 0
    $has = $w.idx.TryGetValue($id, [ref]$pos)
    if ($t -eq 'u') {
        $val = Get-Val $op 'v'
        if ($null -ne $val) { $val = $val.psobject.BaseObject }
        if ($has) { $w.list[$pos] = $val }
        else { $w.idx[$id] = $w.list.Add($val) }
    } elseif ($t -eq 'd' -and $has) {
        $w.list[$pos] = $script:Removed
        [void]$w.idx.Remove($id)
    }
}
# Devolve as listas alteradas ao banco (sem os registros excluidos).
function Complete-Work($work, $db) {
    foreach ($k in @($work.Keys)) {
        $w = $work[$k]
        if (-not $w.touched) { continue }
        $out = New-Object System.Collections.ArrayList
        foreach ($item in $w.list) { if (-not [object]::ReferenceEquals($item, $script:Removed)) { [void]$out.Add($item) } }
        $db[$k] = $out
    }
}

# Banco em memoria (lido do arquivo uma vez; descartado a cada gravacao inteira).
$script:DbObj = $null
function Get-DbObject {
    if ($null -eq $script:DbObj) {
        if ($script:DataText) { $script:DbObj = ConvertFrom-JsonText $script:DataText }
        if (-not (Test-IsMap $script:DbObj)) {
            if ($script:JsonSer) { $script:DbObj = New-Object 'System.Collections.Generic.Dictionary[string,object]' }
            else { $script:DbObj = @{} }
        }
    }
    return ,$script:DbObj
}

function Find-User($db, [string]$userId, [string]$login) {
    $users = Get-Val $db 'userAccounts'
    if (-not (Test-IsList $users)) { return $null }
    if ($userId) { foreach ($u in $users) { if ([string](Get-Val $u 'id') -eq $userId) { return ,$u } } }
    $l = ([string]$login).Trim().ToLower()
    if ($l) {
        foreach ($u in $users) {
            if (([string](Get-Val $u 'login')).Trim().ToLower() -eq $l -or ([string](Get-Val $u 'email')).Trim().ToLower() -eq $l) { return ,$u }
        }
    }
    return $null
}

# ---- senhas (mesmo formato do sistema: sha256$iteracoes$sal$hash)
function Get-PasswordDigest([string]$password, [string]$salt, [int]$iterations) {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $digest = $sha.ComputeHash($Utf8.GetBytes($salt + ':' + $password))
        $saltBytes = $Utf8.GetBytes($salt)
        $buf = New-Object byte[] ($digest.Length + $saltBytes.Length)
        [Array]::Copy($saltBytes, 0, $buf, $digest.Length, $saltBytes.Length)
        for ($i = 1; $i -lt $iterations; $i++) {
            [Array]::Copy($digest, 0, $buf, 0, $digest.Length)
            $digest = $sha.ComputeHash($buf)
        }
        return ([BitConverter]::ToString($digest)).Replace('-', '').ToLower()
    } finally { $sha.Dispose() }
}
function Test-SameText([string]$a, [string]$b) {
    if ($a.Length -ne $b.Length) { return $false }
    $diff = 0
    for ($i = 0; $i -lt $a.Length; $i++) { $diff = $diff -bor ([int][char]$a[$i] -bxor [int][char]$b[$i]) }
    return ($diff -eq 0)
}
function Test-Password([string]$stored, [string]$typed) {
    if ([string]::IsNullOrEmpty($stored) -or $stored -eq ([string][char]0x2022 * 8)) { return $false }
    if ($stored.StartsWith('sha256$')) {
        $p = $stored.Split('$')
        if ($p.Length -ne 4) { return $false }
        $iter = 0
        if (-not [int]::TryParse($p[1], [ref]$iter) -or $iter -lt 1) { return $false }
        return (Test-SameText (Get-PasswordDigest $typed $p[2] $iter) $p[3])
    }
    return (Test-SameText $stored $typed)
}
function New-PasswordHash([string]$password) {
    $bytes = New-Object byte[] 16
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    $salt = ([BitConverter]::ToString($bytes)).Replace('-', '').ToLower()
    return ('sha256$5000$' + $salt + '$' + (Get-PasswordDigest $password $salt 5000))
}

# ---- sessoes assinadas (sobrevivem ao reinicio do servidor)
function Get-SessionSecret {
    if ($script:SessionSecret) { return ,$script:SessionSecret }
    $bytes = $null
    if (Test-Path $SessionSecretFile) { try { $bytes = [System.IO.File]::ReadAllBytes($SessionSecretFile) } catch { $bytes = $null } }
    if (-not $bytes -or $bytes.Length -lt 32) {
        $bytes = New-Object byte[] 32
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
        [System.IO.File]::WriteAllBytes($SessionSecretFile, $bytes)
    }
    $script:SessionSecret = $bytes
    return ,$bytes
}
function Get-Signature([string]$payload) {
    $h = New-Object System.Security.Cryptography.HMACSHA256 (,(Get-SessionSecret))
    try { return ([BitConverter]::ToString($h.ComputeHash($Utf8.GetBytes($payload)))).Replace('-', '').ToLower() } finally { $h.Dispose() }
}
function New-SessionToken([string]$userId) {
    $exp = [DateTimeOffset]::UtcNow.AddHours($SessionHours).ToUnixTimeMilliseconds()
    $payload = $userId + '|' + $exp
    $b64 = [Convert]::ToBase64String($Utf8.GetBytes($payload)).TrimEnd('=').Replace('+', '-').Replace('/', '_')
    return @{ token = ($b64 + '.' + (Get-Signature $payload)); expiresAt = $exp }
}
function Get-SessionUserId([string]$token) {
    if ([string]::IsNullOrWhiteSpace($token)) { return '' }
    $parts = $token.Trim().Split('.')
    if ($parts.Length -ne 2) { return '' }
    try {
        $b64 = $parts[0].Replace('-', '+').Replace('_', '/')
        while ($b64.Length % 4 -ne 0) { $b64 += '=' }
        $payload = $Utf8.GetString([Convert]::FromBase64String($b64))
    } catch { return '' }
    if (-not (Test-SameText (Get-Signature $payload) $parts[1])) { return '' }
    $idx = $payload.LastIndexOf('|')
    if ($idx -lt 1) { return '' }
    $exp = 0L
    if (-not [int64]::TryParse($payload.Substring($idx + 1), [ref]$exp)) { return '' }
    if ($exp -lt [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()) { return '' }
    return $payload.Substring(0, $idx)
}
function Get-SessionUser($ctx, $db) {
    $uid = Get-SessionUserId ([string]$ctx.Request.Headers['X-Sessao'])
    if (-not $uid) { return $null }
    $user = Find-User $db $uid ''
    if (-not $user -or (Get-Val $user 'active') -eq $false) { return $null }
    return ,$user
}

# ---- tentativas de senha (5 erros seguidos por estacao: espera 1 minuto)
$script:LoginFails = @{}
function Test-LoginBlocked([string]$ip) {
    $f = $script:LoginFails[$ip]
    return ($f -and $f.count -ge 5 -and ((Get-Date) - $f.at).TotalSeconds -lt 60)
}
function Register-LoginFail([string]$ip) {
    $f = $script:LoginFails[$ip]
    if (-not $f -or ((Get-Date) - $f.at).TotalSeconds -ge 60) { $f = @{ count = 0; at = (Get-Date) } }
    $f.count++
    $f.at = Get-Date
    $script:LoginFails[$ip] = $f
}

# Abre a sessao do usuario. Primeiro acesso (usuario sem senha no servidor): a senha digitada vira a senha dele.
function Invoke-Login($ctx) {
    $ip = [string]$ctx.Request.RemoteEndPoint.Address
    if (Test-LoginBlocked $ip) { return @{ status = 429; body = '{"error":"muitas-tentativas","message":"Muitas tentativas de senha. Aguarde 1 minuto e tente de novo."}' } }
    $in = $null
    try { $in = ConvertFrom-JsonText (Read-Body $ctx) } catch { $in = $null }
    $password = [string](Get-Val $in 'password')
    $db = Get-DbObject
    $user = Find-User $db ([string](Get-Val $in 'userId')) ([string](Get-Val $in 'login'))
    if (-not $user -or (Get-Val $user 'active') -eq $false -or [string]::IsNullOrEmpty($password)) {
        Register-LoginFail $ip
        return @{ status = 401; body = '{"error":"credenciais-invalidas","message":"O servidor da escola nao reconheceu este usuario (ou ele esta inativo)."}' }
    }
    $stored = [string](Get-Val $user 'password')
    if ([string]::IsNullOrEmpty($stored) -or $stored -eq ([string][char]0x2022 * 8)) {
        # Conta criada na nuvem: a senha e a do cadastro na nuvem. Pela rede, ninguem define a
        # senha dela; so no computador do servidor (depois do login conferido na nuvem).
        if ((Get-Val $user 'cloudSynced') -eq $true -and -not [System.Net.IPAddress]::IsLoopback($ctx.Request.RemoteEndPoint.Address)) {
            return @{ status = 401; body = '{"error":"conta-da-nuvem","message":"Esta conta ainda nao tem senha no servidor da escola. Entre uma vez no computador do servidor; depois ela funciona em todas as estacoes."}' }
        }
        if ($password.Length -lt 6) { return @{ status = 400; body = '{"error":"senha-curta","message":"A senha deve ter pelo menos 6 caracteres."}' } }
        $user['password'] = [string](New-PasswordHash $password)
        Save-Database (ConvertTo-JsonText $db) $true
        Write-Log ('Primeiro acesso: senha definida no servidor para ' + [string](Get-Val $user 'name'))
    } elseif (-not (Test-Password $stored $password)) {
        Register-LoginFail $ip
        Write-Log ('Senha incorreta para ' + [string](Get-Val $user 'name') + ' (' + $ip + ')')
        return @{ status = 401; body = '{"error":"senha-incorreta","message":"A senha nao confere com a cadastrada no servidor da escola. Suas alteracoes ficam guardadas nesta estacao ate voce entrar com a senha correta."}' }
    }
    $script:LoginFails.Remove($ip)
    $s = New-SessionToken ([string](Get-Val $user 'id'))
    Write-Log ('Sessao aberta: ' + [string](Get-Val $user 'name') + ' (' + $ip + ')')
    $body = '{"token":' + (ConvertTo-JsonString $s.token) + ',"expiresAt":' + $s.expiresAt + ',"userId":' + (ConvertTo-JsonString ([string](Get-Val $user 'id'))) + ',"name":' + (ConvertTo-JsonString ([string](Get-Val $user 'name'))) + ',"master":' + $(if (Test-IsMasterUser $user) { 'true' } else { 'false' }) + '}'
    return @{ status = 200; body = $body }
}

# Recebe as alteracoes de uma estacao, confere as permissoes e grava o que for permitido.
function Invoke-Ops($ctx) {
    $db = Get-DbObject
    $user = Get-SessionUser $ctx $db
    if (-not $user) { return @{ status = 401; body = '{"error":"sessao-necessaria","message":"Entre no sistema com o seu usuario para gravar."}' } }
    $in = $null
    try { $in = ConvertFrom-JsonText (Read-Body $ctx) } catch { $in = $null }
    $ops = Get-Val $in 'ops'
    if (-not (Test-IsList $ops)) { return @{ status = 400; body = '{"error":"conteudo-invalido"}' } }
    $remote = $ctx.Request.RemoteEndPoint.Address
    $fromServerPc = [System.Net.IPAddress]::IsLoopback($remote)
    $applied = 0
    $denied = New-Object System.Collections.ArrayList
    $byKey = @{}
    $work = @{}
    try {
        foreach ($op in $ops) {
            if (-not (Test-IsMap $op)) { continue }
            $reason = Test-OpAllowed $user $op $db $fromServerPc $work
            if ($reason) {
                [void]$denied.Add(@{ k = [string](Get-Val $op 'k'); t = [string](Get-Val $op 't'); id = [string](Get-Val $op 'id'); reason = [string]$reason })
                continue
            }
            Invoke-ApplyOp $work $db $op
            $applied++
            $k = [string](Get-Val $op 'k')
            if ($byKey.ContainsKey($k)) { $byKey[$k]++ } else { $byKey[$k] = 1 }
        }
        if ($applied -gt 0) {
            Complete-Work $work $db
            Save-Database (ConvertTo-JsonText $db) $true
        }
    } catch {
        $script:DbObj = $null
        throw
    }
    $station = [string]$ctx.Request.Headers['X-Station']
    $detail = (@($byKey.Keys | Sort-Object | ForEach-Object { $_ + ':' + $byKey[$_] }) -join ', ')
    $msg = 'Gravacao de ' + [string](Get-Val $user 'name') + ' (estacao ' + $station + ', ' + $remote + '): ' + $applied + ' alteracao(oes)'
    if ($detail) { $msg += ' [' + $detail + ']' }
    if ($denied.Count -gt 0) {
        $msg += ', ' + $denied.Count + ' RECUSADA(S): ' + ((@($denied | Select-Object -First 5 | ForEach-Object { $_.k + '/' + $_.t + ' ' + $_.reason })) -join ' | ')
    }
    if ($applied -gt 0 -or $denied.Count -gt 0) { Write-Log $msg }
    $body = '{"version":' + $script:Version + ',"updatedAt":' + (ConvertTo-JsonString $script:UpdatedAt) + ',"applied":' + $applied + ',"denied":' + (ConvertTo-JsonText $denied) + '}'
    return @{ status = 200; body = $body }
}

# ---------------------------------------------------------------- atualizacao segura
$UpdDir = Join-Path $Root 'update'
$ReadyDir = Join-Path $UpdDir 'pronta'
$PrevDir = Join-Path $Root 'app_anterior'
$UpdStatusFile = Join-Path $DataDir 'atualizacao.json'
$UpdConfigFile = Join-Path $DataDir 'atualizacao_config.json'
$UpdaterScript = Join-Path $Root 'atualizador_sucessoedu.ps1'
$IsWin = ($env:OS -eq 'Windows_NT')

function Read-JsonFile([string]$path) {
    if (-not (Test-Path $path)) { return $null }
    try { return ([System.IO.File]::ReadAllText($path, $Utf8) | ConvertFrom-Json) } catch { return $null }
}

# Lido como texto: o PowerShell 7 converteria a data ISO para outro formato.
function Get-BuiltAt([string]$dir) {
    $f = Join-Path $dir 'versao_app.json'
    if (-not (Test-Path $f)) { return '' }
    try {
        $m = [regex]::Match([System.IO.File]::ReadAllText($f, $Utf8), '"builtAt"\s*:\s*"([^"]+)"')
        if ($m.Success) { return $m.Groups[1].Value }
    } catch { }
    return ''
}
$script:AppBuiltAt = Get-BuiltAt $AppDir

function Get-UpdateUrl {
    $u = ''
    try { $c = Read-JsonFile $ConfigFile; if ($c -and $c.updateUrl) { $u = [string]$c.updateUrl } } catch { }
    $o = Read-JsonFile $UpdConfigFile
    if ($o -and $o.updateUrl) { $u = [string]$o.updateUrl }
    return $u.Trim().TrimEnd('/')
}

function Start-Updater {
    if (-not (Test-Path $UpdaterScript)) { return $false }
    $exe = (Get-Process -Id $PID).Path
    $argList = @('-NoProfile', '-ExecutionPolicy', 'Bypass')
    if ($IsWin) { $argList += @('-WindowStyle', 'Hidden') }
    $argList += @('-File', ('"' + $UpdaterScript + '"'))
    try {
        if ($IsWin) { Start-Process -FilePath $exe -ArgumentList $argList -WindowStyle Hidden | Out-Null }
        else { Start-Process -FilePath $exe -ArgumentList $argList | Out-Null }
        return $true
    } catch {
        Write-Log ('Nao foi possivel iniciar o atualizador: ' + $_.Exception.Message)
        return $false
    }
}

function Register-UpdaterTask {
    if (-not $IsWin) { return }
    try {
        $ps = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
        $action = New-ScheduledTaskAction -Execute $ps -Argument ('-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $UpdaterScript + '"') -WorkingDirectory $Root
        $t1 = New-ScheduledTaskTrigger -Once -At ((Get-Date).Date.AddHours(2)) -RepetitionInterval (New-TimeSpan -Hours 6) -RepetitionDuration (New-TimeSpan -Days 3650)
        $t2 = New-ScheduledTaskTrigger -AtStartup
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 2)
        $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
        Register-ScheduledTask -TaskName 'SucessoEdu Atualizador' -Action $action -Trigger @($t1, $t2) -Settings $settings -Principal $principal -Force | Out-Null
    } catch { Write-Log ('Tarefa de verificacao de atualizacoes nao registrada: ' + $_.Exception.Message) }
}

function Save-UpdStatus([hashtable]$s) {
    $s['checkedAt'] = (Get-Date).ToUniversalTime().ToString('o')
    [System.IO.File]::WriteAllText($UpdStatusFile, ($s | ConvertTo-Json -Depth 5), $Utf8)
}

function Get-UpdateJson {
    $raw = 'null'
    if (Test-Path $UpdStatusFile) { try { $raw = [System.IO.File]::ReadAllText($UpdStatusFile, $Utf8); if ([string]::IsNullOrWhiteSpace($raw)) { $raw = 'null' } } catch { $raw = 'null' } }
    $ready = Get-BuiltAt $ReadyDir
    $prev = Get-BuiltAt $PrevDir
    $hasPrev = Test-Path (Join-Path $PrevDir 'index.html')
    return '{"current":' + (ConvertTo-JsonString $script:AppBuiltAt) + ',"ready":' + (ConvertTo-JsonString $ready) + ',"previous":' + (ConvertTo-JsonString $prev) + ',"hasPrevious":' + ($(if ($hasPrev) { 'true' } else { 'false' })) + ',"updateUrl":' + (ConvertTo-JsonString (Get-UpdateUrl)) + ',"status":' + $raw + '}'
}

function Invoke-ApplyUpdate {
    $info = Read-JsonFile (Join-Path $ReadyDir 'versao_app.json')
    if (-not $info -or -not $info.builtAt -or -not $info.files -or -not $info.hashes) { return @{ ok = $false; message = 'Nao ha versao baixada e conferida para aplicar.' } }
    # Confere de novo cada arquivo antes de trocar (protege contra arquivo alterado no disco).
    foreach ($rel in $info.files) {
        $rel = [string]$rel
        $f = Join-Path $ReadyDir ($rel.Replace('/', [System.IO.Path]::DirectorySeparatorChar))
        $expected = ([string]($info.hashes.$rel)).ToLower()
        if (-not (Test-Path -LiteralPath $f) -or (Get-FileHash -Algorithm SHA256 -LiteralPath $f).Hash.ToLower() -ne $expected) {
            return @{ ok = $false; message = ('O arquivo ' + $rel + ' da versao baixada nao confere (SHA-256). Atualizacao cancelada; clique em Verificar para baixar de novo.') }
        }
    }
    $old = $script:AppBuiltAt
    if (Test-Path $PrevDir) { Remove-Item -Recurse -Force $PrevDir }
    if (Test-Path $AppDir) { Move-Item -Force $AppDir $PrevDir }
    try {
        Move-Item -Force $ReadyDir $AppDir
    } catch {
        if (-not (Test-Path $AppDir) -and (Test-Path $PrevDir)) { Move-Item -Force $PrevDir $AppDir }
        return @{ ok = $false; message = ('Falha ao trocar a versao; a versao anterior foi mantida. ' + $_.Exception.Message) }
    }
    $script:AppBuiltAt = Get-BuiltAt $AppDir
    Save-UpdStatus @{ state = 'aplicada'; current = $script:AppBuiltAt; previous = $old; message = 'Nova versao aplicada. As estacoes recebem ao recarregar a pagina.' }
    Write-Log ('Atualizacao aplicada: ' + $old + ' -> ' + $script:AppBuiltAt)
    return @{ ok = $true; message = 'Nova versao aplicada.'; current = $script:AppBuiltAt }
}

function Invoke-Rollback {
    if (-not (Test-Path (Join-Path $PrevDir 'index.html'))) { return @{ ok = $false; message = 'Nao ha versao anterior guardada.' } }
    $discard = Join-Path $Root 'app_descartada'
    if (Test-Path $discard) { Remove-Item -Recurse -Force $discard }
    $old = $script:AppBuiltAt
    Move-Item -Force $AppDir $discard
    Move-Item -Force $PrevDir $AppDir
    Remove-Item -Recurse -Force $discard -ErrorAction SilentlyContinue
    $script:AppBuiltAt = Get-BuiltAt $AppDir
    Save-UpdStatus @{ state = 'revertida'; current = $script:AppBuiltAt; message = 'Versao anterior restaurada.' }
    Write-Log ('Atualizacao desfeita: ' + $old + ' -> ' + $script:AppBuiltAt)
    return @{ ok = $true; message = 'Versao anterior restaurada.'; current = $script:AppBuiltAt }
}

function Send-Result($ctx, [hashtable]$r) {
    $code = 200; if (-not $r.ok) { $code = 409 }
    Send-Json $ctx $code ($r | ConvertTo-Json -Compress)
}

function Handle-Api($ctx, [string]$path, [string]$method) {
    # Somente estacoes com a chave da escola leem ou gravam o banco.
    if ($path -ne '/api/local/health' -and $AccessKey -ne '') {
        $given = [string]$ctx.Request.Headers['X-Chave']
        if ($given.Trim().ToUpper() -ne $AccessKey) {
            Send-Json $ctx 401 '{"error":"chave-de-acesso-invalida"}'
            return
        }
    }
    switch ($path) {
        '/api/local/health' {
            Send-Json $ctx 200 ('{"app":"sucessoedu-local","role":"' + $Role + '","serverName":' + (ConvertTo-JsonString $ServerName) + ',"version":' + $script:Version + ',"port":' + $Port + ',"needsKey":' + ($(if ($AccessKey -ne '') { 'true' } else { 'false' })) + ',"appBuiltAt":' + (ConvertTo-JsonString $script:AppBuiltAt) + ',"schoolUnitId":' + (ConvertTo-JsonString $SchoolUnitId) + ',"schoolInep":' + (ConvertTo-JsonString $SchoolInep) + ',"schoolName":' + (ConvertTo-JsonString $SchoolName) + ',"permissoes":true}')
            return
        }
        '/api/local/login' {
            if ($method -ne 'POST') { Send-Json $ctx 405 '{"error":"metodo-nao-permitido"}'; return }
            $r = Invoke-Login $ctx
            Send-Json $ctx $r.status $r.body
            return
        }
        '/api/local/ops' {
            if ($method -ne 'POST') { Send-Json $ctx 405 '{"error":"metodo-nao-permitido"}'; return }
            $r = Invoke-Ops $ctx
            Send-Json $ctx $r.status $r.body
            return
        }
        '/api/local/version' {
            Send-Json $ctx 200 ('{"version":' + $script:Version + ',"updatedAt":' + (ConvertTo-JsonString $script:UpdatedAt) + ',"appBuiltAt":' + (ConvertTo-JsonString $script:AppBuiltAt) + '}')
            return
        }
        '/api/local/update' {
            Send-Json $ctx 200 (Get-UpdateJson)
            return
        }
        '/api/local/update/check' {
            if ($method -ne 'POST') { Send-Json $ctx 405 '{"error":"metodo-nao-permitido"}'; return }
            $started = Start-Updater
            Send-Json $ctx 202 ('{"started":' + ($(if ($started) { 'true' } else { 'false' })) + '}')
            return
        }
        '/api/local/update/apply' {
            if ($method -ne 'POST') { Send-Json $ctx 405 '{"error":"metodo-nao-permitido"}'; return }
            Send-Result $ctx (Invoke-ApplyUpdate)
            return
        }
        '/api/local/update/rollback' {
            if ($method -ne 'POST') { Send-Json $ctx 405 '{"error":"metodo-nao-permitido"}'; return }
            Send-Result $ctx (Invoke-Rollback)
            return
        }
        '/api/local/update/config' {
            if ($method -ne 'POST') { Send-Json $ctx 405 '{"error":"metodo-nao-permitido"}'; return }
            $cfgIn = $null
            try { $cfgIn = (Read-Body $ctx) | ConvertFrom-Json } catch { }
            $u = ''
            if ($cfgIn -and $cfgIn.updateUrl) { $u = ([string]$cfgIn.updateUrl).Trim().TrimEnd('/') }
            $httpOk = ($env:SUCESSOEDU_ALLOW_HTTP_UPDATE -eq '1' -and $u.StartsWith('http://'))
            if (-not ($u.StartsWith('https://') -or $httpOk) -or $u.Length -gt 300) {
                Send-Json $ctx 400 '{"ok":false,"message":"Informe o endereco completo do sistema publicado, comecando com https://"}'
                return
            }
            [System.IO.File]::WriteAllText($UpdConfigFile, (@{ updateUrl = $u } | ConvertTo-Json), $Utf8)
            Register-UpdaterTask
            Write-Log ('Endereco de atualizacao definido: ' + $u)
            [void](Start-Updater)
            Send-Json $ctx 200 '{"ok":true,"message":"Endereco salvo. Verificando atualizacoes..."}'
            return
        }
        '/api/local/store' {
            if ($method -eq 'GET') { Send-Json $ctx 200 (Get-StoreJson); return }
            if ($method -eq 'PUT' -or $method -eq 'POST') {
                # Gravacao do banco inteiro: so no primeiro acesso (banco vazio) ou pela conta Master.
                # As gravacoes do dia a dia vao por /api/local/ops, com as permissoes conferidas.
                if ($script:DataText) {
                    $master = Get-SessionUser $ctx (Get-DbObject)
                    if (-not (Test-IsMasterUser $master)) {
                        Write-Log ('Gravacao do banco inteiro recusada (sem conta Master) - estacao ' + [string]$ctx.Request.Headers['X-Station'] + ' (' + $ctx.Request.RemoteEndPoint.Address + ')')
                        Send-Json $ctx 403 '{"error":"somente-master","message":"Esta estacao usa uma versao antiga do sistema. Recarregue a pagina (F5) para atualizar."}'
                        return
                    }
                }
                $base = $ctx.Request.Headers['X-Base-Version']
                $station = $ctx.Request.Headers['X-Station']
                if ($null -eq $base -or [int64]$base -ne $script:Version) {
                    Send-Json $ctx 409 ('{"error":"versao-desatualizada","version":' + $script:Version + '}')
                    return
                }
                $body = Read-Body $ctx
                $trim = $body.TrimStart()
                if ($trim.Length -lt 2 -or $trim[0] -ne '{') { Send-Json $ctx 400 '{"error":"conteudo-invalido"}'; return }
                Save-Database $body
                Write-Log ('Banco gravado pela estacao ' + $station + ' (' + $ctx.Request.RemoteEndPoint.Address + ') - versao ' + $script:Version + ', ' + [math]::Round($body.Length / 1KB) + ' KB')
                Send-Json $ctx 200 ('{"version":' + $script:Version + ',"updatedAt":' + (ConvertTo-JsonString $script:UpdatedAt) + '}')
                return
            }
            Send-Json $ctx 405 '{"error":"metodo-nao-permitido"}'
            return
        }
        default {
            Send-Json $ctx 404 '{"error":"recurso-indisponivel-no-servidor-local"}'
            return
        }
    }
}

# ---------------------------------------------------------------- inicio
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://+:' + $Port + '/')
try {
    $listener.Start()
} catch {
    Write-Log ('Sem permissao para atender a rede na porta ' + $Port + ' (execute o instalador como Administrador). Atendendo somente este computador.')
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add('http://localhost:' + $Port + '/')
    $listener.Start()
}

$ips = @()
try {
    $ips = [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) | Where-Object { $_.AddressFamily -eq 'InterNetwork' -and -not [System.Net.IPAddress]::IsLoopback($_) } | ForEach-Object { $_.ToString() }
} catch { }
Write-Log ('SucessoEdu ' + $ServerName + ' (' + $Role + ') iniciado na porta ' + $Port + '. Banco versao ' + $script:Version + '.')
foreach ($ip in $ips) { Write-Log ('  Estacoes acessam: http://' + $ip + ':' + $Port) }
# Procura atualizacoes ao iniciar (em segundo plano; so baixa e confere, nunca aplica).
if (Get-UpdateUrl) { [void](Start-Updater) }

while ($listener.IsListening) {
    $ctx = $null
    try {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        if (-not (Test-LocalNetwork $req.RemoteEndPoint.Address)) {
            Send-Text $ctx 403 'Acesso permitido somente na rede local da escola.' 'text/plain; charset=utf-8'
            continue
        }
        $path = $req.Url.AbsolutePath
        if ($path.StartsWith('/api/')) { Handle-Api $ctx $path $req.HttpMethod.ToUpper() }
        elseif ($req.HttpMethod -eq 'GET' -or $req.HttpMethod -eq 'HEAD') { Send-StaticFile $ctx $path }
        else { Send-Text $ctx 405 'Metodo nao permitido' 'text/plain; charset=utf-8' }
    } catch {
        Write-Log ('Erro ao atender requisicao: ' + $_.Exception.Message)
        if ($ctx) { try { Send-Json $ctx 500 '{"error":"erro-interno"}' } catch { } }
    }
}
