import { Source } from '@/modules/sources/interfaces/source.interface';
import {
  EXCLUDE_LINKS,
  MAIN_NEWS_CLASS,
  PAGE_LOAD_TIMEOUT,
  THREE_HOURS_IN_MS,
  UKRAINIAN_MONTHS,
} from '@/modules/reader/strategies/scrapper-reader/scrappers/ukraine/football-ua/constants/constants';
import { ArticleContent, ProcessArticleResult } from '@/core/interfaces';
import { PuppeteerScraper } from '@/modules/reader/strategies/scrapper-reader/providers/puppeteer-scraper';
import { Page } from 'puppeteer';
import { logger } from '@/core/services/logger/logger.service';
import { PageLoadEventEnum } from '@/core/enums/page-load-event.enum';

/**
 * Scraper for Football UA website
 * Handles article scraping, date parsing, and link extraction
 */
export class FootballUAScraper {
  private scraper: PuppeteerScraper;

  constructor(source: Source) {
    this.scraper = new PuppeteerScraper(source.url);
  }

  /**
   * Scrape articles from Football UA
   * @returns Array of ArticleContent
   */
  async scrape(): Promise<ArticleContent[]> {
    const articles: ArticleContent[] = [];

    try {
      await this.scraper.initialize();
      const mainNews = await this.getMainNews();
      const links = this.extractLinksFromHTML(mainNews);
      const page = this.scraper.getPage();

      if (!page) {
        logger.error('Page not initialized');
        return articles;
      }

      for (const link of links) {
        if (this.shouldExcludeLink(link)) {
          continue;
        }

        const result = await this.processArticleLink(page, link);

        if (result.content) {
          articles.push(result.content);
        }

        if (!result.shouldContinue) {
          break;
        }
      }

      return articles;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error scraping Football UA: ${error.message}`, error);
      }
      throw error;
    } finally {
      await this.scraper.close();
    }
  }

  /**
   * Get main news elements from the page
   * @returns Array of HTML strings
   */
  private async getMainNews(): Promise<string[]> {
    await this.scraper.waitForClass(MAIN_NEWS_CLASS);
    return await this.scraper.getElementsByClass(MAIN_NEWS_CLASS);
  }

  /**
   * Process a single article link
   * @param page - Puppeteer page instance
   * @param link - URL to process
   * @returns ProcessArticleResult - Object containing the article content (if successful) and whether to continue processing
   */
  private async processArticleLink(page: Page, link: string): Promise<ProcessArticleResult> {
    try {
      await page.goto(link, {
        waitUntil: PageLoadEventEnum.Networkidle0,
        timeout: PAGE_LOAD_TIMEOUT,
      });

      const dateString = await page.$eval(
        '.date',
        (el) => (el as unknown as { innerText: string }).innerText
      );

      const created = this.convertUkrainianDateToTimestamp(dateString);

      if (!this.isArticleRecentEnough(created)) {
        return {
          content: null,
          shouldContinue: false,
        };
      }

      const content = await page.$eval(
        '.author-article',
        (el) => (el as unknown as { innerText: string }).innerText
      );

      const title = await page.$eval(
        '.author-article h1',
        (el) => (el as unknown as { innerText: string }).innerText
      );

      const imgLink: string | null = await page.$eval(
        '.article-photo img',

        (el) =>
          (el as unknown as { getAttribute: (name: string) => string | null }).getAttribute('src')
      );

      // Wait a bit before navigating to next page (be respectful to the server)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        content: {
          title,
          link,
          image: imgLink ?? undefined,
          content: content || '',
          created,
        },
        shouldContinue: true,
      };
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error scraping Football UA: ${error.message}`, error);
      }
      return {
        content: null,
        shouldContinue: true, // Continue with next link even if one fails
      };
    }
  }

  /**
   * Check if a link should be excluded from processing
   * @param link - The URL to check
   * @returns true if link should be excluded, false otherwise
   */
  private shouldExcludeLink(link: string): boolean {
    return EXCLUDE_LINKS.some((excludeItem) => link.includes(excludeItem));
  }

  /**
   * Check if article date is within the acceptable time limit
   * @param created - Date timestamp
   * @returns true if article is recent enough (less than 3 hours old), false otherwise
   */
  private isArticleRecentEnough(created: number): boolean {
    const currentTime = Date.now();
    const timeDiff = currentTime - created;
    return timeDiff < THREE_HOURS_IN_MS;
  }

  /**
   * Split date string into date and time parts
   * @param dateString - Date string in format "23 ЛИСТОПАДА 2025, 19:58"
   * @returns Object with datePart and timePart
   * @throws Error if format is invalid
   */
  private splitDateString(dateString: string): { datePart: string; timePart: string } {
    const parts = dateString.trim().split(',');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error(`Invalid date format: ${dateString}`);
    }

    return {
      datePart: parts[0].trim(),
      timePart: parts[1].trim(),
    };
  }

  /**
   * Parse date part into day, month name, and year
   * @param datePart - Date part string in format "23 ЛИСТОПАДА 2025"
   * @returns Object with day, monthName, and year
   * @throws Error if format is invalid
   */
  private parseDatePart(datePart: string): { day: number; monthName: string; year: number } {
    const dateElements = datePart.split(' ');
    if (dateElements.length !== 3 || !dateElements[0] || !dateElements[1] || !dateElements[2]) {
      throw new Error(`Invalid date part format: ${datePart}`);
    }

    return {
      day: parseInt(dateElements[0], 10),
      monthName: dateElements[1].toUpperCase(),
      year: parseInt(dateElements[2], 10),
    };
  }

  /**
   * Parse time part into hours and minutes
   * @param timePart - Time part string in format "19:58"
   * @returns Object with hours and minutes
   * @throws Error if format is invalid
   */
  private parseTimePart(timePart: string): { hours: number; minutes: number } {
    const timeElements = timePart.split(':');
    if (timeElements.length !== 2 || !timeElements[0] || !timeElements[1]) {
      throw new Error(`Invalid time format: ${timePart}`);
    }

    return {
      hours: parseInt(timeElements[0], 10),
      minutes: parseInt(timeElements[1], 10),
    };
  }

  /**
   * Convert Ukrainian month name to month number (0-indexed for JavaScript Date)
   * @param monthName - Ukrainian month name in uppercase (e.g., "ЛИСТОПАДА")
   * @returns Month number (0-11)
   * @throws Error if month name is unknown
   */
  private getMonthNumber(monthName: string): number {
    const month = UKRAINIAN_MONTHS[monthName];
    if (month === undefined) {
      throw new Error(`Unknown Ukrainian month: ${monthName}`);
    }
    return month;
  }

  /**
   * Create a Date object and return its timestamp
   * @param year - Year
   * @param month - Month (0-indexed)
   * @param day - Day of month
   * @param hours - Hours (0-23)
   * @param minutes - Minutes (0-59)
   * @returns Unix timestamp in milliseconds
   */
  private createTimestamp(
    year: number,
    month: number,
    day: number,
    hours: number,
    minutes: number
  ): number {
    const date = new Date(year, month, day, hours, minutes, 0, 0);
    return date.getTime();
  }

  /**
   * Convert Ukrainian date string to Unix timestamp
   * @param dateString - Date string in format "23 ЛИСТОПАДА 2025, 19:58"
   * @returns Unix timestamp in milliseconds
   */
  private convertUkrainianDateToTimestamp(dateString: string): number {
    const { datePart, timePart } = this.splitDateString(dateString);
    const { day, monthName, year } = this.parseDatePart(datePart);
    const { hours, minutes } = this.parseTimePart(timePart);
    const month = this.getMonthNumber(monthName);

    return this.createTimestamp(year, month, day, hours, minutes);
  }

  /**
   * Extract all links (href attributes) from HTML strings
   * @param htmlContents - Array of HTML strings
   * @returns Array of extracted URLs
   */
  private extractLinksFromHTML(htmlContents: string[]): string[] {
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
}
