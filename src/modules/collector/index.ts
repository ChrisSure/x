import { Source } from '@/modules/sources/interfaces/source.interface';
import { getSources } from '@/modules/sources/source';
import { Reader } from '@/modules/sources/enums/reader.enum';
import { scrapperReader } from '@/modules/reader/strategies/scrapper-reader/scrapper-reader';
import { logger } from '@/core/services/logger.service';
import { ArticleContent } from '@/core/interfaces';
import { AiBasicFormatService } from '@/modules/reader/services/ai-basic-format/ai-basic-format.service';

export async function start(): Promise<void> {
  const resources: Source[] = getSources();

  for (const resource of resources) {
    switch (resource.reader) {
      case Reader.Scrapper:
        const data = await scrapperReader(resource);
        await collectScrappedData(data);
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

export async function collectScrappedData(data: ArticleContent[]): Promise<void> {
  const aiService = new AiBasicFormatService();
  for (let i = 0; i < data.length; i++) {
    const article = data[i];
    if (!article) {
      continue;
    }

    try {
      const cleaned = await aiService.cleanContent(article.content || '');
      article.title = cleaned.title;
      article.content = cleaned.content;

      logger.info(`Successfully cleaned article ${i + 1}/${data.length}`, {
        title: article.title,
        link: article.link,
        content: article.content,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to clean article ${i + 1}/${data.length}`, {
        link: article.link,
        error: errorMessage,
      });
    }
  }
}
