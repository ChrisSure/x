import { Source } from '@/modules/sources/interfaces/source.interface';
import { MAIN_NEWS_CLASS } from '@/modules/reader/strategies/scrapper-reader/scrappers/football-ua/core/constants';
import { PuppeteerScraper } from '@/modules/reader/strategies/scrapper-reader/providers/puppeteer-scraper';

export async function createFootballUAScraper(source: Source): Promise<void> {
  const scraper = new PuppeteerScraper(source.url);

  try {
    await scraper.initialize();
    const mainNews = await getMainNews(scraper);
    // eslint-disable-next-line no-console
    console.log(mainNews, 'Main Content');
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error scraping Football UA: ${error.message}`);
    }
    throw error;
  } finally {
    await scraper.close();
  }
}

async function getMainNews(scraper: PuppeteerScraper): Promise<string[]> {
  await scraper.waitForClass(MAIN_NEWS_CLASS);
  return await scraper.getElementsByClass(MAIN_NEWS_CLASS);
}
