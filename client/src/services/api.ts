import axios from 'axios';
import { FileNode, Project } from '../store/projectStore';

const API_BASE = '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export interface Template {
  id: string;
  name: string;
  description: string;
}

export const api = {
  // Projects
  async getProjects(): Promise<Project[]> {
    const response = await apiClient.get('/projects/list');
    return response.data.map((project: Project) => ({
      ...project,
      created: new Date(project.created),
      modified: new Date(project.modified),
    }));
  },

  async createProject(name: string, description?: string): Promise<{ workspaceId: string; name: string; description?: string }> {
    const response = await apiClient.post('/projects/create', { name, description });
    return response.data;
  },

  async deleteProject(workspaceId: string): Promise<void> {
    await apiClient.delete(`/projects/${workspaceId}`);
  },

  async importZip(zipFile: File): Promise<{ workspaceId: string; name: string }> {
    const formData = new FormData();
    formData.append('zipFile', zipFile);
    
    const response = await apiClient.post('/projects/import-zip', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async importGithub(repoUrl: string, accessToken?: string): Promise<{ workspaceId: string; name: string }> {
    const response = await apiClient.post('/projects/import-github', {
      repoUrl,
      accessToken,
    });
    return response.data;
  },

  // Templates
  async getTemplates(): Promise<Template[]> {
    const response = await apiClient.get('/templates/list');
    return response.data;
  },

  async createFromTemplate(templateId: string, name?: string): Promise<{ workspaceId: string; name: string }> {
    const response = await apiClient.post(`/templates/create/${templateId}`, { name });
    return response.data;
  },

  // Files
  async getFileTree(workspaceId: string): Promise<FileNode[]> {
    const response = await apiClient.get(`/files/tree/${workspaceId}`);
    return response.data;
  },

  async getFileContent(workspaceId: string, filePath: string): Promise<{ content: string; path: string; size: number; modified: Date }> {
    const encodedPath = encodeURIComponent(filePath);
    const response = await apiClient.get(`/files/content/${workspaceId}/${encodedPath}`);
    return {
      ...response.data,
      modified: new Date(response.data.modified),
    };
  },

  async saveFileContent(workspaceId: string, filePath: string, content: string): Promise<void> {
    const encodedPath = encodeURIComponent(filePath);
    await apiClient.put(`/files/content/${workspaceId}/${encodedPath}`, { content });
  },

  async createFile(workspaceId: string, path: string, name: string, type: 'file' | 'folder'): Promise<void> {
    await apiClient.post(`/files/create/${workspaceId}`, { path, name, type });
  },

  async deleteFile(workspaceId: string, filePath: string): Promise<void> {
    const encodedPath = encodeURIComponent(filePath);
    await apiClient.delete(`/files/${workspaceId}/${encodedPath}`);
  },

  async renameFile(workspaceId: string, oldPath: string, newPath: string): Promise<void> {
    await apiClient.post(`/files/rename/${workspaceId}`, { oldPath, newPath });
  },

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

// Add request/response interceptors for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - please try again');
    }
    
    if (!error.response) {
      throw new Error('Network error - please check your connection');
    }
    
    throw new Error(error.response?.data?.message || 'An unexpected error occurred');
  }
);