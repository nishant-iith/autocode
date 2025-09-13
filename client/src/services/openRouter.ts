export interface OpenRouterModel {
  id: string;
  name: string;
  created: number;
  description: string;
  architecture: {
    input_modalities: string[];
    output_modalities: string[];
    tokenizer: string;
    instruct_type: string;
  };
  top_provider: {
    is_moderated: boolean;
    context_length: number;
    max_completion_tokens: number;
  };
  pricing: {
    prompt: string;
    completion: string;
    image: string;
    request: string;
    web_search: string;
    internal_reasoning: string;
    input_cache_read: string;
    input_cache_write: string;
  };
  canonical_slug: string;
  context_length: number;
  hugging_face_id: string;
  per_request_limits: Record<string, unknown>;
  supported_parameters: string[];
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

export class OpenRouterService {
  private static readonly BASE_URL = 'https://openrouter.ai/api/v1';
  private static readonly STORAGE_KEY = 'openrouter_api_key';
  private static readonly MODELS_CACHE_KEY = 'openrouter_models_cache';
  private static readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  static getApiKey(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  static setApiKey(apiKey: string): void {
    localStorage.setItem(this.STORAGE_KEY, apiKey.trim());
  }

  static clearApiKey(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  static isValidApiKey(apiKey: string): boolean {
    return apiKey.trim().length > 0 && apiKey.startsWith('sk-');
  }

  static async getModels(): Promise<OpenRouterModel[]> {
    // Check cache first
    const cached = this.getCachedModels();
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.BASE_URL}/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data: OpenRouterModelsResponse = await response.json();
      
      // Cache the models
      this.cacheModels(data.data);
      
      return data.data;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  static getFreeModels(models: OpenRouterModel[]): OpenRouterModel[] {
    // First try to find models with actual free pricing
    const trulyFreeModels = models.filter(model => {
      const pricing = model.pricing;
      return pricing && (
        pricing.prompt === '0' && 
        pricing.completion === '0' && 
        (pricing.request === '0' || pricing.request === null)
      );
    });

    if (trulyFreeModels.length > 0) {
      return trulyFreeModels.slice(0, 10);
    }

    // Fallback to commonly known free models
    const commonFreeModels = [
      'openrouter/auto',
      'mistralai/mistral-7b-instruct',
      'huggingfaceh4/zephyr-7b-beta',
      'openchat/openchat-7b',
      'gryphe/mythomist-7b',
      'undi95/toppy-m-7b'
    ];
    
    const fallbackModels = models.filter(model => 
      commonFreeModels.some(freeId => model.id.toLowerCase().includes(freeId.toLowerCase()))
    );

    // If still no models found, return first few models (user might have credits)
    if (fallbackModels.length === 0) {
      return models.slice(0, 5);
    }

    return fallbackModels.slice(0, 10);
  }

  static async sendMessage(
    model: string,
    messages: ChatMessage[],
    options: {
      maxTokens?: number;
      temperature?: number;
      stream?: boolean;
      onChunk?: (chunk: string) => void;
    } = {}
  ): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API key not found. Please configure your OpenRouter API key.');
    }

    const requestBody: ChatCompletionRequest = {
      model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
      stream: options.stream || false,
    };

    try {
      const response = await fetch(`${this.BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AutoCode - Online Code Editor',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || 
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      // Handle streaming response
      if (options.stream && response.body) {
        return this.handleStreamingResponse(response, options.onChunk);
      }

      // Handle regular response
      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  private static async handleStreamingResponse(
    response: Response, 
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              return fullContent;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                fullContent += content;
                onChunk?.(content);
              }
            } catch (e) {
              // Skip invalid JSON lines
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }

  private static getCachedModels(): OpenRouterModel[] | null {
    try {
      const cached = localStorage.getItem(this.MODELS_CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();

      if (now - timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(this.MODELS_CACHE_KEY);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error reading cached models:', error);
      localStorage.removeItem(this.MODELS_CACHE_KEY);
      return null;
    }
  }

  private static cacheModels(models: OpenRouterModel[]): void {
    try {
      const cacheData = {
        data: models,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.MODELS_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching models:', error);
    }
  }
}