import { mySQLProvider } from '@/core/providers/mysql';
import { Nullable } from '@/core/types/nullable.type';
import { logger } from '@/core/services/logger/logger.service';
import { DatabaseArticle } from '@/core/providers/mysql';
import { ArticleContent } from '@/core/interfaces';
import {
  GET_LAST_DAY_PUBLISHED_ARTICLES_QUERY,
  INSERT_ARTICLE_QUERY,
} from '../constants/sql-queries.constants';

/**
 * Repository for articles database operations
 * Handles all database queries related to articles table
 */
export class ArticlesRepository {
  /**
   * Fetches published articles from the last day from the database
   * @returns Promise with array of articles or null if error occurs
   */
  async getLastDayPublishedArticles(): Promise<Nullable<(string | null)[]>> {
    try {
      const formattedDate = this.getOneDayAgoFormatted();

      // Query to get articles from last day with status === 'Published'
      const result = await mySQLProvider.query<DatabaseArticle[]>(
        GET_LAST_DAY_PUBLISHED_ARTICLES_QUERY,
        ['Published', formattedDate]
      );

      if (!result.data || result.data.length === 0) {
        return null;
      }

      return result.data.map((dbArticle) => dbArticle.title);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to fetch published articles from database', {
        error: errorMessage,
      });
      return null;
    }
  }

  /**
   * Saves multiple articles to the database
   * @param articles - Array of articles to save
   * @returns Promise resolving to true if successful, false otherwise
   */
  async saveArticles(articles: ArticleContent[]): Promise<boolean> {
    if (!articles || articles.length === 0) {
      logger.warn('No articles to save');
      return false;
    }

    try {
      logger.info(`Saving ${articles.length} articles to database`);

      let successCount = 0;

      for (const article of articles) {
        try {
          const createdDate = this.timestampToMySQLDateTime(article.created);

          await mySQLProvider.execute(INSERT_ARTICLE_QUERY, [
            article.link,
            article.content,
            createdDate,
            article.title,
            article.image || null,
            'Published',
          ]);

          successCount++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Failed to save individual article', {
            error: errorMessage,
            link: article.link,
            timestampValue: article.created,
          });
          // Continue with other articles even if one fails
        }
      }

      logger.info(`Successfully saved ${successCount}/${articles.length} articles`);
      return successCount > 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to save articles to database', {
        error: errorMessage,
      });
      return false;
    }
  }

  /**
   * Converts timestamp to MySQL datetime format
   * @param timestamp - Timestamp in milliseconds (from Date.getTime())
   * @returns Formatted date string in MySQL datetime format (YYYY-MM-DD HH:MM:SS)
   */
  private timestampToMySQLDateTime(timestamp: number): string {
    // Timestamp is already in milliseconds from Date.getTime()
    const date = new Date(timestamp);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  /**
   * Calculates and formats the date from 24 hours ago
   * @returns Formatted date string in MySQL datetime format (YYYY-MM-DD HH:MM:SS)
   */
  private getOneDayAgoFormatted(): string {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return oneDayAgo.toISOString().slice(0, 19).replace('T', ' ');
  }
}

/**
 * Singleton instance of ArticlesRepository
 * Import this to use articles repository throughout the application
 *
 * @example
 * ```typescript
 * import { articlesRepository } from '@/core/providers/mysql/repositories/articles.repository';
 *
 * const articles = await articlesRepository.getLastDayPublishedArticles();
 * ```
 */
export const articlesRepository = new ArticlesRepository();
