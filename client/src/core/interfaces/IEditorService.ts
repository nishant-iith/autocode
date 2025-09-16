/**
 * Editor Service Interface
 * Defines contract for editor operations to enable dependency inversion
 */

export interface FileTab {
  id: string;
  name: string;
  path: string;
  content: string;
  originalContent?: string;
  isDirty: boolean;
  isActive: boolean;
  language?: string;
  isAIModified?: boolean;
  lastAIModification?: Date;
}

export interface OpenFileRequest {
  path: string;
  name: string;
  content: string;
  language?: string;
}

export interface UpdateFileRequest {
  path: string;
  content: string;
  isAIModified?: boolean;
}

export interface IEditorService {
  /**
   * Opens a file in the editor
   */
  openFile(request: OpenFileRequest): void;

  /**
   * Opens a file created/modified by AI
   */
  openFileFromAI(request: OpenFileRequest): void;

  /**
   * Updates file content
   */
  updateFileContent(request: UpdateFileRequest): void;

  /**
   * Updates file content from AI
   */
  updateFileFromAI(path: string, content: string): void;

  /**
   * Closes a file
   */
  closeFile(path: string): void;

  /**
   * Sets active file
   */
  setActiveFile(path: string): void;

  /**
   * Gets file by path
   */
  getFileByPath(path: string): FileTab | undefined;

  /**
   * Gets all open files
   */
  getOpenFiles(): readonly FileTab[];

  /**
   * Gets currently active file
   */
  getActiveFile(): FileTab | null;

  /**
   * Marks file as AI modified
   */
  markFileAsAIModified(path: string): void;

  /**
   * Clears AI modification flags
   */
  clearAIModificationFlags(): void;
}