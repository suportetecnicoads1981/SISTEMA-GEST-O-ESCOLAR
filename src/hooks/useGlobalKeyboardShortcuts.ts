import { useState, useEffect, useCallback } from 'react';

export interface ShortcutDefinition {
  id: string;
  key: string;
  displayKey: string;
  label: string;
  category: 'ESSENCIAL' | 'PEDAGOGICO' | 'GESTAO_TI' | 'UTILIDADES';
  tabId?: string;
  description: string;
  isAction?: boolean;
}

export const SYSTEM_SHORTCUTS: ShortcutDefinition[] = [
  // Essenciais
  {
    id: 'dashboard',
    key: 'd',
    displayKey: 'Alt + D',
    label: 'Visão Geral / Dashbox',
    tabId: 'MAIN_DASHBOARD',
    category: 'ESSENCIAL',
    description: 'Abre a tela inicial com métricas executivas e resumo da escola.',
  },
  {
    id: 'secretaria',
    key: 's',
    displayKey: 'Alt + S',
    label: 'Secretaria & Alunos',
    tabId: 'STUDENTS',
    category: 'ESSENCIAL',
    description: 'Gestão cadastral de matrículas, estudantes e transferências.',
  },
  {
    id: 'provas',
    key: 'p',
    displayKey: 'Alt + P',
    label: 'Provas & Exames',
    tabId: 'EXAMS',
    category: 'ESSENCIAL',
    description: 'Gerenciador e construtor de avaliações com correção automática.',
  },
  {
    id: 'turmas',
    key: 't',
    displayKey: 'Alt + T',
    label: 'Turmas & Matrizes',
    tabId: 'CLASSES',
    category: 'ESSENCIAL',
    description: 'Cadastro de turmas, turnos, horários e matrizes curriculares.',
  },

  // Pedagógico
  {
    id: 'diario',
    key: 'e',
    displayKey: 'Alt + E',
    label: 'Diário & Frequência',
    tabId: 'CLASS_DIARY',
    category: 'PEDAGOGICO',
    description: 'Lançamento de chamadas diárias, frequências e planos de aula.',
  },
  {
    id: 'questoes',
    key: 'q',
    displayKey: 'Alt + Q',
    label: 'Banco de Questões BNCC',
    tabId: 'QUESTION_BANK',
    category: 'PEDAGOGICO',
    description: 'Repositório de itens avaliativos e habilidades da BNCC.',
  },
  {
    id: 'relatorios',
    key: 'r',
    displayKey: 'Alt + R',
    label: 'Evolução Pedagógica',
    tabId: 'PEDAGOGICAL_DASHBOARD',
    category: 'PEDAGOGICO',
    description: 'Gráficos analíticos de rendimento, proficiência e notas.',
  },
  {
    id: 'documentos',
    key: 'o',
    displayKey: 'Alt + O',
    label: 'Documentos Oficiais',
    tabId: 'DOCUMENTS',
    category: 'PEDAGOGICO',
    description: 'Emissão de declarações, certidões e históricos escolares.',
  },
  {
    id: 'sala_aluno',
    key: 'f',
    displayKey: 'Alt + F',
    label: 'Sala do Aluno',
    tabId: 'STUDENT_ROOM',
    category: 'PEDAGOGICO',
    description: 'Ambiente seguro para aplicação digital de testes e provas.',
  },

  // Gestão & TI
  {
    id: 'censo',
    key: 'c',
    displayKey: 'Alt + C',
    label: 'Censo de Evasão Escolar',
    tabId: 'DROPOUT_CENSUS',
    category: 'GESTAO_TI',
    description: 'Busca ativa escolar e estatísticas de evasão por localidade.',
  },
  {
    id: 'municipio',
    key: 'm',
    displayKey: 'Alt + M',
    label: 'Polos Remotos & Município',
    tabId: 'MUNICIPAL_SYNC',
    category: 'GESTAO_TI',
    description: 'Sincronização em lote com escolas rurais e Secretaria.',
  },
  {
    id: 'usuarios',
    key: 'u',
    displayKey: 'Alt + U',
    label: 'Controle de Usuários',
    tabId: 'USER_CONTROL',
    category: 'GESTAO_TI',
    description: 'Gerenciamento de contas, perfis e permissões por setor.',
  },
  {
    id: 'cleanslate',
    key: 'z',
    displayKey: 'Alt + Z',
    label: 'CleanSlate Enterprise Hub',
    tabId: 'CLEANSLATE_HUB',
    category: 'GESTAO_TI',
    description: 'Segurança desktop, updates em chunks de 64MB, Zero-Data e Ephemeral CLI.',
  },
  {
    id: 'instalaflow',
    key: 'f',
    displayKey: 'Alt + F',
    label: 'InstalaFlow Híbrido (Supabase)',
    tabId: 'INSTALAFLOW',
    category: 'GESTAO_TI',
    description: 'Deploy híbrido Windows, SQLite local offline e sync Supabase com resolução de conflitos.',
  },
  {
    id: 'instaladores',
    key: 'i',
    displayKey: 'Alt + I',
    label: 'Instaladores & Backup',
    tabId: 'NETWORK_INSTALLER',
    category: 'GESTAO_TI',
    description: 'Geração de pacotes offline e rotinas de backup da rede.',
  },
  {
    id: 'whatsapp',
    key: 'w',
    displayKey: 'Alt + W',
    label: 'WhatsApp Notificações',
    tabId: 'WHATSAPP',
    category: 'GESTAO_TI',
    description: 'Envio em massa de comunicados e notas para os responsáveis.',
  },
  {
    id: 'sobre',
    key: 'a',
    displayKey: 'Alt + A',
    label: 'Sobre o Sistema',
    tabId: 'ABOUT',
    category: 'GESTAO_TI',
    description: 'Informações da versão, suporte técnico e documentação.',
  },

  // Utilidades
  {
    id: 'notificacoes',
    key: 'n',
    displayKey: 'Alt + N',
    label: 'Central de Notificações',
    tabId: 'NOTIFICATIONS',
    category: 'UTILIDADES',
    description: 'Avisos do sistema, alertas pedagógicos e avisos urgentes.',
  },
  {
    id: 'ajuda_atalhos',
    key: 'k',
    displayKey: 'Alt + K ou ?',
    label: 'Guia de Atalhos',
    category: 'UTILIDADES',
    description: 'Exibe o mapa interativo de todos os atalhos de teclado.',
    isAction: true,
  },
];

interface UseGlobalKeyboardShortcutsOptions {
  onNavigate: (tabId: string) => void;
  isEnabled?: boolean;
}

export function useGlobalKeyboardShortcuts({
  onNavigate,
  isEnabled = true,
}: UseGlobalKeyboardShortcutsOptions) {
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [activeShortcutToast, setActiveShortcutToast] = useState<{
    keyLabel: string;
    targetName: string;
  } | null>(null);

  const triggerToast = useCallback((keyLabel: string, targetName: string) => {
    setActiveShortcutToast({ keyLabel, targetName });
    const timer = setTimeout(() => {
      setActiveShortcutToast(null);
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Allow Escape to close modals
      if (event.key === 'Escape' && isShortcutsModalOpen) {
        event.preventDefault();
        setIsShortcutsModalOpen(false);
        return;
      }

      // Shift + ? to open shortcuts modal (when not in an input)
      const target = event.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (event.key === '?' && !event.altKey && !event.ctrlKey && !isInputFocused) {
        event.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }

      // Check for Alt + Key (or Ctrl + Alt + Key)
      if (event.altKey && !event.metaKey) {
        const pressedKey = event.key.toLowerCase();

        // Check if it matches Alt + K (Shortcuts Guide)
        if (pressedKey === 'k' || pressedKey === 'h') {
          event.preventDefault();
          event.stopPropagation();
          setIsShortcutsModalOpen((prev) => !prev);
          triggerToast('Alt + K', 'Guia de Atalhos de Teclado');
          return;
        }

        // Match against registered navigation shortcuts
        const matched = SYSTEM_SHORTCUTS.find(
          (s) => s.key.toLowerCase() === pressedKey && s.tabId
        );

        if (matched && matched.tabId) {
          event.preventDefault();
          event.stopPropagation();

          // If focused on an input, blur it so the user can immediately interact with the new view
          if (isInputFocused && target) {
            target.blur();
          }

          onNavigate(matched.tabId);
          triggerToast(matched.displayKey, matched.label);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isEnabled, isShortcutsModalOpen, onNavigate, triggerToast]);

  return {
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    activeShortcutToast,
    shortcuts: SYSTEM_SHORTCUTS,
  };
}
