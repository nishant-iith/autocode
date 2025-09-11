import { create } from 'zustand';
import { api } from '../services/api';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  isExpanded?: boolean;
  size?: number;
  modified?: Date;
}

export interface Project {
  workspaceId: string;
  name: string;
  description?: string;
  created: Date;
  modified: Date;
}

interface ProjectState {
  currentProject: Project | null;
  fileTree: FileNode[];
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentProject: (project: Project | null) => void;
  loadFileTree: () => Promise<void>;
  loadProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<string>;
  createFromTemplate: (templateId: string, name?: string) => Promise<string>;
  importFromZip: (zipFile: File) => Promise<string>;
  importFromGithub: (repoUrl: string, accessToken?: string) => Promise<string>;
  deleteProject: (workspaceId: string) => Promise<void>;
  toggleFolder: (path: string) => void;
  refreshFileTree: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  fileTree: [],
  projects: [],
  isLoading: false,
  error: null,

  setCurrentProject: (project) => {
    set({ currentProject: project });
    if (project) {
      get().loadFileTree();
    }
  },

  loadFileTree: async () => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({ isLoading: true, error: null });
    try {
      const tree = await api.getFileTree(currentProject.workspaceId);
      set({ fileTree: tree, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load file tree',
        isLoading: false 
      });
    }
  },

  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await api.getProjects();
      set({ projects, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load projects',
        isLoading: false 
      });
    }
  },

  createProject: async (name, description) => {
    set({ isLoading: true, error: null });
    try {
      const project = await api.createProject(name, description);
      await get().loadProjects();
      set({ isLoading: false });
      return project.workspaceId;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create project',
        isLoading: false 
      });
      throw error;
    }
  },

  createFromTemplate: async (templateId, name) => {
    set({ isLoading: true, error: null });
    try {
      const project = await api.createFromTemplate(templateId, name);
      await get().loadProjects();
      set({ isLoading: false });
      return project.workspaceId;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create from template',
        isLoading: false 
      });
      throw error;
    }
  },

  importFromZip: async (zipFile) => {
    set({ isLoading: true, error: null });
    try {
      const project = await api.importZip(zipFile);
      await get().loadProjects();
      set({ isLoading: false });
      return project.workspaceId;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to import ZIP',
        isLoading: false 
      });
      throw error;
    }
  },

  importFromGithub: async (repoUrl, accessToken) => {
    set({ isLoading: true, error: null });
    try {
      const project = await api.importGithub(repoUrl, accessToken);
      await get().loadProjects();
      set({ isLoading: false });
      return project.workspaceId;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to import from GitHub',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteProject: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteProject(workspaceId);
      await get().loadProjects();
      
      const { currentProject } = get();
      if (currentProject?.workspaceId === workspaceId) {
        set({ currentProject: null, fileTree: [] });
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete project',
        isLoading: false 
      });
      throw error;
    }
  },

  toggleFolder: (path) => {
    set((state) => {
      const toggleNode = (nodes: FileNode[]): FileNode[] =>
        nodes.map(node => {
          if (node.path === path && node.type === 'folder') {
            return { ...node, isExpanded: !node.isExpanded };
          }
          if (node.children) {
            return { ...node, children: toggleNode(node.children) };
          }
          return node;
        });

      return { fileTree: toggleNode(state.fileTree) };
    });
  },

  refreshFileTree: async () => {
    await get().loadFileTree();
  },
}));