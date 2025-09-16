/**
 * AI Context Management Service
 * Manages file context selection and optimization for AI conversations
 * Implements intelligent file relevance scoring and context optimization
 */

import { useEditorStore } from '../store/editorStore';
import { useProjectStore } from '../store/projectStore';
import { useChatStore } from '../store/chatStore';

export interface FileContext {
  path: string;
  name: string;
  content: string;
  language: string;
  relevanceScore: number;
  lastModified?: Date;
  size: number;
}

export interface ConversationContext {
  files: FileContext[];
  summary: string;
  keywords: string[];
  totalTokens: number;
  maxTokens: number;
}

export interface ContextOptimizationOptions {
  maxFiles?: number;
  maxTokensPerFile?: number;
  includeCurrentFile?: boolean;
  prioritizeModified?: boolean;
  relevanceThreshold?: number;
}

/**
 * Service class for managing AI conversation context
 */
export class AIContextManager {
  private static readonly DEFAULT_MAX_TOKENS = 8000; // Conservative limit for context
  private static readonly DEFAULT_MAX_FILES = 10;
  private static readonly DEFAULT_MAX_TOKENS_PER_FILE = 2000;
  private static readonly RELEVANCE_THRESHOLD = 0.3;

  /**
   * Builds optimized context for AI conversation
   * @param conversationHistory - Array of previous messages
   * @param options - Context optimization options
   * @returns Optimized conversation context
   */
  static async buildContext(
    conversationHistory: any[],
    options: ContextOptimizationOptions = {}
  ): Promise<ConversationContext> {
    const {
      maxFiles = this.DEFAULT_MAX_FILES,
      maxTokensPerFile = this.DEFAULT_MAX_TOKENS_PER_FILE,
      includeCurrentFile = true,
      prioritizeModified = true,
      relevanceThreshold = this.RELEVANCE_THRESHOLD
    } = options;

    // Get all available files
    const allFiles = await this.getAllProjectFiles();

    // Extract keywords from conversation
    const keywords = this.extractKeywords(conversationHistory);

    // Score file relevance
    const scoredFiles = allFiles.map(file => ({
      ...file,
      relevanceScore: this.calculateRelevanceScore(file, conversationHistory, keywords)
    }));

    // Filter by relevance threshold
    const relevantFiles = scoredFiles.filter(file => file.relevanceScore >= relevanceThreshold);

    // Sort by relevance and modification time
    const sortedFiles = this.sortFilesByPriority(relevantFiles, prioritizeModified, includeCurrentFile);

    // Optimize token usage
    const optimizedFiles = this.optimizeTokenUsage(sortedFiles, maxFiles, maxTokensPerFile);

    // Generate conversation summary
    const summary = this.generateConversationSummary(conversationHistory);

    // Calculate total tokens
    const totalTokens = this.calculateTotalTokens(optimizedFiles, summary);

    return {
      files: optimizedFiles,
      summary,
      keywords,
      totalTokens,
      maxTokens: this.DEFAULT_MAX_TOKENS
    };
  }

  /**
   * Gets all files from the current project
   * @returns Array of file contexts
   */
  private static async getAllProjectFiles(): Promise<FileContext[]> {
    const editorStore = useEditorStore.getState();
    const projectStore = useProjectStore.getState();

    if (!projectStore.currentProject) {
      return [];
    }

    // Get files from editor store (opened files)
    const openFiles = editorStore.openTabs.map(tab => ({
      path: tab.path,
      name: tab.name,
      content: tab.content || '',
      language: tab.language || 'plaintext',
      relevanceScore: 0,
      lastModified: new Date(),
      size: (tab.content || '').length
    }));

    // TODO: Add API call to get all project files from workspace
    // This would require extending the file API to list all files with content

    return openFiles;
  }

  /**
   * Extracts keywords from conversation history
   * @param conversationHistory - Array of messages
   * @returns Array of relevant keywords
   */
  private static extractKeywords(conversationHistory: any[]): string[] {
    const keywords = new Set<string>();

    conversationHistory.forEach(message => {
      if (typeof message.content === 'string') {
        // Extract technical terms, file names, and important concepts
        const text = message.content.toLowerCase();

        // Programming language keywords
        const programmingKeywords = [
          'function', 'component', 'class', 'interface', 'type', 'const', 'let', 'var',
          'import', 'export', 'return', 'async', 'await', 'promise', 'error', 'api',
          'react', 'typescript', 'javascript', 'css', 'html', 'node', 'express'
        ];

        programmingKeywords.forEach(keyword => {
          if (text.includes(keyword)) {
            keywords.add(keyword);
          }
        });

        // Extract file paths and names
        const filePathRegex = /\b[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)*\.[a-zA-Z0-9]+\b/g;
        const filePaths = text.match(filePathRegex) || [];
        filePaths.forEach(path => {
          keywords.add(path);
          const fileName = path.split('/').pop();
          if (fileName) keywords.add(fileName);
        });

        // Extract quoted terms (often important concepts)
        const quotedTerms = text.match(/"([^"]+)"|'([^']+)'|`([^`]+)`/g) || [];
        quotedTerms.forEach(term => {
          const cleaned = term.replace(/["`']/g, '');
          if (cleaned.length > 2 && cleaned.length < 50) {
            keywords.add(cleaned);
          }
        });
      }
    });

    return Array.from(keywords);
  }

  /**
   * Calculates relevance score for a file based on conversation context
   * @param file - File to score
   * @param conversationHistory - Conversation messages
   * @param keywords - Extracted keywords
   * @returns Relevance score (0-1)
   */
  private static calculateRelevanceScore(
    file: FileContext,
    conversationHistory: any[],
    keywords: string[]
  ): number {
    let score = 0;

    // Base score for current file
    const editorStore = useEditorStore.getState();
    if (editorStore.activeFile?.path === file.path) {
      score += 0.3;
    }

    // Score based on keyword matches in file content
    const fileContent = file.content.toLowerCase();
    const fileName = file.name.toLowerCase();
    const filePath = file.path.toLowerCase();

    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();

      // Higher score for matches in file name/path
      if (fileName.includes(keywordLower) || filePath.includes(keywordLower)) {
        score += 0.2;
      }

      // Score for matches in file content
      const contentMatches = (fileContent.match(new RegExp(keywordLower, 'g')) || []).length;
      score += Math.min(contentMatches * 0.05, 0.3);
    });

    // Score based on file type relevance
    const fileTypeScores: Record<string, number> = {
      'typescript': 0.15,
      'javascript': 0.15,
      'tsx': 0.15,
      'jsx': 0.15,
      'json': 0.1,
      'css': 0.1,
      'html': 0.1,
      'markdown': 0.05
    };

    score += fileTypeScores[file.language] || 0;

    // Recent modification bonus
    if (file.lastModified) {
      const hoursSinceModified = (Date.now() - file.lastModified.getTime()) / (1000 * 60 * 60);
      if (hoursSinceModified < 1) score += 0.2;
      else if (hoursSinceModified < 24) score += 0.1;
    }

    // Normalize score to 0-1 range
    return Math.min(score, 1);
  }

  /**
   * Sorts files by priority (relevance and modification time)
   * @param files - Files to sort
   * @param prioritizeModified - Whether to prioritize recently modified files
   * @param includeCurrentFile - Whether to ensure current file is included
   * @returns Sorted array of files
   */
  private static sortFilesByPriority(
    files: FileContext[],
    prioritizeModified: boolean,
    includeCurrentFile: boolean
  ): FileContext[] {
    const editorStore = useEditorStore.getState();
    const currentFilePath = editorStore.activeFile?.path;

    return files.sort((a, b) => {
      // Current file always comes first if included
      if (includeCurrentFile && currentFilePath) {
        if (a.path === currentFilePath) return -1;
        if (b.path === currentFilePath) return 1;
      }

      // Primary sort by relevance score
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }

      // Secondary sort by modification time if prioritized
      if (prioritizeModified && a.lastModified && b.lastModified) {
        return b.lastModified.getTime() - a.lastModified.getTime();
      }

      // Tertiary sort by file size (smaller files first for better context)
      return a.size - b.size;
    });
  }

  /**
   * Optimizes token usage by truncating files and limiting selection
   * @param files - Sorted files
   * @param maxFiles - Maximum number of files to include
   * @param maxTokensPerFile - Maximum tokens per file
   * @returns Optimized array of files
   */
  private static optimizeTokenUsage(
    files: FileContext[],
    maxFiles: number,
    maxTokensPerFile: number
  ): FileContext[] {
    const optimizedFiles: FileContext[] = [];

    for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
      const file = files[i];
      const estimatedTokens = this.estimateTokens(file.content);

      if (estimatedTokens > maxTokensPerFile) {
        // Truncate file content to fit token limit
        const truncatedContent = this.truncateContent(file.content, maxTokensPerFile);
        optimizedFiles.push({
          ...file,
          content: truncatedContent,
          size: truncatedContent.length
        });
      } else {
        optimizedFiles.push(file);
      }
    }

    return optimizedFiles;
  }

  /**
   * Estimates token count for text content
   * @param content - Text content
   * @returns Estimated token count
   */
  private static estimateTokens(content: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    // Code typically has more tokens per character
    return Math.ceil(content.length / 3);
  }

  /**
   * Truncates content to fit within token limit
   * @param content - Content to truncate
   * @param maxTokens - Maximum tokens allowed
   * @returns Truncated content
   */
  private static truncateContent(content: string, maxTokens: number): string {
    const maxChars = maxTokens * 3; // Conservative estimate

    if (content.length <= maxChars) {
      return content;
    }

    // Try to truncate at line boundaries
    const lines = content.split('\n');
    let truncated = '';
    let currentLength = 0;

    for (const line of lines) {
      if (currentLength + line.length + 1 > maxChars) {
        truncated += '\n... [Content truncated for context optimization]';
        break;
      }
      truncated += (truncated ? '\n' : '') + line;
      currentLength += line.length + 1;
    }

    return truncated;
  }

  /**
   * Generates a summary of the conversation for context
   * @param conversationHistory - Array of messages
   * @returns Conversation summary
   */
  private static generateConversationSummary(conversationHistory: any[]): string {
    if (conversationHistory.length === 0) {
      return 'New conversation started.';
    }

    const recentMessages = conversationHistory.slice(-5); // Last 5 messages
    const topics = new Set<string>();

    recentMessages.forEach(message => {
      if (typeof message.content === 'string') {
        // Extract main topics from messages
        const content = message.content.toLowerCase();

        // Look for action words that indicate what the user wants to do
        const actionWords = [
          'create', 'build', 'make', 'add', 'implement', 'fix', 'update',
          'modify', 'change', 'delete', 'remove', 'refactor', 'optimize'
        ];

        actionWords.forEach(action => {
          if (content.includes(action)) {
            topics.add(action);
          }
        });

        // Extract file types and technologies mentioned
        const techWords = [
          'component', 'function', 'api', 'database', 'ui', 'interface',
          'react', 'typescript', 'css', 'html', 'javascript'
        ];

        techWords.forEach(tech => {
          if (content.includes(tech)) {
            topics.add(tech);
          }
        });
      }
    });

    const topicsArray = Array.from(topics);

    if (topicsArray.length === 0) {
      return 'General development discussion.';
    }

    return `Discussion topics: ${topicsArray.join(', ')}.`;
  }

  /**
   * Calculates total tokens for context
   * @param files - Files in context
   * @param summary - Conversation summary
   * @returns Total estimated tokens
   */
  private static calculateTotalTokens(files: FileContext[], summary: string): number {
    const fileTokens = files.reduce((total, file) => total + this.estimateTokens(file.content), 0);
    const summaryTokens = this.estimateTokens(summary);

    return fileTokens + summaryTokens;
  }

  /**
   * Formats context for AI prompt inclusion
   * @param context - Conversation context
   * @returns Formatted context string
   */
  static formatContextForAI(context: ConversationContext): string {
    let formatted = `# Project Context\n\n`;

    if (context.summary) {
      formatted += `## Conversation Summary\n${context.summary}\n\n`;
    }

    if (context.keywords.length > 0) {
      formatted += `## Key Topics\n${context.keywords.join(', ')}\n\n`;
    }

    if (context.files.length > 0) {
      formatted += `## Relevant Files\n\n`;

      context.files.forEach(file => {
        formatted += `### ${file.path}\n`;
        formatted += `Language: ${file.language}\n`;
        formatted += `Relevance: ${(file.relevanceScore * 100).toFixed(0)}%\n\n`;
        formatted += '```' + file.language + '\n';
        formatted += file.content;
        formatted += '\n```\n\n';
      });
    }

    formatted += `\n*Context includes ${context.files.length} files (~${context.totalTokens} tokens)*\n`;

    return formatted;
  }
}