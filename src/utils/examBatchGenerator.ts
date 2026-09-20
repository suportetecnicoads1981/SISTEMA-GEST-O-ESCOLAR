import { Exam, Question, SchoolSettings } from '../types';

export interface ExamOptionVariant {
  originalIndex: number;
  newLetter: string;
  text: string;
  isCorrect: boolean;
}

export interface ExamQuestionVariant {
  originalQuestionId: string;
  originalIndex: number;
  modelQuestionNumber: number;
  stem: string;
  topic?: string;
  bnccSkill?: string;
  points: number;
  options: ExamOptionVariant[];
  correctLetter: string;
  explanation?: string;
}

export interface ExamModelVariant {
  modelLetter: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  modelLabel: string;
  uniqueVariantCode: string;
  questions: ExamQuestionVariant[];
  answerKeyMap: Record<number, string>; // modelQuestionNumber -> correctLetter
}

export interface ExamBatchConfig {
  modelCount: number; // 1, 2, 3, 4, 5 ou 6
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  includeTeacherKeyInBatch: boolean;
  includeStudentBubbleSheets: boolean;
  customHeaderTitle?: string;
  customInstructions?: string;
  schoolName: string;
  className: string;
  subjectName: string;
  teacherName: string;
  scheduledDate: string;
  totalPoints: number;
  timeLimitMinutes: number;
}

/**
 * Embaralha um array de forma determinística utilizando uma semente numérica
 */
function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  let currentSeed = seed;
  const pseudoRandom = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(pseudoRandom() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

/**
 * Gera múltiplos modelos de prova (Caderno A, B, C...) com o mesmo conteúdo pedagógico
 * porém com reorganização anti-cola de questões e/ou alternativas.
 */
export function generateExamVariants(
  exam: Exam,
  allQuestions: Question[],
  config: Partial<ExamBatchConfig>
): ExamModelVariant[] {
  const modelCount = Math.max(1, Math.min(6, config.modelCount || 2));
  const shuffleQuestions = config.shuffleQuestions ?? true;
  const shuffleOptions = config.shuffleOptions ?? true;

  // Obter lista base de questões do exame na ordem cadastrada
  const baseQuestions: Array<{ question: Question; points: number; originalIndex: number }> = [];
  (exam.questions || []).forEach((cfg, idx) => {
    const q = allQuestions.find((item) => item.id === cfg.questionId);
    if (q) {
      baseQuestions.push({
        question: q,
        points: cfg.points || (exam.totalPoints / (exam.questions?.length || 1)),
        originalIndex: idx + 1,
      });
    }
  });

  const variants: ExamModelVariant[] = [];

  for (let m = 0; m < modelCount; m++) {
    const modelLetter = LETTERS[m];
    const seed = (m + 1) * 7919 + exam.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

    // Reorganizar questões (Modelo A preserva a ordem se shuffleQuestions for false, senão aplica seed)
    let orderedQuestions = [...baseQuestions];
    if (shuffleQuestions && m > 0) {
      orderedQuestions = seededShuffle(orderedQuestions, seed + 101);
    }

    const questionsVariant: ExamQuestionVariant[] = [];
    const answerKeyMap: Record<number, string> = {};

    orderedQuestions.forEach((item, qIdx) => {
      const q = item.question;
      const modelQNumber = qIdx + 1;

      // Opções
      const rawOptions = (q.options || []).map((opt, oIdx) => ({
        originalIndex: oIdx,
        text: opt.text,
        isCorrect: !!opt.isCorrect,
      }));

      let orderedOptions = [...rawOptions];
      if (shuffleOptions && m > 0 && rawOptions.length > 1) {
        orderedOptions = seededShuffle(orderedOptions, seed + qIdx * 17);
      }

      let correctLetter = 'DISC';
      const formattedOptions: ExamOptionVariant[] = orderedOptions.map((opt, oIdx) => {
        const letter = String.fromCharCode(65 + oIdx);
        if (opt.isCorrect) {
          correctLetter = letter;
        }
        return {
          originalIndex: opt.originalIndex,
          newLetter: letter,
          text: opt.text,
          isCorrect: opt.isCorrect,
        };
      });

      answerKeyMap[modelQNumber] = correctLetter;

      questionsVariant.push({
        originalQuestionId: q.id,
        originalIndex: item.originalIndex,
        modelQuestionNumber: modelQNumber,
        stem: q.stem,
        topic: q.topic,
        bnccSkill: q.bnccSkill,
        points: item.points,
        options: formattedOptions,
        correctLetter,
        explanation: q.explanation,
      });
    });

    const uniqueVariantCode = `MOD-${modelLetter}-${exam.id.slice(-4).toUpperCase()}`;

    variants.push({
      modelLetter,
      modelLabel: `Caderno / Modelo ${modelLetter}`,
      uniqueVariantCode,
      questions: questionsVariant,
      answerKeyMap,
    });
  }

  return variants;
}

/**
 * Matriz comparativa de gabaritos entre os modelos (A, B, C, D)
 * Permite ao docente ver exatamente qual letra corresponde à mesma questão original em cada caderno.
 */
export interface ComparativeKeyRow {
  originalIndex: number;
  questionStemPreview: string;
  bnccSkill?: string;
  points: number;
  models: Record<string, { modelQuestionNumber: number; correctLetter: string }>;
}

export function generateComparativeAnswerKey(
  variants: ExamModelVariant[]
): ComparativeKeyRow[] {
  if (variants.length === 0) return [];

  const firstVariant = variants[0];
  const rows: ComparativeKeyRow[] = [];

  // Mapeia pelas questões da lista original
  const sortedOriginalIndices = Array.from(
    new Set(firstVariant.questions.map((q) => q.originalIndex))
  ).sort((a, b) => a - b);

  sortedOriginalIndices.forEach((origIdx) => {
    const qSample = firstVariant.questions.find((q) => q.originalIndex === origIdx);
    if (!qSample) return;

    const modelsData: Record<string, { modelQuestionNumber: number; correctLetter: string }> = {};

    variants.forEach((v) => {
      const qInModel = v.questions.find((q) => q.originalIndex === origIdx);
      if (qInModel) {
        modelsData[v.modelLetter] = {
          modelQuestionNumber: qInModel.modelQuestionNumber,
          correctLetter: qInModel.correctLetter,
        };
      }
    });

    rows.push({
      originalIndex: origIdx,
      questionStemPreview: qSample.stem.slice(0, 75) + (qSample.stem.length > 75 ? '...' : ''),
      bnccSkill: qSample.bnccSkill,
      points: qSample.points,
      models: modelsData,
    });
  });

  return rows;
}

/**
 * Gera documento HTML completo para impressão contínua em lote com quebras de página por modelo.
 */
export function generateBatchPrintHtml(
  variants: ExamModelVariant[],
  config: ExamBatchConfig
): string {
  const comparativeRows = generateComparativeAnswerKey(variants);

  const pagesHtml = variants
    .map((variant) => {
      return `
      <div class="exam-page">
        <!-- CABEÇALHO OFICIAL COM IDENTIFICAÇÃO DO MODELO -->
        <div class="header-box">
          <div class="header-top">
            <div>
              <div class="school-name">${config.schoolName}</div>
              <div class="exam-title">${config.customHeaderTitle || 'AVALIAÇÃO OFICIAL REGULAR'}</div>
            </div>
            <div class="model-badge">
              <div class="model-letter">${variant.modelLetter}</div>
              <div class="model-sub">MODELO DE PROVA</div>
            </div>
          </div>

          <div class="meta-grid">
            <div><strong>Componente:</strong> ${config.subjectName}</div>
            <div><strong>Turma:</strong> ${config.className}</div>
            <div><strong>Docente:</strong> ${config.teacherName}</div>
            <div><strong>Data:</strong> ${config.scheduledDate}</div>
            <div><strong>Duração:</strong> ${config.timeLimitMinutes} min</div>
            <div><strong>Valor Total:</strong> ${config.totalPoints.toFixed(1)} pts</div>
          </div>

          <div class="student-id-box">
            <div class="student-line"><strong>Nome do(a) Estudante:</strong> ____________________________________________________</div>
            <div class="student-meta">
              <div><strong>Nº Chamada:</strong> ______</div>
              <div><strong>Caderno:</strong> <span class="highlight-model">${variant.modelLetter}</span></div>
              <div><strong>Nota Obtida:</strong> [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; / ${config.totalPoints.toFixed(1)} ]</div>
            </div>
          </div>
        </div>

        <!-- INSTRUÇÕES -->
        <div class="instructions-card">
          <div class="inst-title">Orientações de Resolução • Caderno ${variant.modelLetter}:</div>
          <p>${config.customInstructions || '1. Esta avaliação possui modelos alternados de impressão. Verifique se o seu cartão-resposta está marcado com o mesmo modelo deste caderno. 2. Utilize caneta esferográfica azul ou preta. 3. Respostas rasuradas nas questões objetivas serão anuladas.'}</p>
        </div>

        <!-- QUESTÕES DO MODELO -->
        <div class="questions-container">
          ${variant.questions
            .map((q) => {
              const hasOptions = q.options && q.options.length > 0;
              return `
              <div class="question-item">
                <div class="q-head">
                  <span class="q-num">Questão ${q.modelQuestionNumber}</span>
                  ${q.bnccSkill ? `<span class="q-skill">[BNCC: ${q.bnccSkill}]</span>` : ''}
                  <span class="q-pts">(${q.points.toFixed(2)} pts)</span>
                </div>
                <div class="q-stem">${q.stem}</div>

                ${
                  hasOptions
                    ? `
                  <div class="options-list">
                    ${q.options
                      .map(
                        (opt) => `
                      <div class="opt-row">
                        <span class="opt-bubble">${opt.newLetter}</span>
                        <span class="opt-text">${opt.text}</span>
                      </div>
                    `
                      )
                      .join('')}
                  </div>
                `
                    : `
                  <div class="essay-box">
                    <div class="essay-placeholder">[Espaço reservado para desenvolvimento do raciocínio e resposta manuscrita]</div>
                  </div>
                `
                }
              </div>
            `;
            })
            .join('')}
        </div>

        <!-- CARTÃO-RESPOSTA RÁPIDO NO FINAL DA PROVA -->
        <div class="quick-bubble-sheet">
          <div class="bubble-sheet-title">
            <span>CARTÃO-RESPOSTA OFICIAL • CADERNO ${variant.modelLetter}</span>
            <span class="cod-tag">${variant.uniqueVariantCode}</span>
          </div>
          <div class="bubbles-grid">
            ${variant.questions
              .map((q) => {
                const isObj = q.options && q.options.length > 0;
                if (!isObj) return '';
                return `
                <div class="bubble-row">
                  <span class="bubble-q">Q${q.modelQuestionNumber}:</span>
                  <div class="bubble-letters">
                    ${['A', 'B', 'C', 'D', 'E'].slice(0, Math.max(4, q.options.length)).map(
                      (l) => `<span class="bubble-circle">${l}</span>`
                    ).join('')}
                  </div>
                </div>
              `;
              })
              .filter(Boolean)
              .join('')}
          </div>
        </div>
      </div>
    `;
    })
    .join('');

  // PÁGINA FINAL: GABARITO MESTRE COMPARATIVO DO PROFESSOR (se habilitado)
  const teacherKeyHtml = config.includeTeacherKeyInBatch
    ? `
    <div class="exam-page teacher-key-page">
      <div class="teacher-key-header">
        <div class="school-name">${config.schoolName}</div>
        <div class="teacher-key-title">GABARITO MESTRE COMPARATIVO • TODOS OS MODELOS EM LOTE</div>
        <div class="teacher-key-sub">
          Componente: ${config.subjectName} • Turma: ${config.className} • Docente: ${config.teacherName} • Data: ${config.scheduledDate}
        </div>
      </div>

      <div class="key-summary-box">
        <div class="summary-desc">
          Esta folha reúne o gabarito oficial de todos os cadernos gerados (${variants.map((v) => `Modelo ${v.modelLetter}`).join(', ')}). Utilize esta tabela para correção rápida de qualquer prova aplicada nesta turma.
        </div>
      </div>

      <table class="comparative-table">
        <thead>
          <tr>
            <th style="width: 55px;">Orig.</th>
            <th>Conteúdo / Habilidade BNCC</th>
            ${variants
              .map(
                (v) => `
              <th class="th-model">
                <div class="th-model-letter">Mod. ${v.modelLetter}</div>
                <div class="th-model-sub">Nº / Resp.</div>
              </th>
            `
              )
              .join('')}
            <th style="width: 65px;">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${comparativeRows
            .map((row) => {
              return `
              <tr>
                <td style="text-align: center; font-weight: bold; color: #475569;">#${row.originalIndex}</td>
                <td>
                  <div style="font-weight: 600; color: #1e293b; font-size: 8.5pt;">${row.questionStemPreview}</div>
                  ${row.bnccSkill ? `<div style="font-size: 7.5pt; color: #4338ca; font-weight: bold;">BNCC: ${row.bnccSkill}</div>` : ''}
                </td>
                ${variants
                  .map((v) => {
                    const cell = row.models[v.modelLetter];
                    if (!cell) return '<td>-</td>';
                    return `
                    <td class="td-model">
                      <div class="td-q-num">Q${cell.modelQuestionNumber}</div>
                      <div class="td-ans-bubble">${cell.correctLetter}</div>
                    </td>
                  `;
                  })
                  .join('')}
                <td style="text-align: center; font-weight: bold; color: #059669;">${row.points.toFixed(2)}</td>
              </tr>
            `;
            })
            .join('')}
        </tbody>
      </table>

      <!-- Resoluções Comentadas por Questão Original -->
      <div class="teacher-notes-section">
        <div class="notes-title">Resoluções & Justificativas do Gabarito</div>
        <div class="notes-grid">
          ${variants[0].questions
            .map((q) => {
              return `
              <div class="note-card">
                <div class="note-header">
                  <span>Questão Original #${q.originalIndex}</span>
                  <span class="note-skill">${q.bnccSkill || 'Geral'}</span>
                </div>
                <div class="note-stem">${q.stem.slice(0, 120)}...</div>
                <div class="note-explanation">
                  <strong>Justificativa:</strong> ${q.explanation || 'Alternativa conceitual correspondente aos descritores da matriz.'}
                </div>
              </div>
            `;
            })
            .join('')}
        </div>
      </div>
    </div>
  `
    : '';

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <title>Provas em Lote - ${config.subjectName} - ${config.className}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 15mm 15mm 15mm;
        }
        @media print {
          .exam-page {
            page-break-after: always;
            break-after: page;
          }
          .exam-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          font-size: 10pt;
          color: #0f172a;
          line-height: 1.45;
          margin: 0;
          padding: 0;
          background: #fff;
        }
        .exam-page {
          padding: 10px 0;
        }
        .header-box {
          border: 2px solid #0f172a;
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 14px;
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1.5px solid #0f172a;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }
        .school-name {
          font-size: 13pt;
          font-weight: 800;
          text-transform: uppercase;
          color: #0f172a;
        }
        .exam-title {
          font-size: 10.5pt;
          font-weight: 700;
          color: #334155;
          margin-top: 2px;
        }
        .model-badge {
          background: #0f172a;
          color: #fff;
          border-radius: 6px;
          padding: 4px 12px;
          text-align: center;
          min-width: 80px;
        }
        .model-letter {
          font-size: 18pt;
          font-weight: 900;
          line-height: 1;
        }
        .model-sub {
          font-size: 6.5pt;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #cbd5e1;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px 12px;
          font-size: 8.5pt;
          color: #334155;
          margin-bottom: 8px;
        }
        .student-id-box {
          border-top: 1px solid #cbd5e1;
          padding-top: 8px;
        }
        .student-line {
          font-size: 9pt;
          margin-bottom: 6px;
        }
        .student-meta {
          display: flex;
          justify-content: space-between;
          font-size: 8.5pt;
          color: #475569;
        }
        .highlight-model {
          display: inline-block;
          background: #e0e7ff;
          color: #3730a3;
          font-weight: 900;
          font-size: 11pt;
          padding: 0 8px;
          border-radius: 4px;
          border: 1px solid #c7d2fe;
        }
        .instructions-card {
          background: #f8fafc;
          border: 1px dashed #94a3b8;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 8pt;
          color: #334155;
          margin-bottom: 16px;
        }
        .inst-title {
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 2px;
        }
        .instructions-card p {
          margin: 0;
        }
        .questions-container {
          margin-bottom: 20px;
        }
        .question-item {
          margin-bottom: 18px;
          page-break-inside: avoid;
        }
        .q-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .q-num {
          font-weight: 800;
          font-size: 10pt;
          color: #0f172a;
        }
        .q-skill {
          font-size: 7.5pt;
          background: #eef2ff;
          color: #4338ca;
          padding: 1px 6px;
          border-radius: 4px;
          font-weight: 600;
        }
        .q-pts {
          font-size: 8pt;
          color: #64748b;
          margin-left: auto;
        }
        .q-stem {
          font-size: 9.5pt;
          color: #1e293b;
          margin-bottom: 8px;
          text-align: justify;
        }
        .options-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding-left: 6px;
        }
        .opt-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 9pt;
        }
        .opt-bubble {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid #0f172a;
          font-weight: 800;
          font-size: 8pt;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .opt-text {
          flex: 1;
        }
        .essay-box {
          border: 1px dashed #cbd5e1;
          height: 90px;
          border-radius: 6px;
          padding: 6px 10px;
        }
        .essay-placeholder {
          font-size: 8pt;
          color: #94a3b8;
          font-style: italic;
        }
        .quick-bubble-sheet {
          border: 1.5px solid #334155;
          border-radius: 6px;
          padding: 8px 12px;
          background: #fdfdfd;
          page-break-inside: avoid;
          margin-top: 15px;
        }
        .bubble-sheet-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 8.5pt;
          font-weight: 800;
          color: #0f172a;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 4px;
          margin-bottom: 8px;
        }
        .cod-tag {
          font-family: monospace;
          background: #e2e8f0;
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 7.5pt;
        }
        .bubbles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 4px 8px;
        }
        .bubble-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 8pt;
        }
        .bubble-q {
          font-weight: 700;
          width: 24px;
        }
        .bubble-letters {
          display: flex;
          gap: 3px;
        }
        .bubble-circle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 1px solid #64748b;
          font-size: 6.5pt;
          font-weight: bold;
          color: #334155;
        }

        /* ESTILOS DA FOLHA DO PROFESSOR (GABARITO MESTRE) */
        .teacher-key-page {
          padding-top: 10px;
        }
        .teacher-key-header {
          border-bottom: 2px solid #3730a3;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .teacher-key-title {
          font-size: 13pt;
          font-weight: 900;
          color: #3730a3;
          margin-top: 2px;
        }
        .teacher-key-sub {
          font-size: 8.5pt;
          color: #475569;
          margin-top: 2px;
        }
        .key-summary-box {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 8px 12px;
          font-size: 8.5pt;
          color: #1e3a8a;
          margin-bottom: 12px;
          border-radius: 0 6px 6px 0;
        }
        .comparative-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8.5pt;
          margin-bottom: 16px;
        }
        .comparative-table th, .comparative-table td {
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
        }
        .comparative-table th {
          background: #f1f5f9;
          font-weight: 800;
          color: #0f172a;
          text-align: left;
        }
        .th-model {
          text-align: center !important;
          background: #e0e7ff !important;
          color: #312e81 !important;
          min-width: 65px;
        }
        .th-model-letter {
          font-size: 9pt;
          font-weight: 900;
        }
        .th-model-sub {
          font-size: 6.5pt;
          font-weight: 600;
          color: #4338ca;
        }
        .td-model {
          text-align: center;
          background: #faf5ff;
        }
        .td-q-num {
          font-size: 7.5pt;
          color: #64748b;
          font-weight: bold;
        }
        .td-ans-bubble {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          background: #4338ca;
          color: #fff;
          border-radius: 50%;
          font-weight: 900;
          font-size: 10pt;
          margin-top: 2px;
        }
        .teacher-notes-section {
          margin-top: 14px;
        }
        .notes-title {
          font-size: 10pt;
          font-weight: 800;
          color: #0f172a;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 4px;
          margin-bottom: 10px;
        }
        .notes-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .note-card {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 10px;
          background: #f8fafc;
          font-size: 8pt;
          page-break-inside: avoid;
        }
        .note-header {
          display: flex;
          justify-content: space-between;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 3px;
        }
        .note-skill {
          color: #4338ca;
          font-size: 7pt;
        }
        .note-stem {
          color: #334155;
          margin-bottom: 4px;
        }
        .note-explanation {
          color: #1e293b;
          background: #fff;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 4px 6px;
        }
      </style>
    </head>
    <body>
      ${pagesHtml}
      ${teacherKeyHtml}
      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `;
}
