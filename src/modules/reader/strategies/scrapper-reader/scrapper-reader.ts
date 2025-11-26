import { Source } from '@/modules/sources/interfaces/source.interface';
import { UaSourceKeys } from '@/modules/sources/data/source-keys.data';
import { createFootballUAScraper } from '@/modules/reader/strategies/scrapper-reader/scrappers/ukraine/football-ua/scrapper';
import { ArticleContent } from '@/core/interfaces';
import { Nullable } from '@/core/types/nullable.type';

export async function scrapperReader(source: Source): Promise<Nullable<ArticleContent[]>> {
  switch (source.key) {
    case UaSourceKeys.FootballUa:
      return await createFootballUAScraper(source);
  }

  return null;
}
