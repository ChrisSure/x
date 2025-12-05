import OpenAI from 'openai';
import { logger } from '@/core/services/logger/logger.service';
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  CreateEmbeddingRequest,
  CreateEmbeddingResponse,
  GenerateImageRequest,
  GenerateImageResponse,
} from './interfaces';
import { OpenAIProviderError } from '@/modules/analyzer/services/analyze-ai/classes/open-ai-provider-error';

/**
 * OpenAI Provider Service
 * Provides access to OpenAI's chat completions, embeddings, and image generation APIs
 */
export class OpenAIProvider {
  private client: OpenAI;
  private isInitialized: boolean = false;

  constructor() {
    const apiKey = process.env['OPENAI_API_KEY'];

    if (!apiKey) {
      throw new OpenAIProviderError(
        'OPENAI_API_KEY is not defined in environment variables',
        'MISSING_API_KEY'
      );
    }

    this.client = new OpenAI({
      apiKey,
    });

    this.isInitialized = true;
    logger.info('OpenAI Provider initialized successfully');
  }

  /**
   * Validates that the provider is initialized
   * @throws {OpenAIProviderError} If provider is not initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new OpenAIProviderError('OpenAI Provider is not initialized', 'NOT_INITIALIZED');
    }
  }

  /**
   * Creates a chat completion using OpenAI's chat models
   * @param request - Chat completion request with messages and options
   * @returns Promise with chat completion response
   * @throws {OpenAIProviderError} If the request fails
   *
   * @example
   * ```typescript
   * const response = await openAIProvider.chat({
   *   messages: [
   *     { role: 'system', content: 'You are a helpful assistant.' },
   *     { role: 'user', content: 'Hello!' }
   *   ],
   *   options: {
   *     model: 'gpt-4',
   *     temperature: 0.7,
   *     maxTokens: 150
   *   }
   * });
   * ```
   */
  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    this.ensureInitialized();

    try {
      const { messages, options = {} } = request;

      // Validate input
      if (!messages || messages.length === 0) {
        throw new OpenAIProviderError('Messages array cannot be empty', 'INVALID_INPUT');
      }

      logger.info('Creating chat completion', {
        model: options.model || 'gpt-3.5-turbo',
        messageCount: messages.length,
      });

      const response = await this.client.chat.completions.create({
        model: options.model || 'gpt-3.5-turbo',
        messages: messages.map((msg) => {
          // Handle function role messages which require a name
          if (msg.role === 'function') {
            return {
              role: msg.role,
              content: msg.content,
              name: msg.name || 'function',
            };
          }
          // For other roles, include name only if provided
          const baseMessage: {
            role: 'system' | 'user' | 'assistant';
            content: string;
            name?: string;
          } = {
            role: msg.role,
            content: msg.content,
          };
          if (msg.name) {
            baseMessage.name = msg.name;
          }
          return baseMessage;
        }),
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        top_p: options.topP,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
        stop: options.stop,
        n: options.n,
      });

      logger.info('Chat completion successful', {
        id: response.id,
        model: response.model,
        tokensUsed: response.usage?.total_tokens,
      });

      return {
        id: response.id,
        object: response.object,
        created: response.created,
        model: response.model,
        choices: response.choices.map((choice) => ({
          index: choice.index,
          message: {
            role: choice.message.role as 'system' | 'user' | 'assistant' | 'function',
            content: choice.message.content || '',
          },
          finishReason: choice.finish_reason,
        })),
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      logger.error('Chat completion failed', { error });

      if (error instanceof OpenAIProviderError) {
        throw error;
      }

      if (error instanceof OpenAI.APIError) {
        throw new OpenAIProviderError(
          `OpenAI API error: ${error.message}`,
          error.code || 'API_ERROR',
          typeof error.status === 'number' ? error.status : undefined
        );
      }

      throw new OpenAIProviderError(
        `Unexpected error during chat completion: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Creates embeddings for the given text input
   * @param request - Embedding request with input text and options
   * @returns Promise with embedding response
   * @throws {OpenAIProviderError} If the request fails
   *
   * @example
   * ```typescript
   * const response = await openAIProvider.createEmbedding({
   *   input: 'The quick brown fox jumps over the lazy dog',
   *   options: {
   *     model: 'text-embedding-3-small'
   *   }
   * });
   * ```
   */
  async createEmbedding(request: CreateEmbeddingRequest): Promise<CreateEmbeddingResponse> {
    this.ensureInitialized();

    try {
      const { input, options = {} } = request;

      if (!input || (Array.isArray(input) && input.length === 0)) {
        throw new OpenAIProviderError('Input cannot be empty', 'INVALID_INPUT');
      }

      const response = await this.client.embeddings.create({
        model: options.model || 'text-embedding-3-small',
        input,
        encoding_format: options.encodingFormat,
        dimensions: options.dimensions,
      });

      return {
        object: 'list',
        data: response.data.map((item) => ({
          object: 'embedding',
          embedding: item.embedding,
          index: item.index,
        })),
        model: response.model,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          totalTokens: response.usage.total_tokens,
        },
      };
    } catch (error) {
      logger.error('Embedding creation failed', { error });

      if (error instanceof OpenAIProviderError) {
        throw error;
      }

      if (error instanceof OpenAI.APIError) {
        throw new OpenAIProviderError(
          `OpenAI API error: ${error.message}`,
          error.code || 'API_ERROR',
          typeof error.status === 'number' ? error.status : undefined
        );
      }

      throw new OpenAIProviderError(
        `Unexpected error during embedding creation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Generates images from text prompts using DALL-E
   * @param request - Image generation request with prompt and options
   * @returns Promise with image generation response
   * @throws {OpenAIProviderError} If the request fails
   *
   * @example
   * ```typescript
   * const response = await openAIProvider.generateImage({
   *   prompt: 'A cute cat wearing sunglasses',
   *   options: {
   *     model: 'dall-e-3',
   *     size: '1024x1024',
   *     quality: 'hd',
   *     n: 1
   *   }
   * });
   * ```
   */
  async generateImage(request: GenerateImageRequest): Promise<GenerateImageResponse> {
    this.ensureInitialized();

    try {
      const { prompt, options = {} } = request;

      // Validate input
      if (!prompt || prompt.trim().length === 0) {
        throw new OpenAIProviderError('Prompt cannot be empty', 'INVALID_INPUT');
      }

      logger.info('Generating image', {
        model: options.model || 'dall-e-2',
        size: options.size || '1024x1024',
        promptLength: prompt.length,
      });

      const response = await this.client.images.generate({
        model: options.model || 'dall-e-2',
        prompt,
        size: options.size || '1024x1024',
        quality: options.quality,
        style: options.style,
        n: options.n || 1,
        response_format: options.responseFormat || 'url',
      });

      logger.info('Image generated successfully', {
        imageCount: response.data?.length || 0,
        created: response.created,
      });

      return {
        created: response.created,
        data:
          response.data?.map((item) => ({
            url: item.url,
            b64Json: item.b64_json,
            revisedPrompt: item.revised_prompt,
          })) || [],
      };
    } catch (error) {
      logger.error('Image generation failed', { error });

      if (error instanceof OpenAIProviderError) {
        throw error;
      }

      if (error instanceof OpenAI.APIError) {
        throw new OpenAIProviderError(
          `OpenAI API error: ${error.message}`,
          error.code || 'API_ERROR',
          typeof error.status === 'number' ? error.status : undefined
        );
      }

      throw new OpenAIProviderError(
        `Unexpected error during image generation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Gets the underlying OpenAI client instance
   * Use with caution - prefer using the provider methods
   * @returns The OpenAI client instance
   */
  getClient(): OpenAI {
    this.ensureInitialized();
    return this.client;
  }
}
