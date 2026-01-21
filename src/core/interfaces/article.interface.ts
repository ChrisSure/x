/**
 * Represents the content of a scraped article
 */
export interface ArticleContent {
  id?: number;
  title: string;
  link: string;
  content: string;
  created: number;
  image?: string;
}

/**
 * Result of processing a single article link
 */
export interface ProcessArticleResult {
  content: ArticleContent | null;
  shouldContinue: boolean;
}
