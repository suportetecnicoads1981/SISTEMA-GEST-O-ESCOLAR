import * as XLSX from 'xlsx';
import {
  Student,
  SchoolClass,
  SchoolUnit,
  CadastralStatus,
  RaceColorType,
  LocationZone,
  ClassShift,
} from '../types';

export interface ImportFilterOptions {
  importName: boolean;
  importBirthDate: boolean;
  importGender: boolean;
  importRaceColor: boolean;
  importAddress: boolean;
  importShift: boolean;
  importSeries: boolean;
  importMedicalClassification: boolean;
  importMedicalReport: boolean;
  importSchoolUnit: boolean;
  autoRegisterSchoolUnit: boolean; // Cadastra automaticamente a unidade escolar e séries atendidas
  extractSeriesFromFirstColumn: boolean; // Extrai a série a partir da 1ª coluna (ex: "PRÉ II Nº")
  overrideSeriesWithDefault: boolean; // Sobrescreve a série de todos os alunos com a série selecionada
  selectedSchoolUnitId?: string;
  defaultShift?: ClassShift;
  defaultSeries?: string;
}

export interface ParsedImportStudent {
  tempId: string;
  sequenceNumber?: string;
  name: string;
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
}

export const DEFAULT_IMPORT_FILTERS: ImportFilterOptions = {
  importName: true,
  importBirthDate: true,
  importGender: true,
  importRaceColor: true,
  importAddress: true,
  importShift: true,
  importSeries: true,
  importMedicalClassification: true,
  importMedicalReport: true,
  importSchoolUnit: true,
  autoRegisterSchoolUnit: true, // Habilitado por padrão
  extractSeriesFromFirstColumn: true, // Ativo por padrão conforme solicitado
  overrideSeriesWithDefault: false,
  defaultShift: 'MANHÃ',
  defaultSeries: 'PRÉ II',
};

// Extrai a série a partir do cabeçalho da 1ª coluna (ex: "PRÉ II Nº", "PRÉ II\nNº", "1º ANO Nº")
export function extractSeriesFromFirstColumnHeader(
  cellText: any,
  adjacentCells?: any[]
): { series: string | null; cleanHeader: string } {
  if (!cellText && (!adjacentCells || adjacentCells.length === 0)) {
    return { series: null, cleanHeader: '' };
  }

  const raw = String(cellText || '').trim();
  const fullText = [raw, ...(adjacentCells || []).map((c) => String(c || '').trim())]
    .filter(Boolean)
    .join(' ');

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
    };
  }

  return { series: null, cleanHeader: raw };
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

// Processa arquivo individual (qualquer formato suportado)
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

    if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
      const text = await file.text();
      // Lê delimitado com fallback inteligente
      const wb = XLSX.read(text, { type: 'string' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawRows = XLSX.utils.sheet_to_json<any>(ws, { header: 1, defval: '' });
      return processSheetWithHeaders(rawRows, fileName, fileSize, filters, classes, schoolUnits);
    }

    // XLSX, XLS, ODS, XML
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];
    const rawRows = XLSX.utils.sheet_to_json<any>(ws, { header: 1, defval: '' });
    return processSheetWithHeaders(rawRows, fileName, fileSize, filters, classes, schoolUnits);
  } catch (error: any) {
    return {
      fileName,
      fileSize,
      totalRows: 0,
      students: [],
      completeCount: 0,
      incompleteCount: 0,
      errors: [`Falha ao ler o arquivo: ${error?.message || 'Formato não reconhecido'}`],
    };
  }
}

// Processa planilha crua linha por linha com detecção de metadados do cabeçalho
function processSheetWithHeaders(
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

    // Detecção: ESCOLA: MARIA DA PRAIA
    const schoolMatch = rowText.match(/ESCOLA:\s*([^\n\r]+?)(?=\s+TURMAS:|\s+DATA:|$)/i);
    if (schoolMatch && !schoolNameDetected) {
      schoolNameDetected = schoolMatch[1].trim();
    }

    // Detecção: TURMAS: PRÉ II – 1º AO 5º - 6º AO 9º
    const turmasMatch = rowText.match(/TURMAS?:\s*([^\n\r]+?)(?=\s+DATA:|$)/i);
    if (turmasMatch && !seriesDetected) {
      seriesDetected = turmasMatch[1].trim();
    }

    // Detecção: DATA: 01/09/2026
    const dataMatch = rowText.match(/DATA:\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (dataMatch && !dateDetected) {
      dateDetected = dataMatch[1].trim();
    }

    // Procurar a linha que contém as colunas da tabela
    // Ex: "NOME COMPLETO DO ALUNO" ou "DATA DE NASCIMENTO"
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
      .replace(/[\u0300-\u036f]/g, '');

    if (norm.includes('Nº') || norm.includes('NO') || norm.includes('NUMERO') || norm.includes('ORDEM')) {
      if (colMap.seq === undefined) colMap.seq = idx;
    }
    if (norm.includes('NOME') || norm.includes('ALUNO')) {
      if (colMap.name === undefined) colMap.name = idx;
    }
    if (norm.includes('NASCIMENTO') || norm.includes('DT NASC') || norm.includes('NASC')) {
      if (colMap.birthDate === undefined) colMap.birthDate = idx;
    }
    if (norm.includes('SEXO') || norm.includes('GENERO')) {
      if (colMap.gender === undefined) colMap.gender = idx;
    }
    if (norm.includes('RACA') || norm.includes('COR') || norm.includes('ETNIA')) {
      if (colMap.race === undefined) colMap.race = idx;
    }
    if (norm.includes('ENDERECO') || norm.includes('LOGRADOURO') || norm.includes('VILA') || norm.includes('RESIDENCIA')) {
      if (colMap.address === undefined) colMap.address = idx;
    }
    if (norm.includes('TURNO') || norm.includes('PERIODO')) {
      if (colMap.shift === undefined) colMap.shift = idx;
    }
    if (norm.includes('SERIE') || norm.includes('TURMA') || norm.includes('ANO')) {
      if (colMap.series === undefined) colMap.series = idx;
    }
    if (
      norm.includes('PCD') ||
      norm.includes('CLASSIFICACAO MEDICA') ||
      norm.includes('DEFICIENCIA') ||
      norm.includes('CONDICAO')
    ) {
      if (colMap.medicalClass === undefined) colMap.medicalClass = idx;
    }
    if (norm.includes('LAUDO')) {
      if (colMap.laudo === undefined) colMap.laudo = idx;
    }
  });

  // 2. Extração especializada da Série na 1ª Coluna (como "PRÉ II \n Nº" ou "PRÉ II Nº")
  const firstColIdx = colMap.seq !== undefined ? colMap.seq : 0;
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

    const rawSeq = colMap.seq !== undefined ? row[colMap.seq] : row[0];
    const rawBirth = colMap.birthDate !== undefined ? row[colMap.birthDate] : '';
    const rawGender = colMap.gender !== undefined ? row[colMap.gender] : '';
    const rawRace = colMap.race !== undefined ? row[colMap.race] : '';
    const rawAddr = colMap.address !== undefined ? row[colMap.address] : '';
    const rawShift = colMap.shift !== undefined ? row[colMap.shift] : '';
    const rawSeries = colMap.series !== undefined ? row[colMap.series] : '';
    const rawMedical = colMap.medicalClass !== undefined ? row[colMap.medicalClass] : '';
    const rawLaudo = colMap.laudo !== undefined ? row[colMap.laudo] : '';

    const parsedDate = parseFlexibleDate(rawBirth);
    const gender = parseGender(rawGender);
    const race = parseRaceColor(rawRace);
    const address = cleanPlaceholder(rawAddr);
    const medClass = cleanPlaceholder(rawMedical);
    const laudoInfo = parseMedicalReport(rawLaudo);

    const shift =
      cleanPlaceholder(rawShift) ||
      filters.defaultShift ||
      'MANHÃ';

    // Determinar a série aplicando as regras configuráveis pelo usuário:
    let finalSeries = 'PRÉ II';
    if (filters.overrideSeriesWithDefault && filters.defaultSeries) {
      finalSeries = filters.defaultSeries;
    } else if (cleanPlaceholder(rawSeries)) {
      finalSeries = cleanPlaceholder(rawSeries);
    } else if (filters.extractSeriesFromFirstColumn !== false && seriesFromFirstColumn) {
      finalSeries = seriesFromFirstColumn;
    } else if (seriesDetected) {
      finalSeries = seriesDetected;
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
    if (medClass && !laudoInfo.hasReport) {
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
      birthDate: parsedDate.isoDate || '2020-01-01',
      formattedBirthDate: parsedDate.formatted || 'Não informada',
      gender,
      raceColor: race,
      address: address || 'Endereço pendente de cadastro',
      shift,
      series: finalSeries,
      seriesFromFirstCol: seriesFromFirstColumn,
      medicalClassification: medClass || (medClass === '' ? 'Não declarada' : medClass),
      hasMedicalReport: laudoInfo.hasReport,
      medicalReportText: laudoInfo.text,
      schoolName: finalSchoolName,
      classId: matchedClass?.id || classes[0]?.id || 'cls-default',
      className: matchedClass?.name || finalSeries,
      cadastralStatus,
      pendingFields,
      sourceFileName: fileName,
      rawRow: {
        rawSeq,
        rawName,
        rawBirth,
        rawGender,
        rawRace,
        rawAddr,
        rawMedical,
        rawLaudo,
      },
    });
  }

  const completeCount = students.filter((s) => s.cadastralStatus === 'OK').length;
  const incompleteCount = students.filter((s) => s.cadastralStatus !== 'OK').length;

  // Monta a unidade escolar e as turmas sugeridas para cadastro automático
  const effectiveSchoolName = schoolNameDetected || 'ESCOLA MUNICIPAL POLO';
  const effectiveGradesText = seriesDetected || seriesFromFirstColumn || 'PRÉ II – 1º AO 5º - 6º AO 9º';

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

  return importedList.map((item, index) => {
    const ra = `RA-${year}-${String(existingStudentsCount + index + 1).padStart(4, '0')}`;

    const effectiveSeries = filters.importSeries
      ? (filters.overrideSeriesWithDefault && filters.defaultSeries
          ? filters.defaultSeries
          : item.series || item.seriesFromFirstCol || filters.defaultSeries || 'PRÉ II')
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

    const officialStudent: Student = {
      id: `std-imp-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
      name: filters.importName ? item.name : 'Aluno Importado',
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
      observations: `Importado de planilha: ${item.sourceFileName}. Polo/Escola: ${finalSchoolName || item.schoolName}. Turno: ${item.shift || 'MANHÃ'}. Série: ${effectiveSeries || 'Não informada'}`,
      medicalObservations: filters.importMedicalClassification
        ? item.medicalClassification
        : undefined,
      medicalClassification: filters.importMedicalClassification
        ? item.medicalClassification
        : undefined,
      hasMedicalReport: filters.importMedicalReport ? item.hasMedicalReport : false,
      medicalReportText: item.medicalReportText,
      schoolOriginName: finalSchoolName,
      pendingFields: item.pendingFields,
      shift: filters.importShift ? item.shift : undefined,
      series: effectiveSeries,
      importedAt: nowIso,
    };

    return officialStudent;
  });
}

// Gera o modelo Excel fiel ao print anexo pelo usuário ("ESCOLA: MARIA DA PRAIA")
export function generateOfficialTemplateXlsx(): void {
  const data = [
    ['ESCOLA: MARIA DA PRAIA', '', '', 'TURMAS: PRÉ II – 1º AO 5º - 6º AO 9º', '', '', 'DATA: 01/09/2026'],
    ['LEVANTAMENTO DO QUANTITATIVO E PERFIL DOS ALUNOS POR TURMA'],
    [
      'PRÉ II\r\nNº',
      'NOME COMPLETO DO ALUNO',
      'DATA DE NASCIMENTO',
      'SEXO',
      'RAÇA/COR',
      'ENDEREÇO',
      'PCD',
      'LAUDO (SIM/NÃO)',
    ],
    ['1', 'THAYLA VITORIA FERNANDES MARTINS', '25/08/2021', 'F', 'PARDO', 'VILA: BRILHANTE', '*****', '*****'],
    ['2', 'KAUÊ DE AQUINO GUEDES', '01/06/2021', 'M', 'PARDO', 'VILA: BRILHANTE', '*****', '*****'],
    ['3', 'REBECA SANTOS RODRIGUES', '15/04/2020', 'F', 'PARDO', 'VILA: BRILHANTE', '*****', '*****'],
    ['4', 'SAMUEL SILVA SANTOS', '01/05/2021', 'M', 'PARDO', 'VILA: BRILHANTE', '*****', '*****'],
    ['5', 'THAYLLA EMANUELLY ALMEDIA DE SOUSA', '23/03/2022', 'F', 'PARDO', 'VILA: BRILHANTE', '*****', '*****'],
    ['6', 'LARISSA MANOELA SOUSA LOBATO', '10/11/2021', 'F', 'PARDO', 'VILA: BRILHANTE', '*****', '*****'],
    ['7', 'YASMIM ALVES REIS', '03/01/2022', 'F', 'PARDO', 'VILA: BRILHANTE', '*****', '*****'],
    ['8', 'MARIA CECILIA MARTINS MORAIS', '12/07/2021', 'F', 'PARDO', 'VILA: BRILHANTE', '*****', '*****'],
    ['9', 'ANA LARA BARROS ARAÚJO', '26/02/2021', 'F', 'PARDO', 'VILA: BRILHANTE', '*****', '*****'],
    ['10', 'VALENTINA SANTOS DA SILVA', '19/03/2021', 'F', 'PARDO', 'VILA: BRILHANTE', '*****', '*****'],
    ['11', 'MARIA JULIA PESSOA LOPES', '03/08/2020', 'F', 'PARDO', 'VILA: BRILHANTE', '*****', '*****'],
    ['12', 'THALISSON DE SOUSA SILVA', '16/12/2020', 'M', 'PARDO', 'VILA: BRILHANTE', '*****', '*****'],
    ['13', 'ENZO SAMUEL BATISTA OLIVEIRA', '12/05/2022', 'M', 'PARDO', 'VILA: BRILHANTE', '*****', '*****'],
    ['14', 'ÂNGELO MIGUEL ALVES LIMA', '22/04/2022', 'M', 'PARDO', 'VILA: BRILHANTE', '*****', '*****'],
    ['15', 'HELOISA BARROS DA SILVA', '05/06/2020', 'F', 'BRANCO', 'VILA: BRILHNATE', '*****', '*****'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 38 },
    { wch: 20 },
    { wch: 8 },
    { wch: 14 },
    { wch: 28 },
    { wch: 14 },
    { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Perfil_Alunos_Maria_da_Praia');
  XLSX.writeFile(wb, 'SucessoEdu_Modelo_Levantamento_Alunos_Maria_da_Praia.xlsx');
}
