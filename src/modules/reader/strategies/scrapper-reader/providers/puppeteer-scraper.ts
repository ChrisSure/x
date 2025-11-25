import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from '@/core/services/logger.service';

/**
 * PuppeteerScraper class for web scraping using Puppeteer
 */
export class PuppeteerScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private readonly url: string;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Initialize the browser and navigate to the URL
   */
  async initialize(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      this.page = await this.browser.newPage();

      // Set a realistic viewport size
      await this.page.setViewport({ width: 1920, height: 1080 });

      // Set a user agent to avoid being blocked
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      await this.page.goto(this.url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });
    } catch (error) {
      await this.close();
      if (error instanceof Error) {
        throw new Error(`Failed to initialize scraper: ${error.message}`);
      }
      throw new Error('Failed to initialize scraper: Unknown error');
    }
  }

  /**
   * Get the current page instance
   */
  getPage(): Page | null {
    return this.page;
  }

  /**
   * Get the page title
   */
  async getTitle(): Promise<string> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }
    return await this.page.title();
  }

  /**
   * Get the page URL
   */
  getUrl(): string {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }
    return this.page.url();
  }

  /**
   * Get element by class name
   */
  async getElementByClass(className: string): Promise<string | null> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const element = await this.page.$(`.${className}`);
    if (!element) {
      return null;
    }

    const innerHTML = await element.evaluate((el) => {
      return (el as unknown as { innerHTML: string }).innerHTML;
    });
    return innerHTML;
  }

  /**
   * Get all elements by class name
   */
  async getElementsByClass(className: string): Promise<string[]> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const elements = await this.page.$$(`.${className}`);
    const contents: string[] = [];

    for (const element of elements) {
      const content = await element.evaluate((el) => {
        return (el as unknown as { innerHTML: string }).innerHTML;
      });
      contents.push(content);
    }

    return contents;
  }

  /**
   * Get element text content by class name
   */
  async getTextByClass(className: string): Promise<string | null> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const element = await this.page.$(`.${className}`);
    if (!element) {
      return null;
    }

    const textContent = await element.evaluate((el) => {
      return (el as unknown as { textContent: string | null }).textContent?.trim() || '';
    });
    return textContent;
  }

  /**
   * Wait for element with class name to appear
   */
  async waitForClass(className: string, timeout = 5000): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    await this.page.waitForSelector(`.${className}`, { timeout });
  }

  /**
   * Take a screenshot of the page
   */
  async takeScreenshot(path: `${string}.png` | `${string}.jpeg` | `${string}.webp`): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }
    await this.page.screenshot({ path, fullPage: true });
  }

  /**
   * Close the browser instance
   */
  async close(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error closing browser: ${error.message}`, error);
      }
    }
  }

  /**
   * Check if the browser is initialized
   */
  isInitialized(): boolean {
    return this.browser !== null && this.page !== null;
  }
}
