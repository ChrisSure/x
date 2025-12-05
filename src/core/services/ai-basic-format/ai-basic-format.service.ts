import { logger } from '@/core/services/logger/logger.service';
import { openAIProvider } from '@/core/providers';
import { Nullable } from '@/core/types/nullable.type';
import { AiModelEnum } from '@/core/enums/ai-model.enum';
import { CleanedArticleContent } from '@/core/services/ai-basic-format/interfaces/cleaned-article-context.interface';
import {
  BASIC_PROMPT,
  CONTENT_CLEANING_SYSTEM_PROMPT,
  MAX_TOKENS_VALUE,
  TEMPERATURA_VALUE,
} from '@/core/services/ai-basic-format/constants/ai-basic-format-service.constants';

/**
 * AI-powered service to clean article content by removing metadata and extraneous information
 * while preserving the main article text and context
 */
export class AiBasicFormatService {
  /**
   * Cleans article content by removing metadata and extraneous information
   * @param content - Raw article content to clean
   * @returns Promise resolving to cleaned content with title and body
   * @throws Error
   */
  async cleanContent(content: string): Promise<Nullable<CleanedArticleContent>> {
    if (!content || content.trim().length === 0) {
      return null;
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
            content: `${BASIC_PROMPT}${content}`,
          },
        ],
        options: {
          model: AiModelEnum.Mini4,
          temperature: TEMPERATURA_VALUE,
          maxTokens: MAX_TOKENS_VALUE,
        },
      });

      const aiResponse = response.choices[0]?.message?.content || '';

      if (!aiResponse.trim()) {
        throw new Error('AI service returned empty content');
      }

      return this.parseCleanedContent(aiResponse);
    } catch (error) {
      logger.error('Failed to clean content', { error });
      return null;
    }
  }

  private parseCleanedContent(aiResponse: string): CleanedArticleContent {
    // Remove markdown code fences
    const jsonString = aiResponse.replace(/```json\n?|\n?```/g, '').trim();

    let parsed: CleanedArticleContent;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      parsed = JSON.parse(jsonString);

      if (!parsed.title || !parsed.content) {
        throw new Error('Missing required fields');
      }

      return {
        title: parsed.title.trim(),
        content: parsed.content.trim(),
      };
    } catch {
      throw new Error('Failed to parse AI response as JSON');
    }
  }
}
