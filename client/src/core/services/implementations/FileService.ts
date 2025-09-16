/**
 * File Service Implementation
 * HTTP-based file operations with proper error handling
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  IFileService,
  FileOperationResult,
  FileCreateRequest,
  FileUpdateRequest,
  FileDeleteRequest
} from '../../interfaces/IFileService';
import { ErrorHandlingService } from '../ErrorHandlingService';
import { ILogger } from '../ErrorHandlingService';

export class FileService implements IFileService {
  private httpClient: AxiosInstance;

  constructor(
    private baseURL: string = 'http://localhost:5000/api',
    private errorHandler: ErrorHandlingService,
    private logger: ILogger
  ) {
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  async createFile(request: FileCreateRequest): Promise<FileOperationResult> {
    try {
      this.logger.info(`Creating file: ${request.filePath}`, {
        workspaceId: request.workspaceId,
        contentLength: request.content.length
      });

      const response = await this.httpClient.post('/files/create', {
        workspaceId: request.workspaceId,
        filePath: request.filePath,
        content: request.content
      });

      this.logger.info(`File created successfully: ${request.filePath}`);

      return {
        success: true,
        filePath: request.filePath,
        action: 'create'
      };
    } catch (error) {
      const handledError = this.errorHandler.handleFileOperationError(error, {
        operation: 'create',
        filePath: request.filePath,
        workspaceId: request.workspaceId
      });

      this.logger.error(`File creation failed: ${request.filePath}`, {
        error: handledError.getLogDetails()
      });

      return {
        success: false,
        error: handledError.getUserMessage(),
        filePath: request.filePath,
        action: 'create'
      };
    }
  }

  async updateFile(request: FileUpdateRequest): Promise<FileOperationResult> {
    try {
      this.logger.info(`Updating file: ${request.filePath}`, {
        workspaceId: request.workspaceId,
        contentLength: request.content.length
      });

      const response = await this.httpClient.put('/files/update', {
        workspaceId: request.workspaceId,
        filePath: request.filePath,
        content: request.content
      });

      this.logger.info(`File updated successfully: ${request.filePath}`);

      return {
        success: true,
        filePath: request.filePath,
        action: 'update'
      };
    } catch (error) {
      const handledError = this.errorHandler.handleFileOperationError(error, {
        operation: 'update',
        filePath: request.filePath,
        workspaceId: request.workspaceId
      });

      this.logger.error(`File update failed: ${request.filePath}`, {
        error: handledError.getLogDetails()
      });

      return {
        success: false,
        error: handledError.getUserMessage(),
        filePath: request.filePath,
        action: 'update'
      };
    }
  }

  async deleteFile(request: FileDeleteRequest): Promise<FileOperationResult> {
    try {
      this.logger.info(`Deleting file: ${request.filePath}`, {
        workspaceId: request.workspaceId
      });

      const response = await this.httpClient.delete('/files/delete', {
        data: {
          workspaceId: request.workspaceId,
          filePath: request.filePath
        }
      });

      this.logger.info(`File deleted successfully: ${request.filePath}`);

      return {
        success: true,
        filePath: request.filePath,
        action: 'delete'
      };
    } catch (error) {
      const handledError = this.errorHandler.handleFileOperationError(error, {
        operation: 'delete',
        filePath: request.filePath,
        workspaceId: request.workspaceId
      });

      this.logger.error(`File deletion failed: ${request.filePath}`, {
        error: handledError.getLogDetails()
      });

      return {
        success: false,
        error: handledError.getUserMessage(),
        filePath: request.filePath,
        action: 'delete'
      };
    }
  }

  async fileExists(workspaceId: string, filePath: string): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/files/exists', {
        params: { workspaceId, filePath }
      });

      return response.data.exists === true;
    } catch (error) {
      this.logger.warn(`Error checking file existence: ${filePath}`, { error });
      return false;
    }
  }

  async listFiles(workspaceId: string): Promise<string[]> {
    try {
      const response = await this.httpClient.get('/files/list', {
        params: { workspaceId }
      });

      return response.data.files || [];
    } catch (error) {
      this.logger.error(`Error listing files for workspace: ${workspaceId}`, { error });
      return [];
    }
  }

  async getFileContent(workspaceId: string, filePath: string): Promise<string> {
    try {
      const response = await this.httpClient.get('/files/content', {
        params: { workspaceId, filePath }
      });

      return response.data.content || '';
    } catch (error) {
      const handledError = this.errorHandler.handleFileOperationError(error, {
        operation: 'read',
        filePath,
        workspaceId
      });

      this.logger.error(`Error reading file content: ${filePath}`, {
        error: handledError.getLogDetails()
      });

      throw handledError;
    }
  }

  private setupInterceptors(): void {
    // Request interceptor for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.debug(`HTTP Request: ${config.method?.toUpperCase()} ${config.url}`, {
          headers: config.headers,
          data: config.data
        });
        return config;
      },
      (error) => {
        this.logger.error('HTTP Request Error', { error });
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug(`HTTP Response: ${response.status} ${response.config.url}`, {
          status: response.status,
          data: response.data
        });
        return response;
      },
      (error: AxiosError) => {
        this.logger.error(`HTTP Error: ${error.response?.status} ${error.config?.url}`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }
}