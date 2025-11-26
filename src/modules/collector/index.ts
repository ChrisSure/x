import { Source } from '@/modules/sources/interfaces/source.interface';
import { SourceModule } from '@/modules/sources/source';
import { Reader } from '@/modules/sources/enums/reader.enum';
import { logger } from '@/core/services/logger/logger.service';
import { ScrapperHandler } from '@/modules/collector/handlers/scrapper.handler';
import { ArticleContent } from '@/core/interfaces';
import { Nullable } from '@/core/types/nullable.type';

/**
 * Main collector service that orchestrates content collection from various sources
 */
export class CollectorModule {
  private sourceModule: SourceModule;
  private scrapperHandler: ScrapperHandler;

  constructor() {
    this.sourceModule = new SourceModule();
    this.scrapperHandler = new ScrapperHandler();
  }

  /**
   * Start the collection process
   * Fetches sources and processes each one based on its reader type
   */
  async start(): Promise<void> {
    const resources: Source[] = this.sourceModule.getSources();

    for (const resource of resources) {
      const article = await this.processResource(resource);
      logger.info('Article', article);
    }
  }

  /**
   * Process a single resource based on its reader type
   * @param resource - Source to process
   * @returns Processed article content or null
   */
  private async processResource(resource: Source): Promise<Nullable<ArticleContent>> {
    switch (resource.reader) {
      case Reader.Scrapper:
        return await this.scrapperHandler.handle(resource);
      case Reader.Api:
        logger.info('Api Reader');
        break;
      case Reader.Mobile:
        logger.info('Mobile Reader');
        break;
    }
    return null;
  }
}
