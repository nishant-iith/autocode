/**
 * AI Action Parser Service
 * Parses structured AI responses to extract actionable commands
 * Inspired by Bolt.diy's artifact system for file operations
 */

export interface AIAction {
  type: 'file' | 'shell' | 'create' | 'edit' | 'delete' | 'start';
  filePath?: string;
  content?: string;
  command?: string;
  description?: string;
  id?: string;
}

export interface AIArtifact {
  id: string;
  title: string;
  description?: string;
  actions: AIAction[];
}

/**
 * Parses AI response for structured actions using XML-like tags
 * Supports both <autoAction> and <boltAction> formats for compatibility
 */
export class AIActionParser {
  /**
   * Extracts all artifacts from AI response
   * @param response - Raw AI response text
   * @returns Array of parsed artifacts
   */
  static parseArtifacts(response: string): AIArtifact[] {
    const artifacts: AIArtifact[] = [];

    // Match both autoArtifact and boltArtifact tags for compatibility
    const artifactRegex = /<(auto|bolt)Artifact\s+id="([^"]+)"\s+title="([^"]+)"(?:\s+description="([^"]*)")?>([\s\S]*?)<\/(auto|bolt)Artifact>/gi;

    let match;
    while ((match = artifactRegex.exec(response)) !== null) {
      const [, , id, title, description, content] = match;

      const actions = this.parseActions(content);

      artifacts.push({
        id,
        title,
        description: description || '',
        actions
      });
    }

    return artifacts;
  }

  /**
   * Parses individual actions within an artifact
   * @param content - Content within artifact tags
   * @returns Array of parsed actions
   */
  static parseActions(content: string): AIAction[] {
    const actions: AIAction[] = [];

    // Match both autoAction and boltAction tags
    const actionRegex = /<(auto|bolt)Action\s+type="([^"]+)"(?:\s+filePath="([^"]*)")?(?:\s+description="([^"]*)")?>([\s\S]*?)<\/(auto|bolt)Action>/gi;

    let match;
    while ((match = actionRegex.exec(content)) !== null) {
      const [, , type, filePath, description, actionContent] = match;

      const action: AIAction = {
        type: type as AIAction['type'],
        filePath: filePath || undefined,
        description: description || undefined
      };

      // Handle different action types
      switch (type) {
        case 'file':
        case 'create':
        case 'edit':
          action.content = actionContent.trim();
          break;
        case 'shell':
        case 'start':
          action.command = actionContent.trim();
          break;
        case 'delete':
          // Delete actions only need filePath
          break;
      }

      actions.push(action);
    }

    return actions;
  }

  /**
   * Extracts standalone actions from AI response (without artifacts)
   * @param response - Raw AI response text
   * @returns Array of standalone actions
   */
  static parseStandaloneActions(response: string): AIAction[] {
    // First remove any artifact blocks to avoid duplicate parsing
    const withoutArtifacts = response.replace(/<(auto|bolt)Artifact[\s\S]*?<\/(auto|bolt)Artifact>/gi, '');

    return this.parseActions(withoutArtifacts);
  }

  /**
   * Validates if a file path is safe for operations
   * @param filePath - File path to validate
   * @returns Boolean indicating if path is safe
   */
  static isValidFilePath(filePath: string): boolean {
    if (!filePath) return false;

    // Prevent path traversal attacks
    if (filePath.includes('..') || filePath.includes('~')) {
      return false;
    }

    // Ensure path doesn't start with / (absolute paths)
    if (filePath.startsWith('/')) {
      return false;
    }

    // Ensure path doesn't contain dangerous characters
    const dangerousChars = /[<>:"|?*]/;
    if (dangerousChars.test(filePath)) {
      return false;
    }

    return true;
  }

  /**
   * Sanitizes file content for safe operations
   * @param content - File content to sanitize
   * @returns Sanitized content
   */
  static sanitizeContent(content: string): string {
    if (!content) return '';

    // Remove any embedded script tags or dangerous content
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  /**
   * Extracts file context information from AI response
   * This helps identify which files the AI is referencing
   * @param response - AI response text
   * @returns Array of file paths mentioned
   */
  static extractFileReferences(response: string): string[] {
    const fileReferences = new Set<string>();

    // Look for common file path patterns
    const filePathPatterns = [
      // Explicit file references like "src/App.tsx" or "components/Button.js"
      /(?:^|\s)([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)*\.[a-zA-Z0-9]+)(?:\s|$|[.,!?])/gm,
      // Files mentioned in backticks
      /`([^`]*\.[a-zA-Z0-9]+)`/g,
      // Files in quotes
      /"([^"]*\.[a-zA-Z0-9]+)"/g,
      /'([^']*\.[a-zA-Z0-9]+)'/g
    ];

    filePathPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        const filePath = match[1];
        if (this.isValidFilePath(filePath)) {
          fileReferences.add(filePath);
        }
      }
    });

    return Array.from(fileReferences);
  }

  /**
   * Determines if AI response contains actionable content
   * @param response - AI response text
   * @returns Boolean indicating if response has actions
   */
  static hasActions(response: string): boolean {
    const artifacts = this.parseArtifacts(response);
    const standaloneActions = this.parseStandaloneActions(response);

    return artifacts.length > 0 || standaloneActions.length > 0;
  }

  /**
   * Gets all actions from a response (both in artifacts and standalone)
   * @param response - AI response text
   * @returns Array of all actions found
   */
  static getAllActions(response: string): AIAction[] {
    const actions: AIAction[] = [];

    // Get actions from artifacts
    const artifacts = this.parseArtifacts(response);
    artifacts.forEach(artifact => {
      actions.push(...artifact.actions);
    });

    // Get standalone actions
    const standaloneActions = this.parseStandaloneActions(response);
    actions.push(...standaloneActions);

    return actions;
  }
}