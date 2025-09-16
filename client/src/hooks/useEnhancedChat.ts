/**
 * Enhanced Chat Hook
 * Provides easy access to enhanced chat functionality with mode management
 */

import { useCallback, useEffect } from 'react';
import { useEnhancedChatStore } from '../store/enhancedChatStore';
import { useProjectStore } from '../store/projectStore';
import { useEditorStore } from '../store/editorStore';

export const useEnhancedChat = () => {
  const chatStore = useEnhancedChatStore();
  const { currentProject } = useProjectStore();
  const { activeFile } = useEditorStore();

  /**
   * Automatically switch to chat mode if no project is available
   */
  useEffect(() => {
    if (chatStore.mode === 'edit' && !currentProject) {
      chatStore.setMode('chat');
    }
  }, [currentProject, chatStore]);

  /**
   * Send a message with automatic mode detection
   */
  const sendSmartMessage = useCallback(async (content: string) => {
    // Auto-detect if the message looks like an edit request
    const editKeywords = [
      'create', 'add', 'modify', 'update', 'change', 'fix', 'refactor',
      'implement', 'write', 'build', 'generate', 'make'
    ];

    const isEditRequest = editKeywords.some(keyword =>
      content.toLowerCase().includes(keyword)
    );

    // If it looks like an edit request and we have a project, suggest edit mode
    if (isEditRequest && currentProject && chatStore.mode === 'chat') {
      // Optionally auto-switch to edit mode
      chatStore.setMode('edit');
    }

    await chatStore.sendMessage(content);
  }, [chatStore, currentProject]);

  /**
   * Toggle between chat and edit modes intelligently
   */
  const toggleMode = useCallback(() => {
    if (!currentProject) {
      // Can't use edit mode without a project
      chatStore.setMode('chat');
      return;
    }

    const newMode = chatStore.mode === 'chat' ? 'edit' : 'chat';
    chatStore.setMode(newMode);
  }, [chatStore, currentProject]);

  /**
   * Get current mode status and capabilities
   */
  const getModeStatus = useCallback(() => {
    return {
      mode: chatStore.mode,
      canUseEditMode: !!currentProject,
      projectName: currentProject?.name,
      activeFileName: activeFile?.name,
      isEditModeActive: chatStore.mode === 'edit' && !!currentProject,
      contextOptimization: chatStore.contextOptimization,
      autoExecuteActions: chatStore.autoExecuteActions
    };
  }, [chatStore, currentProject, activeFile]);

  /**
   * Send a message specifically for file editing
   */
  const sendEditMessage = useCallback(async (content: string) => {
    if (!currentProject) {
      throw new Error('Edit operations require an active project');
    }

    const originalMode = chatStore.mode;
    chatStore.setMode('edit');

    try {
      await chatStore.sendMessage(content);
    } finally {
      // Optionally restore original mode or keep in edit mode
      // chatStore.setMode(originalMode);
    }
  }, [chatStore, currentProject]);

  /**
   * Send a message with explicit context
   */
  const sendContextMessage = useCallback(async (content: string) => {
    await chatStore.sendMessageWithAutoContext(content);
  }, [chatStore]);

  return {
    // Store state
    ...chatStore,

    // Enhanced methods
    sendSmartMessage,
    sendEditMessage,
    sendContextMessage,
    toggleMode,
    getModeStatus,

    // Computed values
    canUseEditMode: !!currentProject,
    currentProjectName: currentProject?.name,
    isEditModeReady: chatStore.mode === 'edit' && !!currentProject,

    // Status helpers
    isChatMode: chatStore.mode === 'chat',
    isEditMode: chatStore.mode === 'edit',
    hasActiveProject: !!currentProject,
    hasActiveFile: !!activeFile
  };
};

export default useEnhancedChat;