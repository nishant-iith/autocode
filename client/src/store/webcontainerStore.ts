import { create } from 'zustand';
import { WebContainer } from '@webcontainer/api';

interface WebContainerState {
  instance: WebContainer | null;
  previewUrl: string | null;
  isInstalling: boolean;
  isRunning: boolean;
  logs: string[];

  // Actions
  setInstance: (instance: WebContainer) => void;
  setPreviewUrl: (url: string | null) => void;
  setIsInstalling: (isInstalling: boolean) => void;
  setIsRunning: (isRunning: boolean) => void;
  addLog: (log: string) => void;
  clearLogs: () => void;
}

/**
 * WebContainer Store
 *
 * Manages WebContainer state including:
 * - Preview URL for iframe
 * - Installation and running states
 * - Terminal logs
 */
export const useWebContainerStore = create<WebContainerState>((set) => ({
  instance: null,
  previewUrl: null,
  isInstalling: false,
  isRunning: false,
  logs: [],

  setInstance: (instance) => set({ instance }),

  setPreviewUrl: (url) => set({ previewUrl: url }),

  setIsInstalling: (isInstalling) => set({ isInstalling }),

  setIsRunning: (isRunning) => set({ isRunning }),

  addLog: (log) =>
    set((state) => ({
      logs: [...state.logs, log].slice(-500), // Keep last 500 logs
    })),

  clearLogs: () => set({ logs: [] }),
}));
