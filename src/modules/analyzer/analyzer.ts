import { Nullable } from '@/core/types/nullable.type';
import { ArticleContent } from '@/core/interfaces';
import { articlesRepository } from '@/core/providers/mysql';
import { logger } from '@/core/services/logger/logger.service';

/**
 * Module to analyze data
 */
export class AnalyzerModule {
  /**
   * Starts the analysis process
   * Fetches published articles from the last day and logs the results
   * @param articles - Optional array of articles to analyze. If not provided, fetches from database
   * @returns Promise with array of articles or null
   */
  async startAnalyze(articles?: Nullable<ArticleContent[]>): Promise<Nullable<ArticleContent[]>> {
    const lastArticles = await this.getLastArticles();

    // Log each article summary
    lastArticles?.forEach((article) => {
      logger.info(`Article`, {
        article,
      });
    });

    return articles || null;
  }

  private async getLastArticles(): Promise<Nullable<(string | null)[]>> {
    return await articlesRepository.getLastDayPublishedArticles();
  }
}
