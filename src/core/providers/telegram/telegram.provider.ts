import { logger } from '@/core/services/logger/logger.service';
import { ArticleContent } from '@/core/interfaces';

type TelegramSendPhotoPayload = {
  chat_id: string;
  photo: string;
  caption?: string;
  parse_mode?: 'MarkdownV2';
  disable_web_page_preview?: boolean;
};

type TelegramApiResponse = {
  ok: boolean;
  description?: string;
};

export class TelegramProviderError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'TelegramProviderError';
    this.code = code;
  }
}

const TELEGRAM_CAPTION_LIMIT = 1024;

const MARKDOWN_V2_SPECIALS = /[\\_*[\]()~`>#+\-=|{}.!]/g;

const escapeMarkdownV2 = (value: string): string => value.replace(MARKDOWN_V2_SPECIALS, '\\$&');
const stripMarkdownMarkers = (value: string): string => value.replace(/[*_]/g, '');
const hasUkrainianLetters = (value: string): boolean => /[іїєґІЇЄҐ]/.test(value);

/**
 * Telegram Provider Service
 * Provides access to Telegram Bot API to send messages to channels
 */
export class TelegramProvider {
  private readonly channelId: string;
  private readonly baseUrl: string;

  constructor() {
    const token = process.env['TELEGRAM_BOT_TOKEN'];
    const rawChannelId = process.env['TELEGRAM_CHANNEL_ID'];
    const channelId = rawChannelId?.startsWith('-')
      ? rawChannelId
      : rawChannelId
        ? `-${rawChannelId}`
        : '';

    if (!token) {
      throw new TelegramProviderError(
        'TELEGRAM_BOT_TOKEN is not defined in environment variables',
        'MISSING_BOT_TOKEN'
      );
    }

    if (!channelId) {
      throw new TelegramProviderError(
        'TELEGRAM_CHANNEL_ID is not defined in environment variables',
        'MISSING_CHANNEL_ID'
      );
    }

    this.channelId = channelId;
    this.baseUrl = `https://api.telegram.org/bot${token}`;

    logger.info('Telegram Provider initialized successfully');
  }

  private async post<T>(method: string, payload: TelegramSendPhotoPayload): Promise<T> {
    const response = await fetch(`${this.baseUrl}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new TelegramProviderError(
        `Telegram API error: ${response.status} ${response.statusText} ${errorBody}`,
        'API_ERROR'
      );
    }

    return (await response.json()) as T;
  }

  private buildCaption(title: string, content: string, limit: number): string {
    const safeTitle = escapeMarkdownV2(stripMarkdownMarkers(title.trim()));
    const safeContent = escapeMarkdownV2(stripMarkdownMarkers(content.trim()));
    const titleLine = `*${safeTitle}*`;
    const separator = '\n\n';
    const fullCaption = `${titleLine}${separator}${safeContent}`;

    if (fullCaption.length <= limit) {
      return fullCaption;
    }

    const ellipsis = '\\.\\.\\.';
    const maxContentLength = Math.max(
      0,
      limit - titleLine.length - separator.length - ellipsis.length
    );
    const truncatedContent =
      maxContentLength > 0 ? `${safeContent.slice(0, maxContentLength).trimEnd()}${ellipsis}` : '';

    return truncatedContent ? `${titleLine}${separator}${truncatedContent}` : titleLine;
  }

  private async sendPhoto(photoUrl: string, caption?: string): Promise<void> {
    const payload: TelegramSendPhotoPayload = {
      chat_id: this.channelId,
      photo: photoUrl,
      caption,
      parse_mode: 'MarkdownV2',
    };

    await this.post<TelegramApiResponse>('sendPhoto', payload);
  }

  /**
   * Sends a single article to Telegram channel
   * @param article - Article with image, title, and content
   */
  async sendArticle(article: ArticleContent): Promise<void> {
    if (!article.image || !article.title || !article.content) {
      throw new TelegramProviderError(
        'Article is missing image, title, or content',
        'INVALID_ARTICLE'
      );
    }

    const caption = this.buildCaption(article.title, article.content, TELEGRAM_CAPTION_LIMIT);
    await this.sendPhoto(article.image, caption);
  }

  /**
   * Sends multiple articles to Telegram channel
   * @param articles - Array of articles
   */
  async sendArticles(articles: ArticleContent[]): Promise<{ sent: number; skipped: number }> {
    let sent = 0;
    let skipped = 0;

    const results = await Promise.allSettled(
      articles.map(async (article) => {
        if (!article.image || !article.title || !article.content) {
          skipped += 1;
          logger.warn('Skipping article missing image/title/content', {
            id: article.id,
            title: article.title,
          });
          return;
        }

        const textForLanguageCheck = `${article.title} ${article.content}`;
        if (!hasUkrainianLetters(textForLanguageCheck)) {
          skipped += 1;
          logger.warn('Skipping non-Ukrainian article', {
            id: article.id,
            title: article.title,
          });
          return;
        }

        await this.sendArticle(article);
        sent += 1;
      })
    );

    const failures = results.filter((result) => result.status === 'rejected');
    for (const failure of failures) {
      if (failure.status === 'rejected') {
        const errorMessage =
          failure.reason instanceof Error ? failure.reason.message : 'Unknown error';
        logger.error('Failed to send article to Telegram', { error: errorMessage });
      }
    }

    return { sent, skipped };
  }
}
