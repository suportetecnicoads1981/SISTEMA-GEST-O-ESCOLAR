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
  downloadSpreadsheetTemplate,
  downloadWordTemplate,
  downloadWriterTemplate,
} from './officeDocumentParser';
import { provisionalRaFor } from './raService';

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
  classLetter?: string; // Letra da turma (ex: "A" em "1º ANO A" ou "TURMA: PRÉ-ESCOLA I A")
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
  schoolFicha?: SchoolFicha; // Ficha da escola lida da aba "DADOS DA ESCOLA"
  fichaUpdatesRegisteredUnit?: boolean; // A ficha completa o cadastro de uma escola que já existe
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
  schoolName?: string; // Nome do bloco quando a linha não tem "ESCOLA:" (ex: linha "ANEXO NGÔNH-RE")
  ficha?: SchoolFicha; // Ficha da escola (aba "DADOS DA ESCOLA" da planilha padrão)
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
  return canonicalSchoolAcronyms(
    stripAccentsUpper(val)
      .replace(/^\s*(ESCOLA|UNIDADE ESCOLAR|POLO)\s*:\s*/, '')
      .replace(/[^A-Z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * A mesma escola aparece escrita de jeitos diferentes nos levantamentos:
 * "EMEIF NOVA VIDA", "E.M.E.I.F NOVA VIDA", "ESCOLA MUNICIPAL DE ENSINO INFANTIL E FUNDAMENTAL NOVA VIDA"
 * ou "MUNICIPAL DE ENSINO INFANTIL E FUNDAMENTAL NOVA VIDA". Tudo vira a sigla, para comparar.
 */
function canonicalSchoolAcronyms(name: string): string {
  const s = ` ${name} `
    // Siglas com pontos (E.M.E.I.F -> "E M E I F" depois de tirar a pontuação)
    .replace(/ E M I E I F /g, ' EMIEIF ')
    .replace(/ E M E I F /g, ' EMEIF ')
    .replace(/ E M E F /g, ' EMEF ')
    .replace(/ E M E I /g, ' EMEI ')
    // Nomes por extenso (do mais longo para o mais curto)
    .replace(/ (ESCOLA )?MUNICIPAL (DE )?(ENSINO|EDUCACAO) INFANTIL E (ENSINO )?FUNDAMENTAL /g, ' EMEIF ')
    .replace(/ ESCOLA MUNICIPAL (DE )?(ENSINO )?FUNDAMENTAL /g, ' EMEF ')
    .replace(/ ESCOLA MUNICIPAL (DE )?(ENSINO|EDUCACAO) INFANTIL /g, ' EMEI ');
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Letra da turma escrita logo depois da série: "1º ANO A", "3 ANO B", "PRÉ-ESCOLA I C",
 * "PRÉ II - D". Devolve '' quando não houver letra (ex: "PRÉ II Nº", "1º ANO - MANHÃ").
 */
export function extractClassLetter(text: any): string {
  const t = stripAccentsUpper(text).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
  const m = t.match(
    /(?:PRE[\s\-_–—]*(?:ESCOLA[\s\-_–—]*)?(?:II|I(?!I)|1|2)|\d{1,2}\s*[º°ªO]?\s*(?:ANOS?|SERIES?)|MATERNAL(?:[\s\-_–—]*(?:II|I(?!I)))?|JARDIM(?:[\s\-_–—]*(?:II|I(?!I)))?|BERCARIO(?:[\s\-_–—]*(?:II|I(?!I)))?)(?:\s+|\s*[\-–—]\s*)(?:TURMA\s+)?([A-J])(?![A-Z0-9])/
  );
  return m ? m[1] : '';
}

/** Letra da turma cadastrada (pelo nome da turma, ex: "1º ANO A - MANHÃ"). */
function classLetterOf(c: SchoolClass): string {
  return extractClassLetter(c?.name || '');
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
  // 1º: nome escrito igual (sem acentos/pontuação); 2º: mesmo nome com as siglas unificadas (EMEIF = por extenso)
  const plain = (v: any) => stripAccentsUpper(v).replace(/^\s*(ESCOLA|UNIDADE ESCOLAR|POLO)\s*:\s*/, '').replace(/[^A-Z0-9]+/g, '');
  const plainTarget = plain(name);
  const literal = units.find((u) => plain(u.name) === plainTarget || (u.tradeName && plain(u.tradeName) === plainTarget));
  if (literal) return literal;
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
  allowUnlinkedClasses = false,
  classLetter = '',
  /** true: aluno sem letra só vai para turma sem letra (nunca "pega" a turma A, B...). */
  strictNoLetter = false
): SchoolClass | undefined {
  if (!series) return undefined;
  const letter = String(classLetter || '').toUpperCase();
  const sameSeries = (c: SchoolClass) => sameGrade(c.gradeLevel, series) || sameGrade(c.name, series);
  // Com letra (turma A, B, C...): só a turma daquela letra. Sem letra: prefere a turma sem letra.
  const pick = (list: SchoolClass[]) => {
    const candidates = list.filter(sameSeries);
    if (letter) return candidates.find((c) => classLetterOf(c) === letter);
    const noLetter = candidates.find((c) => !classLetterOf(c));
    return strictNoLetter ? noLetter : noLetter || candidates[0];
  };
  if (unitId) {
    const inUnit = pick(classes.filter((c) => c.schoolUnitId === unitId));
    if (inUnit) return inUnit;
  }
  if (allowUnlinkedClasses || !unitId) {
    return pick(classes.filter((c) => !c.schoolUnitId));
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
      regex: /\bPR[EÉ][\s\-_–—]*ESCOLA[\s\-_–—]*(?:II|2)\b/i,
      format: () => 'PRÉ II',
    },
    {
      regex: /\bPR[EÉ][\s\-_–—]*ESCOLA[\s\-_–—]*(?:I|1)\b/i,
      format: () => 'PRÉ I',
    },
    {
      regex: /\bPR[EÉ][\s\-_–—]*(?:II|2)\b/i,
      format: () => 'PRÉ II',
    },
    {
      regex: /\bPR[EÉ][\s\-_–—]*(?:I|1)\b/i,
      format: () => 'PRÉ I',
    },
    {
      regex: /\bPR[EÉ][\s\-_–—]*ESCOLA\b/i,
      format: () => 'PRÉ-ESCOLA',
    },
    {
      regex: /\b(\d{1,2})\s*[º°ªaAoO]?\s*(?:ANOS?|S[EÉ]RIES?)\b/i,
      format: (m) => `${m[1]}º ANO`,
    },
    {
      regex: /\bMATERNAL[\s\-_–—]*(?:II|2)\b/i,
      format: () => 'MATERNAL II',
    },
    {
      regex: /\bMATERNAL[\s\-_–—]*(?:I|1)\b/i,
      format: () => 'MATERNAL I',
    },
    {
      regex: /\bMATERNAL\b/i,
      format: () => 'MATERNAL',
    },
    {
      regex: /\bBER[CÇ][AÁ]RIO[\s\-_–—]*(?:II|2)\b/i,
      format: () => 'BERÇÁRIO II',
    },
    {
      regex: /\bBER[CÇ][AÁ]RIO[\s\-_–—]*(?:I|1)\b/i,
      format: () => 'BERÇÁRIO I',
    },
    {
      regex: /\bBER[CÇ][AÁ]RIO\b/i,
      format: () => 'BERÇÁRIO',
    },
    {
      regex: /\bJARDIM[\s\-_–—]*(?:II|2)\b/i,
      format: () => 'JARDIM II',
    },
    {
      regex: /\bJARDIM[\s\-_–—]*(?:I|1)\b/i,
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
  roomIndex = 0,
  classLetter = ''
): SchoolClass {
  // Nome da turma = série + letra (se houver) + turno (a escola já fica no vínculo schoolUnitId)
  const letter = String(classLetter || '').toUpperCase();
  return {
    id: `class-${unit.id}-${stripAccentsUpper(serie).toLowerCase().replace(/[^a-z0-9]+/g, '-')}${letter ? `-${letter.toLowerCase()}` : ''}`,
    name: `${serie}${letter ? ` ${letter}` : ''} - ${defaultShift}`,
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
    // (nome normalizado: "E.M.E.I.F X" e "ESCOLA MUNICIPAL DE ENSINO INFANTIL E FUNDAMENTAL X" dão o mesmo id)
    id: `unit-imp-${normalizeSchoolName(cleanSchoolName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
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
export function cleanPlaceholder(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (/^[\*\-\_\.\?]+$/.test(str) || str.toUpperCase() === 'N/A' || str.toUpperCase() === 'NI') {
    return '';
  }
  return str;
}

// Normaliza data de nascimento (ex: 25/08/2021 ou número de série do Excel)
export function parseFlexibleDate(val: any): { isoDate: string; formatted: string; isValid: boolean } {
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

// ===================== Conferências da data de nascimento =====================

/** Ano mínimo aceito como data de nascimento (antes disso é erro de digitação, ex.: 1018). */
export const MIN_BIRTH_YEAR = 1920;

/** Data de nascimento impossível: fora do calendário, antes de 1920 ou no futuro. */
export function isImpossibleBirthDate(isoDate: string, today = new Date()): boolean {
  const m = String(isoDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return true;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return true; // ex.: 31/02
  if (y < MIN_BIRTH_YEAR) return true;
  return dt.getTime() > today.getTime();
}

/** Idade esperada na série (em 31/03 do ano letivo). null = série sem idade de referência (creche, EJA...). */
export function expectedAgeForGrade(serie: string): number | null {
  const g = canonicalGrade(serie);
  if (g === 'PRÉ I') return 4;
  if (g === 'PRÉ II') return 5;
  const m = g.match(/^(\d{1,2})º ANO$/);
  if (m) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 9) return n + 5;
  }
  return null;
}

/** Idade na data de corte do Censo (31/03 do ano letivo). */
export function ageAtSchoolCutoff(isoDate: string, schoolYear = new Date().getFullYear()): number | null {
  const m = String(isoDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  let age = schoolYear - y;
  if (mo > 3 || (mo === 3 && d > 31)) age -= 1;
  return age;
}

/** Pendência de conferência quando a idade não combina com a série. */
export const AGE_GRADE_PENDING = 'Conferir data de nascimento / série';
/** Prefixo da pendência de aluno que aparece mais de uma vez no mesmo arquivo. */
export const DUPLICATE_PENDING_PREFIX = 'Possível cadastro duplicado';
/** Aluno que a planilha traz, mas que já está matriculado em OUTRA escola (fica onde está, com esta pendência). */
export const OTHER_SCHOOL_PENDING_PREFIX = 'Matrícula em duas escolas';

/** Aluno já cadastrado que pertence a outra escola (a importação não o transfere sozinha). */
export function isEnrolledInOtherSchool(existing: Pick<Student, 'schoolUnitId'> | undefined, targetUnitId: string | undefined): boolean {
  const cur = String(existing?.schoolUnitId || '').trim();
  const dest = String(targetUnitId || '').trim();
  return !!cur && !!dest && cur !== dest;
}

/**
 * Idade muito fora da série: 2 ou mais anos MAIS NOVO que o esperado (quase sempre erro de
 * digitação na data ou na série) ou 6 ou mais anos mais velho (ex.: adulto no 9º ano, EJA).
 * Atraso escolar comum (1 a 5 anos) não vira pendência.
 */
export function isAgeFarFromGrade(isoDate: string, serie: string, schoolYear = new Date().getFullYear()): boolean {
  const expected = expectedAgeForGrade(serie);
  const age = ageAtSchoolCutoff(isoDate, schoolYear);
  if (expected === null || age === null) return false;
  return age <= expected - 2 || age >= expected + 6;
}

// ===================== Ficha da escola (aba "DADOS DA ESCOLA") =====================

/** Dados lidos da aba "DADOS DA ESCOLA" da planilha padrão. */
export interface SchoolFicha {
  name: string;
  tradeName?: string;
  inepCode?: string;
  cnpjOrDecree?: string;
  typeLabel?: string; // como escrito na ficha (ESCOLA POLO, ESCOLA ANEXA, ESCOLA RURAL, CRECHE...)
  parentName?: string; // escola sede (só para anexa)
  locationLabel?: string; // URBANA / RURAL
  address?: string;
  district?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  directorName?: string;
  coordinatorName?: string;
  secretaryName?: string;
  totalClassrooms?: number;
  operatingHours?: string;
  hasInternet?: boolean;
  shifts: string[]; // MANHÃ, TARDE, NOITE, INTEGRAL marcados com SIM
  grades: string[]; // séries marcadas com SIM (forma canônica)
}

const FICHA_LABELS: Array<{ key: keyof SchoolFicha; test: RegExp }> = [
  { key: 'name', test: /^NOME OFICIAL DA ESCOLA/ },
  { key: 'tradeName', test: /^NOME COMO A ESCOLA/ },
  { key: 'inepCode', test: /^CODIGO INEP/ },
  { key: 'cnpjOrDecree', test: /^CNPJ OU DECRETO/ },
  { key: 'typeLabel', test: /^TIPO DA UNIDADE/ },
  { key: 'parentName', test: /^ESCOLA SEDE/ },
  { key: 'locationLabel', test: /^LOCALIZACAO\b/ },
  { key: 'address', test: /^ENDERECO\b/ },
  { key: 'district', test: /^BAIRRO/ },
  { key: 'zipCode', test: /^CEP\b/ },
  { key: 'city', test: /^MUNICIPIO\b/ },
  { key: 'state', test: /^UF\b/ },
  { key: 'phone', test: /^TELEFONE\b/ },
  { key: 'email', test: /^E-?MAIL\b/ },
  { key: 'directorName', test: /^DIRETOR/ },
  { key: 'coordinatorName', test: /^COORDENADOR/ },
  { key: 'secretaryName', test: /^SECRETARIO/ },
  { key: 'operatingHours', test: /^HORARIO DE FUNCIONAMENTO/ },
];

const FICHA_SHIFTS = ['MANHÃ', 'TARDE', 'NOITE', 'INTEGRAL'];

/** A aba é a ficha da escola da planilha padrão? */
export function isSchoolFichaSheet(sheetName: string, rows: any[][]): boolean {
  if (/DADOS DA ESCOLA/.test(stripAccentsUpper(sheetName))) return true;
  return rows.slice(0, 12).some((r) => /^NOME OFICIAL DA ESCOLA/.test(stripAccentsUpper((r || [])[0]).trim()));
}

/**
 * Lê a ficha: rótulo na coluna A e valor na coluna C (modelo padrão SEMED).
 * Devolve null quando não há nome oficial da escola.
 */
export function parseSchoolFichaSheet(rows: any[][]): SchoolFicha | null {
  const ficha: SchoolFicha = { name: '', shifts: [], grades: [] };
  const valueOf = (row: any[]) => {
    const v = row[2];
    if (v === null || v === undefined) return '';
    return String(v).replace(/\s+/g, ' ').trim();
  };
  (rows || []).forEach((row) => {
    const r = row || [];
    const label = stripAccentsUpper(r[0]).replace(/\s+/g, ' ').replace(/\s*\*\s*$/, '').trim();
    if (!label) return;
    const value = valueOf(r);
    const yes = /^S(IM)?$/.test(stripAccentsUpper(value));

    // Turnos e séries: linha com o nome do turno/série e SIM ao lado
    const shift = FICHA_SHIFTS.find((s) => stripAccentsUpper(s) === label);
    if (shift) {
      if (yes) ficha.shifts.push(shift);
      return;
    }
    const grade = extractSeriesFromFirstColumnHeader(label);
    if (grade.known && grade.series && grade.series === canonicalGrade(label) && label.length <= 12) {
      if (yes && !ficha.grades.includes(grade.series)) ficha.grades.push(grade.series);
      return;
    }

    if (/^SALAS DE AULA/.test(label)) {
      const n = Number(String(r[2] ?? '').replace(/\D/g, ''));
      if (n > 0) ficha.totalClassrooms = n;
      return;
    }
    if (/^INTERNET/.test(label)) {
      if (value) ficha.hasInternet = yes;
      return;
    }
    const field = FICHA_LABELS.find((f) => f.test.test(label));
    if (field && value && !(ficha as any)[field.key]) (ficha as any)[field.key] = value;
  });
  if (!ficha.name) return null;
  ficha.name = ficha.name.toUpperCase();
  if (ficha.inepCode) ficha.inepCode = ficha.inepCode.replace(/\D/g, '');
  if (ficha.zipCode) {
    const cep = ficha.zipCode.replace(/\D/g, '');
    ficha.zipCode = cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : ficha.zipCode;
  }
  return ficha;
}

/**
 * Duas escolas com o mesmo nome oficial (ex.: E.M.E.F CASTRO ALVES, conhecida como "ESCOLA CASTRO",
 * e outra anexa conhecida como "ESCOLA CASTRO ALVES CANAÃ"): o nome de cadastro da segunda junta ao
 * nome oficial as palavras próprias do nome conhecido ("E.M.E.F CASTRO ALVES CANAÃ").
 * Devolve '' quando o nome conhecido não traz nenhuma palavra que diferencie.
 */
export function distinctSchoolName(official: string, known: string): string {
  const generic = new Set([
    'ESCOLA', 'MUNICIPAL', 'ESTADUAL', 'DE', 'DA', 'DO', 'DAS', 'DOS', 'E', 'ENSINO', 'FUNDAMENTAL', 'INFANTIL', 'EDUCACAO',
    'EMEF', 'EMEIF', 'EMEI', 'EMIEIF', 'EMIEI', 'UNIDADE', 'ESCOLAR', 'ANEXO', 'ANEXA', 'POLO', 'SALA', 'EXTENSAO',
  ]);
  const plainWord = (w: string) => stripAccentsUpper(w).replace(/[^A-Z0-9]/g, '');
  const officialWords = new Set(String(official || '').split(/[\s.\-]+/).map(plainWord).filter(Boolean));
  const extra = String(known || '')
    .toUpperCase()
    .split(/\s+/)
    .filter((w) => {
      const p = plainWord(w);
      return p && !officialWords.has(p) && !generic.has(p);
    });
  return extra.length ? `${String(official).trim().toUpperCase()} ${extra.join(' ')}` : '';
}

/** Id estável de uma escola pelo nome (o mesmo usado ao cadastrar pela importação). */
export function importedUnitIdForName(name: string): string {
  return `unit-imp-${normalizeSchoolName(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

function fichaUnitType(label: string | undefined): { type?: SchoolUnit['type']; isAnnex: boolean } {
  const t = stripAccentsUpper(label || '');
  if (!t) return { isAnnex: false };
  if (/ANEX|SATELIT/.test(t)) return { type: 'ESCOLA_SATELITE', isAnnex: true };
  if (/CRECHE|INFANTIL/.test(t)) return { type: 'CRECHE_INFANTIL', isAnnex: false };
  if (/RURAL/.test(t)) return { type: 'ESCOLA_RURAL', isAnnex: false };
  if (/POLO/.test(t)) return { type: 'ESCOLA_POLO', isAnnex: false };
  return { isAnnex: false };
}

/** Valor ainda provisório no cadastro (preenchido pela importação antiga ou vazio). */
function isPlaceholderValue(v: any): boolean {
  const s = stripAccentsUpper(v).trim();
  return !s || /PENDENTE|AGUARDANDO|POLO REMOTO|COORDENACAO POLO/.test(s) || /@EDUCACAO\.GOV\.BR$/.test(s);
}

/**
 * Aplica a ficha da escola ao cadastro.
 * - Escola nova: a ficha preenche tudo.
 * - Escola já cadastrada (onlyFillMissing): só completa os campos ainda vazios ou provisórios,
 *   sem apagar o que a secretaria já corrigiu à mão.
 * As pendências da escola passam a ser só o que continua faltando.
 */
export function applySchoolFicha(
  unit: SchoolUnit,
  ficha: SchoolFicha,
  schoolUnits: SchoolUnit[] = [],
  onlyFillMissing = false
): { unit: SchoolUnit; notes: string[] } {
  const notes: string[] = [];
  const next: any = { ...unit };
  const set = (key: keyof SchoolUnit, value: any) => {
    if (value === undefined || value === null || value === '') return;
    if (onlyFillMissing && !isPlaceholderValue(next[key])) return;
    next[key] = value;
  };

  const inepOk = /^\d{8}$/.test(ficha.inepCode || '');
  if (ficha.inepCode && !inepOk) notes.push(`Código INEP "${ficha.inepCode}" inválido na ficha (precisa ter 8 números).`);
  set('tradeName', ficha.tradeName);
  if (inepOk) set('inepCode', ficha.inepCode);
  set('cnpjOrDecree', ficha.cnpjOrDecree);
  set('address', ficha.address);
  set('district', ficha.district);
  set('zipCode', ficha.zipCode);
  set('city', ficha.city);
  set('state', ficha.state);
  set('phone', ficha.phone);
  set('email', ficha.email);
  set('directorName', ficha.directorName);
  set('coordinatorName', ficha.coordinatorName);
  set('secretaryName', ficha.secretaryName);
  set('operatingHours', ficha.operatingHours);
  if (ficha.totalClassrooms && (!onlyFillMissing || !next.totalClassrooms)) next.totalClassrooms = ficha.totalClassrooms;
  if (ficha.hasInternet !== undefined && !onlyFillMissing) next.hasInternet = ficha.hasInternet;
  const loc = stripAccentsUpper(ficha.locationLabel || '');
  if (loc && !onlyFillMissing) next.locationZone = /URBAN/.test(loc) ? 'ZONA_URBANA' : 'ZONA_RURAL';
  if (ficha.shifts.length > 0 && (!onlyFillMissing || !(next.offeredShifts || []).length)) next.offeredShifts = ficha.shifts;
  if (ficha.grades.length > 0 && (!onlyFillMissing || !(next.gradesServed || []).length)) {
    next.gradesServed = ficha.grades;
    next.gradesServedText = ficha.grades.join(', ');
  }

  // Tipo e vínculo de escola anexa
  const { type, isAnnex } = fichaUnitType(ficha.typeLabel);
  if (type && (!onlyFillMissing || next.createdViaImport)) next.type = type;
  if (isAnnex) {
    next.isAnnex = true;
    if (ficha.parentName) {
      const parent = findRegisteredSchoolUnit(ficha.parentName, schoolUnits);
      const parentId = parent?.id || importedUnitIdForName(ficha.parentName);
      if (parentId === next.id) {
        notes.push('A ficha indica a própria escola como escola sede; o vínculo de anexa não foi feito.');
      } else {
        next.parentUnitId = parentId;
        const parentName = parent?.name || ficha.parentName.toUpperCase();
        if (!next.tradeName || /\(ANEXO DE|\(ESCOLA ANEXA\)/i.test(next.tradeName)) next.tradeName = `${next.name} (Anexo de ${parentName})`;
        if (!parent) notes.push(`Escola sede "${parentName}" ainda não está cadastrada: importe também a planilha dela para completar o vínculo.`);
      }
    } else {
      notes.push('Escola anexa sem a escola sede informada na ficha.');
    }
  } else if (type && ficha.parentName) {
    notes.push(`A ficha informa escola sede (${ficha.parentName}), mas o tipo é "${ficha.typeLabel}". Para ser anexa, o tipo deve ser ESCOLA ANEXA.`);
  }

  // Pendências da escola: o que continua faltando depois da ficha
  const pending = schoolUnitPendings(next, isAnnex);
  next.pendingFields = pending;
  next.cadastralStatus = pending.length > 0 ? 'INCOMPLETE' : 'OK';
  return { unit: next as SchoolUnit, notes };
}

/** Pendências do cadastro da escola (o que ainda falta). Usado na importação e ao salvar o cadastro. */
export function schoolUnitPendings(unit: Partial<SchoolUnit>, isAnnex = !!unit?.isAnnex): string[] {
  const pending: string[] = [];
  if (!/^\d{8}$/.test(String(unit?.inepCode || ''))) pending.push('Código INEP Escolar');
  if (isPlaceholderValue(unit?.cnpjOrDecree)) pending.push('Ato de Autorização / Decreto');
  if (isPlaceholderValue(unit?.directorName)) pending.push('Nome do(a) Diretor(a)');
  if (isPlaceholderValue(unit?.phone)) pending.push('Telefone e Contato Oficial');
  if (isPlaceholderValue(unit?.address)) pending.push('Endereço Completo e CEP');
  if (isAnnex && !unit?.parentUnitId) pending.push('Escola sede (escola anexa)');
  return pending;
}

const SCHOOL_LINE_RE = /\bESCOLA(\s+ANEXO)?\s*:\s*(.+?)(?=\s*\|?\s*(?:TURMAS?|S[EÉ]RIES?|DATA)\s*:|\s*\||$)/i;

/**
 * Separa a matriz em blocos por escola. Um mesmo documento pode trazer a escola principal
 * e escolas anexas (linha "ESCOLA ANEXO: ..."), cada uma com suas tabelas por série.
 * Linhas "ESCOLA:" repetidas da mesma escola (ex: a cada página) ficam no mesmo bloco.
 */
// Linha sozinha que abre uma escola anexa sem "ESCOLA:" (ex: "ANEXO NGÔNH-RE", "ESCOLA ANEXO - SÃO JOSÉ")
const ANNEX_ONLY_LINE_RE = /^\s*(?:ESCOLA\s+)?ANEXOS?\s*[:\-–—]?\s+(.{3,80})$/i;

export function splitMatrixBySchool(
  matrix: any[][]
): Array<{ matrix: any[][]; schoolName: string; isAnnex: boolean; displayName?: string }> {
  const starts: Array<{ index: number; name: string; isAnnex: boolean; displayName: string }> = [];
  matrix.forEach((row, i) => {
    const cells = (row || []).map((c) => String(c ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean);
    const text = cells.join(' | ');
    const m = text.match(SCHOOL_LINE_RE);
    let rawName = '';
    let isAnnex = false;
    if (m && m[2].trim()) {
      rawName = m[2].trim();
      isAnnex = !!m[1];
    } else if (cells.length === 1) {
      const a = cells[0].match(ANNEX_ONLY_LINE_RE);
      if (a && !/\b(LAUDO|NOME|ALUNO|TOTAL)\b/i.test(a[1])) {
        rawName = a[1].trim();
        isAnnex = true;
      }
    }
    if (rawName) {
      const name = normalizeSchoolName(rawName);
      const last = starts[starts.length - 1];
      if (!last || last.name !== name || last.isAnnex !== isAnnex) {
        starts.push({ index: i, name, isAnnex, displayName: rawName.toUpperCase() });
      }
    }
  });
  if (starts.length <= 1) {
    return [{ matrix, schoolName: starts[0]?.name || '', isAnnex: !!starts[0]?.isAnnex, displayName: starts[0]?.displayName }];
  }
  return starts.map((st, i) => ({
    matrix: matrix.slice(i === 0 ? 0 : st.index, starts[i + 1] ? starts[i + 1].index : matrix.length),
    schoolName: st.name,
    isAnnex: st.isAnnex,
    displayName: st.displayName,
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
  documentType: FileImportResult['documentType'],
  ficha: SchoolFicha | null = null
): FileImportResult[] {
  const blocks = splitMatrixBySchool(matrix);
  const results: FileImportResult[] = [];
  let parentUnit: SchoolUnit | undefined;
  // A ficha vale para o bloco da mesma escola; com um bloco só, vale para ele
  const fichaKey = ficha ? normalizeSchoolName(ficha.name) : '';
  const fichaBlock = ficha
    ? blocks.length === 1
      ? 0
      : Math.max(0, blocks.findIndex((b) => !!b.schoolName && b.schoolName === fichaKey))
    : -1;
  blocks.forEach((block, idx) => {
    const res = processSheetWithHeaders(block.matrix, fileName, fileSize, filters, classes, schoolUnits, {
      isAnnex: block.isAnnex,
      parentUnit: block.isAnnex ? parentUnit : undefined,
      schoolName: block.isAnnex ? block.displayName : undefined,
      ficha: idx === fichaBlock && ficha ? ficha : undefined,
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
    let ficha: SchoolFicha | null = null;
    wb.SheetNames.forEach((name) => {
      const rows = XLSX.utils.sheet_to_json<any>(wb.Sheets[name], { header: 1, defval: '' });
      if (rows.length === 0) return;
      // Aba "DADOS DA ESCOLA" (planilha padrão): é a ficha da escola, não tem alunos
      if (isSchoolFichaSheet(name, rows)) {
        ficha = ficha || parseSchoolFichaSheet(rows);
        return;
      }
      allRows.push(...rows, []);
    });
    const docType = ext === 'ods' ? 'CALC' : ext === 'xls' || ext === 'xlsx' ? 'EXCEL' : 'GENERIC';
    return processMatrixBlocks(allRows, fileName, fileSize, filters, classes, schoolUnits, docType, ficha);
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

    // Deficiências adicionais (planilha padrão v2: "DEFICIÊNCIA ADICIONAL 1" e "2")
    if (/DEFICIENCIA ADICIONAL|OUTRA DEFICIENCIA|DEFICIENCIA SECUNDARIA/.test(norm)) {
      if (colMap.pcdExtra1 === undefined) colMap.pcdExtra1 = idx;
      else if (colMap.pcdExtra2 === undefined) colMap.pcdExtra2 = idx;
      return;
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
  const extraLabels: Record<string, string> = {
    tea: 'TEA',
    shift: 'Turno',
    series: 'Série do aluno',
    pcdExtra1: 'Deficiência adicional 1',
    pcdExtra2: 'Deficiência adicional 2',
  };
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

  // Bloco de escola anexa aberto por uma linha "ANEXO ..." (sem "ESCOLA:")
  if (!schoolNameDetected && context.schoolName) {
    schoolNameDetected = context.schoolName;
    if (context.isAnnex) isAnnex = true;
  }
  // Planilha padrão: sem a linha "ESCOLA:" (ex.: fórmula sem valor salvo), o nome vem da ficha
  const ficha = context.ficha;
  if (!schoolNameDetected && ficha) schoolNameDetected = ficha.name;

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
  let tableLetter = '';
  if (filters.extractSeriesFromFirstColumn !== false && seriesFromFirstColumn) {
    tableSeries = seriesFromFirstColumn;
    tableLetter = extractClassLetter(firstColRawHeader);
  } else if (gradesInFile.length === 1) {
    tableSeries = gradesInFile[0];
    tableLetter = extractClassLetter(gradesServedText);
  }

  // 4. Escola: confere com o cadastro
  const selectedUnit = filters.selectedSchoolUnitId
    ? schoolUnits.find((u) => u.id === filters.selectedSchoolUnitId || u.name === filters.selectedSchoolUnitId)
    : undefined;
  let registeredUnit = schoolNameDetected ? findRegisteredSchoolUnit(schoolNameDetected, schoolUnits) : undefined;
  // Mesmo nome oficial, mas a ficha traz outro nome conhecido que o da escola já cadastrada:
  // é outra escola (ex.: segunda anexa da mesma sede) e não pode juntar os alunos com a primeira.
  let unitsForNewSchool = schoolUnits;
  if (!selectedUnit && registeredUnit && ficha?.tradeName) {
    const own = String(registeredUnit.tradeName || '').trim();
    const ownIsReal =
      !!own && !/\(ANEXO DE|\(ESCOLA ANEXA\)/i.test(own) && normalizeSchoolName(own) !== normalizeSchoolName(registeredUnit.name);
    const knownDiffers = ownIsReal && normalizeSchoolName(own) !== normalizeSchoolName(ficha.tradeName);
    const distinct = knownDiffers ? distinctSchoolName(registeredUnit.name, ficha.tradeName) : '';
    if (distinct && normalizeSchoolName(distinct) !== normalizeSchoolName(registeredUnit.name)) {
      const sameName = registeredUnit;
      warnings.push(
        `Já existe a escola "${sameName.name}", conhecida como "${own}". Pelo nome conhecido da ficha ("${ficha.tradeName}"), esta planilha é de outra escola e entra como "${distinct}".`
      );
      schoolNameDetected = distinct;
      registeredUnit = schoolUnits.find((u) => normalizeSchoolName(u.name) === normalizeSchoolName(distinct));
      unitsForNewSchool = schoolUnits.filter((u) => u.id !== sameName.id);
    }
  }
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
        unitsForNewSchool,
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

  // Ficha da escola (aba "DADOS DA ESCOLA"): INEP, decreto, equipe, endereço, turnos, séries e vínculo de anexa.
  // Escola nova: a ficha preenche o cadastro. Escola já cadastrada: só completa o que estiver vazio ou provisório.
  let fichaUpdatesRegisteredUnit = false;
  const fichaMatchesUnit =
    !!ficha && !!targetUnit && (!selectedUnit || findRegisteredSchoolUnit(ficha.name, [targetUnit])?.id === targetUnit.id);
  if (ficha && targetUnit && fichaMatchesUnit) {
    const registered = schoolStatus === 'CADASTRADA';
    const { unit, notes } = applySchoolFicha(targetUnit, ficha, schoolUnits, registered);
    targetUnit = unit;
    if (unit.isAnnex) isAnnex = true;
    fichaUpdatesRegisteredUnit = registered;
    if (!registered) {
      // Com a ficha, a escola nova não fica "pendente de complementação" (só o que faltar na ficha)
      const at = schoolMessages.findIndex((m) => /não está cadastrada\. Ela será cadastrada/.test(m));
      if (at >= 0) schoolMessages[at] = `A escola "${schoolNameDetected}" não está cadastrada e será cadastrada com os dados da ficha.`;
    }
    schoolMessages.push(
      registered
        ? 'Ficha da escola (aba "DADOS DA ESCOLA") lida: os campos ainda vazios ou provisórios do cadastro serão completados.'
        : 'Ficha da escola (aba "DADOS DA ESCOLA") lida: INEP, decreto, equipe, endereço, turnos e séries entram no cadastro.'
    );
    if (unit.isAnnex && unit.parentUnitId) {
      const parent = schoolUnits.find((u) => u.id === unit.parentUnitId);
      schoolMessages.push(`Escola anexa de ${parent?.name || ficha.parentName?.toUpperCase() || 'escola sede'}.`);
    }
    if ((unit.pendingFields || []).length > 0) {
      schoolMessages.push(`Pendências da escola que continuam: ${(unit.pendingFields || []).join(', ')}.`);
    }
    notes.forEach((n) => warnings.push(n));
  } else if (ficha && targetUnit && !fichaMatchesUnit) {
    warnings.push(`A ficha da escola é de "${ficha.name}", diferente do destino selecionado; a ficha não foi aplicada.`);
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
  let currentLetter = tableLetter;
  const sections: Array<{ series: string; count: number; header: string }> = [];
  const startSection = (series: string, header: string) => {
    const label = series ? `${series}${currentLetter ? ` ${currentLetter}` : ''}` : 'Série não identificada';
    sections.push({ series: label, count: 0, header: header.replace(/\s+/g, ' ').trim() });
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
        // A série veio do cabeçalho da tabela: a letra (se houver) também vem dele ("1º ANO B Nº")
        currentLetter = extractClassLetter(newHeaders[hdrIdx] || '');
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
        if (g.length === 1) {
          currentSeries = g[0];
          currentLetter = extractClassLetter(turmaLine[1]); // "TURMA: PRÉ-ESCOLA I B"
        }
      }
      continue;
    }

    // c) Título de seção com a série sozinha (ex: linha "3º ANO")
    const nameCell = activeMap.name !== undefined ? cleanPlaceholder(row[activeMap.name]) : '';
    if (!nameCell && nonEmpty.length <= 2) {
      const parsed = extractSeriesFromFirstColumnHeader(nonEmpty.join(' '));
      if (parsed.known && parsed.series) {
        currentSeries = parsed.series;
        currentLetter = extractClassLetter(nonEmpty.join(' '));
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
    let rowLetter = '';
    const seriesColVal = cleanPlaceholder(rawSeries);
    if (seriesColVal) {
      const parsedCol = extractSeriesFromFirstColumnHeader(seriesColVal);
      if (parsedCol.known && parsedCol.series) {
        rowSeriesParsed = parsedCol.series;
        rowLetter = extractClassLetter(seriesColVal);
      }
      if (parsedCol.studentNumber && (!rawSeq || rawSeq === rawSeries)) rawSeq = parsedCol.studentNumber;
    }

    const parsedDate = parseFlexibleDate(rawBirth);
    const gender = parseGender(rawGender);
    const race = parseRaceColor(rawRace);
    const address = cleanPlaceholder(rawAddr);

    // Aluno com mais de uma deficiência: principal em PCD e as outras em DEFICIÊNCIA ADICIONAL 1 e 2
    const extraPcd = [activeMap.pcdExtra1, activeMap.pcdExtra2]
      .filter((i): i is number => i !== undefined)
      .map((i) => cleanPlaceholder(row[i]))
      .filter(Boolean);
    let pcdDesc = [cleanPlaceholder(rawPcd), ...extraPcd]
      .filter((v, i, arr) => v && arr.findIndex((x) => stripAccentsUpper(x) === stripAccentsUpper(v)) === i)
      .join(' + ');
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
    let finalLetter = '';
    let seriesByDefault = false;
    if (filters.overrideSeriesWithDefault && filters.defaultSeries) {
      finalSeries = canonicalGrade(filters.defaultSeries);
    } else if (rowSeriesParsed) {
      finalSeries = rowSeriesParsed;
      finalLetter = rowLetter;
    } else if (currentSeries) {
      finalSeries = currentSeries;
      finalLetter = currentLetter;
    } else {
      finalSeries = canonicalGrade(filters.defaultSeries || 'PRÉ I');
      seriesByDefault = true;
    }

    const pendingFields: string[] = [];
    const birthOk = parsedDate.isValid && !!parsedDate.isoDate && !isImpossibleBirthDate(parsedDate.isoDate);
    // Data vazia, fora do calendário, antes de 1920 (ex.: 1018) ou no futuro
    if (!birthOk) pendingFields.push('Data de Nascimento');
    // Idade muito fora da série (ex.: 4 anos no 3º ano; adulto no 9º ano)
    else if (isAgeFarFromGrade(parsedDate.isoDate, finalSeries)) pendingFields.push(AGE_GRADE_PENDING);
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
      classLetter: finalLetter || undefined,
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
    // Uma turma por série + letra (1º ANO A, 1º ANO B...). Sem letra, uma turma por série.
    // O turno da turma nova é o dos alunos dela (antes ficava sempre o turno padrão, ex.: MANHÃ).
    const combos = new Map<string, { serie: string; letter: string; shifts: Map<string, number> }>();
    students.forEach((s) => {
      const key = `${s.series}|${s.classLetter || ''}`;
      const entry = combos.get(key) || { serie: s.series, letter: s.classLetter || '', shifts: new Map<string, number>() };
      const sh = String(s.shift || '').toUpperCase();
      if (sh) entry.shifts.set(sh, (entry.shifts.get(sh) || 0) + 1);
      combos.set(key, entry);
    });
    const mixedShifts: string[] = [];
    const noLetterBesideLetters: string[] = [];
    // Série que tem turmas com letra no arquivo: os alunos sem letra viram uma turma própria,
    // sem "tomar" a turma A (antes a turma A perdia a letra e os alunos dela ficavam sem turma).
    const seriesWithLetters = new Set(Array.from(combos.values()).filter((c) => c.letter).map((c) => canonicalGrade(c.serie)));
    combos.forEach(({ serie, letter, shifts }) => {
      const ranked = Array.from(shifts.entries()).sort((a, b) => b[1] - a[1]);
      const shift = ranked[0]?.[0] || filters.defaultShift || 'MANHÃ';
      if (ranked.length > 1) mixedShifts.push(`${serie}${letter ? ` ${letter}` : ''} (${ranked.map(([s, n]) => `${n} ${s}`).join(', ')})`);
      const strict = !letter && seriesWithLetters.has(canonicalGrade(serie));
      if (strict) {
        const n = Array.from(shifts.values()).reduce((a, b) => a + b, 0);
        noLetterBesideLetters.push(`${serie} (${n} aluno${n === 1 ? '' : 's'})`);
      }
      const found = findClassForSeries(targetUnit!.id, serie, allClasses, unlinkedAllowed, letter, strict);
      const isNew = found && !classes.some((ex) => ex.id === found.id);
      if (!found && filters.autoRegisterSchoolUnit) {
        const cls = buildClassForSeries(targetUnit!, serie, shift, suggestedClasses.length, letter);
        suggestedClasses.push(cls);
        allClasses.push(cls);
      } else if (isNew && found.shift !== shift) {
        // Turma nova criada antes com o turno padrão: acerta o turno pelo dos alunos
        // Mantém a letra da própria turma encontrada (nunca a apaga)
        const keepLetter = letter || classLetterOf(found);
        const fixed = { ...found, shift: shift as ClassShift, name: `${serie}${keepLetter ? ` ${keepLetter}` : ''} - ${shift}` } as SchoolClass;
        const ai = allClasses.findIndex((c) => c.id === found.id);
        if (ai >= 0) allClasses[ai] = fixed;
        const si = suggestedClasses.findIndex((c) => c.id === found.id);
        if (si >= 0) suggestedClasses[si] = fixed;
      }
    });
    if (noLetterBesideLetters.length > 0) {
      warnings.push(
        `Alunos sem letra de turma numa série que tem turmas A, B, C...: ${noLetterBesideLetters.join('; ')}. Eles ficaram numa turma sem letra (ex.: "1º ANO - TARDE"). Peça à escola a letra correta e mude depois em Turmas.`
      );
    }
    if (mixedShifts.length > 0) {
      warnings.push(
        `Série com alunos em mais de um turno e sem letra de turma: ${mixedShifts.join('; ')}. A turma ficou com o turno da maioria; se forem turmas diferentes, informe a letra (ex.: 1º ANO A e 1º ANO B).`
      );
    }
  }

  students.forEach((std) => {
    const cls = findClassForSeries(
      std.schoolUnitId,
      std.series,
      allClasses,
      unlinkedAllowed,
      std.classLetter,
      !std.classLetter && students.some((o) => o.classLetter && canonicalGrade(o.series) === canonicalGrade(std.series))
    );
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

  // Turmas novas só entram se receberem alunos (evita turmas vazias, ex: "1º ANO" sem letra
  // quando a planilha separa 1º ANO A, B, C). Turmas já existentes ajustadas continuam.
  if (students.length > 0) {
    suggestedClasses = suggestedClasses.filter(
      (c) => classes.some((ex) => ex.id === c.id) || students.some((st) => st.classId === c.id)
    );
  }
  if (targetUnit && schoolStatus === 'CADASTRADA') {
    suggestedClasses
      .filter((c) => !classes.some((ex) => ex.id === c.id))
      .forEach((c) => classesToCreate.push(c.name.replace(/\s*-\s*[^-]+$/, '') || c.gradeLevel));
    if (classesToCreate.length > 0) {
      schoolMessages.push(`Turma(s) que será(ão) criada(s) na escola: ${classesToCreate.join(', ')}.`);
    }
  }

  // Aluno repetido no mesmo arquivo (mesmo nome e nascimento): entra uma vez só (a nuvem não aceita
  // o mesmo aluno duas vezes na escola) e fica com a pendência "Possível cadastro duplicado",
  // para a escola conferir a turma certa na lista de cadastros pendentes.
  const seen = new Map<string, ParsedImportStudent>();
  const repeated: string[] = [];
  students.forEach((st) => {
    const key = studentKey(st.cleanName || st.name, st.birthDate);
    const first = seen.get(key);
    if (first) {
      const a = `${first.series}${first.classLetter ? ` ${first.classLetter}` : ''}`;
      const b = `${st.series}${st.classLetter ? ` ${st.classLetter}` : ''}`;
      repeated.push(`${st.cleanName || st.name} (${a === b ? `2 vezes no ${a}` : `${a} e ${b}`})`);
      const label = `${DUPLICATE_PENDING_PREFIX}: aparece ${a === b ? `2 vezes no ${a}` : `também no ${b}`} (conferir a turma)`;
      if (!first.pendingFields.some((f) => f.startsWith(DUPLICATE_PENDING_PREFIX))) first.pendingFields.push(label);
      first.cadastralStatus = 'INCOMPLETE';
    } else {
      seen.set(key, st);
    }
  });
  if (repeated.length > 0) {
    warnings.push(
      `${repeated.length} aluno(s) aparece(m) repetido(s) no arquivo e será(ão) cadastrado(s) uma vez só, com a pendência "${DUPLICATE_PENDING_PREFIX}" para a escola conferir a turma: ${repeated.join('; ')}.`
    );
  }
  const impossibleDates = students.filter((st) => st.pendingFields.includes('Data de Nascimento')).length;
  if (impossibleDates > 0) {
    warnings.push(`${impossibleDates} aluno(s) com data de nascimento vazia ou impossível (ex.: ano 1018 ou data no futuro): ficam com a pendência "Data de Nascimento".`);
  }
  const ageGrade = students.filter((st) => st.pendingFields.includes(AGE_GRADE_PENDING)).length;
  if (ageGrade > 0) {
    warnings.push(`${ageGrade} aluno(s) com idade muito fora da série: ficam com a pendência "${AGE_GRADE_PENDING}".`);
  }

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
    parentUnitName: isAnnex
      ? context.parentUnit?.name ||
        schoolUnits.find((u) => u.id === targetUnit?.parentUnitId)?.name ||
        (fichaMatchesUnit ? ficha?.parentName?.toUpperCase() : undefined)
      : undefined,
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
    schoolFicha: fichaMatchesUnit ? ficha : undefined,
    fichaUpdatesRegisteredUnit,
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

/** Valores fixos que versões antigas do importador gravavam no aluno (não são dados reais). */
export const LEGACY_IMPORT_CITY = 'Belém';
export const LEGACY_IMPORT_ZIP = '66000-000';

/** Cidade, UF e CEP do aluno importado: da planilha, senão os da escola dele (nunca um valor fixo). */
export function studentLocationFromUnit(
  itemCity: string | undefined,
  unit: Pick<SchoolUnit, 'city' | 'state' | 'zipCode'> | undefined
): { city: string; state: string; zipCode: string } {
  const t = (v: unknown) => (v == null ? '' : String(v).trim());
  return {
    city: t(itemCity) || t(unit?.city),
    state: t(unit?.state).toUpperCase() || 'PA',
    zipCode: t(unit?.zipCode),
  };
}

/** Curso (segmento) pela série: Infantil, Fundamental I (1º ao 5º), Fundamental II (6º ao 9º) ou Médio. */
export function courseIdForSeries(series: unknown): string {
  const norm = String(series ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
  if (/PRE|MATERNAL|CRECHE|BERCARIO|INFANTIL/.test(norm)) return 'course-ei';
  if (/MEDIO|\bEM\b/.test(norm)) return 'course-em';
  const m = norm.match(/(\d+)\s*(º|O|°)?\s*ANO/);
  const n = m ? Number(m[1]) : NaN;
  if (n >= 1 && n <= 5) return 'course-ef1';
  if (n >= 6 && n <= 9) return 'course-ef2';
  return 'course-ef1';
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
  // Aluno repetido no mesmo lote (mesmo nome e nascimento) entra uma vez só
  const seenKeys = new Set<string>();
  const studentsToImport = importedList
    .filter((item) => item.selectedForImport !== false)
    .filter((item) => {
      const key = studentKey(item.cleanName || item.name, item.birthDate);
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });

  // RA: aluno novo recebe um RA provisório (derivado do id) e a nuvem troca pelo número
  // definitivo assim que houver conexão (raService). Nenhum computador numera sozinho.
  return studentsToImport.map((item, index) => {
    // Aluno já cadastrado mantém o RA dele; só aluno novo recebe número
    const newId = `std-imp-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`;
    const ra = findExistingStudent(item, existingStudents) ? '' : provisionalRaFor(newId);

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
      (effectiveSeries ? findClassForSeries(unitId, effectiveSeries, allClasses, units.length <= 1, item.classLetter) : undefined);

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
      // Várias deficiências (principal + adicionais) viram um item cada
      item.medicalClassification
        .split(' + ')
        .map((d) => d.trim())
        .filter(Boolean)
        .forEach((d) => specialNeeds.push(d));
    }

    const officialStudent: Student = {
      id: newId,
      name: finalName,
      enrollmentNumber: ra,
      cpf: '000.000.000-00',
      birthDate: filters.importBirthDate ? item.birthDate : '2020-01-01',
      gender: filters.importGender ? item.gender : 'OTHER',
      raceColor: filters.importRaceColor ? item.raceColor : 'NAO_DECLARADA',
      address: filters.importAddress ? item.address : '',
      ...studentLocationFromUnit(item.city, unit),
      email: '',
      phone: '',
      guardianName: 'Pendente de Atualização Cadastral',
      guardianPhone: '',
      courseId: courseIdForSeries(effectiveSeries),
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
    // Já matriculado em OUTRA escola: não transfere sozinho. Fica na escola atual com a pendência,
    // para a Secretaria conferir com as duas escolas onde o aluno estuda de verdade.
    if (existing && isEnrolledInOtherSchool(existing, officialStudent.schoolUnitId)) {
      const otherName = finalSchoolName || item.schoolName || unit?.name || 'outra escola';
      const label = `${OTHER_SCHOOL_PENDING_PREFIX}: também na planilha de ${otherName}${effectiveSeries ? ` (${effectiveSeries})` : ''}. Conferir onde estuda`;
      const others = (existing.pendingFields || []).filter((f) => !String(f).startsWith(OTHER_SCHOOL_PENDING_PREFIX));
      return {
        ...existing,
        pendingFields: [...others, label],
        cadastralStatus: 'INCOMPLETE',
      } as Student;
    }
    if (existing) {
      const hasCpf = existing.cpf && existing.cpf !== '000.000.000-00';
      return {
        ...existing,
        name: officialStudent.name,
        birthDate: officialStudent.birthDate,
        gender: officialStudent.gender,
        raceColor: officialStudent.raceColor,
        address: officialStudent.address || existing.address,
        // Cidade/CEP fixos de versões antigas do importador são trocados pelos da escola
        ...(existing.city === LEGACY_IMPORT_CITY && existing.zipCode === LEGACY_IMPORT_ZIP
          ? { city: officialStudent.city, state: officialStudent.state, zipCode: officialStudent.zipCode }
          : {}),
        courseId: !existing.courseId || existing.courseId === 'crs-infantil' ? officialStudent.courseId : existing.courseId,
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

// Gera o modelo Excel fiel ao print anexo pelo usuário ("ESCOLA: MARIA DA PRAIA")
export function generateOfficialTemplateXlsx(): void {
  downloadSpreadsheetTemplate('xlsx');
}

export {
  downloadSpreadsheetTemplate,
  downloadWordTemplate,
  downloadWriterTemplate,
};
