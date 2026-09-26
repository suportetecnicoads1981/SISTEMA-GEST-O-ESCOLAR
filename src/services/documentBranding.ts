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
}

export interface DocumentBrandingState {
  managementLogoUrl: string;
  semedLogoUrl: string;
  cityName: string;
  stateCode: string;
  semedName: string;
  schools: Map<string, BrandingSchool>;
  classSchool: Map<string, string>;
  defaultSchoolUnitId?: string;
}

/** Qual escola aparece no timbre. Sem nada, usa a escola do usuário (ou a única da rede). */
export interface LetterheadTarget {
  schoolUnitId?: string;
  classId?: string;
  schoolName?: string;
}

let state: DocumentBrandingState = {
  managementLogoUrl: '',
  semedLogoUrl: '',
  cityName: '',
  stateCode: '',
  semedName: 'Secretaria Municipal de Educação',
  schools: new Map(),
  classSchool: new Map(),
};

const cleanUrl = (u?: string | null) => (typeof u === 'string' && /^(data:image\/|https?:\/\/|\/)/i.test(u.trim()) ? u.trim() : '');

export function setDocumentBranding(input: {
  settings?: Partial<SchoolSettings> | null;
  secretary?: Partial<MunicipalSecretaryInfo> | null;
  schoolUnits?: SchoolUnit[] | null;
  classes?: SchoolClass[] | null;
  defaultSchoolUnitId?: string;
}): void {
  const s = input.settings || {};
  const sec = input.secretary || {};
  const schools = new Map<string, BrandingSchool>();
  for (const u of input.schoolUnits || []) {
    if (!u?.id) continue;
    schools.set(String(u.id), { id: String(u.id), name: u.name || '', inepCode: u.inepCode, logoUrl: cleanUrl(u.logoUrl) });
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
  };
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

/** Cabeçalho em HTML (impressões, PDF e Word). Estilos inline para funcionar em qualquer janela. */
export function letterheadHtml(target?: LetterheadTarget): string {
  const school = resolveLetterheadSchool(target);
  const img = (src: string, alt: string) =>
    `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" style="max-height:64px;max-width:120px;object-fit:contain;display:block" />`;
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
export function withLetterhead(contentHtml: string, target?: LetterheadTarget): string {
  if (!contentHtml || contentHtml.includes(LETTERHEAD_MARK)) return contentHtml;
  return letterheadHtml(target) + contentHtml;
}

/** Acrescenta o timbre logo depois de <body> num documento completo. */
export function withLetterheadInDocument(html: string, target?: LetterheadTarget): string {
  if (!html || html.includes(LETTERHEAD_MARK)) return html;
  const m = html.match(/<body[^>]*>/i);
  if (!m || m.index === undefined) return html;
  const at = m.index + m[0].length;
  return html.slice(0, at) + letterheadHtml(target) + html.slice(at);
}

/**
 * Reduz a imagem enviada como logo (até 480 px, mantendo transparência) para não
 * pesar no banco nem na sincronização. SVG é mantido como está.
 */
export function readLogoFile(file: File, maxSize = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (file.type === 'image/svg+xml') return resolve(dataUrl);
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width || 1, img.height || 1));
        if (scale >= 1 && dataUrl.length < 400_000) return resolve(dataUrl);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
