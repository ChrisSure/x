import { ArticleContent } from '@/core/interfaces';
import { AiBasicFormatService } from '@/modules/reader/services/ai-basic-format/ai-basic-format.service';
import { logger } from '@/core/services/logger/logger.service';
import { ScrapperReaderStrategy } from '@/modules/reader/strategies/scrapper-reader/scrapper-reader';
import { Source } from '@/modules/sources/interfaces/source.interface';
import { Nullable } from '@/core/types/nullable.type';

/**
 * Handler for processing scraped content
 * Orchestrates scraping and AI cleaning operations
 */
export class ScrapperHandler {
  private aiService: AiBasicFormatService;
  private readerStrategy: ScrapperReaderStrategy;

  constructor() {
    this.aiService = new AiBasicFormatService();
    this.readerStrategy = new ScrapperReaderStrategy();
  }

  /**
   * Handle scraping for a given source
   * @param resource - Source to scrape
   * @returns Cleaned article content or null
   */
  async handle(resource: Source): Promise<Nullable<ArticleContent>> {
    const data = await this.readerStrategy.read(resource);
    if (data) {
      return await this.collectScrapedData(data);
    }
    return null;
  }

  /**
   * Process scraped data and clean with AI
   * @param data - Array of scraped articles
   * @returns Cleaned article content or null
   */
  private async collectScrapedData(data: ArticleContent[]): Promise<Nullable<ArticleContent>> {
    for (const article of data) {
      if (!article) {
        continue;
      }

      try {
        const cleaned = await this.aiService.cleanContent(article.content || '');
        if (cleaned) {
          return {
            title: cleaned.title,
            link: article.link,
            dateString: article.dateString,
            content: cleaned.content,
          };
        }
        return null;
      } catch (error) {
        logger.error('Failed to clean article', {
          link: article.link,
          error: error instanceof Error ? error.message : error,
        });
      }
    }

    return null;
  }
}
