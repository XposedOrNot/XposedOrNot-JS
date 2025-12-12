import { describe, it, expect } from 'vitest';
import {
  XposedOrNotError,
  ValidationError,
  RateLimitError,
  NotFoundError,
  NetworkError,
  TimeoutError,
  ApiError,
} from '../src/errors/index.js';

describe('XposedOrNotError', () => {
  it('has correct properties', () => {
    const error = new XposedOrNotError('Test error', 'TEST_CODE', 500);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('XposedOrNotError');
  });
});

describe('ValidationError', () => {
  it('has correct properties', () => {
    const error = new ValidationError('Invalid email', 'email');
    expect(error.message).toBe('Invalid email');
    expect(error.field).toBe('email');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.name).toBe('ValidationError');
  });
});

describe('RateLimitError', () => {
  it('has correct defaults', () => {
    const error = new RateLimitError();
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('includes retryAfter', () => {
    const error = new RateLimitError('Too many requests', 60);
    expect(error.retryAfter).toBe(60);
  });
});

describe('NotFoundError', () => {
  it('has correct defaults', () => {
    const error = new NotFoundError();
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });
});

describe('NetworkError', () => {
  it('has correct properties', () => {
    const cause = new Error('Connection refused');
    const error = new NetworkError('Network failed', cause);
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.cause).toBe(cause);
  });
});

describe('TimeoutError', () => {
  it('has correct properties', () => {
    const error = new TimeoutError();
    expect(error.code).toBe('TIMEOUT');
  });
});

describe('ApiError', () => {
  it('has correct properties', () => {
    const error = new ApiError('Server error', 500, { detail: 'Internal error' });
    expect(error.statusCode).toBe(500);
    expect(error.response).toEqual({ detail: 'Internal error' });
  });
});
