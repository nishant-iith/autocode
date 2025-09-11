import { create } from 'zustand';

export interface FileTab {
  id: string;
  name: string;
  path: string;
  content: string;
  originalContent?: string;
  isDirty: boolean;
  isActive: boolean;
  language?: string;
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
  openFile: (file: { path: string; name: string; content: string }) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  saveFile: (path: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setFontSize: (size: number) => void;
  toggleWordWrap: () => void;
  toggleMinimap: () => void;
  
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

export const useEditorStore = create<EditorState>((set, get) => ({
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
      language: getLanguageFromPath(file.path),
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

  updateFileContent: (path, content) => {
    set((state) => {
      const updatedTabs = state.openTabs.map(tab => {
        if (tab.path === path) {
          const originalContent = tab.originalContent || tab.content;
          return { 
            ...tab, 
            content, 
            isDirty: originalContent !== content,
            originalContent: tab.originalContent || tab.content
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
              originalContent: state.activeFile.originalContent || state.activeFile.content
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
}));