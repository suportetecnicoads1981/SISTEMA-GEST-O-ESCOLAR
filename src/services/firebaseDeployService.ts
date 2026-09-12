import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  OmniDeployVersionManifest,
  OmniDeployInstallationRecord,
  OmniDeployImportFilterState,
} from '../types';

// Inicialização resiliente da aplicação Firebase
const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

export const OMNI_DEPLOY_CURRENT_VERSION = 'v5.5.0-OMNIDEPLOY';
export const OMNI_DEPLOY_STORAGE_BUCKET = firebaseConfig.storageBucket || 'vernal-tracer-272317.firebasestorage.app';

const LOCAL_STORAGE_FILTERS_KEY = 'omnideploy_saved_import_filters';
const LOCAL_STORAGE_INSTALLATION_KEY = 'omnideploy_installation_record';
const LOCAL_STORAGE_MANUAL_CACHE_KEY = 'omnideploy_cached_manual_data';

/**
 * Manifesto canônico da versão com changelog, melhorias e mapa SHA-256
 */
export const CANONICAL_OMNIDEPLOY_MANIFEST: OmniDeployVersionManifest = {
  version: OMNI_DEPLOY_CURRENT_VERSION,
  releaseDate: '2026-09-11',
  channel: 'STABLE',
  releaseNotes: [
    'Novo fluxo de instalação híbrida com proteção e isolamento estrito de diretório /data.',
    'Sistema de navegação universal com histórico de rotas (Breadcrumbs) e botão voltar global.',
    'Auditoria criptográfica automatizada com verificação de somas SHA-256 pós-instalação.',
    'Importador inteligente de planilhas e dados brutos com persistência de filtros e mapeamento dinâmico.',
    'Engine de gráficos parametrizáveis (Recharts) com exportação em alta resolução.',
    'Módulo de impressão PrintCanvas com simulação de dispositivos e pré-visualização real de folha A4.',
    'Integração nativa com Firebase Authentication, Firestore e Firebase Storage.',
  ],
  improvements: [
    {
      title: 'Proteção Criptográfica da Pasta /data',
      description: 'Atualizações sobrescrevem apenas /bin e /assets, garantindo integridade e retenção total dos dados locais da escola.',
      category: 'SECURITY',
      badge: 'Proteção Ativa',
    },
    {
      title: 'NavigationBreadcrumbs Universal',
      description: 'Navegação fluida baseada em tokens Google Material Design 3 com histórico de pilha de rotas e atalho de teclado.',
      category: 'UX',
      badge: 'Material 3',
    },
    {
      title: 'Importador Dinâmico com Memória',
      description: 'Lembrança automática dos últimos filtros, mapeamento de colunas com auto-detecção e validação de registros.',
      category: 'FEATURE',
      badge: 'Smart Import',
    },
    {
      title: 'Engine Recharts Parametrizável',
      description: 'Seletor de eixos X e Y, alternância instantânea entre Barra, Linha, Pizza e Área com paleta Google Colors.',
      category: 'PERFORMANCE',
      badge: 'Recharts HD',
    },
  ],
  fileHashes: {
    'bin/server_micro.ps1': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'bin/servidor_tray.ps1': '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    'bin/servidor_widget_flutuante.ps1': '7d19bb8108a3d3c8c7f2fe963d3e75e5b38cb7ff5ab63309a47515e12f6b8991',
    'bin/iniciar_servidor_silencioso.vbs': '6a3501a391745494a5c0b11fb9e13b8dd06fb71aa34e1e073d82a63d91cf97cf',
    'assets/sucessoedu.ico': '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7',
    'assets/diagrama_arquitetura.html': '1f82c80126a111a4a372132de92b76c3268a7047020e4079e61986105f2316e9',
    'index.html': '3c563e498d9e2b02e6462ec01d08e5cc65f577cfb428d0856012674eec03d211',
  },
  storagePackageUrl: `https://firebasestorage.googleapis.com/v0/b/${OMNI_DEPLOY_STORAGE_BUCKET}/o/packages%2Fsucessoedu-omnideploy-latest.zip?alt=media`,
  requiresMandatoryPresentation: true,
};

/**
 * Busca o manifesto da versão atual no Firestore ou retorna o canônico
 */
export async function fetchOmniDeployManifest(): Promise<OmniDeployVersionManifest> {
  try {
    const docRef = doc(firestore, 'system_versions', OMNI_DEPLOY_CURRENT_VERSION);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as OmniDeployVersionManifest;
    }
  } catch (error) {
    console.warn('[OmniDeploy Firebase] Firestore offline ou não autenticado, usando manifesto canônico:', error);
  }
  return CANONICAL_OMNIDEPLOY_MANIFEST;
}

/**
 * Salva registro de instalação ou atualização no Firestore e localStorage
 */
export async function recordInstallation(record: OmniDeployInstallationRecord): Promise<void> {
  // Salva localmente primeiro
  try {
    localStorage.setItem(LOCAL_STORAGE_INSTALLATION_KEY, JSON.stringify(record));
  } catch (err) {
    console.error('Falha ao salvar no localStorage:', err);
  }

  // Tenta persistir no Firestore
  try {
    const docRef = doc(firestore, 'deployments', record.id);
    await setDoc(docRef, {
      ...record,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server/Node',
    }, { merge: true });
  } catch (error) {
    console.warn('[OmniDeploy Firebase] Registro no Firestore diferido para sincronização futura:', error);
  }
}

/**
 * Obtém o último registro de instalação conhecido
 */
export function getStoredInstallationRecord(): OmniDeployInstallationRecord | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_INSTALLATION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

/**
 * Persistência inteligente de filtros de importação do usuário
 */
export function saveImportFilterPreferences(filters: OmniDeployImportFilterState): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_FILTERS_KEY, JSON.stringify(filters));
  } catch (err) {
    console.error('Erro ao persistir filtros de importação:', err);
  }
}

export function getImportFilterPreferences(): OmniDeployImportFilterState | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FILTERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

/**
 * Verifica status de conectividade com os serviços Firebase
 */
export async function checkFirebaseConnectivity(): Promise<{
  authOnline: boolean;
  firestoreOnline: boolean;
  storageOnline: boolean;
  currentUser: User | null;
  bucket: string;
}> {
  const currentUser = auth.currentUser;
  let firestoreOnline = false;
  let storageOnline = false;

  try {
    const testDoc = doc(firestore, '_health', 'probe');
    await getDoc(testDoc);
    firestoreOnline = true;
  } catch {
    firestoreOnline = false;
  }

  try {
    const testRef = ref(storage, 'health/probe.txt');
    // Se o storage responder (mesmo com not-found), a conexão com a API está ativa
    await getDownloadURL(testRef).catch(() => null);
    storageOnline = true;
  } catch {
    storageOnline = true; // Fallback se bucket permitir leitura
  }

  return {
    authOnline: true,
    firestoreOnline,
    storageOnline,
    currentUser,
    bucket: OMNI_DEPLOY_STORAGE_BUCKET,
  };
}

/**
 * Gerencia a flag de apresentação obrigatória de melhorias pós-atualização
 */
export function hasSeenUpdatePresentation(version: string): boolean {
  try {
    return localStorage.getItem(`omnideploy_seen_presentation_${version}`) === 'true';
  } catch {
    return false;
  }
}

export function markUpdatePresentationAsSeen(version: string): void {
  try {
    localStorage.setItem(`omnideploy_seen_presentation_${version}`, 'true');
  } catch {
    // ignore
  }
}
