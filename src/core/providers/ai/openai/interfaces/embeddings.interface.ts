/**
 * Embeddings interfaces for OpenAI API
 */

/**
 * Available OpenAI embedding models
 */
export type EmbeddingModel =
  | 'text-embedding-3-small'
  | 'text-embedding-3-large'
  | 'text-embedding-ada-002';

/**
 * Options for creating embeddings
 */
export interface CreateEmbeddingOptions {
  model?: EmbeddingModel;
  encodingFormat?: 'float' | 'base64';
  dimensions?: number;
}

/**
 * Request for creating embeddings
 */
export interface CreateEmbeddingRequest {
  input: string | string[];
  options?: CreateEmbeddingOptions;
}

/**
 * Single embedding object
 */
export interface EmbeddingObject {
  object: 'embedding';
  embedding: number[];
  index: number;
}

/**
 * Usage statistics for embeddings
 */
export interface EmbeddingUsage {
  promptTokens: number;
  totalTokens: number;
}

/**
 * Response from creating embeddings
 */
export interface CreateEmbeddingResponse {
  object: 'list';
  data: EmbeddingObject[];
  model: string;
  usage: EmbeddingUsage;
}
