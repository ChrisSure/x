import { describe, it, expect } from '@jest/globals';
import { greet, add } from '../src/index';

describe('greet', () => {
  it('should return a greeting message', () => {
    const result = greet('World');
    expect(result).toBe('Hello, World!');
  });

  it('should greet a specific person', () => {
    const result = greet('Alice');
    expect(result).toBe('Hello, Alice!');
  });
});

describe('add', () => {
  it('should add two positive numbers', () => {
    const result = add(2, 3);
    expect(result).toBe(5);
  });

  it('should add negative numbers', () => {
    const result = add(-2, -3);
    expect(result).toBe(-5);
  });

  it('should add zero', () => {
    const result = add(5, 0);
    expect(result).toBe(5);
  });
});
