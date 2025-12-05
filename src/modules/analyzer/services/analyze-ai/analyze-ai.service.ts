import { logger } from '@/core/services/logger/logger.service';
import { openAIProvider } from '@/core/providers';
import { Nullable } from '@/core/types/nullable.type';
import { SIMILARITY_THRESHOLD, EMBEDDING_MODEL } from './constants/analyze-ai.constants';

/**
 * AI-powered service to compare article titles for semantic similarity
 * Uses OpenAI embeddings and cosine similarity to detect duplicate/similar content
 */
export class AnalyzeAiService {
  /**
   * Compares new article titles against existing titles to detect semantic similarity
   * @param newTitles - Array of new article titles to check
   * @param existingTitles - Array of existing article titles to compare against
   * @returns Promise resolving to boolean array indicating which new titles are similar (true = should be removed)
   */
  async areTitlesSimilar(
    newTitles: string[],
    existingTitles: string[]
  ): Promise<Nullable<boolean[]>> {
    if (!newTitles.length || !existingTitles.length) {
      return null;
    }

    // Filter out null/empty titles
    const validNewTitles = newTitles.filter((title) => title && title.trim().length > 0);
    const validExistingTitles = existingTitles.filter((title) => title && title.trim().length > 0);

    if (!validNewTitles.length || !validExistingTitles.length) {
      return null;
    }

    try {
      const [newEmbeddingsResponse, existingEmbeddingsResponse] = await Promise.all([
        openAIProvider.createEmbedding({
          input: validNewTitles,
          options: {
            model: EMBEDDING_MODEL,
          },
        }),
        openAIProvider.createEmbedding({
          input: validExistingTitles,
          options: {
            model: EMBEDDING_MODEL,
          },
        }),
      ]);

      // Extract embeddings from responses
      const newEmbeddings = newEmbeddingsResponse.data.map((item) => item.embedding);
      const existingEmbeddings = existingEmbeddingsResponse.data.map((item) => item.embedding);

      // Compare each new title against all existing titles
      const similarityResults = newEmbeddings.map((newEmbed, index) => {
        const maxSimilarity = Math.max(
          ...existingEmbeddings.map((existEmbed) => this.cosineSimilarity(newEmbed, existEmbed))
        );

        const isSimilar = maxSimilarity >= SIMILARITY_THRESHOLD;

        if (isSimilar) {
          logger.info('Similar title detected', {
            newTitle: validNewTitles[index],
            maxSimilarity: maxSimilarity.toFixed(4),
            threshold: SIMILARITY_THRESHOLD,
          });
        }

        return isSimilar;
      });

      const removedCount = similarityResults.filter((result) => result).length;
      logger.info('Title comparison complete', {
        totalTitles: newTitles.length,
        similarTitles: removedCount,
        retainedTitles: newTitles.length - removedCount,
      });

      return similarityResults;
    } catch (error) {
      logger.error('Failed to compare titles', { error });
      return null;
    }
  }

  /**
   * Calculates cosine similarity between two embedding vectors
   * @param vecA - First embedding vector
   * @param vecB - Second embedding vector
   * @returns Cosine similarity score between 0 and 1
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
      const valueA = vecA[i];
      const valueB = vecB[i];

      if (valueA === undefined || valueB === undefined) {
        continue;
      }

      dotProduct += valueA * valueB;
      magnitudeA += valueA * valueA;
      magnitudeB += valueB * valueB;
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }
}
