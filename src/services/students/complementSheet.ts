/**
 * Planilha de complementação do cadastro dos alunos (Secretaria & Alunos).
 *
 * 1. A secretaria gera a planilha da escola (um aluno por linha, com o que já existe no cadastro
 *    e as células vazias em amarelo). A escola completa no Excel (CPF, data de nascimento, sexo,
 *    raça/cor, endereço, responsável, telefone, PCD e laudo).
 * 2. A planilha volta pelo botão "Importar complementação": cada aluno é achado pelo código do
 *    sistema (ou RA, ou nome + data de nascimento), só as células preenchidas são gravadas,
 *    nada é apagado e nome, escola e turma nunca mudam. CPF e datas são conferidos antes.
 *    As pendências resolvidas saem do cadastro.
 */
import type { RaceColorType, SchoolClass, SchoolUnit, Student } from '../../types';
import { cpfDigits, formatCpf, isCpfMissing, isValidCpf, withCpfPending } from '../../utils/studentDocuments';
import { AGE_GRADE_PENDING, cleanPlaceholder, isAgeFarFromGrade, isImpossibleBirthDate, parseFlexibleDate } from '../dataImportService';

/** Colunas da planilha, na ordem. `edit` = a escola preenche. */
export const COMPLEMENT_COLUMNS = [
  { key: 'seq', label: 'Nº', edit: false },
  { key: 'ra', label: 'RA (não alterar)', edit: false },
  { key: 'name', label: 'Nome do aluno (não alterar)', edit: false },
  { key: 'className', label: 'Turma (não alterar)', edit: false },
  { key: 'birthDate', label: 'Data de nascimento (DD/MM/AAAA)', edit: true },
  { key: 'cpf', label: 'CPF do aluno', edit: true },
  { key: 'gender', label: 'Sexo (M/F)', edit: true },
  { key: 'raceColor', label: 'Raça/Cor', edit: true },
  { key: 'address', label: 'Endereço / Localidade', edit: true },
  { key: 'guardianName', label: 'Nome do responsável', edit: true },
  { key: 'guardianPhone', label: 'Telefone do responsável', edit: true },
  { key: 'pcd', label: 'PCD / Deficiência (se houver)', edit: true },
  { key: 'laudo', label: 'Tem laudo? (SIM/NÃO)', edit: true },
  { key: 'missing', label: 'O que falta', edit: false },
  { key: 'id', label: 'Código do sistema (não alterar)', edit: false },
] as const;

export type ComplementKey = (typeof COMPLEMENT_COLUMNS)[number]['key'];
export type ComplementRow = Record<ComplementKey, string>;

/** Campos que a escola pode completar. */
export type ComplementField = 'birthDate' | 'cpf' | 'gender' | 'raceColor' | 'address' | 'guardianName' | 'guardianPhone' | 'pcd' | 'laudo';

export const FIELD_LABEL: Record<ComplementField, string> = {
  birthDate: 'Data de nascimento',
  cpf: 'CPF',
  gender: 'Sexo',
  raceColor: 'Raça/Cor',
  address: 'Endereço',
  guardianName: 'Responsável',
  guardianPhone: 'Telefone do responsável',
  pcd: 'PCD',
  laudo: 'Laudo',
};

const RACE_LABEL: Record<string, string> = {
  BRANCA: 'Branca',
  BRANCO: 'Branca',
  PARDA: 'Parda',
  PARDO: 'Parda',
  PRETA: 'Preta',
  NEGRO: 'Preta',
  AMARELA: 'Amarela',
  AMARELO: 'Amarela',
  INDIGENA: 'Indígena',
  INDIGINA: 'Indígena',
  NAO_DECLARADA: 'Não declarada',
};

const norm = (v: unknown) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();

const ADDRESS_PLACEHOLDER = /^ENDERECO PENDENTE|^LOCALIDADE DO POLO|^PENDENTE$|^NAO INFORMAD/;
const PLACEHOLDER_BIRTHS = new Set(['2020-01-01', '2012-01-01']);
const NO_MED = new Set(['', 'NAO DECLARADA', 'NAO', 'NENHUMA', 'NAO POSSUI', 'NAO INFORMADO']);

const hasPending = (s: Student, re: RegExp) => (s.pendingFields || []).some((f) => re.test(String(f || '').trim()));

const P = {
  birth: /^data de nascimento$/i,
  ageGrade: /^conferir data de nascimento/i,
  address: /^endere[cç]o/i,
  race: /^ra[cç]a/i,
  gender: /^sexo$/i,
  guardian: /^respons[aá]vel$/i,
  phone: /^telefone( do respons[aá]vel)?$/i,
  laudoEval: /^avalia[cç][aã]o de laudo/i,
  laudoProof: /^comprova[cç][aã]o de laudo/i,
};

function isoToBr(iso: string): string {
  const m = String(iso || '').slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

function currentBirth(s: Student): string {
  const iso = String(s.birthDate || '').slice(0, 10);
  if (!iso || PLACEHOLDER_BIRTHS.has(iso) || hasPending(s, P.birth) || isImpossibleBirthDate(iso)) return '';
  return isoToBr(iso);
}

function currentAddress(s: Student): string {
  const a = cleanPlaceholder(s.address);
  return a && !ADDRESS_PLACEHOLDER.test(norm(a)) ? a : '';
}

function currentRace(s: Student): string {
  const r = String(s.raceColor || '');
  if (!r || (r === 'NAO_DECLARADA' && hasPending(s, P.race))) return '';
  return RACE_LABEL[r] || '';
}

function currentPcd(s: Student): string {
  const m = cleanPlaceholder(s.medicalClassification);
  return m && !NO_MED.has(norm(m)) ? m : '';
}

function currentLaudo(s: Student): string {
  if (s.hasMedicalReport) return 'SIM';
  const t = norm(s.medicalReportText);
  if (t === 'NAO' && !hasPending(s, P.laudoEval)) return 'NÃO';
  return '';
}

/** Pendências legíveis do aluno (coluna "O que falta"). */
export function missingList(s: Student): string[] {
  const out: string[] = [];
  if (isCpfMissing(s.cpf)) out.push('CPF');
  else if (!isValidCpf(s.cpf)) out.push('CPF inválido');
  if (!currentBirth(s)) out.push('Data de nascimento');
  else if (hasPending(s, P.ageGrade)) out.push('Conferir data de nascimento (idade x série)');
  if (!s.gender || s.gender === 'OTHER') out.push('Sexo');
  if (!currentRace(s)) out.push('Raça/Cor');
  if (!currentAddress(s)) out.push('Endereço');
  if (!cleanPlaceholder(s.guardianName)) out.push('Responsável');
  if (!cpfDigits(s.guardianPhone).replace(/^0+$/, '')) out.push('Telefone do responsável');
  if (!currentLaudo(s) && (hasPending(s, P.laudoEval) || currentPcd(s))) out.push('Laudo (SIM/NÃO)');
  else if (currentPcd(s) && !s.hasMedicalReport) out.push('Entregar laudo (PCD)');
  return out;
}

/** Linhas da planilha (alunos em ordem de turma e nome). */
export function buildComplementRows(students: Student[], classes: SchoolClass[], onlyPending = false): ComplementRow[] {
  const classById = new Map(classes.map((c) => [c.id, c]));
  const list = students
    .map((s) => ({ s, missing: missingList(s), cls: classById.get(s.classId)?.name || '' }))
    .filter((x) => !onlyPending || x.missing.length > 0)
    .sort((a, b) => a.cls.localeCompare(b.cls, 'pt-BR') || String(a.s.name).localeCompare(String(b.s.name), 'pt-BR'));
  return list.map(({ s, missing, cls }, i) => ({
    seq: String(i + 1),
    ra: String(s.enrollmentNumber || ''),
    name: String(s.name || ''),
    className: cls || 'Sem turma',
    birthDate: currentBirth(s),
    cpf: isCpfMissing(s.cpf) ? '' : formatCpf(s.cpf),
    gender: s.gender === 'M' || s.gender === 'F' ? s.gender : '',
    raceColor: currentRace(s),
    address: currentAddress(s),
    guardianName: cleanPlaceholder(s.guardianName),
    guardianPhone: cpfDigits(s.guardianPhone).replace(/^0+$/, '') ? String(s.guardianPhone) : '',
    pcd: currentPcd(s),
    laudo: currentLaudo(s),
    missing: missing.join('; ') || 'Nada — cadastro completo',
    id: s.id,
  }));
}

/** Instruções da aba "Como preencher". */
export const COMPLEMENT_INSTRUCTIONS: [string, string][] = [
  ['1', 'Preencha só as células em amarelo (o que falta). Pode corrigir as que já vieram preenchidas, se estiverem erradas.'],
  ['2', 'Não altere RA, nome, turma nem o código do sistema: é por eles que o sistema acha o aluno. Não apague nem troque linhas de lugar entre alunos.'],
  ['3', 'CPF: 11 números, com ou sem pontos (ex.: 123.456.789-09). CPF errado ou repetido não é gravado.'],
  ['4', 'Data de nascimento: DD/MM/AAAA (ex.: 25/08/2018).'],
  ['5', 'Sexo: M ou F.  Raça/Cor: Branca, Preta, Parda, Amarela, Indígena ou Não declarada.'],
  ['6', 'PCD: escreva a deficiência só se o aluno tiver (ex.: TEA, Baixa visão).  Laudo: SIM ou NÃO.'],
  ['7', 'Célula deixada em branco não apaga nada no sistema.'],
  ['8', 'Salve como .xlsx e devolva à Secretaria: lá ela usa "Importar complementação" e confere tudo antes de gravar.'],
];

// ===================== Leitura da planilha devolvida =====================

const HEADER_KEYS: [ComplementKey, RegExp][] = [
  ['id', /^CODIGO DO SISTEMA|^CODIGO$|^ID$/],
  ['ra', /^RA\b|^MATRICULA/],
  ['name', /^NOME DO ALUNO|^ALUNO|^NOME$/],
  ['className', /^TURMA/],
  ['birthDate', /^DATA DE NASC|^NASCIMENTO|^DT\.? NASC/],
  ['cpf', /^CPF/],
  ['gender', /^SEXO/],
  ['raceColor', /^RACA|^COR\b/],
  ['address', /^ENDERECO/],
  ['guardianName', /^NOME DO RESPONSAVEL|^RESPONSAVEL$/],
  ['guardianPhone', /^TELEFONE|^FONE|^CELULAR/],
  ['pcd', /^PCD|^DEFICIENCIA/],
  ['laudo', /^TEM LAUDO|^LAUDO/],
  ['missing', /^O QUE FALTA/],
  ['seq', /^N[ºO°]?\.?$/],
];

function headerKey(label: unknown): ComplementKey | null {
  const t = norm(label);
  if (!t) return null;
  for (const [k, re] of HEADER_KEYS) if (re.test(t)) return k;
  return null;
}

export interface ParsedComplement {
  rows: (Partial<Record<ComplementKey, unknown>> & { line: number })[];
  /** Mensagem quando o arquivo não é a planilha de complementação. */
  error?: string;
}

/** Lê as linhas da aba (matriz de células). Acha a linha do cabeçalho pelo "RA" e "Nome". */
export function parseComplementMatrix(matrix: unknown[][]): ParsedComplement {
  let headerRow = -1;
  let map: (ComplementKey | null)[] = [];
  for (let r = 0; r < Math.min(matrix.length, 40); r++) {
    const keys = (matrix[r] || []).map(headerKey);
    if ((keys.includes('ra') || keys.includes('id')) && keys.includes('name')) {
      headerRow = r;
      map = keys;
      break;
    }
  }
  if (headerRow < 0) {
    return { rows: [], error: 'Não achei o cabeçalho da planilha (colunas "RA" e "Nome do aluno"). Use a planilha gerada pelo botão "Planilha de complementação".' };
  }
  const rows: ParsedComplement['rows'] = [];
  for (let r = headerRow + 1; r < matrix.length; r++) {
    const line = matrix[r] || [];
    const row: Partial<Record<ComplementKey, unknown>> & { line: number } = { line: r + 1 };
    map.forEach((k, ci) => {
      if (k && row[k] === undefined) row[k] = line[ci];
    });
    const nameOk = cleanPlaceholder(row.name);
    if (!nameOk && !cleanPlaceholder(row.ra) && !cleanPlaceholder(row.id)) continue;
    // Rodapés ("Conferido por...", "Total ...") não são alunos.
    if (/^(CONFERIDO POR|TOTAL)/.test(norm(row.seq ?? row.name))) continue;
    if (!nameOk) continue;
    rows.push(row);
  }
  return { rows };
}

// ===================== Conferência e aplicação =====================

export interface ComplementChange {
  field: ComplementField;
  from: string;
  to: string;
}

export interface ComplementPlanItem {
  line: number;
  student: Student;
  updated: Student;
  changes: ComplementChange[];
  /** Pendências que saem do cadastro. */
  resolved: string[];
  /** Campos recusados nesta linha (CPF inválido, data errada...). */
  warnings: string[];
}

export interface ComplementProblem {
  line: number;
  name: string;
  message: string;
}

export interface ComplementPlan {
  items: ComplementPlanItem[];
  /** Linhas sem nada novo. */
  unchanged: number;
  problems: ComplementProblem[];
  /** Total de pendências resolvidas. */
  resolvedCount: number;
}

function parseCpfCell(v: unknown): string {
  if (typeof v === 'number' && Number.isFinite(v)) return String(Math.round(v)).padStart(11, '0');
  return cleanPlaceholder(v);
}

function parseGenderStrict(v: string): 'M' | 'F' | null {
  const t = norm(v);
  if (['M', 'MASC', 'MASCULINO', 'MASCULINA', 'HOMEM', 'MENINO'].includes(t)) return 'M';
  if (['F', 'FEM', 'FEMININO', 'FEMININA', 'MULHER', 'MENINA'].includes(t)) return 'F';
  return null;
}

function parseRaceStrict(v: string): RaceColorType | null {
  const t = norm(v);
  if (/^NAO DECLARAD|^ND$|^NAO INFORMAD/.test(t)) return 'NAO_DECLARADA';
  if (t.startsWith('PARD')) return 'PARDA';
  if (t.startsWith('BRANC')) return 'BRANCA';
  if (t.startsWith('PRET') || t.startsWith('NEGR')) return 'PRETA';
  if (t.startsWith('AMAREL')) return 'AMARELA';
  if (t.startsWith('INDIG')) return 'INDIGENA';
  return null;
}

function parseLaudoStrict(v: string): boolean | null {
  const t = norm(v);
  if (['SIM', 'S', 'TEM', 'COM LAUDO', 'POSSUI'].includes(t)) return true;
  if (['NAO', 'N', 'NAO TEM', 'SEM LAUDO', 'NAO POSSUI'].includes(t)) return false;
  return null;
}

function parseBirthCell(v: unknown): { iso: string; ok: boolean } {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const iso = `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`;
    return { iso, ok: !isImpossibleBirthDate(iso) };
  }
  const p = parseFlexibleDate(typeof v === 'number' ? v : cleanPlaceholder(v));
  if (!p.isValid || !p.isoDate) return { iso: '', ok: false };
  return { iso: p.isoDate, ok: !isImpossibleBirthDate(p.isoDate) };
}

const keyNameBirth = (name: unknown, iso: string) => `${norm(name)}|${iso}`;

/**
 * Confere a planilha devolvida contra o cadastro: o que muda em cada aluno, as pendências que saem
 * e as linhas com problema. Não altera nada (a gravação é feita depois, com os `updated`).
 *
 * @param students alunos que este usuário pode alterar (a escola dele, ou a rede para a Sede)
 * @param allStudents todos os alunos conhecidos (para achar CPF repetido em outro aluno)
 */
export function planComplement(
  parsed: ParsedComplement,
  students: Student[],
  classes: SchoolClass[],
  allStudents: Student[] = students,
  now = new Date()
): ComplementPlan {
  const byId = new Map(students.map((s) => [s.id, s]));
  const byRa = new Map<string, Student[]>();
  const byNameBirth = new Map<string, Student[]>();
  students.forEach((s) => {
    const ra = norm(s.enrollmentNumber);
    if (ra) byRa.set(ra, [...(byRa.get(ra) || []), s]);
    const k = keyNameBirth(s.name, String(s.birthDate || '').slice(0, 10));
    byNameBirth.set(k, [...(byNameBirth.get(k) || []), s]);
  });
  const classById = new Map(classes.map((c) => [c.id, c]));

  // CPFs já usados por outros alunos (rede inteira).
  const cpfOwner = new Map<string, string>();
  allStudents.forEach((s) => {
    if (isValidCpf(s.cpf)) cpfOwner.set(cpfDigits(s.cpf), s.id);
  });
  // CPFs repetidos dentro do próprio arquivo.
  const fileCpfCount = new Map<string, number>();
  parsed.rows.forEach((r) => {
    const d = cpfDigits(parseCpfCell(r.cpf));
    if (d.length === 11 && !/^0+$/.test(d)) fileCpfCount.set(d, (fileCpfCount.get(d) || 0) + 1);
  });

  const plan: ComplementPlan = { items: [], unchanged: 0, problems: [], resolvedCount: 0 };
  const seen = new Set<string>();
  const stamp = now.toISOString();

  for (const r of parsed.rows) {
    const name = cleanPlaceholder(r.name);
    // ---- Achar o aluno ----
    let student: Student | undefined;
    const id = cleanPlaceholder(r.id);
    if (id) student = byId.get(id);
    if (!student) {
      const ra = norm(cleanPlaceholder(r.ra));
      const hits = ra ? byRa.get(ra) || [] : [];
      if (hits.length === 1) {
        if (norm(hits[0].name) !== norm(name)) {
          plan.problems.push({ line: r.line, name, message: `O RA ${cleanPlaceholder(r.ra)} é de ${hits[0].name}, não deste aluno. Linha não gravada.` });
          continue;
        }
        student = hits[0];
      }
    }
    if (!student) {
      const b = parseBirthCell(r.birthDate);
      const hits = b.ok ? byNameBirth.get(keyNameBirth(name, b.iso)) || [] : [];
      if (hits.length === 1) student = hits[0];
    }
    if (!student) {
      plan.problems.push({ line: r.line, name, message: 'Aluno não encontrado no cadastro desta escola (confira RA e código do sistema).' });
      continue;
    }
    if (seen.has(student.id)) {
      plan.problems.push({ line: r.line, name, message: 'Aluno repetido na planilha: só a primeira linha foi considerada.' });
      continue;
    }
    seen.add(student.id);

    // ---- Campos ----
    const s = student;
    const changes: ComplementChange[] = [];
    const warnings: string[] = [];
    const next: Student = { ...s };
    let pend = [...(s.pendingFields || [])];
    const drop = (re: RegExp) => {
      pend = pend.filter((f) => !re.test(String(f || '').trim()));
    };

    // CPF
    const cpfRaw = parseCpfCell(r.cpf);
    if (cpfRaw) {
      const d = cpfDigits(cpfRaw);
      if (!isValidCpf(d)) warnings.push(`CPF ${cpfRaw} inválido (não gravado)`);
      else if ((fileCpfCount.get(d) || 0) > 1) warnings.push(`CPF ${formatCpf(d)} repetido em outra linha da planilha (não gravado)`);
      else if (cpfOwner.has(d) && cpfOwner.get(d) !== s.id) {
        const other = allStudents.find((x) => x.id === cpfOwner.get(d));
        warnings.push(`CPF ${formatCpf(d)} já é de ${other?.name || 'outro aluno'} (não gravado)`);
      } else if (cpfDigits(s.cpf) !== d) {
        changes.push({ field: 'cpf', from: isCpfMissing(s.cpf) ? '' : formatCpf(s.cpf), to: formatCpf(d) });
        next.cpf = formatCpf(d);
      }
    }

    // Data de nascimento
    const birthCell = r.birthDate;
    if (cleanPlaceholder(birthCell instanceof Date ? 'x' : birthCell) || typeof birthCell === 'number') {
      const b = parseBirthCell(birthCell);
      if (!b.ok) warnings.push(`Data de nascimento "${cleanPlaceholder(birthCell)}" inválida (não gravada)`);
      else if (b.iso !== String(s.birthDate || '').slice(0, 10) || hasPending(s, P.birth)) {
        if (b.iso !== String(s.birthDate || '').slice(0, 10)) changes.push({ field: 'birthDate', from: currentBirth(s), to: isoToBr(b.iso) });
        next.birthDate = b.iso;
        drop(P.birth);
        drop(P.ageGrade);
        const serie = classById.get(s.classId)?.gradeLevel || '';
        if (serie && isAgeFarFromGrade(b.iso, serie, now.getFullYear())) pend.push(AGE_GRADE_PENDING);
      }
    }

    // Sexo
    const gRaw = cleanPlaceholder(r.gender);
    if (gRaw) {
      const g = parseGenderStrict(gRaw);
      if (!g) warnings.push(`Sexo "${gRaw}" não reconhecido (use M ou F)`);
      else {
        if (g !== s.gender) changes.push({ field: 'gender', from: s.gender === 'M' || s.gender === 'F' ? s.gender : '', to: g });
        next.gender = g;
        drop(P.gender);
      }
    }

    // Raça/Cor
    const rRaw = cleanPlaceholder(r.raceColor);
    if (rRaw) {
      const rc = parseRaceStrict(rRaw);
      if (!rc) warnings.push(`Raça/Cor "${rRaw}" não reconhecida`);
      else {
        if (rc !== s.raceColor) changes.push({ field: 'raceColor', from: currentRace(s), to: RACE_LABEL[rc] });
        next.raceColor = rc;
        drop(P.race);
      }
    }

    // Endereço
    const addr = cleanPlaceholder(r.address);
    if (addr && !ADDRESS_PLACEHOLDER.test(norm(addr))) {
      if (norm(addr) !== norm(s.address)) changes.push({ field: 'address', from: currentAddress(s), to: addr });
      next.address = addr;
      drop(P.address);
    }

    // Responsável e telefone
    const gName = cleanPlaceholder(r.guardianName);
    if (gName) {
      if (norm(gName) !== norm(s.guardianName)) changes.push({ field: 'guardianName', from: cleanPlaceholder(s.guardianName), to: gName });
      next.guardianName = gName;
      drop(P.guardian);
    }
    const phoneRaw = typeof r.guardianPhone === 'number' ? String(r.guardianPhone) : cleanPlaceholder(r.guardianPhone);
    if (phoneRaw) {
      const digits = cpfDigits(phoneRaw);
      if (digits.length < 8 || digits.length > 13) warnings.push(`Telefone "${phoneRaw}" incompleto (não gravado)`);
      else {
        if (cpfDigits(s.guardianPhone) !== digits) changes.push({ field: 'guardianPhone', from: cpfDigits(s.guardianPhone) ? String(s.guardianPhone) : '', to: phoneRaw });
        next.guardianPhone = phoneRaw;
        drop(P.phone);
      }
    }

    // PCD e laudo
    const pcd = cleanPlaceholder(r.pcd);
    if (pcd && !NO_MED.has(norm(pcd))) {
      if (norm(pcd) !== norm(s.medicalClassification)) changes.push({ field: 'pcd', from: currentPcd(s), to: pcd });
      next.medicalClassification = pcd;
    }
    const lRaw = cleanPlaceholder(r.laudo);
    if (lRaw) {
      const l = parseLaudoStrict(lRaw);
      if (l === null) warnings.push(`Laudo "${lRaw}" não reconhecido (use SIM ou NÃO)`);
      else {
        const txt = l ? 'SIM' : 'NÃO';
        if (Boolean(s.hasMedicalReport) !== l || norm(s.medicalReportText) !== norm(txt)) changes.push({ field: 'laudo', from: currentLaudo(s), to: txt });
        next.hasMedicalReport = l;
        next.medicalReportText = txt;
        drop(P.laudoEval);
        if (l) drop(P.laudoProof);
      }
    }
    // PCD declarado sem laudo: continua pendente a comprovação.
    if (currentPcd(next) && !next.hasMedicalReport && !pend.some((f) => P.laudoProof.test(String(f).trim()))) {
      pend.push('Comprovação de Laudo Médico (PCD)');
    }

    // A pendência de CPF só é refeita quando o CPF mudou (troca de rótulo sozinha não é novidade).
    if (next.cpf !== s.cpf) pend = withCpfPending(pend, next.cpf);
    const before = new Set((s.pendingFields || []).map((f) => String(f).trim()));
    const after = new Set(pend.map((f) => String(f).trim()));
    const resolved = [...before].filter((f) => !after.has(f));
    const pendChanged = before.size !== after.size || resolved.length > 0;

    if (changes.length === 0 && !pendChanged) {
      if (warnings.length) plan.problems.push({ line: r.line, name: s.name, message: warnings.join('; ') });
      else plan.unchanged += 1;
      continue;
    }
    next.pendingFields = pend;
    next.cadastralStatus = pend.length === 0 && isValidCpf(next.cpf) ? 'OK' : s.cadastralStatus === 'OK' ? 'INCOMPLETE' : s.cadastralStatus || 'INCOMPLETE';
    next.updatedAt = stamp;
    plan.items.push({ line: r.line, student: s, updated: next, changes, resolved, warnings });
    plan.resolvedCount += resolved.length;
  }
  return plan;
}

/** Nome do arquivo: "Complementacao_Cadastro_<escola>_<data>.xlsx". */
export function complementFileName(unit: Pick<SchoolUnit, 'name'> | undefined, now = new Date()): string {
  const school = norm(unit?.name || 'Escola')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
  const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return `Complementacao_Cadastro_${school}_${d}.xlsx`;
}
