import JSZip from 'jszip';
import * as XLSX from 'xlsx';

/**
 * Interface com os dados extraídos de qualquer documento de escritório
 * (LibreOffice Writer, LibreOffice Calc, Microsoft Word, Microsoft Excel)
 */
export interface ExtractedOfficeData {
  matrix: string[][];
  schoolNameDetected?: string;
  classOrSeriesDetected?: string;
  dateDetected?: string;
  titleDetected?: string;
  sourceType: 'EXCEL' | 'CALC' | 'WORD' | 'WRITER' | 'CSV' | 'UNKNOWN';
}

/**
 * Extrai texto e tabelas de documentos Microsoft Word (.docx)
 */
export async function parseDocxFile(file: File | Blob): Promise<ExtractedOfficeData> {
  const zip = await JSZip.loadAsync(file);
  const docXml = await zip.file('word/document.xml')?.async('text');

  if (!docXml) {
    throw new Error('O arquivo DOCX não contém o arquivo interno word/document.xml');
  }

  const parser = new DOMParser();
  const xml = parser.parseFromString(docXml, 'application/xml');

  // Coleta parágrafos antes e entre tabelas
  const paragraphs = Array.from(xml.querySelectorAll('w\\:p, p'));
  const headerLines: string[] = [];
  let schoolNameDetected = '';
  let classOrSeriesDetected = '';
  let dateDetected = '';
  let titleDetected = '';

  paragraphs.forEach((p) => {
    const textNodes = p.querySelectorAll('w\\:t, t');
    const text = Array.from(textNodes).map((n) => n.textContent || '').join('').trim();
    if (!text) return;

    headerLines.push(text);

    // Detecção nos parágrafos
    const schoolMatch = text.match(/ESCOLA:\s*([^\n\r\|\t]+?)(?=\s+TURMAS?:|\s+DATA:|\s*\||$)/i);
    if (schoolMatch && !schoolNameDetected) {
      schoolNameDetected = schoolMatch[1].trim();
    }

    const turmaMatch = text.match(/TURMAS?:\s*([^\n\r\|\t]+?)(?=\s+DATA:|\s*\||$)/i);
    if (turmaMatch && !classOrSeriesDetected) {
      classOrSeriesDetected = turmaMatch[1].trim();
    }

    const dataMatch = text.match(/DATA:\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (dataMatch && !dateDetected) {
      dateDetected = dataMatch[1].trim();
    }

    if (text.toUpperCase().includes('LEVANTAMENTO') && !titleDetected) {
      titleDetected = text.trim();
    }
  });

  // Monta a matriz NA ORDEM DO DOCUMENTO: parágrafos (ex: "ESCOLA: ...", "ESCOLA ANEXO: ...")
  // e tabelas (uma por série) intercalados, para que cada tabela fique ligada à escola certa.
  const matrix: string[][] = [];
  // Texto de um parágrafo: junta os trechos (runs) sem espaço extra, para não partir palavras
  const paraText = (p: Element): string =>
    Array.from(p.getElementsByTagName('*'))
      .map((n) => (n.nodeName === 'w:t' ? n.textContent || '' : n.nodeName === 'w:tab' ? ' ' : ''))
      .join('');
  const cellText = (tc: Element): string =>
    Array.from(tc.getElementsByTagName('w:p'))
      .map(paraText)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

  const body = xml.getElementsByTagName('w:body')[0];
  const elementChildren = (el: Element): Element[] =>
    Array.from(el.childNodes).filter((n) => n.nodeType === 1) as Element[];
  const blocks: Element[] = body ? elementChildren(body) : [];

  const pushTable = (tbl: Element) => {
    Array.from(tbl.getElementsByTagName('w:tr')).forEach((tr) => {
      // Apenas as células desta linha (ignora tabelas aninhadas)
      const cells = elementChildren(tr).filter((c) => c.nodeName === 'w:tc');
      const rowData = cells.map((tc) => cellText(tc));
      if (rowData.some((c) => c.length > 0)) matrix.push(rowData);
    });
  };

  if (blocks.length > 0) {
    blocks.forEach((el) => {
      if (el.nodeName === 'w:p') {
        const text = paraText(el as Element).replace(/\s+/g, ' ').trim();
        if (text) matrix.push([text]);
      } else if (el.nodeName === 'w:tbl') {
        pushTable(el as Element);
      } else if (el.nodeName === 'w:sdt') {
        // Conteúdo dentro de controles de conteúdo
        Array.from(el.getElementsByTagName('w:tbl')).forEach((t) => pushTable(t));
      }
    });
  } else {
    // Fallback: estrutura inesperada, lê só as tabelas
    Array.from(xml.getElementsByTagName('w:tbl')).forEach((t) => pushTable(t));
  }

  return {
    matrix,
    schoolNameDetected,
    classOrSeriesDetected,
    dateDetected,
    titleDetected,
    sourceType: 'WORD',
  };
}

/**
 * Extrai texto e tabelas de documentos LibreOffice Writer (.odt - OpenDocument Text)
 */
export async function parseOdtFile(file: File | Blob): Promise<ExtractedOfficeData> {
  const zip = await JSZip.loadAsync(file);
  const contentXml = await zip.file('content.xml')?.async('text');

  if (!contentXml) {
    throw new Error('O arquivo ODT não contém o arquivo interno content.xml');
  }

  const parser = new DOMParser();
  const xml = parser.parseFromString(contentXml, 'application/xml');

  const paragraphs = Array.from(xml.querySelectorAll('text\\:p, p'));
  const headerLines: string[] = [];
  let schoolNameDetected = '';
  let classOrSeriesDetected = '';
  let dateDetected = '';
  let titleDetected = '';

  paragraphs.forEach((p) => {
    const text = p.textContent?.trim() || '';
    if (!text) return;

    headerLines.push(text);

    const schoolMatch = text.match(/ESCOLA:\s*([^\n\r\|\t]+?)(?=\s+TURMAS?:|\s+DATA:|\s*\||$)/i);
    if (schoolMatch && !schoolNameDetected) {
      schoolNameDetected = schoolMatch[1].trim();
    }

    const turmaMatch = text.match(/TURMAS?:\s*([^\n\r\|\t]+?)(?=\s+DATA:|\s*\||$)/i);
    if (turmaMatch && !classOrSeriesDetected) {
      classOrSeriesDetected = turmaMatch[1].trim();
    }

    const dataMatch = text.match(/DATA:\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (dataMatch && !dateDetected) {
      dateDetected = dataMatch[1].trim();
    }

    if (text.toUpperCase().includes('LEVANTAMENTO') && !titleDetected) {
      titleDetected = text.trim();
    }
  });

  const matrix: string[][] = [];

  if (schoolNameDetected || classOrSeriesDetected || dateDetected) {
    const metaRow = [
      schoolNameDetected ? `ESCOLA: ${schoolNameDetected}` : '',
      classOrSeriesDetected ? `TURMA: ${classOrSeriesDetected}` : '',
      dateDetected ? `DATA: ${dateDetected}` : '',
    ].filter(Boolean);
    if (metaRow.length > 0) {
      matrix.push(metaRow);
    }
  }

  if (titleDetected) {
    matrix.push([titleDetected]);
  }

  const tables = Array.from(xml.querySelectorAll('table\\:table, table'));
  tables.forEach((tbl) => {
    const rows = Array.from(tbl.querySelectorAll('table\\:table-row, table-row'));
    rows.forEach((tr) => {
      const cells = Array.from(tr.querySelectorAll('table\\:table-cell, table-cell'));
      const rowData: string[] = [];

      cells.forEach((tc) => {
        const repeatAttr = tc.getAttribute('table:number-columns-repeated');
        const repeatCount = repeatAttr ? parseInt(repeatAttr, 10) : 1;
        const text = tc.textContent?.trim() || '';

        // Limita repetições de células vazias para evitar estourar limites
        const safeCount = Math.min(Math.max(1, isNaN(repeatCount) ? 1 : repeatCount), 30);
        for (let r = 0; r < safeCount; r++) {
          rowData.push(text);
        }
      });

      if (rowData.some((c) => c.length > 0)) {
        matrix.push(rowData);
      }
    });
  });

  return {
    matrix,
    schoolNameDetected,
    classOrSeriesDetected,
    dateDetected,
    titleDetected,
    sourceType: 'WRITER',
  };
}

/**
 * Dados oficiais da planilha padrão municipal (EMEI Ruth Pereira Barbaresco)
 */
export const OFFICIAL_MUNICIPAL_SAMPLE_DATA = [
  ['ESCOLA: EMEI RUTH PEREIRA BARBARESCO', '', '', 'TURMA: PRÉ-ESCOLA I A', '', '', 'DATA: 15/09/2026', '', ''],
  ['LEVANTAMENTO DO QUANTITATIVO E PERFIL DOS ALUNOS POR TURMA', '', '', '', '', '', '', '', ''],
  [
    'Nº',
    'NOME COMPLETO DO ALUNO',
    'DE NASCIM',
    'SEXO',
    'RAÇA/COR',
    'ENDEREÇO',
    'PCD',
    'TEA (SIM/NÃO)',
    'LAUDO',
  ],
  ['1', 'Acla Maria da Silva Santos', '14/04/2021', 'F', 'Pardo', 'Rua Mato Grosso / Bela Vista', '', '', ''],
  ['2', 'Anna Lívia Nunes Silva', '28/07/2021', 'F', 'Pardo', 'Rua Maranhão /Centro', '', '', ''],
  ['3', 'Arthur Feliphe Silva Sousa', '04/03/2022', 'M', 'Preto', 'Rua Mato Grosso / Centro', '', '', ''],
  ['4', 'Bepkangàrànhy Kayapó', '03/08/2021', 'M', 'Indígena', 'Rua Maranhão /Centro', '', '', ''],
  ['5', 'Elisa Florêncio Feitosa Simões', '22/04/2021', 'F', 'Pardo', 'Av. Das Nações/Centro', '', '', ''],
  ['6', 'Isabelle Barbosa Dutra', '17/12/2021', 'F', 'Pardo', 'Rua Alagoas/Novo Horizonte', '', '', ''],
  ['7', 'João Lucas Anjos de Sousa', '24/09/2021', 'M', 'Branco', 'Rua Piauí/Maranhense', '', '', ''],
  ['8', 'João Luccas Oliveira de Sousa', '20/03/2022', 'M', 'Pardo', 'Rua Rio Grande do Sul/str Maranheses', '', '', ''],
  ['9', 'Júlia Sophia Silva Fernandes de Oliveira', '11/02/2022', 'F', 'Branco', 'Rua Santa Catarina/Centro', '', '', ''],
  ['10', 'Lívia Vitória Alves Nunes', '14/01/2022', 'F', 'Branco', 'Rua Pará / Centro', '', '', ''],
  ['11', 'Luan Sousa de Jesus – PCD', '22/09/2021', 'M', 'Branco', 'Rua São Paulo/Centro', 'Atraso Global do neuro- desenvolvimento', '', ''],
  ['12', 'Lucas Sousa de Jesus - PCD', '22/09/2021', 'M', 'Branco', 'Rua São Paulo/Centro', 'Suspeita sem laudo', '', ''],
  ['13', 'Luís Antônio Felipe Ribeiro', '18/03/2022', 'M', 'Pardo', 'Projeto Cumaru', '', '', ''],
  ['14', 'Ngrenhrabyry Kayapó', '05/06/2021', 'F', 'Indígena', 'Rua Maranhão /Centro', '', '', ''],
  ['15', 'Rafael Henrique da Conceição -PCD', '01/11/2021', 'M', 'Pardo', 'Projeto Cumaru', 'TEA – Nível 2', 'sim', ''],
  ['16', 'Vinicius Barroso Souza', '16/11/2021', 'M', 'Branco', 'Av. Das Nações / Centro', '', '', ''],
  ['17', 'Rayssa Vitória Fernandes Costa', '26/12/2021', 'F', 'Pardo', 'Rua Espírito Santo/Maranheses', '', '', ''],
  ['18', 'Ysís Gabrielly Lima da Silva', '20/03/2022', 'F', 'Pardo', 'Rua Pará / Aeroporto', '', '', ''],
  ['19', 'Gael Henry Oliveira Moura', '09/11/2021', 'M', 'Pardo', 'Serto dos maranhese', '', '', ''],
  ['20', 'Yuri Levi Silva Costa', '02/10/2021', 'M', 'Pardo', 'Rua Luiz Vitor, Setor Maranhense', '', '', ''],
];

/**
 * Amostra oficial de 8 colunas da Escola Municipal EMIEIF Ermínio Brito:
 * Coluna 1: SERIE DO ALUO
 * Coluna 2: NOME COMPLETO DO ALUNO
 * Coluna 3: DATA DE NASCIMENTO
 * Coluna 4: SEXO DO ALUNO
 * Coluna 5: COR/RAÇA DO ALUNO
 * Coluna 6: EDENREÇO DO ALUNO
 * Coluna 7: PCD DO ALUNO
 * Coluna 8: SE O ALUNO TEM LAUDO
 */
export const OFFICIAL_ERMINIO_BRITO_8COL_DATA = [
  ['ESCOLA: EMIEIF ERMINIO BRITO', '', '', 'TURMAS: PRÉ II – 1º AO 5º - 6º AO 9º ANOS', '', '', 'DATA: 15/09/2026', ''],
  ['LEVANTAMENTO DO QUANTITATIVO E PERFIL DOS ALUNOS POR UNIDADE ESCOLAR E TURMAS ATENDIDAS', '', '', '', '', '', '', ''],
  [
    'SERIE DO ALUO',
    'NOME COMPLETO DO ALUNO',
    'DATA DE NASCIMENTO',
    'SEXO DO ALUNO',
    'COR/RAÇA DO ALUNO',
    'EDENREÇO DO ALUNO',
    'PCD DO ALUNO',
    'SE O ALUNO TEM LAUDO',
  ],
  ['PRÉ II - 1', 'Adria Gabriele Silva Santos', '14/04/2020', 'F', 'Parda', 'Vicinal Silvano', '*****', '*****'],
  ['PRÉ II - 2', 'Alana Valentina Rodrigues Nunes', '28/07/2020', 'F', 'Branca', 'Faz. Caracol', '*****', '*****'],
  ['PRÉ II - 3', 'Arthur Miguel Pereira Sousa', '04/03/2020', 'M', 'Pardo', 'Vicinal Silvano', '*****', '*****'],
  ['PRÉ II - 4', 'Davi Lucca dos Santos Feitosa', '03/08/2020', 'M', 'Preto', 'Vicinal Mandiocão', '*****', '*****'],
  ['PRÉ II - 5', 'Eloah Beatriz Carvalho Simões', '22/04/2020', 'F', 'Branca', 'Faz. Morro Alto', '*****', '*****'],
  ['PRÉ II - 6', 'Helena Sofia Lima Rocha', '17/12/2020', 'F', 'Parda', 'Vicinal Silvano', '*****', '*****'],
  ['PRÉ II - 7', 'João Pedro Almeida de Sousa', '24/09/2020', 'M', 'Branco', 'Faz. Caracol', '*****', '*****'],
  ['PRÉ II - 8', 'Lorenzo Gabriel Martins Oliveira', '20/03/2020', 'M', 'Pardo', 'Vicinal Mandiocão', '*****', '*****'],
  ['PRÉ II - 9', 'Maria Cecília Gomes Fernandes', '11/02/2020', 'F', 'Branca', 'Faz. Morro Alto', '*****', '*****'],
  ['PRÉ II - 10', 'Luan Sousa de Jesus – PCD', '22/09/2020', 'M', 'Branco', 'Vicinal Silvano', 'PCD', '*****'],
  ['PRÉ II - 11', 'Lucas Sousa de Jesus - PCD', '22/09/2020', 'M', 'Branco', 'Vicinal Silvano', 'PCD', 'SIM'],
  ['PRÉ II - 12', 'Samuel Henrique Ribeiro Felipe', '18/03/2020', 'M', 'Pardo', 'Faz. Caracol', '*****', '*****'],
  ['PRÉ II - 13', 'Yasmin Vitória Nascimento Costa', '05/06/2020', 'F', 'Parda', 'Vicinal Mandiocão', '*****', '*****'],
];

/**
 * Gera e faz download de modelo Excel (.xlsx) ou LibreOffice Calc (.ods)
 */
export function downloadSpreadsheetTemplate(format: 'xlsx' | 'ods' = 'xlsx'): void {
  const ws = XLSX.utils.aoa_to_sheet(OFFICIAL_MUNICIPAL_SAMPLE_DATA);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 42 },
    { wch: 14 },
    { wch: 8 },
    { wch: 14 },
    { wch: 38 },
    { wch: 36 },
    { wch: 16 },
    { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  const sheetName = 'Perfil_Alunos_EMEI_Ruth';
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const fileName =
    format === 'ods'
      ? 'SucessoEdu_Modelo_Alunos_LibreOffice_Calc.ods'
      : 'SucessoEdu_Modelo_Alunos_Microsoft_Excel.xlsx';

  XLSX.writeFile(wb, fileName, { bookType: format });
}

/**
 * Gera e faz download de documento oficial Microsoft Word (.docx) formatado com a tabela
 */
export async function downloadWordTemplate(): Promise<void> {
  const zip = new JSZip();

  // [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  // _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // Monta linhas da tabela Word
  const tableRowsXml = OFFICIAL_MUNICIPAL_SAMPLE_DATA.slice(2)
    .map((row, rIdx) => {
      const isHeader = rIdx === 0;
      const cellsXml = row
        .map((cell) => {
          const escaped = String(cell || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          const boldXml = isHeader ? '<w:b/>' : '';
          const bgXml = isHeader ? '<w:shd w:fill="E0E7FF"/>' : '';

          return `<w:tc>
            <w:tcPr>
              ${bgXml}
              <w:tcMar>
                <w:top w:w="120" w:type="dxa"/>
                <w:bottom w:w="120" w:type="dxa"/>
                <w:left w:w="140" w:type="dxa"/>
                <w:right w:w="140" w:type="dxa"/>
              </w:tcMar>
            </w:tcPr>
            <w:p>
              <w:r>
                <w:rPr>${boldXml}<w:sz w:val="18"/></w:rPr>
                <w:t>${escaped}</w:t>
              </w:r>
            </w:p>
          </w:tc>`;
        })
        .join('');

      return `<w:tr>${cellsXml}</w:tr>`;
    })
    .join('');

  // word/document.xml
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="1E3A8A"/></w:rPr>
        <w:t>ESCOLA: EMEI RUTH PEREIRA BARBARESCO   |   TURMA: PRÉ-ESCOLA I A   |   DATA: 15/09/2026</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="334155"/></w:rPr>
        <w:t>LEVANTAMENTO DO QUANTITATIVO E PERFIL DOS ALUNOS POR TURMA</w:t>
      </w:r>
    </w:p>
    <w:tbl>
      <w:tblPr>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        </w:tblBorders>
      </w:tblPr>
      ${tableRowsXml}
    </w:tbl>
  </w:body>
</w:document>`;

  zip.file('word/document.xml', docXml);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'SucessoEdu_Modelo_Alunos_Microsoft_Word.docx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Gera e faz download de documento oficial LibreOffice Writer (.odt) com tabela
 */
export async function downloadWriterTemplate(): Promise<void> {
  const zip = new JSZip();

  zip.file('mimetype', 'application/vnd.oasis.opendocument.text');

  zip.file(
    'META-INF/manifest.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`
  );

  const tableRowsXml = OFFICIAL_MUNICIPAL_SAMPLE_DATA.slice(2)
    .map((row) => {
      const cellsXml = row
        .map((cell) => {
          const escaped = String(cell || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          return `<table:table-cell office:value-type="string"><text:p>${escaped}</text:p></table:table-cell>`;
        })
        .join('');
      return `<table:table-row>${cellsXml}</table:table-row>`;
    })
    .join('');

  const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
  office:version="1.2">
  <office:body>
    <office:text>
      <text:p>ESCOLA: EMEI RUTH PEREIRA BARBARESCO | TURMA: PRÉ-ESCOLA I A | DATA: 15/09/2026</text:p>
      <text:p>LEVANTAMENTO DO QUANTITATIVO E PERFIL DOS ALUNOS POR TURMA</text:p>
      <table:table table:name="Alunos">
        ${tableRowsXml}
      </table:table>
    </office:text>
  </office:body>
</office:document-content>`;

  zip.file('content.xml', contentXml);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'SucessoEdu_Modelo_Alunos_LibreOffice_Writer.odt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
