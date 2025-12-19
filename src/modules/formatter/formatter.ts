import { ArticleContent } from '@/core/interfaces';
import { FormatAiService } from '@/core/services/format-ai';
import { Nullable } from '@/core/types/nullable.type';
import { logger } from '@/core/services/logger/logger.service';
import { articlesRepository } from '@/core/providers/mysql/repositories/articles.repository';

export class FormatterModule {
  private formatAiService: FormatAiService;

  constructor() {
    this.formatAiService = new FormatAiService();
  }

  async formatData(articles: ArticleContent[]): Promise<Nullable<ArticleContent[]>> {
    try {
      logger.info('Starting article formatting');
      const formattedArticles = await this.formatAiService.formatArticles(articles);

      if (formattedArticles && formattedArticles.length > 0) {
        const saved = await articlesRepository.saveArticles(formattedArticles);
        if (saved) {
          logger.info('Successfully saved formatted articles to database');
        } else {
          logger.warn('Failed to save some or all articles to database');
        }
      }
      return formattedArticles;
    } catch (error) {
      logger.error('Error in formatData', { error });
      return articles;
    }
  }
}
