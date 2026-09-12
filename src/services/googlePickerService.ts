import { getDriveAccessToken, googleDriveSignIn } from './googleDriveService';

export interface GooglePickerDoc {
  id: string;
  name: string;
  mimeType: string;
  description?: string;
  url?: string;
  sizeBytes?: number;
  lastEditedUtc?: number;
  iconUrl?: string;
  type?: string;
  downloadUrl?: string;
}

export interface OpenGooglePickerOptions {
  title?: string;
  multiselect?: boolean;
  mimeTypes?: string;
  viewType?: 'all' | 'documents' | 'spreadsheets' | 'folders' | 'recent';
  includeUploadView?: boolean;
}

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

/**
 * Loads the Google API script and initializes the Google Picker component
 */
export const loadGooglePickerApi = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // If already loaded and ready
    if (window.google?.picker?.PickerBuilder) {
      resolve();
      return;
    }

    const initPicker = () => {
      if (window.gapi) {
        window.gapi.load('picker', {
          callback: () => {
            if (window.google?.picker?.PickerBuilder) {
              resolve();
            } else {
              // Wait slightly for window.google.picker to bind
              setTimeout(() => {
                if (window.google?.picker?.PickerBuilder) {
                  resolve();
                } else {
                  reject(new Error('Google Picker API inicializado mas não disponível.'));
                }
              }, 100);
            }
          },
          onerror: () => {
            reject(new Error('Erro ao carregar o módulo do Google Picker via gapi.'));
          },
        });
      } else {
        reject(new Error('Biblioteca gapi não encontrada.'));
      }
    };

    if (window.gapi) {
      initPicker();
      return;
    }

    // If script not on page, dynamically add it
    const existingScript = document.getElementById('google-api-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-api-script';
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initPicker();
      };
      script.onerror = () => {
        reject(new Error('Falha ao carregar https://apis.google.com/js/api.js'));
      };
      document.body.appendChild(script);
    } else {
      // Poll briefly for gapi
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.gapi) {
          clearInterval(interval);
          initPicker();
        } else if (attempts > 30) {
          clearInterval(interval);
          reject(new Error('Tempo esgotado aguardando carregamento da biblioteca Google API.'));
        }
      }, 100);
    }
  });
};

/**
 * Helper to compute the exact origin required for Google Picker in iframe/embedded contexts
 */
export const getPickerOrigin = (): string => {
  if (window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0) {
    return window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1];
  }
  return window.location.origin;
};

/**
 * Opens Google Picker to let the user select files or documents from Google Drive.
 * Complies strictly with the client-side Google Picker instructions:
 * - Uses PickerBuilder
 * - Sets OAuth token
 * - Sets origin
 * - DOES NOT use developer key
 */
export const launchGooglePicker = async (
  options: OpenGooglePickerOptions = {}
): Promise<GooglePickerDoc[]> => {
  // 1. Ensure access token is available
  let accessToken = await getDriveAccessToken();
  if (!accessToken) {
    // Prompt user to sign in with Google Drive scopes
    const authResult = await googleDriveSignIn();
    if (!authResult?.accessToken) {
      throw new Error('Autenticação com Google Drive cancelada ou falhou.');
    }
    accessToken = authResult.accessToken;
  }

  // 2. Ensure Google Picker script is loaded
  await loadGooglePickerApi();

  if (!window.google?.picker?.PickerBuilder) {
    throw new Error('Google Picker não está disponível no navegador.');
  }

  return new Promise((resolve, reject) => {
    try {
      const pickerOrigin = getPickerOrigin();

      // Configure View
      let view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
      if (options.mimeTypes) {
        view.setMimeTypes(options.mimeTypes);
      }
      view.setIncludeFolders(true);

      const builder = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(accessToken)
        .setOrigin(pickerOrigin);

      // Support multi-select if requested
      if (options.multiselect) {
        builder.enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED);
      }

      // Support direct upload tab if requested
      if (options.includeUploadView && window.google.picker.DocsUploadView) {
        builder.addView(new window.google.picker.DocsUploadView());
      }

      if (options.title) {
        builder.setTitle(options.title);
      } else {
        builder.setTitle('Selecionar Arquivos no Google Drive — SucessoEdu');
      }

      // Callback handler
      builder.setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const docs: GooglePickerDoc[] = (data.docs || []).map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            mimeType: doc.mimeType,
            description: doc.description || '',
            url: doc.url || `https://drive.google.com/file/d/${doc.id}/view`,
            sizeBytes: doc.sizeBytes,
            lastEditedUtc: doc.lastEditedUtc,
            iconUrl: doc.iconUrl,
            type: doc.type,
            downloadUrl: `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`,
          }));
          resolve(docs);
        } else if (data.action === window.google.picker.Action.CANCEL) {
          // User closed the picker dialog
          resolve([]);
        }
      });

      const picker = builder.build();
      picker.setVisible(true);
    } catch (err: any) {
      console.error('Erro ao construir ou exibir Google Picker:', err);
      reject(err);
    }
  });
};

/**
 * Reads the text content of a picked file from Google Drive using its ID and current OAuth token
 */
export const fetchGoogleDriveFileContent = async (fileId: string): Promise<string> => {
  const token = await getDriveAccessToken();
  if (!token) {
    throw new Error('Sessão do Google Drive expirada. Faça login novamente.');
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao ler arquivo do Google Drive (HTTP ${response.status})`);
  }

  return await response.text();
};
