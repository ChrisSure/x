/**
 * OpenAI Provider Module
 * Provides singleton instance of OpenAI provider for application-wide use
 */

import { OpenAIProvider } from './openai.provider';

export { OpenAIProvider, OpenAIProviderError } from './openai.provider';
export type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionOptions,
  ChatMessage,
  ChatModel,
  ChatRole,
  CreateEmbeddingRequest,
  CreateEmbeddingResponse,
  CreateEmbeddingOptions,
  EmbeddingModel,
  GenerateImageRequest,
  GenerateImageResponse,
  GenerateImageOptions,
  ImageModel,
  ImageSize,
  ImageQuality,
  ImageStyle,
} from './core/interfaces';

/**
 * Singleton instance of OpenAI provider
 * Import this to use OpenAI services throughout the application
 *
 * @example
 * ```typescript
 * import { openAIProvider } from '@/core/providers/ai/openai';
 *
 * const response = await openAIProvider.chat({
 *   messages: [{ role: 'user', content: 'Hello!' }]
 * });
 * ```
 */
export const openAIProvider = new OpenAIProvider();
