/**
 * Tira-dúvidas: perguntas e respostas de cada módulo (aba do menu).
 * Para acrescentar uma dúvida, inclua um item em "faq" do módulo. Cada resposta pode ter
 * passos (lista numerada) e uma dica final.
 */

export interface HelpItem {
  q: string;
  steps?: string[];
  a?: string;
  tip?: string;
}

export interface HelpModule {
  id: string;
  title: string;
  where: string; // onde fica no menu
  summary: string;
  faq: HelpItem[];
}

/** Abas com nomes diferentes que usam a mesma ajuda. */
export const HELP_ALIASES: Record<string, string> = {
  QUESTIONS: 'QUESTION_BANK',
  PROFESSOR: 'TEACHER_PORTAL',
  PROFESSOR_DASHBOARD: 'TEACHER_PORTAL',
  STUDENT_ROOM: 'EXAMS',
};

const TECNICO =
  'Módulo técnico, usado pela equipe de TI. No dia a dia da escola não é preciso mexer aqui. Em caso de dúvida, fale com o suporte antes de alterar qualquer coisa.';

export const HELP_GENERAL: HelpModule = {
  id: 'GERAL',
  title: 'Dúvidas gerais',
  where: 'Vale para todo o sistema',
  summary: 'Entrar, sair, sincronizar com a nuvem, atalhos e o que fazer quando algo parece errado.',
  faq: [
    {
      q: 'Como abro o Tira-dúvidas?',
      a: 'Clique no botão "Tira-dúvidas" no alto da tela ou aperte F1. Ele abre nas perguntas do módulo em que você está. Use a busca para procurar em todos os módulos.',
    },
    {
      q: 'Como saio do sistema com segurança?',
      steps: ['Clique em "Sair do Sistema" no fim do menu lateral.', 'Na tela de login, o botão "Fechar" encerra a janela.'],
      tip: 'Se o navegador não deixar fechar sozinho, aparece a tela "Sessão encerrada": feche a janela no X ou com Alt+F4 (aba do navegador: Ctrl+W).',
    },
    {
      q: 'Os dados vão para a nuvem sozinhos?',
      a: 'Sim, quando há internet e uma conta da nuvem conectada. No selo do rodapé (canto de baixo à esquerda) você vê a situação e pode clicar em "Sincronizar agora". Sem internet, o trabalho continua normalmente e é enviado depois.',
    },
    {
      q: 'Fiz uma alteração e não apareceu em outro computador. O que faço?',
      steps: [
        'No computador onde alterou, clique no selo do rodapé e em "Sincronizar agora".',
        'No outro computador, aperte Ctrl+F5 ou clique em "Sincronizar agora".',
        'Se continuar diferente, anote o que alterou e avise o suporte.',
      ],
    },
    {
      q: 'Apareceu uma versão nova. Como atualizo?',
      steps: ['Pelo navegador: aperte Ctrl+F5.', 'No servidor instalado: Instaladores & Backup (Alt+I) > "Verificar atualização agora" > "Aplicar atualização" > F5.'],
    },
    {
      q: 'Quais atalhos de teclado existem?',
      a: 'Os atalhos aparecem ao lado de cada item do menu (ex.: Alt+S Secretaria, Alt+P Provas, Alt+I Instaladores). A lista completa fica em "Atalhos de Teclado" (Alt+K), no fim do menu.',
    },
    {
      q: 'Excluí algo por engano. Consigo recuperar?',
      a: 'Provas, correções e questões excluídas não voltam sozinhas. O servidor guarda cópias automáticas do banco em C:\\SucessoEdu\\data\\historico. Fale com o suporte para recuperar a partir de uma cópia.',
    },
  ],
};

export const HELP_MODULES: HelpModule[] = [
  {
    id: 'MAIN_DASHBOARD',
    title: 'Visão Geral / Dashbox',
    where: 'Menu > Visão Geral & Notificações',
    summary: 'Tela inicial com os números principais da escola e os atalhos para cada módulo.',
    faq: [
      { q: 'Para que serve esta tela?', a: 'Mostra um resumo (alunos, turmas, avaliações, avisos) e botões de acesso rápido aos módulos. Clique em um cartão para abrir o módulo correspondente.' },
      { q: 'Os números estão desatualizados.', steps: ['Clique em "Sincronizar agora" no selo do rodapé.', 'Aperte F5 para recarregar a tela.'] },
    ],
  },
  {
    id: 'NOTIFICATIONS',
    title: 'Central de Notificações',
    where: 'Menu > Visão Geral & Notificações (Alt+N)',
    summary: 'Avisos do sistema: resultados de provas, atualizações e comunicados.',
    faq: [
      { q: 'Como marco os avisos como lidos?', a: 'Clique no aviso para marcá-lo, ou use "Marcar todas como lidas" no sino do alto da tela.' },
    ],
  },
  {
    id: 'TEACHER_PORTAL',
    title: 'Portal do Professor',
    where: 'Menu > Espaço do Docente & Gestão de Turmas',
    summary: 'Área do professor: turmas, diário, chamada, notas, provas e prontuário dos alunos.',
    faq: [
      {
        q: 'Por onde começo?',
        steps: ['Abra "Minhas Turmas" e escolha a turma.', 'Use as abas: Diário de Classe & Aulas, Frequência & Chamada, Pauta & Lançamento de Notas, Provas & Gabaritos Oficiais e Prontuário dos Alunos.'],
      },
      { q: 'Como faço a chamada?', a: 'Aba "Frequência & Chamada": escolha a data, marque presença/falta de cada aluno e grave. O passo a passo completo está no módulo Diário & Frequência.' },
      { q: 'Como lanço as respostas de uma prova feita no papel?', a: 'Em "Elaboração de Provas" (Alt+P), clique em "Lançar respostas" na prova. Veja o passo a passo no Tira-dúvidas desse módulo.' },
    ],
  },
  {
    id: 'CLASS_DIARY',
    title: 'Diário & Frequência',
    where: 'Menu > Espaço do Docente & Gestão de Turmas (Alt+E)',
    summary: 'Chamada diária, registro das aulas com habilidades BNCC e impressão do diário oficial.',
    faq: [
      {
        q: 'Como faço a chamada do dia?',
        steps: [
          'Abra a aba "Chamada & Frequência Diária".',
          'Escolha a turma, a disciplina e a data.',
          'Clique no status de cada aluno para alternar entre Presente, Falta e Falta Justificada (ou use "Todos Presentes").',
          'Clique em "Gravar Frequência da Aula".',
        ],
      },
      { q: 'Como registro o conteúdo da aula?', steps: ['Abra "Registro de Aulas & BNCC".', 'Informe o conteúdo, a metodologia e as habilidades BNCC trabalhadas.', 'Clique em "Salvar & Assinar Digitalmente".'] },
      { q: 'Como imprimo o diário ou a lista de chamada?', a: 'Use "Imprimir Diário Oficial", "Imprimir Lista de Chamada" ou "Imprimir Folha do Diário Oficial (A4)". Na janela de impressão, escolha a impressora ou "Salvar como PDF".' },
      { q: 'Onde vejo a regra de frequência mínima?', a: 'Na aba "Normativas Estaduais (SEDUC/SEE)". O sistema usa a LDB (75% no Fundamental) quando não há normativa do estado cadastrada.' },
    ],
  },
  {
    id: 'STUDENTS',
    title: 'Secretaria & Alunos',
    where: 'Menu > Secretaria & Ensino (Alt+S)',
    summary: 'Matrículas, cadastro dos alunos, importação de listas, filtros, impressão e pendências do Censo.',
    faq: [
      {
        q: 'Como matriculo um aluno novo?',
        steps: ['Clique em "Nova Matrícula".', 'Preencha os dados do aluno e do responsável.', 'Escolha a escola e a turma.', 'Salve.'],
        tip: 'Antes, confira se o aluno já não está cadastrado usando a busca (nome, RA ou CPF), para não duplicar.',
      },
      {
        q: 'Como importo a lista de alunos de uma planilha ou documento?',
        steps: [
          'Clique em "Importar Planilhas / Polos" e escolha o arquivo (Excel, CSV ou Word).',
          'Na tela de conferência, confira as escolas, as tabelas de cada série e as contagens de alunos.',
          'Veja no rodapé quantos já existem: eles são atualizados, não duplicados.',
          'Confirme a importação.',
        ],
        tip: 'No Word, cada tabela deve ter um título com a série (ex.: "1º ANO"). Arquivos com escola principal e escolas anexas são separados por escola.',
      },
      { q: 'Como edito ou corrijo o cadastro de um aluno?', a: 'Na lista, clique no lápis (Editar) na linha do aluno, altere e salve.' },
      { q: 'Como encontro alunos com pendências no Censo?', a: 'Use o atalho "Pendências Censo" acima da lista, ou "Mais Filtros" > Situação Cadastral. Clique em "Completar" para corrigir o que falta.' },
      { q: 'Como imprimo ou exporto a lista?', a: 'Filtre a lista como quiser e clique em "Imprimir lista filtrada" ou "Exportar CSV".' },
      { q: 'Como emito declaração, histórico ou boletim de um aluno?', a: 'Clique no ícone de documentos na linha do aluno. O sistema abre "Documentos & Certificados" já com ele selecionado.' },
    ],
  },
  {
    id: 'CLASSES',
    title: 'Turmas & Matrizes',
    where: 'Menu > Secretaria & Ensino (Alt+T)',
    summary: 'Cadastro das turmas, vagas, professor regente e matriz curricular (disciplinas).',
    faq: [
      { q: 'Como cadastro uma turma?', steps: ['Clique em "Cadastrar Nova Turma".', 'Informe escola, série, turno, sala e capacidade.', 'Salve.'], tip: 'Use sempre o mesmo padrão de série (ex.: "1º ANO"). Provas e relatórios agrupam as turmas pela série.' },
      { q: 'Por que a lista de disciplinas das provas está incompleta?', a: 'As disciplinas vêm da Matriz Curricular. Cadastre aqui as disciplinas oficiais da rede. Enquanto isso, o sistema oferece os componentes padrão da BNCC.' },
      { q: 'Como vejo as vagas livres?', a: 'A tabela mostra matriculados, capacidade e vagas remanescentes de cada turma.' },
    ],
  },
  {
    id: 'DROPOUT_CENSUS',
    title: 'Censo de Evasão & Busca Ativa',
    where: 'Menu > Secretaria & Ensino (Alt+C)',
    summary: 'Acompanhamento de alunos evadidos ou em risco, visitas, resgate e exportação para o Educacenso.',
    faq: [
      { q: 'Como registro uma visita ou contato com a família?', steps: ['Abra a ficha do aluno ("Ficha & Resgate").', 'Clique em "Registrar Nova Ação / Visita Domiciliar".', 'Descreva o que foi feito e clique em "Salvar Registro na Ficha".'] },
      { q: 'O aluno voltou a estudar. O que faço?', a: 'Na ficha, use "Resgatar & Reinserir". O aluno volta a ficar ativo.' },
      { q: 'Quando acionar o Conselho Tutelar?', a: 'Use "Acionar Conselho" quando as faltas passarem do limite da normativa e as tentativas de contato não resolverem. O registro fica guardado na ficha.' },
      { q: 'Como gero o arquivo do Censo?', a: 'Clique em "Exportar Censo CSV (Educacenso)" ou "Imprimir Censo (.PDF)".' },
    ],
  },
  {
    id: 'DOCUMENTS',
    title: 'Documentos & Certificados',
    where: 'Menu > Secretaria & Ensino (Alt+O)',
    summary: 'Emissão de declaração de matrícula, declaração de transferência, histórico escolar, boletim e certificado de conclusão.',
    faq: [
      { q: 'Como emito um documento?', steps: ['Escolha o aluno.', 'Escolha o tipo de documento.', 'Confira os dados na prévia.', 'Clique em "Imprimir / Gerar PDF".'] },
      { q: 'O nome da escola ou do diretor está errado no documento.', a: 'Corrija os dados da escola em Secretaria & Alunos > "Editar Dados da Escola". O documento usa esses dados.' },
    ],
  },
  {
    id: 'PEDAGOGICAL_DASHBOARD',
    title: 'Evolução Pedagógica',
    where: 'Menu > Pedagógico & Avaliações (Alt+R)',
    summary: 'Painel com médias, aprovação, acertos por questão e evolução dos alunos e turmas.',
    faq: [
      { q: 'Por que o painel está vazio?', a: 'O painel usa as provas corrigidas. Monte a prova em "Elaboração de Provas" e lance as respostas ("Lançar respostas") ou aplique pelo computador.' },
      { q: 'Posso escolher o que aparece no painel?', a: 'Sim. Use "Configurar Dash Boxes" para mostrar ou esconder os cartões, e "Gerar Gráficos Personalizados" para montar gráficos.' },
    ],
  },
  {
    id: 'BNCC_SKILLS',
    title: 'Habilidades BNCC',
    where: 'Menu > Pedagógico & Avaliações',
    summary: 'Lançamento do nível de cada habilidade por aluno e bimestre, desempenho nas provas, relatórios, gráficos e catálogo.',
    faq: [
      {
        q: 'Como lanço as habilidades de uma turma?',
        steps: ['Aba "Lançamento": escolha escola, turma, componente, bimestre e ano.', 'Marque o nível de cada aluno em cada habilidade: ND, ED, D ou PD.', 'Salve.'],
        tip: 'ND = Não desenvolvida, ED = Em desenvolvimento, D = Desenvolvida, PD = Plenamente desenvolvida.',
      },
      {
        q: 'Como vejo o desempenho dos alunos por habilidade nas provas?',
        steps: [
          'Aba "Desempenho nas provas".',
          'Escolha a série (e, se quiser, escola, turma, componente e bimestre).',
          'Veja o resumo por habilidade (média da série e distribuição) e a tabela por aluno.',
          'Use "Imprimir / PDF" ou "Excel" para guardar.',
        ],
        tip: 'A conta é: pontos que o aluno fez nas questões da habilidade ÷ pontos possíveis. Faixas padrão: abaixo de 40% ND, 40% a 59% ED, 60% a 79% D, 80% ou mais PD. Ajuste em "Faixas dos níveis".',
      },
      {
        q: 'Como levo o resultado das provas para o lançamento do bimestre?',
        steps: ['Na aba "Desempenho nas provas", clique em "Levar para o lançamento BNCC".', 'Escolha o bimestre.', 'Confira o nível sugerido de cada aluno; mude ou desmarque se precisar.', 'Clique em "Confirmar lançamento".'],
        tip: 'O sistema avisa quando um lançamento já existente vai mudar de nível.',
      },
      { q: 'O relatório diz "Sem dados de habilidades".', a: 'É preciso: questões com habilidade vinculada, prova montada com essas questões para uma turma da série, e respostas lançadas ("Lançar respostas") ou prova feita no computador.' },
      { q: 'Como cadastro uma habilidade que não está no catálogo?', a: 'Aba "Catálogo de habilidades": adicione o código, a descrição, o ano e o componente, ou importe uma planilha.' },
    ],
  },
  {
    id: 'ASSESSMENT_REPORT',
    title: 'Resultados Nível & Escola',
    where: 'Menu > Pedagógico & Avaliações',
    summary: 'Resultados das avaliações por escola, série e nível de proficiência, com relatório oficial para impressão.',
    faq: [
      { q: 'Como comparo escolas ou séries?', a: 'Use os filtros de Unidade Escolar, Nível / Etapa e Instrumento de Avaliação. A área "Comparativo por Nível Escolar" mostra lado a lado.' },
      { q: 'Como imprimo?', a: 'Clique em "Imprimir Relatório Oficial (A4)" ou "Exportar CSV".' },
    ],
  },
  {
    id: 'EXAMS',
    title: 'Elaboração de Provas',
    where: 'Menu > Pedagógico & Avaliações (Alt+P)',
    summary: 'Montar provas a partir do banco de questões, imprimir caderno e gabarito, lançar as respostas da prova de papel e ver resultados.',
    faq: [
      {
        q: 'Como monto uma prova?',
        steps: [
          'Clique em "Nova Prova".',
          'Escolha a Turma Destino (a lista mostra a escola de cada turma).',
          'Preencha título, disciplina e bimestre.',
          'Marque as questões no banco. Por padrão aparecem só as do ano da turma.',
          'Clique em "Distribuir Pontos Igualmente" e salve.',
        ],
        tip: 'A prova vale para a série inteira: uma prova do 1º ANO pode ser aplicada em qualquer turma de 1º ANO, de qualquer escola.',
      },
      { q: 'Como imprimo a prova e o gabarito?', a: 'Clique em "Caderno & Gabarito". Escolha entre caderno de questões, cartão-resposta do aluno ou gabarito do professor e imprima.' },
      {
        q: 'Como lanço as respostas da prova feita no papel?',
        steps: [
          'Clique em "Lançar respostas" na prova.',
          'Escolha a turma (só aparecem turmas da série da prova).',
          'Digite a letra marcada por cada aluno em cada questão. O cursor pula sozinho para a próxima.',
          'Nas discursivas, digite os pontos.',
          'Deixe a linha em branco para o aluno que faltou.',
          'Clique em "Salvar respostas".',
        ],
        tip: 'Verde = acertou, vermelho = errou. Lançar de novo substitui a correção anterior, sem duplicar.',
      },
      { q: 'O que é "Simular Aluno"?', a: 'É a prova feita no computador pelo aluno, com correção automática. Aparecem só os alunos da série da prova.' },
      { q: 'Como excluo uma prova?', a: 'Clique na lixeira no cartão da prova. As correções dela são apagadas junto e não voltam de outros computadores.' },
      { q: 'A nota máxima ficou diferente do total da prova.', a: 'Edite a prova (lápis) e clique em "Distribuir Pontos Igualmente" para somar o total certo.' },
    ],
  },
  {
    id: 'QUESTION_BANK',
    title: 'Banco de Questões BNCC',
    where: 'Menu > Pedagógico & Avaliações',
    summary: 'Cadastro de questões com gabarito e habilidades BNCC, impressão e importação.',
    faq: [
      {
        q: 'Como cadastro uma questão?',
        steps: [
          'Clique em "Nova Questão".',
          'Escolha disciplina, ano, dificuldade e tipo.',
          'Vincule uma ou mais habilidades BNCC: digite o código e tecle Enter, ou use o "Catálogo BNCC".',
          'Escreva o enunciado e as alternativas, e marque a correta.',
          'Salve.',
        ],
        tip: 'Use habilidades do ano da questão (ex.: 1º ano de Matemática: EF01MA…). O relatório de desempenho por habilidade depende disso.',
      },
      { q: 'Uma questão pode ter mais de uma habilidade?', a: 'Sim. Cada habilidade aparece como uma etiqueta verde; clique no X para remover.' },
      { q: 'Como monto uma prova a partir do banco?', a: 'Selecione as questões e clique em "Elaborar Avaliação", ou vá em "Elaboração de Provas" > "Nova Prova".' },
      { q: 'Como imprimo as questões?', a: 'Use "Imprimir Caderno" ou "Imprimir com Gabarito (Professor)".' },
    ],
  },
  {
    id: 'MUNICIPAL_SYNC',
    title: 'Rede Municipal & Polos',
    where: 'Menu > Gestão Municipal & Polos',
    summary: 'Escolas da rede, envio de lotes das escolas para a Sede e consolidação na Secretaria.',
    faq: [
      {
        q: 'Como a escola (Servidor Remoto) envia os dados para a Sede?',
        steps: [
          'Com internet: o envio é automático (o selo do rodapé mostra "Lote da escola já enviado").',
          'Sem internet: abra "Exportar Lote (Servidor Remoto)" e clique em "Gerar Lote para a Sede (.edusync)".',
          'Salve o arquivo no pendrive e leve até a Sede.',
        ],
      },
      {
        q: 'Como a Sede recebe o lote do pendrive?',
        steps: ['Abra "Importar Lotes (Sede)".', 'Escolha o arquivo .edusync.', 'Confirme. Os dados são mesclados sem duplicar.'],
        tip: 'Com internet e a conta da nuvem conectada, a Sede importa sozinha os lotes enviados pela internet.',
      },
      { q: 'Como sei se o computador é Sede ou Servidor Remoto?', a: 'Pelo selo no rodapé: "Servidor da Sede" ou "Servidor Remoto". Só a Sede importa lotes e envia os alunos para a nuvem.' },
      { q: 'O cartão da escola mostra 0 alunos.', a: 'Confira se os alunos estão vinculados à escola (Secretaria & Alunos > filtro Unidade Escolar) e sincronize.' },
    ],
  },
  {
    id: 'COMMUNICATION',
    title: 'Comunicados & Avisos',
    where: 'Botão Início (rodapé) > Mural & Mensagens',
    summary: 'Mural de comunicados para professores, alunos e famílias, com anexos e confirmação de leitura.',
    faq: [
      { q: 'Como publico um comunicado?', steps: ['Clique em "Novo Comunicado".', 'Escolha o público e escreva a mensagem (ou use um dos "Modelos Prontos").', 'Anexe arquivos se quiser e marque "Exigir Confirmação de Leitura" se precisar.', 'Publique.'] },
      { q: 'Como vejo quem leu?', a: 'Abra o comunicado em "Ver Detalhes & Auditoria".' },
      {
        q: 'Como envio um comunicado também pelo WhatsApp?',
        steps: [
          'Ao publicar, marque "Depois de publicar, enviar também por WhatsApp". Ou, num comunicado já publicado, clique em "Enviar por WhatsApp".',
          'A Central de WhatsApp abre com o público e o texto já preenchidos.',
          'Confira e clique em "Preparar envio"; depois siga "Abrir próximo" para cada pessoa.',
        ],
        tip: 'Anexos não vão pelo WhatsApp: a mensagem avisa que o arquivo está na secretaria.',
      },
      { q: 'Qual o tamanho máximo de anexo?', a: '2 MB por arquivo. Para PDFs maiores, salve em qualidade menor antes de anexar.' },
    ],
  },
  {
    id: 'WHATSAPP',
    title: 'Central de WhatsApp',
    where: 'Mural & Mensagens > botão "Central de WhatsApp"',
    summary:
      'Envio assistido: o sistema monta a lista e abre cada conversa com a mensagem pronta; você aperta Enviar no WhatsApp da escola.',
    faq: [
      {
        q: 'Como envio uma mensagem para uma turma?',
        steps: [
          'Em "Enviar mensagem", escolha "Uma turma" e selecione a turma.',
          'Em "Enviar para", marque Responsável, Próprio aluno ou Os dois.',
          'Escolha um modelo ou escreva a mensagem. Confira a prévia.',
          'Clique em "Preparar envio".',
          'Clique em "Abrir próximo": o WhatsApp abre na conversa com o texto pronto. Aperte Enviar no WhatsApp e volte para o próximo.',
        ],
        tip: 'Irmãos com o mesmo telefone do responsável recebem uma só mensagem, com os nomes juntos.',
      },
      { q: 'O sistema envia sozinho?', a: 'Não. Ele prepara e abre cada conversa; quem envia é você, no WhatsApp. Por isso o histórico mostra "Aberto no WhatsApp", e não "entregue" ou "lido".' },
      { q: 'Preciso de alguma instalação?', a: 'Não. Use o WhatsApp Web conectado com o celular da escola (QR Code) ou o aplicativo WhatsApp do computador. Escolha em "Ajustes".' },
      { q: 'Por que alguns alunos aparecem "sem telefone"?', a: 'O telefone do responsável não está cadastrado ou está incompleto (falta o DDD). Corrija em Secretaria & Alunos, ou reimporte a planilha com a coluna WhatsApp/Telefone. Telefones de professores e equipe ficam em Usuários & Permissões.' },
      { q: 'O que é "Aguardando envio"?', a: 'São os avisos gerados quando o professor salva a chamada com faltas (e notas, se ligado em Ajustes), e os envios que você guardou para depois. Abra cada um ou descarte.' },
      { q: 'Parei no meio de um envio. E agora?', a: 'Clique em "Guardar o restante para depois". As mensagens que faltam vão para "Aguardando envio".' },
      { q: 'O navegador não abriu o WhatsApp', a: 'O navegador bloqueou a janela. Clique no ícone de pop-up bloqueado na barra de endereço, permita para este site e tente de novo.' },
      { q: 'Posso mandar para muita gente de uma vez?', a: 'Pode, mas envie aos poucos (por turma). Muitas mensagens seguidas para números que não salvaram o contato da escola podem fazer o WhatsApp limitar o número.' },
    ],
  },
  {
    id: 'USER_CONTROL',
    title: 'Usuários & Permissões',
    where: 'Menu > Administração & TI',
    summary: 'Contas de acesso, perfis (Secretaria, Professor, Coordenação, Direção, SME) e permissões por módulo.',
    faq: [
      { q: 'Como crio o acesso de um professor ou funcionário?', steps: ['Clique em "Novo Usuário".', 'Informe nome, login, e-mail e perfil.', 'Escolha a escola.', 'Defina uma senha (ou gere uma) e salve.', 'Entregue o login e a senha à pessoa.'] },
      { q: 'Como tiro o acesso de alguém?', a: 'Edite o usuário e desative, ou exclua. Prefira desativar: o histórico continua ligado ao nome.' },
      { q: 'Como mudo o que cada perfil pode ver?', a: 'Use "Gestão de Permissões (RBAC)" / "Matriz de Níveis de Acesso" e marque os módulos permitidos para cada perfil.' },
      { q: 'Cuidado com "Excluir Todos os Usuários"', a: 'Esse botão apaga todas as contas. Use só com orientação do suporte.' },
    ],
  },
  {
    id: 'NETWORK_INSTALLER',
    title: 'Instaladores & Backup',
    where: 'Menu > Administração & TI (Alt+I)',
    summary: 'Pacotes do Servidor da Sede, do Servidor Remoto (escola) e das estações, atualização do servidor e cópias de segurança.',
    faq: [
      {
        q: 'Como instalo o Servidor Remoto de uma escola?',
        steps: [
          'Abra o sistema pelo link da internet (não pelo atalho) e entre como ADMIN.',
          'Aqui, no quadro "Servidor Remoto (escola)", escolha a escola e clique em "Baixar pacote do Servidor Remoto (.ZIP)".',
          'Anote a chave de acesso.',
          'No computador da escola: extraia o ZIP e rode INSTALAR_SERVIDOR.bat.',
          'Confira na janela preta: "Instalacao do Servidor Remoto" e "Servidor funcionando".',
        ],
      },
      {
        q: 'Como instalo (ou transformo um computador em) Servidor da Sede?',
        steps: ['No quadro "Servidor da Sede (Secretaria)", clique em "Baixar pacote do Servidor da Sede (.ZIP)".', 'Extraia e rode INSTALAR_SERVIDOR.bat.', 'Confira: "Instalacao do Servidor da Sede".', 'Abra o atalho e veja se o selo do rodapé mostra "Servidor da Sede".'],
        tip: 'Reinstalar mantém os dados: o banco fica em C:\\SucessoEdu\\data e não é apagado.',
      },
      { q: 'Como instalo uma estação (outro computador da escola)?', a: 'Baixe o "Pacote da Estação (.ZIP)", rode INSTALAR_ESTACAO.bat no computador e informe a chave de acesso do servidor no primeiro acesso.' },
      { q: 'Como atualizo o servidor?', steps: ['Clique em "Verificar atualização agora" e aguarde de 1 a 3 minutos.', 'Quando aparecer a data de hoje em "Versão baixada e conferida", clique em "Aplicar atualização" > "Aplicar agora".', 'Aperte F5.'] },
      { q: 'Um computador só pode ter um servidor?', a: 'Sim. Se já existe a pasta C:\\SucessoEdu, o computador já tem um servidor. Não instale outro tipo por cima sem orientação.' },
      { q: 'Como faço cópia de segurança?', a: 'O servidor guarda cópias automáticas em C:\\SucessoEdu\\data\\historico. Copie a pasta C:\\SucessoEdu\\data para um pendrive de tempos em tempos.' },
    ],
  },
  {
    id: 'SYSTEM_UPDATES',
    title: 'Atualizações na Nuvem',
    where: 'Menu > Administração & TI',
    summary: 'Catálogo de versões publicadas do sistema.',
    faq: [{ q: 'Preciso fazer algo aqui?', a: 'Normalmente não. Para atualizar um servidor instalado, use Instaladores & Backup (Alt+I) > "Verificar atualização agora".' }],
  },
  {
    id: 'ABOUT',
    title: 'Sobre o Sistema & Dev',
    where: 'Menu > Administração & TI',
    summary: 'Versão do sistema e contato do suporte.',
    faq: [{ q: 'Como falo com o suporte?', a: 'Os contatos do desenvolvedor estão nesta tela. Ao pedir ajuda, diga o módulo, o que tentou fazer e mande um print da tela.' }],
  },
  ...[
    ['ARCHITECTURE_DIAGRAM', 'Diagrama & Solicitações IA'],
    ['ADMIN_TI', 'Hub de Engenharia & TI'],
    ['OMNI_DEPLOY', 'Deploy em Nuvem & Docker'],
    ['NEXUS_DEPLOYER', 'Gerador de Pacotes Windows'],
    ['NEXUS_INSTALL', 'Instalador Rápido de Estação'],
    ['NEXUS_BUILD', 'Compilador & Empacotador'],
    ['CLEANSLATE_HUB', 'Manutenção de Banco & Cache'],
    ['INSTALAFLOW', 'Assistente Passo a Passo'],
    ['DATASYNC_PRO', 'Sincronização Remota (.edusync)'],
    ['DEBUG_FLOW', 'DebugFlow & Auditoria Full-Stack'],
  ].map(
    ([id, title]): HelpModule => ({
      id,
      title,
      where: 'Menu > Administração & TI',
      summary: TECNICO,
      faq: [
        { q: 'Preciso usar este módulo?', a: TECNICO },
        ...(id === 'DATASYNC_PRO' || id === 'NEXUS_INSTALL' || id === 'NEXUS_DEPLOYER'
          ? [{ q: 'Onde faço isso no dia a dia?', a: 'Envio de lotes: Rede Municipal & Polos. Instalação de servidor e estações: Instaladores & Backup (Alt+I).' }]
          : []),
      ],
    })
  ),
];

export function helpForTab(tab: string | undefined): HelpModule | null {
  const id = HELP_ALIASES[tab || ''] || tab || '';
  return HELP_MODULES.find((m) => m.id === id) || null;
}

const norm = (s: string) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** Busca em todos os módulos (pergunta, resposta, passos e dica). */
export function searchHelp(term: string): Array<{ module: HelpModule; item: HelpItem }> {
  // Raiz da palavra: "matricular" também acha "matrícula", "lançar" acha "lanço".
  // Palavras vazias (inclui verbos genéricos como "fazer", "posso") não contam.
  const stop = new Set([
    'de', 'da', 'do', 'das', 'dos', 'e', 'o', 'a', 'os', 'as', 'um', 'uma', 'como', 'para', 'no', 'na', 'em', 'que',
    'com', 'por', 'ao', 'se', 'eu', 'meu', 'minha', 'meus', 'minhas', 'onde', 'qual', 'quero', 'posso', 'consigo',
    'fazer', 'faco', 'faz', 'fica', 'ficar', 'ter', 'tem', 'sistema', 'nao', 'mais', 'ja',
  ]);
  // Sinônimos do dia a dia da escola → termos usados nas respostas.
  const syn: Record<string, string[]> = {
    chamada: ['frequ', 'presen', 'falta'],
    presenca: ['frequ', 'chamada'],
    boletim: ['nota', 'relator'],
    senha: ['acesso', 'login'],
    apagar: ['exclu'],
    deletar: ['exclu'],
    excluir: ['apag'],
    cadastrar: ['matric', 'cria', 'novo'],
    professor: ['docente'],
  };
  const stem = (w: string) => (w.length > 5 ? w.slice(0, Math.max(4, w.length - 3)) : w);
  const raw = norm(term).split(/\s+/).filter((w) => w.length >= 2 && !stop.has(w));
  if (!raw.length) return [];
  const groups = raw.map((w) => [stem(w), ...(syn[w] || [])]);
  const need = groups.length <= 2 ? 1 : Math.ceil(groups.length / 2);
  const out: Array<{ module: HelpModule; item: HelpItem; score: number }> = [];
  for (const module of [HELP_GENERAL, ...HELP_MODULES]) {
    for (const item of module.faq) {
      const q = norm(item.q);
      const body = norm([item.a, ...(item.steps || []), item.tip, module.title].filter(Boolean).join(' '));
      let hits = 0;
      let score = 0;
      for (const g of groups) {
        if (g.some((w) => q.includes(w))) { hits++; score += 3; }
        else if (g.some((w) => body.includes(w))) { hits++; score += 1; }
      }
      if (hits < need) continue;
      // Quem bate todas as palavras vem sempre primeiro.
      if (hits === groups.length) score += 10;
      out.push({ module, item, score });
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 30);
}
