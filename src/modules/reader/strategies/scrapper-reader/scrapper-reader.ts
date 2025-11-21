import { Source } from '@/modules/sources/interfaces/source.interface';
import { SourceKeys } from '@/modules/sources/data/source-keys.data';
import { createFootballUAScraper } from '@/modules/reader/strategies/scrapper-reader/scrappers/football-ua/scrapper';

export async function scrapperReader(source: Source): Promise<void> {
  switch (source.key) {
    case SourceKeys.FootballUa:
      await createFootballUAScraper(source);
      break;
  }
}
