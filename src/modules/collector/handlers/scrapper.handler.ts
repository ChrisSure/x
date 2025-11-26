import { ArticleContent } from '@/core/interfaces';
import { AiBasicFormatService } from '@/modules/reader/services/ai-basic-format/ai-basic-format.service';
import { logger } from '@/core/services/logger/logger.service';
import { scrapperReader } from '@/modules/reader/strategies/scrapper-reader/scrapper-reader';
import { Source } from '@/modules/sources/interfaces/source.interface';
import { Nullable } from '@/core/types/nullable.type';

export async function scrapperHandler(resource: Source): Promise<Nullable<ArticleContent>> {
  const data = await scrapperReader(resource);
  if (data) {
    return await collectScrappedData(data);
  }
  return null;
}

export async function collectScrappedData(
  data: ArticleContent[]
): Promise<Nullable<ArticleContent>> {
  const aiService = new AiBasicFormatService();
  for (const article of data) {
    if (!article) {
      continue;
    }

    try {
      const cleaned = await aiService.cleanContent(article.content || '');
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
      logger.error(`Failed to clean article`, {
        link: article.link,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  return null;
}
