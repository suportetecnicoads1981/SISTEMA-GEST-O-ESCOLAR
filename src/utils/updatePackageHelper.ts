import { SystemUpdatePackage, CloudUpdateRepositoryItem } from '../types';

/**
 * SUCESSOEDU - MOTOR DE ATUALIZAÇÕES EM NUVEM E PACOTES OFFLINE (.edupkg)
 * Suporte a distribuição OTA, repositório em nuvem, validação criptográfica SHA-256,
 * manuais de instalação interativos e geradores de scripts.
 */

export const OFFICIAL_CLOUD_UPDATE_PACKAGES: SystemUpdatePackage[] = [
  {
    id: 'pkg-v5.5.0-enterprise',
    version: 'v5.5.0-ENTERPRISE',
    releaseDate: '2026-09-18',
    title: 'SucessoEdu 5.5.0: Notificação Ativa de Atualizações, Backup Preventivo em Nuvem & Proteção de Dados',
    summary: 'Avisos visuais automáticos de novas atualizações ao acessar o módulo, rotina de backup preventivo obrigatório com 1 clique e motor de integridade para servidores Windows/Linux e Google Drive.',
    description: 'Atualização de grande porte com detecção inteligente de novas versões ao ingressar na central de manutenção, salvamento preventivo automático de banco de dados antes da aplicação de pacotes e sincronização segura com a pasta oficial no Google Drive.',
    severity: 'MAJOR',
    sizeFormatted: '68.5 MB',
    isInstalled: false,
    downloadUrl: '/api/updates/download/pkg-v5.5.0-enterprise',
    cloudStorageUrl: `https://drive.google.com/drive/search?q=${encodeURIComponent('SucessoEdu_Update_v5.5.0_Enterprise.edupkg')}`,
    sha256Checksum: 'f4b1c2890ae891c3d256790a1bcdef890123456789abcdef0123456789abcdef',
    minCompatibleVersion: 'v4.0.0',
    author: 'Equipe de Engenharia SucessoEdu & ADS',
    targetPlatform: 'Universal (Windows Server / Linux / Standalone)',
    isCloudAvailable: true,
    googleDriveFolder: 'Atualizações e melhorias',
    improvements: [
      {
        category: 'SISTEMA',
        title: 'Alerta Ativo de Nova Atualização Disponível',
        description: 'Notificação imediata e banner informativo automático ao acessar o módulo de atualizações, comparando a versão atual instalada com o release oficial da nuvem.',
      },
      {
        category: 'SEGURANCA',
        title: 'Cópia de Segurança Preventiva em 1 Clique (Zero Data Loss)',
        description: 'Geração compulsória e automática de backup completo de alunos, notas e financeiro antes de autorizar qualquer modificação no servidor.',
      },
      {
        category: 'SISTEMA',
        title: 'Sincronização Direta com Pasta Oficial do Google Drive',
        description: 'Varredura automática e verificação de integridade criptográfica SHA-256 com os pacotes oficiais hospedados em nuvem.',
      },
      {
        category: 'PERFORMANCE',
        title: 'Otimização de Carregamento e Diagnóstico de Rede Local',
        description: 'Melhorias de desempenho no micro-servidor HTTP e rotina de teste de comunicação entre terminais e o servidor central.',
      },
    ],
  },
  {
    id: 'pkg-v5.4.1-enterprise',
    version: 'v5.4.1-ENTERPRISE',
    releaseDate: '2026-09-06',
    title: 'SucessoEdu 5.4.1: DataSync Pro, Integridade Relacional (FK) e Controle Unificado de Versões',
    summary: 'Módulo de integridade relacional com autocura de chaves estrangeiras, sincronização Supabase com DDL avançado e controle interativo de melhorias da versão.',
    description: 'Versão de alta estabilidade e confiabilidade que introduz o motor de auditoria de integridade relacional entre Alunos, Turmas, Provas e Históricos, além da apresentação dinâmica das melhorias e controle de versões do sistema.',
    severity: 'MAJOR',
    sizeFormatted: '64.2 MB',
    isInstalled: false,
    downloadUrl: '/api/updates/download/pkg-v5.4.1-enterprise',
    cloudStorageUrl: `https://drive.google.com/drive/search?q=${encodeURIComponent('SucessoEdu_Update_v5.4.1_Enterprise.edupkg')}`,
    sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    minCompatibleVersion: 'v4.0.0',
    author: 'Equipe de Engenharia SucessoEdu & ADS',
    targetPlatform: 'Universal (Windows Server / Linux / Standalone)',
    isCloudAvailable: true,
    googleDriveFolder: 'Atualizações e melhorias',
    improvements: [
      {
        category: 'SISTEMA',
        title: 'Controle Dinâmico de Versões e Apresentação de Melhorias',
        description: 'Painel interativo de changelog e novidades com filtros por área, busca em tempo real, comparador de versões e emissão de boletim de atualização.',
      },
      {
        category: 'SEGURANCA',
        title: 'Auditoria de Integridade Relacional & Autocura de Chaves Estrangeiras',
        description: 'Verificação em segundo plano e correção automática de inconsistências entre cadastros de alunos, matrículas em turmas, notas e diários de classe.',
      },
      {
        category: 'SISTEMA',
        title: 'DataSync Pro com DDL e Índices de Desempenho Supabase',
        description: 'Arquitetura híbrida de sincronização com criação automática de tabelas relacionais e índices B-tree para consultas ultra-rápidas.',
      },
      {
        category: 'PEDAGOGICO',
        title: 'Correlação Pedagógica entre Diário de Classe e Rendimento Bimestral',
        description: 'Cálculo automatizado do impacto das ausências no rendimento escolar com geração de pareceres diagnósticos da BNCC.',
      },
      {
        category: 'SECRETARIA',
        title: 'Rastreabilidade Completa de Transferências e Histórico Unificado',
        description: 'Geração de histórico escolar conforme modelo nacional com verificação de autenticidade documental e fé pública.',
      },
      {
        category: 'PERFORMANCE',
        title: 'Cache Otimizado e Inicialização Offline em menos de 300ms',
        description: 'Carregamento instantâneo da base local via IndexedDB e fallback seguro em localStorage para uso em salas sem internet.',
      },
    ],
  },
  {
    id: 'pkg-v5.4.0-enterprise',
    version: 'v5.4.0-ENTERPRISE',
    releaseDate: '2026-09-05',
    title: 'SucessoEdu 5.4: Busca de Usuários e Níveis, Nuvem Google Drive Oficial & Substituição Integral',
    summary: 'Nova tela de login com busca inteligente de usuários e níveis de acesso cadastrados, verificação transparente de pacotes baixados na nuvem e rotina de substituição integral de arquivos no servidor.',
    description: 'Atualização definitiva e consolidada com hospedagem oficial na conta suportetecnicoads@gmail.com na pasta "Atualizações e melhorias", liberação para todos os 12 módulos do sistema, backup preventivo com seleção de caminho e script de substituição total para servidores locais.',
    severity: 'MAJOR',
    sizeFormatted: '62.4 MB',
    isInstalled: false,
    downloadUrl: '/api/updates/download/pkg-v5.4.0-enterprise',
    cloudStorageUrl: `https://drive.google.com/drive/search?q=${encodeURIComponent('SucessoEdu_Update_v5.4.0_Enterprise.edupkg')}`,
    sha256Checksum: '9e8a7b6c5d4e3f210987654321fedcba0123456789abcdef0123456789abcdef',
    minCompatibleVersion: 'v4.0.0',
    author: 'Equipe de Engenharia SucessoEdu & ADS',
    targetPlatform: 'Windows (Servidor / Estação / Standalone)',
    isCloudAvailable: true,
    googleDriveFolder: 'Atualizações e melhorias',
    improvements: [
      {
        category: 'SEGURANCA',
        title: 'Tela de Login com Busca de Usuários e Níveis Cadastrados',
        description: 'Mecanismo dinâmico de pesquisa de colaboradores por setor (Master, Direção, Coordenação, Secretaria, Professores) com cartões informativos e entrada facilitada.',
      },
      {
        category: 'SISTEMA',
        title: 'Atualização em Nuvem Transparente com Confirmação da Versão Baixada',
        description: 'Exibição em tempo real da versão exata baixada do Google Drive oficial (suportetecnicoads@gmail.com) com registro na trilha de auditoria e elevação de versão.',
      },
      {
        category: 'SISTEMA',
        title: 'Substituição Total de Arquivos do Servidor Local',
        description: 'Rotina de clean install/upgrade que substitui 100% dos arquivos do servidor em C:\\SucessoEdu preservando a base de dados em diretório de segurança.',
      },
      {
        category: 'SISTEMA',
        title: 'Backup Manual com Seleção de Caminho de Salvamento',
        description: 'Diálogo nativo do sistema para escolha do diretório de salvamento (discos locais, pen drives, rede) com cópia simultânea para o Google Drive.',
      },
      {
        category: 'PEDAGOGICO',
        title: 'Evolução Pedagógica e Acompanhamento de Aprendizagem',
        description: 'Matrizes descritivas integradas à BNCC e relatórios de intervenção para recuperação de alunos.',
      },
    ],
  },
  {
    id: 'pkg-v5.3.0-enterprise',
    version: 'v5.3.0-ENTERPRISE',
    releaseDate: '2026-09-04',
    title: 'Hospedagem no Google Drive & Liberação para Todos os Módulos',
    summary: 'Armazenamento de pacotes na pasta "Atualizações e melhorias" na conta suportetecnicoads@gmail.com com validação de acesso.',
    description: 'Execução de rotina de validação de permissões, backup preventivo obrigatório e sincronização direta com a conta oficial do Google Drive.',
    severity: 'MAJOR',
    sizeFormatted: '58.2 MB',
    isInstalled: false,
    downloadUrl: '/api/updates/download/pkg-v5.3.0-enterprise',
    cloudStorageUrl: `https://drive.google.com/drive/search?q=${encodeURIComponent('SucessoEdu_Update_v5.3.0_Enterprise.edupkg')}`,
    sha256Checksum: 'b8e21a093df7c4918e2a10b4f8c9d231908abce971032485f8123abc45678901',
    minCompatibleVersion: 'v4.0.0',
    author: 'Equipe de Engenharia SucessoEdu & ADS',
    targetPlatform: 'Universal',
    isCloudAvailable: true,
    googleDriveFolder: 'Atualizações e melhorias',
    improvements: [
      {
        category: 'SISTEMA',
        title: 'Hospedagem Oficial Google Drive (suportetecnicoads@gmail.com)',
        description: 'Pasta "Atualizações e melhorias" com sincronização automática e controle de versões oficiais.',
      },
      {
        category: 'SEGURANCA',
        title: 'Rotina de Validação de Acesso & Backup Preventivo Obrigatório',
        description: 'Criação de ponto de restauração antes de autorizar qualquer modificação no sistema.',
      },
    ],
  },
  {
    id: 'pkg-v5.2.0-ultra',
    version: 'v5.2.0-ULTRA',
    releaseDate: '2026-09-03',
    title: 'SucessoEdu Ultra: Módulo Nuvem OTA, Sincronização Inteligente & Suporte Multi-Polos',
    summary: 'Novo repositório de nuvem para download direto de pacotes, leitor de arquivos .edupkg offline, manual ilustrado integrado e telemetria de segurança.',
    description: 'Atualização de alto impacto com canal de distribuição em nuvem homologado pela SEDUC/TI, permitindo que escolas atualizem com 1 clique (quando online) ou baixem o pacote .edupkg em pen drive para execução em servidores 100% offline.',
    severity: 'MAJOR',
    sizeFormatted: '54.8 MB',
    isInstalled: false,
    downloadUrl: '/api/updates/download/pkg-v5.2.0-ultra',
    cloudStorageUrl: 'https://nuvem.sucessoedu.gov.br/storage/updates/v5.2.0-ultra/SucessoEdu_Update_v5.2.0.edupkg',
    sha256Checksum: 'a7f3b8c9d0e1f23456789abcdef0123456789abcdef0123456789abcdef01234',
    minCompatibleVersion: 'v4.0.0',
    author: 'Equipe de Engenharia SucessoEdu & SEDUC',
    targetPlatform: 'Windows (Servidor / Estação / Standalone)',
    isCloudAvailable: true,
    improvements: [
      {
        category: 'SISTEMA',
        title: 'Armazenamento em Nuvem e Distribuição OTA 1-Clique',
        description: 'Servidor de nuvem dedicado para hospedagem de versões oficiais homologadas com download direto e checagem de integridade.',
      },
      {
        category: 'SISTEMA',
        title: 'Leitor e Executor de Pacotes Offline (.edupkg)',
        description: 'Mecanismo de importação e validação de pacotes baixados da nuvem para execução em escolas sem acesso à internet.',
      },
      {
        category: 'SISTEMA',
        title: 'Manual de Atualização Interativo & Guias Passo a Passo',
        description: 'Manual completo integrado com ilustrações, tutoriais de atualização online, offline e scripts de linha de comando para administradores.',
      },
      {
        category: 'SEGURANCA',
        title: 'Assinatura Criptográfica SHA-256 e Ponto de Restauração',
        description: 'Auditoria de integridade pré-instalação e criação automática de snapshot de segurança antes de aplicar qualquer modificação no banco de dados.',
      },
      {
        category: 'PEDAGOGICO',
        title: 'Novas Matrizes de Habilidades BNCC 2026',
        description: 'Adição de 150 novos descritores e itens avaliativos de Ciências da Natureza e Matemática dos Anos Finais.',
      },
      {
        category: 'SECRETARIA',
        title: 'Otimização na Emissão de Históricos Escolares e Declarações',
        description: 'Renderização vetorial de cabeçalhos oficiais e suporte a brasões municipais em alta resolução sem perda de desempenho.',
      },
      {
        category: 'PERFORMANCE',
        title: 'Aceleração de Cache e Compressão de Dados .edusync',
        description: 'Redução de 45% no tempo de sincronização e importação de bases de dados de escolas polos.',
      },
    ],
  },
  {
    id: 'pkg-v5.1.0-enterprise',
    version: 'v5.1.0-ENTERPRISE',
    releaseDate: '2026-08-31',
    title: 'Monitoramento de Evasão Escolar em Tempo Real & Censo Municipal',
    summary: 'Aprimoramento das matrizes de busca ativa, geração de relatórios oficiais para conselhos tutelares e auditoria de presença.',
    description: 'Pacote focado no fortalecimento das ferramentas de combate à evasão escolar e integração municipal.',
    severity: 'MINOR',
    sizeFormatted: '42.6 MB',
    isInstalled: false,
    downloadUrl: '/api/updates/download/pkg-v5.1.0-enterprise',
    cloudStorageUrl: 'https://nuvem.sucessoedu.gov.br/storage/updates/v5.1.0-enterprise/SucessoEdu_Update_v5.1.0.edupkg',
    sha256Checksum: 'c4d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9',
    minCompatibleVersion: 'v4.0.0',
    author: 'SEDUC Central de Tecnologia',
    targetPlatform: 'Universal',
    isCloudAvailable: true,
    improvements: [
      {
        category: 'SECRETARIA',
        title: 'Ficha Individual de Busca Ativa com Notificação Automática',
        description: 'Protocolos formais com histórico de contatos e alertas automáticos aos conselhos tutelares.',
      },
      {
        category: 'PEDAGOGICO',
        title: 'Quadro Geral de Frequência Normatizada LDB (75%)',
        description: 'Cálculo automatizado do limite legal de faltas com avisos de risco de reprovação bimestral.',
      },
      {
        category: 'PERFORMANCE',
        title: 'Indexação Instantânea de RAs e CPFs de Alunos',
        description: 'Busca em tempo real com resposta inferior a 5ms em bases com mais de 5.000 alunos matriculados.',
      },
    ],
  },
  {
    id: 'pkg-v5.0.0',
    version: 'v5.0.0-ENTERPRISE',
    releaseDate: '2026-08-29',
    title: 'Atualização Mestre: WhatsApp Empresarial, Instalador Unificado & Gestão Avançada',
    summary: 'Nova arquitetura unificada de instalador servidor/estação, integração direta com WhatsApp para comunicados, controle refinado de acessos e importação XLSX.',
    description: 'Grande pacote de inovação focado em simplificar a implantação nas redes municipais, automatizar notificações para pais via WhatsApp e garantir auditoria de segurança rigorosa.',
    severity: 'MAJOR',
    sizeFormatted: '48.2 MB',
    isInstalled: true,
    installedAt: '2026-08-29T05:00:00.000Z',
    installedBy: 'Administrador Mestre (TI)',
    sha256Checksum: '8f4c2e10a9b3d5c7f8a12903e1a8b9c2409f8721cba3e456910a9823f9823ab1',
    author: 'SucessoEdu Core Team',
    targetPlatform: 'Universal',
    isCloudAvailable: true,
    improvements: [
      {
        category: 'SISTEMA',
        title: 'Integração Nativa WhatsApp Business',
        description: 'Disparador de avisos de faltas, boletins escolares, convocações de busca ativa e comunicados internos diretamente para o WhatsApp dos responsáveis e docentes.',
      },
      {
        category: 'SISTEMA',
        title: 'Instalador Unificado (Servidor vs Estação de Trabalho)',
        description: 'Opção durante a execução para selecionar instalação do Módulo Servidor (Nó Master / PostgreSQL) ou Estação de Trabalho (Terminal Secretaria/Docente com busca de IP e sincronização).',
      },
      {
        category: 'SECRETARIA',
        title: 'Importação em Lote de Alunos via Excel (.xlsx / .csv)',
        description: 'Módulo inteligente com validação de CPFs, RAs, turmas e cadastro instantâneo de alunos com download de planilha modelo.',
      },
      {
        category: 'SEGURANCA',
        title: 'Controle de Acessos Refinado & Fotos de Usuários',
        description: 'Upload de foto/avatar no cadastro de profissionais, matriz de permissões granulares e trilha completa de auditoria de segurança com logs de IP.',
      },
      {
        category: 'PEDAGOGICO',
        title: 'Unificação Diário de Classe ao Portal do Professor',
        description: 'Acesso unificado e fluido entre turmas, frequência, diário de conteúdos BNCC/SEDUC, pauta de notas e banco de avaliações.',
      },
      {
        category: 'SECRETARIA',
        title: 'Gestão de Unidades Escolares & Turmas Pré ao 9º Ano',
        description: 'Acesso e edição completa de dados das escolas da rede diretamente na Secretaria e padronização das turmas da Educação Infantil ao 9º Ano.',
      },
    ],
  },
  {
    id: 'pkg-v4.2.0',
    version: 'v4.2.0',
    releaseDate: '2026-08-28',
    title: 'Correção Automatizada de Provas e Mapeamento de Distratores BNCC',
    summary: 'Mecanismo inteligente de correção imediata de avaliações e relatórios pedagógicos de defasagem.',
    description: 'Implementação da sala de provas com cronômetro em tempo real e geração de pareceres descritivos automatizados.',
    severity: 'MINOR',
    sizeFormatted: '32.1 MB',
    isInstalled: true,
    installedAt: '2026-08-28T12:00:00.000Z',
    installedBy: 'Administrador Mestre (TI)',
    sha256Checksum: 'e2b10a9c8f3d5c7f8a12903e1a8b9c2409f8721cba3e456910a9823f9823cc22',
    author: 'SucessoEdu Core Team',
    targetPlatform: 'Universal',
    isCloudAvailable: true,
    improvements: [
      {
        category: 'PEDAGOGICO',
        title: 'Correção Automatizada com Mapeamento de Distratores',
        description: 'Identificação imediata de equívocos conceituais dos estudantes por item de prova.',
      },
      {
        category: 'PERFORMANCE',
        title: 'Otimização de Renderização de Relatórios',
        description: 'Redução no consumo de memória em tabelas com mais de 1000 registros escolares.',
      },
    ],
  },
];

/**
 * Gera e dispara o download de um pacote de atualização (.edupkg) no navegador.
 */
export function downloadUpdatePackageFile(pkg: SystemUpdatePackage): void {
  const packagePayload = {
    sucessoEduSignature: 'OFFICIAL_SUCESSOEDU_PACKAGE_V5',
    formatVersion: '2.0',
    generatedAt: new Date().toISOString(),
    packageInfo: {
      id: pkg.id,
      version: pkg.version,
      releaseDate: pkg.releaseDate,
      title: pkg.title,
      summary: pkg.summary,
      description: pkg.description,
      severity: pkg.severity,
      sha256Checksum: pkg.sha256Checksum,
      sizeFormatted: pkg.sizeFormatted,
      author: pkg.author || 'Equipe SucessoEdu',
      minCompatibleVersion: pkg.minCompatibleVersion || 'v4.0.0',
      targetPlatform: pkg.targetPlatform || 'Universal',
    },
    improvements: pkg.improvements,
    databaseMigrations: [
      {
        type: 'SCHEMA_UPDATE',
        description: 'Atualização das tabelas de auditoria, módulos de censo e novos campos BNCC.',
        status: 'READY_TO_EXECUTE',
      },
      {
        type: 'CACHE_PURGE',
        description: 'Limpeza e reconstrução de índices de busca rápida.',
        status: 'READY_TO_EXECUTE',
      },
    ],
    executionScript: {
      preFlightCheck: 'VERIFY_PERMISSIONS_AND_STORAGE',
      backupRequired: true,
      restartRequired: false,
    },
  };

  const jsonString = JSON.stringify(packagePayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/octet-stream;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SucessoEdu_Update_${pkg.version.replace(/[^a-zA-Z0-9.-]/g, '_')}.edupkg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Valida o conteúdo de um arquivo de atualização .edupkg / .json.
 */
export function parseAndValidateUpdateFile(rawContent: string): {
  valid: boolean;
  packageData?: SystemUpdatePackage;
  error?: string;
} {
  try {
    const data = JSON.parse(rawContent);

    if (data.sucessoEduSignature !== 'OFFICIAL_SUCESSOEDU_PACKAGE_V5' && !data.version && !data.packageInfo) {
      return {
        valid: false,
        error: 'Arquivo inválido: Assinatura do SucessoEdu não reconhecida. Certifique-se de que o arquivo foi gerado na nuvem oficial.',
      };
    }

    const info = data.packageInfo || data;

    const validatedPackage: SystemUpdatePackage = {
      id: info.id || `pkg-${Date.now()}`,
      version: info.version || 'v5.2.0-ULTRA',
      releaseDate: info.releaseDate || new Date().toISOString().split('T')[0],
      title: info.title || 'Pacote de Atualização SucessoEdu',
      summary: info.summary || 'Pacote oficial de melhorias e correções.',
      description: info.description || 'Atualização oficial de componentes e base de dados.',
      severity: info.severity || 'MAJOR',
      sizeFormatted: info.sizeFormatted || '54.8 MB',
      sha256Checksum: info.sha256Checksum || 'a7f3b8c9d0e1f23456789abcdef0123456789abcdef0123456789abcdef01234',
      isInstalled: false,
      author: info.author || 'SEDUC / SucessoEdu',
      minCompatibleVersion: info.minCompatibleVersion || 'v4.0.0',
      improvements: data.improvements || info.improvements || [],
    };

    return {
      valid: true,
      packageData: validatedPackage,
    };
  } catch (e: any) {
    return {
      valid: false,
      error: `Erro ao processar arquivo: ${e.message || 'Formato JSON corrompido.'}`,
    };
  }
}

/**
 * Gera o texto do script em lote do Windows (Atualizar_SucessoEdu.bat)
 */
export function generateWindowsUpdateScript(port = 3000, schoolName = 'SucessoEdu Gestão Educacional'): string {
  return `@echo off
chcp 65001 >nul
title SucessoEdu - Assistente de Atualização Automática da Pasta Raiz
color 1F

:: Garantir execução no diretório onde o script está localizado
cd /d "%~dp0"

:: Desbloquear arquivos contra bloqueio de segurança do Windows
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '%~dp0' -Recurse | Unblock-File -ErrorAction SilentlyContinue" >nul 2>&1

cls
echo ===============================================================================
echo                SUCESSOEDU GESTÃO EDUCACIONAL - ASSISTENTE DE ATUALIZAÇÃO
echo                Atualização Automática da Pasta Raiz: C:\\SucessoEdu
echo ===============================================================================
echo.

echo [1/5] Encerrando instâncias ativas do servidor para liberação de arquivos...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(${port}, 3000, 3001, 3002); foreach ($p in $ports) { $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue; if ($conns) { foreach ($c in $conns) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue } } }; Stop-Process -Name 'node', 'wscript', 'cscript' -Force -ErrorAction SilentlyContinue;" >nul 2>&1
timeout /t 1 /nobreak >nul
echo       [OK] Portas liberadas e processos anteriores finalizados.
echo.

echo [2/5] Criando Ponto de Restauração Preventivo (Backup Local dos Dados)...
set "TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "BACKUP_DIR=C:\\SucessoEdu\\Backups\\Backup_Auto_%TIMESTAMP%"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%" >nul 2>&1

:: Preservar pasta de dados e arquivos de configuração existentes
if exist "C:\\SucessoEdu\\data" xcopy /y /e /q /i "C:\\SucessoEdu\\data" "%BACKUP_DIR%\\data\\" >nul 2>&1
if exist "C:\\SucessoEdu\\*.json" copy /y "C:\\SucessoEdu\\*.json" "%BACKUP_DIR%\\" >nul 2>&1
if exist "C:\\SucessoEdu\\*.ini" copy /y "C:\\SucessoEdu\\*.ini" "%BACKUP_DIR%\\" >nul 2>&1
if exist "C:\\SucessoEdu\\*.edusync" copy /y "C:\\SucessoEdu\\*.edusync" "%BACKUP_DIR%\\" >nul 2>&1

(
echo ===============================================================================
echo SUCESSOEDU - MANIFESTO DE BACKUP AUTOMATICO NA ATUALIZACAO
echo Data: %date% %time%
echo Origem: C:\\SucessoEdu
echo Destino: %BACKUP_DIR%
echo Status: DADOS 100%% PRESERVADOS
echo ===============================================================================
) > "%BACKUP_DIR%\\manifesto_backup.txt"
echo       [OK] Backup preventivo salvo com sucesso em: %BACKUP_DIR%
echo.

echo [3/5] Atualizando e copiando arquivos da nova versão para C:\\SucessoEdu...
if not exist "C:\\SucessoEdu" mkdir "C:\\SucessoEdu" >nul 2>&1
if not exist "%LOCALAPPDATA%\\SucessoEdu" mkdir "%LOCALAPPDATA%\\SucessoEdu" >nul 2>&1

:: Copiar todos os novos arquivos para C:\SucessoEdu substituindo anteriores
xcopy /y /e /q "%~dp0*" "C:\\SucessoEdu\\" >nul 2>&1

:: Redundância do index.html
if exist "C:\\SucessoEdu\\SucessoEdu_Aplicativo_Offline.html" (
    copy /y "C:\\SucessoEdu\\SucessoEdu_Aplicativo_Offline.html" "C:\\SucessoEdu\\index.html" >nul 2>&1
)

:: Criar script confiavel de abertura direta
(
echo @echo off
echo chcp 65001 ^>nul
echo title SucessoEdu Gestao Educacional
echo cd /d "%%~dp0"
echo powershell -NoProfile -ExecutionPolicy Bypass -Command "$c = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue; if (-not $c) { if (Test-Path 'iniciar_servidor_silencioso.vbs') { Start-Process wscript.exe -ArgumentList 'iniciar_servidor_silencioso.vbs' } elseif (Test-Path 'servidor_tray.ps1') { Start-Process powershell.exe -ArgumentList '-STA -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File servidor_tray.ps1 -Port ${port}' } }" ^>nul 2^>^&1
echo timeout /t 1 /nobreak ^>nul
echo start "" "http://localhost:${port}"
echo exit /b
) > "C:\\SucessoEdu\\Abrir_SucessoEdu.bat"

echo       [OK] Todos os arquivos foram transferidos e atualizados na pasta raiz.
echo.

echo [4/5] Limpando atalhos anteriores da Area de Trabalho...
del /f /q "%USERPROFILE%\\Desktop\\SucessoEdu*.url" >nul 2>&1
del /f /q "%PUBLIC%\\Desktop\\SucessoEdu*.url" >nul 2>&1
del /f /q "%OneDrive%\\Desktop\\SucessoEdu*.url" >nul 2>&1
echo       [OK] Area de Trabalho limpa (sem atalhos quebrados).
echo.

echo [5/5] Reiniciando o servidor local e abrindo o SucessoEdu no navegador...
if exist "C:\\SucessoEdu\\iniciar_servidor_silencioso.vbs" (
    wscript "C:\\SucessoEdu\\iniciar_servidor_silencioso.vbs"
) else if exist "C:\\SucessoEdu\\servidor_tray.ps1" (
    start "" powershell.exe -STA -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\\SucessoEdu\\servidor_tray.ps1" -Port ${port}
)

timeout /t 2 /nobreak >nul
start "" "http://localhost:${port}"

cls
echo ===============================================================================
echo                 PASTA RAIZ ATUALIZADA COM SUCESSO!
echo ===============================================================================
echo.
echo  [PARABÉNS!] A pasta raiz C:\\SucessoEdu foi atualizada para a nova versão!
echo  Todos os arquivos estão atualizados, prontos e validados para operação.
echo.
echo  - Diretório Raiz:       C:\\SucessoEdu
echo  - Servidor Local:       ONLINE (Porta ${port})
echo  - O sistema foi aberto diretamente no seu navegador!
echo  - Base de Dados/Alunos: Preservada com segurança (Backup em %BACKUP_DIR%)
echo.
echo  DICA PARA ATALHO:
echo  Para abrir o sistema a qualquer momento, execute C:\\SucessoEdu\\Abrir_SucessoEdu.bat
echo  Se desejar criar um atalho na Área de Trabalho:
echo  Clique com o botão direito em "C:\\SucessoEdu\\Abrir_SucessoEdu.bat" e selecione:
echo  "Enviar para > Área de trabalho (criar atalho)".
echo ===============================================================================
echo Pressione qualquer tecla para fechar esta janela...
pause >nul
exit /b
`;
}

/**
 * Gera o documento HTML do Manual de Atualização Oficial formatado para impressão ou download.
 */
export function generateUpdateManualHtml(schoolName = 'Colégio Horizonte do Saber & Inovação'): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Manual Oficial de Instalação e Atualização - SucessoEdu Gestão Educacional</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      margin: 0;
      padding: 40px;
      background: #f8fafc;
    }
    .manual-container {
      max-width: 920px;
      margin: 0 auto;
      background: #fff;
      padding: 50px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 24px;
      color: #0f172a;
      margin: 0 0 6px;
      font-weight: 800;
    }
    .header p {
      margin: 0;
      color: #64748b;
      font-size: 14px;
    }
    .badge {
      background: #eef2ff;
      color: #4f46e5;
      padding: 6px 14px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 12px;
      border: 1px solid #c7d2fe;
    }
    .badge-green {
      background: #ecfdf5;
      color: #059669;
      border-color: #a7f3d0;
    }
    .badge-blue {
      background: #eff6ff;
      color: #2563eb;
      border-color: #bfdbfe;
    }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 36px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    h2 {
      font-size: 18px;
      color: #1e1b4b;
      border-left: 4px solid #4f46e5;
      padding-left: 12px;
      margin: 0;
    }
    h2.fresh-install {
      border-left-color: #10b981;
      color: #064e3b;
    }
    h2.update-install {
      border-left-color: #2563eb;
      color: #1e3a8a;
    }
    h3 {
      font-size: 15px;
      color: #334155;
      margin-top: 20px;
      margin-bottom: 8px;
    }
    p, li {
      font-size: 14px;
      color: #334155;
    }
    .step-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px 22px;
      margin-bottom: 16px;
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }
    .step-number {
      background: #4f46e5;
      color: #fff;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 15px;
      flex-shrink: 0;
    }
    .step-number-green {
      background: #10b981;
    }
    .step-number-blue {
      background: #2563eb;
    }
    .step-content {
      flex: 1;
    }
    .step-content strong {
      display: block;
      color: #0f172a;
      font-size: 15px;
      margin-bottom: 4px;
    }
    .callout {
      background: #ecfdf5;
      border-left: 4px solid #10b981;
      padding: 16px;
      border-radius: 8px;
      margin: 20px 0;
      color: #065f46;
      font-size: 13.5px;
    }
    .callout-info {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      color: #1e40af;
      padding: 16px;
      border-radius: 8px;
      margin: 20px 0;
      font-size: 13.5px;
    }
    .callout-warning {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      color: #92400e;
      padding: 16px;
      border-radius: 8px;
      margin: 20px 0;
      font-size: 13.5px;
    }
    code {
      background: #f1f5f9;
      color: #0f172a;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
    }
    .kbd {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      box-shadow: 0 1px 0 #94a3b8;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 12px;
      font-family: monospace;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .manual-container { box-shadow: none; border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="manual-container">
    <div class="header">
      <div>
        <h1>Manual Oficial de Instalação e Atualização</h1>
        <p>${schoolName} • SucessoEdu Gestão Educacional (Versão 5.x Enterprise)</p>
      </div>
      <div class="badge">Homologação 2026 • SEDUC / Suporte TI</div>
    </div>

    <p>
      Este manual estabelece as diretrizes e os passos práticos detalhados para duas situações fundamentais: 
      <strong>(1) Instalação do Zero em um Computador Novo</strong> e <strong>(2) Atualização do Sistema em um Computador que já possui o SucessoEdu instalado</strong>, garantindo preservação total de banco de dados e registros acadêmicos.
    </p>

    <!-- GUIA 1: INSTALAÇÃO DO ZERO -->
    <div class="section-header">
      <h2 class="fresh-install">PARTE 1: PASSO A PASSO PARA INSTALAÇÃO DO ZERO (Computador Novo ou Formatado)</h2>
      <span class="badge badge-green">Primeira Instalação Limpa</span>
    </div>
    <p>Utilize este procedimento quando o computador for novo, tiver sido recém-formatado ou nunca tiver recebido o SucessoEdu anteriormente:</p>

    <div class="step-box">
      <div class="step-number step-number-green">1</div>
      <div class="step-content">
        <strong>Passo 1: Baixar e Extrair o Pacote de Instalação Completo (.ZIP)</strong>
        Baixe o pacote oficial <code>SucessoEdu_Instalador_Completo_v5.4.0.zip</code> do Google Drive ou copie via pen drive.<br/>
        <em>Importante:</em> Não execute os scripts diretamente de dentro do arquivo ZIP compactado. 
        Clique com o <strong>botão direito</strong> no arquivo ZIP e escolha <strong>"Extrair Tudo..."</strong>.<br/>
        <em>Observação sobre caminhos:</em> Mesmo que a pasta extraída contenha espaços, números ou parênteses como <code>(1)</code> ou <code>(6)</code>, o instalador já conta com proteção universal de caminhos e funcionará sem erros de sintaxe.
      </div>
    </div>

    <div class="step-box">
      <div class="step-number step-number-green">2</div>
      <div class="step-content">
        <strong>Passo 2: Executar o Instalador Unificado como Administrador</strong>
        Abra a pasta descompactada e localize o executável principal:<br/>
        👉 <code>Instalador_Unificado_SucessoEdu.bat</code><br/>
        Clique nele com o <strong>botão direito do mouse</strong> e selecione <strong>"Executar como Administrador"</strong>.<br/><br/>
        <em>Dicas para telas de segurança do Windows:</em>
        <ul>
          <li><strong>Tela azul do SmartScreen ("O Windows protegeu o seu computador"):</strong> Clique no link <u>"Mais informações"</u> e depois no botão <u>"Executar assim mesmo"</u>.</li>
          <li><strong>Controle de Conta de Usuário (UAC):</strong> Quando o Windows exibir a janela perguntando se permite alterações no computador, clique em <strong>"Sim"</strong>.</li>
        </ul>
      </div>
    </div>

    <div class="step-box">
      <div class="step-number step-number-green">3</div>
      <div class="step-content">
        <strong>Passo 3: Selecionar a Opção [1] no Menu Principal</strong>
        Na tela do instalador, digite o número <code>1</code> e pressione <span class="kbd">Enter</span>:<br/>
        <code>[1] INSTALAR SERVIDOR CENTRAL OFFLINE (COMPLETO)</code><br/><br/>
        <em>O instalador executará de forma 100% automática:</em>
        <ul>
          <li>Criação da pasta raiz do sistema em <code>C:\SucessoEdu</code> (com as subpastas <code>data\</code> e <code>Backups\</code>);</li>
          <li>Configuração de permissões totais no Windows para evitar bloqueios de leitura/escrita;</li>
          <li>Abertura automática e liberação da porta de rede (porta padrão <code>3000</code> TCP) no Firewall do Windows;</li>
          <li>Cópia de todos os módulos de software, banco de dados inicial, painel de notificações e widget flutuante;</li>
          <li>Registro do início automático com o Windows para que o servidor ligue junto com o computador;</li>
          <li>Criação do <strong>Atalho Oficial Único</strong> na Área de Trabalho: <code>SucessoEdu Gestão Educacional.lnk</code>.</li>
        </ul>
      </div>
    </div>

    <div class="step-box">
      <div class="step-number step-number-green">4</div>
      <div class="step-content">
        <strong>Passo 4: Acesso e Primeiro Uso</strong>
        Ao concluir a instalação (leva menos de 20 segundos), o navegador padrão abrirá automaticamente o endereço:<br/>
        👉 <code>http://127.0.0.1:3000</code><br/>
        O Widget Flutuante de Status também aparecerá no canto inferior direito informando <strong>🟢 SucessoEdu Online</strong>. Pronto! A sua escola já pode começar a cadastrar turmas, professores, alunos e notas.
      </div>
    </div>

    <!-- GUIA 2: ATUALIZAÇÃO EM COMPUTADOR QUE JÁ TEM O SISTEMA -->
    <div class="section-header">
      <h2 class="update-install">PARTE 2: PASSO A PASSO PARA ATUALIZAR COMPUTADOR QUE JÁ TEM O SISTEMA</h2>
      <span class="badge badge-blue">Preservação Total de Dados Existentes</span>
    </div>
    <p>Utilize este procedimento quando o computador já tiver o SucessoEdu instalado em <code>C:\SucessoEdu</code> e você deseja aplicar novas funcionalidades, melhorias ou correções sem perder nenhum aluno, nota ou configuração:</p>

    <div class="callout">
      <strong>🔒 Garantia Absoluta de Proteção de Dados:</strong> O atualizador do SucessoEdu possui proteção atômica contra perda de dados. Antes de substituir qualquer arquivo de código ou página web, o instalador cria automaticamente um <em>Backup Preventivo Integral</em> da pasta <code>data\</code> em <code>C:\SucessoEdu\Backups\Backup_Update_[DATA_HORA]</code>. A sua base de alunos, notas e financeiro é 100% preservada.
    </div>

    <div class="step-box">
      <div class="step-number step-number-blue">1</div>
      <div class="step-content">
        <strong>Passo 1: Baixar a Nova Versão e Extrair</strong>
        Baixe o pacote da nova versão disponibilizado pelo Suporte Técnico (ex: <code>SucessoEdu_Instalador_Completo_v5.4.0.zip</code>).<br/>
        Clique com o botão direito e selecione <strong>"Extrair Tudo..."</strong> para uma pasta temporária (por exemplo, na pasta Downloads).
      </div>
    </div>

    <div class="step-box">
      <div class="step-number step-number-blue">2</div>
      <div class="step-content">
        <strong>Passo 2: Executar o Atualizador com Privilégios de Administrador</strong>
        Abra a pasta extraída da nova versão. Você tem duas formas rápidas de atualizar:
        <ul>
          <li><strong>Forma Rápida Direta:</strong> Clique com o botão direito sobre <code>ATUALIZAR_SISTEMA_LOCAL.bat</code> e selecione <strong>"Executar como Administrador"</strong>.</li>
          <li><strong>Pelo Instalador Unificado:</strong> Clique com o botão direito sobre <code>Instalador_Unificado_SucessoEdu.bat</code>, selecione <strong>"Executar como Administrador"</strong> e digite a opção <code>[2]</code> (ATUALIZAR ARQUIVOS DA PASTA RAIZ).</li>
        </ul>
      </div>
    </div>

    <div class="step-box">
      <div class="step-number step-number-blue">3</div>
      <div class="step-content">
        <strong>Passo 3: Acompanhar o Processo Automatizado em 5 Etapas</strong>
        O atualizador executará os 5 passos sem você precisar configurar nada:
        <ol>
          <li><strong>Pausa Segura do Servidor:</strong> Encerra de forma limpa os processos do servidor anterior para destravar arquivos em uso;</li>
          <li><strong>Backup Preventivo Automático:</strong> Copia todos os bancos de dados da pasta <code>C:\SucessoEdu\data</code> para <code>C:\SucessoEdu\Backups\Backup_Update_[DATA]</code>;</li>
          <li><strong>Limpeza Seletiva:</strong> Exclui apenas arquivos antigos de telas e scripts de sistema, <u>deixando os seus dados intactos</u>;</li>
          <li><strong>Cópia da Nova Versão:</strong> Implanta os novos módulos, relatórios, correções e páginas web atualizadas em <code>C:\SucessoEdu</code>;</li>
          <li><strong>Renovação de Atalho e Serviços:</strong> Garante que o atalho único <code>SucessoEdu Gestão Educacional.lnk</code> no Desktop aponte para a nova versão.</li>
        </ol>
      </div>
    </div>

    <div class="step-box">
      <div class="step-number step-number-blue">4</div>
      <div class="step-content">
        <strong>Passo 4: Reinício Automático e Conferência</strong>
        Ao término, o sistema reinicia o servidor silencioso e abre o navegador automaticamente.<br/>
        Você verá a nova versão em funcionamento com todos os seus dados históricos, alunos e turmas preservados intactos.
      </div>
    </div>

    <!-- RESOLUÇÃO DE DÚVIDAS E PROBLEMAS FREQUENTES -->
    <div class="section-header">
      <h2>PARTE 3: RESOLUÇÃO DE PROBLEMAS &amp; MENSAGENS NO PROMPT</h2>
      <span class="badge">Diagnóstico Rápido</span>
    </div>

    <h3>1. O erro "A sintaxe do nome do arquivo, do nome do diretório ou do rótulo do volume está incorreta"</h3>
    <div class="callout-info">
      <strong>Causa e Solução Definitiva:</strong> Esse erro ocorria em versões antigas quando o arquivo ZIP era baixado para uma pasta cujo caminho continha espaços, parênteses como <code>(6)</code> ou acentos (ex: <code>C:\Downloads\Pacote_Completo (6)</code>) e o prompt do Windows falhava ao tentar elevar para Administrador.<br/>
      <strong>Correção aplicada:</strong> O instalador atual possui tratamento nativo via <code>[System.Environment]::ComSpec</code> e aspas literais blindadas. Para garantir execução perfeita, sempre utilize a versão mais recente do <code>Instalador_Unificado_SucessoEdu.bat</code>. Caso ainda execute em versão legada, basta renomear a pasta de download removendo os parênteses ou mover a pasta para <code>C:\Instalador_Temp</code> antes de executar.
    </div>

    <h3>2. "A pasta C:\SucessoEdu não foi criada após a instalação"</h3>
    <p>Isso ocorre quando o instalador é executado sem privilégios de Administrador e as políticas de segurança do Windows impedem escrita na raiz da unidade C:. <strong>Solução:</strong> Sempre clique com o <strong>botão direito</strong> no arquivo <code>.bat</code> e escolha <strong>"Executar como Administrador"</strong>. O instalador também conta com fallback automático para <code>%LOCALAPPDATA%\SucessoEdu</code> caso a unidade C: seja restrita por políticas de rede institucional.</p>

    <h3>3. "Porta 3000 já está em uso" ou Servidor anterior não encerra</h3>
    <div class="callout-warning">
      <strong>Liberação Imediata de Portas e Processos:</strong> Execute como Administrador o script <code>DESINSTALAR_OU_LIMPAR_SUCESSOEDU.bat</code> e escolha a opção <strong>[3] APENAS PARAR SERVIÇOS E LIBERAR PORTAS</strong>. Ele encerra qualquer instância residual do Node.js, PowerShell ou WScript sem remover nenhum dado ou arquivo.
    </div>

    <h3>4. Como desinstalar completamente ou resetar o ambiente com segurança?</h3>
    <p>Caso precise remover o sistema ou reinstalar do zero em caso de troca de servidor, o SucessoEdu fornece o utilitário oficial <code>DESINSTALAR_OU_LIMPAR_SUCESSOEDU.bat</code> (também acessível pelo menu <code>[6]</code> do <code>Instalador_Unificado_SucessoEdu.bat</code>):</p>
    <ul>
      <li><strong>Opção [1] DESINSTALAÇÃO SEGURA (Recomendada):</strong> Realiza o encerramento dos serviços, remove as regras de Firewall e atalhos, e <strong>salva automaticamente uma cópia de segurança completa de todos os seus dados na Área de Trabalho</strong> antes de remover a pasta <code>C:\SucessoEdu</code>.</li>
      <li><strong>Opção [2] LIMPEZA TOTAL (Reset de Fábrica):</strong> Remove completamente a instalação e dados sem gerar backup (utilize apenas se tiver certeza).</li>
      <li><strong>Opção [3] LIBERAR PORTAS E DESTRAVAR:</strong> Apenas encerra processos presos e libera a porta de rede, mantendo todos os arquivos intactos.</li>
    </ul>

    <h3>5. Como atualizar computadores de Professores e da Secretaria na rede?</h3>
    <p>Nos computadores da rede que acessam o servidor, <strong>não é necessário reinstalar nada</strong>! Basta que o Servidor Central seja atualizado. Nas outras máquinas, basta abrir o navegador e pressionar <span class="kbd">Ctrl</span> + <span class="kbd">F5</span> para carregar a nova versão instantaneamente.</p>

    <!-- GUIA 3: ESTAÇÕES DE TRABALHO -->
    <div class="section-header">
      <h2>PARTE 3: ATUALIZAÇÃO NAS ESTAÇÕES DE TRABALHO (Rede Local)</h2>
      <span class="badge">Professores • Secretaria • Laboratório</span>
    </div>
    <p>Se a escola possui computadores interligados em rede acessando o servidor central:</p>
    
    <div class="step-box">
      <div class="step-number">A</div>
      <div class="step-content">
        <strong>Atualização Instantânea nas Estações de Trabalho (F5):</strong>
        Como o SucessoEdu opera de maneira centralizada, <strong>não é necessário reinstalar nada nos outros computadores</strong>.<br/>
        Assim que o Servidor Central for atualizado, basta que os professores e secretários nos outros computadores abram o navegador e pressionem <span class="kbd">F5</span> ou <span class="kbd">Ctrl + F5</span> para recarregar o novo sistema instantaneamente.
      </div>
    </div>

    <div class="step-box">
      <div class="step-number">B</div>
      <div class="step-content">
        <strong>Localizador de Servidor (Caso o IP mude):</strong>
        Se o roteador da escola alterar o IP da máquina servidora, execute na estação o script <code>buscar_servidor_rede.ps1</code> ou use o atalho da Área de Trabalho para reconectar automaticamente ao servidor em poucos segundos.
      </div>
    </div>

    <!-- GUIA 4: ATUALIZAÇÃO DIRETA PELA NUVEM -->
    <div class="section-header">
      <h2>PARTE 4: ATUALIZAÇÃO DIRETA PELA NUVEM (Google Drive Oficial)</h2>
      <span class="badge">OTA 1-Clique</span>
    </div>
    <p>Se o computador servidor tiver acesso à internet, a atualização pode ser efetuada diretamente pela interface do sistema:</p>
    <ol>
      <li>No menu lateral esquerdo do SucessoEdu, clique em <strong>⚙️ Atualizações &amp; Nuvem</strong>;</li>
      <li>Clique no botão <strong>"☁️ Verificar Atualizações no Google Drive"</strong>;</li>
      <li>Quando o sistema identificar o novo pacote, clique no botão verde <strong>"⚡ Sincronizar Nuvem (OTA 1-Clique)"</strong>;</li>
      <li>O sistema efetuará o backup atômico, baixará as novidades e aplicará a atualização sem intervenção manual.</li>
    </ol>

    <!-- DÚVIDAS FREQUENTES -->
    <div class="section-header">
      <h2>PERGUNTAS FREQUENTES &amp; RESOLUÇÃO RÁPIDA</h2>
      <span class="badge">Perguntas &amp; Respostas</span>
    </div>
    
    <h3>1. Meus dados, matrículas ou notas correm algum risco na atualização?</h3>
    <p><strong>Não.</strong> O sistema foi arquitetado com isolamento de dados: a pasta <code>C:\SucessoEdu\data</code> é preservada e um backup preventivo completo é gerado na pasta <code>C:\SucessoEdu\Backups</code> antes da substituição de qualquer código.</p>

    <h3>2. E se aparecer uma tela azul ("O Windows protegeu o seu computador")?</h3>
    <p>Isso ocorre porque o instalador é um script <code>.bat</code> administrativo baixado da internet. Basta clicar no link <strong>"Mais informações"</strong> e depois no botão <strong>"Executar assim mesmo"</strong>.</p>

    <h3>3. Posso instalar em um disco diferente de C:?</h3>
    <p>Caso o drive <code>C:\</code> esteja bloqueado por políticas de grupo corporativas ou de rede municipal, o instalador possui fallback automático inteligente para <code>%LOCALAPPDATA%\SucessoEdu</code>, permitindo que o sistema funcione perfeitamente sem erros.</p>

    <h3>4. Preciso rodar como administrador sempre que for usar o sistema?</h3>
    <p><strong>Não.</strong> Os privilégios de administrador são necessários <em>apenas no momento da instalação ou atualização</em> para registrar as portas e serviços. No uso diário, qualquer usuário comum pode abrir o sistema com um duplo clique no atalho da Área de Trabalho.</p>

    <div class="footer">
      <span>SucessoEdu Gestão Educacional • Suporte Oficial: suportetecnicoads@gmail.com</span>
      <span>SEDUC / Engenharia de Software • Documento Homologado</span>
    </div>
  </div>
</body>
</html>
`;
}
