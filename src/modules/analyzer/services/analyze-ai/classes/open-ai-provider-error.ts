/**
 * Custom error class for OpenAI provider errors
 */
export class OpenAIProviderError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'OpenAIProviderError';
    Error.captureStackTrace(this, this.constructor);
  }
}
