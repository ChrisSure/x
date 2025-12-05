import { ArticleContent } from '@/core/interfaces';
import { ScrapperReaderStrategy } from '@/modules/reader/strategies/scrapper-reader/scrapper-reader';
import { Source } from '@/modules/sources/interfaces/source.interface';
import { Nullable } from '@/core/types/nullable.type';

/**
 * Handler for processing scraped content
 * Orchestrates scraping and AI cleaning operations
 */
export class ScrapperHandler {
  private scrapperReaderStrategy: ScrapperReaderStrategy;

  constructor() {
    this.scrapperReaderStrategy = new ScrapperReaderStrategy();
  }

  /**
   * Handle scraping for a given source
   * @param resource - Source to scrape
   * @returns Cleaned article content or null
   */
  async handle(resource: Source): Promise<Nullable<ArticleContent[]>> {
    return await this.scrapperReaderStrategy.read(resource);
  }
}
