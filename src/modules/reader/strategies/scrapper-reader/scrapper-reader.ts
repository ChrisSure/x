import { Source } from '@/modules/sources/interfaces/source.interface';
import { UaSourceKeys } from '@/modules/sources/data/source-keys.data';
import { createFootballUAScraper } from '@/modules/reader/strategies/scrapper-reader/scrappers/ukraine/football-ua/scrapper';

export async function scrapperReader(source: Source): Promise<void> {
  switch (source.key) {
    case UaSourceKeys.FootballUa:
      await createFootballUAScraper(source);
      break;
  }
}
