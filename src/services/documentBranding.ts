/**
 * Timbre padrão dos documentos e relatórios.
 *
 * Toda impressão, PDF ou Word gerado pelo sistema começa com o mesmo cabeçalho:
 *   - à esquerda, a logo da Gestão Municipal (Prefeitura / brasão);
 *   - no centro, Prefeitura, Secretaria de Educação e, quando houver, a escola;
 *   - à direita, a logo da SEMED e a logo da escola (se estiver cadastrada).
 *
 * As logos vêm dos cadastros: Rede Municipal & Polos > Secretaria (Gestão e SEMED)
 * e Rede Municipal & Polos > Escolas (logo de cada escola). O App mantém estes
 * dados atualizados com setDocumentBranding().
 */
import type { MunicipalSecretaryInfo, SchoolClass, SchoolSettings, SchoolUnit } from '../types';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface BrandingSchool {
  id: string;
  name: string;
  inepCode?: string;
  logoUrl?: string;
  /** Corpo diretivo do cadastro da escola (assinaturas dos relatórios da escola). */
  directorName?: string;
  coordinatorName?: string;
  secretaryName?: string;
}

/**
 * Quem assina pela escola: Direção, Coordenação Pedagógica ou Secretaria Escolar
 * (nomes do cadastro da escola em Rede Municipal & Polos > Escolas).
 */
export type SignerRole = 'DIRECAO' | 'COORDENACAO' | 'SECRETARIA_ESCOLAR';

export interface DocumentBrandingState {
  managementLogoUrl: string;
  semedLogoUrl: string;
  cityName: string;
  stateCode: string;
  semedName: string;
  schools: Map<string, BrandingSchool>;
  classSchool: Map<string, string>;
  defaultSchoolUnitId?: string;
  /** Quem está logado e emite o documento (nome completo e cargo). */
  issuerName: string;
  issuerRole: string;
  /** Titular da Secretaria de Educação (assinatura dos documentos oficiais). */
  secretaryName: string;
  secretaryRole: string;
}

/** Qual escola aparece no timbre. Sem nada, usa a escola do usuário (ou a única da rede). */
export interface LetterheadTarget {
  schoolUnitId?: string;
  classId?: string;
  schoolName?: string;
  /** Quem assina pela escola. Sem isso, vale o módulo aberto (ver setDocumentSignContext). */
  signers?: SignerRole[];
}

let state: DocumentBrandingState = {
  managementLogoUrl: '',
  semedLogoUrl: '',
  cityName: '',
  stateCode: '',
  semedName: 'Secretaria Municipal de Educação',
  schools: new Map(),
  classSchool: new Map(),
  issuerName: '',
  issuerRole: '',
  secretaryName: '',
  secretaryRole: '',
};

const cleanUrl = (u?: string | null) => (typeof u === 'string' && /^(data:image\/|https?:\/\/|\/)/i.test(u.trim()) ? u.trim() : '');

export function setDocumentBranding(input: {
  settings?: Partial<SchoolSettings> | null;
  secretary?: Partial<MunicipalSecretaryInfo> | null;
  schoolUnits?: SchoolUnit[] | null;
  classes?: SchoolClass[] | null;
  defaultSchoolUnitId?: string;
  issuer?: { name?: string; role?: string } | null;
}): void {
  const s = input.settings || {};
  const sec = input.secretary || {};
  const schools = new Map<string, BrandingSchool>();
  const networkMgmtLogo = cleanUrl(sec.managementLogoUrl) || cleanUrl(s.managementLogoUrl);
  for (const u of input.schoolUnits || []) {
    if (!u?.id) continue;
    // Escola cuja imagem foi enviada no antigo campo "Logo da Gestão / Mantenedora" do cadastro
    // da escola (até 03/10/2026): essa imagem é a logo dela.
    const ownMgmt = cleanUrl((u as any).managementLogoUrl);
    schools.set(String(u.id), {
      id: String(u.id),
      name: u.name || '',
      inepCode: u.inepCode,
      logoUrl: cleanUrl(u.logoUrl) || (ownMgmt && ownMgmt !== networkMgmtLogo ? ownMgmt : ''),
      directorName: u.directorName || '',
      coordinatorName: u.coordinatorName || '',
      secretaryName: u.secretaryName || '',
    });
  }
  const classSchool = new Map<string, string>();
  for (const c of input.classes || []) {
    if (c?.id && (c as any).schoolUnitId) classSchool.set(String(c.id), String((c as any).schoolUnitId));
  }
  let defaultId = input.defaultSchoolUnitId && schools.has(input.defaultSchoolUnitId) ? input.defaultSchoolUnitId : undefined;
  if (!defaultId && schools.size === 1) defaultId = Array.from(schools.keys())[0];
  state = {
    managementLogoUrl: cleanUrl(sec.managementLogoUrl) || cleanUrl(s.managementLogoUrl),
    semedLogoUrl: cleanUrl(sec.logoUrl) || cleanUrl(s.logoUrl),
    cityName: sec.city || s.city || '',
    stateCode: sec.state || s.state || '',
    semedName: sec.name || s.tradeName || s.name || 'Secretaria Municipal de Educação',
    schools,
    classSchool,
    defaultSchoolUnitId: defaultId,
    issuerName: formatPersonName(input.issuer?.name),
    issuerRole: ((r) => (r && r === r.toLowerCase() ? r.charAt(0).toUpperCase() + r.slice(1) : r))(String(input.issuer?.role || '').trim()),
    ...splitSecretary(sec.secretaryDirector, sec.secretaryDirectorRole),
  };
  // Prepara as versões reduzidas das logos em segundo plano (uma vez por logo).
  if (typeof document !== 'undefined') setTimeout(() => void preloadLogos().catch(() => {}), 0);
}

/**
 * Nome próprio para assinaturas: "marcia tavares de sousa" → "Marcia Tavares de Sousa".
 * Só ajusta nomes gravados todos em minúsculas ou todos em maiúsculas (os demais ficam como estão).
 */
export function formatPersonName(raw?: string): string {
  const t = String(raw || '').trim().replace(/\s+/g, ' ');
  if (!t || (t !== t.toLowerCase() && t !== t.toUpperCase())) return t;
  const small = new Set(['da', 'das', 'de', 'do', 'dos', 'e', 'di', 'du', 'del']);
  return t
    .toLowerCase()
    .split(' ')
    .map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

/**
 * Separa vários nomes gravados no mesmo campo (ex.: duas coordenadoras):
 * "Simone Menezes e Wandicleia Mota de Medeiros" → ["Simone Menezes", "Wandicleia Mota de Medeiros"].
 * Também aceita vírgula, ponto e vírgula, barra e quebra de linha. O " e " só separa quando
 * os dois lados têm nome e sobrenome (não quebra nomes como "Maria e Silva" sem sobrenome).
 */
export function splitPersonNames(raw?: string): string[] {
  const text = String(raw || '').trim();
  if (!text) return [];
  const out: string[] = [];
  for (const chunk of text.split(/\s*(?:[;,\/\n]|\s&\s)\s*/)) {
    const part = chunk.trim();
    if (!part) continue;
    const pieces = part.split(/\s+e\s+/i);
    if (pieces.length > 1 && pieces.every((p) => p.trim().split(/\s+/).length >= 2)) {
      pieces.forEach((p) => out.push(p.trim()));
    } else {
      out.push(part);
    }
  }
  return out.filter(Boolean);
}

/** Junta nomes para gravar num campo só: "A e B", "A, B e C". */
export function joinPersonNames(names: string[]): string {
  const list = names.map((n) => String(n || '').trim().replace(/\s+/g, ' ')).filter(Boolean);
  if (list.length <= 1) return list[0] || '';
  return `${list.slice(0, -1).join(', ')} e ${list[list.length - 1]}`;
}

/* ---------- Assinaturas da escola ---------- */

/** Quem assina pela escola no módulo aberto (o App atualiza ao trocar de módulo). */
let signContext: SignerRole[] | null = null;
export function setDocumentSignContext(roles: SignerRole[] | null): void {
  signContext = roles && roles.length ? roles : null;
}

/** Quem assina em cada módulo: pedagógico = Coordenação; Secretaria = Secretário(a) e Direção. */
export function signersForModule(tabId: string): SignerRole[] | null {
  const COORD = new Set([
    'TEACHER_PORTAL', 'PROFESSOR', 'PROFESSOR_DASHBOARD', 'CLASS_DIARY', 'PEDAGOGICAL_DASHBOARD',
    'BNCC_SKILLS', 'ASSESSMENT_REPORT', 'EXAMS', 'QUESTION_BANK', 'QUESTIONS', 'STUDENT_ROOM',
  ]);
  const SECRETARIA = new Set(['MAIN_DASHBOARD', 'STUDENTS', 'CLASSES', 'DOCUMENTS', 'DROPOUT_CENSUS', 'CENSUS']);
  const DIRECAO = new Set(['COMMUNICATION', 'WHATSAPP', 'NOTIFICATIONS']);
  if (COORD.has(tabId)) return ['COORDENACAO'];
  if (SECRETARIA.has(tabId)) return ['SECRETARIA_ESCOLAR', 'DIRECAO'];
  if (DIRECAO.has(tabId)) return ['DIRECAO'];
  return null;
}

export interface Signer {
  name: string;
  role: string;
}

const ROLE_LABEL: Record<SignerRole, string> = {
  DIRECAO: 'Diretor(a) Escolar',
  COORDENACAO: 'Coordenador(a) Pedagógico(a)',
  SECRETARIA_ESCOLAR: 'Secretário(a) Escolar',
};

/**
 * Assinaturas da escola do documento. Campo vazio no cadastro: assina a Direção.
 * Sem escola (relatório da rede) ou sem nomes cadastrados: lista vazia (assina a Secretaria de Educação).
 */
export function schoolSigners(target?: LetterheadTarget): Signer[] {
  const roles = target?.signers || signContext;
  if (!roles) return [];
  const school = resolveLetterheadSchool(target);
  if (!school) return [];
  const field = (r: SignerRole) =>
    r === 'DIRECAO' ? school.directorName : r === 'COORDENACAO' ? school.coordinatorName : school.secretaryName;
  const out: Signer[] = [];
  const seen = new Set<string>();
  const add = (r: SignerRole) => {
    for (const n of splitPersonNames(field(r))) {
      const name = formatPersonName(n);
      const key = name.toLowerCase();
      if (!name || seen.has(key)) continue;
      seen.add(key);
      out.push({ name, role: ROLE_LABEL[r] });
    }
  };
  roles.forEach(add);
  if (!out.length) add('DIRECAO');
  return out;
}

/** Linhas de assinatura lado a lado (até 3 por linha). Tabela: funciona na impressão e no Word. */
export function signatureBlocksHtml(signers: Signer[]): string {
  if (!signers.length) return '';
  const rows: Signer[][] = [];
  for (let i = 0; i < signers.length; i += 3) rows.push(signers.slice(i, i + 3));
  const tr = (row: Signer[]) => {
    const w = Math.floor(100 / row.length);
    return `<tr>${row
      .map(
        (sg) => `<td width="${w}%" style="width:${w}%;padding:34px 14px 0;text-align:center;vertical-align:top;border:none;font-size:11px;line-height:1.3">
    <div style="border-top:1px solid #0f172a;padding-top:4px;font-weight:700">${escapeHtml(sg.name)}</div>
    <div>${escapeHtml(sg.role)}</div>
  </td>`
      )
      .join('')}</tr>`;
  };
  return `<table data-sucessoedu-signers="1" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;border:none;margin-top:8px;page-break-inside:avoid;font-family:Arial,Helvetica,sans-serif;color:#0f172a">${rows
    .map(tr)
    .join('')}</table>`;
}

/** Bloco de assinaturas da escola do documento ('' quando não há escola ou nomes cadastrados). */
export function schoolSignatureHtml(target?: LetterheadTarget): string {
  return signatureBlocksHtml(schoolSigners(target));
}

/** "Augusta (Secretária Municipal de Educação)" → nome e cargo separados. */
function splitSecretary(raw?: string, role?: string): { secretaryName: string; secretaryRole: string } {
  const text = String(raw || '').trim();
  const m = text.match(/^(.*?)\s*\((.+)\)\s*$/);
  const name = formatPersonName((m ? m[1] : text).trim());
  const r = String(role || (m ? m[2] : '') || '').trim() || (name ? 'Secretário(a) Municipal de Educação' : '');
  return { secretaryName: name, secretaryRole: r };
}

/**
 * Quem assina os documentos: o(a) titular da Secretaria (cadastro Rede Municipal & Polos >
 * Secretaria) e quem está logado e emite. Os valores das Configurações da escola ficam
 * apenas como reserva, quando esses cadastros estiverem vazios.
 */
export function resolveSignatories(fallback?: {
  principalName?: string;
  principalTitle?: string;
  secretaryName?: string;
  secretaryRegistration?: string;
}): { principalName: string; principalTitle: string; issuerName: string; issuerTitle: string } {
  const fb = splitSecretary(fallback?.principalName, fallback?.principalTitle);
  return {
    principalName: state.secretaryName || fb.secretaryName,
    principalTitle: state.secretaryRole || fb.secretaryRole,
    issuerName: state.issuerName || formatPersonName(fallback?.secretaryName),
    issuerTitle: state.issuerRole || String(fallback?.secretaryRegistration || ''),
  };
}

/** Marca usada para não repetir o rodapé de emissão. */
export const ISSUER_MARK = 'data-sucessoedu-issuer';

/**
 * Rodapé dos documentos: quem emitiu (usuário logado, com nome completo e cargo), data e hora,
 * e o bloco de assinatura do(a) titular da Secretaria de Educação.
 */
/** O documento já traz o próprio bloco de assinatura? Então o rodapé não repete o da Secretaria. */
function hasOwnSignature(html: string): boolean {
  return /assinatura|_{8,}|border-top:\s*1px solid[^"]*"[^>]*>\s*[^<]{3,}<\/div>\s*<div[^>]*>\s*(diretor|secret|coorden)/i.test(html);
}

export function issuerFooterHtml(includeSignature = true, target?: LetterheadTarget): string {
  const now = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const issuer = state.issuerName
    ? `Emitido por <strong>${escapeHtml(state.issuerName)}</strong>${state.issuerRole ? ` (${escapeHtml(state.issuerRole)})` : ''} em ${escapeHtml(now)}`
    : `Emitido em ${escapeHtml(now)}`;
  // Documento de uma escola: assina quem responde por ela (Coordenação, Secretaria Escolar ou
  // Direção, conforme o módulo). Relatório da rede: assina o(a) titular da Secretaria de Educação.
  const schoolSign = includeSignature ? schoolSignatureHtml(target) : '';
  const sign = schoolSign
    ? schoolSign
    : includeSignature && state.secretaryName
    ? `<div style="margin:36px auto 0;width:300px;text-align:center;font-size:11px;line-height:1.3">
    <div style="border-top:1px solid #0f172a;padding-top:4px;font-weight:700">${escapeHtml(state.secretaryName)}</div>
    <div>${escapeHtml(state.secretaryRole)}</div>
  </div>`
    : '';
  return `<div ${ISSUER_MARK}="1" style="margin-top:24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;page-break-inside:avoid">
  ${sign}
  <div style="margin-top:16px;border-top:1px solid #cbd5e1;padding-top:4px;font-size:9px;color:#475569">${issuer} • ${escapeHtml(state.semedName)}</div>
</div>`;
}

export function getDocumentBranding(): DocumentBrandingState {
  return state;
}

const norm = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export function resolveLetterheadSchool(target?: LetterheadTarget): BrandingSchool | undefined {
  const t = target || {};
  if (t.schoolUnitId && state.schools.has(t.schoolUnitId)) return state.schools.get(t.schoolUnitId);
  if (t.classId) {
    const id = state.classSchool.get(String(t.classId));
    if (id && state.schools.has(id)) return state.schools.get(id);
  }
  if (t.schoolName) {
    const n = norm(t.schoolName);
    for (const s of state.schools.values()) if (s.name && norm(s.name) === n) return s;
  }
  return state.defaultSchoolUnitId ? state.schools.get(state.defaultSchoolUnitId) : undefined;
}

/** Marca usada para não repetir o timbre quando o documento já o tem. */
export const LETTERHEAD_MARK = 'data-sucessoedu-letterhead';

/**
 * Área útil da imagem: tira a margem transparente ou branca em volta do desenho.
 * Muitas logos vêm com bastante sobra; no timbre (altura fixa) o desenho ficava pequeno.
 */
export function contentBounds(img: CanvasImageSource, w: number, h: number): { x: number; y: number; w: number; h: number } {
  const full = { x: 0, y: 0, w, h };
  try {
    const k = Math.min(1, 400 / Math.max(w, h));
    const cw = Math.max(1, Math.round(w * k));
    const ch = Math.max(1, Math.round(h * k));
    const c = document.createElement('canvas');
    c.width = cw;
    c.height = ch;
    const ctx = c.getContext('2d');
    if (!ctx) return full;
    ctx.drawImage(img, 0, 0, cw, ch);
    const px = ctx.getImageData(0, 0, cw, ch).data;
    let minX = cw, minY = ch, maxX = -1, maxY = -1;
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const i = (y * cw + x) * 4;
        const a = px[i + 3];
        const nearWhite = px[i] > 244 && px[i + 1] > 244 && px[i + 2] > 244;
        if (a > 16 && !nearWhite) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return full;
    const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.03);
    const bx = Math.max(0, minX - pad);
    const by = Math.max(0, minY - pad);
    const bw = Math.min(cw, maxX + pad + 1) - bx;
    const bh = Math.min(ch, maxY + pad + 1) - by;
    // Quase sem sobra: mantém a imagem como está.
    if (bw * bh > cw * ch * 0.92) return full;
    return { x: Math.round(bx / k), y: Math.round(by / k), w: Math.max(1, Math.round(bw / k)), h: Math.max(1, Math.round(bh / k)) };
  } catch {
    // Imagem de outro site sem permissão de leitura: usa inteira.
    return full;
  }
}

/* ---------- Logos: tamanho real (Word/Excel precisam de largura e altura fixas) ---------- */
export interface LogoImage {
  w: number;
  h: number;
  /** PNG já reduzido (para o Excel). Vazio se a imagem vier de outro site e o navegador bloquear. */
  png?: Uint8Array;
  /**
   * Versão reduzida (data URL) usada no HTML dos documentos e relatórios.
   * As logos cadastradas passam de 100 KB cada e se repetem no timbre de cada
   * escola/turma: um relatório com 100 turmas chegava a dezenas de MB de HTML,
   * e era isso que deixava a geração lenta.
   */
  small?: string;
  /** Mesma versão reduzida em PNG (o Word não abre WebP). */
  smallPng?: string;
}
const logoCache = new Map<string, LogoImage | null>();

function loadLogo(src: string): Promise<LogoImage | null> {
  if (logoCache.has(src)) return Promise.resolve(logoCache.get(src) || null);
  return new Promise((resolve) => {
    const img = new Image();
    if (/^https?:/i.test(src)) img.crossOrigin = 'anonymous';
    const done = (v: LogoImage | null) => {
      logoCache.set(src, v);
      resolve(v);
    };
    const timer = setTimeout(() => done(null), 5000);
    img.onerror = () => {
      clearTimeout(timer);
      done(null);
    };
    img.onload = () => {
      clearTimeout(timer);
      const fullW = img.naturalWidth || img.width || 0;
      const fullH = img.naturalHeight || img.height || 0;
      if (!fullW || !fullH) return done(null);
      // Sem a margem vazia em volta, o desenho ocupa toda a altura do timbre.
      const crop = contentBounds(img, fullW, fullH);
      const cropped = crop.w !== fullW || crop.h !== fullH;
      const w = crop.w;
      const h = crop.h;
      let png: Uint8Array | undefined;
      let small: string | undefined;
      let smallPng: string | undefined;
      try {
        // Timbre: até 80 px de altura na folha; 4x isso mantém a nitidez na impressão.
        const k = Math.min(1, 320 / h, 560 / w);
        if (k < 1 || cropped || src.length > 60_000) {
          const c2 = document.createElement('canvas');
          c2.width = Math.max(1, Math.round(w * k));
          c2.height = Math.max(1, Math.round(h * k));
          const g2 = c2.getContext('2d')!;
          g2.imageSmoothingQuality = 'high';
          g2.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, c2.width, c2.height);
          const outPng = c2.toDataURL('image/png');
          if (cropped || outPng.length < src.length) smallPng = outPng;
          // WebP com transparência é bem menor que PNG; o Chrome/Edge imprimem normalmente.
          const outWebp = c2.toDataURL('image/webp', 0.95);
          const best = outWebp.startsWith('data:image/webp') && outWebp.length < outPng.length ? outWebp : outPng;
          if (cropped || best.length < src.length) small = best;
        }
      } catch {
        small = undefined;
        smallPng = undefined;
      }
      try {
        const scale = Math.min(1, 480 / Math.max(w, h));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        canvas.getContext('2d')!.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height);
        const b64 = canvas.toDataURL('image/png').split(',')[1] || '';
        const bin = atob(b64);
        png = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) png[i] = bin.charCodeAt(i);
      } catch {
        png = undefined;
      }
      done({ w, h, png, small, smallPng });
    };
    img.src = src;
  });
}

/** Todas as logos cadastradas (Gestão, SEMED e escolas). */
function allLogoSources(): string[] {
  const list = [state.managementLogoUrl, state.semedLogoUrl, ...Array.from(state.schools.values()).map((s) => s.logoUrl || '')];
  return Array.from(new Set(list.filter(Boolean)));
}

/** Carrega o tamanho real das logos antes de gerar Word ou Excel. */
export async function preloadLogos(): Promise<void> {
  await Promise.all(allLogoSources().map((src) => loadLogo(src)));
}

/** Endereço da logo para o HTML: a versão reduzida, quando já estiver pronta. */
export function printLogoSrc(src: string, forWord = false): string {
  const info = logoCache.get(src);
  return (forWord ? info?.smallPng : info?.small) || src;
}

/** Logo já carregada (depois de preloadLogos). */
export function getLoadedLogo(src?: string): LogoImage | null {
  return src ? logoCache.get(src) || null : null;
}

/** Cabe a imagem numa caixa, mantendo a proporção. */
export function fitBox(w: number, h: number, maxW: number, maxH: number): { w: number; h: number } {
  if (!w || !h) return { w: maxW, h: maxH };
  const k = Math.min(maxW / w, maxH / h);
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
}

/** Logos e textos do timbre, para quem monta o próprio cabeçalho (ex.: Excel). */
export function letterheadParts(target?: LetterheadTarget): {
  left: string[];
  right: string[];
  cityLine: string;
  semedLine: string;
  schoolLine: string;
} {
  const school = resolveLetterheadSchool(target);
  const right: string[] = [];
  if (state.semedLogoUrl) right.push(state.semedLogoUrl);
  if (school?.logoUrl) right.push(school.logoUrl);
  return {
    left: state.managementLogoUrl ? [state.managementLogoUrl] : [],
    right,
    cityLine: state.cityName
      ? `PREFEITURA MUNICIPAL DE ${state.cityName.toUpperCase()}${state.stateCode ? ' – ' + state.stateCode.toUpperCase() : ''}`
      : 'PREFEITURA MUNICIPAL',
    semedLine: String(state.semedName || '').toUpperCase(),
    schoolLine: school?.name ? `${school.name}${school.inepCode && /\d/.test(school.inepCode) ? ` • INEP ${school.inepCode}` : ''}` : '',
  };
}

/**
 * Timbre em tabela, com largura e altura fixas nas logos. O Word não entende o layout
 * flexível da impressão: sem isso as logos saem no tamanho original, uma embaixo da outra.
 */
function letterheadWordHtml(target?: LetterheadTarget): string {
  const p = letterheadParts(target);
  const img = (src: string, _i: number, list: string[]) => {
    const info = getLoadedLogo(src);
    const maxW = list.length > 1 ? 100 : 140;
    const box = info ? fitBox(info.w, info.h, maxW, 72) : { w: 0, h: 72 };
    const size = box.w ? `width="${box.w}" height="${box.h}" style="width:${box.w}px;height:${box.h}px"` : `height="72" style="height:72px"`;
    return `<img src="${escapeHtml(printLogoSrc(src, true))}" ${size} alt="" />`;
  };
  const cell = (list: string[], align: string) =>
    `<td width="22%" valign="middle" align="${align}" style="width:22%;vertical-align:middle;text-align:${align};border:none;padding:0 4px 6px">${list.map(img).join('&nbsp;&nbsp;')}</td>`;
  return `<table ${LETTERHEAD_MARK}="1" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;border:none;border-bottom:2px solid #0f172a;margin-bottom:10px;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<tr>${cell(p.left, 'left')}
<td width="56%" valign="middle" align="center" style="width:56%;vertical-align:middle;text-align:center;border:none;padding:0 4px 6px;line-height:1.3">
<p style="margin:0;text-align:center;font-size:12pt;font-weight:bold">${escapeHtml(p.cityLine)}</p>
<p style="margin:0;text-align:center;font-size:11pt;font-weight:bold">${escapeHtml(p.semedLine)}</p>
${p.schoolLine ? `<p style="margin:0;text-align:center;font-size:10pt;font-weight:bold">${escapeHtml(p.schoolLine)}</p>` : ''}
</td>${cell(p.right, 'right')}</tr></table>`;
}

/** Cabeçalho em HTML (impressões, PDF e Word). Estilos inline para funcionar em qualquer janela. */
export function letterheadHtml(target?: LetterheadTarget, opts?: { word?: boolean }): string {
  if (opts?.word) return letterheadWordHtml(target);
  const school = resolveLetterheadSchool(target);
  const img = (src: string, alt: string) =>
    `<img src="${escapeHtml(printLogoSrc(src))}" alt="${escapeHtml(alt)}" style="max-height:80px;max-width:150px;object-fit:contain;display:block" />`;
  const left = state.managementLogoUrl ? img(state.managementLogoUrl, 'Gestão Municipal') : '';
  const rightParts: string[] = [];
  if (state.semedLogoUrl) rightParts.push(img(state.semedLogoUrl, 'SEMED'));
  if (school?.logoUrl) rightParts.push(img(school.logoUrl, school.name || 'Escola'));
  const city = state.cityName ? `PREFEITURA MUNICIPAL DE ${escapeHtml(state.cityName.toUpperCase())}${state.stateCode ? ' – ' + escapeHtml(state.stateCode.toUpperCase()) : ''}` : 'PREFEITURA MUNICIPAL';
  const schoolLine = school?.name
    ? `<div style="font-size:11px;font-weight:700;color:#1e293b;margin-top:2px">${escapeHtml(school.name)}${school.inepCode && /\d/.test(school.inepCode) ? ` • INEP ${escapeHtml(school.inepCode)}` : ''}</div>`
    : '';
  return `<div ${LETTERHEAD_MARK}="1" style="display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:2px solid #0f172a;padding-bottom:8px;margin-bottom:12px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;page-break-inside:avoid">
  <div style="min-width:120px;display:flex;align-items:center;justify-content:flex-start">${left}</div>
  <div style="flex:1;text-align:center;line-height:1.3">
    <div style="font-size:12px;font-weight:800;letter-spacing:.3px">${city}</div>
    <div style="font-size:11px;font-weight:700;text-transform:uppercase">${escapeHtml(state.semedName)}</div>
    ${schoolLine}
  </div>
  <div style="min-width:120px;display:flex;align-items:center;justify-content:flex-end;gap:8px">${rightParts.join('')}</div>
</div>`;
}

/** Acrescenta o timbre no começo de um trecho de HTML (se ele ainda não tiver um). */
export function withLetterhead(contentHtml: string, target?: LetterheadTarget, opts?: { word?: boolean }): string {
  if (!contentHtml) return contentHtml;
  let out = contentHtml.includes(LETTERHEAD_MARK) ? contentHtml : letterheadHtml(target, opts) + contentHtml;
  if (!out.includes(ISSUER_MARK)) out += issuerFooterHtml(!hasOwnSignature(contentHtml), target);
  return out;
}

/** Acrescenta o timbre logo depois de <body> num documento completo. */
export function withLetterheadInDocument(html: string, target?: LetterheadTarget): string {
  if (!html) return html;
  let out = html;
  if (!out.includes(LETTERHEAD_MARK)) {
    const m = out.match(/<body[^>]*>/i);
    if (m && m.index !== undefined) {
      const at = m.index + m[0].length;
      out = out.slice(0, at) + letterheadHtml(target) + out.slice(at);
    }
  }
  if (!out.includes(ISSUER_MARK)) {
    const end = out.search(/<\/body>/i);
    if (end >= 0) out = out.slice(0, end) + issuerFooterHtml(!hasOwnSignature(html), target) + out.slice(end);
  }
  return out;
}

/**
 * Reduz a imagem enviada como logo (até 480 px, mantendo transparência) para não
 * pesar no banco nem na sincronização. SVG é mantido como está.
 */
export function readLogoFile(file: File, maxSize = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (file.type === 'image/svg+xml') return resolve(dataUrl);
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        // Tira a margem vazia em volta do desenho e guarda com até 1000 px (boa nitidez na impressão).
        const crop = contentBounds(img, img.width || 1, img.height || 1);
        const cropped = crop.w !== img.width || crop.h !== img.height;
        const scale = Math.min(1, maxSize / Math.max(crop.w, crop.h));
        if (!cropped && scale >= 1 && dataUrl.length < 600_000) return resolve(dataUrl);
        const w = Math.max(1, Math.round(crop.w * scale));
        const h = Math.max(1, Math.round(crop.h * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Impressão de relatórios grandes: cada timbre repete as logos (data URL de dezenas
 * de KB). Aqui cada logo distinta vira um endereço interno (blob:) criado uma vez só,
 * e o HTML passa a carregar só esse endereço curto — o relatório de 90 turmas cai de
 * ~25 MB para poucos KB de texto e abre bem mais rápido. Use só para imprimir na
 * própria tela (o endereço blob: não vale em arquivo baixado ou no Word).
 * Devolve o HTML novo e uma função que libera os endereços depois da impressão.
 */
export function dedupeImagesForPrint(html: string): { html: string; release: () => void } {
  const urls = new Map<string, string>();
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return { html, release: () => {} };
  const out = html.replace(/data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/gi, (dataUrl) => {
    if (dataUrl.length < 2048) return dataUrl; // pequeno: não compensa
    let blobUrl = urls.get(dataUrl);
    if (!blobUrl) {
      try {
        const comma = dataUrl.indexOf(',');
        const mime = dataUrl.slice(5, dataUrl.indexOf(';'));
        const bin = atob(dataUrl.slice(comma + 1));
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
        urls.set(dataUrl, blobUrl);
      } catch {
        return dataUrl;
      }
    }
    return blobUrl;
  });
  return {
    html: out,
    release: () => urls.forEach((u) => URL.revokeObjectURL(u)),
  };
}
