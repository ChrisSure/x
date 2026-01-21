/**
 * Telegram Provider Module
 * Provides singleton instance of Telegram provider for application-wide use
 */

import { TelegramProvider } from './telegram.provider';

export { TelegramProvider, TelegramProviderError } from './telegram.provider';

/**
 * Singleton instance of Telegram provider
 * Import this to use Telegram services throughout the application
 *
 * @example
 * ```typescript
 * import { telegramProvider } from '@/core/providers/telegram';
 *
 * await telegramProvider.sendArticle(article);
 * ```
 */
export const telegramProvider = new TelegramProvider();
