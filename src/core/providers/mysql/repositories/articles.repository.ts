import { mySQLProvider } from '@/core/providers/mysql';
import { Nullable } from '@/core/types/nullable.type';
import { logger } from '@/core/services/logger/logger.service';
import { DatabaseArticle } from '@/core/providers/mysql';
import { ArticleContent } from '@/core/interfaces';
import {
  GET_LAST_DAY_PUBLISHED_ARTICLES_QUERY,
  INSERT_ARTICLE_QUERY,
  UPDATE_ARTICLE_IMAGE_QUERY,
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
   * @returns Promise resolving to array of articles with IDs or null if all failed
   */
  async saveArticles(articles: ArticleContent[]): Promise<Nullable<ArticleContent[]>> {
    if (!articles || articles.length === 0) {
      logger.warn('No articles to save');
      return null;
    }

    try {
      logger.info(`Saving ${articles.length} articles to database`);

      const savedArticles: ArticleContent[] = [];

      for (const article of articles) {
        try {
          const createdDate = this.timestampToMySQLDateTime(article.created);

          const result = await mySQLProvider.execute(INSERT_ARTICLE_QUERY, [
            article.link,
            article.content,
            createdDate,
            article.title,
            article.image || null,
            'Published',
          ]);

          // Add the database ID to the article
          const articleWithId: ArticleContent = {
            ...article,
            id: result.data.insertId,
          };

          savedArticles.push(articleWithId);
          logger.info('Successfully saved article', {
            id: result.data.insertId,
            title: article.title,
          });
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

      logger.info(`Successfully saved ${savedArticles.length}/${articles.length} articles`);
      return savedArticles.length > 0 ? savedArticles : null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to save articles to database', {
        error: errorMessage,
      });
      return null;
    }
  }

  /**
   * Updates an article's image URL
   * @param articleId - ID of the article to update
   * @param imageUrl - New image URL
   * @returns Promise resolving to true if successful, false otherwise
   */
  async updateArticleImage(articleId: number, imageUrl: string): Promise<boolean> {
    try {
      const result = await mySQLProvider.execute(UPDATE_ARTICLE_IMAGE_QUERY, [imageUrl, articleId]);

      if (result.data.affectedRows > 0) {
        logger.info('Successfully updated article image', {
          articleId,
          imageUrl,
        });
        return true;
      }

      logger.warn('No article found with given ID', { articleId });
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to update article image', {
        error: errorMessage,
        articleId,
        imageUrl,
      });
      return false;
    }
  }

  /**
   * Fetches articles by their IDs
   * @param articleIds - Array of article IDs to fetch
   * @returns Promise with array of articles or null if error occurs
   */
  async getArticlesByIds(articleIds: number[]): Promise<Nullable<ArticleContent[]>> {
    if (!articleIds || articleIds.length === 0) {
      logger.warn('No article IDs provided');
      return null;
    }

    try {
      // Build dynamic placeholders for IN clause: (?, ?, ?)
      const placeholders = articleIds.map(() => '?').join(', ');
      const query = `SELECT id, link, content, created, title, image, status
         FROM articles
         WHERE id IN (${placeholders})
         ORDER BY created DESC`;

      logger.info('Fetching articles by IDs', {
        articleIds,
        query: query.substring(0, 100),
      });

      const result = await mySQLProvider.query<DatabaseArticle[]>(query, articleIds);

      if (!result.data || result.data.length === 0) {
        logger.warn('No articles found for given IDs', { articleIds });
        return null;
      }

      logger.info('Found articles in database', {
        count: result.data.length,
        ids: result.data.map((a) => a.id),
      });

      // Convert DatabaseArticle to ArticleContent
      const articles: ArticleContent[] = result.data.map((dbArticle) => ({
        id: dbArticle.id,
        title: dbArticle.title || '',
        link: dbArticle.link,
        content: dbArticle.content,
        created: new Date(dbArticle.created).getTime(),
        image: dbArticle.image || undefined,
      }));

      return articles;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to fetch articles by IDs', {
        error: errorMessage,
        articleIds,
      });
      return null;
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
