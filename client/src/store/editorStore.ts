import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FileTab {
  id: string;
  name: string;
  path: string;
  content: string;
  originalContent?: string;
  isDirty: boolean;
  isActive: boolean;
  language?: string;
  isAIModified?: boolean; // Flag to indicate if file was modified by AI
  lastAIModification?: Date; // Timestamp of last AI modification
}

interface EditorState {
  activeFile: FileTab | null;
  openTabs: FileTab[];
  theme: 'dark' | 'light';
  fontSize: number;
  wordWrap: boolean;
  minimap: boolean;
  
  // Autosave settings
  autosaveEnabled: boolean;
  autosaveDelay: number; // in milliseconds
  isSaving: boolean;
  lastSaved: { [path: string]: Date };
  
  // Actions
  openFile: (file: { path: string; name: string; content: string; language?: string }) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string, isAIModified?: boolean) => void;
  saveFile: (path: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setFontSize: (size: number) => void;
  toggleWordWrap: () => void;
  toggleMinimap: () => void;

  // AI-specific actions
  openFileFromAI: (file: { path: string; name: string; content: string; language?: string }) => void;
  updateFileFromAI: (path: string, content: string) => void;
  markFileAsAIModified: (path: string) => void;
  clearAIModificationFlags: () => void;
  getFileByPath: (path: string) => FileTab | undefined;
  
  // Autosave actions
  toggleAutosave: () => void;
  setAutosaveDelay: (delay: number) => void;
  setIsSaving: (saving: boolean) => void;
  updateLastSaved: (path: string) => void;
}

const getLanguageFromPath = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase();
  const languageMap: { [key: string]: string } = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'json': 'json',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'md': 'markdown',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'rb': 'ruby',
    'sh': 'shell',
    'yml': 'yaml',
    'yaml': 'yaml',
    'xml': 'xml',
    'sql': 'sql',
  };
  
  return languageMap[ext || ''] || 'plaintext';
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
  activeFile: null,
  openTabs: [],
  theme: 'dark',
  fontSize: 14,
  wordWrap: true,
  minimap: true,
  
  // Autosave settings
  autosaveEnabled: true,
  autosaveDelay: 2000, // 2 seconds
  isSaving: false,
  lastSaved: {},

  openFile: (file) => {
    const { openTabs } = get();
    const existingTab = openTabs.find(tab => tab.path === file.path);

    if (existingTab) {
      set({ activeFile: existingTab });
      return;
    }

    const newTab: FileTab = {
      id: `tab-${Date.now()}`,
      name: file.name,
      path: file.path,
      content: file.content,
      originalContent: file.content,
      isDirty: false,
      isActive: true,
      language: file.language || getLanguageFromPath(file.path),
      isAIModified: false,
    };

    set((state) => ({
      openTabs: [...state.openTabs, newTab],
      activeFile: newTab,
    }));
  },

  closeFile: (path) => {
    const { openTabs, activeFile } = get();
    const newTabs = openTabs.filter(tab => tab.path !== path);
    
    let newActiveFile = activeFile;
    if (activeFile?.path === path) {
      newActiveFile = newTabs.length > 0 ? newTabs[newTabs.length - 1] : null;
    }
    
    set({ openTabs: newTabs, activeFile: newActiveFile });
  },

  setActiveFile: (path) => {
    const { openTabs } = get();
    const file = openTabs.find(tab => tab.path === path);
    if (file) {
      set({ activeFile: file });
    }
  },

  updateFileContent: (path, content, isAIModified = false) => {
    set((state) => {
      const updatedTabs = state.openTabs.map(tab => {
        if (tab.path === path) {
          const originalContent = tab.originalContent || tab.content;
          return {
            ...tab,
            content,
            isDirty: originalContent !== content,
            originalContent: tab.originalContent || tab.content,
            isAIModified: isAIModified || tab.isAIModified,
            lastAIModification: isAIModified ? new Date() : tab.lastAIModification,
          };
        }
        return tab;
      });

      const updatedActiveFile = state.activeFile?.path === path
        ? (() => {
            const originalContent = state.activeFile.originalContent || state.activeFile.content;
            return {
              ...state.activeFile,
              content,
              isDirty: originalContent !== content,
              originalContent: state.activeFile.originalContent || state.activeFile.content,
              isAIModified: isAIModified || state.activeFile.isAIModified,
              lastAIModification: isAIModified ? new Date() : state.activeFile.lastAIModification,
            };
          })()
        : state.activeFile;

      return {
        openTabs: updatedTabs,
        activeFile: updatedActiveFile,
      };
    });
  },

  saveFile: (path) => {
    set((state) => {
      const updatedTabs = state.openTabs.map(tab =>
        tab.path === path ? { ...tab, isDirty: false, originalContent: tab.content } : tab
      );
      
      const updatedActiveFile = state.activeFile?.path === path
        ? { ...state.activeFile, isDirty: false, originalContent: state.activeFile.content }
        : state.activeFile;
      
      const updatedLastSaved = {
        ...state.lastSaved,
        [path]: new Date()
      };
        
      return {
        openTabs: updatedTabs,
        activeFile: updatedActiveFile,
        lastSaved: updatedLastSaved,
        isSaving: false,
      };
    });
  },

  setTheme: (theme) => set({ theme }),
  
  setFontSize: (fontSize) => set({ fontSize }),
  
  toggleWordWrap: () => set((state) => ({ wordWrap: !state.wordWrap })),
  
  toggleMinimap: () => set((state) => ({ minimap: !state.minimap })),
  
  // Autosave actions
  toggleAutosave: () => set((state) => ({ autosaveEnabled: !state.autosaveEnabled })),
  
  setAutosaveDelay: (delay) => set({ autosaveDelay: delay }),
  
  setIsSaving: (saving) => set({ isSaving: saving }),
  
  updateLastSaved: (path) => set((state) => ({
    lastSaved: {
      ...state.lastSaved,
      [path]: new Date()
    }
  })),

  // AI-specific actions
  openFileFromAI: (file) => {
    const { openTabs } = get();
    const existingTab = openTabs.find(tab => tab.path === file.path);

    if (existingTab) {
      // Update existing file with AI content
      set((state) => {
        const updatedTabs = state.openTabs.map(tab =>
          tab.path === file.path
            ? {
                ...tab,
                content: file.content,
                originalContent: file.content, // Update original content to match new content
                isDirty: false, // AI operations save to backend, so file is not dirty
                isAIModified: true,
                lastAIModification: new Date(),
              }
            : tab
        );

        const updatedActiveFile = state.activeFile?.path === file.path
          ? {
              ...state.activeFile,
              content: file.content,
              originalContent: file.content, // Update original content to match new content
              isDirty: false, // AI operations save to backend, so file is not dirty
              isAIModified: true,
              lastAIModification: new Date(),
            }
          : state.activeFile;

        // Update last saved timestamp
        const updatedLastSaved = {
          ...state.lastSaved,
          [file.path]: new Date()
        };

        return {
          openTabs: updatedTabs,
          activeFile: updatedActiveFile,
          lastSaved: updatedLastSaved,
        };
      });
      return;
    }

    // Create new file tab
    const newTab: FileTab = {
      id: `tab-${Date.now()}`,
      name: file.name,
      path: file.path,
      content: file.content,
      originalContent: file.content, // Set original content to match new content
      isDirty: false, // AI operations save to backend, so file is not dirty
      isActive: true,
      language: file.language || getLanguageFromPath(file.path),
      isAIModified: true,
      lastAIModification: new Date(),
    };

    set((state) => ({
      openTabs: [...state.openTabs, newTab],
      activeFile: newTab,
      lastSaved: {
        ...state.lastSaved,
        [file.path]: new Date()
      }
    }));
  },

  updateFileFromAI: (path, content) => {
    set((state) => {
      const updatedTabs = state.openTabs.map(tab =>
        tab.path === path
          ? {
              ...tab,
              content,
              originalContent: content, // Update original content to match new content
              isDirty: false, // AI operations save to backend, so file is not dirty
              isAIModified: true,
              lastAIModification: new Date(),
            }
          : tab
      );

      const updatedActiveFile = state.activeFile?.path === path
        ? {
            ...state.activeFile,
            content,
            originalContent: content, // Update original content to match new content
            isDirty: false, // AI operations save to backend, so file is not dirty
            isAIModified: true,
            lastAIModification: new Date(),
          }
        : state.activeFile;

      // Update last saved timestamp
      const updatedLastSaved = {
        ...state.lastSaved,
        [path]: new Date()
      };

      return {
        openTabs: updatedTabs,
        activeFile: updatedActiveFile,
        lastSaved: updatedLastSaved,
      };
    });
  },

  markFileAsAIModified: (path) => {
    set((state) => {
      const updatedTabs = state.openTabs.map(tab =>
        tab.path === path
          ? {
              ...tab,
              isAIModified: true,
              lastAIModification: new Date(),
            }
          : tab
      );

      const updatedActiveFile = state.activeFile?.path === path
        ? {
            ...state.activeFile,
            isAIModified: true,
            lastAIModification: new Date(),
          }
        : state.activeFile;

      return {
        openTabs: updatedTabs,
        activeFile: updatedActiveFile,
      };
    });
  },

  clearAIModificationFlags: () => {
    set((state) => {
      const updatedTabs = state.openTabs.map(tab => ({
        ...tab,
        isAIModified: false,
        lastAIModification: undefined,
      }));

      const updatedActiveFile = state.activeFile
        ? {
            ...state.activeFile,
            isAIModified: false,
            lastAIModification: undefined,
          }
        : null;

      return {
        openTabs: updatedTabs,
        activeFile: updatedActiveFile,
      };
    });
  },

  getFileByPath: (path) => {
    const { openTabs } = get();
    return openTabs.find(tab => tab.path === path);
  },
}), {
  name: 'editor-settings',
  partialize: (state) => ({
    theme: state.theme,
    fontSize: state.fontSize,
    wordWrap: state.wordWrap,
    minimap: state.minimap,
    autosaveEnabled: state.autosaveEnabled,
    autosaveDelay: state.autosaveDelay,
  }),
})
);