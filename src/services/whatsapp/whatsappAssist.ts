/**
 * Envio assistido de WhatsApp.
 *
 * O sistema NÃO envia mensagens sozinho: ele monta a lista de destinatários com
 * o texto de cada um já preenchido e abre o WhatsApp (Web ou aplicativo) na
 * conversa certa. Quem opera clica em "Enviar" dentro do WhatsApp.
 * Por isso o histórico registra "Aberto no WhatsApp", nunca "entregue" ou "lido".
 */
import type { SchoolClass, SchoolUnit, Student, UserAccount, WhatsAppRecipientRole } from '../../types';

// ---------------------------------------------------------------------------
// Telefones
// ---------------------------------------------------------------------------

/**
 * Normaliza um telefone brasileiro para o formato do WhatsApp (só dígitos, com 55).
 * Retorna '' quando o número não é utilizável.
 *   "(94) 98435-8694" -> "5594984358694"
 *   "094 98435 8694"  -> "5594984358694"
 *   "+55 94 98435-8694" -> "5594984358694"
 */
export function normalizeWhatsAppPhone(raw: string | undefined | null): string {
  let d = String(raw || '').replace(/\D/g, '');
  if (!d) return '';
  // Números de exemplo antigos do sistema nunca devem receber mensagem.
  if (FAKE_PHONES.has(d) || FAKE_PHONES.has(d.replace(/^55/, ''))) return '';
  d = d.replace(/^0+/, '');
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) return d;
  if (d.length === 10 || d.length === 11) return `55${d}`;
  return '';
}

/** Números fictícios que existiam no código de demonstração. */
const FAKE_PHONES = new Set(['11987654321', '5511987654321', '1134567890', '551134567890']);

/** Exibe "5594984358694" como "(94) 98435-8694". */
export function formatPhoneBR(normalized: string): string {
  const d = normalized.replace(/^55/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return normalized;
}

// ---------------------------------------------------------------------------
// Público e destinatários
// ---------------------------------------------------------------------------

export type AudienceKind = 'ALUNO' | 'TURMA' | 'ESCOLA' | 'PROFISSIONAIS';
/** Para públicos de alunos: mandar ao responsável, ao próprio aluno ou aos dois. */
export type StudentContact = 'RESPONSAVEL' | 'ALUNO' | 'AMBOS';
export type StaffFilter = 'PROFESSORES' | 'EQUIPE';

export interface Audience {
  kind: AudienceKind;
  studentId?: string;
  classId?: string;
  /** '' = todas as escolas. */
  unitId?: string;
  contact?: StudentContact;
  staff?: StaffFilter;
}

export interface Recipient {
  key: string;
  name: string;
  phone: string; // normalizado ('' = sem telefone válido)
  rawPhone: string; // como está no cadastro
  role: WhatsAppRecipientRole;
  studentIds: string[];
  studentNames: string[];
  className?: string;
  responsavel?: string;
}

const INACTIVE = new Set(['TRANSFERRED', 'EVADIDO', 'CONCLUDED']);
const STAFF_SECTORS = new Set(['DIRETORIA', 'COORDENACAO', 'SECRETARIA', 'PROFESSOR', 'GESTOR_MUNICIPAL', 'MASTER']);

function unitOfStudent(s: Student, classes: SchoolClass[]): string {
  if (s.schoolUnitId) return s.schoolUnitId;
  return classes.find((c) => c.id === s.classId)?.schoolUnitId || '';
}

function joinNames(names: string[]): string {
  const u = Array.from(new Set(names.filter(Boolean)));
  if (u.length <= 1) return u[0] || '';
  return `${u.slice(0, -1).join(', ')} e ${u[u.length - 1]}`;
}

/** Alunos ativos alcançados pelo público escolhido. */
export function studentsForAudience(a: Audience, students: Student[], classes: SchoolClass[]): Student[] {
  const active = (students || []).filter((s) => s && !INACTIVE.has(String(s.status || '')));
  if (a.kind === 'ALUNO') return active.filter((s) => s.id === a.studentId);
  if (a.kind === 'TURMA') return active.filter((s) => s.classId === a.classId);
  if (a.kind === 'ESCOLA') return a.unitId ? active.filter((s) => unitOfStudent(s, classes) === a.unitId) : active;
  return [];
}

/**
 * Monta a lista de destinatários. Responsáveis com o mesmo telefone (irmãos)
 * recebem UMA mensagem, com os nomes dos alunos juntos.
 */
export function buildRecipients(
  a: Audience,
  students: Student[],
  classes: SchoolClass[],
  userAccounts: UserAccount[],
  units: SchoolUnit[] = []
): Recipient[] {
  const out: Recipient[] = [];

  if (a.kind === 'PROFISSIONAIS') {
    const staff = (userAccounts || []).filter((u) => {
      if (!u || u.active === false) return false;
      if (!STAFF_SECTORS.has(String(u.sector))) return false;
      if (a.staff === 'PROFESSORES' && !(u.sector === 'PROFESSOR' || u.role === 'TEACHER')) return false;
      if (a.unitId && u.schoolUnitId && u.schoolUnitId !== a.unitId) return false;
      return true;
    });
    const byPhone = new Map<string, Recipient>();
    for (const u of staff) {
      const phone = normalizeWhatsAppPhone(u.phone);
      const role: WhatsAppRecipientRole =
        u.sector === 'PROFESSOR' ? 'PROFESSOR' : u.sector === 'COORDENACAO' ? 'COORDENACAO' : u.sector === 'SECRETARIA' ? 'SECRETARIA' : 'DIRETORIA';
      if (phone && byPhone.has(phone)) continue;
      const r: Recipient = { key: `u-${u.id}`, name: u.name, phone, rawPhone: u.phone || '', role, studentIds: [], studentNames: [] };
      if (phone) byPhone.set(phone, r);
      out.push(r);
    }
    return out.sort((x, y) => x.name.localeCompare(y.name, 'pt-BR'));
  }

  const list = studentsForAudience(a, students, classes);
  const contact = a.contact || 'RESPONSAVEL';
  const byPhone = new Map<string, Recipient>();
  const className = (s: Student) => {
    const c = classes.find((k) => k.id === s.classId);
    return c?.name || s.gradeLevel || '';
  };

  const add = (key: string, name: string, raw: string, role: WhatsAppRecipientRole, s: Student, responsavel?: string) => {
    const phone = normalizeWhatsAppPhone(raw);
    const dedupeKey = phone ? `${role}:${phone}` : '';
    if (dedupeKey && byPhone.has(dedupeKey)) {
      const r = byPhone.get(dedupeKey)!;
      r.studentIds.push(s.id);
      r.studentNames.push(s.name);
      const cn = className(s);
      if (cn && r.className && !r.className.split(' / ').includes(cn)) r.className = `${r.className} / ${cn}`;
      return;
    }
    const r: Recipient = {
      key,
      name,
      phone,
      rawPhone: raw || '',
      role,
      studentIds: [s.id],
      studentNames: [s.name],
      className: className(s),
      responsavel,
    };
    if (dedupeKey) byPhone.set(dedupeKey, r);
    out.push(r);
  };

  for (const s of list) {
    if (contact === 'RESPONSAVEL' || contact === 'AMBOS') {
      const g = (s.guardianName || '').trim();
      add(`r-${s.id}`, g || `Responsável de ${s.name}`, s.guardianPhone, 'RESPONSAVEL', s, g || 'Responsável');
    }
    if (contact === 'ALUNO' || contact === 'AMBOS') {
      add(`a-${s.id}`, s.name, s.phone, 'ALUNO', s, (s.guardianName || '').trim() || 'Responsável');
    }
  }
  void units;
  return out.sort((x, y) => (x.studentNames[0] || x.name).localeCompare(y.studentNames[0] || y.name, 'pt-BR'));
}

// ---------------------------------------------------------------------------
// Texto
// ---------------------------------------------------------------------------

export interface SchoolInfo {
  name: string;
  phone: string;
}

/** Preenche as variáveis {{...}} para um destinatário. Variáveis desconhecidas ficam como estão. */
export function fillMessage(template: string, r: Recipient | null, school: SchoolInfo, extra: Record<string, string> = {}): string {
  const today = new Intl.DateTimeFormat('pt-BR').format(new Date());
  const values: Record<string, string> = {
    aluno: r ? joinNames(r.studentNames) || r.name : '',
    responsavel: r?.responsavel || r?.name || '',
    nome: r?.name || '',
    turma: r?.className || '',
    escola: school.name || '',
    telefone_escola: school.phone || '',
    data: today,
    ...extra,
  };
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (m, k: string) => {
    const v = values[k.toLowerCase()];
    return v !== undefined && v !== '' ? v : m;
  });
}

/** Variáveis que continuam sem valor depois de preencher (ex.: {{data_reuniao}}). */
export function missingVariables(text: string): string[] {
  return Array.from(new Set((text.match(/\{\{\s*[a-z_]+\s*\}\}/gi) || []).map((v) => v.replace(/\s/g, ''))));
}

// ---------------------------------------------------------------------------
// Abrir o WhatsApp
// ---------------------------------------------------------------------------

export type OpenMode = 'WEB' | 'APP';

export function whatsappUrl(phone: string, text: string, mode: OpenMode): string {
  const t = encodeURIComponent(text);
  return mode === 'APP'
    ? `whatsapp://send?phone=${phone}&text=${t}`
    : `https://web.whatsapp.com/send?phone=${phone}&text=${t}`;
}

/**
 * Abre a conversa. No modo Web usa sempre a MESMA aba (nome fixo), para não
 * acumular dezenas de abas durante um envio em lote.
 */
export function openWhatsApp(phone: string, text: string, mode: OpenMode): boolean {
  const url = whatsappUrl(phone, text, mode);
  if (mode === 'APP') {
    const a = document.createElement('a');
    a.href = url;
    a.rel = 'noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  }
  const w = window.open(url, 'sucessoedu_whatsapp');
  return !!w;
}

export const OPEN_MODE_KEY = 'sucessoedu_whatsapp_open_mode_v1';

export function loadOpenMode(): OpenMode {
  try {
    return localStorage.getItem(OPEN_MODE_KEY) === 'APP' ? 'APP' : 'WEB';
  } catch {
    return 'WEB';
  }
}

export function saveOpenMode(m: OpenMode): void {
  try {
    localStorage.setItem(OPEN_MODE_KEY, m);
  } catch {
    /* sem armazenamento: vale só nesta sessão */
  }
}

/** Registros de demonstração antigos (não são envios reais). */
export function isDemoLog(id: string | undefined): boolean {
  return /^wpp-\d{3}$/.test(String(id || ''));
}
