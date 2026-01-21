/**
 * Response structure from image update API
 */
export interface ImageUpdateResponse {
  success: boolean;
  message: string;
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
  results: Array<{
    id: number;
    success: boolean;
    error: string | null;
    data: {
      articleId: number;
      oldImage: string;
      newImage: string;
      savedPath: string;
    } | null;
  }>;
}