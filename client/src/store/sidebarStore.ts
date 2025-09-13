import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;
  width: number;
  activeTab: 'files' | 'search' | 'projects' | 'preview' | null;
  
  // Actions
  toggleSidebar: () => void;
  setActiveTab: (tab: 'files' | 'search' | 'projects' | 'preview' | null) => void;
  setWidth: (width: number) => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      isCollapsed: false,
      width: 280,
      activeTab: 'files',

      toggleSidebar: () => {
        const { isCollapsed, activeTab } = get();
        if (isCollapsed) {
          set({ isCollapsed: false });
        } else if (activeTab) {
          set({ isCollapsed: true });
        }
      },

      setActiveTab: (tab) => {
        const { activeTab } = get();
        if (activeTab === tab) {
          set({ isCollapsed: !get().isCollapsed });
        } else {
          set({ activeTab: tab, isCollapsed: false });
        }
      },

      setWidth: (width) => set({ width }),
      
      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
    }),
    {
      name: 'sidebar-storage',
      partialize: (state) => ({ 
        width: state.width, 
        activeTab: state.activeTab,
        isCollapsed: state.isCollapsed 
      }),
    }
  )
);