/**
 * Chat completion interfaces for OpenAI API
 */

/**
 * Role of the message sender
 */
export type ChatRole = 'system' | 'user' | 'assistant' | 'function';

/**
 * Individual message in a chat conversation
 */
export interface ChatMessage {
  role: ChatRole;
  content: string;
  name?: string;
}

/**
 * Available OpenAI chat models
 */
export type ChatModel =
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-4-turbo-preview'
  | 'gpt-3.5-turbo'
  | 'gpt-4o-mini'
  | 'gpt-3.5-turbo-16k';

/**
 * Options for chat completion requests
 */
export interface ChatCompletionOptions {
  model?: ChatModel;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string | string[];
  n?: number;
}

/**
 * Request for chat completion
 */
export interface ChatCompletionRequest {
  messages: ChatMessage[];
  options?: ChatCompletionOptions;
}

/**
 * Usage statistics for a chat completion
 */
export interface ChatCompletionUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Single choice in chat completion response
 */
export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finishReason: string | null;
}

/**
 * Response from chat completion
 */
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: ChatCompletionUsage;
}
