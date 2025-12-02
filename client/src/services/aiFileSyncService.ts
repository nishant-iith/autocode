/**
 * AI File Sync Service
 * Manages real-time synchronization between AI file operations and the editor
 * Handles Socket.IO events for file changes and updates
 */

import { useEditorStore } from '../store/editorStore';
import { useProjectStore } from '../store/projectStore';
import { io, Socket } from 'socket.io-client';

export interface FileSyncEvent {
  type: 'file-created' | 'file-updated' | 'file-deleted';
  filePath: string;
  content?: string;
  workspaceId: string;
  source: 'ai' | 'user' | 'external';
  timestamp: Date;
}

/**
 * Service class for managing real-time file synchronization
 */
export class AIFileSyncService {
  private static instance: AIFileSyncService;
  private socket: Socket | null = null;
  private isConnected = false;
  private currentWorkspaceId: string | null = null;

  private constructor() { }

  /**
   * Get singleton instance of the sync service
   */
  static getInstance(): AIFileSyncService {
    if (!AIFileSyncService.instance) {
      AIFileSyncService.instance = new AIFileSyncService();
    }
    return AIFileSyncService.instance;
  }

  /**
   * Initialize connection to the server
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      this.socket = io('http://localhost:5001', {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('AI File Sync: Connected to server');
        this.isConnected = true;

        // Join current workspace if available
        const projectStore = useProjectStore.getState();
        if (projectStore.currentProject?.workspaceId) {
          this.joinWorkspace(projectStore.currentProject.workspaceId);
        }
      });

      this.socket.on('disconnect', () => {
        console.log('AI File Sync: Disconnected from server');
        this.isConnected = false;
      });

      this.socket.on('file-changed', (data: FileSyncEvent) => {
        this.handleFileChange(data);
      });

      this.socket.on('ai-file-operation', (data: FileSyncEvent) => {
        this.handleAIFileOperation(data);
      });

      this.socket.on('error', (error: any) => {
        console.error('AI File Sync error:', error);
      });

    } catch (error) {
      console.error('Failed to connect to AI File Sync service:', error);
    }
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentWorkspaceId = null;
    }
  }

  /**
   * Join a workspace for file synchronization
   */
  joinWorkspace(workspaceId: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot join workspace: not connected to sync service');
      return;
    }

    if (this.currentWorkspaceId === workspaceId) {
      return; // Already in this workspace
    }

    // Leave current workspace if any
    if (this.currentWorkspaceId) {
      this.socket.emit('leave-workspace', this.currentWorkspaceId);
    }

    // Join new workspace
    this.socket.emit('join-workspace', workspaceId);
    this.currentWorkspaceId = workspaceId;
    console.log(`AI File Sync: Joined workspace ${workspaceId}`);
  }

  /**
   * Leave current workspace
   */
  leaveWorkspace(): void {
    if (this.socket && this.currentWorkspaceId) {
      this.socket.emit('leave-workspace', this.currentWorkspaceId);
      this.currentWorkspaceId = null;
      console.log('AI File Sync: Left current workspace');
    }
  }

  /**
   * Emit a file change event to other clients
   */
  emitFileChange(event: FileSyncEvent): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot emit file change: not connected to sync service');
      return;
    }

    this.socket.emit('file-change', event);
  }

  /**
   * Handle file change events from other sources
   */
  private handleFileChange(event: FileSyncEvent): void {
    const editorStore = useEditorStore.getState();

    switch (event.type) {
      case 'file-created':
        if (event.content !== undefined) {
          // Check if file is already open
          const existingFile = editorStore.getFileByPath(event.filePath);
          if (!existingFile) {
            // Auto-open AI-created files
            if (event.source === 'ai') {
              editorStore.openFileFromAI({
                path: event.filePath,
                name: event.filePath.split('/').pop() || event.filePath,
                content: event.content,
              });
            }
          }
        }
        break;

      case 'file-updated':
        if (event.content !== undefined) {
          const existingFile = editorStore.getFileByPath(event.filePath);
          if (existingFile) {
            if (event.source === 'ai') {
              editorStore.updateFileFromAI(event.filePath, event.content);
            } else {
              editorStore.updateFileContent(event.filePath, event.content);
            }
          }
        }
        break;

      case 'file-deleted':
        editorStore.closeFile(event.filePath);
        break;
    }
  }

  /**
   * Handle AI-specific file operations
   */
  private handleAIFileOperation(event: FileSyncEvent): void {
    const editorStore = useEditorStore.getState();

    // Mark file as AI-modified if it exists
    const existingFile = editorStore.getFileByPath(event.filePath);
    if (existingFile) {
      editorStore.markFileAsAIModified(event.filePath);
    }

    // Show notification or visual indicator for AI operations
    this.showAIOperationNotification(event);
  }

  /**
   * Show notification for AI file operations
   */
  private showAIOperationNotification(event: FileSyncEvent): void {
    // This could be enhanced to show toast notifications or other UI feedback
    console.log(`AI File Operation: ${event.type} - ${event.filePath}`);

    // Add a visual indicator in the editor
    const notification = {
      id: `ai-${Date.now()}`,
      type: event.type,
      filePath: event.filePath,
      timestamp: event.timestamp,
    };

    // Store notifications in localStorage for persistence
    const notifications = this.getStoredNotifications();
    notifications.push(notification);

    // Keep only last 50 notifications
    const trimmedNotifications = notifications.slice(-50);
    localStorage.setItem('ai-file-notifications', JSON.stringify(trimmedNotifications));
  }

  /**
   * Get stored AI file operation notifications
   */
  getStoredNotifications(): any[] {
    try {
      const stored = localStorage.getItem('ai-file-notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to parse stored notifications:', error);
      return [];
    }
  }

  /**
   * Clear stored notifications
   */
  clearNotifications(): void {
    localStorage.removeItem('ai-file-notifications');
  }

  /**
   * Emit an AI file operation event
   */
  emitAIFileOperation(type: FileSyncEvent['type'], filePath: string, content?: string): void {
    const workspaceId = this.currentWorkspaceId;
    if (!workspaceId) {
      console.warn('Cannot emit AI file operation: no active workspace');
      return;
    }

    const event: FileSyncEvent = {
      type,
      filePath,
      content,
      workspaceId,
      source: 'ai',
      timestamp: new Date(),
    };

    this.emitFileChange(event);
  }

  /**
   * Check if connected to sync service
   */
  isConnectedToSync(): boolean {
    return this.isConnected;
  }

  /**
   * Get current workspace ID
   */
  getCurrentWorkspace(): string | null {
    return this.currentWorkspaceId;
  }

  /**
   * Auto-sync file changes from editor to server
   */
  syncFileChange(filePath: string, content: string, source: 'user' | 'ai' = 'user'): void {
    const workspaceId = this.currentWorkspaceId;
    if (!workspaceId) return;

    const event: FileSyncEvent = {
      type: 'file-updated',
      filePath,
      content,
      workspaceId,
      source,
      timestamp: new Date(),
    };

    this.emitFileChange(event);
  }

  /**
   * Sync file creation to server
   */
  syncFileCreation(filePath: string, content: string, source: 'user' | 'ai' = 'user'): void {
    const workspaceId = this.currentWorkspaceId;
    if (!workspaceId) return;

    const event: FileSyncEvent = {
      type: 'file-created',
      filePath,
      content,
      workspaceId,
      source,
      timestamp: new Date(),
    };

    this.emitFileChange(event);
  }

  /**
   * Sync file deletion to server
   */
  syncFileDeletion(filePath: string, source: 'user' | 'ai' = 'user'): void {
    const workspaceId = this.currentWorkspaceId;
    if (!workspaceId) return;

    const event: FileSyncEvent = {
      type: 'file-deleted',
      filePath,
      workspaceId,
      source,
      timestamp: new Date(),
    };

    this.emitFileChange(event);
  }
}

/**
 * Hook for using the AI File Sync service
 */
export const useAIFileSync = () => {
  const syncService = AIFileSyncService.getInstance();

  return {
    connect: () => syncService.connect(),
    disconnect: () => syncService.disconnect(),
    joinWorkspace: (workspaceId: string) => syncService.joinWorkspace(workspaceId),
    leaveWorkspace: () => syncService.leaveWorkspace(),
    syncFileChange: (filePath: string, content: string, source?: 'user' | 'ai') =>
      syncService.syncFileChange(filePath, content, source),
    syncFileCreation: (filePath: string, content: string, source?: 'user' | 'ai') =>
      syncService.syncFileCreation(filePath, content, source),
    syncFileDeletion: (filePath: string, source?: 'user' | 'ai') =>
      syncService.syncFileDeletion(filePath, source),
    isConnected: () => syncService.isConnectedToSync(),
    getCurrentWorkspace: () => syncService.getCurrentWorkspace(),
    getNotifications: () => syncService.getStoredNotifications(),
    clearNotifications: () => syncService.clearNotifications(),
  };
};