import { mySQLProvider } from '@/core/providers/mysql';
import { Nullable } from '@/core/types/nullable.type';
import { logger } from '@/core/services/logger/logger.service';
import { DatabaseArticle } from '../interfaces/database-article.interface';
import { GET_LAST_DAY_PUBLISHED_ARTICLES_QUERY } from '../constants/sql-queries.constants';

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

      logger.info('Result', {
        result,
      });

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
