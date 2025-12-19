import { Nullable } from '@/core/types/nullable.type';
import { ArticleContent } from '@/core/interfaces';
import { articlesRepository } from '@/core/providers/mysql';
import { logger } from '@/core/services/logger/logger.service';
import { AnalyzeAiService } from './services/analyze-ai';

/**
 * Module to analyze data
 */
export class AnalyzerModule {
  private analyzeAiService: AnalyzeAiService;

  constructor() {
    this.analyzeAiService = new AnalyzeAiService();
  }

  /**
   * Starts the analysis process
   * Fetches published articles from the last day and logs the results
   * Filters out articles with titles similar to previously published articles
   * @param articles - Optional array of articles to analyze. If not provided, fetches from database
   * @returns Promise with array of articles or null
   */
  async startAnalyze(articles: ArticleContent[]): Promise<Nullable<ArticleContent[]>> {
    const lastArticles = await this.getLastArticles();

    lastArticles?.forEach((article) => {
      logger.info(`Article from DB`, {
        article,
      });
    });

    if (!lastArticles || lastArticles.length === 0) {
      logger.info('No articles to filter or no previous articles to compare against');
      return articles || null;
    }

    const newTitles = articles.map((article) => article.title || '');
    const existingTitles = lastArticles.filter((title): title is string => title !== null);

    const similarityResults = await this.analyzeAiService.areTitlesSimilar(
      newTitles,
      existingTitles
    );

    if (!similarityResults) {
      return articles;
    }
    const filteredArticles = articles.filter((_, index) => !similarityResults[index]);
    return filteredArticles.length > 0 ? filteredArticles : null;
  }

  private async getLastArticles(): Promise<Nullable<(string | null)[]>> {
    return await articlesRepository.getLastDayPublishedArticles();
  }
}
