/**
 * Core Providers Module
 * Exports all application providers
 */

// OpenAI Provider
export { openAIProvider, OpenAIProvider, OpenAIProviderError } from './ai/openai';
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
} from './ai/openai';

// MySQL Provider
export { mySQLProvider, MySQLProvider, MySQLProviderError } from './mysql';
export type {
  MySQLConfig,
  QueryResult,
  PoolStats,
  QueryParams,
  MySQLQueryResult,
  Pool,
  PoolConnection,
  RowDataPacket,
  OkPacket,
  ResultSetHeader,
} from './mysql';
