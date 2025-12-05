/**
 * Constants for AnalyzeAiService
 */

/**
 * Cosine similarity threshold for determining if titles are similar
 * 0.75 = moderate threshold that catches related topics
 * Range: 0.0 (completely different) to 1.0 (identical)
 */
export const SIMILARITY_THRESHOLD = 0.75;

/**
 * OpenAI embedding model to use
 * text-embedding-3-small: Cost-efficient and performant for semantic similarity
 */
export const EMBEDDING_MODEL = 'text-embedding-3-small' as const;
