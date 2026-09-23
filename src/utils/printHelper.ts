import { sanitizeHtmlFragment } from './safeHtml';
/**
 * Utilitário centralizado e robusto para Impressão e Pré-visualização Oficial no SucessoEdu.
 * Garante compatibilidade total em iframes, navegadores móveis e sandboxes.
 */

export interface PrintOptions {
  title?: string;
  documentCategory?: string;
  schoolName?: string;
  schoolInep?: string;
  schoolCity?: string;
  schoolState?: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Constrói o HTML completo com cabeçalho oficial e estilos de impressão A4.
 */
export function buildPrintHtml(contentHtml: string, options?: PrintOptions): string {
  const title = options?.title || 'Documento Oficial - SucessoEdu Gestão Escolar';
  const orientation = options?.orientation || 'portrait';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 ${orientation};
      margin: 10mm 12mm 12mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #ffffff;
      color: #0f172a;
      margin: 0;
      padding: 16px;
      font-size: 12px;
      line-height: 1.45;
    }
    .no-print {
      display: none !important;
    }
    button:not(.print-banner-bar button), select, input, textarea, [role="button"]:not(.printable-item) {
      display: none !important;
    }
    @media print {
      body {
        padding: 0;
        background: white;
      }
      .no-print, .print-banner-bar {
        display: none !important;
      }
      .print-page-break {
        page-break-after: always;
        break-after: page;
      }
    }
    .print-banner-bar {
      background: #1e1b4b;
      color: #ffffff;
      padding: 12px 20px;
      margin-bottom: 20px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .print-banner-bar button {
      background: #4f46e5;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .print-banner-bar button:hover {
      background: #4338ca;
    }
    .print-banner-bar .close-btn {
      background: rgba(255,255,255,0.15);
      margin-left: 8px;
    }
    .print-banner-bar .close-btn:hover {
      background: rgba(255,255,255,0.25);
    }
    .print-container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      margin-bottom: 8px;
    }
    th, td {
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }
    th {
      background-color: #f1f5f9 !important;
      font-weight: 700;
      color: #0f172a;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    /* Recharts SVG High-Legibility & Print Scalability */
    .recharts-responsive-container {
      width: 100% !important;
      height: auto !important;
      min-height: 280px !important;
      overflow: visible !important;
      page-break-inside: avoid !important;
    }
    svg.recharts-surface {
      overflow: visible !important;
      width: 100% !important;
    }
    svg.recharts-surface text,
    svg.recharts-surface tspan,
    .recharts-cartesian-axis-tick text {
      fill: #0f172a !important;
      font-weight: 700 !important;
      font-size: 11px !important;
      font-family: 'Plus Jakarta Sans', sans-serif !important;
    }
    line.recharts-cartesian-axis-line,
    line.recharts-cartesian-axis-tick-line {
      stroke: #334155 !important;
      stroke-width: 1.5px !important;
    }
    g.recharts-cartesian-grid line {
      stroke: #cbd5e1 !important;
      stroke-dasharray: 2 2 !important;
    }
    .recharts-tooltip-wrapper {
      display: none !important;
    }
    .recharts-label-list text {
      fill: #0f172a !important;
      font-weight: 800 !important;
    }
  </style>
</head>
<body>
  <div class="no-print print-banner-bar">
    <div>
      <strong style="font-size: 14px;">🖨️ Pré-visualização de Impressão Oficial</strong>
      <div style="font-size: 11px; opacity: 0.85;">Pressione o botão para abrir o diálogo de impressoras ou selecione "Salvar como PDF".</div>
    </div>
    <div>
      <button onclick="window.print()">
        <span>Imprimir Agora (Ctrl + P)</span>
      </button>
      <button class="close-btn" onclick="window.close()">
        <span>Fechar</span>
      </button>
    </div>
  </div>

  <div class="print-container">
    ${contentHtml}
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch(e) {
          console.error('Auto-print error', e);
        }
      }, 400);
    });
  </script>
</body>
</html>`;
}

/**
 * Cria ou atualiza um overlay visual na aplicação para garantir que o usuário veja
 * a tela de impressão / pré-visualização A4 mesmo se o navegador bloquear popups.
 */
function showInAppPrintModal(contentHtml: string, options?: PrintOptions) {
  const existingModal = document.getElementById('sucessoedu_in_app_print_modal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'sucessoedu_in_app_print_modal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.backgroundColor = 'rgba(15, 23, 42, 0.85)';
  modal.style.zIndex = '999999';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'flex-start';
  modal.style.padding = '16px';
  modal.style.overflowY = 'auto';
  modal.style.backdropFilter = 'blur(4px)';

  const title = options?.title || 'Documento Oficial para Impressão';

  modal.innerHTML = `
    <style>
      #sucessoedu_a4_sheet .no-print,
      #sucessoedu_a4_sheet button,
      #sucessoedu_a4_sheet select,
      #sucessoedu_a4_sheet input {
        display: none !important;
      }
      @media print {
        #sucessoedu_in_app_print_modal {
          position: static !important;
          width: 100% !important;
          height: auto !important;
          background: transparent !important;
          padding: 0 !important;
          backdrop-filter: none !important;
        }
        #sucessoedu_in_app_print_modal > div {
          max-width: 100% !important;
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          border-radius: 0 !important;
        }
        #sucessoedu_in_app_header,
        #sucessoedu_in_app_print_modal .no-print {
          display: none !important;
        }
        #sucessoedu_a4_sheet {
          box-shadow: none !important;
          border: none !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
        }
      }
    </style>
    <div style="width: 100%; max-width: 900px; background: #ffffff; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); overflow: hidden; margin-bottom: 24px; animation: modalFadeIn 0.2s ease-out;">
      <!-- Header do Modal (Hidden on Print) -->
      <div id="sucessoedu_in_app_header" class="no-print" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: white; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid #4338ca;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 36px; height: 36px; border-radius: 10px; background: #4f46e5; display: flex; align-items: center; justify-content: center; font-size: 18px;">
            🖨️
          </div>
          <div>
            <h3 style="margin: 0; font-size: 15px; font-weight: 800; font-family: 'Plus Jakarta Sans', sans-serif;">${title}</h3>
            <p style="margin: 2px 0 0 0; font-size: 11px; opacity: 0.85;">Pré-visualização Oficial A4 & Diálogo de Impressão</p>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button id="sucessoedu_btn_trigger_dialog" style="background: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            <span>🖨️ Abrir Diálogo de Impressão (Ctrl + P)</span>
          </button>
          <button id="sucessoedu_btn_download_html" style="background: #059669; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <span>📥 Baixar HTML</span>
          </button>
          <button id="sucessoedu_btn_close_modal" style="background: rgba(255,255,255,0.15); color: white; border: none; padding: 8px 12px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer;">
            <span>✕ Fechar</span>
          </button>
        </div>
      </div>

      <!-- Folha A4 de Pré-Visualização -->
      <div style="background: #e2e8f0; padding: 24px 16px; min-height: 500px; display: flex; justify-content: center;">
        <div id="sucessoedu_a4_sheet" style="width: 100%; max-width: 800px; background: white; padding: 32px 36px; border-radius: 4px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); color: #0f172a; font-family: 'Plus Jakarta Sans', sans-serif;">
          ${contentHtml}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Handlers
  document.getElementById('sucessoedu_btn_close_modal')?.addEventListener('click', () => {
    modal.remove();
  });

  document.getElementById('sucessoedu_btn_trigger_dialog')?.addEventListener('click', () => {
    window.print();
  });

  document.getElementById('sucessoedu_btn_download_html')?.addEventListener('click', () => {
    downloadPrintableHtml(contentHtml, 'documento_sucessoedu', title);
  });

  // Tenta abrir o diálogo de impressão nativo
  setTimeout(() => {
    try {
      window.print();
    } catch (e) {
      console.warn('Auto print trigger error:', e);
    }
  }, 300);
}

/**
 * Dispara o diálogo oficial de impressão do navegador ou gera impressão isolada via janela/iframe/modal.
 */
export function triggerPrint(
  targetElementOrHtml?: HTMLElement | string | null,
  options?: PrintOptions
): boolean {
  try {
    let contentHtml = '';
    if (typeof targetElementOrHtml === 'string') {
      contentHtml = targetElementOrHtml;
    } else if (targetElementOrHtml instanceof HTMLElement) {
      contentHtml = targetElementOrHtml.innerHTML;
    }
    // Remove qualquer código executável vindo dos dados antes de montar a impressão.
    contentHtml = sanitizeHtmlFragment(contentHtml);

    if (contentHtml.trim()) {
      // 1. Tenta popup em nova janela
      let popupOpened = false;
      try {
        const fullHtml = buildPrintHtml(contentHtml, options);
        const printWindow = window.open('', '_blank', 'width=950,height=850,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes');
        if (printWindow && !printWindow.closed) {
          printWindow.document.open();
          printWindow.document.write(fullHtml);
          printWindow.document.close();
          printWindow.focus();
          popupOpened = true;
        }
      } catch (winErr) {
        console.warn('Popup blocked:', winErr);
      }

      // 2. Se o popup for bloqueado pelo iframe/sandbox, exibe o preview interativo completo com botão de impressão nativo
      if (!popupOpened) {
        showInAppPrintModal(contentHtml, options);
      }

      return true;
    }

    // 3. Disparo direto caso não haja HTML específico fornecido
    window.print();
    return true;
  } catch (err) {
    console.error('Falha ao acionar impressora:', err);
    try {
      window.print();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Salva e faz download do conteúdo como documento HTML imprimível e visualizável
 */
export function downloadPrintableHtml(
  contentHtml: string,
  fileName: string = 'documento_oficial',
  title: string = 'Documento Escolar Oficial'
) {
  const fullHtml = buildPrintHtml(contentHtml, { title });
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}_${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
