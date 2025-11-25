import { Source } from '@/modules/sources/interfaces/source.interface';
import { UaSourceKeys } from '@/modules/sources/data/source-keys.data';
import { createFootballUAScraper } from '@/modules/reader/strategies/scrapper-reader/scrappers/ukraine/football-ua/scrapper';
import { ArticleContent } from '@/core/interfaces';

export async function scrapperReader(source: Source): Promise<ArticleContent[]> {
  switch (source.key) {
    case UaSourceKeys.FootballUa:
      return await createFootballUAScraper(source);
  }

  // TODO Remove it later
  return await createFootballUAScraper(source);
}
