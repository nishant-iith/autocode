/**
 * Enhanced AI Service
 * Integrates context management, streaming responses, and file operations
 * Inspired by Bolt.diy architecture with AutoCode-specific enhancements
 */

import React from 'react';
import { AIContextManager, ConversationContext } from './aiContextManager';
import { AIActionParser, AIAction, AIArtifact } from './aiActionParser';
import { AIFileOperations, OperationProgress } from './aiFileOperations';
import { getSystemPrompt, generateContextualPrompt } from './aiSystemPrompts';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  artifacts?: AIArtifact[];
  context?: ConversationContext;
  streaming?: boolean;
  fileOperations?: OperationProgress[];
}

export interface StreamingResponse {
  content: string;
  artifacts: AIArtifact[];
  actions: AIAction[];
  isComplete: boolean;
  error?: string;
}

export interface AIServiceConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  useStreaming?: boolean;
  autoExecuteActions?: boolean;
  contextOptimization?: boolean;
}

export interface ProjectScope {
  projectId: string;
  projectName: string;
  allowedPaths: string[];
  restrictToProject: boolean;
}

/**
 * Enhanced AI Service with automatic context and streaming capabilities
 */
export class EnhancedAIService {
  private static readonly BASE_URL = 'https://openrouter.ai/api/v1';
  public config: AIServiceConfig;
  private projectScope?: ProjectScope;
  private abortController?: AbortController;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  /**
   * Sets the project scope for edit mode operations
   * @param scope - Project scope configuration
   */
  setProjectScope(scope: ProjectScope) {
    this.projectScope = scope;
  }

  /**
   * Gets the current project scope
   * @returns Current project scope or undefined
   */
  getProjectScope(): ProjectScope | undefined {
    return this.projectScope;
  }

  /**
   * Sends a message with automatic context building and streaming support
   * @param message - User message
   * @param conversationHistory - Previous messages for context
   * @param workspaceId - Current workspace ID
   * @param onStream - Streaming callback function
   * @param onProgress - File operation progress callback
   * @returns Promise with AI response
   */
  async sendMessage(
    message: string,
    conversationHistory: AIMessage[] = [],
    workspaceId: string,
    onStream?: (response: StreamingResponse) => void,
    onProgress?: (progress: OperationProgress) => void
  ): Promise<AIMessage> {
    // Abort any existing request
    this.abortController?.abort();
    this.abortController = new AbortController();

    try {
      // Build automatic context if enabled
      let context: ConversationContext | undefined;
      if (this.config.contextOptimization) {
        context = await AIContextManager.buildContext(conversationHistory, {
          maxFiles: this.projectScope?.restrictToProject ? 10 : 5,
          maxTokensPerFile: 1500,
          includeCurrentFile: true,
          prioritizeModified: true
        });

        // Filter context files by project scope if in restricted mode
        if (this.projectScope?.restrictToProject && context) {
          context.files = context.files.filter(file =>
            this.isFileInProjectScope(file.path)
          );
        }
      }

      // Generate contextual prompt
      const systemPrompt = context
        ? generateContextualPrompt(message, { name: 'AutoCode Project' }, context.files)
        : getSystemPrompt();

      // Prepare messages for API
      const apiMessages = this.prepareAPIMessages(
        message,
        conversationHistory,
        systemPrompt,
        context
      );

      // Send request to AI API
      const response = await this.callAIAPI(apiMessages, onStream);

      // Process response and execute actions if enabled
      const processedResponse = await this.processAIResponse(
        response,
        workspaceId,
        context,
        onProgress
      );

      return processedResponse;

    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Executes AI artifacts with progress tracking
   * @param artifacts - AI artifacts to execute
   * @param workspaceId - Current workspace ID
   * @param onProgress - Progress callback
   * @returns Array of operation results
   */
  async executeArtifacts(
    artifacts: AIArtifact[],
    workspaceId: string,
    onProgress?: (progress: OperationProgress) => void
  ) {
    const results = [];

    for (const artifact of artifacts) {
      // Validate all file operations in the artifact if project scope is restricted
      if (this.projectScope?.restrictToProject) {
        for (const action of artifact.actions) {
          if (action.filePath && ['file', 'create', 'edit', 'delete'].includes(action.type)) {
            this.validateFileOperation(action.filePath);
          }
        }
      }

      const result = await AIFileOperations.executeArtifact(
        artifact,
        workspaceId,
        onProgress
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Aborts current AI request
   */
  abort() {
    this.abortController?.abort();
  }

  /**
   * Updates service configuration
   * @param newConfig - Updated configuration
   */
  updateConfig(newConfig: Partial<AIServiceConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Prepares messages for AI API call
   */
  private prepareAPIMessages(
    userMessage: string,
    conversationHistory: AIMessage[],
    systemPrompt: string,
    context?: ConversationContext
  ): Array<{role: 'system' | 'user' | 'assistant', content: string}> {
    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt
      }
    ];

    // Add context information if available
    if (context) {
      messages.push({
        role: 'system' as const,
        content: AIContextManager.formatContextForAI(context)
      });
    }

    // Add conversation history (last 10 messages to avoid token overflow)
    const recentHistory = conversationHistory.slice(-10);
    recentHistory.forEach(msg => {
      if (msg.role !== 'system') {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        });
      }
    });

    // Add current user message
    messages.push({
      role: 'user' as const,
      content: userMessage
    });

    return messages;
  }

  /**
   * Calls the AI API with streaming support
   */
  private async callAIAPI(
    messages: any[],
    onStream?: (response: StreamingResponse) => void
  ): Promise<string> {
    const response = await fetch(`${EnhancedAIService.BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://autocode.dev',
        'X-Title': 'AutoCode AI Assistant'
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        max_tokens: this.config.maxTokens || 2000,
        temperature: this.config.temperature || 0.7,
        stream: this.config.useStreaming || false
      }),
      signal: this.abortController?.signal
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`);
    }

    if (this.config.useStreaming && onStream) {
      return this.handleStreamingResponse(response, onStream);
    } else {
      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    }
  }

  /**
   * Handles streaming AI response
   */
  private async handleStreamingResponse(
    response: Response,
    onStream: (response: StreamingResponse) => void
  ): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    let fullContent = '';
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              // Final processing of complete content
              const artifacts = AIActionParser.parseArtifacts(fullContent);
              const actions = AIActionParser.getAllActions(fullContent);

              onStream({
                content: fullContent,
                artifacts,
                actions,
                isComplete: true
              });
              return fullContent;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';

              if (content) {
                fullContent += content;

                // Parse current content for artifacts and actions
                const artifacts = AIActionParser.parseArtifacts(fullContent);
                const actions = AIActionParser.getAllActions(fullContent);

                onStream({
                  content: fullContent,
                  artifacts,
                  actions,
                  isComplete: false
                });
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }

  /**
   * Processes AI response and executes actions if enabled
   */
  private async processAIResponse(
    content: string,
    workspaceId: string,
    context?: ConversationContext,
    onProgress?: (progress: OperationProgress) => void
  ): Promise<AIMessage> {
    // Parse artifacts and actions from response
    const artifacts = AIActionParser.parseArtifacts(content);
    const standaloneActions = AIActionParser.parseStandaloneActions(content);

    // Execute actions if auto-execution is enabled
    const fileOperations: OperationProgress[] = [];

    if (this.config.autoExecuteActions) {
      // Execute artifacts
      for (const artifact of artifacts) {
        await AIFileOperations.executeArtifact(artifact, workspaceId, (progress) => {
          fileOperations.push(progress);
          onProgress?.(progress);
        });
      }

      // Execute standalone actions
      for (const action of standaloneActions) {
        await AIFileOperations.executeAction(action, workspaceId, (progress) => {
          fileOperations.push(progress);
          onProgress?.(progress);
        });
      }
    }

    return {
      id: this.generateMessageId(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      artifacts: artifacts.length > 0 ? artifacts : undefined,
      context,
      fileOperations: fileOperations.length > 0 ? fileOperations : undefined
    };
  }

  /**
   * Handles API errors with proper error classification
   */
  private handleError(error: any): Error {
    if (error.name === 'AbortError') {
      return new Error('Request was aborted');
    }

    if (error.message?.includes('401')) {
      return new Error('Invalid API key. Please check your OpenRouter API key.');
    }

    if (error.message?.includes('429')) {
      return new Error('Rate limit exceeded. Please wait a moment and try again.');
    }

    if (error.message?.includes('quota')) {
      return new Error('API quota exceeded. Please check your OpenRouter account.');
    }

    return error instanceof Error ? error : new Error('Unknown AI service error');
  }

  /**
   * Checks if a file path is within the current project scope
   * @param filePath - File path to check
   * @returns Boolean indicating if file is in scope
   */
  private isFileInProjectScope(filePath: string): boolean {
    if (!this.projectScope?.restrictToProject) {
      return true;
    }

    // Check if file path starts with any allowed path
    return this.projectScope.allowedPaths.some(allowedPath =>
      filePath.startsWith(allowedPath)
    );
  }

  /**
   * Validates file operations against project scope
   * @param filePath - File path for operation
   * @returns Boolean indicating if operation is allowed
   */
  private validateFileOperation(filePath: string): boolean {
    if (!this.projectScope?.restrictToProject) {
      return true;
    }

    if (!this.isFileInProjectScope(filePath)) {
      throw new Error(`File operation not allowed outside project scope: ${filePath}`);
    }

    return true;
  }

  /**
   * Generates unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Factory function to create enhanced AI service instance
 */
export function createEnhancedAIService(config: AIServiceConfig): EnhancedAIService {
  return new EnhancedAIService(config);
}

/**
 * Hook for React components to use enhanced AI service
 */
export function useEnhancedAI(config: AIServiceConfig) {
  const [service] = React.useState(() => createEnhancedAIService(config));

  React.useEffect(() => {
    service.updateConfig(config);
  }, [config, service]);

  return service;
}