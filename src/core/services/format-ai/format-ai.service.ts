import { logger } from '@/core/services/logger/logger.service';
import { openAIProvider } from '@/core/providers';
import { ArticleContent } from '@/core/interfaces';
import { Nullable } from '@/core/types/nullable.type';
import {
  FORMAT_MODEL,
  SYSTEM_PROMPT,
  TEMPERATURE,
  MAX_TOKENS,
} from './constants/format-ai.constants';
import { FormattedContentResponse } from './interfaces';

/**
 * AI-powered service to format and rewrite article content
 * Uses OpenAI to rewrite titles and content while preserving full context
 */
export class FormatAiService {
  /**
   * Formats an array of articles by rewriting their titles and content
   * Preserves link, created, and image fields
   * @param articles - Array of articles to format
   * @returns Promise resolving to array of formatted articles or null on error
   */
  async formatArticles(articles: ArticleContent[]): Promise<Nullable<ArticleContent[]>> {
    try {
      const formattedArticles: ArticleContent[] = [];

      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];

        if (!article) {
          continue;
        }

        logger.info(`Formatting article ${i + 1}/${articles.length}`, {
          originalTitle: article.title,
        });

        try {
          const formatted = await this.formatSingleArticle(article);

          if (formatted) {
            formattedArticles.push(formatted);
            logger.info(`Successfully formatted article ${i + 1}`, {
              newTitle: formatted.title,
              newContent: formatted.content,
            });
          } else {
            logger.info(`Article ${i + 1} was filtered out as irrelevant`, {
              originalTitle: article.title,
            });
          }
        } catch (error) {
          logger.error(`Error formatting article ${i + 1}`, { error });
          formattedArticles.push(article);
        }
      }
      return formattedArticles;
    } catch (error) {
      logger.error('Failed to format articles', { error });
      return articles;
    }
  }

  /**
   * Formats a single article by rewriting its title and content
   * @param article - Article to format
   * @returns Promise resolving to formatted article or null on error
   */
  private async formatSingleArticle(article: ArticleContent): Promise<Nullable<ArticleContent>> {
    try {
      const userPrompt = this.buildUserPrompt(article);

      const response = await openAIProvider.chat({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        options: {
          model: FORMAT_MODEL,
          temperature: TEMPERATURE,
          maxTokens: MAX_TOKENS,
        },
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        return null;
      }
      const formatted = this.parseAIResponse(content);
      if (!formatted) {
        return null;
      }

      // Filter out irrelevant articles (war, politics, non-football content)
      if (!formatted.isRelevant) {
        logger.info('Article filtered out as irrelevant', {
          title: article.title,
        });
        return null;
      }

      return {
        title: formatted.title,
        content: formatted.content,
        link: article.link,
        created: article.created,
        image: article.image,
      };
    } catch (error) {
      logger.error('Error in formatSingleArticle', { error });
      return null;
    }
  }

  /**
   * Builds the user prompt for the AI with original article content
   * @param article - Article to format
   * @returns Formatted prompt string
   */
  private buildUserPrompt(article: ArticleContent): string {
    return `Please rewrite the following article title and content. Preserve all context and meaning.

Original Title: ${article.title}

Original Content:
${article.content}

Respond with JSON containing the rewritten title and content.`;
  }

  /**
   * Parses the AI response JSON string into structured format
   * @param responseContent - Raw response from AI
   * @returns Parsed formatted content or null on error
   */
  private parseAIResponse(responseContent: string): Nullable<FormattedContentResponse> {
    try {
      let jsonContent = responseContent.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\s*\n/, '').replace(/\n```\s*$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\s*\n/, '').replace(/\n```\s*$/, '');
      }
      const parsed = JSON.parse(jsonContent) as FormattedContentResponse;
      if (!parsed.title || !parsed.content || typeof parsed.isRelevant !== 'boolean') {
        return null;
      }
      return parsed;
    } catch (error) {
      logger.error('Failed to parse AI response', { error, responseContent });
      return null;
    }
  }
}
