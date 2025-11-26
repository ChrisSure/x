import { Source } from '@/modules/sources/interfaces/source.interface';
import { UaSourceKeys } from '@/modules/sources/data/source-keys.data';
import { FootballUAScraper } from '@/modules/reader/strategies/scrapper-reader/scrappers/ukraine/football-ua/scrapper';
import { ArticleContent } from '@/core/interfaces';
import { Nullable } from '@/core/types/nullable.type';

/**
 * Service for reading content from various scrapers
 * Uses strategy pattern to handle different scraper implementations
 */
export class ScrapperReaderStrategy {
  /**
   * Read content from the appropriate scraper based on source
   * @param source - Source configuration
   * @returns Array of ArticleContent or null if no scraper found
   */
  async read(source: Source): Promise<Nullable<ArticleContent[]>> {
    switch (source.key) {
      case UaSourceKeys.FootballUa:
        return await this.readFootballUA(source);
      default:
        return null;
    }
  }

  /**
   * Read content from Football UA scraper
   * @param source - Source configuration
   * @returns Array of ArticleContent
   */
  private async readFootballUA(source: Source): Promise<ArticleContent[]> {
    const scraper = new FootballUAScraper(source);
    return await scraper.scrape();
  }
}
