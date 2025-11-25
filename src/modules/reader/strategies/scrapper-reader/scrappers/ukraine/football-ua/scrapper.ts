import { Source } from '@/modules/sources/interfaces/source.interface';
import {
  EXCLUDE_LINKS,
  MAIN_NEWS_CLASS,
  THREE_HOURS_IN_MS,
} from '@/modules/reader/strategies/scrapper-reader/scrappers/ukraine/football-ua/core/constants';
import { PuppeteerScraper } from '@/modules/reader/strategies/scrapper-reader/providers/puppeteer-scraper';
import { Page } from 'puppeteer';
import { logger } from '@/core/services/logger.service';

export async function createFootballUAScraper(source: Source): Promise<void> {
  const scraper = new PuppeteerScraper(source.url);

  try {
    await scraper.initialize();
    const mainNews = await getMainNews(scraper);
    const links = extractLinksFromHTML(mainNews);
    const page = scraper.getPage();
    if (!page) {
      logger.error('Page not initialized');
    }

    for (const link of links) {
      if (shouldExcludeLink(link)) {
        continue;
      }

      const shouldContinue = await processArticleLink(page, link);
      if (!shouldContinue) {
        logger.info('Article is older than 3 hours. Stopping processing.');
        break;
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error scraping Football UA: ${error.message}`, error);
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

/**
 * Process a single article link
 * @param page - Puppeteer page instance
 * @param link - URL to process
 * @returns boolean - true if should continue processing more links, false if should stop
 */
async function processArticleLink(page: Page | null, link: string): Promise<boolean> {
  try {
    await page?.goto(link, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    const dateString = await page.$eval(
      '.date',
      (el) => (el as unknown as { innerText: string }).innerText
    );

    if (!isArticleRecentEnough(dateString)) {
      return false;
    }

    const content = await page.$eval(
      '.author-article',
      (el) => (el as unknown as { innerText: string }).innerText
    );

    //console.log(content);
    logger.debug('Article content:', content);

    // Wait a bit before navigating to next page (be respectful to the server)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return true; // Continue processing next articles
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error scraping Football UA: ${error.message}`, error);
    }
    return true; // Continue with next link even if one fails
  }
}

/**
 * Check if a link should be excluded from processing
 * @param link - The URL to check
 * @returns true if link should be excluded, false otherwise
 */
function shouldExcludeLink(link: string): boolean {
  return EXCLUDE_LINKS.some((excludeItem) => link.includes(excludeItem));
}

/**
 * Check if article date is within the acceptable time limit
 * @param dateString - Date string in format "23 ЛИСТОПАДА 2025, 19:58"
 * @returns true if article is recent enough (less than 3 hours old), false otherwise
 */
function isArticleRecentEnough(dateString: string): boolean {
  const timestamp = convertUkrainianDateToTimestamp(dateString);
  const currentTime = Date.now();
  const timeDiff = currentTime - timestamp;
  return timeDiff < THREE_HOURS_IN_MS;
}

/**
 * Ukrainian month names mapped to month numbers (0-indexed for JavaScript Date)
 */
const UKRAINIAN_MONTHS: Record<string, number> = {
  СІЧНЯ: 0, // January
  ЛЮТОГО: 1, // February
  БЕРЕЗНЯ: 2, // March
  КВІТНЯ: 3, // April
  ТРАВНЯ: 4, // May
  ЧЕРВНЯ: 5, // June
  ЛИПНЯ: 6, // July
  СЕРПНЯ: 7, // August
  ВЕРЕСНЯ: 8, // September
  ЖОВТНЯ: 9, // October
  ЛИСТОПАДА: 10, // November
  ГРУДНЯ: 11, // December
};

/**
 * Convert Ukrainian date string to Unix timestamp
 * @param dateString - Date string in format "23 ЛИСТОПАДА 2025, 19:58"
 * @returns Unix timestamp in milliseconds
 */
function convertUkrainianDateToTimestamp(dateString: string): number {
  // Parse format: "23 ЛИСТОПАДА 2025, 19:58"
  const parts = dateString.trim().split(',');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Invalid date format: ${dateString}`);
  }

  const datePart = parts[0].trim(); // "23 ЛИСТОПАДА 2025"
  const timePart = parts[1].trim(); // "19:58"

  // Split date part
  const dateElements = datePart.split(' ');
  if (dateElements.length !== 3 || !dateElements[0] || !dateElements[1] || !dateElements[2]) {
    throw new Error(`Invalid date part format: ${datePart}`);
  }

  const day = parseInt(dateElements[0], 10);
  const monthName = dateElements[1].toUpperCase();
  const year = parseInt(dateElements[2], 10);

  // Get month number
  const month = UKRAINIAN_MONTHS[monthName];
  if (month === undefined) {
    throw new Error(`Unknown Ukrainian month: ${monthName}`);
  }

  // Split time part
  const timeElements = timePart.split(':');
  if (timeElements.length !== 2 || !timeElements[0] || !timeElements[1]) {
    throw new Error(`Invalid time format: ${timePart}`);
  }

  const hours = parseInt(timeElements[0], 10);
  const minutes = parseInt(timeElements[1], 10);

  // Create Date object and return timestamp
  const date = new Date(year, month, day, hours, minutes, 0, 0);
  return date.getTime();
}

/**
 * Extract all links (href attributes) from HTML strings
 */
function extractLinksFromHTML(htmlContents: string[]): string[] {
  const links: string[] = [];
  const hrefRegex = /href=["']([^"']+)["']/g;

  for (const html of htmlContents) {
    let match;
    while ((match = hrefRegex.exec(html)) !== null) {
      const href = match[1];
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        links.push(href);
      }
    }
  }

  return links;
}
