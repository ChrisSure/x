import { Source } from '@/modules/sources/interfaces/source.interface';
import { getSources } from '@/modules/sources/source';
import { Reader } from '@/modules/sources/enums/reader.enum';
import { scrapperReader } from '@/modules/reader/strategies/scrapper-reader/scrapper-reader';
import { logger } from '@/core/services/logger.service';

export async function start(): Promise<void> {
  const resources: Source[] = getSources();

  for (const resource of resources) {
    switch (resource.reader) {
      case Reader.Scrapper:
        await scrapperReader(resource);
        break;
      case Reader.Api:
        logger.info('Api Reader');
        break;
      case Reader.Mobile:
        logger.info('Mobile Reader');
        break;
    }
  }
}
