import { describe, it, expect, jest, beforeAll } from '@jest/globals';
import { start } from '@/modules/collector';
import { getSources } from '@/modules/sources/source';

// Set up environment variables before any imports that need them
beforeAll(() => {
  process.env['OPENAI_API_KEY'] = 'test-api-key';
});

// Mock the OpenAI provider to avoid actual API calls
jest.mock('@/providers/ai/openai', () => ({
  openAIProvider: {
    chat: jest.fn(() =>
      Promise.resolve({
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                title: 'Test Title',
                content: 'Test cleaned content',
              }),
            },
            finishReason: 'stop',
          },
        ],
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
      })
    ),
  },
  OpenAIProvider: jest.fn(),
  OpenAIProviderError: class OpenAIProviderError extends Error {},
}));

// Mock the scrapper reader to avoid launching Puppeteer in tests
jest.mock('@/modules/reader/strategies/scrapper-reader/scrapper-reader', () => ({
  scrapperReader: jest.fn(() =>
    Promise.resolve([
      {
        link: 'https://example.com',
        content: 'Test content',
        dateString: '2024-01-01',
      },
    ])
  ),
}));

describe('Collector', () => {
  describe('start', () => {
    it('should execute without errors', async () => {
      await expect(start()).resolves.not.toThrow();
    });

    it('should be an async function', () => {
      const result = start();
      expect(result).toBeInstanceOf(Promise);
    });
  });
});

describe('Sources', () => {
  describe('getSources', () => {
    it('should return an array of sources', () => {
      const result = getSources();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return Football UA source', () => {
      const result = getSources();
      const footballUA = result.find((source) => source.name === 'Football UA');
      expect(footballUA).toBeDefined();
      expect(footballUA?.url).toBe('https://football.ua/ukraine.html');
    });

    it('should return sources with valid structure', () => {
      const result = getSources();
      result.forEach((source) => {
        expect(source).toHaveProperty('id');
        expect(source).toHaveProperty('name');
        expect(source).toHaveProperty('url');
        expect(source).toHaveProperty('reader');
        expect(source).toHaveProperty('period');
        expect(source).toHaveProperty('status');
        expect(typeof source.id).toBe('number');
        expect(typeof source.name).toBe('string');
        expect(typeof source.url).toBe('string');
        expect(typeof source.period).toBe('number');
      });
    });
  });
});
