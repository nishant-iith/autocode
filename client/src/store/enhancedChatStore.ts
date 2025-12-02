/**
 * Enhanced Chat Store
 * Integrates with enhanced AI service for automatic context, streaming, and file operations
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EnhancedAIService, AIMessage } from '../services/enhancedAIService';
import { AIArtifact } from '../services/aiActionParser';
import { OperationProgress } from '../services/aiFileOperations';
import { OpenRouterService, OpenRouterModel } from '../services/openRouter';
import { useProjectStore } from './projectStore';
import { useEditorStore } from './editorStore';
import { v4 as uuidv4 } from 'uuid';

export interface EnhancedChatState {
  // UI State
  isOpen: boolean;
  width: number;
  isLoading: boolean;
  error: string | null;
  mode: 'chat' | 'edit';

  // API Configuration
  apiKey: string | null;
  isApiKeyValid: boolean;

  // Models
  availableModels: OpenRouterModel[];
  freeModels: OpenRouterModel[];
  selectedModel: string | null;
  isLoadingModels: boolean;

  // Enhanced Chat Features
  messages: AIMessage[];
  isTyping: boolean;
  streamingContent: string;
  currentArtifacts: AIArtifact[];
  fileOperations: OperationProgress[];

  // AI Service Settings
  maxTokens: number;
  temperature: number;
  useStreaming: boolean;
  autoExecuteActions: boolean;
  contextOptimization: boolean;

  // Conversation Management
  conversationHistory: AIMessage[][];
  currentConversationId: string | null;

  // Enhanced AI Service Instance
  aiService: EnhancedAIService | null;

  // Actions
  toggleChat: () => void;
  closeChat: () => void;
  setWidth: (width: number) => void;
  setMode: (mode: 'chat' | 'edit') => void;

  // API Key Management
  setApiKey: (apiKey: string) => Promise<void>;
  clearApiKey: () => void;

  // Model Management
  loadModels: () => Promise<void>;
  selectModel: (modelId: string) => void;

  // Enhanced Messaging
  sendMessage: (content: string) => Promise<void>;
  sendMessageWithAutoContext: (content: string) => Promise<void>;
  executeArtifacts: (artifacts: AIArtifact[]) => Promise<void>;
  abortCurrentRequest: () => void;

  // Settings
  setMaxTokens: (tokens: number) => void;
  setTemperature: (temp: number) => void;
  setUseStreaming: (useStreaming: boolean) => void;
  setAutoExecuteActions: (autoExecute: boolean) => void;
  setContextOptimization: (enabled: boolean) => void;

  // Conversation Management
  clearMessages: () => void;
  newConversation: () => void;
  loadConversation: (conversation: AIMessage[]) => void;
  saveCurrentConversation: () => void;

  // Error Handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useEnhancedChatStore = create<EnhancedChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      isOpen: true,
      width: 400,
      isLoading: false,
      error: null,
      mode: 'chat',

      apiKey: OpenRouterService.getApiKey(),
      isApiKeyValid: false,

      availableModels: [],
      freeModels: [],
      selectedModel: null,
      isLoadingModels: false,

      messages: [],
      isTyping: false,
      streamingContent: '',
      currentArtifacts: [],
      fileOperations: [],

      maxTokens: 2000,
      temperature: 0.7,
      useStreaming: true,
      autoExecuteActions: true,
      contextOptimization: true,

      conversationHistory: [],
      currentConversationId: null,

      aiService: null,

      // UI Actions
      toggleChat: () => {
        const { isOpen } = get();
        set({ isOpen: !isOpen });

        // Initialize on first open
        if (!isOpen) {
          const { apiKey, availableModels } = get();
          if (apiKey && availableModels.length === 0) {
            get().loadModels();
          }
        }
      },

      closeChat: () => {
        set({ isOpen: false });
      },

      setWidth: (width: number) => {
        set({ width: Math.max(300, Math.min(800, width)) });
      },

      setMode: (mode: 'chat' | 'edit') => {
        set({ mode });
      },

      // API Key Management
      setApiKey: async (apiKey: string) => {
        const trimmedKey = apiKey.trim();
        const isValid = OpenRouterService.isValidApiKey(trimmedKey);

        if (isValid) {
          OpenRouterService.setApiKey(trimmedKey);

          // Create enhanced AI service instance
          const aiService = new EnhancedAIService({
            apiKey: trimmedKey,
            model: '', // Will be set when model is selected
            maxTokens: get().maxTokens,
            temperature: get().temperature,
            useStreaming: get().useStreaming,
            autoExecuteActions: get().autoExecuteActions,
            contextOptimization: get().contextOptimization
          });

          set({
            apiKey: trimmedKey,
            isApiKeyValid: true,
            aiService,
            error: null
          });

          // Load models after setting API key
          await get().loadModels();
        } else {
          set({
            apiKey: null,
            isApiKeyValid: false,
            aiService: null,
            error: 'Invalid API key. Please use a valid OpenRouter API key starting with "sk-"'
          });
        }
      },

      clearApiKey: () => {
        OpenRouterService.clearApiKey();
        const { aiService } = get();
        aiService?.abort();

        set({
          apiKey: null,
          isApiKeyValid: false,
          aiService: null,
          availableModels: [],
          freeModels: [],
          selectedModel: null,
          messages: [],
          error: null
        });
      },

      // Model Management
      loadModels: async () => {
        const { apiKey } = get();
        if (!apiKey) return;

        set({ isLoadingModels: true, error: null });

        try {
          const models = await OpenRouterService.getModels();
          const freeModels = OpenRouterService.getFreeModels(models);

          const selectedModel = freeModels.length > 0 ? freeModels[0].id : null;

          // Update AI service with selected model
          const { aiService } = get();
          if (aiService && selectedModel) {
            aiService.updateConfig({ model: selectedModel });
          }

          set({
            availableModels: models,
            freeModels,
            selectedModel,
            isLoadingModels: false,
          });
        } catch (error) {
          console.error('Failed to load models:', error);
          set({
            isLoadingModels: false,
            error: error instanceof Error ? error.message : 'Failed to load models'
          });
        }
      },

      selectModel: (modelId: string) => {
        const { aiService } = get();
        aiService?.updateConfig({ model: modelId });
        set({ selectedModel: modelId });
      },

      // Enhanced Messaging
      sendMessage: async (content: string) => {
        const { aiService, selectedModel, messages, mode } = get();

        if (!aiService || !selectedModel) {
          set({ error: 'Please configure API key and select a model first' });
          return;
        }

        if (!content.trim()) return;

        // Get current workspace ID and validate project for edit mode
        const projectStore = useProjectStore.getState();
        const workspaceId = projectStore.currentProject?.workspaceId || 'default';

        // Validate project exists for edit mode
        if (mode === 'edit' && !projectStore.currentProject) {
          set({ error: 'Edit mode requires an active project. Please open or create a project first.' });
          return;
        }

        // Add user message immediately
        const userMessage: AIMessage = {
          id: uuidv4(),
          role: 'user',
          content: content.trim(),
          timestamp: new Date()
        };

        set({
          messages: [...messages, userMessage],
          isTyping: true,
          streamingContent: '',
          currentArtifacts: [],
          fileOperations: [],
          error: null
        });

        try {
          console.log('Sending message:', content);
          console.log('Mode:', mode);
          console.log('AI Service:', !!aiService);
          console.log('Selected Model:', selectedModel);

          // Use OpenRouter service directly for now (simpler and proven to work)
          const { OpenRouterService } = await import('../services/openRouter');

          // Prepare context message for edit mode with file context
          let contextualContent = content;
          if (mode === 'edit' && projectStore.currentProject) {
            // Get current file context if user is editing a specific file
            const editorStore = useEditorStore.getState();
            const currentFile = editorStore.activeFile;

            // Import context services
            const { AIFileOperations } = await import('../services/aiFileOperations');
            const { getEditPromptWithContext } = await import('../services/aiSystemPrompts');

            // Get file content for context if editing existing file
            let targetFileContext: { path: string; content: string; language: string } | undefined = undefined;
            if (currentFile) {
              const fileContent = await AIFileOperations.getFileContent(
                currentFile.path,
                projectStore.currentProject.workspaceId || 'default'
              );

              if (fileContent !== null) {
                targetFileContext = {
                  path: currentFile.path,
                  content: fileContent,
                  language: currentFile.language || 'plaintext'
                };
              }
            }

            // Build context-aware edit prompt
            contextualContent = getEditPromptWithContext(
              content,
              projectStore.currentProject,
              targetFileContext
            );
          }

          // Create a simple message for the API
          const apiMessages = [
            ...messages.slice(-5), // Include last 5 messages for context
            { id: uuidv4(), role: 'user' as const, content: contextualContent, timestamp: new Date() }
          ];

          // Import action parser for file operations
          const { AIActionParser } = await import('../services/aiActionParser');
          const { AIFileOperations } = await import('../services/aiFileOperations');

          // Handle streaming vs non-streaming responses
          if (get().useStreaming) {
            // For streaming, create placeholder message and update it
            const assistantMessageId = uuidv4();
            const placeholderMessage: AIMessage = {
              id: assistantMessageId,
              role: 'assistant',
              content: '',
              timestamp: new Date()
            };

            // Add placeholder message
            const currentMessages = get().messages;
            set({
              messages: [...currentMessages, placeholderMessage],
              streamingContent: ''
            });

            // Send streaming request
            await OpenRouterService.sendMessage(
              selectedModel,
              apiMessages,
              {
                maxTokens: get().maxTokens,
                temperature: get().temperature,
                stream: true,
                onChunk: (chunk: string) => {
                  const currentState = get();
                  const updatedMessages = [...currentState.messages];
                  const lastMessageIndex = updatedMessages.length - 1;

                  if (lastMessageIndex >= 0 && updatedMessages[lastMessageIndex].id === assistantMessageId) {
                    updatedMessages[lastMessageIndex] = {
                      ...updatedMessages[lastMessageIndex],
                      content: updatedMessages[lastMessageIndex].content + chunk
                    };

                    set({
                      messages: updatedMessages
                      // Remove streamingContent to avoid duplicate display
                    });
                  }
                }
              }
            );

            // Process file operations after streaming is complete
            const finalMessages = get().messages;
            const lastMessage = finalMessages[finalMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              await processFileOperations(lastMessage.content, workspaceId, AIActionParser, AIFileOperations, get, set);
            }

            set({
              isTyping: false,
              streamingContent: ''
            });

          } else {
            // Non-streaming response
            const response = await OpenRouterService.sendMessage(
              selectedModel,
              apiMessages,
              {
                maxTokens: get().maxTokens,
                temperature: get().temperature,
                stream: false
              }
            );

            // Create AI response message
            const aiResponse: AIMessage = {
              id: uuidv4(),
              role: 'assistant',
              content: response,
              timestamp: new Date()
            };

            // Add AI response to messages
            const currentMessages = get().messages;
            set({
              messages: [...currentMessages, aiResponse],
              isTyping: false,
              streamingContent: ''
            });

            // Process file operations for non-streaming responses
            await processFileOperations(response, workspaceId, AIActionParser, AIFileOperations, get, set);
          }

        } catch (error) {
          console.error('Failed to send message:', error);

          // Add error message to chat for user feedback
          const errorMessage: AIMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`,
            timestamp: new Date()
          };

          const currentMessages = get().messages;
          set({
            messages: [...currentMessages, errorMessage],
            isTyping: false,
            error: error instanceof Error ? error.message : 'Failed to send message'
          });
        }
      },

      sendMessageWithAutoContext: async (content: string) => {
        // Force enable context optimization for this message
        const { aiService, mode, contextOptimization } = get();

        if (aiService) {
          const originalOptimization = contextOptimization;
          aiService.updateConfig({ contextOptimization: true });

          await get().sendMessage(content);

          // Restore original setting only if we're not in edit mode
          if (mode !== 'edit') {
            aiService.updateConfig({ contextOptimization: originalOptimization });
          }
        }
      },

      executeArtifacts: async (artifacts: AIArtifact[]) => {
        const { aiService } = get();
        if (!aiService) return;

        const projectStore = useProjectStore.getState();
        const workspaceId = projectStore.currentProject?.workspaceId || 'default';

        set({ fileOperations: [] });

        try {
          await aiService.executeArtifacts(
            artifacts,
            workspaceId,
            (progress: OperationProgress) => {
              const { fileOperations } = get();
              set({
                fileOperations: [...fileOperations, progress]
              });
            }
          );
        } catch (error) {
          console.error('Failed to execute artifacts:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to execute file operations'
          });
        }
      },

      abortCurrentRequest: () => {
        const { aiService } = get();
        aiService?.abort();
        set({
          isTyping: false,
          streamingContent: '',
          error: null
        });
      },

      // Settings
      setMaxTokens: (tokens: number) => {
        const validTokens = Math.max(100, Math.min(4000, tokens));
        const { aiService } = get();
        aiService?.updateConfig({ maxTokens: validTokens });
        set({ maxTokens: validTokens });
      },

      setTemperature: (temp: number) => {
        const validTemp = Math.max(0, Math.min(2, temp));
        const { aiService } = get();
        aiService?.updateConfig({ temperature: validTemp });
        set({ temperature: validTemp });
      },

      setUseStreaming: (useStreaming: boolean) => {
        const { aiService } = get();
        aiService?.updateConfig({ useStreaming });
        set({ useStreaming });
      },

      setAutoExecuteActions: (autoExecuteActions: boolean) => {
        const { aiService } = get();
        aiService?.updateConfig({ autoExecuteActions });
        set({ autoExecuteActions });
      },

      setContextOptimization: (contextOptimization: boolean) => {
        const { aiService } = get();
        aiService?.updateConfig({ contextOptimization });
        set({ contextOptimization });
      },

      // Conversation Management
      clearMessages: () => {
        set({
          messages: [],
          currentArtifacts: [],
          fileOperations: [],
          streamingContent: ''
        });
      },

      newConversation: () => {
        const { messages } = get();

        // Save current conversation if it has messages
        if (messages.length > 0) {
          get().saveCurrentConversation();
        }

        set({
          messages: [],
          currentArtifacts: [],
          fileOperations: [],
          streamingContent: '',
          currentConversationId: uuidv4(),
          error: null
        });
      },

      loadConversation: (conversation: AIMessage[]) => {
        const { messages } = get();

        // Save current conversation if it has messages
        if (messages.length > 0) {
          get().saveCurrentConversation();
        }

        set({
          messages: conversation,
          currentArtifacts: [],
          fileOperations: [],
          streamingContent: '',
          error: null
        });
      },

      saveCurrentConversation: () => {
        const { messages, conversationHistory } = get();
        if (messages.length === 0) return;

        const updatedHistory = [
          messages,
          ...conversationHistory.filter((_, index) => index < 9) // Keep last 10 conversations
        ];

        set({
          conversationHistory: updatedHistory
        });
      },

      // Error Handling
      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'enhanced-chat-storage',
      partialize: (state) => ({
        // Only persist specific fields
        width: state.width,
        maxTokens: state.maxTokens,
        temperature: state.temperature,
        useStreaming: state.useStreaming,
        autoExecuteActions: state.autoExecuteActions,
        contextOptimization: state.contextOptimization,
        conversationHistory: state.conversationHistory,
        mode: state.mode
      })
    }
  )
);

/**
 * Helper function to process file operations from AI responses
 */
async function processFileOperations(
  content: string,
  workspaceId: string,
  AIActionParser: any,
  AIFileOperations: any,
  get: any,
  set: any
) {
  try {
    console.log('🔍 Parsing AI response for file operations...');

    // Parse artifacts and standalone actions
    const artifacts = AIActionParser.parseArtifacts(content);
    const standaloneActions = AIActionParser.parseStandaloneActions(content);

    if (artifacts.length === 0 && standaloneActions.length === 0) {
      console.log('ℹ️ No file operations found in AI response');
      return; // No file operations to execute
    }

    console.log('✅ Found file operations:', {
      artifacts: artifacts.length,
      standaloneActions: standaloneActions.length,
      totalActions: artifacts.reduce((sum: number, a: AIArtifact) => sum + a.actions.length, 0) + standaloneActions.length
    });

    // Execute artifacts
    for (const artifact of artifacts) {
      for (const action of artifact.actions) {
        await executeFileAction(action, workspaceId, AIFileOperations, get, set);
      }
    }

    // Execute standalone actions
    for (const action of standaloneActions) {
      await executeFileAction(action, workspaceId, AIFileOperations, get, set);
    }

    // Update file operations in store
    set({
      currentArtifacts: artifacts,
      fileOperations: get().fileOperations || []
    });

  } catch (error) {
    console.error('Error processing file operations:', error);
  }
}

/**
 * Execute a single file action
 */
async function executeFileAction(action: any, workspaceId: string, AIFileOperations: any, get: any, set: any) {
  try {
    const progress = {
      action: action.type,
      filePath: action.filePath,
      status: 'running' as const
    };

    // Update progress in store
    const currentOperations = get().fileOperations || [];
    set({
      fileOperations: [...currentOperations, progress]
    });

    // Execute the action
    const result = await AIFileOperations.executeAction(action, workspaceId);

    // Update progress with result
    const updatedProgress = {
      ...progress,
      status: result.success ? 'completed' as const : 'failed' as const,
      error: result.error
    };

    const finalOperations = get().fileOperations || [];
    const updatedOperations = finalOperations.map((op: OperationProgress) =>
      op === progress ? updatedProgress : op
    );

    set({
      fileOperations: updatedOperations
    });

    console.log('File operation result:', result);

  } catch (error) {
    console.error('Error executing file action:', error);
  }
}

// Initialize store with existing API key
const initializeStore = async () => {
  const apiKey = OpenRouterService.getApiKey();
  if (apiKey && OpenRouterService.isValidApiKey(apiKey)) {
    const store = useEnhancedChatStore.getState();
    try {
      await store.setApiKey(apiKey);
    } catch (error) {
      console.error('Failed to initialize API key:', error);
    }
  }
};

// Initialize on module load
initializeStore();