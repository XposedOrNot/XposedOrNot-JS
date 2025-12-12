import { describe, it, expect } from 'vitest';
import { XposedOrNot } from '../src/client.js';
import { ValidationError } from '../src/errors/index.js';

describe('XposedOrNot client', () => {
  it('creates client with default config', () => {
    const client = new XposedOrNot();
    expect(client).toBeInstanceOf(XposedOrNot);
  });

  it('creates client with custom config', () => {
    const client = new XposedOrNot({
      timeout: 5000,
      retries: 5,
    });
    expect(client).toBeInstanceOf(XposedOrNot);
  });

  it('rejects non-HTTPS baseUrl', () => {
    expect(() => new XposedOrNot({ baseUrl: 'http://api.example.com' })).toThrow(ValidationError);
  });

  it('rejects invalid baseUrl', () => {
    expect(() => new XposedOrNot({ baseUrl: 'not-a-url' })).toThrow(ValidationError);
  });

  it('rejects timeout out of range', () => {
    expect(() => new XposedOrNot({ timeout: 100 })).toThrow(ValidationError);
    expect(() => new XposedOrNot({ timeout: 999999 })).toThrow(ValidationError);
  });

  it('rejects retries out of range', () => {
    expect(() => new XposedOrNot({ retries: -1 })).toThrow(ValidationError);
    expect(() => new XposedOrNot({ retries: 20 })).toThrow(ValidationError);
  });
});
