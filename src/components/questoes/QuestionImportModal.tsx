import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  Check,
  AlertCircle,
  Sparkles,
  Download,
  BookOpen,
  FileSpreadsheet,
  Layers,
  HelpCircle,
  CheckCircle2,
  ListOrdered,
  Eye,
} from 'lucide-react';
import { Question } from '../../types';

interface QuestionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportQuestions: (questions: Question[]) => void;
}

export const QuestionImportModal: React.FC<QuestionImportModalProps> = ({
  isOpen,
  onClose,
  onImportQuestions,
}) => {
  const [importTab, setImportTab] = useState<'PRESETS' | 'PASTE_TEXT' | 'FILE_UPLOAD'>('PRESETS');
  const [inputText, setInputText] = useState('');
  const [detectedFormat, setDetectedFormat] = useState<'JSON' | 'CSV' | 'TXT_EXAM' | 'UNKNOWN'>('UNKNOWN');
  const [parsedPreviewQuestions, setParsedPreviewQuestions] = useState<Question[]>([]);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  // Preset Curricular Question Packs
  const PRESET_PACKS = {
    BNCC_GERAL: [
      {
        id: `q-bncc-mat-01-${Date.now()}`,
        code: 'MAT-BNCC-01',
        subject: 'Matemática',
        topic: 'Geometria Analítica e Retas',
        gradeLevel: '3º Ano',
        bnccSkill: 'EM13MAT301',
        difficulty: 'MEDIO' as const,
        type: 'MULTIPLE_CHOICE' as const,
        stem: 'Duas retas no plano cartesiano são perpendiculares entre si. Se a equação da primeira reta é dada por 2x - 3y + 6 = 0, qual é o coeficiente angular da segunda reta perpendicular?',
        options: [
          { id: 'opt-1', text: '-3/2 (ou -1,5)', isCorrect: true, explanation: 'Gabarito: O coeficiente angular da primeira reta é m1 = -a/b = 2/3. Para ser perpendicular, m2 = -1/m1 = -3/2.' },
          { id: 'opt-2', text: '2/3', isCorrect: false, explanation: 'Distrator: Apresentou o mesmo coeficiente angular (condição de paralelismo).' },
          { id: 'opt-3', text: '3/2', isCorrect: false, explanation: 'Distrator: Inverteu a fração mas esqueceu de inverter o sinal algébrico.' },
          { id: 'opt-4', text: '-2/3', isCorrect: false, explanation: 'Distrator: Inverteu apenas o sinal sem inverter os termos da fração.' },
        ],
        explanation: 'Duas retas r e s são perpendiculares se, e somente se, o produto de seus coeficientes angulares for igual a -1 (mr * ms = -1).',
        authorTeacher: 'Acervo Pedagógico BNCC / MEC',
        tags: ['Geometria Analítica', 'Retas Perpendiculares', 'BNCC'],
        createdAt: new Date().toISOString().split('T')[0],
      },
      {
        id: `q-bncc-port-01-${Date.now()}`,
        code: 'PORT-BNCC-01',
        subject: 'Língua Portuguesa',
        topic: 'Figuras de Linguagem e Recursos Estilísticos',
        gradeLevel: '3º Ano',
        bnccSkill: 'EM13LP06',
        difficulty: 'FACIL' as const,
        type: 'MULTIPLE_CHOICE' as const,
        stem: 'No verso modernista "Chove chuva, chove sem parar", a repetição intencional do fonema consonantal /ʃ/ (som de ch) caracteriza a figura de som denominada:',
        options: [
          { id: 'opt-1', text: 'Aliteração', isCorrect: true, explanation: 'Gabarito: Aliteração é a repetição intencional de sons consonantais idênticos ou semelhantes.' },
          { id: 'opt-2', text: 'Assonância', isCorrect: false, explanation: 'Distrator: Assonância é a repetição de sons vocálicos, não consonantais.' },
          { id: 'opt-3', text: 'Onomatopeia', isCorrect: false, explanation: 'Distrator: Onomatopeia é a imitação de sons reais (como tique-taque ou cabum).' },
          { id: 'opt-4', text: 'Paranomásia', isCorrect: false, explanation: 'Distrator: Paranomásia é o uso de palavras com sons semelhantes mas sentidos diferentes (trocadilho).' },
        ],
        explanation: 'A aliteração consiste na reiteração sistemática de fonemas consonantais para produzir expressividade fônica e ritmo no poema.',
        authorTeacher: 'Acervo Pedagógico BNCC / MEC',
        tags: ['Literatura', 'Figuras de Sintaxe', 'Aliteração', 'BNCC'],
        createdAt: new Date().toISOString().split('T')[0],
      },
      {
        id: `q-bncc-bio-01-${Date.now()}`,
        code: 'BIO-BNCC-01',
        subject: 'Biologia',
        topic: 'Genética e Hereditariedade Mendeliana',
        gradeLevel: '3º Ano',
        bnccSkill: 'EM13CNT303',
        difficulty: 'MEDIO' as const,
        type: 'MULTIPLE_CHOICE' as const,
        stem: 'Em um cruzamento entre dois indivíduos heterozigotos para uma característica com dominância completa (Aa x Aa), qual é a probabilidade de nascer um descendente com fenótipo DOMINANTE?',
        options: [
          { id: 'opt-1', text: '3/4 (75%)', isCorrect: true, explanation: 'Gabarito: Os genótipos possíveis são 1 AA (dominante), 2 Aa (dominantes) e 1 aa (recessivo). Portanto, 3/4 exibem fenótipo dominante.' },
          { id: 'opt-2', text: '1/2 (50%)', isCorrect: false, explanation: 'Distrator: Confunde com a proporção de indivíduos heterozigotos (Aa).' },
          { id: 'opt-3', text: '1/4 (25%)', isCorrect: false, explanation: 'Distrator: Proporção de homozigotos recessivos (aa).' },
          { id: 'opt-4', text: '100%', isCorrect: false, explanation: 'Distrator: Ocorre apenas se um dos parentais for homozigoto dominante (AA).' },
        ],
        explanation: 'Pela 1ª Lei de Mendel, o cruzamento monoíbrido Aa x Aa produz proporção fenotípica clássica 3 dominantes para 1 recessivo (3:1).',
        authorTeacher: 'Acervo Pedagógico BNCC / MEC',
        tags: ['Genética', 'Mendel', 'Probabilidade Genética', 'BNCC'],
        createdAt: new Date().toISOString().split('T')[0],
      },
      {
        id: `q-bncc-hist-01-${Date.now()}`,
        code: 'HIST-BNCC-01',
        subject: 'História',
        topic: 'Brasil República e Era Vargas',
        gradeLevel: '3º Ano',
        bnccSkill: 'EM13CHS102',
        difficulty: 'MEDIO' as const,
        type: 'MULTIPLE_CHOICE' as const,
        stem: 'A criação da Consolidação das Leis do Trabalho (CLT) em 1943, durante o Estado Novo varguista, representou historicamente:',
        options: [
          { id: 'opt-1', text: 'Uma estratégia de conciliação e tutela estatal sobre o operariado urbano, combinando avanços sociais com rígido controle sindical.', isCorrect: true, explanation: 'Gabarito: A legislação trabalhista atendeu reivindicações históricas dos trabalhadores ao mesmo tempo em que atrelou os sindicatos ao Ministério do Trabalho.' },
          { id: 'opt-2', text: 'A adoção irrestrita do modelo liberal norte-americano de livre negociação direta sem intervenção do Estado.', isCorrect: false, explanation: 'Distrator: Vargas adotava corporativismo estatizante, oposto ao liberalismo clássico.' },
          { id: 'opt-3', text: 'A extensão imediata de todos os direitos trabalhistas aos camponeses e trabalhadores rurais.', isCorrect: false, explanation: 'Distrator: O trabalhador rural só foi contemplado plenamente décadas depois (Estatuto do Trabalhador Rural em 1963).' },
          { id: 'opt-4', text: 'O fortalecimento de sindicatos anarquistas independentes e com plena liberdade de greve.', isCorrect: false, explanation: 'Distrator: O Estado Novo proibiu greves e reprimiu sindicatos autônomos.' },
        ],
        explanation: 'A política trabalhista de Getúlio Vargas consolidou a figura do "Pai dos Pobres" e o controle corporativo da classe trabalhadora urbana.',
        authorTeacher: 'Acervo Pedagógico BNCC / MEC',
        tags: ['Era Vargas', 'CLT', 'Estado Novo', 'Trabalhismo'],
        createdAt: new Date().toISOString().split('T')[0],
      },
    ],
    ENEM_SIMULADO: [
      {
        id: `q-enem-geo-01-${Date.now()}`,
        code: 'GEO-ENEM-01',
        subject: 'Geografia',
        topic: 'Dinâmica Urbana e Conurbação',
        gradeLevel: '3º Ano',
        bnccSkill: 'EM13CHS204',
        difficulty: 'MEDIO' as const,
        type: 'MULTIPLE_CHOICE' as const,
        stem: 'O processo de conurbação, intensificado no Brasil na segunda metade do século XX, caracteriza-se fundamentalmente por:',
        options: [
          { id: 'opt-1', text: 'União física e funcional de duas ou mais manchas urbanas limítrofes decorrente da expansão horizontal das cidades.', isCorrect: true, explanation: 'Gabarito exato da definição geográfica de conurbação urbana.' },
          { id: 'opt-2', text: 'Crescimento estritamente verticalizado nos centros metropolitanos sem expansão periférica.', isCorrect: false, explanation: 'Distrator: Confunde conurbação com verticalização urbana.' },
          { id: 'opt-3', text: 'Fluxo migratório diário do campo em direção à cidade para trabalho temporário.', isCorrect: false, explanation: 'Distrator: Confunde conurbação com migração pendular/sazonal.' },
          { id: 'opt-4', text: 'Diminuição da população de metrópoles globais por desindustrialização.', isCorrect: false, explanation: 'Distrator: Refere-se à desmetropolização.' },
        ],
        explanation: 'Conurbação é a fusão espacial de áreas urbanas vizinhas gerando uma mancha urbana contínua.',
        authorTeacher: 'Banco de Questões ENEM / BNCC',
        tags: ['Geografia Urbana', 'Conurbação', 'Metrópole', 'ENEM'],
        createdAt: new Date().toISOString().split('T')[0],
      },
      {
        id: `q-enem-qui-01-${Date.now()}`,
        code: 'QUI-ENEM-01',
        subject: 'Química',
        topic: 'Equilíbrio Químico e Le Chatelier',
        gradeLevel: '3º Ano',
        bnccSkill: 'EM13CNT301',
        difficulty: 'DIFICIL' as const,
        type: 'MULTIPLE_CHOICE' as const,
        stem: 'Considere a reação exotérmica de síntese da amônia: N₂(g) + 3H₂(g) ⇄ 2NH₃(g) (ΔH < 0). De acordo com o Princípio de Le Chatelier, qual intervenção aumentará o rendimento de produção de amônia?',
        options: [
          { id: 'opt-1', text: 'Aumento da pressão total do sistema e diminuição da temperatura.', isCorrect: true, explanation: 'Aumento de pressão desloca para menor volume molar de gás (4 mols -> 2 mols). Sendo exotérmica, diminuir a temperatura favorece o sentido direto.' },
          { id: 'opt-2', text: 'Aumento da temperatura e adição de catalisador sólido.', isCorrect: false, explanation: 'Distrator: Aumentar a temperatura favorece o sentido endotérmico e catalisador não altera a constante de equilíbrio.' },
          { id: 'opt-3', text: 'Redução da pressão do sistema e remoção contínua de N₂.', isCorrect: false, explanation: 'Distrator: Deslocaria para o sentido inverso (reagentes).' },
          { id: 'opt-4', text: 'Aumento da temperatura e diminuição da pressão.', isCorrect: false, explanation: 'Distrator: Ambas ações diminuem a produção de amônia.' },
        ],
        explanation: 'Le Chatelier: sistemas em equilíbrio respondem deslocando-se no sentido que atenua a perturbação imposta.',
        authorTeacher: 'Banco de Questões ENEM / BNCC',
        tags: ['Química Geral', 'Equilíbrio Químico', 'Le Chatelier', 'ENEM'],
        createdAt: new Date().toISOString().split('T')[0],
      },
    ],
    DISCURSIVAS_AUTO: [
      {
        id: `q-disc-red-01-${Date.now()}`,
        code: 'RED-DISC-01',
        subject: 'Redação e Produção Textual',
        topic: 'Argumentação e Coesão Textual',
        gradeLevel: '3º Ano',
        bnccSkill: 'EM13LP01',
        difficulty: 'MEDIO' as const,
        type: 'ESSAY_KEYWORD' as const,
        stem: 'Explique a importância da tese explícita no parágrafo de introdução de um texto dissertativo-argumentativo padrão ENEM e cite ao menos dois elementos coesivos interparágrafos recomendados.',
        options: [],
        modelAnswer: 'A tese orienta todo o projeto de texto e posicionamento crítico do autor. Conectivos interparágrafos como "Em primeiro lugar", "Ademais", "Outrossim" ou "Portanto" garantem a progressão temática coerente.',
        essayKeywords: ['tese', 'posicionamento', 'conectivo', 'coesão', 'progressão'],
        explanation: 'A introdução dissertativa deve apresentar o tema, problematizá-lo e demarcar a tese central defendida nos parágrafos de desenvolvimento.',
        authorTeacher: 'Banca de Correção Oficial',
        tags: ['Redação', 'Dissertação', 'Tese', 'Coesão'],
        createdAt: new Date().toISOString().split('T')[0],
      },
    ],
  };

  // Parser: Smart Text / Exam / CSV / JSON Interpreter
  const parseRawText = (text: string): Question[] => {
    const trimmed = text.trim();
    if (!trimmed) return [];

    // Case 1: Pure JSON
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      const list = Array.isArray(parsed) ? parsed : parsed.questions || [parsed];
      setDetectedFormat('JSON');
      return list.map((item: any, i: number) => ({
        id: item.id || `q-imp-json-${Date.now()}-${i}`,
        code: item.code || `IMP-JSON-${i + 1}`,
        subject: item.subject || 'Matemática',
        topic: item.topic || 'Conteúdo Avaliado',
        gradeLevel: item.gradeLevel || '3º Ano',
        bnccSkill: item.bnccSkill || undefined,
        difficulty: item.difficulty || 'MEDIO',
        type: item.type || 'MULTIPLE_CHOICE',
        stem: item.stem || 'Sem enunciado informado.',
        options: item.options || [
          { id: 'opt-1', text: 'Alternativa A (Gabarito)', isCorrect: true },
          { id: 'opt-2', text: 'Alternativa B', isCorrect: false },
        ],
        essayKeywords: item.essayKeywords,
        modelAnswer: item.modelAnswer,
        explanation: item.explanation || 'Resolução oficial.',
        authorTeacher: item.authorTeacher || 'Importação JSON',
        tags: item.tags || ['Importado'],
        createdAt: new Date().toISOString().split('T')[0],
      }));
    }

    // Case 2: CSV (Comma or Semicolon Separated)
    if (trimmed.includes(';') || (trimmed.includes(',') && trimmed.split('\n')[0].includes(','))) {
      const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length > 1) {
        setDetectedFormat('CSV');
        const delimiter = lines[0].includes(';') ? ';' : ',';
        const rows = lines.slice(lines[0].toLowerCase().includes('enunciado') ? 1 : 0);

        return rows.map((row, idx) => {
          const cols = row.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
          const subject = cols[0] || 'Geral';
          const topic = cols[1] || 'Tópico Geral';
          const difficulty = (cols[2]?.toUpperCase() === 'DIFICIL' || cols[2]?.toUpperCase() === 'FACIL' ? cols[2].toUpperCase() : 'MEDIO') as any;
          const stem = cols[3] || 'Enunciado não informado';
          const optA = cols[4] || 'Opção A';
          const optB = cols[5] || 'Opção B';
          const optC = cols[6] || 'Opção C';
          const optD = cols[7] || 'Opção D';
          const gabarito = cols[8]?.trim().toUpperCase() || 'A';
          const explanation = cols[9] || 'Resolução padrão.';
          const bncc = cols[10] || undefined;

          const options = [
            { id: `opt-${idx}-a`, text: optA, isCorrect: gabarito === 'A' || gabarito === '1' },
            { id: `opt-${idx}-b`, text: optB, isCorrect: gabarito === 'B' || gabarito === '2' },
          ];
          if (optC) options.push({ id: `opt-${idx}-c`, text: optC, isCorrect: gabarito === 'C' || gabarito === '3' });
          if (optD) options.push({ id: `opt-${idx}-d`, text: optD, isCorrect: gabarito === 'D' || gabarito === '4' });

          return {
            id: `q-imp-csv-${Date.now()}-${idx}`,
            code: `CSV-${String(idx + 1).padStart(2, '0')}`,
            subject,
            topic,
            gradeLevel: '3º Ano',
            bnccSkill: bncc,
            difficulty,
            type: 'MULTIPLE_CHOICE' as const,
            stem,
            options,
            explanation,
            authorTeacher: 'Importação CSV',
            tags: ['Importado CSV', subject],
            createdAt: new Date().toISOString().split('T')[0],
          };
        });
      }
    }

    // Case 3: Structured Exam Text (Vestibular / ENEM TXT format)
    // Example:
    // QUESTÃO 1 [Matemática - Geometria]
    // Enunciado aqui...
    // A) Alternativa A
    // B) Alternativa B
    // C) Alternativa C
    // D) Alternativa D
    // Gabarito: A
    // BNCC: EM13MAT301
    // Explicacao: Justificativa...
    setDetectedFormat('TXT_EXAM');
    const questionBlocks = trimmed.split(/(?:QUESTÃO|QUESTAO|ITEM|\n\d+[\.\)\-])/i).filter((b) => b.trim().length > 10);

    return questionBlocks.map((block, idx) => {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      let subject = 'Geral';
      let topic = 'Avaliação Geral';
      let bncc: string | undefined = undefined;
      let gabarito = 'A';
      let explanation = 'Resolução explicativa padrão.';
      let stemLines: string[] = [];
      const options: { id: string; text: string; isCorrect: boolean }[] = [];

      for (const line of lines) {
        if (/^\[(.*?)\]/.test(line)) {
          const match = line.match(/^\[(.*?)\]/);
          if (match && match[1]) {
            const parts = match[1].split('-').map((p) => p.trim());
            subject = parts[0] || subject;
            topic = parts[1] || topic;
          }
        } else if (/^(?:GABARITO|RESPOSTA|CORRETA)[\s\:\=]+([A-Ea-e])/i.test(line)) {
          const gMatch = line.match(/^(?:GABARITO|RESPOSTA|CORRETA)[\s\:\=]+([A-Ea-e])/i);
          if (gMatch) gabarito = gMatch[1].toUpperCase();
        } else if (/^(?:BNCC|HABILIDADE)[\s\:\=]+([A-Za-z0-9]+)/i.test(line)) {
          const bMatch = line.match(/^(?:BNCC|HABILIDADE)[\s\:\=]+([A-Za-z0-9]+)/i);
          if (bMatch) bncc = bMatch[1].toUpperCase();
        } else if (/^(?:EXPLICAÇÃO|EXPLICACAO|RESOLUÇÃO|JUSTIFICATIVA)[\s\:\=]+(.*)/i.test(line)) {
          const eMatch = line.match(/^(?:EXPLICAÇÃO|EXPLICACAO|RESOLUÇÃO|JUSTIFICATIVA)[\s\:\=]+(.*)/i);
          if (eMatch) explanation = eMatch[1];
        } else if (/^([A-Ea-e])[\)\.\-]\s+(.*)/.test(line)) {
          const optMatch = line.match(/^([A-Ea-e])[\)\.\-]\s+(.*)/);
          if (optMatch) {
            const letter = optMatch[1].toUpperCase();
            options.push({
              id: `opt-${idx}-${letter}`,
              text: optMatch[2],
              isCorrect: letter === gabarito,
            });
          }
        } else {
          stemLines.push(line);
        }
      }

      // Re-check options isCorrect against gabarito
      options.forEach((opt, oIdx) => {
        const letter = String.fromCharCode(65 + oIdx);
        opt.isCorrect = letter === gabarito;
      });

      if (options.length === 0) {
        options.push(
          { id: `opt-${idx}-a`, text: 'Alternativa A (Gabarito Padrão)', isCorrect: true },
          { id: `opt-${idx}-b`, text: 'Alternativa B', isCorrect: false },
          { id: `opt-${idx}-c`, text: 'Alternativa C', isCorrect: false },
          { id: `opt-${idx}-d`, text: 'Alternativa D', isCorrect: false }
        );
      }

      return {
        id: `q-imp-txt-${Date.now()}-${idx}`,
        code: `TXT-${String(idx + 1).padStart(2, '0')}`,
        subject,
        topic,
        gradeLevel: '3º Ano',
        bnccSkill: bncc,
        difficulty: 'MEDIO' as const,
        type: 'MULTIPLE_CHOICE' as const,
        stem: stemLines.join(' ') || 'Enunciado extraído do texto de prova.',
        options,
        explanation,
        authorTeacher: 'Importação Prova TXT',
        tags: ['Importado TXT', subject],
        createdAt: new Date().toISOString().split('T')[0],
      };
    });
  };

  const handleTestParseText = (txt: string) => {
    setInputText(txt);
    setError('');
    if (!txt.trim()) {
      setParsedPreviewQuestions([]);
      setDetectedFormat('UNKNOWN');
      return;
    }

    try {
      const parsed = parseRawText(txt);
      setParsedPreviewQuestions(parsed);
    } catch (e: any) {
      setError(`Erro ao interpretar texto: ${e.message}`);
      setParsedPreviewQuestions([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleTestParseText(content);
    };
    reader.onerror = () => {
      setError('Falha ao ler o arquivo selecionado.');
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = (questionsToImport: Question[]) => {
    if (questionsToImport.length === 0) {
      setError('Nenhuma questão válida pronta para importação.');
      return;
    }
    onImportQuestions(questionsToImport);
    setSuccessCount(questionsToImport.length);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleDownloadSample = (type: 'JSON' | 'CSV' | 'TXT') => {
    let content = '';
    let filename = '';
    let mime = 'text/plain';

    if (type === 'JSON') {
      const sample = [
        {
          code: 'MAT-SAMPLE-01',
          subject: 'Matemática',
          topic: 'Trigonometria no Triângulo Retângulo',
          bnccSkill: 'EM13MAT301',
          difficulty: 'MEDIO',
          type: 'MULTIPLE_CHOICE',
          stem: 'Em um triângulo retângulo, o cateto oposto ao ângulo alfa mede 6cm e a hipotenusa mede 10cm. Qual é o valor do seno de alfa?',
          options: [
            { id: 'opt-1', text: '0,60 (ou 3/5)', isCorrect: true, explanation: 'sen(α) = Cateto Oposto / Hipotenusa = 6/10 = 0,6.' },
            { id: 'opt-2', text: '0,80 (ou 4/5)', isCorrect: false, explanation: 'Distrator: Calculou o cosseno de alfa.' },
            { id: 'opt-3', text: '0,75 (ou 3/4)', isCorrect: false, explanation: 'Distrator: Calculou a tangente de alfa.' },
          ],
          explanation: 'Relações trigonométricas fundamentais no triângulo retângulo.',
          tags: ['Trigonometria', 'Seno', 'Geometria'],
        },
      ];
      content = JSON.stringify(sample, null, 2);
      filename = 'modelo_questoes_edugestao.json';
      mime = 'application/json';
    } else if (type === 'CSV') {
      content = `Disciplina;Assunto;Dificuldade;Enunciado;OpcaoA;OpcaoB;OpcaoC;OpcaoD;Gabarito;Justificativa;HabilidadeBNCC\nMatemática;Álgebra Linear;MEDIO;Qual é o determinante de uma matriz identidade 3x3?;1;0;3;9;A;O determinante de qualquer matriz identidade é igual a 1;EM13MAT301\nHistória;República Velha;MEDIO;A política dos governadores no Brasil República consistia em:;Acordo de apoio mútuo entre Executivo federal e oligarquias estaduais;Eleições diretas e sem fraudes para presidente;Industrialização do Nordeste;Abolição dos coronéis;A;Pacto de sustentação das elites estaduais agrárias;EM13CHS102`;
      filename = 'modelo_questoes_edugestao.csv';
      mime = 'text/csv;charset=utf-8;';
    } else {
      content = `QUESTÃO 1 [Física - Mecânica Clássica]
Um automóvel parte do repouso com aceleração constante de 2 m/s². Qual a sua velocidade após 5 segundos?
A) 10 m/s
B) 20 m/s
C) 5 m/s
D) 25 m/s
Gabarito: A
BNCC: EM13CNT101
Explicacao: Pela equação horária da velocidade: v = v0 + a*t = 0 + 2*5 = 10 m/s.

QUESTÃO 2 [Geografia - Climatologia]
O fenômeno climático de El Niño caracteriza-se pelo aquecimento anômalo das águas superficiais de qual oceano?
A) Oceano Pacífico Tropical
B) Oceano Atlântico Norte
C) Oceano Índico Sul
D) Oceano Glacial Ártico
Gabarito: A
BNCC: EM13CHS201
Explicacao: O El Niño é uma oscilação climática originada no Pacífico Equatorial.`;
      filename = 'modelo_prova_questoes.txt';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Importação & Integração de Banco de Questões
              </h3>
              <p className="text-xs text-slate-500">
                Importe pacotes curriculares BNCC, arquivos JSON/CSV ou cole provas estruturadas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 bg-white border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setImportTab('PRESETS')}
            className={`pb-3 font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              importTab === 'PRESETS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Pacotes Prontos BNCC / ENEM</span>
          </button>

          <button
            onClick={() => setImportTab('PASTE_TEXT')}
            className={`pb-3 font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              importTab === 'PASTE_TEXT'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Colar Texto de Prova / JSON / CSV</span>
          </button>

          <button
            onClick={() => setImportTab('FILE_UPLOAD')}
            className={`pb-3 font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              importTab === 'FILE_UPLOAD'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Carregar Arquivo (.json, .csv, .txt)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>{successCount} questões importadas com sucesso para o acervo central!</span>
            </div>
          )}

          {/* TAB 1: PRESET PACKS */}
          {importTab === 'PRESETS' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Selecione pacotes prontos categorizados por matriz curricular, habilidades BNCC e análise de distratores:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pack 1: BNCC Geral */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        BNCC Geral
                      </span>
                      <span className="text-xs font-bold text-slate-700">{PRESET_PACKS.BNCC_GERAL.length} Itens</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">Pacote BNCC Ensino Médio & Fundamental</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Matemática, Português, Biologia e História alinhadas com códigos oficiais de habilidades.
                    </p>
                  </div>
                  <button
                    onClick={() => handleConfirmImport(PRESET_PACKS.BNCC_GERAL)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Importar Pacote BNCC</span>
                  </button>
                </div>

                {/* Pack 2: Simulado ENEM */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                        Simulado ENEM
                      </span>
                      <span className="text-xs font-bold text-slate-700">{PRESET_PACKS.ENEM_SIMULADO.length} Itens</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">Simulado ENEM Nacional & Distratores</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Geografia e Química com justificativa pedagógica minuciosa de cada alternativa incorreta.
                    </p>
                  </div>
                  <button
                    onClick={() => handleConfirmImport(PRESET_PACKS.ENEM_SIMULADO)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Importar Simulado ENEM</span>
                  </button>
                </div>

                {/* Pack 3: Discursivas */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                        Discursivas Auto
                      </span>
                      <span className="text-xs font-bold text-slate-700">{PRESET_PACKS.DISCURSIVAS_AUTO.length} Itens</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">Questões Discursivas Ponderadas</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Redação e interpretação com critérios automatizados de palavras-chave e pesos proporcionais.
                    </p>
                  </div>
                  <button
                    onClick={() => handleConfirmImport(PRESET_PACKS.DISCURSIVAS_AUTO)}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Importar Discursivas</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PASTE TEXT (JSON / CSV / EXAM TXT) */}
          {importTab === 'PASTE_TEXT' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  Cole aqui o conteúdo em formato JSON, CSV ou Texto Estruturado de Prova:
                </label>

                {/* Sample Download Links */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400">Baixar Modelos:</span>
                  <button
                    onClick={() => handleDownloadSample('JSON')}
                    className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                  >
                    JSON
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={() => handleDownloadSample('CSV')}
                    className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                  >
                    CSV
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={() => handleDownloadSample('TXT')}
                    className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                  >
                    TXT Prova
                  </button>
                </div>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => handleTestParseText(e.target.value)}
                placeholder={`Exemplo Formato Prova:\nQUESTÃO 1 [Matemática - Geometria]\nQual a área de um círculo de raio 5?\nA) 25π\nB) 10π\nC) 50π\nGabarito: A\nBNCC: EM13MAT301\nExplicacao: A = π * r² = 25π.`}
                rows={9}
                className="w-full p-3.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
              />

              {detectedFormat !== 'UNKNOWN' && (
                <div className="flex items-center justify-between bg-indigo-50/70 p-3 rounded-xl border border-indigo-200 text-xs">
                  <span className="text-indigo-900 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                    Formato Detectado: <strong>{detectedFormat}</strong> ({parsedPreviewQuestions.length} questões identificadas)
                  </span>
                  {parsedPreviewQuestions.length > 0 && (
                    <button
                      onClick={() => handleConfirmImport(parsedPreviewQuestions)}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Confirmar Importação de {parsedPreviewQuestions.length} Itens</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FILE UPLOAD */}
          {importTab === 'FILE_UPLOAD' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 p-8 rounded-2xl text-center transition-all">
                <input
                  type="file"
                  id="question-file-input"
                  accept=".json,.csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="question-file-input"
                  className="flex flex-col items-center justify-center cursor-pointer space-y-2"
                >
                  <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Clique para selecionar ou arraste o arquivo aqui</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Suporta arquivos .JSON, .CSV (tabelas) e .TXT de simulados</p>
                  </div>
                </label>
              </div>

              {/* Sample format helper cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800">Modelo JSON</span>
                    <button onClick={() => handleDownloadSample('JSON')} className="text-indigo-600 hover:underline text-[11px] font-bold">
                      Baixar
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">Estrutura completa com stem, options, distratores e BNCC.</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800">Modelo CSV / Excel</span>
                    <button onClick={() => handleDownloadSample('CSV')} className="text-indigo-600 hover:underline text-[11px] font-bold">
                      Baixar
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">Planilha delimitada por ponto e vírgula com colunas de A a D e gabarito.</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800">Modelo TXT Prova</span>
                    <button onClick={() => handleDownloadSample('TXT')} className="text-indigo-600 hover:underline text-[11px] font-bold">
                      Baixar
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">Texto formatado estilo caderno de vestibulares e concursos.</p>
                </div>
              </div>
            </div>
          )}

          {/* LIVE PREVIEW OF DETECTED / PARSED QUESTIONS */}
          {parsedPreviewQuestions.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-indigo-600" />
                  Pré-visualização dos Itens Identificados ({parsedPreviewQuestions.length})
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Pronto para Validação
                </span>
              </h4>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {parsedPreviewQuestions.map((q, idx) => {
                  const correctOpt = q.options.find((o) => o.isCorrect);
                  const correctLetter = q.options.findIndex((o) => o.isCorrect);
                  const letterStr = correctLetter >= 0 ? String.fromCharCode(65 + correctLetter) : '-';

                  return (
                    <div
                      key={idx}
                      className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex flex-col justify-between gap-2 hover:border-slate-300"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded text-[10px]">
                            {q.code || `Q-${idx + 1}`}
                          </span>
                          <span className="font-bold text-slate-800">{q.subject}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 font-medium">{q.topic}</span>
                          {q.bnccSkill && (
                            <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded font-bold">
                              BNCC: {q.bnccSkill}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                            Gabarito: <strong>{letterStr}</strong>
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-800 font-medium line-clamp-2 mt-1">{q.stem}</p>

                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[11px] text-slate-600 mt-1">
                          {q.options.slice(0, 4).map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`truncate px-2 py-1 rounded ${
                                opt.isCorrect ? 'bg-emerald-100 text-emerald-900 font-bold' : 'bg-white border border-slate-200'
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}) {opt.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {parsedPreviewQuestions.length > 0 && (
            <button
              onClick={() => handleConfirmImport(parsedPreviewQuestions)}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Importar {parsedPreviewQuestions.length} Questões</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
