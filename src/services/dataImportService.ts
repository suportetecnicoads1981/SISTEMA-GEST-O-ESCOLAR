import * as XLSX from 'xlsx';
import {
  Student,
  SchoolClass,
  SchoolUnit,
  CadastralStatus,
  RaceColorType,
  LocationZone,
  ClassShift,
  SpecialConditionType,
} from '../types';
import {
  parseDocxFile,
  parseOdtFile,
  OFFICIAL_MUNICIPAL_SAMPLE_DATA,
  OFFICIAL_ERMINIO_BRITO_8COL_DATA,
  downloadSpreadsheetTemplate,
  downloadWordTemplate,
  downloadWriterTemplate,
} from './officeDocumentParser';

export interface ImportFilterOptions {
  // Filtros de Informações a Importar (Campos)
  importName: boolean;
  cleanPcdSuffixFromName: boolean; // Remove sufixo " - PCD" do nome
  importBirthDate: boolean;
  importGender: boolean;
  importRaceColor: boolean;
  importAddress: boolean;
  importShift: boolean;
  importSeries: boolean;
  importPcd: boolean; // Importa classificação PCD / Condição Especial
  importTea: boolean; // Importa indicação TEA (Sim/Não)
  importMedicalReport: boolean; // Importa LAUDO comprobatório
  importMedicalClassification?: boolean;
  importSchoolUnit: boolean;
  autoRegisterSchoolUnit: boolean; // Cadastra automaticamente a unidade escolar e séries atendidas
  extractSeriesFromFirstColumn: boolean; // Extrai a série a partir da 1ª coluna (ex: "PRÉ II Nº")
  overrideSeriesWithDefault: boolean; // Sobrescreve a série de todos os alunos com a série selecionada
  selectedSchoolUnitId?: string;
  defaultShift?: ClassShift;
  defaultSeries?: string;

  // Filtros Facilitadores de Registros (quais alunos importar)
  recordFilterSpecial?: 'ALL' | 'ONLY_PCD_TEA' | 'ONLY_TEA' | 'ONLY_REPORT' | 'REGULAR_ONLY';
  recordFilterGender?: 'ALL' | 'F' | 'M';
  recordFilterRace?: 'ALL' | 'PARDA' | 'BRANCA' | 'PRETA' | 'INDIGENA' | 'AMARELA';
  recordFilterCadastralStatus?: 'ALL' | 'OK' | 'INCOMPLETE';
  searchFilter?: string;
}

export interface ParsedImportStudent {
  tempId: string;
  sequenceNumber?: string;
  name: string;
  cleanName?: string; // Nome limpo sem sufixo " - PCD"
  birthDate: string;
  formattedBirthDate?: string;
  gender: 'M' | 'F' | 'OTHER';
  raceColor: RaceColorType;
  address: string;
  neighborhood?: string;
  city?: string;
  shift: string;
  series: string;
  seriesFromFirstCol?: string; // Informação da série extraída da 1ª coluna
  medicalClassification: string;
  specialConditions?: string[];
  isPcd?: boolean;
  isTea?: boolean;
  hasMedicalReport: boolean;
  medicalReportText: string;
  schoolName: string;
  schoolUnitId?: string;
  classId?: string;
  className?: string;
  cadastralStatus: CadastralStatus;
  pendingFields: string[];
  sourceFileName: string;
  rawRow: Record<string, any>;
  selectedForImport?: boolean; // Controle de seleção individual pelo usuário
}

export interface FileImportResult {
  fileName: string;
  fileSize: number;
  schoolNameDetected?: string;
  seriesDetected?: string;
  firstColumnHeaderDetected?: string;
  seriesFromFirstColumn?: string;
  dateDetected?: string;
  gradesServedDetectedText?: string; // Texto das séries (ex: 'PRÉ II – 1º AO 5º - 6º AO 9º')
  expandedGradesDetected?: string[]; // Lista de séries atendidas expandidas
  suggestedSchoolUnit?: SchoolUnit; // Unidade escolar sugerida para cadastro
  suggestedClasses?: SchoolClass[]; // Turmas sugeridas para criação
  totalRows: number;
  students: ParsedImportStudent[];
  completeCount: number;
  incompleteCount: number;
  errors: string[];
  documentType?: 'EXCEL' | 'CALC' | 'WORD' | 'WRITER' | 'CSV' | 'GENERIC';
  // Verificações da importação (conferência de colunas e do cadastro da escola)
  tableSeries?: string; // Série da tabela (ex: 'PRÉ II', lida do cabeçalho da 1ª coluna "PRÉII Nº")
  columnReport?: ImportColumnCheck[]; // Conferência das colunas da esquerda para a direita
  extraColumns?: string[]; // Colunas reconhecidas além do modelo (ex: TEA, TURNO)
  ignoredColumns?: string[]; // Colunas com cabeçalho não reconhecido (não importadas)
  schoolCheck?: SchoolCheckResult; // Conferência com o cadastro da escola
  warnings?: string[]; // Alertas que não impedem a importação
  sourceMatrix?: any[][]; // Matriz original (permite reprocessar ao mudar filtros)
  sourceContext?: ImportBlockContext; // Contexto do bloco (escola anexa)
  sourceFileName?: string; // Nome do arquivo original (quando o arquivo tem várias escolas)
  sections?: Array<{ series: string; count: number; header: string }>; // Tabelas (séries) encontradas
}

// Colunas esperadas no levantamento municipal, da ESQUERDA para a DIREITA
export const EXPECTED_STUDENT_COLUMNS: Array<{ key: string; label: string; required?: boolean }> = [
  { key: 'seq', label: 'Nº de ordem / Série (1ª coluna)' },
  { key: 'name', label: 'Nome completo do aluno', required: true },
  { key: 'birthDate', label: 'Data de nascimento', required: true },
  { key: 'gender', label: 'Sexo' },
  { key: 'race', label: 'Raça/Cor' },
  { key: 'address', label: 'Endereço' },
  { key: 'pcd', label: 'PCD' },
  { key: 'laudo', label: 'Laudo (Sim/Não)' },
];

export interface ImportColumnCheck {
  key: string;
  label: string;
  expectedPosition: number; // 1 = primeira coluna da tabela
  columnIndex?: number;
  columnLetter?: string; // A, B, C...
  header?: string;
  // OK = achada pelo cabeçalho na ordem certa | POR_POSICAO = cabeçalho não reconhecido, lida pela posição
  // FORA_DE_ORDEM = achada pelo cabeçalho, mas fora da ordem esperada | AUSENTE = não encontrada
  status: 'OK' | 'POR_POSICAO' | 'FORA_DE_ORDEM' | 'AUSENTE';
  required?: boolean;
}

/** Contexto de um bloco do arquivo (ex: escola anexa dentro do mesmo documento). */
export interface ImportBlockContext {
  isAnnex?: boolean;
  parentUnit?: SchoolUnit; // Escola principal (bloco anterior do mesmo documento)
}

export interface SchoolCheckResult {
  isAnnex?: boolean;
  parentUnitName?: string;
  // CADASTRADA = escola já existe no sistema | NOVA = será cadastrada | NAO_IDENTIFICADA = sem nome na planilha
  status: 'CADASTRADA' | 'NOVA' | 'NAO_IDENTIFICADA';
  detectedName: string;
  unitId?: string;
  unitName?: string;
  gradesInFile: string[]; // Séries atendidas informadas no cabeçalho (TURMA:)
  gradesRegistered: string[]; // Séries atendidas no cadastro da escola
  gradesMissingInRegistry: string[]; // Informadas na planilha, mas ausentes do cadastro
  tableSeries?: string;
  tableSeriesServed?: boolean; // A série da tabela consta nas séries atendidas da escola?
  classesToCreate: string[]; // Séries cujas turmas serão criadas na escola
  messages: string[];
}

// ===================== Normalização e comparação =====================

const COLUMN_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function columnLetter(idx: number): string {
  let n = idx;
  let s = '';
  do {
    s = COLUMN_LETTERS[n % 26] + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

function stripAccentsUpper(val: any): string {
  return String(val ?? '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Normaliza nome de escola para comparação: sem acentos, sem "ESCOLA:", sem pontuação. */
export function normalizeSchoolName(val: any): string {
  return stripAccentsUpper(val)
    .replace(/^\s*(ESCOLA|UNIDADE ESCOLAR|POLO)\s*:\s*/, '')
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Converte qualquer escrita de série para a forma canônica (ex: "Pré-Escola II" -> "PRÉ II", "5º Ano A" -> "5º ANO"). */
export function canonicalGrade(val: any): string {
  const s = String(val ?? '').trim();
  if (!s) return '';
  const r = extractSeriesFromFirstColumnHeader(s);
  return r.known && r.series ? r.series : s.toUpperCase().replace(/\s+/g, ' ');
}

export function sameGrade(a: any, b: any): boolean {
  const x = stripAccentsUpper(canonicalGrade(a));
  const y = stripAccentsUpper(canonicalGrade(b));
  return !!x && x === y;
}

/** Procura a escola no cadastro pelo nome (ignora acentos, maiúsculas e o prefixo "ESCOLA:"). */
export function findRegisteredSchoolUnit(name: string, units: SchoolUnit[]): SchoolUnit | undefined {
  const target = normalizeSchoolName(name);
  if (!target) return undefined;
  const exact = units.find(
    (u) => normalizeSchoolName(u.name) === target || (u.tradeName && normalizeSchoolName(u.tradeName) === target)
  );
  if (exact) return exact;
  // Correspondência parcial (ex: "ERMINIO BRITO" x "EMIEIF ERMINIO BRITO"), só se houver um único candidato
  const partial = units.filter((u) =>
    [u.name, u.tradeName].some((n) => {
      const nn = normalizeSchoolName(n);
      if (!nn) return false;
      const shorter = nn.length < target.length ? nn : target;
      return shorter.length >= 10 && (nn.includes(target) || target.includes(nn));
    })
  );
  return partial.length === 1 ? partial[0] : undefined;
}

/** Chave de comparação de aluno: nome (sem acentos/espaços extras) + data de nascimento. */
function studentKey(name: any, birthDate: any): string {
  return `${stripAccentsUpper(name).replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()}|${String(birthDate || '').slice(0, 10)}`;
}

/** Aluno já cadastrado com o mesmo nome e data de nascimento (evita duplicar ao reimportar). */
export function findExistingStudent(
  item: { name: string; cleanName?: string; birthDate: string },
  existing: Student[]
): Student | undefined {
  if (!existing || existing.length === 0) return undefined;
  const keys = new Set([studentKey(item.cleanName || item.name, item.birthDate), studentKey(item.name, item.birthDate)]);
  return existing.find((s) => s && keys.has(studentKey(s.name, s.birthDate)));
}

/** Turma da escola para a série informada (nunca devolve turma de outra escola). */
export function findClassForSeries(
  unitId: string | undefined,
  series: string,
  classes: SchoolClass[],
  allowUnlinkedClasses = false
): SchoolClass | undefined {
  if (!series) return undefined;
  const sameSeries = (c: SchoolClass) => sameGrade(c.gradeLevel, series) || sameGrade(c.name, series);
  if (unitId) {
    const inUnit = classes.find((c) => c.schoolUnitId === unitId && sameSeries(c));
    if (inUnit) return inUnit;
  }
  if (allowUnlinkedClasses || !unitId) {
    return classes.find((c) => !c.schoolUnitId && sameSeries(c));
  }
  return undefined;
}

export const DEFAULT_IMPORT_FILTERS: ImportFilterOptions = {
  importName: true,
  cleanPcdSuffixFromName: true,
  importBirthDate: true,
  importGender: true,
  importRaceColor: true,
  importAddress: true,
  importShift: true,
  importSeries: true,
  importPcd: true,
  importTea: true,
  importMedicalReport: true,
  importMedicalClassification: true,
  importSchoolUnit: true,
  autoRegisterSchoolUnit: true, // Habilitado por padrão
  extractSeriesFromFirstColumn: true, // Ativo por padrão conforme solicitado
  overrideSeriesWithDefault: false,
  defaultShift: 'MANHÃ',
  defaultSeries: 'PRÉ-ESCOLA I',
  recordFilterSpecial: 'ALL',
  recordFilterGender: 'ALL',
  recordFilterRace: 'ALL',
  recordFilterCadastralStatus: 'ALL',
  searchFilter: '',
};

// Extrai a série a partir do cabeçalho da 1ª coluna (ex: "PRÉ II Nº", "PRÉ II\nNº", "1º ANO Nº")
export function extractSeriesFromFirstColumnHeader(
  cellText: any,
  adjacentCells?: any[]
): { series: string | null; cleanHeader: string; studentNumber?: string; known?: boolean } {
  if (!cellText && (!adjacentCells || adjacentCells.length === 0)) {
    return { series: null, cleanHeader: '' };
  }

  const raw = String(cellText || '').trim();
  const fullText = [raw, ...(adjacentCells || []).map((c) => String(c || '').trim())]
    .filter(Boolean)
    .join(' ')
    .replace(/N\s*[º°]/g, ' Nº '); // "PRÉIINº" / "1º ANONº" -> "PRÉII Nº" / "1º ANO Nº"

  // Extrai número do estudante se houver no final (ex: "PRÉ II - 1" -> studentNumber = "1")
  let studentNumber: string | undefined = undefined;
  const numEndMatch = raw.match(/[\-\_\s]+(\d{1,4})$/);
  if (numEndMatch) {
    studentNumber = numEndMatch[1];
  }

  // 1. Padrões específicos de séries e etapas escolares brasileiras
  const knownPatterns: Array<{ regex: RegExp; format: (m: RegExpMatchArray) => string }> = [
    {
      regex: /\bPR[EÉ][\s\-_]*ESCOLA[\s\-_]*(?:II|2)\b/i,
      format: () => 'PRÉ II',
    },
    {
      regex: /\bPR[EÉ][\s\-_]*ESCOLA[\s\-_]*(?:I|1)\b/i,
      format: () => 'PRÉ I',
    },
    {
      regex: /\bPR[EÉ][\s\-_]*(?:II|2)\b/i,
      format: () => 'PRÉ II',
    },
    {
      regex: /\bPR[EÉ][\s\-_]*(?:I|1)\b/i,
      format: () => 'PRÉ I',
    },
    {
      regex: /\bPR[EÉ][\s\-_]*ESCOLA\b/i,
      format: () => 'PRÉ-ESCOLA',
    },
    {
      regex: /\b(\d{1,2})\s*[º°ªaAoO]?\s*(?:ANOS?|S[EÉ]RIES?)\b/i,
      format: (m) => `${m[1]}º ANO`,
    },
    {
      regex: /\bMATERNAL[\s\-_]*(?:II|2)\b/i,
      format: () => 'MATERNAL II',
    },
    {
      regex: /\bMATERNAL[\s\-_]*(?:I|1)\b/i,
      format: () => 'MATERNAL I',
    },
    {
      regex: /\bMATERNAL\b/i,
      format: () => 'MATERNAL',
    },
    {
      regex: /\bBER[CÇ][AÁ]RIO[\s\-_]*(?:II|2)\b/i,
      format: () => 'BERÇÁRIO II',
    },
    {
      regex: /\bBER[CÇ][AÁ]RIO[\s\-_]*(?:I|1)\b/i,
      format: () => 'BERÇÁRIO I',
    },
    {
      regex: /\bBER[CÇ][AÁ]RIO\b/i,
      format: () => 'BERÇÁRIO',
    },
    {
      regex: /\bJARDIM[\s\-_]*(?:II|2)\b/i,
      format: () => 'JARDIM II',
    },
    {
      regex: /\bJARDIM[\s\-_]*(?:I|1)\b/i,
      format: () => 'JARDIM I',
    },
    {
      regex: /\bCRECHE\b/i,
      format: () => 'CRECHE',
    },
    {
      regex: /\bEJA\b/i,
      format: () => 'EJA',
    },
    {
      regex: /\bMULTISSERIAD[AO]\b/i,
      format: () => 'MULTISSERIADA',
    },
  ];

  for (const { regex, format } of knownPatterns) {
    const match = fullText.match(regex);
    if (match) {
      return {
        series: format(match),
        cleanHeader: raw,
        studentNumber,
        known: true,
      };
    }
  }

  // 2. Tentar remover a palavra de número "Nº", "N°", "NO", "NUMERO" e analisar o que sobra
  const stripped = raw
    .replace(/[\r\n]+/g, ' ')
    .replace(/\b(N[º°oO]\.?|NUMERO|NÚMERO|ORDEM)\b/gi, '')
    .replace(/[\-\_\:\.\/]+$/, '')
    .replace(/^[\-\_\:\.\/]+/, '')
    .trim();

  if (stripped.length >= 2 && !/^\d+$/.test(stripped)) {
    return {
      series: stripped.toUpperCase(),
      cleanHeader: raw,
      studentNumber,
    };
  }

  return { series: null, cleanHeader: raw, studentNumber };
}

/**
 * Analisa o texto de séries atendidas no cabeçalho (ex: "PRÉ II – 1º AO 5º - 6º AO 9º ANOS")
 * e expande para a lista nominal completa de séries que a escola atende.
 * Ex: -> ['PRÉ II', '1º ANO', '2º ANO', ..., '9º ANO']  (não inclui PRÉ I se ele não foi citado)
 */
export function extractSchoolGradesServed(gradesText: string): { rawText: string; expandedGrades: string[] } {
  const rawText = String(gradesText || '').trim();
  if (!rawText) {
    return { rawText: '', expandedGrades: [] };
  }

  const gradesSet = new Set<string>();
  let rest = ` ${rawText.toUpperCase()} `;

  // 1. "PRÉ I E II", "PRÉ I/II", "PRÉ-ESCOLA I AO II"
  rest = rest.replace(
    /PR[EÉ](?:[\s\-_]*ESCOLA)?[\s\-_]*(?:I|1)\s*(?:E|,|\/|AO|A|À)\s*(?:II|2)\b/g,
    () => {
      gradesSet.add('PRÉ I');
      gradesSet.add('PRÉ II');
      return ' | ';
    }
  );

  // 2. Intervalos: "1º AO 5º", "6 ATÉ 9º ANO", "1º ANO AO 5º ANO"
  rest = rest.replace(
    /(\d{1,2})\s*[º°ª]?\s*(?:ANOS?|S[EÉ]RIES?)?\s*(?:AO|ATÉ|ATE|À|A)\s*(\d{1,2})\s*[º°ª]?(?:\s*(?:ANOS?|S[EÉ]RIES?))?/g,
    (m, a, b) => {
      const start = parseInt(a, 10);
      const end = parseInt(b, 10);
      if (start >= 1 && end <= 12 && start <= end) {
        for (let g = start; g <= end; g++) gradesSet.add(`${g}º ANO`);
        return ' | ';
      }
      return m;
    }
  );

  // 3. Demais trechos isolados ("PRÉ II", "3º ANO", "EJA", "MULTISSERIADA"...)
  rest
    .split(/\s[–—-]\s|[–—,;\/|+]|\sE\s/)
    .map((p) => p.trim())
    .filter(Boolean)
    .forEach((part) => {
      const ordinalOnly = part.match(/^(\d{1,2})\s*[º°ª]$/);
      if (ordinalOnly) {
        gradesSet.add(`${parseInt(ordinalOnly[1], 10)}º ANO`);
        return;
      }
      const parsed = extractSeriesFromFirstColumnHeader(part);
      if (parsed.known && parsed.series) {
        gradesSet.add(parsed.series);
      }
    });

  const rank = (str: string) => {
    if (str.includes('BERÇÁRIO')) return 1;
    if (str.includes('CRECHE')) return 2;
    if (str.includes('MATERNAL')) return 3;
    if (str === 'PRÉ II') return 5;
    if (str === 'PRÉ I') return 4;
    if (str.includes('PRÉ')) return 6;
    const numMatch = str.match(/^(\d+)º ANO$/);
    if (numMatch) return 10 + parseInt(numMatch[1], 10);
    return 99;
  };

  return {
    rawText,
    expandedGrades: Array.from(gradesSet).sort((a, b) => rank(a) - rank(b)),
  };
}

function segmentForGrade(serie: string): string {
  if (/PR[EÉ]|CRECHE|MATERNAL|BER[CÇ]|INFANTIL|JARDIM/i.test(serie)) return 'EDUCACAO_INFANTIL';
  if (/M[EÉ]DIO/i.test(serie)) return 'ENSINO_MEDIO';
  return 'ENSINO_FUNDAMENTAL';
}

/** Monta uma turma nova para a série, vinculada à escola. */
export function buildClassForSeries(
  unit: SchoolUnit,
  serie: string,
  defaultShift: ClassShift | string = 'MANHÃ',
  roomIndex = 0
): SchoolClass {
  // Nome da turma = série + turno (a escola já fica no vínculo schoolUnitId)
  return {
    id: `class-${unit.id}-${stripAccentsUpper(serie).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: `${serie} - ${defaultShift}`,
    gradeLevel: serie,
    segment: segmentForGrade(serie),
    shift: (defaultShift as ClassShift) || 'MANHÃ',
    schoolYear: new Date().getFullYear(),
    roomNumber: `Sala ${String(roomIndex + 1).padStart(2, '0')}`,
    maxCapacity: 30,
    schoolUnitId: unit.id,
  } as SchoolClass;
}

/**
 * Cria uma NOVA unidade escolar (quando não existe no cadastro) e as turmas das séries que ela atende.
 * O cadastro fica 'INCOMPLETE' com a lista de pendências para complementação pela secretaria.
 * Se a escola já estiver cadastrada, devolve a escola existente SEM alterá-la.
 */
export function buildSchoolUnitAndClassesFromImport(
  schoolName: string,
  gradesText: string,
  sourceFileName: string,
  existingUnits: SchoolUnit[],
  existingClasses: SchoolClass[],
  defaultShift: ClassShift | string = 'MANHÃ',
  firstColumnSeries?: string
): {
  schoolUnit: SchoolUnit;
  isNewUnit: boolean;
  createdClasses: SchoolClass[];
} {
  const cleanSchoolName =
    String(schoolName || '')
      .replace(/^\s*ESCOLA:\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase() || 'ESCOLA NÃO IDENTIFICADA';

  const { rawText, expandedGrades } = extractSchoolGradesServed(gradesText);
  if (firstColumnSeries && !expandedGrades.some((g) => sameGrade(g, firstColumnSeries))) {
    expandedGrades.unshift(canonicalGrade(firstColumnSeries));
  }

  const existing = findRegisteredSchoolUnit(cleanSchoolName, existingUnits);
  if (existing) {
    return { schoolUnit: existing, isNewUnit: false, createdClasses: [] };
  }

  const schoolUnit: SchoolUnit = {
    // Id estável pelo nome: reprocessar a planilha não cria outra escola e as anexas mantêm o vínculo
    id: `unit-imp-${stripAccentsUpper(cleanSchoolName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
    name: cleanSchoolName,
    tradeName: cleanSchoolName,
    inepCode: 'Pendente de Regularização Censo',
    cnpjOrDecree: 'Pendente de Decreto / Ato de Criação',
    type: 'ESCOLA_POLO',
    locationZone: 'ZONA_RURAL',
    district: 'Polo Remoto',
    address: 'Aguardando Informações Complementares da Secretaria',
    directorName: 'Pendente de Designação Oficial',
    coordinatorName: 'Coordenação Polo Remoto',
    secretaryName: 'Pendente de Nomeação',
    phone: '',
    email: `polo.${stripAccentsUpper(cleanSchoolName).toLowerCase().replace(/[^a-z0-9]/g, '')}@educacao.gov.br`,
    hasInternet: false,
    syncStatus: 'PENDENTE',
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: expandedGrades.length,
    lastSyncDate: new Date().toISOString(),
    gradesServed: expandedGrades,
    gradesServedText: rawText,
    cadastralStatus: 'INCOMPLETE',
    pendingFields: [
      'Código INEP Escolar',
      'Ato de Autorização / Decreto',
      'Nome do(a) Diretor(a)',
      'Telefone e Contato Oficial',
      'Endereço Completo e CEP',
      'Infraestrutura e Quantidade de Salas',
    ],
    createdViaImport: true,
    importSourceFileName: sourceFileName,
  } as SchoolUnit;

  const createdClasses: SchoolClass[] = [];
  expandedGrades.forEach((serie, idx) => {
    const cls = buildClassForSeries(schoolUnit, serie, defaultShift, idx);
    if (!existingClasses.some((c) => c.id === cls.id)) createdClasses.push(cls);
  });

  return { schoolUnit, isNewUnit: true, createdClasses };
}

// Limpa strings com caracteres como '*****', '---', etc.
function cleanPlaceholder(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (/^[\*\-\_\.\?]+$/.test(str) || str.toUpperCase() === 'N/A' || str.toUpperCase() === 'NI') {
    return '';
  }
  return str;
}

// Normaliza data de nascimento (ex: 25/08/2021 ou número de série do Excel)
function parseFlexibleDate(val: any): { isoDate: string; formatted: string; isValid: boolean } {
  if (!val) return { isoDate: '', formatted: '', isValid: false };

  // Caso seja número serial do Excel
  if (typeof val === 'number') {
    try {
      const parsed = XLSX.SSF.parse_date_code(val);
      if (parsed) {
        const y = String(parsed.y).padStart(4, '20');
        const m = String(parsed.m).padStart(2, '0');
        const d = String(parsed.d).padStart(2, '0');
        return {
          isoDate: `${y}-${m}-${d}`,
          formatted: `${d}/${m}/${y}`,
          isValid: true,
        };
      }
    } catch {
      // continua
    }
  }

  const str = cleanPlaceholder(val);
  if (!str) return { isoDate: '', formatted: '', isValid: false };

  // Formato DD/MM/YYYY ou DD-MM-YYYY
  const brMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (brMatch) {
    const d = brMatch[1].padStart(2, '0');
    const m = brMatch[2].padStart(2, '0');
    const y = brMatch[3];
    return {
      isoDate: `${y}-${m}-${d}`,
      formatted: `${d}/${m}/${y}`,
      isValid: true,
    };
  }

  // Formato YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return {
      isoDate: `${y}-${m}-${d}`,
      formatted: `${d}/${m}/${y}`,
      isValid: true,
    };
  }

  return { isoDate: str, formatted: str, isValid: false };
}

// Normaliza Sexo (F / M / OUTRO)
function parseGender(val: any): 'M' | 'F' | 'OTHER' {
  const str = cleanPlaceholder(val).toUpperCase();
  if (str.startsWith('F') || str === 'FEMININO' || str === 'MULHER') return 'F';
  if (str.startsWith('M') || str === 'MASCULINO' || str === 'HOMEM') return 'M';
  return 'OTHER';
}

// Normaliza Raça/Cor padrão Censo Escolar / IBGE
function parseRaceColor(val: any): RaceColorType {
  const str = stripAccentsUpper(cleanPlaceholder(val));
  if (str.includes('PARD')) return 'PARDA';
  if (str.includes('BRANC')) return 'BRANCA';
  if (str.includes('PRET') || str.includes('NEGR')) return 'PRETA';
  if (str.includes('AMAREL')) return 'AMARELA';
  if (str.includes('INDIG') || str.includes('ÍNDIG')) return 'INDIGENA';
  return 'NAO_DECLARADA';
}

// Interpreta status de laudo médico
function parseMedicalReport(val: any): { hasReport: boolean; text: string } {
  const str = cleanPlaceholder(val).toUpperCase();
  if (!str) return { hasReport: false, text: 'NÃO INFORMADO' };
  if (str.includes('SIM') || str === 'S' || str === 'POSITIVO' || str === 'COM LAUDO') {
    return { hasReport: true, text: 'SIM' };
  }
  if (str.includes('NÃO') || str.includes('NAO') || str === 'N' || str === 'SEM LAUDO') {
    return { hasReport: false, text: 'NÃO' };
  }
  return { hasReport: false, text: str };
}

const SCHOOL_LINE_RE = /\bESCOLA(\s+ANEXO)?\s*:\s*(.+?)(?=\s*\|?\s*(?:TURMAS?|S[EÉ]RIES?|DATA)\s*:|\s*\||$)/i;

/**
 * Separa a matriz em blocos por escola. Um mesmo documento pode trazer a escola principal
 * e escolas anexas (linha "ESCOLA ANEXO: ..."), cada uma com suas tabelas por série.
 * Linhas "ESCOLA:" repetidas da mesma escola (ex: a cada página) ficam no mesmo bloco.
 */
export function splitMatrixBySchool(matrix: any[][]): Array<{ matrix: any[][]; schoolName: string; isAnnex: boolean }> {
  const starts: Array<{ index: number; name: string; isAnnex: boolean }> = [];
  matrix.forEach((row, i) => {
    const text = (row || []).map((c) => String(c ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean).join(' | ');
    const m = text.match(SCHOOL_LINE_RE);
    if (m && m[2].trim()) {
      const name = normalizeSchoolName(m[2]);
      const isAnnex = !!m[1];
      const last = starts[starts.length - 1];
      if (!last || last.name !== name || last.isAnnex !== isAnnex) {
        starts.push({ index: i, name, isAnnex });
      }
    }
  });
  if (starts.length <= 1) {
    return [{ matrix, schoolName: starts[0]?.name || '', isAnnex: !!starts[0]?.isAnnex }];
  }
  return starts.map((st, i) => ({
    matrix: matrix.slice(i === 0 ? 0 : st.index, starts[i + 1] ? starts[i + 1].index : matrix.length),
    schoolName: st.name,
    isAnnex: st.isAnnex,
  }));
}

/** Processa cada bloco (escola) como um resultado separado, ligando as anexas à escola principal. */
function processMatrixBlocks(
  matrix: any[][],
  fileName: string,
  fileSize: number,
  filters: ImportFilterOptions,
  classes: SchoolClass[],
  schoolUnits: SchoolUnit[],
  documentType: FileImportResult['documentType']
): FileImportResult[] {
  const blocks = splitMatrixBySchool(matrix);
  const results: FileImportResult[] = [];
  let parentUnit: SchoolUnit | undefined;
  blocks.forEach((block) => {
    const res = processSheetWithHeaders(block.matrix, fileName, fileSize, filters, classes, schoolUnits, {
      isAnnex: block.isAnnex,
      parentUnit: block.isAnnex ? parentUnit : undefined,
    });
    res.documentType = documentType;
    res.sourceFileName = fileName;
    if (blocks.length > 1) {
      res.fileName = `${fileName} — ${res.schoolNameDetected || block.schoolName || 'escola'}`;
    }
    if (!block.isAnnex && res.suggestedSchoolUnit) parentUnit = res.suggestedSchoolUnit;
    results.push(res);
  });
  return results;
}

/**
 * Lê um arquivo e devolve um resultado por escola encontrada.
 * Word/Writer: tabelas na ordem do documento. Excel/Calc: todas as abas.
 */
export async function parseFileResults(
  file: File,
  filters: ImportFilterOptions,
  classes: SchoolClass[],
  schoolUnits: SchoolUnit[]
): Promise<FileImportResult[]> {
  const fileName = file.name;
  const fileSize = file.size;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  try {
    if (ext === 'docx') {
      const extracted = await parseDocxFile(file);
      return processMatrixBlocks(extracted.matrix, fileName, fileSize, filters, classes, schoolUnits, 'WORD');
    }

    if (ext === 'odt') {
      const extracted = await parseOdtFile(file);
      return processMatrixBlocks(extracted.matrix, fileName, fileSize, filters, classes, schoolUnits, 'WRITER');
    }

    if (ext === 'json') {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      return [
        processRawRows(
          Array.isArray(jsonData) ? jsonData : jsonData.alunos || jsonData.students || [jsonData],
          fileName,
          fileSize,
          filters,
          classes,
          schoolUnits
        ),
      ];
    }

    if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
      const text = await file.text();
      const wb = XLSX.read(text, { type: 'string' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<any>(ws, { header: 1, defval: '' });
      return processMatrixBlocks(rawRows, fileName, fileSize, filters, classes, schoolUnits, 'CSV');
    }

    // Excel (.xlsx, .xls) e Calc (.ods): lê TODAS as abas, na ordem
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const allRows: any[][] = [];
    wb.SheetNames.forEach((name) => {
      const rows = XLSX.utils.sheet_to_json<any>(wb.Sheets[name], { header: 1, defval: '' });
      if (rows.length > 0) {
        allRows.push(...rows, []);
      }
    });
    const docType = ext === 'ods' ? 'CALC' : ext === 'xls' || ext === 'xlsx' ? 'EXCEL' : 'GENERIC';
    return processMatrixBlocks(allRows, fileName, fileSize, filters, classes, schoolUnits, docType);
  } catch (error: any) {
    return [
      {
        fileName,
        fileSize,
        totalRows: 0,
        students: [],
        completeCount: 0,
        incompleteCount: 0,
        errors: [`Falha ao ler o arquivo: ${error?.message || 'Formato não reconhecido'}`],
        documentType: 'GENERIC',
      },
    ];
  }
}

// Mantido por compatibilidade: devolve só o primeiro resultado (primeira escola) do arquivo
export async function parseSingleFile(
  file: File,
  filters: ImportFilterOptions,
  classes: SchoolClass[],
  schoolUnits: SchoolUnit[]
): Promise<FileImportResult> {
  const results = await parseFileResults(file, filters, classes, schoolUnits);
  return results[0];
}

// Mapeia as colunas pelo texto do cabeçalho (palavras-chave)
function mapColumnsByHeader(headers: string[]): Record<string, number> {
  const colMap: Record<string, number> = {};
  headers.forEach((h, idx) => {
    const norm = stripAccentsUpper(h).replace(/\s+/g, ' ').trim();
    if (!norm) return;

    // SÉRIE / TURMA (coluna com a série de cada aluno)
    if (
      (norm.includes('SERIE') || norm.includes('TURMA') || norm.includes('ANO DE ENSINO') || norm.includes('ETAPA')) &&
      !norm.includes('NASCIM')
    ) {
      if (colMap.series === undefined) colMap.series = idx;
    }

    // Nº de ordem (ex: "PRÉII Nº", "Nº", "ORDEM")
    if (
      /N[º°]|\bNO\.|NUMERO|\bORDEM\b|^N$|^ORD\.?$/.test(norm) ||
      String(h).includes('Nº') ||
      String(h).includes('N°')
    ) {
      if (colMap.seq === undefined) colMap.seq = idx;
    }

    const isOtherField = /SERIE|TURMA|SEXO|\bCOR\b|RACA|ENDERECO|EDENRECO|PCD|LAUDO|NASCIM|RESPONSAVEL|\bMAE\b|\bPAI\b/.test(norm);
    if (!isOtherField && (norm.includes('NOME') || norm === 'ALUNO' || norm === 'ESTUDANTE')) {
      if (colMap.name === undefined) colMap.name = idx;
    }

    if (norm.includes('NASCIM') || /\bNASC\b/.test(norm) || norm.includes('ANIVERSARIO')) {
      if (colMap.birthDate === undefined) colMap.birthDate = idx;
    }

    if (norm.includes('SEXO') || norm.includes('GENERO')) {
      if (colMap.gender === undefined) colMap.gender = idx;
    }

    if (norm.includes('RACA') || /\bCOR\b/.test(norm) || norm.includes('ETNIA')) {
      if (colMap.race === undefined) colMap.race = idx;
    }

    if (/ENDERECO|EDENRECO|LOGRADOURO|RESIDENCIA|BAIRRO|LOCALIDADE/.test(norm)) {
      if (colMap.address === undefined) colMap.address = idx;
    }

    if (norm.includes('TURNO') || norm.includes('PERIODO')) {
      if (colMap.shift === undefined) colMap.shift = idx;
    }

    if (/\bTEA\b|AUTISMO|ESPECTRO/.test(norm)) {
      if (colMap.tea === undefined) colMap.tea = idx;
    }

    if (/PCD|DEFICIENCIA|CONDICAO|CLASSIFICACAO MEDICA|NECESSIDADES/.test(norm)) {
      if (colMap.pcd === undefined) colMap.pcd = idx;
    }

    if (/LAUDO|COMPROVACAO/.test(norm)) {
      if (colMap.laudo === undefined) colMap.laudo = idx;
    }
  });
  return colMap;
}

/**
 * Confere as colunas da ESQUERDA para a DIREITA conforme o modelo oficial
 * (Nº | NOME | NASCIMENTO | SEXO | RAÇA/COR | ENDEREÇO | PCD | LAUDO).
 * Colunas cujo cabeçalho não foi reconhecido são lidas pela posição esperada.
 */
function checkColumnsLeftToRight(
  headers: string[],
  colMap: Record<string, number>,
  matrix: any[][],
  headerRowIndex: number
): { report: ImportColumnCheck[]; extraColumns: string[]; ignoredColumns: string[] } {
  const byHeader = new Set(Object.keys(colMap));
  // A 1ª coluna pode ser "Nº" (seq) ou "SÉRIE DO ALUNO" (series)
  if (colMap.seq === undefined && colMap.series !== undefined && colMap.series < (colMap.name ?? 1)) {
    colMap.seq = colMap.series;
    byHeader.add('seq');
  }

  const columnHasData = (idx: number) =>
    matrix.slice(headerRowIndex + 1, headerRowIndex + 30).some((row) => cleanPlaceholder(row?.[idx]) !== '' || String(row?.[idx] ?? '').includes('*'));
  const used = () => new Set(Object.values(colMap));

  const anchor = colMap.name ?? 1;
  if (colMap.name === undefined && headers.length >= 2) colMap.name = anchor;

  // Preenche por posição as colunas não reconhecidas pelo cabeçalho
  EXPECTED_STUDENT_COLUMNS.forEach((col, pos) => {
    if (colMap[col.key] !== undefined) return;
    const idx = anchor + (pos - 1);
    if (idx < 0 || idx >= Math.max(headers.length, 1)) return;
    if (used().has(idx)) return;
    if (!String(headers[idx] ?? '').trim() && !columnHasData(idx)) return;
    colMap[col.key] = idx;
  });

  let lastIdx = -1;
  const report: ImportColumnCheck[] = EXPECTED_STUDENT_COLUMNS.map((col, pos) => {
    const idx = colMap[col.key];
    if (idx === undefined) {
      return { key: col.key, label: col.label, expectedPosition: pos + 1, status: 'AUSENTE', required: col.required };
    }
    let status: ImportColumnCheck['status'] = byHeader.has(col.key) ? 'OK' : 'POR_POSICAO';
    if (idx < lastIdx) status = 'FORA_DE_ORDEM';
    lastIdx = Math.max(lastIdx, idx);
    return {
      key: col.key,
      label: col.label,
      expectedPosition: pos + 1,
      columnIndex: idx,
      columnLetter: columnLetter(idx),
      header: String(headers[idx] ?? '').replace(/\s+/g, ' ').trim(),
      status,
      required: col.required,
    };
  });

  const expectedIdx = new Set(report.map((r) => r.columnIndex).filter((i) => i !== undefined));
  const extraLabels: Record<string, string> = { tea: 'TEA', shift: 'Turno', series: 'Série do aluno' };
  const extraColumns: string[] = [];
  Object.entries(extraLabels).forEach(([k, label]) => {
    const idx = colMap[k];
    if (idx !== undefined && !expectedIdx.has(idx)) extraColumns.push(`${label} (coluna ${columnLetter(idx)})`);
  });
  const allUsed = used();
  const ignoredColumns = headers
    .map((h, i) => ({ h: String(h ?? '').replace(/\s+/g, ' ').trim(), i }))
    .filter(({ h, i }) => h && !allUsed.has(i))
    .map(({ h, i }) => `${h} (coluna ${columnLetter(i)})`);

  return { report, extraColumns, ignoredColumns };
}

// Processa planilha crua linha por linha com detecção de metadados do cabeçalho
export function processSheetWithHeaders(
  matrix: any[][],
  fileName: string,
  fileSize: number,
  filters: ImportFilterOptions,
  classes: SchoolClass[],
  schoolUnits: SchoolUnit[],
  context: ImportBlockContext = {}
): FileImportResult {
  let schoolNameDetected = '';
  let isAnnex = !!context.isAnnex;
  let gradesServedText = '';
  let dateDetected = '';
  let headerRowIndex = -1;
  let headers: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // 1. Varre as primeiras 15 linhas: dados da escola (ESCOLA / DATA / TURMA) e linha de cabeçalho da tabela
  for (let r = 0; r < Math.min(matrix.length, 15); r++) {
    const row = matrix[r] || [];
    const rowText = row.map((c) => String(c ?? '').replace(/[\r\n]+/g, ' ').trim()).filter(Boolean).join(' | ');

    const schoolMatch = rowText.match(SCHOOL_LINE_RE);
    if (schoolMatch && !schoolNameDetected && schoolMatch[2].trim()) {
      schoolNameDetected = schoolMatch[2].trim();
      if (schoolMatch[1]) isAnnex = true;
    }

    const turmasMatch = rowText.match(/(?:TURMAS?|S[EÉ]RIES?(?:\s+ATENDIDAS)?)\s*:\s*(.+?)(?=\s*\|?\s*(?:DATA|ESCOLA)\s*:|\s*\||$)/i);
    if (turmasMatch && !gradesServedText && turmasMatch[1].trim()) {
      gradesServedText = turmasMatch[1].trim();
    }

    const dataMatch = rowText.match(/DATA\s*:\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i);
    if (dataMatch && !dateDetected) {
      dateDetected = dataMatch[1].trim();
    }

    const hasStudentNameCol = row.some((cell) => {
      const c = stripAccentsUpper(cell).replace(/\s+/g, ' ').trim();
      return c.includes('NOME COMPLETO') || c.includes('NOME DO ALUNO') || c.includes('NOME DO ESTUDANTE') || c === 'NOME' || c === 'ALUNO';
    });
    if (hasStudentNameCol && headerRowIndex === -1) {
      headerRowIndex = r;
      headers = row.map((c) => String(c ?? '').trim());
    }
  }

  if (headerRowIndex === -1 && matrix.length > 0) {
    headerRowIndex = 0;
    headers = (matrix[0] || []).map((c) => String(c ?? '').trim());
    warnings.push('Não foi encontrada a coluna "NOME COMPLETO DO ALUNO" no cabeçalho; a 1ª linha foi usada como cabeçalho.');
  }

  // 2. Colunas: pelo cabeçalho e, na falta, pela posição (esquerda -> direita)
  const colMap = mapColumnsByHeader(headers);
  const { report: columnReport, extraColumns, ignoredColumns } = checkColumnsLeftToRight(headers, colMap, matrix, headerRowIndex);
  columnReport.forEach((c) => {
    if (c.status === 'AUSENTE') {
      (c.required ? errors : warnings).push(`Coluna "${c.label}" (${c.expectedPosition}ª coluna esperada) não encontrada.`);
    } else if (c.status === 'FORA_DE_ORDEM') {
      warnings.push(`Coluna "${c.label}" está fora da ordem esperada (encontrada na coluna ${c.columnLetter}).`);
    } else if (c.status === 'POR_POSICAO') {
      warnings.push(`Cabeçalho da coluna ${c.columnLetter} ("${c.header || 'vazio'}") não reconhecido; lida como "${c.label}" pela posição.`);
    }
  });

  // 3. Série da tabela: cabeçalho da 1ª coluna (ex: "PRÉII Nº") ou, se o cabeçalho TURMA tiver uma só série, ela
  const firstColIdx = colMap.seq ?? colMap.series ?? 0;
  const firstColRawHeader = headers[firstColIdx] || '';
  const firstColExtraction = extractSeriesFromFirstColumnHeader(firstColRawHeader);
  const seriesFromFirstColumn = firstColExtraction.known ? firstColExtraction.series || undefined : undefined;

  const gradesInFile = extractSchoolGradesServed(gradesServedText).expandedGrades;
  let tableSeries = '';
  if (filters.extractSeriesFromFirstColumn !== false && seriesFromFirstColumn) {
    tableSeries = seriesFromFirstColumn;
  } else if (gradesInFile.length === 1) {
    tableSeries = gradesInFile[0];
  }

  // 4. Escola: confere com o cadastro
  const selectedUnit = filters.selectedSchoolUnitId
    ? schoolUnits.find((u) => u.id === filters.selectedSchoolUnitId || u.name === filters.selectedSchoolUnitId)
    : undefined;
  const registeredUnit = schoolNameDetected ? findRegisteredSchoolUnit(schoolNameDetected, schoolUnits) : undefined;
  const schoolMessages: string[] = [];

  let targetUnit: SchoolUnit | undefined = selectedUnit || registeredUnit;
  let schoolStatus: SchoolCheckResult['status'] = targetUnit ? 'CADASTRADA' : schoolNameDetected ? 'NOVA' : 'NAO_IDENTIFICADA';
  let suggestedClasses: SchoolClass[] = [];

  if (selectedUnit && schoolNameDetected && registeredUnit?.id !== selectedUnit.id) {
    schoolMessages.push(
      `A planilha é da escola "${schoolNameDetected}", mas o destino selecionado é "${selectedUnit.name}". Os alunos serão vinculados ao destino selecionado.`
    );
  }

  if (!targetUnit && schoolNameDetected) {
    if (filters.autoRegisterSchoolUnit) {
      const built = buildSchoolUnitAndClassesFromImport(
        schoolNameDetected,
        gradesServedText,
        fileName,
        schoolUnits,
        classes,
        filters.defaultShift || 'MANHÃ',
        tableSeries || undefined
      );
      targetUnit = built.schoolUnit;
      suggestedClasses = built.createdClasses;
      if (isAnnex) {
        const parentName = context.parentUnit?.name;
        targetUnit = {
          ...targetUnit,
          type: 'ESCOLA_SATELITE',
          isAnnex: true,
          parentUnitId: context.parentUnit?.id,
          tradeName: parentName ? `${targetUnit.name} (Anexo de ${parentName})` : `${targetUnit.name} (Escola Anexa)`,
        };
      }
      schoolMessages.push(
        `A escola "${schoolNameDetected}" não está cadastrada. Ela será cadastrada com as séries informadas na planilha e ficará pendente de complementação.`
      );
    } else {
      errors.push(
        `A escola "${schoolNameDetected}" não está cadastrada. Cadastre-a, selecione a escola de destino ou ative o cadastro automático.`
      );
    }
  } else if (!targetUnit) {
    schoolStatus = 'NAO_IDENTIFICADA';
    errors.push('Nome da escola não encontrado na planilha (linha "ESCOLA: ..."). Selecione a escola de destino antes de importar.');
  }

  const gradesRegistered = schoolStatus === 'CADASTRADA' ? targetUnit?.gradesServed || [] : gradesInFile;
  const gradesMissingInRegistry =
    schoolStatus === 'CADASTRADA' ? gradesInFile.filter((g) => !gradesRegistered.some((r) => sameGrade(r, g))) : [];

  if (schoolStatus === 'CADASTRADA') {
    if (gradesRegistered.length === 0) {
      schoolMessages.push('A escola está cadastrada, mas sem séries atendidas informadas no cadastro.');
    }
    if (gradesMissingInRegistry.length > 0) {
      schoolMessages.push(
        `Séries informadas na planilha que não constam no cadastro da escola: ${gradesMissingInRegistry.join(', ')}.`
      );
    }
  }

  const unlinkedAllowed = schoolUnits.length <= 1;
  const allClasses = [...classes, ...suggestedClasses];

  // 5. Linhas de alunos
  const students: ParsedImportStudent[] = [];
  // O arquivo pode ter VÁRIAS tabelas (uma por série): cada novo cabeçalho troca a série atual
  let activeMap: Record<string, number> = colMap;
  let currentSeries = tableSeries;
  const sections: Array<{ series: string; count: number; header: string }> = [];
  const startSection = (series: string, header: string) => {
    sections.push({ series: series || 'Série não identificada', count: 0, header: header.replace(/\s+/g, ' ').trim() });
  };
  startSection(currentSeries, firstColRawHeader);

  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const row = matrix[r] || [];
    if (row.every((c) => !c && c !== 0)) continue;

    const cellsUpper = row.map((c) => stripAccentsUpper(c).replace(/\s+/g, ' ').trim());
    const nonEmpty = cellsUpper.filter(Boolean);

    // a) Novo cabeçalho de tabela (ex: "1º ANO Nº | NOME COMPLETO DO ALUNO | ...")
    const isHeaderRow = cellsUpper.some(
      (c) => c.includes('NOME COMPLETO') || c.includes('NOME DO ALUNO') || c.includes('NOME DO ESTUDANTE') || c === 'NOME'
    );
    if (isHeaderRow) {
      const newHeaders = row.map((c) => String(c ?? '').trim());
      const newMap = mapColumnsByHeader(newHeaders);
      checkColumnsLeftToRight(newHeaders, newMap, matrix, r);
      activeMap = newMap;
      const hdrIdx = newMap.seq ?? newMap.series ?? 0;
      const parsed = extractSeriesFromFirstColumnHeader(newHeaders[hdrIdx] || '');
      if (filters.extractSeriesFromFirstColumn !== false && parsed.known && parsed.series) {
        currentSeries = parsed.series;
      }
      startSection(currentSeries, newHeaders[hdrIdx] || '');
      continue;
    }

    // b) Linhas de identificação repetidas (ESCOLA / DATA / TURMA / título) não são alunos
    const joined = nonEmpty.join(' | ');
    if (/(^|\|\s)(ESCOLA(\s+ANEXO)?|DATA|TURMAS?)\s*:|LEVANTAMENTO DO QUANTITATIVO/.test(joined)) {
      const turmaLine = joined.match(/TURMAS?\s*:\s*(.+?)(?=\s*\|?\s*(?:DATA|ESCOLA)\s*:|\s*\||$)/);
      if (turmaLine) {
        const g = extractSchoolGradesServed(turmaLine[1]).expandedGrades;
        if (g.length === 1) currentSeries = g[0];
      }
      continue;
    }

    // c) Título de seção com a série sozinha (ex: linha "3º ANO")
    const nameCell = activeMap.name !== undefined ? cleanPlaceholder(row[activeMap.name]) : '';
    if (!nameCell && nonEmpty.length <= 2) {
      const parsed = extractSeriesFromFirstColumnHeader(nonEmpty.join(' '));
      if (parsed.known && parsed.series) {
        currentSeries = parsed.series;
        startSection(currentSeries, nonEmpty.join(' '));
      }
      continue;
    }

    const rawName = activeMap.name !== undefined ? row[activeMap.name] : row[1] || row[0];
    const name = cleanPlaceholder(rawName).replace(/\s+/g, ' ');

    if (!name || /TOTAL|COORDENADOR|DIRETOR|OBSERVA|ASSINATURA|SECRETARI[OA]\b/i.test(name)) {
      continue;
    }

    const pcdNameRegex = /[\s\-_–—]+PCD\b/i;
    const hasPcdInName = pcdNameRegex.test(name);
    const cleanName = name.replace(pcdNameRegex, '').trim();

    let rawSeq = activeMap.seq !== undefined ? row[activeMap.seq] : row[0];
    const rawBirth = activeMap.birthDate !== undefined ? row[activeMap.birthDate] : '';
    const rawGender = activeMap.gender !== undefined ? row[activeMap.gender] : '';
    const rawRace = activeMap.race !== undefined ? row[activeMap.race] : '';
    const rawAddr = activeMap.address !== undefined ? row[activeMap.address] : '';
    const rawShift = activeMap.shift !== undefined ? row[activeMap.shift] : '';
    const rawSeries = activeMap.series !== undefined ? row[activeMap.series] : '';
    const rawPcd = activeMap.pcd !== undefined ? row[activeMap.pcd] : '';
    const rawTea = activeMap.tea !== undefined ? row[activeMap.tea] : '';
    const rawLaudo = activeMap.laudo !== undefined ? row[activeMap.laudo] : '';

    // Série na própria linha (ex: "PRÉ II - 1")
    let rowSeriesParsed = '';
    const seriesColVal = cleanPlaceholder(rawSeries);
    if (seriesColVal) {
      const parsedCol = extractSeriesFromFirstColumnHeader(seriesColVal);
      if (parsedCol.known && parsedCol.series) rowSeriesParsed = parsedCol.series;
      if (parsedCol.studentNumber && (!rawSeq || rawSeq === rawSeries)) rawSeq = parsedCol.studentNumber;
    }

    const parsedDate = parseFlexibleDate(rawBirth);
    const gender = parseGender(rawGender);
    const race = parseRaceColor(rawRace);
    const address = cleanPlaceholder(rawAddr);

    let pcdDesc = cleanPlaceholder(rawPcd);
    if (!pcdDesc && hasPcdInName) pcdDesc = 'PCD Identificado no Levantamento';

    const teaStr = cleanPlaceholder(rawTea).toLowerCase();
    const isTea = teaStr === 'sim' || teaStr === 's' || /\bTEA\b|AUTISMO/i.test(pcdDesc) || /\bTEA\b|AUTISMO/i.test(name);
    const isPcd = Boolean(pcdDesc || hasPcdInName || isTea);

    let laudoInfo = parseMedicalReport(rawLaudo);
    if (/sem laudo|suspeita/i.test(pcdDesc)) {
      laudoInfo = { hasReport: false, text: 'Suspeita sem laudo' };
    } else if (/TEA\s*[–-]\s*Nível/i.test(pcdDesc) && !cleanPlaceholder(rawLaudo)) {
      laudoInfo = { hasReport: true, text: 'SIM' };
    }

    const shift = cleanPlaceholder(rawShift) || filters.defaultShift || 'MANHÃ';

    // Série do aluno: padrão forçado > série da linha > série da tabela (1ª coluna) > padrão
    let finalSeries = '';
    let seriesByDefault = false;
    if (filters.overrideSeriesWithDefault && filters.defaultSeries) {
      finalSeries = canonicalGrade(filters.defaultSeries);
    } else if (rowSeriesParsed) {
      finalSeries = rowSeriesParsed;
    } else if (currentSeries) {
      finalSeries = currentSeries;
    } else {
      finalSeries = canonicalGrade(filters.defaultSeries || 'PRÉ I');
      seriesByDefault = true;
    }

    const pendingFields: string[] = [];
    if (!parsedDate.isValid || !parsedDate.isoDate) pendingFields.push('Data de Nascimento');
    if (!address) pendingFields.push('Endereço / Localidade');
    if (race === 'NAO_DECLARADA') pendingFields.push('Raça/Cor (Censo Escolar)');
    if (gender === 'OTHER') pendingFields.push('Sexo');
    if (isPcd && !laudoInfo.hasReport) pendingFields.push('Comprovação de Laudo Médico (PCD)');
    if (!cleanPlaceholder(rawLaudo) && !laudoInfo.hasReport) pendingFields.push('Avaliação de Laudo (SIM/NÃO)');
    if (seriesByDefault) pendingFields.push('Série (não identificada na planilha)');
    if (
      schoolStatus === 'CADASTRADA' &&
      gradesRegistered.length > 0 &&
      !gradesRegistered.some((g) => sameGrade(g, finalSeries))
    ) {
      pendingFields.push(`Série ${finalSeries} não consta nas séries atendidas da escola`);
    }
    pendingFields.push('CPF / Certidão de Nascimento');

    const cadastralStatus: CadastralStatus = pendingFields.length > 0 ? 'INCOMPLETE' : 'OK';

    students.push({
      tempId: `imp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      sequenceNumber: cleanPlaceholder(rawSeq) || String(students.length + 1),
      name,
      cleanName,
      birthDate: parsedDate.isoDate || '2020-01-01',
      formattedBirthDate: parsedDate.formatted || 'Não informada',
      gender,
      raceColor: race,
      address: address || 'Endereço pendente de cadastro',
      shift,
      series: finalSeries,
      seriesFromFirstCol: seriesFromFirstColumn,
      medicalClassification: pcdDesc || (isPcd ? 'PCD' : 'Não declarada'),
      isPcd,
      isTea,
      hasMedicalReport: laudoInfo.hasReport,
      medicalReportText: laudoInfo.text,
      schoolName: targetUnit?.name || schoolNameDetected || 'Escola não identificada',
      schoolUnitId: targetUnit?.id,
      cadastralStatus,
      pendingFields,
      sourceFileName: fileName,
      selectedForImport: true,
      rawRow: { rawSeq, rawName, rawBirth, rawGender, rawRace, rawAddr, rawPcd, rawTea, rawLaudo },
    });
    sections[sections.length - 1].count++;
  }

  // 6. Turmas: usa a turma da série na própria escola; se não existir, cria (escola cadastrada ou nova)
  const classesToCreate: string[] = [];
  if (targetUnit) {
    const unitPrefixes = [targetUnit.name, targetUnit.tradeName]
      .filter(Boolean)
      .map((n) => normalizeSchoolName(n));
    let renamed = 0;
    allClasses.forEach((c, idx) => {
      const belongs = c.schoolUnitId === targetUnit!.id || (!c.schoolUnitId && unlinkedAllowed);
      const nameNorm = normalizeSchoolName(c.name);
      const hasSchoolPrefix = unitPrefixes.some((pfx) => pfx && nameNorm.startsWith(`${pfx} `));
      if ((belongs || (!c.schoolUnitId && hasSchoolPrefix)) && hasSchoolPrefix) {
        const fixed = {
          ...c,
          name: `${canonicalGrade(c.gradeLevel) || c.gradeLevel} - ${c.shift || filters.defaultShift || 'MANHÃ'}`,
          schoolUnitId: targetUnit!.id,
        } as SchoolClass;
        allClasses[idx] = fixed;
        const at = suggestedClasses.findIndex((sc) => sc.id === fixed.id);
        if (at >= 0) suggestedClasses[at] = fixed;
        else suggestedClasses.push(fixed);
        renamed++;
      }
    });
    if (renamed > 0) {
      schoolMessages.push(`${renamed} turma(s) já existente(s) terão o nome ajustado para "SÉRIE - TURNO" (sem o nome da escola).`);
    }
    const seriesUsed = Array.from(new Set(students.map((s) => s.series)));
    seriesUsed.forEach((serie) => {
      const found = findClassForSeries(targetUnit!.id, serie, allClasses, unlinkedAllowed);
      if (!found && filters.autoRegisterSchoolUnit) {
        const cls = buildClassForSeries(targetUnit!, serie, filters.defaultShift || 'MANHÃ', suggestedClasses.length);
        suggestedClasses.push(cls);
        allClasses.push(cls);
      }
    });
    if (schoolStatus === 'CADASTRADA') {
      suggestedClasses
        .filter((c) => !classes.some((ex) => ex.id === c.id))
        .forEach((c) => classesToCreate.push(c.gradeLevel));
      if (classesToCreate.length > 0) {
        schoolMessages.push(`Turma(s) que será(ão) criada(s) na escola: ${classesToCreate.join(', ')}.`);
      }
    }
  }

  students.forEach((std) => {
    const cls = findClassForSeries(std.schoolUnitId, std.series, allClasses, unlinkedAllowed);
    if (cls) {
      std.classId = cls.id;
      std.className = cls.name;
    } else {
      std.classId = undefined;
      std.className = `${std.series} (sem turma)`;
      if (!std.pendingFields.includes('Turma (enturmação)')) std.pendingFields.push('Turma (enturmação)');
      std.cadastralStatus = 'INCOMPLETE';
    }
  });

  if (students.length === 0) {
    errors.push('Nenhum aluno encontrado abaixo do cabeçalho da tabela.');
  }
  const usedSections = sections.filter((sec) => sec.count > 0);
  if (students.some((st) => st.pendingFields.includes('Série (não identificada na planilha)'))) {
    warnings.push(
      'Não foi possível identificar a série de uma ou mais tabelas pelo cabeçalho da 1ª coluna (ex: "PRÉ II Nº"). Confira a série desses alunos.'
    );
  }

  if (schoolStatus === 'CADASTRADA' && gradesRegistered.length > 0) {
    const notServed = Array.from(new Set(usedSections.map((sec) => sec.series))).filter(
      (serie) => !gradesRegistered.some((g) => sameGrade(g, serie))
    );
    if (notServed.length > 0) {
      schoolMessages.push(`Séries com alunos na planilha que a escola não atende no cadastro: ${notServed.join(', ')}.`);
    }
  }

  const schoolCheck: SchoolCheckResult = {
    isAnnex,
    parentUnitName: isAnnex ? context.parentUnit?.name : undefined,
    status: schoolStatus,
    detectedName: schoolNameDetected,
    unitId: targetUnit?.id,
    unitName: targetUnit?.name,
    gradesInFile,
    gradesRegistered,
    gradesMissingInRegistry,
    tableSeries: tableSeries || undefined,
    tableSeriesServed: tableSeries ? gradesRegistered.some((g) => sameGrade(g, tableSeries)) : undefined,
    classesToCreate,
    messages: schoolMessages,
  };

  return {
    fileName,
    fileSize,
    schoolNameDetected,
    seriesDetected: tableSeries || undefined,
    firstColumnHeaderDetected: firstColRawHeader,
    seriesFromFirstColumn,
    dateDetected,
    gradesServedDetectedText: gradesServedText || targetUnit?.gradesServedText,
    expandedGradesDetected: gradesInFile.length > 0 ? gradesInFile : targetUnit?.gradesServed,
    suggestedSchoolUnit: targetUnit,
    suggestedClasses,
    totalRows: students.length,
    students,
    completeCount: students.filter((s) => s.cadastralStatus === 'OK').length,
    incompleteCount: students.filter((s) => s.cadastralStatus !== 'OK').length,
    errors,
    tableSeries: tableSeries || undefined,
    columnReport,
    extraColumns,
    ignoredColumns,
    schoolCheck,
    warnings,
    sourceMatrix: matrix,
    sourceContext: context,
    sections: usedSections,
  };
}

// Processa objetos JSON brutos
function processRawRows(
  rows: any[],
  fileName: string,
  fileSize: number,
  filters: ImportFilterOptions,
  classes: SchoolClass[],
  schoolUnits: SchoolUnit[]
): FileImportResult {
  const students: ParsedImportStudent[] = [];
  rows.forEach((r, idx) => {
    const name = cleanPlaceholder(r.nome || r.name || r.aluno || r['Nome Completo'] || '');
    if (!name) return;

    const parsedDate = parseFlexibleDate(r.dataNascimento || r.birthDate || r['Data de Nascimento']);
    const pendingFields: string[] = [];
    if (!parsedDate.isValid) pendingFields.push('Data de Nascimento');
    if (!r.cpf) pendingFields.push('CPF do Aluno');
    if (!r.endereco && !r.address) pendingFields.push('Endereço');

    students.push({
      tempId: `imp-json-${idx}-${Date.now()}`,
      sequenceNumber: String(idx + 1),
      name,
      birthDate: parsedDate.isoDate || '2020-01-01',
      formattedBirthDate: parsedDate.formatted || 'Não informada',
      gender: parseGender(r.sexo || r.gender),
      raceColor: parseRaceColor(r.raca || r.raceColor || r.cor),
      address: cleanPlaceholder(r.endereco || r.address) || 'Endereço pendente',
      shift: r.turno || filters.defaultShift || 'MANHA',
      series: r.serie || r.turma || filters.defaultSeries || 'PRÉ II',
      medicalClassification: cleanPlaceholder(r.pcd || r.classificacaoMedica || ''),
      hasMedicalReport: Boolean(r.laudo || r.hasMedicalReport),
      medicalReportText: r.laudo ? 'SIM' : 'NÃO',
      schoolName: r.escola || 'Escola Importada',
      cadastralStatus: pendingFields.length > 0 ? 'INCOMPLETE' : 'OK',
      pendingFields,
      sourceFileName: fileName,
      rawRow: r,
    });
  });

  return {
    fileName,
    fileSize,
    totalRows: students.length,
    students,
    completeCount: students.filter((s) => s.cadastralStatus === 'OK').length,
    incompleteCount: students.filter((s) => s.cadastralStatus !== 'OK').length,
    errors: [],
  };
}

// Converte os estudantes parsed em instâncias oficiais do modelo Student do SucessoEdu
export function convertImportedStudentsToOfficial(
  importedList: ParsedImportStudent[],
  filters: ImportFilterOptions,
  classes: SchoolClass[],
  existingStudentsCount: number,
  targetSchoolUnit?: SchoolUnit,
  additionalClasses: SchoolClass[] = [],
  allSchoolUnits: SchoolUnit[] = [],
  existingStudents: Student[] = []
): Student[] {
  const nowIso = new Date().toISOString();
  const year = new Date().getFullYear();
  const allClasses = [...classes, ...additionalClasses];
  const units = targetSchoolUnit ? [...allSchoolUnits, targetSchoolUnit] : allSchoolUnits;

  // Apenas estudantes selecionados para importação
  const studentsToImport = importedList.filter((item) => item.selectedForImport !== false);

  // RA novo = próximo número livre acima do maior já usado (antes era quantidade + posição,
  // o que repetia RAs já existentes quando havia lacunas na numeração).
  const usedRas = new Set(existingStudents.map((s) => String(s?.enrollmentNumber || '').trim()).filter(Boolean));
  let nextRaNumber =
    Math.max(
      existingStudentsCount,
      ...Array.from(usedRas).map((r) => {
        const m = r.match(/^RA-\d{4}-(\d+)$/);
        return m ? parseInt(m[1], 10) : 0;
      })
    ) + 1;
  const takeNextRa = () => {
    let candidate = `RA-${year}-${String(nextRaNumber).padStart(4, '0')}`;
    while (usedRas.has(candidate)) {
      nextRaNumber++;
      candidate = `RA-${year}-${String(nextRaNumber).padStart(4, '0')}`;
    }
    usedRas.add(candidate);
    nextRaNumber++;
    return candidate;
  };

  return studentsToImport.map((item) => {
    // Aluno já cadastrado mantém o RA dele; só aluno novo recebe número
    const ra = findExistingStudent(item, existingStudents) ? '' : takeNextRa();

    const effectiveSeries = filters.importSeries
      ? (filters.overrideSeriesWithDefault && filters.defaultSeries
          ? filters.defaultSeries
          : item.series || item.seriesFromFirstCol || filters.defaultSeries || 'PRÉ-ESCOLA I')
      : undefined;

    // Cada aluno fica na escola identificada no SEU arquivo (não na do primeiro arquivo)
    const unitId = item.schoolUnitId || targetSchoolUnit?.id;
    const unit = units.find((u) => u.id === unitId);
    const matchedClass =
      (item.classId ? allClasses.find((c) => c.id === item.classId) : undefined) ||
      (effectiveSeries ? findClassForSeries(unitId, effectiveSeries, allClasses, units.length <= 1) : undefined);

    const finalSchoolName = filters.importSchoolUnit ? unit?.name || item.schoolName : '';

    // Nome final considerando limpeza de " - PCD"
    let finalName = item.name;
    if (filters.cleanPcdSuffixFromName !== false && item.cleanName) {
      finalName = item.cleanName;
    }
    if (!filters.importName) {
      finalName = 'Aluno Importado';
    }

    // Condições especiais (TEA / AEE)
    const specialConditions: SpecialConditionType[] = [];
    if (filters.importTea && item.isTea) {
      specialConditions.push('TEA');
    }
    if (filters.importPcd && item.isPcd && !item.isTea) {
      specialConditions.push('OUTRA');
    }

    const specialNeeds: string[] = [];
    if (filters.importPcd && item.medicalClassification && item.medicalClassification !== 'Não declarada') {
      specialNeeds.push(item.medicalClassification);
    }

    const officialStudent: Student = {
      id: `std-imp-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
      name: finalName,
      enrollmentNumber: ra,
      cpf: '000.000.000-00',
      birthDate: filters.importBirthDate ? item.birthDate : '2020-01-01',
      gender: filters.importGender ? item.gender : 'OTHER',
      raceColor: filters.importRaceColor ? item.raceColor : 'NAO_DECLARADA',
      address: filters.importAddress ? item.address : '',
      city: item.city || 'Belém',
      state: 'PA',
      zipCode: '66000-000',
      email: '',
      phone: '',
      guardianName: 'Pendente de Atualização Cadastral',
      guardianPhone: '',
      courseId: 'crs-infantil',
      schoolUnitId: unitId,
      classId: matchedClass?.id || 'cls-default',
      status: 'ACTIVE',
      cadastralStatus: item.cadastralStatus,
      entryDate: nowIso.split('T')[0],
      observations: `Importado de documento: ${item.sourceFileName}. Polo/Escola: ${finalSchoolName || item.schoolName}. Turno: ${item.shift || 'MANHÃ'}. Série: ${effectiveSeries || 'Não informada'}${item.isPcd ? ` | PCD: ${item.medicalClassification}` : ''}${item.isTea ? ' | TEA: SIM' : ''}${item.hasMedicalReport ? ' | Laudo: SIM' : ''}`,
      medicalObservations: filters.importPcd ? item.medicalClassification : undefined,
      medicalClassification: filters.importPcd ? item.medicalClassification : undefined,
      hasMedicalReport: filters.importMedicalReport ? item.hasMedicalReport : false,
      medicalReportText: filters.importMedicalReport ? item.medicalReportText : 'NÃO INFORMADO',
      specialConditions: specialConditions.length > 0 ? specialConditions : undefined,
      specialNeeds: specialNeeds.length > 0 ? specialNeeds : undefined,
      schoolOriginName: finalSchoolName,
      pendingFields: item.pendingFields,
      shift: filters.importShift ? item.shift : undefined,
      series: effectiveSeries,
      importedAt: nowIso,
    };

    // Aluno já cadastrado (mesmo nome e nascimento): ATUALIZA o cadastro em vez de duplicar.
    // Mantém id, matrícula, CPF, responsável e contatos; atualiza escola, turma, série e dados da planilha.
    const existing = findExistingStudent(item, existingStudents);
    if (existing) {
      const hasCpf = existing.cpf && existing.cpf !== '000.000.000-00';
      return {
        ...existing,
        name: officialStudent.name,
        birthDate: officialStudent.birthDate,
        gender: officialStudent.gender,
        raceColor: officialStudent.raceColor,
        address: officialStudent.address || existing.address,
        schoolUnitId: officialStudent.schoolUnitId,
        classId: officialStudent.classId,
        series: officialStudent.series,
        shift: officialStudent.shift,
        medicalObservations: officialStudent.medicalObservations,
        medicalClassification: officialStudent.medicalClassification,
        hasMedicalReport: officialStudent.hasMedicalReport,
        medicalReportText: officialStudent.medicalReportText,
        specialConditions: officialStudent.specialConditions,
        specialNeeds: officialStudent.specialNeeds,
        schoolOriginName: officialStudent.schoolOriginName,
        pendingFields: hasCpf
          ? officialStudent.pendingFields?.filter((f) => f !== 'CPF / Certidão de Nascimento')
          : officialStudent.pendingFields,
        importedAt: nowIso,
      } as Student;
    }

    return officialStudent;
  });
}

// Carrega amostra oficial municipal: EMEI RUTH PEREIRA BARBARESCO (Pré-Escola I A)
export function loadSampleRuthPereiraBarbaresco(
  filters: ImportFilterOptions,
  classes: SchoolClass[],
  schoolUnits: SchoolUnit[]
): FileImportResult {
  const res = processSheetWithHeaders(
    OFFICIAL_MUNICIPAL_SAMPLE_DATA,
    'Levantamento_EMEI_Ruth_Pereira_Barbaresco.xlsx',
    34816,
    filters,
    classes,
    schoolUnits
  );
  res.documentType = 'EXCEL';
  return res;
}

// Carrega amostra municipal de 8 colunas: EMIEIF ERMINIO BRITO (Pré II, 1º ao 5º, 6º ao 9º Anos)
export function loadSampleErminioBrito8Col(
  filters: ImportFilterOptions,
  classes: SchoolClass[],
  schoolUnits: SchoolUnit[]
): FileImportResult {
  const res = processSheetWithHeaders(
    OFFICIAL_ERMINIO_BRITO_8COL_DATA,
    'Levantamento_EMIEIF_Erminio_Brito_8Colunas.xlsx',
    38912,
    filters,
    classes,
    schoolUnits
  );
  res.documentType = 'EXCEL';
  return res;
}

// Gera o modelo Excel fiel ao print anexo pelo usuário ("ESCOLA: MARIA DA PRAIA")
export function generateOfficialTemplateXlsx(): void {
  downloadSpreadsheetTemplate('xlsx');
}

export {
  downloadSpreadsheetTemplate,
  downloadWordTemplate,
  downloadWriterTemplate,
};
