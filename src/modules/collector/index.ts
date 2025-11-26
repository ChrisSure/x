import { Source } from '@/modules/sources/interfaces/source.interface';
import { getSources } from '@/modules/sources/source';
import { Reader } from '@/modules/sources/enums/reader.enum';
import { logger } from '@/core/services/logger/logger.service';
import { scrapperHandler } from '@/modules/collector/handlers/scrapper.handler';
import { ArticleContent } from '@/core/interfaces';
import { Nullable } from '@/core/types/nullable.type';

export async function start(): Promise<void> {
  const resources: Source[] = getSources();

  for (const resource of resources) {
    const article = await resourceSwitcher(resource);
    logger.info('Article', article);
  }
}

async function resourceSwitcher(resource: Source): Promise<Nullable<ArticleContent>> {
  switch (resource.reader) {
    case Reader.Scrapper:
      return await scrapperHandler(resource);
    case Reader.Api:
      logger.info('Api Reader');
      break;
    case Reader.Mobile:
      logger.info('Mobile Reader');
      break;
  }
  return null;
}
