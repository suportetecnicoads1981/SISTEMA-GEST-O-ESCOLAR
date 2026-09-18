import { SystemUpdatePackage, SystemUpdateImprovement } from '../types';
import { OFFICIAL_CLOUD_UPDATE_PACKAGES } from '../utils/updatePackageHelper';

export interface VersionComparisonResult {
  fromVersion: string;
  toVersion: string;
  totalNewImprovements: number;
  newImprovements: SystemUpdateImprovement[];
  packagesInBetween: SystemUpdatePackage[];
}

export interface VersionReleaseTimelineItem {
  id: string;
  version: string;
  releaseDate: string;
  title: string;
  summary: string;
  severity: string;
  sizeFormatted: string;
  sha256Checksum: string;
  isInstalled: boolean;
  improvementsCount: number;
  improvements: SystemUpdateImprovement[];
}

/**
 * Catálogo mestre oficial consolidado de todas as versões do SucessoEdu
 * com todas as melhorias categorizadas e mapeamento direto para os módulos do sistema.
 */
export const MASTER_VERSION_PACKAGES: SystemUpdatePackage[] = [
  {
    id: 'pkg-v5.4.1-enterprise',
    version: 'v5.4.1-ENTERPRISE',
    releaseDate: '2026-09-06',
    title: 'SucessoEdu 5.4.1: DataSync Pro, Integridade Relacional (FK) e Controle Unificado de Versões',
    summary: 'Módulo de integridade relacional com autocura de chaves estrangeiras, sincronização Supabase com DDL avançado e controle interativo de melhorias da versão.',
    description: 'Versão de alta estabilidade e confiabilidade que introduz o motor de auditoria de integridade relacional entre Alunos, Turmas, Provas e Históricos, além da apresentação dinâmica das melhorias e controle de versões do sistema.',
    severity: 'MAJOR',
    sizeFormatted: '64.2 MB',
    isInstalled: true,
    installedAt: '2026-09-06T08:00:00.000Z',
    installedBy: 'Administrador Master ADS',
    downloadUrl: '/api/updates/download/pkg-v5.4.1-enterprise',
    cloudStorageUrl: 'https://drive.google.com/drive/search?q=SucessoEdu_Update_v5.4.1_Enterprise.edupkg',
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
  ...OFFICIAL_CLOUD_UPDATE_PACKAGES,
];

/**
 * Retorna todos os pacotes de versão disponíveis, mesclando dados armazenados com o catálogo oficial.
 */
export function getAllVersionPackages(customPackages?: SystemUpdatePackage[]): SystemUpdatePackage[] {
  const mergedMap = new Map<string, SystemUpdatePackage>();

  // Add default master packages
  MASTER_VERSION_PACKAGES.forEach((pkg) => {
    mergedMap.set(pkg.version, pkg);
  });

  // Override with custom stored packages if any
  if (customPackages && Array.isArray(customPackages)) {
    customPackages.forEach((pkg) => {
      if (pkg && pkg.version) {
        mergedMap.set(pkg.version, {
          ...(mergedMap.get(pkg.version) || {}),
          ...pkg,
        });
      }
    });
  }

  return Array.from(mergedMap.values());
}

/**
 * Retorna a versão atualmente instalada no sistema
 */
export function getCurrentSystemVersion(customVersion?: string): string {
  if (customVersion && customVersion.trim()) {
    return customVersion;
  }
  try {
    const stored = localStorage.getItem('sucessoedu_active_version');
    if (stored) return stored;
  } catch {}
  return 'v5.4.1-ENTERPRISE';
}

/**
 * Retorna os detalhes da versão por string de versão (ex: 'v5.4.0-ENTERPRISE' ou '5.4.0')
 */
export function getVersionDetails(version: string, packages?: SystemUpdatePackage[]): SystemUpdatePackage | null {
  const all = getAllVersionPackages(packages);
  const normalized = version.toLowerCase().replace(/^v/, '').trim();
  return (
    all.find((p) => p.version.toLowerCase().replace(/^v/, '').trim() === normalized) ||
    all.find((p) => p.version.toLowerCase().includes(normalized)) ||
    all[0] ||
    null
  );
}

/**
 * Compara duas versões e retorna a lista de melhorias e pacotes intermediários
 */
export function compareVersions(
  fromVersion: string,
  toVersion: string,
  packages?: SystemUpdatePackage[]
): VersionComparisonResult {
  const all = getAllVersionPackages(packages);
  const fromPkg = getVersionDetails(fromVersion, all);
  const toPkg = getVersionDetails(toVersion, all);

  const newImprovements: SystemUpdateImprovement[] = [];
  const packagesInBetween: SystemUpdatePackage[] = [];

  if (toPkg) {
    // Collect all improvements from toPkg
    newImprovements.push(...toPkg.improvements);
    packagesInBetween.push(toPkg);

    // If there are other packages in between
    const toIndex = all.findIndex((p) => p.id === toPkg.id);
    const fromIndex = fromPkg ? all.findIndex((p) => p.id === fromPkg.id) : all.length;

    if (toIndex >= 0 && fromIndex > toIndex) {
      for (let i = toIndex + 1; i < fromIndex; i++) {
        const midPkg = all[i];
        if (midPkg) {
          packagesInBetween.push(midPkg);
          midPkg.improvements.forEach((imp) => {
            if (!newImprovements.some((existing) => existing.title === imp.title)) {
              newImprovements.push(imp);
            }
          });
        }
      }
    }
  }

  return {
    fromVersion,
    toVersion,
    totalNewImprovements: newImprovements.length,
    newImprovements,
    packagesInBetween,
  };
}

/**
 * Mapeia a categoria da melhoria para o módulo de navegação correto no SucessoEdu
 */
export function getTargetTabForImprovement(improvement: SystemUpdateImprovement): {
  tabId: string;
  label: string;
} {
  const title = improvement.title.toLowerCase();
  const desc = improvement.description.toLowerCase();
  const cat = improvement.category;

  if (title.includes('login') || title.includes('acesso') || title.includes('usuário')) {
    return { tabId: 'USER_CONTROL', label: 'Controle de Usuários' };
  }
  if (title.includes('whatsapp') || title.includes('comunicado')) {
    return { tabId: 'WHATSAPP', label: 'WhatsApp Notificações' };
  }
  if (title.includes('c:\\sucessoedu') || title.includes('instalador') || title.includes('servidor')) {
    return { tabId: 'NETWORK_INSTALLER', label: 'Central de Instalação' };
  }
  if (title.includes('integridade') || title.includes('chave estrangeira') || title.includes('fk')) {
    return { tabId: 'ADMIN_TI', label: 'Integridade & TI' };
  }
  if (title.includes('datasync') || title.includes('supabase') || title.includes('ddl')) {
    return { tabId: 'DATASYNC_PRO', label: 'DataSync Pro' };
  }
  if (title.includes('diagrama') || title.includes('arquitetura')) {
    return { tabId: 'ARCHITECTURE_DIAGRAM', label: 'Diagrama de Arquitetura' };
  }
  if (title.includes('diário') || title.includes('frequência') || title.includes('chamada')) {
    return { tabId: 'CLASS_DIARY', label: 'Diário de Classe' };
  }
  if (title.includes('prova') || title.includes('avaliação') || title.includes('distrator')) {
    return { tabId: 'EXAMS', label: 'Gerador de Provas' };
  }
  if (title.includes('bncc') || title.includes('pedagógico') || title.includes('aprendizagem')) {
    return { tabId: 'PEDAGOGICAL_DASHBOARD', label: 'Evolução Pedagógica' };
  }
  if (title.includes('evasão') || title.includes('busca ativa')) {
    return { tabId: 'DROPOUT_CENSUS', label: 'Censo de Evasão' };
  }
  if (title.includes('histórico') || title.includes('matrícula') || title.includes('aluno')) {
    return { tabId: 'STUDENTS', label: 'Secretaria & Alunos' };
  }
  if (title.includes('polo') || title.includes('edusync') || title.includes('municipal')) {
    return { tabId: 'MUNICIPAL_SYNC', label: 'Polos Remotos & Censo' };
  }
  if (cat === 'SEGURANCA') {
    return { tabId: 'NOTIFICATIONS', label: 'Central de Segurança' };
  }
  if (cat === 'PERFORMANCE' || cat === 'SISTEMA') {
    return { tabId: 'SYSTEM_UPDATES', label: 'Atualizações na Nuvem' };
  }
  return { tabId: 'MAIN_DASHBOARD', label: 'Visão Geral' };
}

/**
 * Gera o relatório formatado em HTML de Boletim Oficial de Atualização para impressão ou download
 */
export function generateReleaseNotesHtml(pkg: SystemUpdatePackage, schoolName?: string): string {
  const improvementsHtml = pkg.improvements
    .map(
      (imp, idx) => `
      <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px; background-color: #f8fafc;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="background-color: #e0e7ff; color: #3730a3; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">
            ${imp.category}
          </span>
          <span style="color: #059669; font-size: 11px; font-weight: 700;">
            ✔ Homologado & Ativo
          </span>
        </div>
        <h4 style="margin: 0 0 6px 0; color: #0f172a; font-size: 14px; font-weight: 700;">
          ${idx + 1}. ${imp.title}
        </h4>
        <p style="margin: 0; color: #475569; font-size: 12px; line-height: 1.6;">
          ${imp.description}
        </p>
      </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Boletim Oficial de Atualização - SucessoEdu ${pkg.version}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 32px;
      color: #0f172a;
      background: #ffffff;
    }
    .header {
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      background: #2563eb;
      color: white;
      font-size: 12px;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 8px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: #f1f5f9;
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 24px;
      font-size: 12px;
    }
    .meta-item strong {
      display: block;
      color: #64748b;
      font-size: 11px;
      text-transform: uppercase;
    }
    .meta-item span {
      font-weight: 700;
      color: #1e293b;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #64748b;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="badge">BOLETIM OFICIAL DE ATUALIZAÇÃO DO SISTEMA</span>
    <h1 style="margin: 4px 0 8px 0; font-size: 24px;">SucessoEdu Gestão Educacional - Versão ${pkg.version}</h1>
    <p style="margin: 0; color: #475569; font-size: 13px;">${pkg.title}</p>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <strong>Data de Liberação</strong>
      <span>${pkg.releaseDate}</span>
    </div>
    <div class="meta-item">
      <strong>Severidade</strong>
      <span>${pkg.severity}</span>
    </div>
    <div class="meta-item">
      <strong>Tamanho do Pacote</strong>
      <span>${pkg.sizeFormatted}</span>
    </div>
    <div class="meta-item">
      <strong>Assinatura SHA-256</strong>
      <span style="font-family: monospace; font-size: 10px;">${pkg.sha256Checksum.substring(0, 16)}...</span>
    </div>
  </div>

  <h3 style="font-size: 16px; margin: 24px 0 12px 0;">Resumo Executivo</h3>
  <p style="font-size: 13px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
    ${pkg.description || pkg.summary}
  </p>

  <h3 style="font-size: 16px; margin: 24px 0 12px 0;">Registro de Todas as Melhorias Implementadas (${pkg.improvements.length})</h3>
  ${improvementsHtml}

  <div class="footer">
    <p>Documento emitido automaticamente pelo ecossistema SucessoEdu para ${schoolName || 'Colégio Horizonte do Saber & Inovação'}.</p>
    <p>Diretório Raiz Homologado: C:\\SucessoEdu • Canal de Distribuição em Nuvem: Google Drive Oficial</p>
  </div>
</body>
</html>`;
}

/**
 * Faz download do boletim de release notes como arquivo HTML
 */
export function downloadReleaseNotesFile(pkg: SystemUpdatePackage, schoolName?: string): void {
  const html = generateReleaseNotesHtml(pkg, schoolName);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Boletim_Atualizacao_SucessoEdu_${pkg.version.replace(/[^a-zA-Z0-9.-]/g, '_')}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
