/**
 * Represents the content of a scraped article
 */
export interface ArticleContent {
  link: string;
  content: string;
  dateString: string;
  title?: string;
  imgLink?: string;
}

/**
 * Result of processing a single article link
 */
export interface ProcessArticleResult {
  content: ArticleContent | null;
  shouldContinue: boolean;
}
