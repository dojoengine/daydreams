import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types
export interface Message {
  type: string;
  message?: string;
  error?: string;
  orchestratorId?: string;
  timestamp?: number;
  messageType?: string;
  data?: any;
  orchestrators?: Array<{
    id: string;
    name: string;
  }>;
}

export interface Orchestrator {
  id: string;
  name: string;
  userId: string;
}

export interface AppState {
  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Debug
  showDebug: boolean;
  toggleShowDebug: () => void;

  // Messages
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  getMessagesForCurrentOrchestrator: () => Message[];

  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  addLoadingMessage: () => void;

  // Orchestrator
  orchestrators: Orchestrator[];
  currentOrchestratorId: string | null;
  currentChatId: string | null;
  setOrchestrators: (orchestrators: Orchestrator[]) => void;
  setCurrentOrchestratorId: (id: string | null) => void;
  setCurrentChatId: (id: string) => void;
  addOrchestrator: (orchestrator: Orchestrator) => void;

  // New debug state
  toggleDebug: () => void;
}

type SetState = (
  partial: AppState | Partial<AppState> | ((state: AppState) => AppState | Partial<AppState>),
  replace?: boolean
) => void;

type GetState = () => AppState;

export const useAppStore = create<AppState>()(
  devtools(
    (set: SetState, get: GetState) => ({
      // Theme
      theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
      toggleTheme: () =>
        set((state: AppState) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          localStorage.setItem('theme', newTheme);
          return { theme: newTheme };
        }),

      // Debug
      showDebug: false,
      toggleShowDebug: () => set((state: AppState) => ({ showDebug: !state.showDebug })),

      // Messages
      messages: [],
      addMessage: (message: Message) =>
        set((state: AppState) => ({ messages: [...state.messages, message] })),
      clearMessages: () => set({ messages: [] }),
      getMessagesForCurrentOrchestrator: () => {
        const state = get();
        return state.messages.filter(
          (msg: Message) =>
            msg.orchestratorId === state.currentOrchestratorId ||
            msg.type === 'welcome' ||
            msg.type === 'orchestrators_list'
        );
      },

      // Loading state
      isLoading: false,
      setIsLoading: (loading: boolean) => set({ isLoading: loading }),
      addLoadingMessage: () =>
        set((state: AppState) => ({
          messages: [
            ...state.messages,
            {
              type: 'loading',
              orchestratorId: state.currentOrchestratorId,
              timestamp: Date.now(),
            },
          ],
        })),

      // Orchestrator
      orchestrators: [],
      currentOrchestratorId: null,
      currentChatId: null,
      setOrchestrators: (orchestrators) => {
        console.log('💾 Setting orchestrators in store:', orchestrators);
        set({ orchestrators });
      },
      setCurrentOrchestratorId: (id) => {
        console.log('💾 Setting current orchestrator ID in store:', id);
        set({ currentOrchestratorId: id });
      },
      setCurrentChatId: (id) => {
        console.log('💾 Setting current chat ID in store:', id);
        set({ currentChatId: id });
      },
      addOrchestrator: (orchestrator) => {
        console.log('💾 Adding new orchestrator to store:', orchestrator);
        set((state) => ({
          orchestrators: [...state.orchestrators, orchestrator],
        }));
      },

      // New debug state
      toggleDebug: () => set((state) => ({ showDebug: !state.showDebug })),
    }),
    {
      name: 'app-store',
    }
  )
);

// Types export
export type { Message, AppState }; 