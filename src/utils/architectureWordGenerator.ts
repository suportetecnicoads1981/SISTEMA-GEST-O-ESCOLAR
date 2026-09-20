/**
 * SUCESSOEDU GESTÃO EDUCACIONAL - GERADOR DE DOCUMENTO OFICIAL PARA MICROSOFT WORD (.DOC)
 * Produz documento formatado com cabeçalhos Office XML (MHTML / WordSection1),
 * tabelas estilizadas, badges, fichas técnicas de todos os 18 módulos,
 * matriz de dependências, roadmap de melhorias futuras e checklist de correções preventivas.
 */

import { SYSTEM_MODULES_CATALOG, SystemModuleInfo } from './systemArchitectureDiagram';

export interface ModuleRoadmapItem {
  id: string;
  moduleId: string;
  title: string;
  priority: 'ALTA' | 'MEDIA' | 'ESTRATEGICA';
  impact: string;
  description: string;
  technicalEffort: 'BAIXO' | 'MEDIO' | 'ALTO';
}

export interface ModuleFixChecklistItem {
  id: string;
  moduleId: string;
  item: string;
  category: 'SEGURANÇA' | 'BANCO_DADOS' | 'USABILIDADE' | 'LDB_MEC' | 'DESEMPENHO';
  description: string;
}

// Mapeamento minucioso de Melhorias Futuras e Checklist de Correções para os 18 Módulos
export const MODULES_ROADMAP_AND_FIXES: Record<
  string,
  {
    futureImprovements: ModuleRoadmapItem[];
    fixesChecklist: ModuleFixChecklistItem[];
  }
> = {
  DASHBOARD_ANALYTICS: {
    futureImprovements: [
      {
        id: 'DASH_IMP_1',
        moduleId: 'DASHBOARD_ANALYTICS',
        title: 'Módulo Preditivo de Evasão Escolar com IA',
        priority: 'ALTA',
        impact: 'Identifica precocemente alunos em risco de evasão combinando faltas e notas.',
        description: 'Cruzamento automatizado da frequência diária com notas bimestrais gerando score de risco na tela inicial.',
        technicalEffort: 'MEDIO',
      },
      {
        id: 'DASH_IMP_2',
        moduleId: 'DASHBOARD_ANALYTICS',
        title: 'Painel Executivo para Impressão em PDF A4',
        priority: 'MEDIA',
        impact: 'Permite à diretoria imprimir um resumo gerencial semanal em 1 folha.',
        description: 'Layout vetorial limpo com gráficos de pizza e barras otimizados para tinta preta e colorida.',
        technicalEffort: 'BAIXO',
      },
      {
        id: 'DASH_IMP_3',
        moduleId: 'DASHBOARD_ANALYTICS',
        title: 'Widgets Customizáveis por Papel (Secretaria / Direção / Coordenação)',
        priority: 'ESTRATEGICA',
        impact: 'Permite que cada usuário selecione quais métricas quer ver primeiro.',
        description: 'Persistência no perfil local das preferências de visualização dos cards.',
        technicalEffort: 'MEDIO',
      },
    ],
    fixesChecklist: [
      {
        id: 'DASH_FIX_1',
        moduleId: 'DASHBOARD_ANALYTICS',
        item: 'Proteção contra divisão por zero em turmas sem alunos matriculados',
        category: 'BANCO_DADOS',
        description: 'Verificar se totalStudents === 0 antes de calcular taxa de frequência e média.',
      },
      {
        id: 'DASH_FIX_2',
        moduleId: 'DASHBOARD_ANALYTICS',
        item: 'Otimização com useMemo na agregação de notas e presenças',
        category: 'DESEMPENHO',
        description: 'Evitar recalcular métricas em cada render do cabeçalho ou popover de notificações.',
      },
    ],
  },
  SECRETARIA_MATRICULAS: {
    futureImprovements: [
      {
        id: 'SEC_IMP_1',
        moduleId: 'SECRETARIA_MATRICULAS',
        title: 'Portal de Pré-Matrícula e Rematrícula Online para Responsáveis',
        priority: 'ALTA',
        impact: 'Elimina filas na secretaria escolar no início do ano letivo.',
        description: 'Formulário público seguro com envio de comprovantes de residência e RG pelo celular.',
        technicalEffort: 'ALTO',
      },
      {
        id: 'SEC_IMP_2',
        moduleId: 'SECRETARIA_MATRICULAS',
        title: 'Gerador Automático de RA Sequencial com Dígito Verificador (MEC)',
        priority: 'MEDIA',
        impact: 'Evita digitação errada e duplicidade de Registro de Aluno.',
        description: 'Regra de geração baseada no ano de ingresso + código da unidade + número sequencial e DV.',
        technicalEffort: 'BAIXO',
      },
      {
        id: 'SEC_IMP_3',
        moduleId: 'SECRETARIA_MATRICULAS',
        title: 'Captura de Foto do Aluno via Webcam com Compressão WebP Automática',
        priority: 'MEDIA',
        impact: 'Agiliza confecção de carteirinhas estudantis sem sobrecarregar o banco de dados.',
        description: 'Módulo de recorte facial quadrado 1:1 e conversão direta para WebP com < 50KB.',
        technicalEffort: 'BAIXO',
      },
    ],
    fixesChecklist: [
      {
        id: 'SEC_FIX_1',
        moduleId: 'SECRETARIA_MATRICULAS',
        item: 'Sanitização rigorosa e validação de algoritmo de CPF e NIS',
        category: 'LDB_MEC',
        description: 'Validar os dois dígitos verificadores do CPF antes de salvar o cadastro.',
      },
      {
        id: 'SEC_FIX_2',
        moduleId: 'SECRETARIA_MATRICULAS',
        item: 'Preservação de histórico escolar completo em caso de transferência discente',
        category: 'BANCO_DADOS',
        description: 'Nunca excluir registros físicos de notas ou presenças ao marcar aluno como TRANSFERIDO.',
      },
    ],
  },
  TURMAS_ENTURMACAO: {
    futureImprovements: [
      {
        id: 'TUR_IMP_1',
        moduleId: 'TURMAS_ENTURMACAO',
        title: 'Otimizador de Enturmação com Balanceamento de Gênero e Idade',
        priority: 'MEDIA',
        impact: 'Distribui alunos de forma homogênea entre as turmas do mesmo ano.',
        description: 'Algoritmo que equilibra proporção de meninos/meninas e idade média por sala.',
        technicalEffort: 'MEDIO',
      },
      {
        id: 'TUR_IMP_2',
        moduleId: 'TURMAS_ENTURMACAO',
        title: 'Detector de Conflitos e Choques de Horários em Salas Físicas',
        priority: 'ALTA',
        impact: 'Impede alocação de duas turmas na mesma sala física no mesmo turno.',
        description: 'Validação cruzada entre RoomId, Shift e Horários de Aulas.',
        technicalEffort: 'MEDIO',
      },
    ],
    fixesChecklist: [
      {
        id: 'TUR_FIX_1',
        moduleId: 'TURMAS_ENTURMACAO',
        item: 'Trava visual de capacidade máxima física de alunos por sala',
        category: 'USABILIDADE',
        description: 'Emitir aviso e bloquear enturmação quando o limite de carteiras for atingido.',
      },
      {
        id: 'TUR_FIX_2',
        moduleId: 'TURMAS_ENTURMACAO',
        item: 'Integridade referencial ao transferir aluno entre turmas',
        category: 'BANCO_DADOS',
        description: 'Atualizar turma nas notas parciais sem gerar registros órfãos.',
      },
    ],
  },
  PROFESSORES_DOCENCIA: {
    futureImprovements: [
      {
        id: 'PROF_IMP_1',
        moduleId: 'PROFESSORES_DOCENCIA',
        title: 'Grade Horária Interativa Semanal por Tempos de Aula (Horário Escolar)',
        priority: 'ALTA',
        impact: 'Facilita visualização do horário do professor de segunda a sexta-feira.',
        description: 'Quadro interativo com cores por disciplina e alocação de tempos de 50 minutos.',
        technicalEffort: 'MEDIO',
      },
      {
        id: 'PROF_IMP_2',
        moduleId: 'PROFESSORES_DOCENCIA',
        title: 'Banco Coletivo de Planos de Aula Compartilhados por Disciplina',
        priority: 'MEDIA',
        impact: 'Permite que professores troquem planos pedagógicos aprovados pela coordenação.',
        description: 'Repositório interno de atividades e sequências didáticas.',
        technicalEffort: 'BAIXO',
      },
    ],
    fixesChecklist: [
      {
        id: 'PROF_FIX_1',
        moduleId: 'PROFESSORES_DOCENCIA',
        item: 'Isolamento estrito de permissão no Diário do Professor',
        category: 'SEGURANÇA',
        description: 'Garantir que o docente só consiga lançar notas e faltas nas turmas atribuídas a ele.',
      },
      {
        id: 'PROF_FIX_2',
        moduleId: 'PROFESSORES_DOCENCIA',
        item: 'Validação de choque de horário do professor em duas salas no mesmo tempo',
        category: 'LDB_MEC',
        description: 'Impedir atribuição simultânea de um professor em turmas diferentes no mesmo horário.',
      },
    ],
  },
  FREQUENCIA_CHAMADA: {
    futureImprovements: [
      {
        id: 'FREQ_IMP_1',
        moduleId: 'FREQUENCIA_CHAMADA',
        title: 'Chamada Rápida por QR Code da Carteirinha Estudantil',
        priority: 'MEDIA',
        impact: 'Reduz o tempo de chamada na entrada da sala ou biblioteca para menos de 1 segundo.',
        description: 'Leitura de QR Code pela câmera ou leitor USB registrando presença automaticamente.',
        technicalEffort: 'MEDIO',
      },
      {
        id: 'FREQ_IMP_2',
        moduleId: 'FREQUENCIA_CHAMADA',
        title: 'Geração Automática de Ficha FICAI (Conselho Tutelar)',
        priority: 'ALTA',
        impact: 'Cumpre exigência legal do ECA e LDB quando o aluno atinge 5 faltas consecutivas.',
        description: 'Emissão da Ficha de Comunicação de Aluno Infrequente preenchida em PDF timbrado.',
        technicalEffort: 'BAIXO',
      },
    ],
    fixesChecklist: [
      {
        id: 'FREQ_FIX_1',
        moduleId: 'FREQUENCIA_CHAMADA',
        item: 'Contabilização estrita de 75% da LDB sobre 200 dias letivos',
        category: 'LDB_MEC',
        description: 'Descontar feriados e recessos antes de calcular o percentual de infrequência.',
      },
      {
        id: 'FREQ_FIX_2',
        moduleId: 'FREQUENCIA_CHAMADA',
        item: 'Bloqueio de chamada em dias retroativos após fechamento do bimestre',
        category: 'SEGURANÇA',
        description: 'Exigir autorização da coordenação para alterar chamadas de bimestres homologados.',
      },
    ],
  },
  NOTAS_AVALIACOES: {
    futureImprovements: [
      {
        id: 'NOTAS_IMP_1',
        moduleId: 'NOTAS_AVALIACOES',
        title: 'Correção Óptica de Gabaritos via Cartão-Resposta (Leitor OMR por Câmera)',
        priority: 'ALTA',
        impact: 'Permite corrigir simulados de 100 alunos em poucos minutos.',
        description: 'Processamento de imagem para leitura de bolhas preenchidas a caneta preta/azul.',
        technicalEffort: 'ALTO',
      },
      {
        id: 'NOTAS_IMP_2',
        moduleId: 'NOTAS_AVALIACOES',
        title: 'Substituição Automática da Menor Nota pela Avaliação de Recuperação Paralela',
        priority: 'ALTA',
        impact: 'Automatiza o cálculo do conselho pedagógico garantindo direito legal do aluno.',
        description: 'Fórmula configurável: substitui N1/N2 se Nota_Recuperação > Nota_Original.',
        technicalEffort: 'BAIXO',
      },
    ],
    fixesChecklist: [
      {
        id: 'NOTAS_FIX_1',
        moduleId: 'NOTAS_AVALIACOES',
        item: 'Padronização de arredondamento de notas (duas casas decimais)',
        category: 'LDB_MEC',
        description: 'Evitar divergências entre boletim impresso e ata final geradas por ponto flutuante.',
      },
      {
        id: 'NOTAS_FIX_2',
        moduleId: 'NOTAS_AVALIACOES',
        item: 'Auditoria obrigatória com log imutável de qualquer alteração de nota',
        category: 'SEGURANÇA',
        description: 'Gravar quem alterou a nota, horário, valor anterior e justificativa.',
      },
    ],
  },
  FINANCEIRO_MENSALIDADES: {
    futureImprovements: [
      {
        id: 'FIN_IMP_1',
        moduleId: 'FINANCEIRO_MENSALIDADES',
        title: 'Conciliação Bancária Automatizada com Importação de Arquivo OFX / Retorno CNAB',
        priority: 'ALTA',
        impact: 'Dá baixa automática em centenas de boletos e transferências sem digitação manual.',
        description: 'Parser de extrato bancário OFX com identificação de pagador e valor.',
        technicalEffort: 'MEDIO',
      },
      {
        id: 'FIN_IMP_2',
        moduleId: 'FINANCEIRO_MENSALIDADES',
        title: 'Régua de Cobrança Amigável Automatizada via WhatsApp (D-3, D0, D+5)',
        priority: 'ALTA',
        impact: 'Reduz inadimplência em até 40% com lembrete de PIX copia-e-cola.',
        description: 'Disparador com link direto do código PIX e PDF do recibo para os pais.',
        technicalEffort: 'MEDIO',
      },
    ],
    fixesChecklist: [
      {
        id: 'FIN_FIX_1',
        moduleId: 'FINANCEIRO_MENSALIDADES',
        item: 'Aplicação de juros e multas conforme o Código de Defesa do Consumidor (CDC)',
        category: 'LDB_MEC',
        description: 'Multa máxima de 2% e juros de mora legais pro-rata die de 1% ao mês.',
      },
      {
        id: 'FIN_FIX_2',
        moduleId: 'FINANCEIRO_MENSALIDADES',
        item: 'Estorno de pagamento com conciliação no fluxo de caixa',
        category: 'BANCO_DADOS',
        description: 'Garantir que estornos gerem lançamentos contrários preservando integridade contábil.',
      },
    ],
  },
  CENSO_EDUCACENSO: {
    futureImprovements: [
      {
        id: 'CEN_IMP_1',
        moduleId: 'CENSO_EDUCACENSO',
        title: 'Importador Reverso do Arquivo Oficial do Educacenso (MEC/INEP)',
        priority: 'ALTA',
        impact: 'Preenche automaticamente cadastros de alunos veteranos com base no envio anterior ao MEC.',
        description: 'Leitura dos registros tipo 10, 20, 30, 40 e 50 do arquivo .txt do INEP.',
        technicalEffort: 'MEDIO',
      },
      {
        id: 'CEN_IMP_2',
        moduleId: 'CENSO_EDUCACENSO',
        title: 'Auditoria Visual Preventiva de Pendências do Censo Escolar',
        priority: 'ALTA',
        impact: 'Evita glosas e multas da Secretaria de Educação por dados ausentes.',
        description: 'Semáforo vermelho/amarelo/verde para CPFs faltantes, cor/raça e laudos de deficiência.',
        technicalEffort: 'BAIXO',
      },
    ],
    fixesChecklist: [
      {
        id: 'CEN_FIX_1',
        moduleId: 'CENSO_EDUCACENSO',
        item: 'Conferência de código INEP da escola de 8 dígitos',
        category: 'LDB_MEC',
        description: 'Validar que o código de escola atenda ao padrão de 8 dígitos do MEC.',
      },
      {
        id: 'CEN_FIX_2',
        moduleId: 'CENSO_EDUCACENSO',
        item: 'Validação de preenchimento obrigatório de transporte escolar e AEE',
        category: 'LDB_MEC',
        description: 'Garantir que alunos com laudo tenham campo de atendimento especializado marcado.',
      },
    ],
  },
  CALENDARIO_EVENTOS: {
    futureImprovements: [
      {
        id: 'CAL_IMP_1',
        moduleId: 'CALENDARIO_EVENTOS',
        title: 'Sincronização Bidirecional com Google Calendar e Calendário do Celular (iCal)',
        priority: 'MEDIA',
        impact: 'Permite que professores e gestores vejam reuniões e provas na agenda do smartphone.',
        description: 'Geração de feed .ics dinâmico com eventos acadêmicos e feriados escolares.',
        technicalEffort: 'MEDIO',
      },
      {
        id: 'CAL_IMP_2',
        moduleId: 'CALENDARIO_EVENTOS',
        title: 'Simulador de Compensação de Dias Letivos (Sábados Letivos)',
        priority: 'ALTA',
        impact: 'Garante planejamento exato de reposição de aulas após paralisações ou reformas.',
        description: 'Cálculo de equivalência de dia da semana compensado para cumprimento dos 200 dias.',
        technicalEffort: 'BAIXO',
      },
    ],
    fixesChecklist: [
      {
        id: 'CAL_FIX_1',
        moduleId: 'CALENDARIO_EVENTOS',
        item: 'Cumprimento estrito dos 200 dias letivos e 800 horas (Lei 9.394/96)',
        category: 'LDB_MEC',
        description: 'Alerta persistente se o calendário planejado tiver menos de 200 dias letivos reais.',
      },
      {
        id: 'CAL_FIX_2',
        moduleId: 'CALENDARIO_EVENTOS',
        item: 'Tratamento de feriados móveis nacionais (Carnaval, Páscoa, Corpus Christi)',
        category: 'BANCO_DADOS',
        description: 'Cálculo astronômico da Páscoa para evitar cálculo manual errado de feriados móveis.',
      },
    ],
  },
  PLANEJAMENTO_BNCC: {
    futureImprovements: [
      {
        id: 'BNCC_IMP_1',
        moduleId: 'PLANEJAMENTO_BNCC',
        title: 'Assistente de Elaboração de Aulas com IA (Gemini 3.8 Flash)',
        priority: 'ALTA',
        impact: 'Gera sugestões de atividades práticas e metodologias ativas alinhadas à habilidade BNCC.',
        description: 'Integração direta com o endpoint /api/ai/pedagogical-insights respeitando a BNCC.',
        technicalEffort: 'MEDIO',
      },
      {
        id: 'BNCC_IMP_2',
        moduleId: 'PLANEJAMENTO_BNCC',
        title: 'Simulador de Desempenho na Escala SAEB / Prova Brasil',
        priority: 'ESTRATEGICA',
        impact: 'Projeta o IDEB da escola antes da aplicação oficial da avaliação do MEC.',
        description: 'Conversão de percentual de acertos em notas padronizadas de 0 a 500 pontos do SAEB.',
        technicalEffort: 'ALTO',
      },
    ],
    fixesChecklist: [
      {
        id: 'BNCC_FIX_1',
        moduleId: 'PLANEJAMENTO_BNCC',
        item: 'Validação de código alfanumérico da BNCC com a série da turma',
        category: 'LDB_MEC',
        description: 'Impedir vínculo de habilidade do Ensino Médio (ex: EM13...) em turma do 6º ano.',
      },
      {
        id: 'BNCC_FIX_2',
        moduleId: 'PLANEJAMENTO_BNCC',
        item: 'Conferência de gabarito único em questões de múltipla escolha',
        category: 'BANCO_DADOS',
        description: 'Garantir que exatamente uma opção esteja marcada como isCorrect: true no banco de questões.',
      },
    ],
  },
  RELATORIOS_AUDITORIA: {
    futureImprovements: [
      {
        id: 'REL_IMP_1',
        moduleId: 'RELATORIOS_AUDITORIA',
        title: 'Construtor Visual de Relatórios Customizados (Custom Report Builder)',
        priority: 'ALTA',
        impact: 'Permite à secretaria criar qualquer listagem combinando colunas e filtros sem programar.',
        description: 'Interface de seleção de campos (Nome, CPF, Nota, Bairro) e exportação para Excel/PDF.',
        technicalEffort: 'MEDIO',
      },
      {
        id: 'REL_IMP_2',
        moduleId: 'RELATORIOS_AUDITORIA',
        title: 'Assinatura Digital com QR Code de Autenticidade em Históricos Escolares',
        priority: 'ALTA',
        impact: 'Elimina falsificação de certificados e declarações de conclusão de curso.',
        description: 'Hash criptográfico no rodapé com link público de verificação de autenticidade documental.',
        technicalEffort: 'MEDIO',
      },
    ],
    fixesChecklist: [
      {
        id: 'REL_FIX_1',
        moduleId: 'RELATORIOS_AUDITORIA',
        item: 'Paginação e quebra de página A4 sem cortes de linhas de tabela',
        category: 'USABILIDADE',
        description: 'Aplicar CSS @media print { page-break-inside: avoid; } em todas as tabelas oficiais.',
      },
      {
        id: 'REL_FIX_2',
        moduleId: 'RELATORIOS_AUDITORIA',
        item: 'Trilha de auditoria imutável com endereço IP e operador responsável',
        category: 'SEGURANÇA',
        description: 'Impedir edição ou exclusão direta da tabela de logs de auditoria por operadores normais.',
      },
    ],
  },
  MUNICIPAL_SYNC_NETWORK: {
    futureImprovements: [
      {
        id: 'MUN_IMP_1',
        moduleId: 'MUNICIPAL_SYNC_NETWORK',
        title: 'Resolução Visual Assistida de Conflitos em Sincronização de Polos',
        priority: 'ALTA',
        impact: 'Permite ao operador escolher qual dado manter quando houver divergência entre sede e polo.',
        description: 'Interface lado a lado mostrando valor da sede vs. valor do polo com botão "Manter Sede / Manter Polo".',
        technicalEffort: 'MEDIO',
      },
      {
        id: 'MUN_IMP_2',
        moduleId: 'MUNICIPAL_SYNC_NETWORK',
        title: 'Criptografia Militar AES-256 no Pacote de Transporte .edusync',
        priority: 'ALTA',
        impact: 'Protege dados pessoais dos alunos em trânsito físico em pendrives.',
        description: 'Chave simétrica baseada em senha mestra da escola impedindo abertura indevida.',
        technicalEffort: 'BAIXO',
      },
    ],
    fixesChecklist: [
      {
        id: 'MUN_FIX_1',
        moduleId: 'MUNICIPAL_SYNC_NETWORK',
        item: 'Validação de integridade SHA-256 antes da descompactação do arquivo .edusync',
        category: 'SEGURANÇA',
        description: 'Rejeitar pacotes com checksum corrompido para evitar inconsistências no banco central.',
      },
      {
        id: 'MUN_FIX_2',
        moduleId: 'MUNICIPAL_SYNC_NETWORK',
        item: 'Uso obrigatório de UUID universal para chaves primárias em polos desacoplados',
        category: 'BANCO_DADOS',
        description: 'Evitar colisões de auto-incremento de IDs ao fundir dados de múltiplas escolas.',
      },
    ],
  },
  COMMUNICATION_WHATSAPP: {
    futureImprovements: [
      {
        id: 'COM_IMP_1',
        moduleId: 'COMMUNICATION_WHATSAPP',
        title: 'Envio Direto de Boletins Escolares em PDF no WhatsApp dos Responsáveis',
        priority: 'ALTA',
        impact: 'Garante que os pais recebam as notas dos filhos sem depender de papel impresso.',
        description: 'Envio seguro de anexo PDF com link protegido pela data de nascimento do aluno.',
        technicalEffort: 'MEDIO',
      },
      {
        id: 'COM_IMP_2',
        moduleId: 'COMMUNICATION_WHATSAPP',
        title: 'Mural de Notificações Push PWA no Smartphone dos Pais e Alunos',
        priority: 'MEDIA',
        impact: 'Permite envio de avisos de reuniões e comunicados urgentes sem custo de SMS.',
        description: 'Registro de Service Worker e Web Push API com entrega garantida mesmo com app fechado.',
        technicalEffort: 'MEDIO',
      },
    ],
    fixesChecklist: [
      {
        id: 'COM_FIX_1',
        moduleId: 'COMMUNICATION_WHATSAPP',
        item: 'Controle rigoroso de taxa de disparo (Rate Limiting) para evitar banimento no WhatsApp',
        category: 'DESEMPENHO',
        description: 'Adicionar intervalo aleatório de 3 a 7 segundos entre mensagens disparadas em lote.',
      },
      {
        id: 'COM_FIX_2',
        moduleId: 'COMMUNICATION_WHATSAPP',
        item: 'Validação e higienização de números com nono dígito e DDI brasileiro (+55)',
        category: 'USABILIDADE',
        description: 'Remover caracteres especiais e normalizar DDD + 9 dígitos antes do envio.',
      },
    ],
  },
  ADMIN_TI_RBAC: {
    futureImprovements: [
      {
        id: 'ADM_IMP_1',
        moduleId: 'ADMIN_TI_RBAC',
        title: 'Autenticação em Duas Etapas (2FA via Aplicativo Google / Microsoft Authenticator)',
        priority: 'ALTA',
        impact: 'Eleva a segurança da administração municipal ao nível bancário.',
        description: 'Geração de segredo TOTP e QR Code para configuração no smartphone do administrador.',
        technicalEffort: 'MEDIO',
      },
      {
        id: 'ADM_IMP_2',
        moduleId: 'ADMIN_TI_RBAC',
        title: 'Painel de Sessões Ativas com Encerramento Remoto de Conexões Suspeitas',
        priority: 'MEDIA',
        impact: 'Permite derrubar acessos indevidos abertos em computadores de laboratório.',
        description: 'Lista de tokens com IP, navegador e botão para forçar logout imediato.',
        technicalEffort: 'BAIXO',
      },
    ],
    fixesChecklist: [
      {
        id: 'ADM_FIX_1',
        moduleId: 'ADMIN_TI_RBAC',
        item: 'Proteção contra auto-exclusão do único usuário Administrador Master',
        category: 'SEGURANÇA',
        description: 'Impedir que o sistema fique sem nenhum operador com privilégios de administração.',
      },
      {
        id: 'ADM_FIX_2',
        moduleId: 'ADMIN_TI_RBAC',
        item: 'Armazenamento de senhas exclusivamente com hash seguro (bcrypt / PBKDF2)',
        category: 'SEGURANÇA',
        description: 'Nunca armazenar senhas em texto puro em nenhum arquivo local ou banco de dados.',
      },
    ],
  },
  NEXUSCORE_PRODUCTION: {
    futureImprovements: [
      {
        id: 'NEX_IMP_1',
        moduleId: 'NEXUSCORE_PRODUCTION',
        title: 'Rollback Atômico com 1 Clique em Caso de Falha de Inicialização',
        priority: 'ALTA',
        impact: 'Recupera o sistema para a versão anterior em menos de 10 segundos se houver erro.',
        description: 'Mantém sempre o último build estável salvo em pasta de contingência.',
        technicalEffort: 'MEDIO',
      },
      {
        id: 'NEX_IMP_2',
        moduleId: 'NEXUSCORE_PRODUCTION',
        title: 'Health-Check Proativo com Alerta Visual e Sonoro na Barra de Status',
        priority: 'MEDIA',
        impact: 'Avisa o operador imediatamente se o banco de dados ou rede oscilarem.',
        description: 'Verificação periódica com semáforo verde/amarelo/vermelho no rodapé do sistema.',
        technicalEffort: 'BAIXO',
      },
    ],
    fixesChecklist: [
      {
        id: 'NEX_FIX_1',
        moduleId: 'NEXUSCORE_PRODUCTION',
        item: 'Bloqueio atômico de concorrência durante o processo de deploy',
        category: 'SEGURANÇA',
        description: 'Impedir que dois operadores disparem o pipeline de produção simultaneamente.',
      },
      {
        id: 'NEX_FIX_2',
        moduleId: 'NEXUSCORE_PRODUCTION',
        item: 'Validação de permissão de escrita (W_OK) em C:\\SucessoEdu antes de descompactar',
        category: 'BANCO_DADOS',
        description: 'Confirmar permissão de gravação para evitar arquivos corrompidos pela metade.',
      },
    ],
  },
  NEXUS_INSTALL_BUILD: {
    futureImprovements: [
      {
        id: 'NEXB_IMP_1',
        moduleId: 'NEXUS_INSTALL_BUILD',
        title: 'Gerador de Pacote de Instalação Silenciosa para Redes Municipais (Active Directory / GPO)',
        priority: 'ALTA',
        impact: 'Instala o SucessoEdu em 100 computadores da prefeitura de uma só vez sem intervenção.',
        description: 'Script MSI / .bat compatível com switches silenciosos (/qn /norestart).',
        technicalEffort: 'MEDIO',
      },
      {
        id: 'NEXB_IMP_2',
        moduleId: 'NEXUS_INSTALL_BUILD',
        title: 'Auto-Atualizador em Segundo Plano com Download Delta de Arquivos Modificados',
        priority: 'MEDIA',
        impact: 'Reduz o consumo de banda de internet baixando apenas os scripts ou HTMLs atualizados.',
        description: 'Comparação de hash SHA-256 e download exclusivo dos arquivos com diferença.',
        technicalEffort: 'MEDIO',
      },
    ],
    fixesChecklist: [
      {
        id: 'NEXB_FIX_1',
        moduleId: 'NEXUS_INSTALL_BUILD',
        item: 'Criação obrigatória de backup preventivo na Área de Trabalho antes de qualquer CleanSlate',
        category: 'SEGURANÇA',
        description: 'Garantir que a pasta de backup seja criada com sucesso antes de limpar C:\\SucessoEdu.',
      },
      {
        id: 'NEXB_FIX_2',
        moduleId: 'NEXUS_INSTALL_BUILD',
        item: 'Garantia de atalho único oficial (.lnk) sem duplicidade de arquivos .url',
        category: 'USABILIDADE',
        description: 'Deletar atalhos antigos e manter exclusivamente "SucessoEdu Gestão Educacional.lnk".',
      },
    ],
  },
  CONFIG_SERVIDORES_NUVEM: {
    futureImprovements: [
      {
        id: 'CFG_IMP_1',
        moduleId: 'CONFIG_SERVIDORES_NUVEM',
        title: 'Monitor de Consumo de RAM e Processos Ativos do Servidor em Tempo Real',
        priority: 'MEDIA',
        impact: 'Permite à equipe de TI antecipar sobrecargas e congelamento de computadores mais antigos.',
        description: 'Exibição de gráfico de uso de memória do Node.js / PowerShell na aba de configurações.',
        technicalEffort: 'BAIXO',
      },
      {
        id: 'CFG_IMP_2',
        moduleId: 'CONFIG_SERVIDORES_NUVEM',
        title: 'Retenção Inteligente de Backups com Rotação (Diário / Semanal / Mensal)',
        priority: 'ALTA',
        impact: 'Mantém histórico de 1 ano de backups no Google Drive sem lotar o espaço da conta.',
        description: 'Exclusão programada automática de backups diários após 30 dias preservando os mensais.',
        technicalEffort: 'MEDIO',
      },
    ],
    fixesChecklist: [
      {
        id: 'CFG_FIX_1',
        moduleId: 'CONFIG_SERVIDORES_NUVEM',
        item: 'Blindagem de escape de barras invertidas em scripts PowerShell e Batch',
        category: 'BANCO_DADOS',
        description: 'Garantir paths como C:\\SucessoEdu em vez de strings truncadas por escape de barra.',
      },
      {
        id: 'CFG_FIX_2',
        moduleId: 'CONFIG_SERVIDORES_NUVEM',
        item: 'Encerramento forçado de instâncias anteriores na porta 3000 antes de iniciar o servidor',
        category: 'DESEMPENHO',
        description: 'Executar netstat e kill no PID anterior para evitar erro EADDRINUSE na porta 3000.',
      },
    ],
  },
  DATASYNC_RELATIONAL_INTEGRITY: {
    futureImprovements: [
      {
        id: 'DAT_IMP_1',
        moduleId: 'DATASYNC_RELATIONAL_INTEGRITY',
        title: 'Visualizador de Topologia Relacional com Grafo Interativo de Tabelas e Chaves (FK)',
        priority: 'ALTA',
        impact: 'Permite aos analistas de banco de dados auditar visualmente as 13 tabelas conectadas.',
        description: 'Diagrama SVG interativo mostrando relações 1:N e N:N com status de integridade.',
        technicalEffort: 'MEDIO',
      },
      {
        id: 'DAT_IMP_2',
        moduleId: 'DATASYNC_RELATIONAL_INTEGRITY',
        title: 'Sincronização Bidirecional Contínua em Tempo Real com Supabase Realtime',
        priority: 'ESTRATEGICA',
        impact: 'Permite colaboração simultânea entre múltiplos computadores sem necessidade de recarregar.',
        description: 'Canal WebSocket refletindo alterações de notas e presenças instantaneamente nas telas.',
        technicalEffort: 'ALTO',
      },
    ],
    fixesChecklist: [
      {
        id: 'DAT_FIX_1',
        moduleId: 'DATASYNC_RELATIONAL_INTEGRITY',
        item: 'Auto-cura de registros órfãos antes de sincronizar com a nuvem',
        category: 'BANCO_DADOS',
        description: 'Reassociar notas e presenças de alunos reenturmados antes do envio ao Supabase.',
      },
      {
        id: 'DAT_FIX_2',
        moduleId: 'DATASYNC_RELATIONAL_INTEGRITY',
        item: 'Execução de migrações DDL e DML dentro de transações com rollback automático',
        category: 'SEGURANÇA',
        description: 'Nunca aplicar scripts parciais de banco que possam corromper o schema relacional.',
      },
    ],
  },
};

/**
 * Gera o documento completo para Microsoft Word (.doc) em formato HTML estruturado
 * com namespaces Office XML, folhas de estilo otimizadas para Word, tabelas,
 * fichas de cada módulo, roadmap de melhorias futuras e checklist de correções.
 */
export function generateArchitectureDiagramWordDoc(
  schoolName = 'SucessoEdu Gestão Educacional',
  version = 'v5.4.1-ENTERPRISE'
): string {
  const generationDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const generationTime = new Date().toLocaleTimeString('pt-BR');

  let doc = `<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Diagrama de Arquitetura dos Módulos - ${schoolName}</title>
<!--[if gte mso 9]>
<xml>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
 </w:WordDocument>
</xml>
<![endif]-->
<style>
@page WordSection1 {
  size: 21.0cm 29.7cm; /* A4 */
  margin: 2.0cm 2.0cm 2.0cm 2.0cm;
  mso-header-margin: 35.4pt;
  mso-footer-margin: 35.4pt;
  mso-paper-source: 0;
}
div.WordSection1 {
  page: WordSection1;
}
body {
  font-family: 'Segoe UI', Calibri, Arial, Helvetica, sans-serif;
  font-size: 10.5pt;
  line-height: 1.45;
  color: #1e293b;
  background-color: #ffffff;
}
.cover-page {
  text-align: center;
  padding-top: 40pt;
  padding-bottom: 50pt;
}
.cover-badge {
  display: inline-block;
  background-color: #1e3a8a;
  color: #ffffff;
  padding: 4pt 12pt;
  font-size: 10pt;
  font-weight: bold;
  border-radius: 4pt;
  margin-bottom: 16pt;
}
.cover-title {
  font-size: 24pt;
  font-weight: bold;
  color: #0f172a;
  margin-bottom: 8pt;
  line-height: 1.2;
}
.cover-subtitle {
  font-size: 14pt;
  color: #3b82f6;
  font-weight: 600;
  margin-bottom: 24pt;
}
.cover-meta {
  font-size: 10pt;
  color: #64748b;
  border-top: 1pt solid #cbd5e1;
  border-bottom: 1pt solid #cbd5e1;
  padding: 12pt 0;
  margin: 24pt auto;
  max-width: 480pt;
}
h1 {
  font-size: 18pt;
  color: #1e3a8a;
  border-bottom: 2pt solid #2563eb;
  padding-bottom: 4pt;
  margin-top: 24pt;
  margin-bottom: 12pt;
  page-break-after: avoid;
}
h2 {
  font-size: 13pt;
  color: #1d4ed8;
  border-bottom: 1pt solid #e2e8f0;
  padding-bottom: 3pt;
  margin-top: 16pt;
  margin-bottom: 8pt;
  page-break-after: avoid;
}
h3 {
  font-size: 11pt;
  color: #0f172a;
  margin-top: 10pt;
  margin-bottom: 4pt;
  page-break-after: avoid;
}
table {
  border-collapse: collapse;
  width: 100%;
  margin-top: 6pt;
  margin-bottom: 12pt;
}
th {
  background-color: #1e3a8a;
  color: #ffffff;
  font-weight: bold;
  text-align: left;
  padding: 6pt 8pt;
  border: 1pt solid #1e3a8a;
  font-size: 9.5pt;
}
td {
  padding: 5pt 7pt;
  border: 1pt solid #cbd5e1;
  font-size: 9.5pt;
  vertical-align: top;
}
tr:nth-child(even) td {
  background-color: #f8fafc;
}
.tag {
  display: inline-block;
  padding: 1.5pt 5pt;
  font-size: 8.5pt;
  font-weight: bold;
  border-radius: 3pt;
  background-color: #e2e8f0;
  color: #334155;
  margin-right: 3pt;
  margin-bottom: 2pt;
}
.tag-core {
  background-color: #dbeafe;
  color: #1e40af;
}
.tag-pedagogico {
  background-color: #f3e8ff;
  color: #6b21a8;
}
.tag-legal {
  background-color: #fef3c7;
  color: #92400e;
}
.tag-infra {
  background-color: #f1f5f9;
  color: #334155;
}
.tag-cloud {
  background-color: #dcfce7;
  color: #166534;
}
.module-box {
  border: 1.5pt solid #cbd5e1;
  background-color: #ffffff;
  padding: 10pt;
  margin-bottom: 16pt;
  page-break-inside: avoid;
}
.module-header {
  background-color: #f1f5f9;
  border-left: 4pt solid #2563eb;
  padding: 6pt 10pt;
  margin-bottom: 8pt;
}
.roadmap-box {
  background-color: #f0fdf4;
  border-left: 3pt solid #16a34a;
  padding: 6pt 8pt;
  margin-top: 6pt;
  margin-bottom: 6pt;
}
.fix-box {
  background-color: #fef2f2;
  border-left: 3pt solid #dc2626;
  padding: 6pt 8pt;
  margin-top: 6pt;
  margin-bottom: 6pt;
}
.user-notes-box {
  background-color: #fafaf9;
  border: 1pt dashed #a8a29e;
  padding: 8pt;
  margin-top: 8pt;
}
.page-break {
  page-break-before: always;
}
.checkbox {
  font-family: 'Segoe UI Symbol', Arial, sans-serif;
  font-size: 11pt;
  color: #64748b;
}
</style>
</head>
<body>
<div class="WordSection1">

<!-- ========================================================= -->
<!-- 1. CAPA OFICIAL E METADADOS DO DOCUMENTO                   -->
<!-- ========================================================= -->
<div class="cover-page">
  <div class="cover-badge">DOCUMENTO TÉCNICO OFICIAL DE ENGENHARIA & ARQUITETURA</div>
  <div class="cover-title">SUCESSOEDU GESTÃO EDUCACIONAL</div>
  <div class="cover-subtitle">DIAGRAMA CANÔNICO DE MÓDULOS, INTERDEPENDÊNCIAS & ROTEIRO DE MELHORIAS E CORREÇÕES</div>
  
  <div class="cover-meta">
    <table style="border: none; margin: 0 auto; width: 100%;">
      <tr style="background: none;">
        <td style="border: none; width: 50%;">
          <strong>Instituição:</strong> ${schoolName}<br>
          <strong>Versão da Arquitetura:</strong> ${version}<br>
          <strong>Status Homologado:</strong> Produção Definitiva
        </td>
        <td style="border: none; width: 50%;">
          <strong>Data de Emissão:</strong> ${generationDate}<br>
          <strong>Hora de Geração:</strong> ${generationTime}<br>
          <strong>Diretório Raiz Oficial:</strong> <code>C:\\SucessoEdu</code>
        </td>
      </tr>
    </table>
  </div>

  <p style="font-size: 10pt; color: #475569; max-width: 450pt; margin: 16pt auto; text-align: justify;">
    Este documento foi estruturado especificamente para abertura, análise e edição direta no <strong>Microsoft Word</strong>. Ele contém a especificação formal de todos os <strong>${SYSTEM_MODULES_CATALOG.length} módulos</strong> do sistema, suas interdependências de banco de dados, arquivos-fonte, rotas de API, histórico de melhorias já consolidadas, além do <strong>Roteiro Estratégico de Melhorias Futuras</strong> e do <strong>Checklist Preventivo de Correções</strong>.
  </p>
</div>

<div class="page-break"></div>

<!-- ========================================================= -->
<!-- 2. SUMÁRIO EXECUTIVO & VISÃO DAS 5 CAMADAS DO ECOSSISTEMA -->
<!-- ========================================================= -->
<h1>1. Visão Geral da Arquitetura em 5 Camadas (Tiers)</h1>
<p>
  O <strong>SucessoEdu</strong> opera sobre uma arquitetura desacoplada e multicamadas, garantindo execução simultânea em múltiplos ambientes de missão crítica:
</p>
<ul>
  <li><strong>Modo Standalone Local (Offline 100% sem internet):</strong> Micro-servidor HTTP nativo em PowerShell (<code>server_micro.ps1</code>) ou Node.js, executando em <code>C:\\SucessoEdu</code> na porta <code>3000</code>.</li>
  <li><strong>Estação de Trabalho / Secretaria / Laboratório:</strong> Localização automática do IP do Servidor via protocolo de broadcast UDP (porta 38900) e sincronização LAN.</li>
  <li><strong>Polos Rurais & Escolas Satélites:</strong> Pacotes atômicos de transporte criptografado (<code>.edusync</code>) via pendrive com conferência de integridade SHA-256.</li>
  <li><strong>Nuvem Central / SEDUC:</strong> Sincronização híbrida com cluster PostgreSQL / PostgREST (Supabase) e backup no Google Drive oficial (<code>suportetecnicoads@gmail.com</code>).</li>
</ul>

<h2>Tabela Resumo das 5 Camadas Operacionais</h2>
<table>
  <thead>
    <tr>
      <th style="width: 12%;">Camada (Tier)</th>
      <th style="width: 25%;">Nome da Camada</th>
      <th style="width: 35%;">Módulos Componentes</th>
      <th style="width: 28%;">Responsabilidade Central</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Tier 1</strong></td>
      <td>Apresentação & Portais</td>
      <td>Dashboard & Indicadores (01), Portal do Professor (04)</td>
      <td>Interfaces executivas, alertas sonoros e diário online.</td>
    </tr>
    <tr>
      <td><strong>Tier 2</strong></td>
      <td>Gestão Acadêmica & Sala de Aula</td>
      <td>Secretaria & Matrículas (02), Turmas & Enturmação (03), Frequência Diária (05), Notas & Avaliações (06)</td>
      <td>Ciclo de vida do estudante, faltas, notas bimestrais e provas.</td>
    </tr>
    <tr>
      <td><strong>Tier 3</strong></td>
      <td>Regulação Legal, BNCC & Censo</td>
      <td>Censo Escolar / INEP (08), Calendário 200 Dias (09), Planejamento BNCC (10), Documentos Oficiais (11)</td>
      <td>Conformidade com a LDB 9.394/96, Educacenso e histórico escolar.</td>
    </tr>
    <tr>
      <td><strong>Tier 4</strong></td>
      <td>Finanças, Rede Municipal & Notificações</td>
      <td>Financeiro & PIX (07), Polos Remotos (12), Mural & WhatsApp (13)</td>
      <td>Carnês escolares, sincronização rural e avisos aos responsáveis.</td>
    </tr>
    <tr>
      <td><strong>Tier 5</strong></td>
      <td>Infraestrutura, DevOps & Banco</td>
      <td>Admin TI RBAC (14), NexusCore ERP (15), NexusInstall .EXE (16), Servidor C:\\SucessoEdu (17), DataSync Integridade FK (18)</td>
      <td>Segurança, atalho único desktop, auto-reparo e schemas relacionais.</td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>

<!-- ========================================================= -->
<!-- 3. MATRIZ CANÔNICA DE TODOS OS 18 MÓDULOS                 -->
<!-- ========================================================= -->
<h1>2. Matriz Geral dos ${SYSTEM_MODULES_CATALOG.length} Módulos do Sistema</h1>
<p>
  Tabela de referência rápida para localização de componentes no código-fonte e mapeamento de dependências:
</p>

<table>
  <thead>
    <tr>
      <th style="width: 6%;">Nº</th>
      <th style="width: 26%;">Nome do Módulo & Identificador</th>
      <th style="width: 14%;">Categoria</th>
      <th style="width: 12%;">Aba (Tab ID)</th>
      <th style="width: 22%;">Depende de (Origens)</th>
      <th style="width: 20%;">Alimenta (Destinos)</th>
    </tr>
  </thead>
  <tbody>
`;

  SYSTEM_MODULES_CATALOG.forEach((m) => {
    let catClass = 'tag-core';
    if (m.category === 'ENSINO_PEDAGÓGICO') catClass = 'tag-pedagogico';
    else if (m.category === 'CONTROLE_LEGAL') catClass = 'tag-legal';
    else if (m.category === 'INFRAESTRUTURA') catClass = 'tag-infra';
    else if (m.category === 'DEVOPS_NUVEM') catClass = 'tag-cloud';

    doc += `
    <tr>
      <td style="text-align: center; font-weight: bold;">${m.number}</td>
      <td>
        <strong>${m.name}</strong><br>
        <code style="font-size: 8.5pt; color: #475569;">${m.id}</code>
      </td>
      <td><span class="tag ${catClass}">${m.category.replace('_', ' ')}</span></td>
      <td><code style="font-size: 8.5pt;">${m.tabId}</code></td>
      <td style="font-size: 8.5pt;">${m.dependencies.length > 0 ? m.dependencies.join(', ') : '<em>Independente</em>'}</td>
      <td style="font-size: 8.5pt;">${m.dependents.length > 0 ? m.dependents.join(', ') : '<em>Ponta</em>'}</td>
    </tr>
`;
  });

  doc += `
  </tbody>
</table>

<div class="page-break"></div>

<!-- ========================================================= -->
<!-- 4. FICHA TÉCNICA DETALHADA DE CADA UM DOS 18 MÓDULOS      -->
<!-- ========================================================= -->
<h1>3. Fichas Técnicas dos Módulos & Análise de Melhorias e Correções</h1>
<p>
  Abaixo encontra-se o detalhamento cirúrgico de cada módulo, contendo seus arquivos-fonte, funções críticas, histórico recente, propostas de melhorias futuras e o checklist de verificação de correções preventivas.
</p>
`;

  SYSTEM_MODULES_CATALOG.forEach((m, idx) => {
    const roadmap = MODULES_ROADMAP_AND_FIXES[m.id]?.futureImprovements || [];
    const fixes = MODULES_ROADMAP_AND_FIXES[m.id]?.fixesChecklist || [];

    if (idx > 0 && idx % 2 === 0) {
      doc += `<div class="page-break"></div>\n`;
    }

    doc += `
<div class="module-box">
  <div class="module-header">
    <table style="border: none; margin: 0; width: 100%;">
      <tr style="background: none;">
        <td style="border: none; width: 75%;">
          <span style="font-size: 13pt; font-weight: bold; color: #1e3a8a;">[Módulo ${m.number}] ${m.name}</span><br>
          <span style="font-size: 9.5pt; color: #475569;">${m.tagline}</span>
        </td>
        <td style="border: none; width: 25%; text-align: right;">
          <span class="tag tag-core">${m.tierName}</span><br>
          <span style="font-size: 8pt; color: #059669; font-weight: bold;">● HOMOLOGADO EM PRODUÇÃO</span>
        </td>
      </tr>
    </table>
  </div>

  <table style="margin-top: 4pt; margin-bottom: 6pt;">
    <tr>
      <td style="width: 25%; background-color: #f8fafc;"><strong>Identificador Interno:</strong></td>
      <td style="width: 25%;"><code>${m.id}</code></td>
      <td style="width: 25%; background-color: #f8fafc;"><strong>Aba de Acesso (Tab ID):</strong></td>
      <td style="width: 25%;"><code>${m.tabId}</code></td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc;"><strong>Categoria:</strong></td>
      <td>${m.category}</td>
      <td style="background-color: #f8fafc;"><strong>Entidades do Banco:</strong></td>
      <td>${m.databaseEntities.map((e) => `<code>${e}</code>`).join(', ')}</td>
    </tr>
  </table>

  <h3>📁 Arquivos-Fonte e Componentes Principais:</h3>
  <ul style="margin-top: 2pt; margin-bottom: 6pt;">
    ${m.sourceFiles.map((f) => `<li><code>${f}</code></li>`).join('')}
  </ul>

  <h3>⚙️ Funções de Negócio & Endpoints de API:</h3>
  <ul style="margin-top: 2pt; margin-bottom: 6pt;">
    ${m.keyFunctions.map((fn) => `<li><strong>${fn}</strong></li>`).join('')}
    ${m.apiEndpoints.map((ep) => `<li><code>${ep}</code></li>`).join('')}
  </ul>

  <h3>✨ Melhorias Recentes Já Consolidadas no Módulo:</h3>
  <ul style="margin-top: 2pt; margin-bottom: 6pt;">
    ${m.recentImprovements.map((imp) => `<li>${imp}</li>`).join('')}
  </ul>

  <!-- BLOCO DE ANÁLISE DE MELHORIAS FUTURAS -->
  <div class="roadmap-box">
    <strong style="color: #166534; font-size: 10pt;">🚀 ANÁLISE DE MELHORIAS FUTURAS PROPOSTAS (ROADMAP):</strong>
    <table style="margin-top: 4pt; margin-bottom: 4pt; background-color: #ffffff;">
      <thead>
        <tr>
          <th style="width: 25%; background-color: #166534;">Melhoria Proposta</th>
          <th style="width: 15%; background-color: #166534;">Prioridade</th>
          <th style="width: 45%; background-color: #166534;">Impacto & Detalhes Técnicos</th>
          <th style="width: 15%; background-color: #166534;">Esforço</th>
        </tr>
      </thead>
      <tbody>
        ${
          roadmap.length > 0
            ? roadmap
                .map(
                  (r) => `
          <tr>
            <td><strong>${r.title}</strong></td>
            <td style="text-align: center;"><span class="tag" style="background-color: #dcfce7; color: #166534;">${r.priority}</span></td>
            <td>${r.impact}<br><span style="font-size: 8.5pt; color: #475569;">${r.description}</span></td>
            <td style="text-align: center;">${r.technicalEffort}</td>
          </tr>`
                )
                .join('')
            : '<tr><td colspan="4">Módulo consolidado em estado ótimo. Novos refinamentos sob demanda.</td></tr>'
        }
      </tbody>
    </table>
  </div>

  <!-- BLOCO DE CHECKLIST DE CORREÇÕES PREVENTIVAS -->
  <div class="fix-box">
    <strong style="color: #991b1b; font-size: 10pt;">🔍 CHECKLIST DE PONTOS CRÍTICOS & CORREÇÕES PREVENTIVAS:</strong>
    <table style="margin-top: 4pt; margin-bottom: 4pt; background-color: #ffffff;">
      <thead>
        <tr>
          <th style="width: 8%; background-color: #991b1b; text-align: center;">Status</th>
          <th style="width: 22%; background-color: #991b1b;">Ponto de Atenção</th>
          <th style="width: 15%; background-color: #991b1b;">Categoria</th>
          <th style="width: 55%; background-color: #991b1b;">Procedimento de Teste / Correção</th>
        </tr>
      </thead>
      <tbody>
        ${
          fixes.length > 0
            ? fixes
                .map(
                  (f) => `
          <tr>
            <td style="text-align: center; font-size: 12pt;"><span class="checkbox">☐</span></td>
            <td><strong>${f.item}</strong></td>
            <td><span class="tag" style="background-color: #fee2e2; color: #991b1b;">${f.category}</span></td>
            <td>${f.description}</td>
          </tr>`
                )
                .join('')
            : '<tr><td colspan="4">Sem registros de falhas abertas. Auditoria 100% íntegra.</td></tr>'
        }
      </tbody>
    </table>
  </div>

  <!-- ESPAÇO PARA ANOTAÇÕES DO USUÁRIO NO WORD -->
  <div class="user-notes-box">
    <strong style="color: #44403c; font-size: 9pt;">✍️ ESPAÇO PARA SUAS ANOTAÇÕES E PRIORIZAÇÕES NO WORD (EDITÁVEL):</strong>
    <p style="font-size: 8.5pt; color: #78716c; margin-top: 2pt; margin-bottom: 4pt;">
      Utilize o espaço abaixo no Microsoft Word para digitar ideias adicionais, responsáveis da equipe e observações:
    </p>
    <table style="margin: 0; background-color: #ffffff;">
      <thead>
        <tr>
          <th style="background-color: #78716c; width: 40%;">Anotação / Melhoria Customizada</th>
          <th style="background-color: #78716c; width: 25%;">Responsável</th>
          <th style="background-color: #78716c; width: 20%;">Previsão / Bimestre</th>
          <th style="background-color: #78716c; width: 15%;">Aprovado?</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="height: 22pt;">&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td style="text-align: center;"><span class="checkbox">☐</span> Sim <span class="checkbox">☐</span> Não</td>
        </tr>
        <tr>
          <td style="height: 22pt;">&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td style="text-align: center;"><span class="checkbox">☐</span> Sim <span class="checkbox">☐</span> Não</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
`;
  });

  doc += `
<div class="page-break"></div>

<!-- ========================================================= -->
<!-- 5. CHECKLIST GLOBAL DE ENGENHARIA & HOMOLOGAÇÃO PREVENTIVA -->
<!-- ========================================================= -->
<h1>4. Checklist Geral de Engenharia e Homologação de Novas Versões</h1>
<p>
  Antes de liberar qualquer atualização para os computadores da escola ou gerar novo instalador executável, verifique os 10 mandamentos de estabilidade do ecossistema:
</p>

<table>
  <thead>
    <tr>
      <th style="width: 8%; text-align: center;">Item</th>
      <th style="width: 32%;">Critério de Homologação</th>
      <th style="width: 45%;">Procedimento Obrigatório</th>
      <th style="width: 15%; text-align: center;">Validação</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align: center; font-weight: bold;">01</td>
      <td><strong>Atalho Único na Área de Trabalho</strong></td>
      <td>Garantir criação exclusivamente de <code>SucessoEdu Gestão Educacional.lnk</code> apontando para <code>C:\\SucessoEdu\\SucessoEdu_App.vbs</code>.</td>
      <td style="text-align: center;"><span class="checkbox">☐ Aprovado</span></td>
    </tr>
    <tr>
      <td style="text-align: center; font-weight: bold;">02</td>
      <td><strong>Backup Preventivo Automático</strong></td>
      <td>Verificar se toda atualização ou script de higienização cria cópia de segurança antes de sobrescrever arquivos.</td>
      <td style="text-align: center;"><span class="checkbox">☐ Aprovado</span></td>
    </tr>
    <tr>
      <td style="text-align: center; font-weight: bold;">03</td>
      <td><strong>Escapes de Barra Windows (C:\\SucessoEdu)</strong></td>
      <td>Conferir nos scripts <code>.bat</code>, <code>.ps1</code> e <code>.vbs</code> que os caminhos não perdem barras invertidas.</td>
      <td style="text-align: center;"><span class="checkbox">☐ Aprovado</span></td>
    </tr>
    <tr>
      <td style="text-align: center; font-weight: bold;">04</td>
      <td><strong>Execução na Porta 3000</strong></td>
      <td>Validar que o micro-servidor local e containers rodem estritamente na porta <code>3000</code> com escuta em <code>0.0.0.0</code>.</td>
      <td style="text-align: center;"><span class="checkbox">☐ Aprovado</span></td>
    </tr>
    <tr>
      <td style="text-align: center; font-weight: bold;">05</td>
      <td><strong>Regra dos 200 Dias Letivos (LDB)</strong></td>
      <td>Garantir que a apuração de frequência e notas não permita conclusão do ano com menos de 200 dias de trabalho escolar.</td>
      <td style="text-align: center;"><span class="checkbox">☐ Aprovado</span></td>
    </tr>
    <tr>
      <td style="text-align: center; font-weight: bold;">06</td>
      <td><strong>Integridade Referencial (FK) 100%</strong></td>
      <td>Rodar o <code>RelationalIntegrityService.audit()</code> certificando que não haja notas órfãs ou alunos sem turma.</td>
      <td style="text-align: center;"><span class="checkbox">☐ Aprovado</span></td>
    </tr>
    <tr>
      <td style="text-align: center; font-weight: bold;">07</td>
      <td><strong>Auditoria de Integridade Criptográfica SHA-256</strong></td>
      <td>Executar verificação dos 17 arquivos críticos em <code>C:\\SucessoEdu</code> via AppIntegrityChecker.</td>
      <td style="text-align: center;"><span class="checkbox">☐ Aprovado</span></td>
    </tr>
    <tr>
      <td style="text-align: center; font-weight: bold;">08</td>
      <td><strong>Sincronização Google Drive Oficial</strong></td>
      <td>Validar envio de backups agendados para a pasta oficial em <code>suportetecnicoads@gmail.com</code>.</td>
      <td style="text-align: center;"><span class="checkbox">☐ Aprovado</span></td>
    </tr>
    <tr>
      <td style="text-align: center; font-weight: bold;">09</td>
      <td><strong>Preservação de Dados no Standalone Offline</strong></td>
      <td>Confirmar que o SPA gerado em <code>index.html</code> mantenha os dados persistidos no <code>localStorage</code> sem perdas.</td>
      <td style="text-align: center;"><span class="checkbox">☐ Aprovado</span></td>
    </tr>
    <tr>
      <td style="text-align: center; font-weight: bold;">10</td>
      <td><strong>Variáveis de Ambiente & Secrets Protegidos</strong></td>
      <td>Assegurar que <code>GEMINI_API_KEY</code> permaneça restrita ao backend, sem exposição na renderização do navegador.</td>
      <td style="text-align: center;"><span class="checkbox">☐ Aprovado</span></td>
    </tr>
  </tbody>
</table>

<div style="margin-top: 30pt; padding-top: 15pt; border-top: 1pt solid #cbd5e1; text-align: center; font-size: 9pt; color: #64748b;">
  SucessoEdu Gestão Educacional • Arquitetura Oficial Homologada • Documento gerado automaticamente pelo Sistema em ${generationDate} às ${generationTime}
</div>

</div>
</body>
</html>`;

  return doc;
}

/**
 * Utilitário para download direto do arquivo .doc para o computador
 */
export function downloadArchitectureDiagramWord(
  schoolName = 'SucessoEdu Gestão Educacional',
  version = 'v5.4.1-ENTERPRISE'
) {
  const content = generateArchitectureDiagramWordDoc(schoolName, version);
  const filename = `Diagrama_Arquitetura_Modulos_SucessoEdu_${new Date().toISOString().slice(0, 10)}.doc`;
  const blob = new Blob(['\ufeff' + content], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copia o conteúdo formatado em HTML diretamente para a Área de Transferência.
 * Quando o usuário colar no Microsoft Word (Ctrl + V), o Word importará todas
 * as tabelas, cores, estilos e badges automaticamente!
 */
export async function copyArchitectureDiagramFormattedForWord(
  schoolName = 'SucessoEdu Gestão Educacional',
  version = 'v5.4.1-ENTERPRISE'
): Promise<boolean> {
  const html = generateArchitectureDiagramWordDoc(schoolName, version);
  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
      const textBlob = new Blob([html.replace(/<[^>]+>/g, ' ')], { type: 'text/plain' });
      const htmlBlob = new Blob([html], { type: 'text/html' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        }),
      ]);
      return true;
    } else {
      // Fallback para textarea
      const el = document.createElement('textarea');
      el.value = html;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      return true;
    }
  } catch (err) {
    console.warn('[Word Copy] Fallback de cópia:', err);
    return false;
  }
}
