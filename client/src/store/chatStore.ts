import { create } from 'zustand';
import { OpenRouterService, OpenRouterModel, ChatMessage } from '../services/openRouter';
import { v4 as uuidv4 } from 'uuid';

interface ChatState {
  // UI State
  isOpen: boolean;
  width: number;
  isLoading: boolean;
  error: string | null;
  
  // API Key Management
  apiKey: string | null;
  isApiKeyValid: boolean;
  
  // Models
  availableModels: OpenRouterModel[];
  freeModels: OpenRouterModel[];
  selectedModel: string | null;
  isLoadingModels: boolean;
  
  // Chat
  messages: ChatMessage[];
  isTyping: boolean;
  streamingMessage: string;
  conversationHistory: ChatMessage[][];
  
  // Settings
  maxTokens: number;
  temperature: number;
  useStreaming: boolean;
  
  // Actions
  toggleChat: () => void;
  closeChat: () => void;
  setWidth: (width: number) => void;
  setApiKey: (apiKey: string) => void;
  clearApiKey: () => void;
  loadModels: () => Promise<void>;
  selectModel: (modelId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  sendMessageWithContext: (content: string, context: string) => Promise<void>;
  clearMessages: () => void;
  setError: (error: string | null) => void;
  setMaxTokens: (tokens: number) => void;
  setTemperature: (temp: number) => void;
  setUseStreaming: (useStreaming: boolean) => void;
  saveCurrentConversation: () => void;
  loadConversationHistory: () => ChatMessage[][];
  loadConversation: (conversation: ChatMessage[]) => void;
  newConversation: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  isOpen: true, // Default to open for separate panel layout
  width: 400, // Default 30% of 1280px screen
  isLoading: false,
  error: null,
  
  apiKey: OpenRouterService.getApiKey(),
  isApiKeyValid: false,
  
  availableModels: [],
  freeModels: [],
  selectedModel: null,
  isLoadingModels: false,
  
  messages: [],
  isTyping: false,
  streamingMessage: '',
  conversationHistory: [],
  
  maxTokens: 1000,
  temperature: 0.7,
  useStreaming: true,

  // Actions
  toggleChat: () => {
    const { isOpen } = get();
    set({ isOpen: !isOpen });
    
    // Load models when opening chat for first time
    const { availableModels, apiKey } = get();
    if (!isOpen && availableModels.length === 0 && apiKey) {
      get().loadModels();
    }
  },

  closeChat: () => {
    set({ isOpen: false });
  },

  setWidth: (width: number) => {
    set({ width });
  },

  setApiKey: async (apiKey: string) => {
    const trimmedKey = apiKey.trim();
    const isValid = OpenRouterService.isValidApiKey(trimmedKey);
    
    if (isValid) {
      OpenRouterService.setApiKey(trimmedKey);
      set({ 
        apiKey: trimmedKey, 
        isApiKeyValid: true,
        error: null 
      });
      
      // Load models after setting API key
      await get().loadModels();
    } else {
      set({ 
        apiKey: null, 
        isApiKeyValid: false,
        error: 'Invalid API key. Please use a valid OpenRouter API key starting with "sk-"'
      });
    }
  },

  clearApiKey: () => {
    OpenRouterService.clearApiKey();
    set({ 
      apiKey: null, 
      isApiKeyValid: false,
      availableModels: [],
      freeModels: [],
      selectedModel: null,
      messages: [],
      error: null
    });
  },

  loadModels: async () => {
    const { apiKey } = get();
    if (!apiKey) return;

    set({ isLoadingModels: true, error: null });
    
    try {
      const models = await OpenRouterService.getModels();
      const freeModels = OpenRouterService.getFreeModels(models);
      
      set({ 
        availableModels: models,
        freeModels,
        isLoadingModels: false,
        selectedModel: freeModels.length > 0 ? freeModels[0].id : null,
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
    set({ selectedModel: modelId });
  },

  sendMessage: async (content: string) => {
    const { 
      selectedModel, 
      messages, 
      maxTokens, 
      temperature,
      useStreaming,
      apiKey 
    } = get();

    if (!selectedModel || !apiKey) {
      set({ error: 'Please select a model and configure API key' });
      return;
    }

    if (!content.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    set({ 
      messages: [...messages, userMessage],
      isTyping: true,
      streamingMessage: '',
      error: null 
    });

    try {
      // Create assistant message placeholder for streaming
      const assistantMessageId = uuidv4();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      // Add empty assistant message if streaming
      if (useStreaming) {
        const currentMessages = get().messages;
        set({ 
          messages: [...currentMessages, assistantMessage]
        });
      }

      // Send to OpenRouter API with streaming support
      const response = await OpenRouterService.sendMessage(
        selectedModel,
        [...messages, userMessage],
        {
          maxTokens,
          temperature,
          stream: useStreaming,
          onChunk: useStreaming ? (chunk: string) => {
            // Update the streaming message and the last message in the array
            const currentState = get();
            const updatedMessages = [...currentState.messages];
            const lastMessageIndex = updatedMessages.length - 1;
            
            if (lastMessageIndex >= 0 && updatedMessages[lastMessageIndex].id === assistantMessageId) {
              updatedMessages[lastMessageIndex] = {
                ...updatedMessages[lastMessageIndex],
                content: updatedMessages[lastMessageIndex].content + chunk
              };
              
              set({ 
                messages: updatedMessages,
                streamingMessage: currentState.streamingMessage + chunk
              });
            }
          } : undefined
        }
      );

      // If not streaming, add the complete response
      if (!useStreaming) {
        assistantMessage.content = response;
        const currentMessages = get().messages;
        set({ 
          messages: [...currentMessages, assistantMessage]
        });
      }

      set({ 
        isTyping: false,
        streamingMessage: ''
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      
      let errorMessage = 'Failed to send message';
      if (error instanceof Error) {
        if (error.message.includes('No endpoints found')) {
          errorMessage = 'No free models available for your API key. Please check your OpenRouter settings or try a different model.';
        } else if (error.message.includes('data policy')) {
          errorMessage = 'Model access restricted by data policy. Please configure your privacy settings at openrouter.ai/settings/privacy';
        } else {
          errorMessage = error.message;
        }
      }
      
      set({ 
        isTyping: false,
        error: errorMessage
      });
    }
  },

  sendMessageWithContext: async (content: string, context: string) => {
    const { 
      selectedModel, 
      messages, 
      maxTokens, 
      temperature,
      useStreaming,
      apiKey 
    } = get();

    if (!selectedModel || !apiKey) {
      set({ error: 'Please select a model and configure API key' });
      return;
    }

    if (!content.trim()) return;

    // Combine user message with context
    const contextualContent = context 
      ? `Context:\n${context}\n\nUser: ${content.trim()}`
      : content.trim();

    // Add user message (show original content without context in UI)
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    set({ 
      messages: [...messages, userMessage],
      isTyping: true,
      streamingMessage: '',
      error: null 
    });

    try {
      // Create assistant message placeholder for streaming
      const assistantMessageId = uuidv4();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      // Add empty assistant message if streaming
      if (useStreaming) {
        const currentMessages = get().messages;
        set({ 
          messages: [...currentMessages, assistantMessage]
        });
      }

      // Create contextual message for API (but use original messages for conversation history)
      const contextualMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: contextualContent,
        timestamp: new Date(),
      };

      // Send to OpenRouter API with context
      const response = await OpenRouterService.sendMessage(
        selectedModel,
        [...messages, contextualMessage],
        {
          maxTokens,
          temperature,
          stream: useStreaming,
          onChunk: useStreaming ? (chunk: string) => {
            // Update the streaming message and the last message in the array
            const currentState = get();
            const updatedMessages = [...currentState.messages];
            const lastMessageIndex = updatedMessages.length - 1;
            
            if (lastMessageIndex >= 0 && updatedMessages[lastMessageIndex].id === assistantMessageId) {
              updatedMessages[lastMessageIndex] = {
                ...updatedMessages[lastMessageIndex],
                content: updatedMessages[lastMessageIndex].content + chunk
              };
              
              set({ 
                messages: updatedMessages,
                streamingMessage: currentState.streamingMessage + chunk
              });
            }
          } : undefined
        }
      );

      // If not streaming, add the complete response
      if (!useStreaming) {
        assistantMessage.content = response;
        const currentMessages = get().messages;
        set({ 
          messages: [...currentMessages, assistantMessage]
        });
      }

      set({ 
        isTyping: false,
        streamingMessage: ''
      });

    } catch (error) {
      console.error('Failed to send message with context:', error);
      
      let errorMessage = 'Failed to send message';
      if (error instanceof Error) {
        if (error.message.includes('No endpoints found')) {
          errorMessage = 'No free models available for your API key. Please check your OpenRouter settings or try a different model.';
        } else if (error.message.includes('data policy')) {
          errorMessage = 'Model access restricted by data policy. Please configure your privacy settings at openrouter.ai/settings/privacy';
        } else {
          errorMessage = error.message;
        }
      }
      
      set({ 
        isTyping: false,
        error: errorMessage
      });
    }
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setMaxTokens: (tokens: number) => {
    set({ maxTokens: Math.max(1, Math.min(4000, tokens)) });
  },

  setTemperature: (temp: number) => {
    set({ temperature: Math.max(0, Math.min(2, temp)) });
  },

  setUseStreaming: (useStreaming: boolean) => {
    set({ useStreaming });
  },

  saveCurrentConversation: () => {
    const { messages } = get();
    if (messages.length === 0) return;

    try {
      const existingHistory = JSON.parse(localStorage.getItem('chat_history') || '[]');
      const updatedHistory = [messages, ...existingHistory.slice(0, 9)]; // Keep last 10 conversations
      localStorage.setItem('chat_history', JSON.stringify(updatedHistory));
      
      set({ conversationHistory: updatedHistory });
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  },

  loadConversationHistory: () => {
    try {
      const history = JSON.parse(localStorage.getItem('chat_history') || '[]');
      set({ conversationHistory: history });
      return history;
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      return [];
    }
  },

  loadConversation: (conversation: ChatMessage[]) => {
    const { messages } = get();
    
    // Save current conversation if it has messages
    if (messages.length > 0) {
      get().saveCurrentConversation();
    }
    
    // Load the selected conversation
    set({ 
      messages: conversation,
      error: null,
      streamingMessage: ''
    });
  },

  newConversation: () => {
    const { messages } = get();
    
    // Save current conversation if it has messages
    if (messages.length > 0) {
      get().saveCurrentConversation();
    }
    
    // Start fresh
    set({ 
      messages: [],
      error: null,
      streamingMessage: ''
    });
  },
}));

// Initialize API key validation on store creation
const initialApiKey = OpenRouterService.getApiKey();
if (initialApiKey && OpenRouterService.isValidApiKey(initialApiKey)) {
  useChatStore.setState({ 
    apiKey: initialApiKey, 
    isApiKeyValid: true 
  });
}

// Load conversation history on initialization
try {
  const history = JSON.parse(localStorage.getItem('chat_history') || '[]');
  useChatStore.setState({ conversationHistory: history });
} catch (error) {
  console.error('Failed to load initial conversation history:', error);
}