/**
 * Monta os pacotes .ZIP de instalação sem internet:
 *  - Servidor Remoto (escola) e Servidor da Sede: sistema real + servidor PowerShell;
 *  - Estação de trabalho: só o configurador do atalho.
 *
 * O sistema incluído é exatamente o que está publicado (lido de
 * /offline-manifest.json, gerado no build), e não uma versão simplificada.
 */
import JSZip from 'jszip';
import type { LocalServerRole } from './localServerSync';

export interface OfflineManifest {
  format?: number;
  builtAt: string;
  files: string[];
  hashes?: Record<string, string>;
  scripts: string[];
  scriptHashes?: Record<string, string>;
}

/** Endereço oficial para os servidores buscarem atualizações (somente o sistema publicado em https). */
export function officialUpdateUrl(): string {
  try {
    const { protocol, origin, hostname } = window.location;
    if (protocol !== 'https:' || hostname === 'localhost') return '';
    return origin;
  } catch {
    return '';
  }
}

export interface ServerPackageOptions {
  role: LocalServerRole;
  serverName: string;
  port: number;
  accessKey: string;
  /** Servidor Remoto: escola atendida por este servidor (vem da Sede/nuvem). */
  school?: { id: string; name: string; inepCode?: string };
  /** Servidor Remoto: cópia dos dados da escola para o servidor já começar com eles. */
  seedData?: Record<string, any> | null;
  onProgress?: (done: number, total: number) => void;
}

/**
 * Cópia dos dados de UMA escola, para o Servidor Remoto já nascer com a escola, turmas,
 * alunos e registros dela (sem internet). Senhas não vão no pacote: cada conta define a
 * senha no primeiro acesso ao servidor (ou entra com a conta da nuvem).
 */
export function buildSchoolSeed(state: Record<string, any>, unitId: string): Record<string, any> | null {
  const units: any[] = Array.isArray(state?.schoolUnits) ? state.schoolUnits : [];
  const unit = units.find((u) => u && u.id === unitId);
  if (!unit) return null;
  const list = (k: string): any[] => (Array.isArray(state?.[k]) ? state[k].filter(Boolean) : []);
  const classes = list('classes').filter((c) => c.schoolUnitId === unitId);
  const classIds = new Set(classes.map((c) => c.id));
  const students = list('students').filter((s) => s.schoolUnitId === unitId || (s.classId && classIds.has(s.classId)));
  const studentIds = new Set(students.map((s) => s.id));
  const byClass = (k: string) => list(k).filter((r) => r.classId && classIds.has(r.classId));
  const byStudent = (k: string) => list(k).filter((r) => r.studentId && studentIds.has(r.studentId));
  const accounts = list('userAccounts')
    .filter((u) => u.role === 'ADMIN' || u.schoolUnitId === unitId)
    .map(({ password, ...rest }) => rest);
  return {
    settings: state.settings,
    municipalSecretary: state.municipalSecretary,
    schoolUnits: [unit],
    classes,
    students,
    courses: list('courses'),
    subjects: list('subjects'),
    exams: byClass('exams'),
    submissions: byStudent('submissions'),
    attendanceSheets: byClass('attendanceSheets'),
    lessonRegistries: byClass('lessonRegistries'),
    classGradeSheets: byClass('classGradeSheets'),
    academicHistories: byStudent('academicHistories'),
    userAccounts: accounts,
    seededFrom: { unitId, at: new Date().toISOString() },
  };
}

const SERVER_SCRIPTS = ['servidor_sucessoedu.ps1', 'atualizador_sucessoedu.ps1', 'instalar_servidor.ps1', 'criar_atalho.ps1', 'INSTALAR_SERVIDOR.bat', 'PARAR_SERVIDOR.bat', 'INICIAR_SERVIDOR.bat'];
const STATION_SCRIPTS = ['instalar_estacao.ps1', 'criar_atalho.ps1', 'INSTALAR_ESTACAO.bat'];

const crlf = (text: string) => text.replace(/\r?\n/g, '\r\n');

/** Chave de acesso da escola (ex.: K7P4-QX9M), sem letras/números que se confundem. */
export function generateAccessKey(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  return `${chars.slice(0, 4)}-${chars.slice(4)}`;
}

export async function loadOfflineManifest(): Promise<OfflineManifest> {
  let res: Response;
  try {
    res = await fetch('/offline-manifest.json', { cache: 'no-store' });
  } catch {
    throw new Error('Não foi possível ler a lista de arquivos do sistema. Verifique a conexão com o servidor.');
  }
  const type = res.headers.get('content-type') || '';
  if (!res.ok || !type.includes('json')) {
    throw new Error(
      'O pacote de instalação só pode ser gerado a partir do sistema publicado (link da nuvem ou servidor já instalado). ' +
        'Na pré-visualização do AI Studio essa lista não existe.'
    );
  }
  const manifest = (await res.json()) as OfflineManifest;
  if (!Array.isArray(manifest.files) || !manifest.files.includes('index.html')) throw new Error('Lista de arquivos do sistema inválida.');
  return manifest;
}

async function fetchText(path: string): Promise<string> {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Arquivo ausente: ${path}`);
  return res.text();
}

function readmeServer(opts: ServerPackageOptions): string {
  const roleName = opts.role === 'SEDE' ? 'Servidor da Sede (Secretaria de Educação)' : 'Servidor Remoto (escola)';
  const lines = [
    `SucessoEdu - ${roleName}`,
    `Nome: ${opts.serverName}`,
    `CHAVE DE ACESSO DA ESCOLA: ${opts.accessKey}`,
    '(guarde esta chave: cada estação pede a chave no primeiro acesso)',
    '==============================================================',
    '',
    'INSTALAÇÃO (no computador que ficará ligado como servidor):',
    ' 1. Extraia este ZIP (botão direito > Extrair tudo).',
    ' 2. Dê dois cliques em INSTALAR_SERVIDOR.bat e aceite o pedido de Administrador.',
    ' 3. Ao final, anote o endereço mostrado (ex.: http://192.168.0.10:' + opts.port + ').',
    ' 4. No roteador, reserve o IP deste computador (reserva de DHCP) para ele não mudar.',
    '',
    'PRIMEIRO ACESSO:',
    ' - Abra o atalho "SucessoEdu Gestão Educacional" na Área de Trabalho.',
    ' - Entre como administrador e defina a senha.',
    ' - Cadastre a unidade escolar (Rede Municipal & Polos > Escolas) com o MESMO código INEP usado na Sede.',
    ' - Cadastre os usuários (secretaria, professores) com senha.',
    '',
    'ESTAÇÕES DA ESCOLA:',
    ' - Em cada computador, rode INSTALAR_ESTACAO.bat (pacote da estação) ou abra no navegador',
    '   o endereço anotado no passo 3. Todas as estações gravam no mesmo banco deste servidor.',
    '',
  ];
  if (opts.role === 'REMOTO') {
    if (opts.school) {
      lines.push(
        `ESCOLA DESTE SERVIDOR: ${opts.school.name}${opts.school.inepCode ? ' (INEP ' + opts.school.inepCode + ')' : ''}`,
        ' - O pacote já traz a escola, as turmas e os alunos cadastrados na Sede até a data de geração.',
        ' - Com internet e a conta da nuvem conectada, o servidor também RECEBE da Sede o que mudar',
        '   nesta escola (novos alunos, turmas, correções), além de enviar o lote.',
        ''
      );
    }
    lines.push(
      'ENVIO PARA A SEDE:',
      ' - Rede Municipal & Polos > Exportar Lote: gera o arquivo .edusync com todos os dados da escola.',
      '   Leve em pendrive, e-mail ou WhatsApp e importe na Sede.',
      ' - Se a internet aparecer e alguém tiver entrado com uma conta da nuvem, o sistema',
      '   também envia os dados automaticamente para a nuvem.',
      ''
    );
  } else {
    lines.push(
      'LOTES DAS ESCOLAS:',
      ' - Rede Municipal & Polos > Importar Lotes (Sede): importe os arquivos .edusync das escolas.',
      '   A importação mescla os dados sem apagar as outras escolas.',
      ' - Quando houver internet e uma conta da nuvem conectada, a Sede envia tudo para a nuvem',
      '   e recebe o que as escolas enviaram diretamente.',
      ''
    );
  }
  lines.push(
    'BANCO DE DADOS E CÓPIAS:',
    ' - Banco: C:\\SucessoEdu\\data\\banco_sucessoedu.json',
    ' - Cópias automáticas: C:\\SucessoEdu\\data\\historico (últimas 60)',
    ' - Copie a pasta C:\\SucessoEdu\\data para um pendrive periodicamente.',
    '',
    'ATUALIZAÇÕES (com internet): o servidor verifica a cada 6 horas, baixa a versão nova',
    'e confere cada arquivo (SHA-256). Ela só é aplicada quando o administrador aprovar em',
    'Instaladores & Backup > Atualização do servidor. A versão anterior fica guardada para voltar.',
    'Sem internet: gere um novo pacote e rode INSTALAR_SERVIDOR.bat de novo (o banco é preservado).',
    '',
    'PARAR / INICIAR: PARAR_SERVIDOR.bat e INICIAR_SERVIDOR.bat (em C:\\SucessoEdu).'
  );
  return lines.join('\n');
}

export async function buildServerPackage(opts: ServerPackageOptions): Promise<{ blob: Blob; fileName: string }> {
  const manifest = await loadOfflineManifest();
  const zip = new JSZip();
  const root = zip.folder('SucessoEdu')!;
  const total = manifest.files.length + SERVER_SCRIPTS.length;
  let done = 0;

  for (const file of manifest.files) {
    const res = await fetch(`/${file}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Não foi possível baixar ${file} (HTTP ${res.status}).`);
    root.file(`app/${file}`, await res.arrayBuffer());
    opts.onProgress?.(++done, total);
  }
  for (const script of SERVER_SCRIPTS) {
    root.file(script, crlf(await fetchText(`/offline/${script}`)));
    opts.onProgress?.(++done, total);
  }
  // Versão instalada (o atualizador compara com a versão publicada).
  root.file('app/versao_app.json', JSON.stringify({ builtAt: manifest.builtAt, files: manifest.files, hashes: manifest.hashes || {} }, null, 2));
  root.file(
    'config.json',
    JSON.stringify(
      {
        role: opts.role,
        serverName: opts.serverName.trim() || 'Servidor SucessoEdu',
        port: opts.port,
        accessKey: opts.accessKey,
        builtAt: manifest.builtAt,
        updateUrl: officialUpdateUrl(),
        schoolUnitId: opts.school?.id || '',
        schoolName: opts.school?.name || '',
        schoolInep: opts.school?.inepCode || '',
      },
      null,
      2
    )
  );
  if (opts.role === 'REMOTO' && opts.seedData) {
    // Usado pelo instalador só quando o servidor ainda não tem a escola (nunca apaga dados existentes).
    root.file('data_inicial/banco_sucessoedu.json', JSON.stringify(opts.seedData));
  }
  root.file('LEIA-ME.txt', '\uFEFF' + crlf(readmeServer(opts)));

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const prefix = opts.role === 'SEDE' ? 'SucessoEdu_Servidor_Sede' : 'SucessoEdu_Servidor_Remoto';
  return { blob, fileName: `${prefix}_${new Date().toISOString().slice(0, 10)}.zip` };
}

export async function buildStationPackage(serverIp: string, port: number, accessKey = ''): Promise<{ blob: Blob; fileName: string }> {
  const zip = new JSZip();
  const root = zip.folder('SucessoEdu_Estacao')!;
  for (const script of STATION_SCRIPTS) root.file(script, crlf(await fetchText(`/offline/${script}`)));
  root.file('estacao.json', JSON.stringify({ serverIp: serverIp.trim(), port, accessKey: accessKey.trim().toUpperCase() }, null, 2));
  root.file(
    'LEIA-ME.txt',
    crlf(
      [
        'SucessoEdu - Estação de trabalho',
        '',
        '1. Extraia este ZIP.',
        '2. Dê dois cliques em INSTALAR_ESTACAO.bat.',
        serverIp.trim()
          ? `3. O atalho será criado apontando para o servidor ${serverIp.trim()}:${port}.`
          : '3. O configurador procura o servidor na rede; se não achar, pede o IP.',
        '',
        accessKey.trim() ? '4. A chave de acesso já está incluída.' : '4. Tenha em mãos a CHAVE DE ACESSO da escola (LEIA-ME do servidor).',
        '',
        'A estação não guarda o banco de dados: tudo fica no servidor da escola.',
      ].join('\n')
    )
  );
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  return { blob, fileName: 'SucessoEdu_Estacao.zip' };
}

export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
