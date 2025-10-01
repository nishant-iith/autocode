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
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentProject: (project: Project | null) => void;
  loadFileTree: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<void>;
  createFromTemplate: (templateId: string, name?: string) => Promise<void>;
  importFromZip: (zipFile: File) => Promise<void>;
  importFromGithub: (repoUrl: string, accessToken?: string) => Promise<void>;
  closeProject: () => Promise<void>;
  toggleFolder: (path: string) => void;
  refreshFileTree: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  fileTree: [],
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

  /**
   * Create a new project and automatically set it as the current project
   * Replaces any existing project
   */
  createProject: async (name, description) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.createProject(name, description);

      const newProject: Project = {
        workspaceId: result.workspaceId,
        name: result.name,
        description: result.description,
        created: new Date(),
        modified: new Date(),
      };

      set({ currentProject: newProject, isLoading: false });
      await get().loadFileTree();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create project',
        isLoading: false
      });
      throw error;
    }
  },

  /**
   * Create project from template and set as current project
   */
  createFromTemplate: async (templateId, name) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.createFromTemplate(templateId, name);

      const newProject: Project = {
        workspaceId: result.workspaceId,
        name: result.name,
        created: new Date(),
        modified: new Date(),
      };

      set({ currentProject: newProject, isLoading: false });
      await get().loadFileTree();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create from template',
        isLoading: false
      });
      throw error;
    }
  },

  /**
   * Import from ZIP and set as current project
   */
  importFromZip: async (zipFile) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.importZip(zipFile);

      const newProject: Project = {
        workspaceId: result.workspaceId,
        name: result.name,
        created: new Date(),
        modified: new Date(),
      };

      set({ currentProject: newProject, isLoading: false });
      await get().loadFileTree();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to import ZIP',
        isLoading: false
      });
      throw error;
    }
  },

  /**
   * Import from GitHub and set as current project
   */
  importFromGithub: async (repoUrl, accessToken) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.importGithub(repoUrl, accessToken);

      const newProject: Project = {
        workspaceId: result.workspaceId,
        name: result.name,
        created: new Date(),
        modified: new Date(),
      };

      set({ currentProject: newProject, isLoading: false });
      await get().loadFileTree();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to import from GitHub',
        isLoading: false
      });
      throw error;
    }
  },

  /**
   * Close the current project and clear all state
   */
  closeProject: async () => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({ isLoading: true, error: null });
    try {
      // Optionally delete from backend
      await api.deleteProject(currentProject.workspaceId);

      set({
        currentProject: null,
        fileTree: [],
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to close project',
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