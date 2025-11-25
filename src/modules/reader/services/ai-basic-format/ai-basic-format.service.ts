import { openAIProvider } from '@/providers/ai/openai';
import { logger } from '@/core/services/logger.service';
import { CONTENT_CLEANING_SYSTEM_PROMPT } from './core/ai-basic-format-service.constants';

/**
 * Cleaned article content result
 */
export interface CleanedArticleContent {
  title: string;
  content: string;
}

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
   * @returns Promise resolving to cleaned content with title and body
   * @throws {AIBasicFormatServiceError} If cleaning fails
   */
  async cleanContent(content: string): Promise<CleanedArticleContent> {
    if (!content || content.trim().length === 0) {
      logger.warn('Empty content provided to cleanContent');
      return { title: '', content: '' };
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
            content: `Here is the raw article content. Clean it and REWRITE IT DEEPLY while keeping the context:\n\n${content}`,
          },
        ],
        options: {
          model: 'gpt-4o-mini',
          temperature: 0.3,
          maxTokens: 4096,
        },
      });

      const aiResponse = response.choices[0]?.message?.content || '';

      if (!aiResponse || aiResponse.trim().length === 0) {
        logger.error('AI returned empty response');
        throw new AIBasicFormatServiceError('AI service returned empty content', response);
      }

      // Parse the JSON response
      let parsedContent: CleanedArticleContent;
      try {
        // Remove potential markdown code blocks if present
        const jsonString = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
        parsedContent = JSON.parse(jsonString) as CleanedArticleContent;

        if (!parsedContent.title || !parsedContent.content) {
          throw new Error('Missing title or content in parsed response');
        }
      } catch (parseError) {
        logger.error('Failed to parse AI response as JSON', {
          parseError,
          aiResponse,
        });
        throw new AIBasicFormatServiceError('Failed to parse AI response as JSON', parseError);
      }

      logger.info('Content cleaning completed', {
        titleLength: parsedContent.title.length,
        contentLength: parsedContent.content.length,
        tokensUsed: response.usage.totalTokens,
      });

      return {
        title: parsedContent.title.trim(),
        content: parsedContent.content.trim(),
      };
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
   * @returns Promise resolving to array of cleaned contents with titles and bodies
   * @throws {AIBasicFormatServiceError} If batch cleaning fails
   */
  async cleanContentBatch(contents: string[]): Promise<CleanedArticleContent[]> {
    logger.info('Starting batch content cleaning', {
      batchSize: contents.length,
    });

    const cleanedContents: CleanedArticleContent[] = [];

    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];

      if (!content) {
        logger.warn(`Skipping empty content at index ${i}`);
        cleanedContents.push({ title: '', content: '' });
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
        // Keep original content if cleaning fails (without title extraction)
        cleanedContents.push({ title: '', content });
      }
    }

    logger.info('Batch content cleaning completed', {
      totalArticles: contents.length,
      successfulCleans: cleanedContents.length,
    });

    return cleanedContents;
  }
}
