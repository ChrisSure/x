import { ArticleContent } from '@/core/interfaces';
import { FormatAiService } from '@/core/services/format-ai';
import { Nullable } from '@/core/types/nullable.type';
import { logger } from '@/core/services/logger/logger.service';

export class FormatterModule {
  private formatAiService: FormatAiService;

  constructor() {
    this.formatAiService = new FormatAiService();
  }

  async formatData(articles: ArticleContent[]): Promise<Nullable<ArticleContent[]>> {
    try {
      return await this.formatAiService.formatArticles(articles);
    } catch (error) {
      logger.error('Error in formatData', { error });
      return articles;
    }
  }
}
