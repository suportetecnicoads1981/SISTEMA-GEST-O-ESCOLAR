import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, UserRole } from '../types';
import { normalizeRole } from '../utils/roleNormalizer';

// Inicialização segura do Firebase App
const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestoreDb = getFirestore(firebaseApp);

/**
 * Busca com segurança o perfil do usuário na coleção 'users/{uid}' do Firestore.
 * Em caso de falha ou documento inexistente, retorna um perfil padrão seguro para evitar que o objeto de permissões fique indefinido.
 */
export const fetchFirebaseUserProfile = async (uid: string, fallbackEmail?: string): Promise<UserProfile> => {
  const defaultProfile: UserProfile = {
    id: uid,
    email: fallbackEmail || '',
    name: fallbackEmail ? fallbackEmail.split('@')[0] : 'Usuário',
    role: 'STUDENT',
  };

  if (!uid) {
    return defaultProfile;
  }

  try {
    const userDocRef = doc(firestoreDb, 'users', uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const rawRole = data?.role || data?.userRole || 'STUDENT';
      
      return {
        id: uid,
        email: data?.email || fallbackEmail || '',
        name: data?.name || data?.displayName || (fallbackEmail ? fallbackEmail.split('@')[0] : 'Usuário'),
        role: normalizeRole(rawRole),
        avatar_url: data?.avatar_url || data?.photoURL,
        created_at: data?.created_at,
        updated_at: data?.updated_at,
      };
    } else {
      console.warn(`[FirebaseAuth] Perfil não encontrado no Firestore para UID ${uid}. Aplicando perfil padrão.`);
      return defaultProfile;
    }
  } catch (err) {
    console.warn(`[FirebaseAuth] Erro ao buscar perfil no Firestore (${uid}). Usando perfil seguro de fallback:`, err);
    return defaultProfile;
  }
};

/**
 * Escuta mudanças de autenticação no Firebase Auth com tratamento de hidratação.
 */
export const subscribeToFirebaseAuth = (
  callback: (user: FirebaseUser | null, profile: UserProfile | null) => void
) => {
  return onAuthStateChanged(firebaseAuth, async (fbUser) => {
    if (fbUser) {
      const profile = await fetchFirebaseUserProfile(fbUser.uid, fbUser.email || undefined);
      callback(fbUser, profile);
    } else {
      callback(null, null);
    }
  });
};
