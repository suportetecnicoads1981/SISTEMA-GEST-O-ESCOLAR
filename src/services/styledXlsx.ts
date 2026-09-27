/**
 * Planilha Excel (.xlsx) formatada para os relatórios oficiais.
 *
 * O pacote "xlsx" gratuito não grava cores, bordas nem imagens. Aqui a planilha é montada
 * direto no formato do Excel (arquivos XML compactados com JSZip), com:
 *   - timbre: logo da Gestão à esquerda, logos da SEMED e da escola à direita e, no centro,
 *     Prefeitura, Secretaria de Educação e escola;
 *   - título, subtítulo, filtros e data de emissão centralizados;
 *   - um bloco por escola/turma, com a identificação, o cabeçalho das colunas em destaque,
 *     bordas, totais e o campo "Conferido por / Data / Assinatura";
 *   - página A4 ajustada à largura, uma escola/turma por página e rodapé com quem emitiu.
 */
import JSZip from 'jszip';
import {
  fitBox,
  getDocumentBranding,
  getLoadedLogo,
  letterheadParts,
  preloadLogos,
  type LetterheadTarget,
} from './documentBranding';

export interface StyledXlsxColumn {
  label: string;
  align?: 'left' | 'center' | 'right';
}

export interface StyledXlsxSection {
  /** Identificação do bloco: [rótulo, valor] (escola, INEP, série, turma, turno...). */
  lines?: [string, string][];
  rows: (string | number)[][];
  /** Linha de totais extra (ex.: "Totais da escola: ..."). */
  summary?: string;
  /** Ex.: "Total de alunos nesta relação: 32". */
  countLine?: string;
}

export interface StyledXlsxOptions {
  title: string;
  subtitle?: string;
  filtersLine?: string;
  columns: StyledXlsxColumn[];
  sections: StyledXlsxSection[];
  orientation?: 'portrait' | 'landscape';
  /** Escola do timbre (quando o relatório é de uma escola só). */
  letterhead?: LetterheadTarget;
  /** Campo de conferência manual ao fim de cada bloco (padrão: sim). */
  conference?: boolean;
  sheetName?: string;
}

const xml = (t: unknown) =>
  String(t ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const colName = (i: number): string => {
  let n = i + 1;
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

/** Estilos (índices de cellXfs). */
const S = {
  city: 1,
  semed: 2,
  school: 3,
  title: 4,
  sub: 5,
  ident: 6,
  head: 7,
  cellL: 8,
  cellC: 9,
  total: 10,
  note: 11,
  rule: 12,
  cellR: 13,
};

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="8">
<font><sz val="10"/><name val="Arial"/></font>
<font><b/><sz val="14"/><name val="Arial"/></font>
<font><b/><sz val="11"/><name val="Arial"/></font>
<font><sz val="9"/><name val="Arial"/></font>
<font><b/><sz val="10"/><name val="Arial"/></font>
<font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/></font>
<font><i/><sz val="9"/><color rgb="FF475569"/><name val="Arial"/></font>
<font><b/><sz val="12"/><name val="Arial"/></font>
</fonts>
<fills count="4">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF1E293B"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="3">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FF64748B"/></left><right style="thin"><color rgb="FF64748B"/></right><top style="thin"><color rgb="FF64748B"/></top><bottom style="thin"><color rgb="FF64748B"/></bottom><diagonal/></border>
<border><left/><right/><top/><bottom style="medium"><color rgb="FF0F172A"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="14">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="7" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="4" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="5" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1" indent="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="6" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="2" xfId="0" applyBorder="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

/** Largura da coluna (em caracteres do Excel) para pixels na tela. */
const colPx = (w: number) => Math.trunc(w * 7 + 5);
const EMU = 9525;

export async function buildStyledXlsx(opts: StyledXlsxOptions): Promise<Blob> {
  await preloadLogos().catch(() => {});
  const ncol = Math.max(opts.columns.length, 1);
  const last = colName(ncol - 1);

  // ---------- Larguras das colunas ----------
  const widths = opts.columns.map((c, i) => {
    let m = c.label.length;
    for (const sec of opts.sections) for (const r of sec.rows) m = Math.max(m, String(r[i] ?? '').length);
    return Math.min(Math.max(m + 2, 5), 50);
  });
  // O timbre precisa de espaço para as logos dos dois lados e o texto no centro.
  const parts = letterheadParts(opts.letterhead);
  const logo = (src: string) => {
    const info = getLoadedLogo(src);
    if (!info?.png) return null;
    return { ...fitBox(info.w, info.h, 120, 96), png: info.png };
  };
  const leftImgs = parts.left.map(logo).filter(Boolean) as { w: number; h: number; png: Uint8Array }[];
  const rightImgs = parts.right.map(logo).filter(Boolean) as { w: number; h: number; png: Uint8Array }[];
  const sideW = Math.max(
    leftImgs.reduce((a, b) => a + b.w + 8, 0),
    rightImgs.reduce((a, b) => a + b.w + 8, 0)
  );
  const needPx = sideW * 2 + 460;
  let totalPx = widths.reduce((a, w) => a + colPx(w), 0);
  if (totalPx < needPx) {
    const k = needPx / totalPx;
    for (let i = 0; i < widths.length; i++) widths[i] = Math.ceil(widths[i] * k);
    totalPx = widths.reduce((a, w) => a + colPx(w), 0);
  }

  // ---------- Linhas ----------
  type Cell = { v: string | number; s: number };
  const rows: { h?: number; cells: (Cell | null)[] }[] = [];
  const merges: string[] = [];
  const breaks: number[] = [];
  const add = (cells: (Cell | null)[], h?: number) => {
    rows.push({ cells, h });
    return rows.length; // número da linha (1..)
  };
  const full = (v: string, s: number, h?: number) => {
    const r = add([{ v, s }, ...Array.from({ length: ncol - 1 }, () => ({ v: '', s }))], h);
    if (ncol > 1) merges.push(`A${r}:${last}${r}`);
    return r;
  };

  // Timbre (linhas 1 a 4, com as logos por cima).
  full(parts.cityLine, S.city, 24);
  full(parts.semedLine, S.semed, 20);
  full(parts.schoolLine, S.school, 18);
  const ruleRow = add(Array.from({ length: ncol }, () => ({ v: '', s: S.rule })), 18);
  void ruleRow;
  add([], 6);
  full(opts.title.toUpperCase(), S.title, 22);
  if (opts.subtitle) full(opts.subtitle, S.sub, 16);
  if (opts.filtersLine) full(`Filtros aplicados: ${opts.filtersLine}`, S.sub, 16);
  const b = getDocumentBranding();
  const now = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const issuer = b.issuerName ? `Emitido por ${b.issuerName}${b.issuerRole ? ` (${b.issuerRole})` : ''} em ${now}` : `Emitido em ${now}`;
  full(issuer, S.sub, 16);
  add([], 8);

  const isNum = (v: unknown) => typeof v === 'number' || (typeof v === 'string' && /^(0|[1-9]\d{0,4})$/.test(v));
  opts.sections.forEach((sec, si) => {
    if (si > 0) breaks.push(rows.length);
    const ident = (sec.lines || []).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('     •     ');
    if (ident) full(ident, S.ident, 20);
    add(opts.columns.map((c) => ({ v: c.label, s: S.head })), 30);
    for (const r of sec.rows) {
      add(
        opts.columns.map((c, i) => {
          const raw = r[i] ?? '';
          const s = c.align === 'center' ? S.cellC : c.align === 'right' ? S.cellR : S.cellL;
          return { v: isNum(raw) ? Number(raw) : String(raw), s };
        })
      );
    }
    if (sec.summary) full(sec.summary, S.total, 18);
    if (sec.countLine) full(sec.countLine, S.total, 18);
    if (opts.conference !== false) {
      add([], 10);
      full('Conferido por: ________________________________________     Data: ____/____/________     Assinatura: ______________________________', S.note, 22);
    }
    add([], 10);
  });

  // ---------- XML da planilha ----------
  const sheetRows = rows
    .map((row, ri) => {
      const r = ri + 1;
      const cells = row.cells
        .map((c, ci) => {
          if (!c) return '';
          const ref = `${colName(ci)}${r}`;
          if (typeof c.v === 'number') return `<c r="${ref}" s="${c.s}"><v>${c.v}</v></c>`;
          if (c.v === '') return `<c r="${ref}" s="${c.s}"/>`;
          return `<c r="${ref}" s="${c.s}" t="inlineStr"><is><t xml:space="preserve">${xml(c.v)}</t></is></c>`;
        })
        .join('');
      return `<row r="${r}"${row.h ? ` ht="${row.h}" customHeight="1"` : ''}>${cells}</row>`;
    })
    .join('');
  const cols = widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('');
  const images = [
    ...(() => {
      let x = 6;
      return leftImgs.map((im) => {
        const o = { ...im, x, y: 4 };
        x += im.w + 8;
        return o;
      });
    })(),
    ...(() => {
      let x = totalPx - 6;
      return rightImgs
        .slice()
        .reverse()
        .map((im) => {
          x -= im.w;
          const o = { ...im, x, y: 4 };
          x -= 8;
          return o;
        });
    })(),
  ];
  // Posição em coluna + deslocamento (a imagem acompanha as células).
  const anchor = (xPx: number) => {
    let acc = 0;
    for (let i = 0; i < widths.length; i++) {
      const w = colPx(widths[i]);
      if (xPx < acc + w || i === widths.length - 1) return { col: i, off: Math.max(0, xPx - acc) };
      acc += w;
    }
    return { col: 0, off: 0 };
  };
  const orientation = opts.orientation || 'landscape';
  const footer = xml(`&L&"Arial,Italic"&8${issuer.replace(/&/g, '&&')} • ${b.semedName.replace(/&/g, '&&')}&R&"Arial"&8Página &P de &N`);
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
<sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
<cols>${cols}</cols>
<sheetData>${sheetRows}</sheetData>
${merges.length ? `<mergeCells count="${merges.length}">${merges.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : ''}
<printOptions horizontalCentered="1"/>
<pageMargins left="0.79" right="0.59" top="0.79" bottom="0.59" header="0.3" footer="0.3"/>
<pageSetup paperSize="9" orientation="${orientation}" fitToWidth="1" fitToHeight="0"/>
<headerFooter><oddFooter>${footer}</oddFooter></headerFooter>
${breaks.length ? `<rowBreaks count="${breaks.length}" manualBreakCount="${breaks.length}">${breaks.map((r) => `<brk id="${r}" max="16383" man="1"/>`).join('')}</rowBreaks>` : ''}
${images.length ? '<drawing r:id="rId1"/>' : ''}
</worksheet>`;

  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="png" ContentType="image/png"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${images.length ? '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>' : ''}
</Types>`
  );
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`
  );
  const sheetName = xml((opts.sheetName || 'Relatório').replace(/[\\/?*[\]:]/g, ' ').slice(0, 31));
  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${sheetName}" sheetId="1" r:id="rId1"/></sheets></workbook>`
  );
  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`
  );
  zip.file('xl/styles.xml', STYLES);
  zip.file('xl/worksheets/sheet1.xml', sheet);
  if (images.length) {
    zip.file(
      'xl/worksheets/_rels/sheet1.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>`
    );
    const pics = images
      .map((im, i) => {
        const a = anchor(im.x);
        return `<xdr:oneCellAnchor><xdr:from><xdr:col>${a.col}</xdr:col><xdr:colOff>${Math.round(a.off * EMU)}</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>${im.y * EMU}</xdr:rowOff></xdr:from><xdr:ext cx="${im.w * EMU}" cy="${im.h * EMU}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${i + 2}" name="Logo ${i + 1}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId${i + 1}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${im.w * EMU}" cy="${im.h * EMU}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`;
      })
      .join('');
    zip.file(
      'xl/drawings/drawing1.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${pics}</xdr:wsDr>`
    );
    zip.file(
      'xl/drawings/_rels/drawing1.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${images
        .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${i + 1}.png"/>`)
        .join('')}</Relationships>`
    );
    images.forEach((im, i) => zip.file(`xl/media/image${i + 1}.png`, im.png));
  }
  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/** Gera e baixa a planilha formatada. */
export async function downloadStyledXlsx(fileName: string, opts: StyledXlsxOptions): Promise<void> {
  const blob = await buildStyledXlsx(opts);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
