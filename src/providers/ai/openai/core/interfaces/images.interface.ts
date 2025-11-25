/**
 * Image generation interfaces for OpenAI API
 */

/**
 * Available image generation models
 */
export type ImageModel = 'dall-e-2' | 'dall-e-3';

/**
 * Image size options
 */
export type ImageSize = '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';

/**
 * Image quality options (DALL-E 3 only)
 */
export type ImageQuality = 'standard' | 'hd';

/**
 * Image style options (DALL-E 3 only)
 */
export type ImageStyle = 'vivid' | 'natural';

/**
 * Response format for generated images
 */
export type ImageResponseFormat = 'url' | 'b64_json';

/**
 * Options for image generation
 */
export interface GenerateImageOptions {
  model?: ImageModel;
  size?: ImageSize;
  quality?: ImageQuality;
  style?: ImageStyle;
  n?: number;
  responseFormat?: ImageResponseFormat;
}

/**
 * Request for generating an image
 */
export interface GenerateImageRequest {
  prompt: string;
  options?: GenerateImageOptions;
}

/**
 * Single generated image data
 */
export interface ImageData {
  url?: string;
  b64Json?: string;
  revisedPrompt?: string;
}

/**
 * Response from image generation
 */
export interface GenerateImageResponse {
  created: number;
  data: ImageData[];
}
