import { openAIProvider } from '@/providers/ai/openai';
import { logger } from '@/core/services/logger.service';
import { CONTENT_CLEANING_SYSTEM_PROMPT } from './core/ai-basic-format-service.constants';

/**
 * Custom error class for AI Basic Format Service errors
 */
export class AIBasicFormatServiceError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'AIBasicFormatServiceError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * AI-powered service to clean article content by removing metadata and extraneous information
 * while preserving the main article text and context
 */
export class AiBasicFormatService {
  constructor() {
    logger.info('AiBasicFormatService initialized');
  }

  /**
   * Cleans article content by removing metadata and extraneous information
   * @param content - Raw article content to clean
   * @returns Promise resolving to cleaned content
   * @throws {AIBasicFormatServiceError} If cleaning fails
   */
  async cleanContent(content: string): Promise<string> {
    if (!content || content.trim().length === 0) {
      logger.warn('Empty content provided to cleanContent');
      return content;
    }

    try {
      const response = await openAIProvider.chat({
        messages: [
          {
            role: 'system',
            content: CONTENT_CLEANING_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: `Clean this article content:\n\n${content}`,
          },
        ],
        options: {
          model: 'gpt-4',
          temperature: 0.3,
          maxTokens: 2000,
        },
      });

      const cleanedContent = response.choices[0]?.message?.content || '';

      if (!cleanedContent || cleanedContent.trim().length === 0) {
        logger.error('AI returned empty cleaned content');
        throw new AIBasicFormatServiceError('AI service returned empty content', response);
      }
      return cleanedContent.trim();
    } catch (error) {
      logger.error('Failed to clean content', { error });

      if (error instanceof AIBasicFormatServiceError) {
        throw error;
      }

      throw new AIBasicFormatServiceError('Failed to clean article content', error);
    }
  }

  /**
   * Cleans multiple article contents in batch
   * @param contents - Array of raw article contents to clean
   * @returns Promise resolving to array of cleaned contents
   * @throws {AIBasicFormatServiceError} If batch cleaning fails
   */
  async cleanContentBatch(contents: string[]): Promise<string[]> {
    logger.info('Starting batch content cleaning', {
      batchSize: contents.length,
    });

    const cleanedContents: string[] = [];

    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];

      if (!content) {
        logger.warn(`Skipping empty content at index ${i}`);
        cleanedContents.push('');
        continue;
      }

      try {
        const cleaned = await this.cleanContent(content);
        cleanedContents.push(cleaned);
        logger.info(`Cleaned article ${i + 1}/${contents.length}`);
      } catch (error) {
        logger.error(`Failed to clean article ${i + 1}/${contents.length}`, {
          error,
        });
        // Keep original content if cleaning fails
        cleanedContents.push(content);
      }
    }

    logger.info('Batch content cleaning completed', {
      totalArticles: contents.length,
      successfulCleans: cleanedContents.length,
    });

    return cleanedContents;
  }
}
