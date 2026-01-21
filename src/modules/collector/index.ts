import cron from 'node-cron';
import { Source } from '@/modules/sources/interfaces/source.interface';
import { SourceModule } from '@/modules/sources/source';
import { Reader } from '@/modules/sources/enums/reader.enum';
import { logger } from '@/core/services/logger/logger.service';
import { ScrapperHandler } from '@/modules/collector/handlers/scrapper.handler';
import { ArticleContent } from '@/core/interfaces';
import { Nullable } from '@/core/types/nullable.type';
import { Status } from '@/modules/sources/enums/status.enum';
import { AnalyzerModule } from '@/modules/analyzer/analyzer';
import { FormatterModule } from '@/modules/formatter/formatter';
import { articlesRepository } from '@/core/providers/mysql/repositories/articles.repository';
import { ImageUpdateResponse } from '@/modules/collector/interfaces/image-update-response.interface';
import { telegramProvider } from '@/core/providers';

/**
 * Main collector service that orchestrates content collection from various sources
 */
export class CollectorModule {
  private sourceModule: SourceModule;
  private analyzerModule: AnalyzerModule;
  private scrapperHandler: ScrapperHandler;
  private formatterModule: FormatterModule;

  constructor() {
    this.sourceModule = new SourceModule();
    this.analyzerModule = new AnalyzerModule();
    this.scrapperHandler = new ScrapperHandler();
    this.formatterModule = new FormatterModule();
  }

  /**
   * Start the collection process
   * Fetches sources and processes each one based on its reader type
   */
  start(): void {
    const resources: Source[] = this.sourceModule.getSources();

    for (const resource of resources) {
      if (resource.status !== Status.Active) {
        continue;
      }

      //const cronExpression = `0 0 *!/${resource.period} * * *`;
      const cronExpression = '0 */2 * * * *';
      cron.schedule(cronExpression, async () => {
        const articles = await this.processResource(resource);
        if (!articles) {
          return;
        }

        const analyzedArticles = await this.analyzerModule.startAnalyze(articles);
        if (!analyzedArticles) {
          return;
        }
        logger.info('Analyzed Articles', analyzedArticles);

        const formattedData = await this.formatterModule.formatData(analyzedArticles);
        if (!formattedData) {
          return;
        }
        logger.info('Formatted Articles', formattedData);

        const updatedArticles = await this.updateArticleImages(formattedData);
        if (updatedArticles) {
          logger.info('Updated Articles with new images', updatedArticles);
          try {
            const telegramResult = await telegramProvider.sendArticles(updatedArticles);
            logger.info('Telegram send summary', telegramResult);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Failed to send articles to Telegram', { error: errorMessage });
          }
        }
      });
    }
  }

  /**
   * Process a single resource based on its reader type
   * @param resource - Source to process
   * @returns Processed article content or null
   */
  private async processResource(resource: Source): Promise<Nullable<ArticleContent[]>> {
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

  /**
   * Updates article images by calling external image processing API
   * @param articles - Array of articles with IDs and images
   * @returns Promise with updated articles from database or null
   */
  private async updateArticleImages(
    articles: ArticleContent[]
  ): Promise<Nullable<ArticleContent[]>> {
    try {
      // Filter articles that have both id and image
      const articlesWithImages = articles.filter((article) => article.id && article.image);

      if (articlesWithImages.length === 0) {
        logger.info('No articles with images to update');
        return articles;
      }

      // Prepare data for API - only id and image
      const imageUpdateData = articlesWithImages.map((article) => ({
        id: article.id,
        image: article.image,
      }));

      logger.info('Sending articles to image update API', {
        count: imageUpdateData.length,
      });

      // Call the image update API
      const response = await fetch('https://image.footballstar.space/api/update-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(imageUpdateData),
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const result = (await response.json()) as ImageUpdateResponse;

      logger.info('Image update API response', {
        success: result.success,
        summary: result.summary,
      });

      // Track successfully updated article IDs
      const updatedArticleIds: number[] = [];

      // Process the results and update articles in database
      if (result.results && Array.isArray(result.results)) {
        for (const item of result.results) {
          if (item.success && item.data && item.data.newImage) {
            const updated = await articlesRepository.updateArticleImage(
              item.data.articleId,
              item.data.newImage
            );

            if (updated) {
              updatedArticleIds.push(item.data.articleId);
              logger.info('Updated article image in database', {
                articleId: item.data.articleId,
                oldImage: item.data.oldImage,
                newImage: item.data.newImage,
              });
            }
          } else if (!item.success) {
            logger.error('Failed to update image for article', {
              articleId: item.id,
              error: item.error,
            });
          }
        }
      }

      logger.info('Ids', updatedArticleIds);
      // Fetch and return updated articles from database
      if (updatedArticleIds.length > 0) {
        const updatedArticles = await articlesRepository.getArticlesByIds(updatedArticleIds);
        if (updatedArticles) {
          logger.info('Fetched updated articles from database', {
            count: updatedArticles.length,
          });
          return updatedArticles;
        }
      }

      // Return original articles if no updates were made
      return articles;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to update article images', { error: errorMessage });
      return null;
    }
  }
}
