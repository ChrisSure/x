import { describe, it, expect, jest, beforeAll } from '@jest/globals';

// Set up environment variables before any imports that need them
process.env['OPENAI_API_KEY'] = 'test-api-key';
process.env['DB_HOST'] = 'localhost';
process.env['DB_PORT'] = '3306';
process.env['DB_USER'] = 'test-user';
process.env['DB_PASSWORD'] = 'test-password';
process.env['DB_NAME'] = 'test-database';

import { CollectorModule } from '@/modules/collector';
import { SourceModule } from '@/modules/sources/source';
import { Source } from '@/modules/sources/interfaces/source.interface';

beforeAll(() => {
  // Environment variables already set above
});

// Mock node-cron to prevent actual cron jobs from running in tests
jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
  })),
}));

// Mock the OpenAI provider to avoid actual API calls
jest.mock('@/core/providers', () => ({
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

// Mock the MySQL provider to avoid database connections in tests
jest.mock('@/core/providers/mysql', () => ({
  mySQLProvider: {
    query: jest.fn(() =>
      Promise.resolve({
        data: [],
        fields: [],
      })
    ),
    execute: jest.fn(() =>
      Promise.resolve({
        data: { affectedRows: 1, insertId: 1 },
        fields: [],
      })
    ),
  },
  articlesRepository: {
    getLastDayPublishedArticles: jest.fn(() => Promise.resolve(null)),
  },
  MySQLProvider: jest.fn(),
  MySQLProviderError: class MySQLProviderError extends Error {},
  ArticlesRepository: jest.fn(),
}));

// Mock the Puppeteer scraper to avoid launching browser in tests
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock('@/modules/reader/strategies/scrapper-reader/providers/puppeteer-scraper', () => {
  const mockJest = jest as any;
  return {
    PuppeteerScraper: mockJest.fn().mockImplementation(() => {
      return {
        initialize: mockJest.fn().mockResolvedValue(undefined),
        waitForClass: mockJest.fn().mockResolvedValue(undefined),
        getElementsByClass: mockJest
          .fn()
          .mockResolvedValue(['<a href="https://example.com">Test</a>']),
        getPage: mockJest.fn().mockReturnValue({
          goto: mockJest.fn().mockResolvedValue(undefined),
          $eval: mockJest
            .fn()
            .mockResolvedValueOnce('24 ЛИСТОПАДА 2025, 20:16') // First call for date
            .mockResolvedValueOnce('Test content'), // Second call for content
        }),
        close: mockJest.fn().mockResolvedValue(undefined),
      };
    }),
  };
});
/* eslint-enable @typescript-eslint/no-unsafe-assignment */
/* eslint-enable @typescript-eslint/no-unsafe-call */
/* eslint-enable @typescript-eslint/no-unsafe-member-access */
/* eslint-enable @typescript-eslint/no-explicit-any */

describe('CollectorModule', () => {
  describe('start', () => {
    it('should execute without errors', () => {
      const collectorModule = new CollectorModule();
      expect(() => collectorModule.start()).not.toThrow();
    });

    it('should return void', () => {
      const collectorModule = new CollectorModule();
      const result = collectorModule.start();
      expect(result).toBeUndefined();
    });
  });
});

describe('SourceModule', () => {
  describe('getSources', () => {
    it('should return an array of sources', () => {
      const sourceModule = new SourceModule();
      const result = sourceModule.getSources();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return Football UA source', () => {
      const sourceModule = new SourceModule();
      const result = sourceModule.getSources();
      const footballUA = result.find((source: Source) => source.name === 'Football UA');
      expect(footballUA).toBeDefined();
      expect(footballUA?.url).toBe('https://football.ua/ukraine.html');
    });

    it('should return sources with valid structure', () => {
      const sourceModule = new SourceModule();
      const result = sourceModule.getSources();
      result.forEach((source: Source) => {
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
