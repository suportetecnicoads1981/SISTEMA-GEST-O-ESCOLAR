import { moduleName, moduleGroup } from '../../config/moduleNames';
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
      q: 'Os números das telas são reais?',
      a: 'Sim. Desde 01/10/2026 o sistema mostra só dados lançados: quando ainda não há registro (por exemplo, nenhuma chamada ou nota lançada), aparece "—" em vez de um número de exemplo. Foram retirados percentuais fixos, notas e IDEB estimados, selos "Homologado" e status "Online" que não vinham de verificação real, e os botões que carregavam alunos de exemplo. Importações deixam em branco (e marcam como pendência) o que não veio na planilha, em vez de inventar CPF, telefone, endereço ou turma. Em 02/10/2026 foi feita uma varredura em todas as telas: saíram o sino com "6" fixo, os rankings com escolas sem prova (média 0%), as médias que contavam aluno sem nota como zero, os anos "2026" fixos (agora vem o ano da turma), os textos padrão gravados em diários, planos e questões, e os rótulos "dados simulados" em bases reais.',
    },
      {
        q: 'O nome de um módulo aparece diferente em algum lugar?',
        a: 'Não deveria. Cada módulo tem um nome só, o mesmo do menu lateral, e ele aparece igual nas abas abertas, na barra de tarefas, no título da janela, no selo "Módulo:" do cabeçalho, na trilha de navegação, na busca rápida (Ctrl+K), nos atalhos de teclado, nos cartões do Início, no título da própria tela e aqui no Tira-dúvidas.',
        tip: 'Se encontrar um nome diferente, mande um print para o suporte informando a tela.',
      },
      {
        q: 'Como funciona a sincronização com a nuvem agora?',
        a: 'Cada computador envia só os registros que mudaram nele e recebe só o que mudou na nuvem, em até 1 minuto (ou na hora, com "Sincronizar agora"). Cada registro tem um número de versão controlado pela nuvem: se um computador tentar gravar a partir de uma cópia desatualizada, a nuvem recusa e ele recebe a versão atual. Por isso o sistema pode ficar aberto pelo link e pela Sede ao mesmo tempo, e uma cópia antiga não apaga mais o trabalho de ninguém. A nuvem passou a guardar o cadastro completo (série, turno, raça/cor, PCD, filiação etc.) e também o cadastro da SEMED, planos de aula e anotações do professor.',
        tip: 'A regra antiga "não abrir pelo link enquanto a Sede estiver em uso" não é mais necessária.',
      },
      {
        q: 'O selo mostra "1 registro(s) foram recusados pela nuvem", mas já excluí o registro com problema. E agora?',
        a: 'Na versão atual o aviso some sozinho na próxima sincronização (em até 1 minuto, ou com "Enviar à nuvem agora"): o recusado que não existe mais neste computador sai da conta. Se o registro ainda existir, abra-o e complete o que falta (por exemplo, o nome ou o e-mail do usuário) e salve de novo.',
        tip: 'Um registro recusado nunca chega à nuvem nem apaga nada lá: fica só neste computador até ser corrigido ou excluído.',
      },
      {
      q: 'Apareceu "exclusão(ões) não foram enviadas à nuvem (proteção contra apagamento acidental)". O que significa?',
        a: 'Este computador tentou apagar na nuvem registros que sumiram só nele, e o sistema barrou. Isso acontece quando a cópia deste computador está incompleta (por exemplo, logo depois de receber a base da nuvem ou com o armazenamento do navegador cheio). A proteção barra: qualquer exclusão logo após receber a base; todos os registros de uma tabela de uma vez; muitos registros de uma vez; e mais de uma escola ou de um usuário na mesma rodada. Os registros continuam na nuvem e voltam a este computador na próxima sincronização.',
        steps: [
          'Não faça nada às pressas: os dados estão seguros na nuvem.',
          'Aguarde 1 minuto (ou clique em "Sincronizar agora") e confira se os registros voltaram.',
          'Se a exclusão foi intencional (por exemplo, apagar duas escolas), apague uma por vez ou peça ao suporte.',
        ],
        tip: 'Esta proteção foi criada depois de 02/10/2026, quando um computador com a cópia incompleta apagou as 16 escolas da nuvem (todas foram recuperadas). A própria nuvem também recusa apagar mais de uma escola por vez.',
      },
      {
      q: 'O que é o botão "Nuvem" no alto da tela?',
        a: 'Mostra a situação da sincronização: verde = em dia; azul girando = sincronizando; âmbar = há alterações aguardando envio ou avisos; vermelho = erro (tenta de novo sozinho). Clique para ver a hora da última sincronização, quantos registros aguardam envio, os recusados e os avisos recentes, e para "Sincronizar agora".',
        tip: 'O administrador também vê "Conferência completa": compara todos os registros deste computador com a nuvem. Onde houver diferença, fica a da nuvem; o que só existe aqui é enviado. Use só se o suporte pedir.',
      },
      {
        q: 'Apareceu um aviso de que minha alteração foi substituída. O que houve?',
        a: 'Outra pessoa alterou o mesmo registro (por exemplo, o mesmo aluno) em outro computador antes de a sua alteração chegar à nuvem. Para não apagar o trabalho dela, a nuvem ficou com a versão que chegou primeiro e o seu computador recebeu essa versão. Abra o registro, confira e, se precisar, refaça a sua alteração.',
        tip: 'Alterações em registros diferentes (alunos diferentes, por exemplo) nunca se atrapalham.',
      },
      {
        q: 'Apareceu "A Secretaria reiniciou a base na nuvem". E agora?',
        a: 'Quando a Secretaria recomeça a base (por exemplo, para reimportar todas as escolas pela planilha padrão), cada computador, na próxima sincronização, faz um backup automático e retira os cadastros antigos (alunos, turmas, escolas, notas, chamadas...) que foram alterados antes do reinício. O que foi cadastrado ou importado depois do reinício continua. Nada precisa ser apagado à mão.',
        tip: 'O backup automático fica em Backup/Restauração, caso seja preciso consultar algo antigo.',
      },
      {
        q: 'Como filtro os gráficos por escola, série ou turno?',
        a: 'Acima dos gráficos há a barra "Filtrar": escolha a escola, a etapa/série e o turno. Os gráficos e indicadores passam a mostrar só aquele recorte, e ao lado aparece quantos registros entraram. "Limpar" volta para a rede toda. Isso vale para Evasão & Busca Ativa e Evolução Pedagógica.',
        tip: 'Em cada gráfico ainda dá para trocar o tipo (colunas, barras, linhas, pizza), a ordem e quantos itens mostrar. Quando não há dados para o filtro, aparece "Sem dados para mostrar" em vez de um gráfico vazio.',
      },
      {
        q: 'O que aparece embaixo do meu nome, no alto da tela?',
        a: 'Aparece o seu cargo, do jeito que foi cadastrado em Usuários & Permissões, no campo "Título / Cargo Personalizado" (ex.: Coordenação Pedagógica). Se o campo estiver vazio, aparece o perfil de acesso (ex.: Administrador(a)). No quadradinho ficam as iniciais do nome e do último sobrenome.',
        tip: 'Para mudar o cargo, peça ao administrador para editar o seu usuário e salvar. A mudança aparece no próximo acesso.',
      },
      {
        q: 'Os relatórios estão demorando. O que foi feito?',
        a: 'A geração ficou mais rápida. Antes, cada escola ou turma do relatório repetia as logos em tamanho original (mais de 250 KB por timbre): um relatório da rede com 90 turmas passava de 25 MB e o computador levava bastante tempo para montar a impressão. Agora as logos entram reduzidas e uma vez só. A tela mostra uma pré-visualização com os primeiros 150 registros; a impressão e os arquivos (Excel, Word, CSV) trazem todos.',
        tip: 'Se ainda demorar, anote o nome do relatório e a quantidade de registros e avise o suporte.',
      },
      {
        q: 'Onde encontro o botão de relatório nos módulos?',
        steps: ['Aplique os filtros da tela (busca, escola, turma, situação etc.).', 'Clique no botão verde "Relatório".', 'Marque as colunas que quer no relatório (as mais usadas já vêm marcadas).', 'Confira a pré-visualização.', 'Escolha: "Imprimir / Salvar em PDF", "Excel", "Word" ou "CSV".'],
        a: 'Os módulos de dados têm o botão verde "Relatório" (ou "Relatório / Exportar"): Alunos, Turmas, Evasão & Busca Ativa, Diário & Frequência, Avaliações, Banco de Questões, Resultados das Avaliações, Comunicados, Histórico do WhatsApp, Rede Municipal (escolas) e Usuários. Todos abrem o mesmo painel, com escolha de colunas, pré-visualização, impressão com timbre, Excel formatado, Word e CSV.',
        tip: 'O relatório sai com o timbre da Prefeitura, SEMED e escola, e o arquivo recebe nome com a data e a hora.',
      },
    {
      q: 'Como abro o Tira-dúvidas?',
      a: 'Clique no botão "Tira-dúvidas" no alto da tela ou aperte F1. Ele abre nas perguntas do módulo em que você está. Use a busca para procurar em todos os módulos.',
    },
    {
      q: 'Como entro no sistema?',
      steps: [
        'Na tela de login, digite o seu login (ou e-mail) e a sua senha e clique em "Entrar".',
        'Primeiro acesso: digite o login e clique em "Entrar"; o sistema pede para você cadastrar a sua senha.',
        'Esqueceu a senha? Procure a secretaria ou o administrador do sistema.',
      ],
      tip: 'A tela completa, com a lista de usuários, o IP da rede e o último backup, é só do administrador Master: clique em "Acesso do administrador" e confirme o login e a senha dele. "Login simples" volta para a tela normal.',
    },
    {
      q: 'Como trabalhar só com uma escola (escola em foco)?',
      a: 'Quem vê a rede inteira (Sede / Secretaria, sem escola de lotação) escolhe no topo da tela, no campo da escola (ao lado do nome do sistema), com qual escola quer trabalhar. A partir daí, todas as telas (alunos, turmas, frequência, notas, relatórios, painéis e números do menu) mostram só os dados dessa escola. Para a escola sede, há também a opção "escola + anexas", que junta a sede com as anexas dela.',
      steps: [
        'Clique no campo da escola no topo e escolha a escola (ou "escola + anexas").',
        'O campo fica amarelo enquanto houver uma escola em foco, para lembrar que as telas estão filtradas.',
        'Para voltar a ver todas as escolas, escolha "Toda a rede".',
      ],
      tip: 'É só um filtro de visão: as permissões do usuário não mudam, o cadastro de escolas continua completo (para transferir um aluno, por exemplo) e nada das outras escolas é apagado. A escolha fica guardada neste computador para o seu usuário. Quem está lotado em uma escola não vê esse campo: ele já trabalha só com a escola dele.',
    },
    {
      q: 'Por que alguns botões do topo aparecem só com o ícone?',
      a: 'Em telas que não são bem largas, os botões do topo (versão, Tira-dúvidas, Nuvem, Atualizar, Tour Guiado e o nome do usuário) mostram só o ícone, para nada ficar por cima de nada. Passe o mouse sobre o ícone para ver o nome. Em telas largas, os nomes voltam a aparecer.',
      tip: 'Do mesmo jeito, as barras de filtros (escola, série, turma) passam para a linha de baixo quando falta espaço, em vez de se sobreporem. As setas de rolagem do menu lateral ficam numa faixa própria, abaixo dos módulos.',
    },
    {
      q: 'Como faço o Tour Guiado parar de aparecer toda vez que entro?',
      a: 'No Tour Guiado, deixe marcada a opção "Não mostrar mais ao entrar" e feche (ou conclua) o tour. Quando quiser rever, clique no botão "Tour Guiado" no alto da tela.',
    },
    {
      q: 'O selo do rodapé mostra "sem resposta (rede local)". É falta de internet?',
      a: 'Não. Esse aviso é sobre o servidor desta rede: o programa SucessoEdu que roda no computador da Sede (ou da escola). A internet aparece separada, na linha "Nuvem" do mesmo quadro. Um atraso rápido não gera mais o aviso: ele só aparece se o servidor ficar sem responder por alguns segundos seguidos.',
      steps: [
        'Espere alguns segundos: com o banco grande, o servidor pode demorar numa gravação e volta sozinho.',
        'Se continuar, confira se o computador servidor está ligado e na mesma rede.',
        'Ainda sem resposta: reinicie o computador servidor. Nada se perde; as alterações ficam guardadas na estação e são enviadas quando o servidor voltar.',
      ],
    },
    {
      q: 'Como saio do sistema com segurança?',
      steps: ['Clique em "Sair do Sistema" no fim do menu lateral.', 'Na tela de login, o botão "Fechar" encerra a janela.'],
      tip: 'Se o navegador não deixar fechar sozinho, aparece a tela "Sessão encerrada": feche a janela no X ou com Alt+F4 (aba do navegador: Ctrl+W).',
    },
    {
      q: 'Marquei "Não mostrar mais" no Tour e ele voltou a aparecer. O que fazer?',
      a: 'A escolha fica guardada em quatro lugares: no navegador, num cookie, no banco interno do navegador (que continua funcionando mesmo quando o armazenamento comum fica cheio) e no seu cadastro de usuário. Marque a opção uma vez e feche o Tour. Ele continua disponível no botão "Tour Guiado" do topo.',
    },
    {
      q: 'Com o menu lateral recolhido, como sei o que é cada ícone?',
      a: 'Passe o ponteiro do mouse sobre o ícone: o nome do módulo e o atalho de teclado aparecem ao lado, na mesma altura do ícone. Para ver os nomes o tempo todo, expanda o menu pela seta no topo da barra.',
    },
    {
      q: 'Para que serve o botão "Atualizar" no topo da tela?',
      a: 'Ele envia o que estiver pendente e recarrega a tela, trazendo os dados e a versão mais recentes. Use quando algo parecer desatualizado. Nada se perde: as alterações pendentes são enviadas antes de recarregar.',
    },
    {
      q: 'Apareceu o aviso "Nova versão do sistema disponível". O que faço?',
      steps: [
        'Pelo link: clique em "Atualizar agora". As alterações pendentes são enviadas e a tela recarrega com a versão nova.',
        'No servidor (Sede ou escola): o administrador clica em "Aplicar e atualizar". As demais estações recebem o aviso "Recarregar agora".',
        'Se estiver no meio de um trabalho, clique em "Depois": o aviso volta em 30 minutos.',
      ],
      tip: 'A data da versão em uso aparece no selo do rodapé: "Versão do sistema publicada em ...".',
    },
    {
      q: 'Por que os documentos saem com "Emitido por" e a assinatura da Secretária?',
      a: 'Todo documento oficial traz no rodapé o nome completo e o cargo de quem está logado e emitiu, com data e hora, e o bloco de assinatura do(a) titular da Secretaria de Educação (cadastrado em Rede Municipal & Polos > Secretaria). Se o documento já tiver a própria área de assinatura, o bloco da Secretaria não é repetido. Para o nome sair certo, mantenha o nome completo e o cargo atualizados no cadastro do usuário.',
      tip: 'Nos certificados, declarações e históricos (Documentos Oficiais), a primeira assinatura é do(a) titular da Secretaria e a segunda é de quem está emitindo. Cadastre o nome completo do(a) Secretário(a) em Rede Municipal & Polos > Secretaria, no campo do(a) Secretário(a) de Educação, só com o nome (o cargo vai no campo próprio). Nomes digitados todos em minúsculas (ou todos em maiúsculas) saem nas assinaturas com as iniciais maiúsculas (ex.: "maria da silva" sai "Maria da Silva"); ainda assim, o ideal é corrigir o nome no cadastro do usuário.',
    },
    {
      q: 'Como gerar um relatório só de uma escola, série ou turma e salvar em Excel ou Word?',
      steps: [
        'Em Secretaria > Alunos, clique em "Painel de Impressão".',
        'No quadro "Filtros do relatório", escolha a escola, a série, a turma, o turno e o status. A pré-visualização ao lado mostra o resultado na hora.',
        'Escolha as colunas que devem aparecer.',
        'Clique em "Imprimir / Salvar em PDF", "Excel", "Word" ou "CSV".',
        'Na impressão e no Word, cada escola/turma sai em página própria, com o timbre, a identificação (escola, INEP, série, turma e turno), os alunos em ordem alfabética, o total e o campo "Conferido por / Data / Assinatura" para a conferência manual.',
      ],
      tip: 'Os mesmos botões de Excel, Word e CSV também estão no Painel de Impressão das Turmas e do Pedagógico.',
    },
    {
      q: 'Como gerar um relatório conjunto da escola sede (polo) com as escolas anexas dela?',
      steps: [
        'Em Secretaria > Alunos, escolha a escola sede no filtro de escola.',
        'Ao lado do filtro aparece "+ Anexas". Com uma anexa só, é uma caixa: marque para juntar. Com duas ou mais, clique em "+ Anexas (0/2)" e marque cada anexa que deve entrar (ou "Marcar todas").',
        'A lista e os relatórios passam a trazer os alunos da sede e das anexas marcadas. Cada escola sai em bloco próprio, e a anexa aparece como "ESCOLA X (anexa de ESCOLA Y)".',
        'No final do relatório vem o Quadro totalizador: uma linha para a escola sede, uma para cada anexa e o TOTAL GERAL (SEDE + ANEXAS). No Relatório de Matrículas ele traz turmas, matriculados, ativos, masculino/feminino, transferidos, evadidos, capacidade, vagas e ocupação; na relação de alunos, turmas, alunos, ativos, masculino/feminino, laudo/PCD e pendências.',
        'O quadro sai na impressão, no Word, no Excel e na pré-visualização. Escolhendo "Todas as escolas", ele traz o total de cada escola da rede e o total geral.',
        'No Relatório Oficial de Matrículas e Enturmação e no Painel de Impressão, as anexas aparecem com caixas logo abaixo da escola. O botão "Gerar Relatório" já abre com a escola e as anexas marcadas na lista.',
        'Relatório individual: escolha só a escola (sede ou anexa) no filtro, sem marcar anexas. Cada escola também tem o seu bloco, com os totais dela, dentro do relatório conjunto.',
        'Outra forma: escolha no topo da tela a escola em foco "escola + anexas"; aí todas as telas e relatórios já saem com a sede e todas as anexas.',
      ],
      tip: 'A opção só aparece quando a escola escolhida é sede de alguma anexa. Para ligar uma escola como anexa, veja a pergunta sobre juntar escolas em Rede Municipal & Polos.',
    },
    {
      q: 'Quem pode criar acessos na nuvem e atualizar o servidor da Sede ou da escola?',
      steps: [
        'Acesso na nuvem (e-mail e senha para entrar em qualquer computador): só a conta Master cria ou altera. Outro administrador que tentar recebe o aviso "Somente a conta Master pode criar ou alterar acessos na nuvem".',
        'A senha de uma conta Master só pode ser trocada pelo próprio dono.',
        'Contas de servidor das escolas (Servidor Remoto): só a conta Master cria, renova ou desliga.',
        'Quem entra pela nuvem num computador novo só vira Master se a conta for Master na nuvem; os demais administradores entram como Secretaria.',
        'Servidor da Sede/escola: verificar e aplicar atualização exige estar logado no sistema; trocar o endereço de atualização e desfazer uma atualização só a conta Master (ou direto no computador do servidor).',
        'Regra de senha (igual em todo o sistema, na nuvem e no servidor): pelo menos 8 caracteres, com letra minúscula, letra maiúscula e número. Ex.: Escola2026. O botão "Gerar" do cadastro de usuários já cria uma senha dentro da regra.',
        'As senhas antigas continuam valendo; a regra vale ao criar ou trocar a senha.',
        'Usuário lotado numa escola tem, também na nuvem, o perfil ESCOLA: em qualquer computador ele lê e grava só a escola dele e as anexas, e não consegue excluir registros pela nuvem (exclusões ficam com a Sede). Quem não tem escola de lotação (Rede / Coordenação) continua com acesso à rede toda.',
        'Ao mudar a escola de lotação ou o nível de acesso de um usuário que já tem acesso na nuvem, basta salvar o cadastro (com a conta Master): o perfil na nuvem é atualizado junto, sem trocar a senha.',
        'Computador novo ou com os dados do site limpos: no primeiro acesso entre com o e-mail (não com o login curto, como DAVI). Depois desse acesso o login curto volta a funcionar naquele computador.',
        'Aviso "usuário marcado como INATIVO": a senha está certa, mas o cadastro está desativado. A conta Master ativa o usuário em Usuários & Permissões e sincroniza; depois ele entra normalmente.',
        'Senhas na rede da escola: o Servidor da Sede/escola guarda as senhas (em resumo protegido) e NÃO as envia às estações. Na estação, a senha é conferida no servidor (ou na nuvem); depois do primeiro acesso, a estação guarda só o resumo de quem entrou nela, para funcionar mesmo com o servidor fora do ar.',
        'Se aparecer "A senha deste usuário é conferida no servidor da escola, que não respondeu", confira se o computador do servidor está ligado, ou entre com o e-mail, com internet.',
      ],
      tip: 'Depois desta mudança, a conta Master precisa sair e entrar de novo na nuvem uma vez para a permissão nova valer.',
    },
    {
      q: 'Duas escolas têm o mesmo nome oficial (ex.: duas anexas Castro Alves). Como a importação separa?',
      a: 'Pelo "Nome como a escola é conhecida", na aba DADOS DA ESCOLA da planilha. Se já existe uma escola com o mesmo nome oficial, mas conhecida por outro nome, a planilha entra como outra escola: o nome de cadastro junta o nome oficial com a palavra que diferencia (ex.: "ESCOLA CASTRO ALVES CANAÃ" entra como "E.M.E.F CASTRO ALVES CANAÃ"), ligada à mesma escola sede. A conferência da importação mostra um aviso explicando a separação.',
      tip: 'Preencha sempre o nome conhecido de cada escola anexa. Sem ele, duas escolas com o mesmo nome oficial seriam juntadas numa só. O nome de cadastro pode ser ajustado depois em Editar Escola.',
    },
    {
      q: 'Como sai o cabeçalho (escola, Gestão e SEMED) no Word e no Excel?',
      a: 'Igual ao da impressão, já alinhado: logo da Gestão Municipal à esquerda; no centro, Prefeitura, Secretaria de Educação e a escola (com INEP); à direita, as logos da SEMED e da escola, todas em tamanho padronizado. No Word, cada escola/turma começa em página nova com o timbre. No Excel, o timbre fica no topo da planilha, seguido do título, filtros e de quem emitiu; cada escola/turma vem num bloco com a identificação em destaque, o cabeçalho das colunas em fundo escuro, bordas, totais e o campo de conferência. A planilha já sai pronta para imprimir em A4, ajustada à largura, uma escola/turma por página e com rodapé "Emitido por... / Página X de Y".',
      tip: 'As logos vêm de Rede Municipal & Polos (Secretaria e Escolas). Se uma logo não aparecer, confira se ela está cadastrada ali. O arquivo CSV continua só com os dados, sem cabeçalho, para importar em outros sistemas.',
    },
    {
      q: 'O que é o "Plano de Desenvolvimento"?',
      a: 'É o registro privado das melhorias e correções futuras do sistema, mantido pelo desenvolvedor. Só aparece no menu (Administração & TI) para a conta do desenvolvedor e pede a senha da nuvem para abrir. Os itens ficam guardados na nuvem com acesso exclusivo dessa conta.',
      tip: 'Se a lista aparecer vazia logo depois de abrir, clique em "Atualizar". Os itens só aparecem para a conta do desenvolvedor.',
    },
    {
      q: 'Os dados vão para a nuvem sozinhos?',
      a: 'Sim, quando há internet e uma conta da nuvem conectada. No selo do rodapé (canto de baixo à esquerda) você vê a situação e pode clicar em "Enviar à nuvem agora". Sem internet, o trabalho continua normalmente e é enviado depois.',
    },
    {
      q: 'Apareceu "Não foi possível falar com a nuvem agora" ao entrar. Minha senha está errada?',
      a: 'Não. Essa mensagem quer dizer que a internet estava lenta ou instável e a nuvem não respondeu a tempo para conferir a senha. Aguarde alguns segundos e clique em Entrar de novo. Se a senha estiver mesmo errada, a mensagem será "Senha incorreta para esta conta".',
      tip: 'Na Sede, logo depois de publicar uma versão nova ou durante o envio de lotes, a internet pode ficar mais lenta por alguns minutos.',
    },
    {
      q: 'O selo mostra "Nuvem: erro no envio" depois de importar alunos. O que houve?',
      a: 'A nuvem não aceita o mesmo aluno (mesmo nome e mesma data de nascimento) duas vezes na mesma escola. Se aparecer esse erro após uma importação, provavelmente o aluno já existia com outro cadastro. Abra a lista de alunos da escola, procure o nome, mantenha o cadastro correto e exclua a cópia. Alunos com o mesmo nome e datas de nascimento diferentes são aceitos normalmente.',
      tip: 'Acentos, letras maiúsculas e espaços não contam na comparação: "Bep Rôrôti" e "BEP ROROTI" são o mesmo nome.',
    },
    {
      q: 'Ao salvar um usuário apareceu "Acesso na nuvem ... não foi criado". O que faço?',
      a: 'O usuário foi salvo neste computador; só o acesso dele na nuvem (para entrar em qualquer computador) não foi criado. Isso agora funciona igual na Sede, nas escolas e pelo link. As causas mais comuns são: você não está conectado à nuvem como administrador (clique no selo do rodapé e em "Entrar na nuvem"), o usuário está sem e-mail, ou a senha tem menos de 6 caracteres.',
      steps: [
        'Confira se o selo do rodapé mostra a nuvem conectada com uma conta de administrador.',
        'Em Usuários & Permissões, clique em "Editar" no usuário, confira o e-mail e digite a senha de novo.',
        'Clique em Salvar. A mensagem verde "Acesso na nuvem criado" confirma.',
      ],
      tip: 'Cada usuário precisa de um e-mail próprio. Se dois usuários usarem o mesmo e-mail, a senha salva por último vale para os dois na nuvem.',
    },
    {
      q: 'Como faço para não precisar digitar a senha da nuvem toda vez?',
      steps: [
        'Na tela de login (ou no selo do rodapé, em "Entrar na nuvem"), deixe marcada a opção "Manter este computador conectado à nuvem".',
        'Pronto: ao usar "Sair do Sistema", só o usuário sai. A nuvem continua conectada e os dados seguem sendo enviados.',
        'Para tirar o computador da conta da nuvem, clique no selo do rodapé e em "Desconectar da nuvem".',
      ],
      tip: 'A senha não fica guardada: o computador guarda apenas a conexão. Nos servidores (Sede e escolas) a opção já vem marcada; pelo link ela vem desmarcada. Em computador emprestado ou compartilhado, deixe desmarcada.',
    },
    {
      q: 'O que significa cada cor do selo do rodapé?',
      steps: [
        'Verde: tudo enviado ("Nuvem: dados enviados" ou "conectado").',
        'Amarelo: enviando alterações ou aguardando o login da nuvem. Se for login, clique no selo e em "Entrar na nuvem".',
        'Vermelho: sem internet, servidor da rede sem resposta ou erro no envio. Clique no selo para ver o motivo.',
        'Aberto pelo link, o selo mostra "Acesso pelo link (nuvem)". Aberto pelo atalho do servidor, mostra "Servidor da Sede" ou "Servidor Remoto".',
      ],
      tip: 'O selo aparece nos dois modos. Se abrir pelo atalho do servidor e ele mostrar "Acesso pelo link", o servidor demorou a responder na abertura: aguarde o aviso "Recarregar agora" no alto da tela, ou aperte F5.',
    },
    {
      q: 'Onde fica o selo do rodapé? Ele cobria o botão Iniciar e a Pesquisa.',
      a: 'Desde 03/10/2026 o selo fica dentro da Barra de Tarefas, no canto de baixo à esquerda, antes dos botões "Iniciar" e "Pesquisar", sem cobrir nada. Clique nele para abrir os detalhes (a janela abre para cima). Na tela de login, onde não há Barra de Tarefas, ele continua no canto da tela.',
      tip: 'Se a Barra de Tarefas estiver no modo "ocultar automaticamente", passe o mouse no rodapé para ver o selo.',
    },
    {
      q: 'Como bloqueio a tela quando saio do computador? E como outra pessoa entra sem fechar o sistema?',
      steps: [
        'Para bloquear: clique no seu nome no alto da tela e em "Bloquear tela", ou use "Bloquear Tela" no menu lateral, ou aperte Ctrl+Shift+L.',
        'Para voltar: digite a sua senha e clique em Entrar. Abas e formulários abertos continuam como estavam.',
        'Para trocar de usuário: clique no seu nome e em "Trocar usuário", ou clique direto no nome do outro usuário na lista desse menu (ou, com a tela bloqueada, digite o login do outro usuário). Ele entra com a senha dele; as telas do usuário anterior são fechadas.',
        'Em "Bloquear sem uso após" (no mesmo menu do seu nome) escolha o tempo: 5, 10, 15, 30 minutos, 1 hora ou Nunca. O padrão é 15 minutos e vale para este computador.',
      ],
      a: 'Sem mexer no mouse ou no teclado pelo tempo escolhido, a tela é bloqueada sozinha e pede o login de novo. Recarregar a página (F5) não libera a tela bloqueada. O botão "Sair do Sistema" da tela bloqueada encerra a sessão. Bloqueios, desbloqueios e trocas de usuário ficam registrados na auditoria.',
      tip: 'A sincronização continua funcionando com a tela bloqueada.',
    },
    {
      q: 'Quem gera o número de matrícula (RA)? Por que aparece "Aguardando número da nuvem"?',
      a: 'O RA agora é gerado pela nuvem, e não mais por cada computador. Todo aluno novo (cadastro, importação ou planilha) nasce com um RA provisório, que começa com "RA-PROV-". Assim que o computador estiver conectado à nuvem, ele recebe o número definitivo (ex.: RA-2026-2196), em até 1 minuto. A nuvem guarda qual número cada aluno recebeu: se dois computadores pedirem para o mesmo aluno, os dois recebem o mesmo número. Por isso os RAs não mudam mais sozinhos nem se repetem. Nos documentos, enquanto o número não chega, aparece "Aguardando número da nuvem".',
      steps: [
        'Cadastre ou importe os alunos normalmente.',
        'Confira se o selo mostra que você está na nuvem ("Entrar na nuvem" se estiver desconectado).',
        'Em até 1 minuto os RAs provisórios são trocados pelos definitivos. Sem internet, o provisório fica até a conexão voltar.',
      ],
      tip: 'O RA não é digitado na ficha do aluno. Se dois alunos aparecerem com o mesmo RA (dado antigo), o cadastrado primeiro fica com o número e o outro recebe um novo da nuvem. A sincronização envia só o que mudou; não há mais conferência completa automática.',
    },
    {
      q: 'O selo mostra "sem resposta (rede local)" o tempo todo. O servidor parou?',
      steps: [
        'Provavelmente sim. Aguarde até 5 minutos: o Windows confere o servidor a cada 5 minutos e o inicia de novo se tiver parado.',
        'Se não voltar, abra a pasta do SucessoEdu e execute INICIAR_SERVIDOR.bat (aceite a permissão de Administrador).',
        'Enquanto isso, as alterações ficam guardadas neste computador e são enviadas quando o servidor voltar. Não limpe os dados do navegador.',
      ],
      tip: 'O aviso só aparece quando o servidor fica 45 segundos sem responder e uma conferência extra confirma. Se aparecer "Servidor ocupado", está tudo bem: ele está trabalhando (por exemplo, enviando muitos alunos à nuvem) e responde em instantes. Servidores instalados antes desta versão não têm a conferência a cada 5 minutos: reinstale o pacote do Servidor para ganhar essa proteção.',
    },
    {
      q: 'Apareceu o aviso "respondeu agora... Recarregue para conectar". O que faço?',
      a: 'O servidor da rede local estava ocupado quando o sistema abriu e só respondeu depois. Salve o que estiver fazendo e clique em "Recarregar agora". Até recarregar, este computador não troca dados com o servidor da rede.',
    },
    {
      q: 'Fiz uma alteração e não apareceu em outro computador. O que faço?',
      steps: [
        'No computador onde alterou, clique no botão "Nuvem" no alto da tela e em "Sincronizar agora".',
        'No outro computador, faça o mesmo (ou aguarde até 1 minuto: ele recebe sozinho o que mudou).',
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
    title: moduleName('MAIN_DASHBOARD'),
    where: `Menu > ${moduleGroup('MAIN_DASHBOARD')} > ${moduleName('MAIN_DASHBOARD')}`,
    summary: 'Tela inicial com os números principais da escola e os atalhos para cada módulo.',
    faq: [
      { q: 'Para que serve esta tela?', a: 'Mostra um resumo (alunos, turmas, avaliações, avisos) e botões de acesso rápido aos módulos. Clique em um cartão para abrir o módulo correspondente.' },
      { q: 'O que é o cartão "Risco de evasão por faltas"?', a: 'Mostra quantos alunos atingiram o limite de faltas sem justificativa (vermelho) e quantos estão perto dele (amarelo), com o critério em uso. Clique no cartão para abrir o painel de risco no Censo de Evasão & Busca Ativa.' },
      { q: 'Os números estão desatualizados.', steps: ['Clique em "Sincronizar agora" no selo do rodapé.', 'Aperte F5 para recarregar a tela.'] },
      {
        q: 'Como imprimo as pendências cadastrais de uma escola só?',
        steps: [
          'No quadro "Dashbox de Pendências de Dados Cadastrais", na barra de filtros, escolha a escola (o número entre parênteses é a quantidade de alunos com pendência).',
          'Se a escola for sede de anexas, use "+ Anexas" para juntar as anexas que quiser.',
          'Se quiser, escolha também o tipo de pendência (CPF, nascimento, endereço, laudo) ou busque um aluno.',
          'Clique em "Imprimir Guia de Cobrança" (sai com o timbre da escola) ou em "Exportar CSV".',
        ],
        a: 'Os indicadores do quadro, a impressão e o CSV seguem a escola escolhida. Com mais de uma escola (por exemplo, sede + anexas ou "Todas as escolas"), cada escola sai em bloco próprio, com os alunos em ordem alfabética, e no final vem o quadro totalizador com o total de cada escola e o total geral.',
        tip: 'Usuário lotado numa escola vê só a escola dele (e as anexas, se for a sede): as outras escolas da rede não aparecem. A Sede e o Master escolhem qualquer escola da rede.',
      },
    ],
  },
  {
    id: 'NOTIFICATIONS',
    title: moduleName('NOTIFICATIONS'),
    where: `Menu > ${moduleGroup('NOTIFICATIONS')} > ${moduleName('NOTIFICATIONS')} (Alt+N)`,
    summary: 'Avisos do sistema: resultados de provas, atualizações e comunicados.',
    faq: [
      { q: 'Como marco os avisos como lidos?', a: 'Clique no aviso para marcá-lo, ou use "Marcar todas como lidas" no sino do alto da tela.' },
    ],
  },
  {
    id: 'TEACHER_PORTAL',
    title: moduleName('TEACHER_PORTAL'),
    where: `Menu > ${moduleGroup('TEACHER_PORTAL')} > ${moduleName('TEACHER_PORTAL')}`,
    summary: 'Área do professor: turmas, diário, chamada, notas, provas e prontuário dos alunos.',
    faq: [
      {
        q: 'Onde foi parar o botão "Preencher Notas Exemplo"?',
        a: 'Foi retirado. Ele lançava notas fictícias para a turma inteira e, com um clique por engano seguido de "Salvar", essas notas iriam para o boletim. As notas agora são sempre digitadas pelo professor.',
      },
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
    title: moduleName('CLASS_DIARY'),
    where: `Menu > ${moduleGroup('CLASS_DIARY')} > ${moduleName('CLASS_DIARY')} (Alt+E)`,
    summary: 'Chamada diária, registro das aulas com habilidades BNCC e impressão do diário oficial.',
    faq: [
      {
        q: 'Como imprimo ou exporto o quadro de frequência da turma?',
        a: 'Na aba de frequência, escolha a turma e clique em "Relatório / Exportar", ao lado de "Imprimir Folha do Diário Oficial". O relatório traz, por aluno, as aulas dadas, presenças, faltas, faltas justificadas, o % de frequência e a situação (abaixo do mínimo ou regular).',
        tip: 'O relatório sai com o timbre da Prefeitura, SEMED e escola, e o arquivo recebe nome com a data e a hora.',
      },
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
    title: moduleName('STUDENTS'),
    where: `Menu > ${moduleGroup('STUDENTS')} > ${moduleName('STUDENTS')} (Alt+S)`,
    summary: 'Matrículas, cadastro dos alunos, importação de listas, filtros, impressão e pendências do Censo.',
    faq: [
      {
        q: 'Como transfiro um aluno para outra escola da rede municipal?',
        steps: [
          `Em ${moduleName('STUDENTS')}, na linha do aluno, clique no botão de transferência (setas laranja).`,
          'Escolha "Para escola da rede", a data, a escola de destino e, se já souber, a turma.',
          'Informe o motivo (ex.: mudança de endereço) e clique em "Confirmar transferência".',
        ],
        a: 'O aluno continua com o mesmo cadastro e o mesmo RA e passa para a escola de destino. Notas, frequência e histórico já lançados continuam registrados na escola de origem. A transferência fica gravada na ficha com data, escola e turma de origem e de destino e quem registrou, e aparece no "Histórico de transferências" da mesma janela.',
        tip: 'Usuário lotado numa escola só transfere para a própria escola ou para as anexas dela. A transferência para outra escola da rede é registrada pela Secretaria (usuário sem lotação).',
      },
      {
        q: 'E quando o aluno vai para uma escola de fora da rede, ou chega de fora?',
        a: 'No mesmo botão de transferência: "Para fora da rede" registra a escola de destino (nome, cidade, UF e rede: estadual, particular, outro município, federal) e a situação do aluno passa a "Transferido". "Veio de fora da rede" registra a escola de origem de um aluno que chegou de fora; a escola e a turma atuais não mudam. A Declaração de Transferência passa a trazer a escola de destino e a data.',
      },
      {
        q: 'Como tiro a relação de alunos transferidos entre escolas ou vindos de fora da rede?',
        steps: [
          'Clique em "Mais Filtros" e escolha "Movimentação / Transferências" (o mesmo filtro aparece no painel de "Imprimir lista filtrada").',
          '"Transferidos entre escolas da rede" mostra quem entrou ou saiu da escola escolhida pela rede; "Recebidos" e "Enviados" separam os dois sentidos. "Vindos de fora da rede municipal" e "Transferidos para fora da rede" mostram as movimentações externas.',
          'Clique em "Imprimir lista filtrada" e marque as colunas "Procedência", "Transferência / Destino" e "Data da Transferência". Saem em PDF, Word e Excel.',
        ],
        tip: 'Em "Enviados", o filtro de escola vale pela escola de ORIGEM: aparecem os alunos que saíram dela, mesmo já estando na escola nova.',
      },
      {
        q: 'Por que a cor/raça aparece "Não declarado" e o gênero "Não informado"?',
        a: 'Quando o campo não foi preenchido, o sistema mostra e grava exatamente isso, em vez de assumir "Parda" ou "Feminino" (o que alterava os números do Censo). Abra o cadastro do aluno e escolha a opção correta.',
      },
      {
        q: 'Como matriculo um aluno novo?',
        steps: ['Clique em "Nova Matrícula".', 'Preencha os dados do aluno e do responsável.', 'Escolha a escola e a turma.', 'Salve.'],
        tip: 'Antes, confira se o aluno já não está cadastrado usando a busca (nome, RA ou CPF), para não duplicar. O RA não é digitado: a nuvem entrega o número logo após salvar (até lá aparece como provisório).',
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
      {
        q: 'Como a importação separa as turmas A, B, C de uma mesma série?',
        a: 'Pela letra escrita logo depois da série: no título da tabela ("1º ANO A Nº", "3 ANO B") ou na linha acima dela ("TURMA: PRÉ-ESCOLA I C"). Cada letra vira uma turma própria (ex.: "1º ANO A - MANHÃ", "1º ANO B - MANHÃ"). Sem letra, a série fica numa turma só.',
        tip: 'A turma nova recebe o turno dos alunos dela (coluna TURNO da planilha padrão). Se a mesma série tiver alunos em dois turnos e sem letra, a turma fica com o turno da maioria e a conferência avisa: nesse caso, informe a letra (ex.: 1º ANO A e 1º ANO B). Levantamentos sem coluna de turno entram como MANHÃ.',
      },
      {
        q: 'E se a planilha tiver 1º ANO A, B, C e também alunos só com "1º ANO", sem letra?',
        a: 'Os alunos sem letra ficam numa turma própria, sem letra (ex.: "1º ANO - TARDE"), e as turmas A, B, C continuam com as letras e os alunos delas. A conferência avisa quantos alunos ficaram sem letra em cada série.',
        steps: [
          'Peça à escola a letra correta desses alunos (ex.: 1º ANO E).',
          'Em Turmas, renomeie a turma sem letra, ou corrija a planilha e importe de novo.',
        ],
      },
      {
        q: 'A aba "DADOS DA ESCOLA" da planilha padrão é importada?',
        a: 'Sim. A ficha da escola é lida junto com os alunos: nome, código INEP, CNPJ ou decreto, tipo da unidade, escola sede (se for anexa), endereço, CEP, telefone, e-mail, diretor(a), coordenador(a), secretário(a), salas, horário, internet, turnos e séries atendidas. Escola nova entra com esses dados; escola já cadastrada só tem completados os campos que ainda estavam vazios ou provisórios (o que a secretaria corrigiu à mão não é trocado).',
        steps: [
          'Peça à escola que preencha primeiro a aba DADOS DA ESCOLA e depois a aba ALUNOS.',
          'Importe o arquivo normalmente. Na conferência aparece "Ficha da escola lida" e o que ainda falta na ficha.',
          'O que faltar (ex.: decreto) fica como pendência da escola em Rede Municipal & Polos.',
        ],
        tip: 'Se a linha "ESCOLA:" da aba ALUNOS vier vazia (planilha salva por outro programa), o nome da escola é tirado da ficha.',
      },
      {
        q: 'Qual cidade, CEP e curso o aluno importado recebe?',
        a: 'A planilha padrão não traz cidade nem CEP de cada aluno. Por isso o aluno recebe a cidade, a UF e o CEP da escola dele (aba DADOS DA ESCOLA). O curso vem pela série: Pré-escola e creche ficam em Educação Infantil, 1º ao 5º ano em Ensino Fundamental I, 6º ao 9º ano em Ensino Fundamental II e séries do médio em Ensino Médio.',
        tip: 'Alunos importados por versões antigas com "Belém – PA, CEP 66000-000" são corrigidos para os dados da escola quando a planilha é importada de novo. O endereço exato do aluno continua sendo atualizado no cadastro dele.',
      },
      {
        q: 'Como juntar escolas: ligar uma escola como anexa de outra (escola sede / polo)?',
        a: 'Em Rede Municipal & Polos, edite a escola que vai virar anexa, escolha o tipo "Escola Satélite / Anexa" e, no campo "Escola sede (polo) desta anexa", escolha a escola sede. A anexa continua com as próprias turmas, alunos e INEP; o que muda é o vínculo, que aparece no cartão das duas escolas ("Anexa de..." e "Sede de N anexas") e permite o relatório conjunto.',
        steps: [
          'Para desfazer o vínculo, edite a anexa e mude o tipo dela (ex.: Escola Campo / Rural).',
          'Uma anexa não pode ser sede de outra, e uma escola que já tem anexas não pode virar anexa. Mude primeiro as anexas dela.',
          'A escola sede com anexas não pode ser removida enquanto as anexas estiverem ligadas a ela.',
        ],
        tip: 'Juntar não mistura os cadastros: os alunos continuam matriculados na escola deles. Para mudar um aluno de escola, edite o cadastro dele.',
      },
      {
        q: 'Como a escola anexa fica ligada à escola sede na importação?',
        a: 'Pela ficha da anexa: tipo da unidade ESCOLA ANEXA e, em "Escola sede", o nome da escola principal. A escola sede não precisa informar suas anexas. Se a sede ainda não foi importada, o vínculo é feito pelo nome e a conferência avisa para importar a planilha dela também.',
        tip: 'Se a ficha trouxer escola sede, mas o tipo não for ESCOLA ANEXA, a conferência avisa e o vínculo não é feito. Para as demais escolas, o campo "Escola sede" fica em branco.',
      },
      {
        q: 'Como informo um aluno com mais de uma deficiência na planilha?',
        a: 'A deficiência principal vai em PCD / DEFICIÊNCIA e as outras em DEFICIÊNCIA ADICIONAL 1 e 2. Na importação, as deficiências são juntas no cadastro do aluno (ex.: "DEFICIÊNCIA FÍSICA + BAIXA VISÃO") e cada uma entra na lista de necessidades especiais.',
      },
      {
        q: 'Quais pendências a importação marca nos alunos?',
        steps: [
          'Data de Nascimento: data vazia, fora do calendário (ex.: 31/02), antes de 1920 (ex.: 14/11/1018) ou no futuro.',
          'Conferir data de nascimento / série: idade muito fora da série, como 4 anos no 3º ano ou um adulto no 9º ano. Atraso escolar comum (1 a 5 anos) não entra.',
          'Possível cadastro duplicado: o aluno aparece mais de uma vez no arquivo (mesmo nome e nascimento). Ele entra uma vez só e a pendência diz em qual outra turma apareceu.',
          'Também: endereço, raça/cor, sexo, laudo de PCD e CPF / Certidão.',
        ],
        tip: 'Todas aparecem em "Pendências Censo". Ao abrir o aluno, corrigir e salvar, as pendências de conferência saem. O sistema não aceita salvar ano de nascimento antes de 1920.',
      },
      {
        q: 'Importei antes da correção e as turmas A, B, C ficaram juntas. Como arrumo?',
        steps: [
          'Importe de novo o mesmo arquivo da escola. Não precisa apagar nada.',
          'Na conferência, o rodapé mostra que os alunos "já cadastrados" serão atualizados, sem duplicar.',
          'Confirme: cada aluno vai para a turma da letra dele (1º ANO A, B, C...).',
          'Em Turmas & Matrizes, exclua as turmas antigas sem letra, que ficaram vazias.',
        ],
      },
      {
        q: 'Um aluno aparece repetido no arquivo. O que acontece?',
        a: 'Aluno com o mesmo nome e a mesma data de nascimento entra uma vez só (a nuvem não aceita o mesmo aluno duas vezes na escola). A conferência avisa quem está repetido e em quais turmas, e o aluno fica com a pendência "Possível cadastro duplicado", para a escola confirmar em qual turma ele realmente estuda.',
      },
      {
        q: 'A planilha de uma escola traz um aluno que já está matriculado em outra escola. Ele é transferido?',
        a: 'Não. A importação nunca transfere sozinha um aluno de outra escola. Ele continua na escola onde já estava, com o mesmo RA, e ganha a pendência "Matrícula em duas escolas", dizendo em qual planilha também apareceu. Na conferência, o rodapé mostra quantos alunos estão nessa situação.',
        steps: [
          'Confira com as duas escolas onde o aluno estuda de verdade.',
          'Se ele mudou de escola, abra o cadastro dele e troque a escola e a turma.',
          'Ao salvar o cadastro conferido, a pendência sai.',
        ],
      },
      {
        q: 'A mesma escola apareceu duas vezes com nomes diferentes. Como junto?',
        a: 'A importação entende que EMEIF, E.M.E.I.F e "Escola Municipal de Ensino Infantil e Fundamental" são a mesma coisa (o mesmo vale para EMEF e EMEI), então isso não se repete nas próximas importações.',
        steps: [
          'Em Turmas & Matrizes, edite cada turma da escola repetida e troque a Escola para a escola correta. Os alunos da turma vão junto.',
          'Com a escola repetida sem turmas e sem alunos, remova-a em Rede Municipal & Polos.',
        ],
      },
      {
        q: 'O arquivo tem uma escola anexa. Ela é importada separada?',
        a: 'Sim. Uma linha "ESCOLA ANEXO: nome" ou só "ANEXO nome" antes das tabelas abre a escola anexa. Ela vira uma escola própria, ligada à escola principal, com as turmas e os alunos dela. Na planilha padrão, cada anexa vem em arquivo próprio, com a escola sede informada na aba DADOS DA ESCOLA.',
      },
      { q: 'Como edito ou corrijo o cadastro de um aluno?', a: 'Na lista, clique no lápis (Editar) na linha do aluno, altere e salve.' },
      { q: 'Como encontro alunos com pendências no Censo?', a: 'Use o atalho "Pendências Censo" acima da lista, ou "Mais Filtros" > Situação Cadastral. Clique em "Completar" para corrigir o que falta.' },
      { q: 'Como imprimo ou exporto a lista?', a: 'Filtre a lista como quiser e clique em "Imprimir lista filtrada" ou "Exportar CSV".' },
      {
        q: 'Como gero o Relatório de Matrículas e Enturmação só com o que preciso?',
        steps: [
          'Em Secretaria & Alunos, clique em "Gerar Relatório".',
          'Em "Filtros do relatório", escolha Escola, Série, Turno e Turma (ou deixe "Todas"). Escolha também se aparece a linha "Sem enturmação" (alunos sem turma).',
          'Em "Colunas do Relatório", marque só as informações que devem sair: série, turma, turno, matriculados, ativos, masculino/feminino, transferidos, evadidos, concluídos, trancados, capacidade, vagas, ocupação, sala, professor(a) regente e escola.',
          'Clique em "Imprimir / Salvar em PDF" (na janela de impressão escolha "Salvar como PDF" para enviar) ou exporte em Excel, Word ou CSV.',
        ],
        tip: 'Cada escola sai em página própria, com o timbre, os totais da escola (matriculados, ativos, sexo, vagas) e o campo "Conferido por / Data / Assinatura". Os filtros deste relatório são próprios: não mudam a lista de alunos da tela.',
      },
      { q: 'Como emito declaração, histórico ou boletim de um aluno?', a: 'Clique no ícone de documentos na linha do aluno. O sistema abre "Documentos & Certificados" já com ele selecionado.' },
      {
        q: 'O CPF do aluno é obrigatório?',
        a: 'O aluno pode ser salvo sem o CPF, mas fica com a pendência "CPF do Aluno" até o número ser informado. Quando o CPF é digitado, o sistema confere os números: CPF inválido não é aceito. Abaixo do campo aparece "✓ CPF válido" ou o que precisa corrigir.',
        tip: 'Para achar quem está sem CPF (ou com CPF inválido vindo de planilha), use "Pendências Censo" e o filtro "Sem CPF ou CPF inválido".',
      },
      { q: 'Onde vejo a idade do aluno?', a: 'Ao preencher a data de nascimento, a idade aparece ao lado do campo. Na lista de alunos, a coluna "Data Nasc. (idade)" mostra as duas informações. Data de nascimento no futuro não é aceita.' },
    ],
  },
  {
    id: 'CLASSES',
    title: moduleName('CLASSES'),
    where: `Menu > ${moduleGroup('CLASSES')} > ${moduleName('CLASSES')} (Alt+T)`,
    summary: 'Cadastro das turmas, vagas, professor regente e matriz curricular (disciplinas).',
    faq: [
      {
        q: 'O que faz o botão "Revisar vínculos"?',
        a: 'Procura turmas sem escola, alunos sem escola ou com escola inexistente, nomes de turma que levam o nome da escola ("ESCOLA X - PRÉ I") e registros repetidos de importação. Mostra a lista do que seria corrigido e só aplica se você confirmar. Somente o administrador pode aplicar.',
        tip: 'Antes essa arrumação rodava sozinha em todos os computadores a cada alteração; agora roda na importação e quando o administrador pede.',
      },
      { q: 'Como cadastro uma turma?', steps: ['Clique em "Cadastrar Nova Turma".', 'Informe escola, série, turno, sala e capacidade.', 'Salve.'], tip: 'Use sempre o mesmo padrão de série (ex.: "1º ANO"). Provas e relatórios agrupam as turmas pela série.' },
      { q: 'Por que a lista de disciplinas das provas está incompleta?', a: 'As disciplinas vêm da Matriz Curricular. Cadastre aqui as disciplinas oficiais da rede. Enquanto isso, o sistema oferece os componentes padrão da BNCC.' },
      { q: 'Como vejo as vagas livres?', a: 'A tabela mostra matriculados, capacidade e vagas remanescentes de cada turma.' },
      { q: 'Se eu trocar a escola de uma turma, os alunos vão junto?', a: 'Sim. Ao editar a turma e escolher outra escola, todos os alunos matriculados nela passam para a nova escola. Use isso para juntar uma escola que entrou repetida na importação.', tip: 'Se a turma já foi trocada antes e os alunos ficaram na escola antiga, basta abrir a turma, clicar em editar e salvar de novo: os alunos acompanham a escola da turma.' },
      { q: 'Como vejo só as turmas de uma escola, de uma série ou de um ano letivo?', a: 'Use os filtros acima da lista: Escola, Série, Ano letivo e Turno. Eles podem ser combinados (ex.: escola ZILDA + série 1º ANO). "Limpar filtros" mostra tudo de novo. A impressão e o CSV saem com os filtros aplicados.' },
    ],
  },
  {
    id: 'DROPOUT_CENSUS',
    title: moduleName('DROPOUT_CENSUS'),
    where: `Menu > ${moduleGroup('DROPOUT_CENSUS')} > ${moduleName('DROPOUT_CENSUS')} (Alt+C)`,
    summary: 'Acompanhamento de alunos evadidos ou em risco, visitas, resgate e exportação para o Educacenso.',
    faq: [
      {
        q: 'O que significam "Sem intervenção registrada" e "Sem data de nascimento" nos gráficos?',
        a: 'Aluno evadido sem nenhuma ação da Busca Ativa registrada aparece como "Sem intervenção registrada" (antes era contado como "Em Busca Ativa"). Aluno sem data de nascimento fica na faixa "Sem data de nascimento" (antes entrava como se tivesse 12 anos). A comparação Rural x Urbana usa só a zona informada no cadastro. "Acionar Conselho" agora também marca o aluno como notificado ao Conselho Tutelar.',
      },
      {
        q: 'Como funciona o alerta de risco de evasão por faltas?',
        a: 'O sistema conta as faltas SEM justificativa de cada aluno lançadas no Diário & Frequência (falta justificada não conta). Quando o aluno atinge o limite definido, ele entra no painel "Risco de evasão por faltas sem justificativa" deste módulo, aparece no cartão de risco do Início, gera um aviso na Central de Notificações e abre uma janela de atenção na tela de quem acompanha o Censo. Alunos transferidos, concluintes ou já evadidos não entram na conta.',
        tip: 'Quem está lotado numa escola vê só os alunos dela; a Secretaria e o Master veem a rede toda.',
      },
      {
        q: 'Como defino o limite de faltas do alerta?',
        steps: [
          'Abra este módulo e clique em "Critério do alerta", no painel de risco.',
          'Informe o limite de faltas sem justificativa (ex.: 10).',
          'Escolha como contar: dias com falta (várias aulas no mesmo dia contam 1) ou cada aula.',
          'Escolha o período: ano letivo inteiro ou só os últimos dias (ex.: 30).',
          'Ajuste a partir de qual percentual do limite o aluno aparece "em atenção" (padrão: 80%).',
          'Clique em "Salvar critério". Vale para toda a rede.',
        ],
        tip: 'Só quem pode alterar em Secretaria & Alunos muda o critério. O padrão é 10 dias com falta sem justificativa no ano letivo.',
      },
      {
        q: 'O que faço quando aparece a janela "Atenção: risco de evasão"?',
        a: 'Clique em "Ver alunos e abrir busca ativa": o sistema abre este módulo no painel de risco. Em cada aluno, "Abrir busca ativa" abre a ficha para registrar o contato com a família. "Ciente" fecha a janela; ela volta a aparecer se outro aluno atingir o limite ou se um aluno já avisado somar novas faltas.',
      },
      {
        q: 'Um aluno está no alerta, mas as faltas dele foram justificadas.',
        a: 'Corrija a frequência no Diário & Frequência, marcando "Falta justificada" com o motivo. O alerta recalcula na hora e o aluno sai da lista se ficar abaixo do limite.',
      },
      {
        q: 'Como vejo os gráficos de evasão de uma escola só?',
        a: 'Acima dos gráficos há a barra "Filtrar": escolha a escola, a etapa/série e o turno. Os gráficos e indicadores passam a mostrar só aquele recorte, e ao lado aparece quantos registros entraram. "Limpar" volta para a rede toda. O gráfico "por turma" mostra só as turmas que têm evadidos, da maior para a menor (até 25), com o nome da escola quando há mais de uma.',
      },
      {
        q: 'Como gero a relação de evadidos por escola?',
        steps: ['Aplique os filtros da tela (busca, escola, turma, situação etc.).', 'Clique no botão verde "Relatório".', 'Marque as colunas que quer no relatório (as mais usadas já vêm marcadas).', 'Confira a pré-visualização.', 'Escolha: "Imprimir / Salvar em PDF", "Excel", "Word" ou "CSV".'],
        a: 'Clique no botão verde "Relatório / Exportar". Os estudantes evadidos (conforme os filtros da tela) saem separados por escola, cada uma com o seu timbre, com turma, responsável, telefone, data e motivo da evasão, situação da busca ativa e aviso ao Conselho Tutelar. O CSV do Censo agora traz a escola real de cada aluno.',
      },
      { q: 'Como registro uma visita ou contato com a família?', steps: ['Abra a ficha do aluno ("Ficha & Resgate").', 'Clique em "Registrar Nova Ação / Visita Domiciliar".', 'Descreva o que foi feito e clique em "Salvar Registro na Ficha".'] },
      { q: 'O aluno voltou a estudar. O que faço?', a: 'Na ficha, use "Resgatar & Reinserir". O aluno volta a ficar ativo.' },
      { q: 'Quando acionar o Conselho Tutelar?', a: 'Use "Acionar Conselho" quando as faltas passarem do limite da normativa e as tentativas de contato não resolverem. O registro fica guardado na ficha.' },
      { q: 'Como gero o arquivo do Censo?', a: 'Clique em "Exportar Censo CSV (Educacenso)" ou "Imprimir Censo (.PDF)".' },
    ],
  },
  {
    id: 'DOCUMENTS',
    title: moduleName('DOCUMENTS'),
    where: `Menu > ${moduleGroup('DOCUMENTS')} > ${moduleName('DOCUMENTS')} (Alt+O)`,
    summary: 'Emissão de declaração de matrícula, declaração de transferência, histórico escolar, boletim e certificado de conclusão.',
    faq: [
      {
        q: 'Apareceu um aviso amarelo antes de imprimir o certificado ou a declaração. O que é?',
        a: 'O certificado afirma que o aluno concluiu o curso e a declaração afirma matrícula regular. Se o histórico não registra "Aprovado" ou se a situação do aluno não é "Ativo", o sistema avisa para conferir antes de emitir. O aviso não sai na impressão. Ano letivo, faltas e médias vêm do cadastro; o que não foi lançado aparece como "-".',
      },
      {
        q: 'O boletim sai sem disciplinas. De onde vêm as notas?',
        a: 'O boletim e o histórico usam as notas do Diário de Notas da turma do aluno (lançadas pelos professores por bimestre) e, quando houver, as do histórico escolar. Nota não lançada aparece como "-". A frequência é calculada pelas chamadas registradas; sem chamadas, aparece "sem registro". O documento nunca usa as notas de outro aluno.',
      },
      {
        q: 'O boletim (ou a declaração) está saindo em duas páginas.',
        a: 'Foi corrigido. Boletim, declarações e certificado agora cabem sempre em uma folha A4: quando o conteúdo passa da página (por exemplo, um boletim com muitas disciplinas), o documento é reduzido na medida certa, mantendo o layout, o timbre e as margens. O histórico escolar continua podendo ter mais de uma página. O rodapé do boletim passou a trazer "Emitido eletronicamente pelo SucessoEdu".',
      },
      { q: 'Como emito um documento?', steps: ['Escolha o aluno.', 'Escolha o tipo de documento.', 'Confira os dados na prévia.', 'Clique em "Imprimir / Gerar PDF".'] },
      {
        q: 'Como sai o documento impresso ou em PDF? Qual o nome do arquivo?',
        a: 'Só a folha do documento é impressa, sem a tela do sistema em volta (sem barra de rolagem e sem cortar o topo). A folha segue a ABNT: margens de 3 cm em cima e à esquerda e 2 cm embaixo e à direita, letra Arial 12, entrelinha 1,5, texto justificado e número da página no alto à direita. Ao escolher "Salvar como PDF", o nome já vem pronto e diferente a cada documento: tipo + aluno + data e hora, por exemplo "Historico_Escolar_BEKORO_KAYAPO_28-09-2026_064712.pdf".',
        tip: 'A data de nascimento sai no formato dd/mm/aaaa e o CPF em branco aparece como "Não informado". Os relatórios (Excel, Word, CSV e PDF) também ganham nome com o relatório, a escola/turma filtrada e a data e hora, para um arquivo não substituir o outro.',
      },
      { q: 'O nome da escola ou do diretor está errado no documento.', a: 'Corrija os dados da escola em Secretaria & Alunos > "Editar Dados da Escola". O documento usa esses dados.' },
      {
        q: 'Quais logos aparecem nos documentos e relatórios?',
        a: 'Todo documento, relatório, impressão, PDF e Word sai com o mesmo timbre: logo da Gestão Municipal (Prefeitura) à esquerda; nome da Prefeitura, da Secretaria e da escola no centro; logo da SEMED e, se houver, a logo da escola à direita. As logos vêm dos cadastros da Rede Municipal & Polos.',
        tip: 'Sem logo cadastrada, o espaço fica em branco e o documento sai normalmente, só com os nomes.',
      },
    ],
  },
  {
    id: 'PEDAGOGICAL_DASHBOARD',
    title: moduleName('PEDAGOGICAL_DASHBOARD'),
    where: `Menu > ${moduleGroup('PEDAGOGICAL_DASHBOARD')} > ${moduleName('PEDAGOGICAL_DASHBOARD')} (Alt+R)`,
    summary: 'Painel com médias, aprovação, acertos por questão e evolução dos alunos e turmas.',
    faq: [
      {
        q: 'Onde foi parar o quadro "Sobre a Engenharia do Sistema & Dash Boxes"?',
        a: 'Foi retirado em 03/10/2026: era um cartão de apresentação técnica, sem informação para o trabalho pedagógico. Ele também saiu da lista de quadros do botão de personalizar o painel. Nenhum dado foi alterado.',
      },
      {
        q: 'De onde vêm as notas dos gráficos da Evolução Pedagógica?',
        a: 'Das notas que os professores lançam no Diário de Notas (Portal do Professor > Notas), por turma, disciplina e bimestre, somadas às do histórico escolar quando houver. Onde não há nota lançada, aparece "—" ou "Sem notas lançadas": o sistema não mostra mais números de exemplo. A média mínima usada é 6,0.',
        tip: 'Se um aluno ou turma aparece sem notas, confira se o professor salvou a folha de notas do bimestre.',
      },
      {
        q: 'Como comparo as turmas de uma escola?',
        steps: ['Abra "Matriz Comparativa".', 'Na barra "Filtrar", escolha a escola (e, se quiser, a série e o turno).', 'O gráfico mostra a média de cada turma, da maior para a menor.', 'A tabela abaixo traz a média de cada bimestre, a média geral e a % de alunos com média 6,0 ou mais.'],
        a: 'Só entram no gráfico as turmas que já têm notas lançadas; as demais aparecem na tabela com "—".',
      },
      {
        q: 'O que mostra o diagnóstico do aluno?',
        a: 'Em "Por Estudante", o quadro de diagnóstico lista as disciplinas com média 8,0 ou mais (melhores resultados) e as que estão abaixo de 6,0 (precisam de reforço), com as médias do aluno. A frequência vem do histórico escolar; sem registro, aparece "—".',
      },
      { q: 'Por que o painel está vazio?', a: 'O painel usa as provas corrigidas. Monte a prova em "Elaboração de Provas" e lance as respostas ("Lançar respostas") ou aplique pelo computador.' },
      { q: 'Posso escolher o que aparece no painel?', a: 'Sim. Use "Configurar Dash Boxes" para mostrar ou esconder os cartões, e "Gerar Gráficos Personalizados" para montar gráficos.' },
    ],
  },
  {
    id: 'BNCC_SKILLS',
    title: moduleName('BNCC_SKILLS'),
    where: `Menu > ${moduleGroup('BNCC_SKILLS')} > ${moduleName('BNCC_SKILLS')}`,
    summary: 'Lançamento do nível de cada habilidade por aluno e bimestre, desempenho nas provas, relatórios, gráficos e catálogo.',
    faq: [
      {
        q: 'As planilhas do BNCC saem com o timbre?',
        a: 'Sim. O relatório de habilidades da turma, o catálogo, os lançamentos e o desempenho nas provas saem em Excel com o timbre da Prefeitura, SEMED e escola, título e data. O desempenho nas provas tem uma aba "Resumo por habilidade" e outra "Por aluno". Os modelos para preencher (catálogo e lançamento) continuam simples.',
        tip: 'Uma planilha de lançamentos exportada pelo sistema pode ser importada de volta: a importação encontra sozinha a linha do cabeçalho, abaixo do timbre.',
      },
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
    title: moduleName('ASSESSMENT_REPORT'),
    where: `Menu > ${moduleGroup('ASSESSMENT_REPORT')} > ${moduleName('ASSESSMENT_REPORT')}`,
    summary: 'Resultados das avaliações por escola, série e nível de proficiência, com relatório oficial para impressão.',
    faq: [
      {
        q: 'Como imprimo os resultados por estudante?',
        steps: ['Aplique os filtros da tela (busca, escola, turma, situação etc.).', 'Clique no botão verde "Relatório".', 'Marque as colunas que quer no relatório (as mais usadas já vêm marcadas).', 'Confira a pré-visualização.', 'Escolha: "Imprimir / Salvar em PDF", "Excel", "Word" ou "CSV".'],
        a: 'Clique em "Relatório". Os resultados filtrados saem separados por escola, com estudante, turma, avaliação, disciplina, nota, aproveitamento e proficiência.',
        tip: 'O relatório sai com o timbre da Prefeitura, SEMED e escola, e o arquivo recebe nome com a data e a hora.',
      },
      { q: 'Como comparo escolas ou séries?', a: 'Use os filtros de Unidade Escolar, Nível / Etapa e Instrumento de Avaliação. A área "Comparativo por Nível Escolar" mostra lado a lado.' },
      { q: 'Como imprimo?', a: 'Clique em "Imprimir Relatório Oficial (A4)" ou "Exportar CSV".' },
    ],
  },
  {
    id: 'EXAMS',
    title: moduleName('EXAMS'),
    where: `Menu > ${moduleGroup('EXAMS')} > ${moduleName('EXAMS')} (Alt+P)`,
    summary: 'Montar provas a partir do banco de questões, imprimir caderno e gabarito, lançar as respostas da prova de papel e ver resultados.',
    faq: [
      {
        q: 'Como tiro a relação das provas?',
        steps: ['Aplique os filtros da tela (busca, escola, turma, situação etc.).', 'Clique no botão verde "Relatório".', 'Marque as colunas que quer no relatório (as mais usadas já vêm marcadas).', 'Confira a pré-visualização.', 'Escolha: "Imprimir / Salvar em PDF", "Excel", "Word" ou "CSV".'],
        a: 'Clique em "Relatório". As provas listadas na tela saem separadas por escola, com disciplina, turma, professor(a), número de questões, valor, data, situação e quantas respostas já foram lançadas.',
        tip: 'O relatório sai com o timbre da Prefeitura, SEMED e escola, e o arquivo recebe nome com a data e a hora.',
      },
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
    title: moduleName('QUESTION_BANK'),
    where: `Menu > ${moduleGroup('QUESTION_BANK')} > ${moduleName('QUESTION_BANK')}`,
    summary: 'Cadastro de questões com gabarito e habilidades BNCC, impressão e importação.',
    faq: [
      {
        q: 'Por que algumas questões não entraram na importação?',
        a: 'Questão objetiva sem gabarito, sem alternativas ou sem enunciado não é importada: o sistema não escolhe mais a "Alternativa A" como certa por conta própria. Inclua a linha "Gabarito: X" (no texto) ou a coluna de gabarito (na planilha) e importe de novo. O sistema avisa quantas ficaram de fora.',
      },
      {
        q: 'Como exporto a relação de questões?',
        steps: ['Aplique os filtros da tela (busca, escola, turma, situação etc.).', 'Clique no botão verde "Relatório".', 'Marque as colunas que quer no relatório (as mais usadas já vêm marcadas).', 'Confira a pré-visualização.', 'Escolha: "Imprimir / Salvar em PDF", "Excel", "Word" ou "CSV".'],
        a: 'Clique em "Relatório". As questões filtradas na tela saem com código, disciplina, tópico, dificuldade, tipo e habilidade BNCC. O enunciado e o gabarito podem ser incluídos marcando essas colunas.',
      },
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
    title: moduleName('MUNICIPAL_SYNC'),
    where: `Menu > ${moduleGroup('MUNICIPAL_SYNC')} > ${moduleName('MUNICIPAL_SYNC')}`,
    summary: 'Escolas da rede, envio de lotes das escolas para a Sede e consolidação na Secretaria.',
    faq: [
      {
        q: 'Enviei a logo da escola e ela não aparecia nos documentos. Já foi corrigido?',
        a: 'Sim (03/10/2026). O cadastro da escola não gravava a logo ao salvar: a imagem aparecia no formulário, mas ficava de fora do registro. Agora a logo enviada é gravada, vai para a nuvem e aparece no timbre de todos os documentos e relatórios da escola, à direita, junto da logo da SEMED.',
        steps: [
          'Abra Rede Municipal & Polos e clique no lápis (Editar Unidade Escolar) da escola.',
          'Em "Logo da Escola", clique em "Enviar Logo da Escola" e escolha a imagem (PNG, JPG, SVG ou WebP, até 3 MB).',
          'Clique em Salvar.',
          'Gere um relatório da escola e confira a logo no timbre.',
        ],
        tip: 'Logos enviadas antes desta correção não foram gravadas: é preciso enviá-las de novo uma vez.',
      },
      {
        q: 'Como cadastro mais de um(a) coordenador(a) pedagógico(a) na escola?',
        steps: [
          'No cadastro da escola (Editar Unidade Escolar), vá em "Corpo Diretivo & Gestão Pedagógica".',
          'Clique em "Adicionar coordenador(a)" para abrir mais um campo.',
          'Digite um nome em cada campo (a lixeira remove um nome) e salve.',
        ],
        a: 'Escolas que tinham os dois nomes no mesmo campo (ex.: "Simone Menezes e Wandicleia Mota de Medeiros") já abrem com um campo para cada nome. Nos relatórios, cada coordenador(a) sai com a sua própria linha de assinatura.',
      },
      {
        q: 'Quem assina os relatórios da escola?',
        steps: [
          'Módulos pedagógicos (Portal do Professor, Diário & Frequência, Evolução Pedagógica, Habilidades BNCC, Resultados Nível & Escola, Elaboração de Provas e Banco de Questões BNCC): o(a) Coordenador(a) Pedagógico(a). Com dois coordenadores, sai uma linha para cada um.',
          'Secretaria (Visão Geral / Dashbox, Secretaria & Alunos, Turmas & Matrizes, Censo de Evasão & Busca Ativa e Documentos & Certificados): o(a) Secretário(a) Escolar e o(a) Diretor(a).',
          'Comunicação (comunicados e WhatsApp): o(a) Diretor(a).',
          'Relatório da rede inteira (sem uma escola escolhida): o(a) titular da Secretaria de Educação, como antes.',
        ],
        a: 'Os nomes vêm do cadastro da escola em Rede Municipal & Polos (Corpo Diretivo & Gestão Pedagógica). Se o campo estiver vazio, assina o(a) Diretor(a). Documentos que já trazem a própria assinatura (declarações, boletins etc.) continuam como estão.',
        tip: 'Para a Sede, a escola do relatório é a escolhida no filtro do relatório ou a escola em foco no alto da tela.',
      },
      {
        q: 'Toda escola fica vinculada à SEMED?',
        a: 'Sim. O sistema controla toda a rede municipal de educação, então toda escola cadastrada (inclusive anexas e as criadas pela importação de planilhas) fica vinculada à SEMED por padrão. Só deixa de constar como vinculada se alguém desmarcar o vínculo no cadastro da escola.',
      },
      {
        q: 'Por que o número de docentes de uma escola está 0?',
        a: 'Porque ainda não há professor cadastrado para ela. O número vem dos cadastros: cadastre o professor em Usuários (papel Professor, lotado na escola) ou informe o professor nas disciplinas/turmas da escola. Não é mais um número digitado à mão no cadastro da escola.',
      },
      {
        q: 'De onde vêm os números do Censo e do Quadro de Desempenho?',
        a: 'Somente dos dados lançados no sistema; nada é estimado. Matrículas e turmas: alunos ativos e turmas cadastradas em cada escola. Educação Especial: alunos com AEE, condição especial, necessidade ou CID marcados no cadastro. Docentes: contados automaticamente pelos professores cadastrados — contas de usuário com papel de professor lotadas na escola, professores das disciplinas das turmas da escola e o professor regente de cada turma (cada pessoa conta uma vez). A coluna Cadastro mostra "INEP PENDENTE" quando a escola não tem código INEP de 8 dígitos e quantos alunos têm pendências no cadastro. No Quadro de Desempenho, as médias (geral, Língua Portuguesa e Matemática) são calculadas só com as notas já lançadas nos diários; enquanto não houver notas, aparece "Ainda não há notas lançadas na rede". IDEB, taxa de aprovação, transporte e alimentação escolar foram retirados porque não há esses dados no sistema (o IDEB é divulgado pelo INEP/MEC).',
      },
      {
        q: 'Como tiro a relação das escolas da rede?',
        steps: ['Aplique os filtros da tela (busca, escola, turma, situação etc.).', 'Clique no botão verde "Relatório".', 'Marque as colunas que quer no relatório (as mais usadas já vêm marcadas).', 'Confira a pré-visualização.', 'Escolha: "Imprimir / Salvar em PDF", "Excel", "Word" ou "CSV".'],
        a: 'Na lista de unidades escolares, clique em "Relatório". Saem as escolas filtradas na tela com INEP, zona, diretor(a), telefone e a quantidade de turmas e de alunos ativos contada pelos cadastros atuais. Endereço, e-mail, coordenação e secretaria podem ser incluídos marcando as colunas.',
      },
      {
        q: 'Onde cadastro as logos da Prefeitura (gestão atual), da SEMED e das escolas?',
        steps: [
          'Gestão e SEMED: aqui em Rede Municipal & Polos, clique em "Editar SEMED" (ou "Editar Dados SEMED").',
          'Em "1. Logo da Gestão / Brasão Municipal", clique em "Enviar Logo Gestão / Brasão" e escolha a imagem.',
          'Em "Logo SEMED", clique em "Enviar Logo SEMED". Salve.',
          'Escola: edite a escola na lista e, em "1. Logo / Brasão da Escola", clique em "Enviar Logo da Escola". Salve.',
        ],
        tip: 'Use PNG com fundo transparente. O sistema reduz a imagem automaticamente. As logos vão para a nuvem e passam a sair em todos os documentos e relatórios.',
      },
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
      {
        q: 'Como excluo uma escola da rede?',
        steps: [
          'Transfira antes os alunos da escola para a escola correta (a exclusão é bloqueada enquanto houver aluno vinculado).',
          'Na lista de escolas, clique no ícone da lixeira da escola.',
          'Confirme. As turmas vazias da escola saem junto.',
        ],
        tip: 'A exclusão vale para todos os computadores: a escola some das listas de Alunos, Censo, BNCC e documentos depois da próxima sincronização. Uma escola excluída não volta, mesmo que outro computador tenha uma cópia antiga.',
      },
      {
        q: 'A Certidão de Vínculo saiu cortada na margem direita.',
        a: 'Foi corrigido. A tabela da certidão agora tem largura fixa por coluna e o texto quebra dentro da célula, no tamanho da folha A4 (padrão ABNT). Em listas longas o cabeçalho da tabela se repete na página seguinte e nenhuma escola fica partida entre duas folhas.',
        tip: 'Use "Imprimir / Salvar PDF" dentro da certidão. No diálogo de impressão, deixe "Tamanho do papel: A4" e "Escala: Padrão".',
      },
    ],
  },
  {
    id: 'COMMUNICATION',
    title: moduleName('COMMUNICATION'),
    where: `Menu > ${moduleGroup('COMMUNICATION')} > ${moduleName('COMMUNICATION')} (ou pelo botão de mesmo nome no Início)`,
    summary: 'Mural de comunicados para professores, alunos e famílias, com anexos e confirmação de leitura.',
    faq: [
      {
        q: 'Como imprimo a relação de comunicados?',
        steps: ['Aplique os filtros da tela (busca, escola, turma, situação etc.).', 'Clique no botão verde "Relatório".', 'Marque as colunas que quer no relatório (as mais usadas já vêm marcadas).', 'Confira a pré-visualização.', 'Escolha: "Imprimir / Salvar em PDF", "Excel", "Word" ou "CSV".'],
        a: 'Clique em "Relatório". Os comunicados filtrados na tela saem com data, título, categoria, prioridade, remetente, destinatários e número de leituras. O texto do comunicado pode ser incluído marcando a coluna "Texto".',
      },
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
    title: moduleName('WHATSAPP'),
    where: `Menu > ${moduleGroup('WHATSAPP')} > ${moduleName('WHATSAPP')} (ou pelo Mural, no botão "Enviar por WhatsApp")`,
    summary:
      'Envio assistido: o sistema monta a lista e abre cada conversa com a mensagem pronta; você aperta Enviar no WhatsApp da escola.',
    faq: [
      {
        q: 'Como imprimo ou exporto o histórico de envios?',
        steps: ['Aplique os filtros da tela (busca, escola, turma, situação etc.).', 'Clique no botão verde "Relatório".', 'Marque as colunas que quer no relatório (as mais usadas já vêm marcadas).', 'Confira a pré-visualização.', 'Escolha: "Imprimir / Salvar em PDF", "Excel", "Word" ou "CSV".'],
        a: 'Na aba Histórico, use a busca e a situação e clique em "Relatório". Saem data, destinatário, telefone, aluno, tipo, situação e quem enviou. A mensagem pode ser incluída marcando a coluna "Mensagem".',
      },
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
      {
        q: 'O botão "Preparar envio" está apagado e não faz nada',
        a: 'Logo abaixo do botão aparece, em laranja, o que está faltando. Os motivos possíveis são: público não escolhido em "1. Para quem" (a turma ou o aluno); ninguém da escolha tem telefone cadastrado; mensagem em branco; ou um campo do modelo ainda sem valor, como {{data_reuniao}} ou {{horario}}. Resolva o que a mensagem pede e o botão libera.',
        tip: 'Para um teste rápido: escolha "Um aluno" que tenha telefone, clique no modelo "Comunicado geral" e complete o texto.',
      },
      {
        q: 'O modelo tem {{data_reuniao}}, {{horario}} ou {{prazo}}. O que faço?',
        a: 'Esses campos o sistema não sabe preencher sozinho. Troque cada um pelo valor real no texto (por exemplo, {{data_reuniao}} por 10/10). Nome do aluno, responsável, turma, escola, telefone da escola e data de hoje são preenchidos automaticamente.',
      },
      { q: 'Preciso conectar alguma conta de WhatsApp no sistema?', a: 'Não. O sistema usa o WhatsApp de quem está operando. Basta deixar o WhatsApp Web conectado no computador (leia o QR Code com o celular da escola uma vez) ou usar o aplicativo WhatsApp do computador.' },
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
    title: moduleName('USER_CONTROL'),
    where: `Menu > ${moduleGroup('USER_CONTROL')} > ${moduleName('USER_CONTROL')}`,
    summary: 'Contas de acesso, perfis (Secretaria, Professor, Coordenação, Direção, SME) e permissões por módulo.',
    faq: [
      {
        q: 'Como tiro a relação de usuários do sistema?',
        steps: ['Aplique os filtros da tela (busca, escola, turma, situação etc.).', 'Clique no botão verde "Relatório".', 'Marque as colunas que quer no relatório (as mais usadas já vêm marcadas).', 'Confira a pré-visualização.', 'Escolha: "Imprimir / Salvar em PDF", "Excel", "Word" ou "CSV".'],
        a: 'Clique em "Relatório", ao lado de "Adicionar Novo Usuário". Saem os usuários da busca/setor escolhidos, com login, e-mail, setor, cargo e situação (ativo/inativo).',
      },
      {
        q: 'Onde defino o cargo que aparece embaixo do nome, no alto da tela?',
        a: 'Edite o usuário e preencha "Título / Cargo Personalizado" (ex.: Coordenação Pedagógica, Secretária Escolar, Diretor). É esse texto que aparece embaixo do nome no alto da tela e na assinatura dos documentos.',
      },
      { q: 'Como crio o acesso de um professor ou funcionário?', steps: ['Clique em "Novo Usuário".', 'Informe nome, login, e-mail e perfil.', 'Escolha a escola.', 'Defina uma senha (ou gere uma) e salve.', 'Entregue o login e a senha à pessoa.'] },
      { q: 'Como tiro o acesso de alguém?', a: 'Edite o usuário e desative, ou exclua. Prefira desativar: o histórico continua ligado ao nome.' },
      {
        q: 'Como funciona o bloqueio de tela e a troca de usuário?',
        steps: [
          'Bloquear agora: clique no seu nome no alto da tela > "Bloquear tela", ou "Bloquear Tela" no menu lateral, ou Ctrl+Shift+L.',
          'Bloqueio por falta de uso: no mesmo menu, em "Bloquear sem uso após", escolha 5, 10, 15, 30 minutos, 1 hora ou Nunca (padrão: 15 minutos, vale para este computador).',
          'Desbloquear: o login já vem preenchido; digite a senha. O trabalho continua de onde parou.',
          'Trocar de usuário: "Trocar usuário" no menu do seu nome (ou, na tela bloqueada, digite outro login). O novo usuário entra com a senha dele e as telas do anterior são fechadas.',
        ],
        a: 'A tela bloqueada cobre todo o sistema e confere a senha do mesmo jeito que a tela de login (nuvem, servidor da escola ou senha guardada neste computador). Toda troca de usuário pede a senha do usuário escolhido, inclusive pela lista do menu do nome e pelo botão "Simular" desta tela (desde 03/10/2026 nem o Master troca sem a senha). Cada bloqueio, desbloqueio e troca de usuário fica registrado em "Auditoria & Logs".',
        tip: 'Na troca de usuário, se o novo usuário entrar sem internet, a conexão da nuvem do usuário anterior é desconectada (a menos que o computador esteja marcado para "Manter conectado à nuvem").',
      },
      { q: 'Como mudo o que cada perfil pode ver?', a: 'Use "Gestão de Permissões (RBAC)" / "Matriz de Níveis de Acesso" e marque os módulos permitidos para cada perfil.' },
      {
        q: 'O que cada permissão libera?',
        a: 'Ler: o módulo aparece no menu e pode ser aberto. Criar: incluir cadastros. Editar: alterar cadastros. Excluir: apagar cadastros. As permissões valem em todas as telas: sem "Excluir" em Secretaria & Alunos, por exemplo, o botão de lixeira some e qualquer tentativa de apagar aluno é recusada com o aviso "Permissão negada". O módulo sem "Ler" não aparece no menu, na busca, nos atalhos nem no menu Iniciar.',
        tip: 'Padrão da Secretaria: lê, inclui e altera em Secretaria & Alunos, Turmas, Documentos e Comunicados, e não exclui nada. Para liberar exclusão, o Master marca "Excluir" no módulo desejado.',
      },
      {
        q: 'Quem pode criar, alterar ou excluir usuários?',
        a: 'Somente o Administrador Master. Para os demais perfis, a tela de usuários fica só para consulta: não aparecem os botões de novo usuário, editar, excluir, simular, nem a troca de setor ou de situação. Senhas, setores, permissões e os dados do desenvolvedor só mudam pela conta Master, e qualquer tentativa por outro perfil é recusada.',
        tip: 'Entrar no sistema e trocar a própria senha no primeiro acesso continuam liberados para cada usuário.',
      },
      {
        q: 'Como testo as permissões de um usuário?',
        steps: [
          'Entre com a conta Master.',
          'Em Usuários & Permissões, clique em "Simular" no usuário.',
          'O sistema passa a funcionar com as permissões dele: menu, botões e gravações.',
          'Para voltar, clique no nome do operador, no alto da tela, e escolha a conta Master.',
        ],
      },
      {
        q: 'O que muda quando escolho a "Unidade Escolar de Lotação" do usuário?',
        a: 'Quem tem uma escola de lotação trabalha só com ela. Em todas as telas (Secretaria & Alunos, Turmas & Matrizes, frequência, notas, documentos, gráficos e os números da Visão Geral) aparecem apenas os alunos, turmas e registros dessa escola, e o filtro de escola mostra só ela. O usuário também não consegue incluir, alterar, mover ou excluir registro de outra escola: a tentativa é recusada com um aviso, na tela e no Servidor da Sede. Aluno ou turma cadastrado sem escola fica automaticamente na escola dele. Quem é lotado numa escola sede trabalha também com as escolas anexas dela (ex.: lotado na Erminio Brito vê e grava também a Castro Alves e a Castro Alves Canaã); quem é lotado numa anexa vê só a anexa.',
        tip: 'Deixe "Rede Municipal Global (Todas as Unidades)" só para quem trabalha com a rede inteira, como a Coordenação da SEMED. O Master sempre vê todas as escolas. Transferências de aluno entre escolas são feitas pela Sede.',
      },
      {
        q: 'Apareceu o aviso "A escola em que este usuário estava lotado foi apagada".',
        a: 'A escola que estava no cadastro do usuário não existe mais. Enquanto isso, ele não vê nenhuma escola (nunca a rede inteira). Ao editar, o campo mostra "Rede Municipal Global": escolha a escola correta antes de salvar. Se salvar em "Rede Municipal Global", ele passa a ver todas as escolas.',
        tip: 'Antes, a escola apagada ficava escondida no formulário e a nuvem recusava a conta ("Recusados pela nuvem"). Agora a sincronização não trava mais por isso.',
      },
      {
        q: 'Como confiro se um usuário vê só a escola dele?',
        steps: [
          'Entre com a conta do usuário (ou use "Simular" na conta Master).',
          'Abra Secretaria & Alunos: o total de alunos e o filtro de escola devem mostrar só a escola de lotação.',
          'Confira Turmas & Matrizes e a Visão Geral / Dashbox: turmas e números só dessa escola.',
        ],
      },
      { q: 'Cuidado com "Excluir Todos os Usuários"', a: 'Esse botão apaga todas as contas. Use só com orientação do suporte.' },
    ],
  },
  {
    id: 'NETWORK_INSTALLER',
    title: moduleName('NETWORK_INSTALLER'),
    where: `Menu > ${moduleGroup('NETWORK_INSTALLER')} > ${moduleName('NETWORK_INSTALLER')} (Alt+I)`,
    summary: 'Pacotes do Servidor da Sede, do Servidor Remoto (escola) e das estações, atualização do servidor e cópias de segurança.',
    faq: [
      {
        q: 'Como o servidor protege os dados contra quem não tem permissão?',
        a: 'O Servidor da Sede e o Servidor Remoto conferem cada gravação. No login, o servidor confere a senha no banco dele e abre uma sessão do usuário (vale 12 horas). Cada alteração enviada pelas estações é comparada com o banco: inclusão, alteração ou exclusão sem permissão é recusada pelo próprio servidor, mesmo que o pedido venha de fora do sistema. Usuários, senhas, setores e permissões só mudam com a conta Master. Quem tem escola de lotação só grava registros da própria escola: alteração em aluno, turma, frequência ou nota de outra escola também é recusada pelo servidor. Tudo fica registrado no arquivo C:\\SucessoEdu\\data\\servidor.log (quem gravou, de qual estação e o que foi recusado).',
        tip: 'Esta proteção vem no programa do servidor: depois de atualizar o sistema, gere de novo o pacote do servidor e reinstale (o banco de dados é mantido). Em seguida, cada pessoa sai e entra de novo no sistema para abrir a sessão.',
      },
      {
        q: 'Apareceu "Para enviar as alterações ao servidor da escola é preciso entrar no sistema".',
        a: 'A sessão do usuário no servidor não está aberta (primeiro uso depois da atualização) ou venceu (12 horas). As alterações ficam guardadas na estação. Clique em "Sair do Sistema", entre de novo com o seu usuário e senha, e elas são enviadas.',
      },
      {
        q: 'O selo fica em "Servidor da Sede: enviando N alteração(ões)" e o número não zera. O que faço?',
        steps: [
          'Saia do sistema e entre de novo com o seu usuário, para abrir a sessão no servidor.',
          'Se o número continuar sem zerar, abra C:\\SucessoEdu\\data\\servidor.log no Bloco de Notas e aperte Ctrl+End para ver as últimas linhas.',
          'Se aparecer "Erro ao atender requisicao ... referência circular ... PSParameterizedProperty", o servidor está numa versão com uma falha de gravação já corrigida. Gere de novo o pacote do servidor (pelo sistema aberto no link publicado, depois de atualizado) e reinstale. O banco de dados é mantido.',
          'Depois de reinstalar, recarregue a estação (F5): as alterações guardadas nela são enviadas sozinhas.',
        ],
        tip: 'Enquanto o número não zera, as alterações ficam guardadas na estação e não se perdem. Não limpe os dados do navegador nem reinstale a estação antes de elas serem enviadas.',
      },
      {
        q: 'O lote de uma escola pode alterar usuários ou dados de outra escola na Sede?',
        a: 'Não. O lote leva só dados escolares da própria escola (alunos, turmas, provas, frequência, notas e o banco de questões); nunca usuários, senhas, permissões ou configurações. Registros de outra escola viram "conflito" e não são aplicados. O histórico de sincronização da Sede registra quem gerou o lote, em qual servidor, quando, e quem importou.',
      },
      {
        q: 'Como crio a conta da nuvem do Servidor Remoto de uma escola?',
        steps: ['Em Instaladores & Backup, no quadro "Servidor Remoto (escola)", escolha a escola.', 'Em "Conta do servidor na nuvem", clique em "Criar / renovar conta" (é preciso estar na nuvem como administrador).', 'Anote o e-mail e a senha que aparecem (a senha não aparece de novo).', 'No servidor da escola, clique no selo do servidor e em "Entrar na nuvem" com esse e-mail e senha.'],
        a: 'A conta é da escola, não de uma pessoa: envia só o lote daquela escola e recebe só os dados dela. "Desligar" corta o acesso daquele servidor sem afetar as outras escolas; "Criar / renovar" gera uma nova senha.',
      },
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
      {
        q: 'O atalho está com o ícone do navegador, e não com o do SucessoEdu',
        a: 'O ícone do SucessoEdu (capelo com a seta verde) entra no atalho quando o servidor ou a estação é instalado com um pacote gerado a partir de 26/09/2026. Para trocar num computador já instalado, gere um pacote novo e rode o instalador de novo: os dados são mantidos.',
        tip: 'Se o ícone antigo continuar aparecendo, reinicie o computador: o Windows guarda os ícones em memória por um tempo.',
      },
      {
        q: 'Como removo completamente o sistema de um computador?',
        steps: [
          'Abra o PowerShell como administrador (botão Iniciar, digite PowerShell, botão direito > Executar como administrador).',
          'Pare e apague as tarefas: schtasks /End /TN "SucessoEdu Servidor" e schtasks /Delete /TN "SucessoEdu Servidor" /F (repita para "SucessoEdu Atualizador").',
          'Apague a pasta C:\\SucessoEdu e o atalho da Área de Trabalho.',
          'No navegador, abra o sistema, aperte F12 > Application > Storage > Clear site data.',
        ],
        tip: 'A pasta C:\\SucessoEdu\\data guarda o banco. Copie antes para um pendrive se quiser manter os dados.',
      },
      { q: 'Um computador só pode ter um servidor?', a: 'Sim. Se já existe a pasta C:\\SucessoEdu, o computador já tem um servidor. Não instale outro tipo por cima sem orientação.' },
      { q: 'Como faço cópia de segurança?', a: 'O servidor guarda cópias automáticas em C:\\SucessoEdu\\data\\historico. Copie a pasta C:\\SucessoEdu\\data para um pendrive de tempos em tempos.' },
    ],
  },
  {
    id: 'SYSTEM_UPDATES',
    title: moduleName('SYSTEM_UPDATES'),
    where: `Menu > ${moduleGroup('SYSTEM_UPDATES')} > ${moduleName('SYSTEM_UPDATES')}`,
    summary: 'Versão em uso, atualização do servidor da rede e cópias de segurança deste computador.',
    faq: [
      { q: 'Preciso fazer algo aqui?', a: 'Normalmente não. Pelo link publicado, a versão nova chega sozinha. Num servidor da rede (Sede ou escola), o quadro "Servidor da rede local" mostra a versão baixada e o botão para aplicar.' },
      {
        q: 'Qual é a versão do sistema?',
        a: 'A versão é a data e a hora em que o sistema foi publicado (ex.: "Versão de 01/10/2026 22:05"). Ela aparece no topo desta tela, no menu lateral e na tela de entrada. Os antigos números "v5.4", "v5.5" etc. eram fictícios e foram retirados.',
      },
      {
        q: 'Para onde foram o Google Drive, os pacotes .edupkg e o "Controle de Versões"?',
        a: `Foram retirados em 01/10/2026 porque eram simulados: mostravam "conectado", "enviado" e "atualização concluída" sem fazer nada de verdade. As funções reais são: atualização do servidor (quadro desta tela ou de ${moduleName('NETWORK_INSTALLER')}), cópia de segurança (botão "Fazer cópia agora", que baixa o arquivo .json) e o banco do servidor em C:\\SucessoEdu\\data.`,
      },
    ],
  },
  {
    id: 'ABOUT',
    title: moduleName('ABOUT'),
    where: `Menu > ${moduleGroup('ABOUT')} > ${moduleName('ABOUT')}`,
    summary: 'Versão do sistema, dados e logo do desenvolvedor e contato do suporte.',
    faq: [
      { q: 'Como falo com o suporte?', a: 'Os contatos do desenvolvedor estão nesta tela. Ao pedir ajuda, diga o módulo, o que tentou fazer e mande um print da tela.' },
      {
        q: 'Como coloco a logo do desenvolvedor?',
        steps: [
          'Entre com a conta do Administrador Master.',
          'Clique em "Editar Meus Dados (Desenvolvedor)".',
          'Em "Logo do Desenvolvedor / Empresa", clique em "Enviar logo" e escolha a imagem.',
          'Clique em "Salvar Meus Dados".',
        ],
        tip: 'Use PNG com fundo transparente. A imagem é reduzida automaticamente e vai para a nuvem, aparecendo em todos os computadores.',
      },
      {
        q: 'Os dados do desenvolvedor podem ser alterados por outros usuários?',
        a: 'Não. Só a conta do Administrador Master vê o botão de edição; os demais usuários só consultam. Os dados ficam gravados na nuvem e só mudam quando o Master salva: a instalação de novas versões e a sincronização não alteram esse cadastro, e um campo obrigatório deixado em branco mantém o valor anterior.',
      },
    ],
  },
  {
    id: 'ADMIN_TI',
    title: moduleName('ADMIN_TI'),
    where: `Menu > ${moduleGroup('ADMIN_TI')} > ${moduleName('ADMIN_TI')}`,
    summary: TECNICO,
    faq: [
      { q: 'Preciso usar este módulo?', a: TECNICO },
      {
        q: 'Onde faço as tarefas de TI no dia a dia?',
        a: `Instalação do Servidor Sede, servidores das escolas e estações: ${moduleName('NETWORK_INSTALLER')} (Alt+I). Envio e consolidação de lotes .edusync: ${moduleName('MUNICIPAL_SYNC')}. Usuários, senhas e contas na nuvem: ${moduleName('USER_CONTROL')}. Versões publicadas: ${moduleName('SYSTEM_UPDATES')}.`,
      },
      {
        q: `O que o ${moduleName('ADMIN_TI')} mostra?`,
        a: 'Só informações reais: se este computador está com rede e qual versão do sistema abriu; se está usando o servidor da rede local (Sede ou escola), quantas alterações aguardam envio e a última sincronização; se a nuvem responde e a situação da sincronização; e a quantidade de escolas, turmas, alunos e usuários ativos gravados neste computador, com os últimos registros de acesso. Clique em "Verificar agora" para conferir de novo. Os antigos quadros de portas, PostgreSQL, "Secret Manager" e logs de auditoria de exemplo foram retirados por não serem reais.',
      },
      {
        q: 'Onde foram parar o OmniDeploy, NexusBuild, InstalaFlow, DataSync Pro (SQL Architect) e o Diagrama?',
        a: `Foram desativados em 01/10/2026 para deixar o sistema mais leve. Eram painéis de demonstração: mostravam resultados simulados (por exemplo "SQL executado" ou "atualização aplicada") sem fazer nada de verdade, e o navegador precisava baixá-los mesmo sem uso. Nenhum dado foi perdido. As funções reais continuam em ${moduleName('NETWORK_INSTALLER')}, ${moduleName('MUNICIPAL_SYNC')}, ${moduleName('USER_CONTROL')} e ${moduleName('SYSTEM_UPDATES')}.`,
      },
      {
        q: `Por que ${moduleName('NETWORK_INSTALLER')}, ${moduleName('SYSTEM_UPDATES')} ou ${moduleName('MUNICIPAL_SYNC')} mostram "Carregando" na primeira vez?`,
        a: 'Para o sistema abrir mais rápido em todos os computadores, esses módulos (os mais pesados, usados quase só pela TI e pela Sede) agora são baixados só quando você os abre. A primeira abertura leva um instante; depois fica na memória. Se o sistema foi atualizado com a janela aberta, ele recarrega a página sozinho uma vez para buscar a versão nova.',
      },
      {
        q: 'Cliquei num atalho antigo e apareceu "Painel desativado". É erro?',
        a: `Não. O atalho levava a um painel de demonstração que foi retirado. Use ${moduleName('ADMIN_TI')} para chegar às ferramentas reais.`,
      },
    ],
  },
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
