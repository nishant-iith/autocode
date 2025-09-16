/**
 * File Service Interface
 * Defines contract for file operations to enable dependency inversion
 */

export interface FileOperationResult {
  success: boolean;
  error?: string;
  filePath?: string;
  action?: string;
}

export interface FileCreateRequest {
  workspaceId: string;
  filePath: string;
  content: string;
}

export interface FileUpdateRequest {
  workspaceId: string;
  filePath: string;
  content: string;
}

export interface FileDeleteRequest {
  workspaceId: string;
  filePath: string;
}

export interface IFileService {
  /**
   * Creates a new file
   */
  createFile(request: FileCreateRequest): Promise<FileOperationResult>;

  /**
   * Updates an existing file
   */
  updateFile(request: FileUpdateRequest): Promise<FileOperationResult>;

  /**
   * Deletes a file
   */
  deleteFile(request: FileDeleteRequest): Promise<FileOperationResult>;

  /**
   * Checks if a file exists
   */
  fileExists(workspaceId: string, filePath: string): Promise<boolean>;

  /**
   * Lists all files in workspace
   */
  listFiles(workspaceId: string): Promise<string[]>;

  /**
   * Gets file content
   */
  getFileContent(workspaceId: string, filePath: string): Promise<string>;
}