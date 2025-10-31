import { OpenRouterService } from '../openRouter';

// Mock fetch
global.fetch = jest.fn();

// Mock SecureStorage
jest.mock('../utils/secureStorage', () => ({
  SecureStorage: {
    isSupported: jest.fn().mockReturnValue(true),
    setSecureItem: jest.fn().mockResolvedValue(undefined),
    getSecureItem: jest.fn().mockResolvedValue(null),
    removeSecureItem: jest.fn(),
    migrateToSecure: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('OpenRouterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('isValidApiKey', () => {
    it('should return true for valid API key', () => {
      expect(OpenRouterService.isValidApiKey('sk-test-key-123')).toBe(true);
    });

    it('should return false for invalid API key', () => {
      expect(OpenRouterService.isValidApiKey('invalid-key')).toBe(false);
      expect(OpenRouterService.isValidApiKey('')).toBe(false);
      expect(OpenRouterService.isValidApiKey('   ')).toBe(false);
    });
  });

  describe('API key management', () => {
    it('should set and get API key securely', async () => {
      const { SecureStorage } = await import('../utils/secureStorage');

      await OpenRouterService.setApiKey('sk-test-key-123');
      expect(SecureStorage.setSecureItem).toHaveBeenCalledWith(
        'openrouter_api_key',
        'sk-test-key-123'
      );

      await OpenRouterService.getApiKey();
      expect(SecureStorage.getSecureItem).toHaveBeenCalledWith(
        'openrouter_api_key'
      );
    });

    it('should clear API key', () => {
      OpenRouterService.clearApiKey();
      const { SecureStorage } = require('../utils/secureStorage');
      expect(SecureStorage.removeSecureItem).toHaveBeenCalledWith(
        'openrouter_api_key'
      );
    });
  });

  describe('getModels', () => {
    const mockModelsResponse = {
      data: [
        {
          id: 'openrouter/auto',
          name: 'OpenAI Auto Model',
          created: Date.now(),
          description: 'Auto-selecting model',
          architecture: {
            input_modalities: ['text'],
            output_modalities: ['text'],
            tokenizer: 'gpt2',
            instruct_type: 'none',
          },
          top_provider: {
            is_moderated: false,
            context_length: 4096,
            max_completion_tokens: 4096,
          },
          pricing: {
            prompt: '0',
            completion: '0',
            request: '0',
            web_search: '0',
            internal_reasoning: '0',
            input_cache_read: '0',
            input_cache_write: '0',
          },
          canonical_slug: 'openai-auto',
          context_length: 4096,
          hugging_face_id: 'openai/auto',
          per_request_limits: {},
          supported_parameters: ['temperature', 'max_tokens'],
        },
      ],
    };

    it('should fetch models successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockModelsResponse,
      });

      const models = await OpenRouterService.getModels();

      expect(fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/models',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(models).toEqual(mockModelsResponse.data);
    });

    it('should handle fetch errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(OpenRouterService.getModels()).rejects.toThrow(
        'Failed to fetch models: Not Found'
      );
    });

    it('should use cached models when available', async () => {
      const { SecureStorage } = require('../utils/secureStorage');
      SecureStorage.getSecureItem.mockResolvedValue(
        JSON.stringify({
          data: mockModelsResponse.data,
          timestamp: Date.now(),
        })
      );

      const models = await OpenRouterService.getModels();

      expect(fetch).not.toHaveBeenCalled();
      expect(models).toEqual(mockModelsResponse.data);
    });
  });

  describe('getFreeModels', () => {
    const mockModels = [
      {
        id: 'openrouter/auto',
        name: 'Auto Model',
        pricing: { prompt: '0', completion: '0', request: '0' },
      },
      {
        id: 'paid/model',
        name: 'Paid Model',
        pricing: { prompt: '0.001', completion: '0.002', request: '0' },
      },
    ] as any[];

    it('should filter free models correctly', () => {
      const freeModels = OpenRouterService.getFreeModels(mockModels);

      expect(freeModels).toHaveLength(1);
      expect(freeModels[0].id).toBe('openrouter/auto');
    });

    it('should return fallback models when no free models found', () => {
      const paidModels = [
        {
          id: 'paid/model1',
          name: 'Paid Model 1',
          pricing: { prompt: '0.001', completion: '0.002' },
        },
      ] as any[];

      const freeModels = OpenRouterService.getFreeModels(paidModels);

      expect(freeModels.length).toBeGreaterThan(0);
    });
  });

  describe('sendMessage', () => {
    const mockApiKey = 'sk-test-key-123';
    const mockMessages = [
      {
        id: '1',
        role: 'user' as const,
        content: 'Hello, world!',
        timestamp: new Date(),
      },
    ];

    beforeEach(() => {
      const { SecureStorage } = require('../utils/secureStorage');
      SecureStorage.getSecureItem.mockResolvedValue(mockApiKey);
    });

    it('should send message successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Hello! How can I help you?',
            },
          },
        ],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await OpenRouterService.sendMessage('openrouter/auto', mockMessages);

      expect(fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sk-test-key-123',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'AutoCode - Online Code Editor',
          },
          body: expect.stringContaining('Hello, world!'),
        }
      );
      expect(result).toBe('Hello! How can I help you?');
    });

    it('should throw error when no API key', async () => {
      const { SecureStorage } = require('../utils/secureStorage');
      SecureStorage.getSecureItem.mockResolvedValue(null);

      await expect(
        OpenRouterService.sendMessage('openrouter/auto', mockMessages)
      ).rejects.toThrow('API key not found');
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      });

      await expect(
        OpenRouterService.sendMessage('openrouter/auto', mockMessages)
      ).rejects.toThrow('Invalid API key');
    });
  });
});