export const MAIN_NEWS_CLASS = 'news-feed.main-news';
export const EXCLUDE_LINKS = ['rss2'];

export const PAGE_LOAD_TIMEOUT = 30000;
export const HOURS_VALUE = 10;
export const THREE_HOURS_IN_MS = HOURS_VALUE * 60 * 60 * 1000;

/**
 * Ukrainian month names mapped to month numbers (0-indexed for JavaScript Date)
 */
export const UKRAINIAN_MONTHS: Record<string, number> = {
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
