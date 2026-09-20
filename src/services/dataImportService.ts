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
): { series: string | null; cleanHeader: string; studentNumber?: string } {
  if (!cellText && (!adjacentCells || adjacentCells.length === 0)) {
    return { series: null, cleanHeader: '' };
  }

  const raw = String(cellText || '').trim();
  const fullText = [raw, ...(adjacentCells || []).map((c) => String(c || '').trim())]
    .filter(Boolean)
    .join(' ');

  // Extrai número do estudante se houver no final (ex: "PRÉ II - 1" -> studentNumber = "1")
  let studentNumber: string | undefined = undefined;
  const numEndMatch = raw.match(/[\-\_\s]+(\d{1,4})$/);
  if (numEndMatch) {
    studentNumber = numEndMatch[1];
  }

  // 1. Padrões específicos de séries e etapas escolares brasileiras
  const knownPatterns: Array<{ regex: RegExp; format: (m: RegExpMatchArray) => string }> = [
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
      regex: /\b(\d+)[º°ªaA]?\s*(?:ANO|S[EÉ]RIE)\b/i,
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
 * Analisa o texto de séries atendidas no cabeçalho (ex: "PRÉ II – 1º AO 5º - 6º AO 9º")
 * e expande para a lista nominal completa de turmas/séries que a escola atende.
 */
export function extractSchoolGradesServed(gradesText: string): { rawText: string; expandedGrades: string[] } {
  if (!gradesText) {
    return { rawText: '', expandedGrades: ['PRÉ II'] };
  }

  const rawText = gradesText.trim();
  const parts = rawText.split(/[–\-\|\,\;\/]+/).map((p) => p.trim()).filter(Boolean);
  const gradesSet = new Set<string>();

  parts.forEach((part) => {
    const upper = part.toUpperCase();

    // Caso 1: "1º AO 5º" ou "1 AO 5" ou "1º AO 5º ANO"
    const rangeMatch = upper.match(/(\d+)[º°oO]?\s*(?:AO|A|ATE|ATÉ)\s*(\d+)[º°oO]?(?:\s*ANO)?/i);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let g = start; g <= end; g++) {
          gradesSet.add(`${g}º ANO`);
        }
        return;
      }
    }

    // Caso 2: Pré I, Pré II
    if (upper.includes('PRÉ') || upper.includes('PRE')) {
      if (upper.includes('I') && upper.includes('II')) {
        gradesSet.add('PRÉ I');
        gradesSet.add('PRÉ II');
      } else if (upper.includes('II')) {
        gradesSet.add('PRÉ II');
      } else if (upper.includes('I')) {
        gradesSet.add('PRÉ I');
      } else {
        gradesSet.add('EDUCAÇÃO INFANTIL - PRÉ');
      }
      return;
    }

    // Caso 3: Creche / Berçário / Maternal
    if (upper.includes('CRECHE')) gradesSet.add('CRECHE');
    if (upper.includes('BERÇÁRIO') || upper.includes('BERCARIO')) gradesSet.add('BERÇÁRIO');
    if (upper.includes('MATERNAL')) gradesSet.add('MATERNAL');

    // Caso 4: Ano específico isolado (ex: "1º ANO", "5º ANO", "9º ANO")
    const singleAnoMatch = upper.match(/(\d+)[º°oO]?\s*ANO/i);
    if (singleAnoMatch) {
      gradesSet.add(`${singleAnoMatch[1]}º ANO`);
      return;
    }

    // Se for um texto não mapeado mas com conteúdo
    if (part.length > 1 && !/^\d+$/.test(part)) {
      gradesSet.add(part.toUpperCase());
    }
  });

  // Se o conjunto ficou vazio, garante pelo menos PRÉ II ou o que veio no texto
  if (gradesSet.size === 0) {
    gradesSet.add('PRÉ II');
  }

  // Ordenação lógica das séries
  const orderedGrades = Array.from(gradesSet).sort((a, b) => {
    const rank = (str: string) => {
      if (str.includes('BERÇÁRIO')) return 1;
      if (str.includes('CRECHE')) return 2;
      if (str.includes('MATERNAL')) return 3;
      if (str.includes('PRÉ I') || str.includes('PRE I')) return 4;
      if (str.includes('PRÉ II') || str.includes('PRE II')) return 5;
      const numMatch = str.match(/(\d+)/);
      if (numMatch) return 10 + parseInt(numMatch[1], 10);
      return 99;
    };
    return rank(a) - rank(b);
  });

  return {
    rawText,
    expandedGrades: orderedGrades,
  };
}

/**
 * Cria ou recupera a SchoolUnit e gera as classes (turmas) para as séries que ela atende.
 * O cadastro da unidade escolar fica com status 'INCOMPLETE' e lista de pendências
 * para complementação posterior pelo usuário/secretaria.
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
  const cleanSchoolName = (schoolName || 'Escola Municipal')
    .replace(/^ESCOLA:\s*/i, '')
    .replace(/^EMEF\s*/i, '')
    .trim() || 'Polo Remoto';

  const fullSchoolName = schoolName.toUpperCase().startsWith('ESCOLA:')
    ? schoolName.toUpperCase()
    : `ESCOLA: ${cleanSchoolName.toUpperCase()}`;

  const { rawText, expandedGrades } = extractSchoolGradesServed(gradesText);

  // Se houver série da primeira coluna que não estava no gradesText, acrescenta
  if (firstColumnSeries && !expandedGrades.includes(firstColumnSeries.toUpperCase())) {
    expandedGrades.unshift(firstColumnSeries.toUpperCase());
  }

  // Verifica se já existe uma unidade com esse nome
  const existing = existingUnits.find(
    (u) =>
      u.name.toLowerCase().trim() === fullSchoolName.toLowerCase().trim() ||
      u.name.toLowerCase().trim() === cleanSchoolName.toLowerCase().trim() ||
      u.tradeName?.toLowerCase().trim() === cleanSchoolName.toLowerCase().trim()
  );

  let schoolUnit: SchoolUnit;
  let isNewUnit = false;

  if (existing) {
    schoolUnit = {
      ...existing,
      gradesServed: Array.from(new Set([...(existing.gradesServed || []), ...expandedGrades])),
      gradesServedText: existing.gradesServedText || rawText,
    };
  } else {
    isNewUnit = true;
    schoolUnit = {
      id: `unit-imp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: fullSchoolName,
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
      email: `polo.${cleanSchoolName.toLowerCase().replace(/[^a-z0-9]/g, '')}@educacao.gov.br`,
      hasInternet: false,
      syncStatus: 'PENDENTE',
      totalStudents: 0,
      totalTeachers: 0,
      totalClasses: expandedGrades.length,
      lastSyncDate: new Date().toISOString(),
      gradesServed: expandedGrades,
      gradesServedText: rawText || 'PRÉ II – 1º AO 5º - 6º AO 9º',
      cadastralStatus: 'INCOMPLETE', // Conforme solicitado: cadastro pendente de informações complementares
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
    };
  }

  // Criar turmas para cada série atendida vinculadas à unidade escolar
  const createdClasses: SchoolClass[] = [];
  const currentYear = new Date().getFullYear();

  expandedGrades.forEach((serie, idx) => {
    const classId = `class-${schoolUnit.id}-${serie.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    // Verifica se já existe classe correspondente
    const alreadyExists = existingClasses.some(
      (c) =>
        (c.schoolUnitId === schoolUnit.id && c.gradeLevel.toLowerCase() === serie.toLowerCase()) ||
        c.id === classId
    );

    if (!alreadyExists) {
      let segment = 'ENSINO_FUNDAMENTAL';
      if (serie.includes('PRÉ') || serie.includes('CRECHE') || serie.includes('MATERNAL') || serie.includes('INFANTIL')) {
        segment = 'EDUCACAO_INFANTIL';
      } else if (serie.includes('MÉDIO') || serie.includes('MEDIO')) {
        segment = 'ENSINO_MEDIO';
      }

      createdClasses.push({
        id: classId,
        name: `${cleanSchoolName} - ${serie} (${defaultShift})`,
        gradeLevel: serie,
        segment,
        shift: (defaultShift as ClassShift) || 'MANHÃ',
        schoolYear: currentYear,
        roomNumber: `Sala 0${idx + 1}`,
        maxCapacity: 30,
        schoolUnitId: schoolUnit.id,
      });
    }
  });

  return {
    schoolUnit,
    isNewUnit,
    createdClasses,
  };
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
  const str = cleanPlaceholder(val).toUpperCase();
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

// Processa arquivo individual (qualquer formato suportado do LibreOffice e Microsoft Office)
export async function parseSingleFile(
  file: File,
  filters: ImportFilterOptions,
  classes: SchoolClass[],
  schoolUnits: SchoolUnit[]
): Promise<FileImportResult> {
  const fileName = file.name;
  const fileSize = file.size;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  try {
    // 1. Microsoft Office Word (.docx)
    if (ext === 'docx') {
      const extracted = await parseDocxFile(file);
      const res = processSheetWithHeaders(extracted.matrix, fileName, fileSize, filters, classes, schoolUnits);
      res.documentType = 'WORD';
      if (extracted.schoolNameDetected && !res.schoolNameDetected) {
        res.schoolNameDetected = extracted.schoolNameDetected;
      }
      if (extracted.classOrSeriesDetected && !res.seriesDetected) {
        res.seriesDetected = extracted.classOrSeriesDetected;
      }
      if (extracted.dateDetected && !res.dateDetected) {
        res.dateDetected = extracted.dateDetected;
      }
      return res;
    }

    // 2. LibreOffice Writer (.odt - OpenDocument Text)
    if (ext === 'odt') {
      const extracted = await parseOdtFile(file);
      const res = processSheetWithHeaders(extracted.matrix, fileName, fileSize, filters, classes, schoolUnits);
      res.documentType = 'WRITER';
      if (extracted.schoolNameDetected && !res.schoolNameDetected) {
        res.schoolNameDetected = extracted.schoolNameDetected;
      }
      if (extracted.classOrSeriesDetected && !res.seriesDetected) {
        res.seriesDetected = extracted.classOrSeriesDetected;
      }
      if (extracted.dateDetected && !res.dateDetected) {
        res.dateDetected = extracted.dateDetected;
      }
      return res;
    }

    // 3. JSON
    if (ext === 'json') {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      return processRawRows(
        Array.isArray(jsonData) ? jsonData : jsonData.alunos || jsonData.students || [jsonData],
        fileName,
        fileSize,
        filters,
        classes,
        schoolUnits
      );
    }

    // 4. CSV, TSV, TXT
    if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
      const text = await file.text();
      const wb = XLSX.read(text, { type: 'string' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawRows = XLSX.utils.sheet_to_json<any>(ws, { header: 1, defval: '' });
      const res = processSheetWithHeaders(rawRows, fileName, fileSize, filters, classes, schoolUnits);
      res.documentType = 'CSV';
      return res;
    }

    // 5. Microsoft Office Excel (.xlsx, .xls) e LibreOffice Calc (.ods)
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];
    const rawRows = XLSX.utils.sheet_to_json<any>(ws, { header: 1, defval: '' });
    const res = processSheetWithHeaders(rawRows, fileName, fileSize, filters, classes, schoolUnits);
    res.documentType = ext === 'ods' ? 'CALC' : ext === 'xls' || ext === 'xlsx' ? 'EXCEL' : 'GENERIC';
    return res;
  } catch (error: any) {
    return {
      fileName,
      fileSize,
      totalRows: 0,
      students: [],
      completeCount: 0,
      incompleteCount: 0,
      errors: [`Falha ao ler o arquivo: ${error?.message || 'Formato não reconhecido'}`],
      documentType: 'GENERIC',
    };
  }
}

// Processa planilha crua linha por linha com detecção de metadados do cabeçalho
export function processSheetWithHeaders(
  matrix: any[][],
  fileName: string,
  fileSize: number,
  filters: ImportFilterOptions,
  classes: SchoolClass[],
  schoolUnits: SchoolUnit[]
): FileImportResult {
  let schoolNameDetected = '';
  let seriesDetected = '';
  let dateDetected = '';
  let headerRowIndex = -1;
  let headers: string[] = [];

  // 1. Varrer as primeiras 15 linhas para detectar metadados da escola e identificar a linha de cabeçalho
  for (let r = 0; r < Math.min(matrix.length, 15); r++) {
    const row = matrix[r] || [];
    const rowText = row.map((c) => String(c).trim()).join(' ');

    // Detecção: ESCOLA: EMEI RUTH PEREIRA BARBARESCO ou ESCOLA: MARIA DA PRAIA
    const schoolMatch = rowText.match(/ESCOLA:\s*([^\n\r\|\t]+?)(?=\s+TURMAS?:|\s+DATA:|\s*\||$)/i);
    if (schoolMatch && !schoolNameDetected) {
      schoolNameDetected = schoolMatch[1].trim();
    }

    // Detecção: TURMA: PRÉ-ESCOLA I A ou TURMAS: PRÉ II – 1º AO 5º - 6º AO 9º
    const turmasMatch = rowText.match(/TURMAS?:\s*([^\n\r\|\t]+?)(?=\s+DATA:|\s*\||$)/i);
    if (turmasMatch && !seriesDetected) {
      seriesDetected = turmasMatch[1].trim();
    }

    // Detecção: DATA: 15/09/2026 ou 01/09/2026
    const dataMatch = rowText.match(/DATA:\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (dataMatch && !dateDetected) {
      dateDetected = dataMatch[1].trim();
    }

    // Procurar a linha que contém as colunas da tabela
    // Ex: "NOME COMPLETO DO ALUNO" ou "DE NASCIM" ou "DATA DE NASCIMENTO"
    const hasStudentNameCol = row.some((cell) => {
      const c = String(cell).toUpperCase();
      return (
        c.includes('NOME COMPLETO') ||
        c.includes('NOME DO ALUNO') ||
        c === 'NOME' ||
        c === 'ALUNO'
      );
    });

    if (hasStudentNameCol && headerRowIndex === -1) {
      headerRowIndex = r;
      headers = row.map((c) => String(c).trim());
    }
  }

  // Se não encontrou cabeçalho nas primeiras linhas, assume linha 0
  if (headerRowIndex === -1 && matrix.length > 0) {
    headerRowIndex = 0;
    headers = (matrix[0] || []).map((c) => String(c).trim());
  }

  // Mapear índices das colunas
  const colMap: Record<string, number> = {};
  headers.forEach((h, idx) => {
    const norm = h
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // 1. SERIE DO ALUO / SERIE DO ALUNO / TURMA
    if (
      (norm.includes('SERIE') ||
        norm.includes('TURMA') ||
        norm.includes('ANO DE ENSINO') ||
        norm.includes('ETAPA') ||
        norm === 'SERIE DO ALUO' ||
        norm === 'SERIE DO ALUNO') &&
      !norm.includes('NASCIM')
    ) {
      if (colMap.series === undefined) colMap.series = idx;
    }

    // Nº de Ordem
    if (
      norm.includes('Nº') ||
      norm.includes('N°') ||
      norm.includes('NO.') ||
      norm.includes('NUMERO') ||
      norm.includes('ORDEM') ||
      norm === 'N' ||
      norm === 'ORD'
    ) {
      if (colMap.seq === undefined) colMap.seq = idx;
    }

    // 2. NOME COMPLETO DO ALUNO
    // Não vincular colunas que contenham termos de outros campos (SERIE, SEXO, RACA, EDENRECO, PCD, LAUDO, NASCIM)
    const isSpecialStudentField =
      norm.includes('SERIE') ||
      norm.includes('TURMA') ||
      norm.includes('SEXO') ||
      norm.includes('COR') ||
      norm.includes('RACA') ||
      norm.includes('ENDERECO') ||
      norm.includes('EDENRECO') ||
      norm.includes('PCD') ||
      norm.includes('LAUDO') ||
      norm.includes('NASCIM');

    if (
      !isSpecialStudentField &&
      (norm.includes('NOME') || norm === 'ALUNO' || norm === 'ESTUDANTE' || norm === 'NOME COMPLETO DO ALUNO')
    ) {
      if (colMap.name === undefined) colMap.name = idx;
    }

    // 3. DATA DE NASCIMENTO
    if (norm.includes('NASCIM') || norm.includes('NASC') || norm.includes('ANIVERSARIO') || norm.includes('DATA DE NASCIMENTO')) {
      if (colMap.birthDate === undefined) colMap.birthDate = idx;
    }

    // 4. SEXO DO ALUNO
    if (norm.includes('SEXO') || norm.includes('GENERO')) {
      if (colMap.gender === undefined) colMap.gender = idx;
    }

    // 5. COR/RAÇA DO ALUNO
    if (norm.includes('RACA') || norm.includes('COR') || norm.includes('ETNIA')) {
      if (colMap.race === undefined) colMap.race = idx;
    }

    // 6. EDENREÇO DO ALUNO / ENDEREÇO
    if (
      norm.includes('ENDERECO') ||
      norm.includes('EDENRECO') ||
      norm.includes('LOGRADOURO') ||
      norm.includes('VILA') ||
      norm.includes('RESIDENCIA') ||
      norm.includes('BAIRRO') ||
      norm.includes('VICINAL') ||
      norm.includes('FAZENDA')
    ) {
      if (colMap.address === undefined) colMap.address = idx;
    }

    // TURNO / PERÍODO
    if (norm.includes('TURNO') || norm.includes('PERIODO')) {
      if (colMap.shift === undefined) colMap.shift = idx;
    }

    // Coluna TEA (Sim/Não)
    if (norm.includes('TEA') || norm.includes('AUTISMO') || norm.includes('ESPECTRO')) {
      if (colMap.tea === undefined) colMap.tea = idx;
    }

    // 7. PCD DO ALUNO / Condição Especial
    if (
      norm.includes('PCD') ||
      norm.includes('DEFICIENCIA') ||
      norm.includes('CONDICAO') ||
      norm.includes('CLASSIFICACAO MEDICA') ||
      norm.includes('NECESSIDADES')
    ) {
      if (colMap.pcd === undefined) colMap.pcd = idx;
    }

    // 8. SE O ALUNO TEM LAUDO / LAUDO
    if (norm.includes('LAUDO') || norm.includes('COMPROVACAO') || norm.includes('TEM LAUDO')) {
      if (colMap.laudo === undefined) colMap.laudo = idx;
    }
  });

  // Fallback padrão municipal caso a planilha contenha a estrutura clássica de 8 colunas:
  // 0: SERIE DO ALUO / Nº
  // 1: NOME COMPLETO DO ALUNO
  // 2: DATA DE NASCIMENTO
  // 3: SEXO DO ALUNO
  // 4: COR/RAÇA DO ALUNO
  // 5: EDENREÇO DO ALUNO
  // 6: PCD DO ALUNO
  // 7: SE O ALUNO TEM LAUDO
  if (colMap.name === undefined && headers.length >= 2) {
    if (colMap.series === undefined) colMap.series = 0;
    colMap.name = 1;
    if (colMap.birthDate === undefined && headers.length >= 3) colMap.birthDate = 2;
    if (colMap.gender === undefined && headers.length >= 4) colMap.gender = 3;
    if (colMap.race === undefined && headers.length >= 5) colMap.race = 4;
    if (colMap.address === undefined && headers.length >= 6) colMap.address = 5;
    if (colMap.pcd === undefined && headers.length >= 7) colMap.pcd = 6;
    if (colMap.laudo === undefined && headers.length >= 8) colMap.laudo = 7;
  }

  // 2. Extração especializada da Série na 1ª Coluna (como "PRÉ II \n Nº" ou "PRÉ II Nº" ou "SERIE DO ALUO")
  const firstColIdx = colMap.series !== undefined ? colMap.series : colMap.seq !== undefined ? colMap.seq : 0;
  const firstColRawHeader = headers[firstColIdx] || '';
  const adjacentFirstColCells: any[] = [];
  if (headerRowIndex > 0) {
    const prevCell = matrix[headerRowIndex - 1]?.[firstColIdx];
    if (prevCell) adjacentFirstColCells.push(prevCell);
  }

  const firstColExtraction = extractSeriesFromFirstColumnHeader(firstColRawHeader, adjacentFirstColCells);
  const seriesFromFirstColumn = firstColExtraction.series || undefined;

  // Se encontrou a série na 1ª coluna e não havia série de turma geral, atualiza seriesDetected
  if (seriesFromFirstColumn && !seriesDetected) {
    seriesDetected = seriesFromFirstColumn;
  }

  // Iterar pelas linhas de dados
  const students: ParsedImportStudent[] = [];
  const errors: string[] = [];

  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const row = matrix[r] || [];
    // Pula linhas totalmente vazias
    if (row.every((c) => !c && c !== 0)) continue;

    const rawName = colMap.name !== undefined ? row[colMap.name] : row[1] || row[0];
    const name = cleanPlaceholder(rawName);

    // Se a linha não tem nome ou é continuação de rodapé (ex: "TOTAL DE ALUNOS"), pula
    if (!name || /TOTAL|COORDENADOR|DIRETOR|OBSERVA/i.test(name)) {
      continue;
    }

    // Detecta se o nome contém sufixo PCD (ex: "Luan Sousa de Jesus – PCD", "Lucas Sousa de Jesus - PCD")
    const pcdNameRegex = /[\s\-_–—]+PCD\b/i;
    const hasPcdInName = pcdNameRegex.test(name);
    const cleanName = name.replace(pcdNameRegex, '').trim();

    let rawSeq = colMap.seq !== undefined ? row[colMap.seq] : row[0];
    const rawBirth = colMap.birthDate !== undefined ? row[colMap.birthDate] : '';
    const rawGender = colMap.gender !== undefined ? row[colMap.gender] : '';
    const rawRace = colMap.race !== undefined ? row[colMap.race] : '';
    const rawAddr = colMap.address !== undefined ? row[colMap.address] : '';
    const rawShift = colMap.shift !== undefined ? row[colMap.shift] : '';
    const rawSeries = colMap.series !== undefined ? row[colMap.series] : '';
    const rawPcd = colMap.pcd !== undefined ? row[colMap.pcd] : '';
    const rawTea = colMap.tea !== undefined ? row[colMap.tea] : '';
    const rawLaudo = colMap.laudo !== undefined ? row[colMap.laudo] : '';

    // Extrai série e número de chamada da 1ª coluna se contiver "PRÉ II - 1" ou similar
    let rowSeriesParsed = '';
    const seriesColVal = cleanPlaceholder(rawSeries);
    if (seriesColVal) {
      const parsedCol = extractSeriesFromFirstColumnHeader(seriesColVal);
      if (parsedCol.series) {
        rowSeriesParsed = parsedCol.series;
      }
      if (parsedCol.studentNumber && (!rawSeq || rawSeq === rawSeries)) {
        rawSeq = parsedCol.studentNumber;
      }
    }

    const parsedDate = parseFlexibleDate(rawBirth);
    const gender = parseGender(rawGender);
    const race = parseRaceColor(rawRace);
    const address = cleanPlaceholder(rawAddr);

    // Avalia PCD
    let pcdDesc = cleanPlaceholder(rawPcd);
    if (!pcdDesc && hasPcdInName) {
      pcdDesc = 'PCD Identificado no Levantamento';
    }

    // Avalia TEA
    const teaStr = cleanPlaceholder(rawTea).toLowerCase();
    const isTea =
      teaStr === 'sim' ||
      teaStr === 's' ||
      /TEA|AUTISMO/i.test(pcdDesc) ||
      /TEA|AUTISMO/i.test(name);

    const isPcd = Boolean(pcdDesc || hasPcdInName || isTea);

    // Avalia Laudo
    let laudoInfo = parseMedicalReport(rawLaudo);
    // Se PCD diz "Suspeita sem laudo", garante hasReport = false
    if (/sem laudo|suspeita/i.test(pcdDesc)) {
      laudoInfo = { hasReport: false, text: 'Suspeita sem laudo' };
    } else if (/TEA\s*[–-]\s*Nível/i.test(pcdDesc) && !cleanPlaceholder(rawLaudo)) {
      // Diagnóstico fechado com nível especificado
      laudoInfo = { hasReport: true, text: 'SIM' };
    }

    const shift =
      cleanPlaceholder(rawShift) ||
      filters.defaultShift ||
      'MANHÃ';

    // Determinar a série aplicando as regras configuráveis pelo usuário:
    let finalSeries = 'PRÉ-ESCOLA I';
    if (filters.overrideSeriesWithDefault && filters.defaultSeries) {
      finalSeries = filters.defaultSeries;
    } else if (rowSeriesParsed) {
      finalSeries = rowSeriesParsed;
    } else if (cleanPlaceholder(rawSeries)) {
      finalSeries = cleanPlaceholder(rawSeries);
    } else if (seriesDetected) {
      finalSeries = seriesDetected;
    } else if (filters.extractSeriesFromFirstColumn !== false && seriesFromFirstColumn) {
      finalSeries = seriesFromFirstColumn;
    } else if (filters.defaultSeries) {
      finalSeries = filters.defaultSeries;
    }

    const finalSchoolName =
      schoolNameDetected ||
      filters.selectedSchoolUnitId ||
      'Escola Municipal / Polo Remoto';

    // Rastrear pendências cadastrais para Censo e Secretaria
    const pendingFields: string[] = [];
    if (!parsedDate.isValid || !parsedDate.isoDate) {
      pendingFields.push('Data de Nascimento');
    }
    if (!address) {
      pendingFields.push('Endereço / Localidade');
    }
    if (race === 'NAO_DECLARADA') {
      pendingFields.push('Raça/Cor (Censo Escolar)');
    }
    if (isPcd && !laudoInfo.hasReport) {
      pendingFields.push('Comprovação de Laudo Médico (PCD)');
    }
    if (!cleanPlaceholder(rawLaudo) || rawLaudo.toString().includes('*')) {
      pendingFields.push('Avaliação de Laudo (SIM/NÃO)');
    }
    pendingFields.push('CPF / Certidão de Nascimento');

    const cadastralStatus: CadastralStatus =
      pendingFields.length > 0 ? 'INCOMPLETE' : 'OK';

    // Encontrar turma compatível
    const matchedClass = classes.find(
      (c) =>
        c.name.toLowerCase().includes(finalSeries.toLowerCase()) ||
        c.gradeLevel.toLowerCase().includes(finalSeries.toLowerCase())
    );

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
      schoolName: finalSchoolName,
      classId: matchedClass?.id || classes[0]?.id || 'cls-default',
      className: matchedClass?.name || finalSeries,
      cadastralStatus,
      pendingFields,
      sourceFileName: fileName,
      selectedForImport: true, // Selecionado por padrão para importação
      rawRow: {
        rawSeq,
        rawName,
        rawBirth,
        rawGender,
        rawRace,
        rawAddr,
        rawPcd,
        rawTea,
        rawLaudo,
      },
    });
  }

  const completeCount = students.filter((s) => s.cadastralStatus === 'OK').length;
  const incompleteCount = students.filter((s) => s.cadastralStatus !== 'OK').length;

  // Monta a unidade escolar e as turmas sugeridas para cadastro automático
  const effectiveSchoolName = schoolNameDetected || 'EMEI RUTH PEREIRA BARBARESCO';
  const effectiveGradesText = seriesDetected || seriesFromFirstColumn || 'PRÉ-ESCOLA I A';

  const schoolUnitInfo = buildSchoolUnitAndClassesFromImport(
    effectiveSchoolName,
    effectiveGradesText,
    fileName,
    schoolUnits,
    classes,
    filters.defaultShift || 'MANHÃ',
    seriesFromFirstColumn
  );

  // Vincula o ID da escola sugerida e classes aos estudantes
  if (schoolUnitInfo.schoolUnit) {
    students.forEach((std) => {
      std.schoolUnitId = schoolUnitInfo.schoolUnit.id;
      // Procura se tem turma correspondente na escola
      const cls = schoolUnitInfo.createdClasses.find(
        (c) =>
          c.gradeLevel.toLowerCase() === std.series.toLowerCase() ||
          c.name.toLowerCase().includes(std.series.toLowerCase())
      );
      if (cls) {
        std.classId = cls.id;
        std.className = cls.name;
      }
    });
  }

  return {
    fileName,
    fileSize,
    schoolNameDetected,
    seriesDetected: seriesFromFirstColumn || seriesDetected,
    firstColumnHeaderDetected: firstColRawHeader,
    seriesFromFirstColumn,
    dateDetected,
    gradesServedDetectedText: schoolUnitInfo.schoolUnit.gradesServedText,
    expandedGradesDetected: schoolUnitInfo.schoolUnit.gradesServed,
    suggestedSchoolUnit: schoolUnitInfo.schoolUnit,
    suggestedClasses: schoolUnitInfo.createdClasses,
    totalRows: students.length,
    students,
    completeCount,
    incompleteCount,
    errors,
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
  additionalClasses: SchoolClass[] = []
): Student[] {
  const nowIso = new Date().toISOString();
  const year = new Date().getFullYear();
  const allClasses = [...classes, ...additionalClasses];

  // Apenas estudantes selecionados para importação
  const studentsToImport = importedList.filter((item) => item.selectedForImport !== false);

  return studentsToImport.map((item, index) => {
    const ra = `RA-${year}-${String(existingStudentsCount + index + 1).padStart(4, '0')}`;

    const effectiveSeries = filters.importSeries
      ? (filters.overrideSeriesWithDefault && filters.defaultSeries
          ? filters.defaultSeries
          : item.series || item.seriesFromFirstCol || filters.defaultSeries || 'PRÉ-ESCOLA I')
      : undefined;

    // Prioriza turma da escola alvo com a série correspondente
    const matchedClass = allClasses.find((c) => {
      const matchUnit = !targetSchoolUnit || c.schoolUnitId === targetSchoolUnit.id;
      const matchSeries =
        effectiveSeries &&
        (c.name.toLowerCase().includes(effectiveSeries.toLowerCase()) ||
          c.gradeLevel.toLowerCase().includes(effectiveSeries.toLowerCase()));
      return matchUnit && matchSeries;
    }) || allClasses.find((c) => c.id === item.classId) || allClasses[0];

    const finalSchoolName = filters.importSchoolUnit
      ? (targetSchoolUnit?.name || item.schoolName)
      : '';

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
      schoolUnitId: targetSchoolUnit ? targetSchoolUnit.id : item.schoolUnitId,
      classId: matchedClass?.id || item.classId || classes[0]?.id || 'cls-default',
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
