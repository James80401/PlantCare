import axios from 'axios';
import { HttpException, HttpStatus } from '@nestjs/common';

export type OpenAiErrorCode =
  | 'missing_api_key'
  | 'invalid_api_key'
  | 'quota_exceeded'
  | 'rate_limited'
  | 'overloaded'
  | 'timeout'
  | 'bad_request'
  | 'unknown';

export class OpenAiRequestError extends Error {
  constructor(
    message: string,
    readonly code: OpenAiErrorCode,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'OpenAiRequestError';
  }
}

export function parseOpenAiError(err: unknown): OpenAiRequestError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const apiMsg =
      (err.response?.data as { error?: { message?: string } })?.error?.message ||
      err.message;

    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return new OpenAiRequestError(
        'The AI provider timed out. Please try again.',
        'timeout',
      );
    }
    if (status === 401) {
      return new OpenAiRequestError(
        'Invalid OpenAI API key. Check OPENAI_API_KEY in .env.',
        'invalid_api_key',
        401,
      );
    }
    if (status === 429) {
      const code: OpenAiErrorCode = apiMsg.toLowerCase().includes('quota')
        ? 'quota_exceeded'
        : 'rate_limited';
      return new OpenAiRequestError(
        code === 'quota_exceeded'
          ? 'OpenAI quota exceeded. Add billing or credits at platform.openai.com.'
          : 'OpenAI rate limit hit. Wait a moment and try again.',
        code,
        429,
      );
    }
    if (status === 503 || status === 502) {
      return new OpenAiRequestError(
        'OpenAI is temporarily unavailable. Try again shortly.',
        'overloaded',
        status,
      );
    }
    if (status === 400) {
      return new OpenAiRequestError(apiMsg, 'bad_request', 400);
    }
    return new OpenAiRequestError(apiMsg, 'unknown', status);
  }

  const message = err instanceof Error ? err.message : String(err);
  return new OpenAiRequestError(message, 'unknown');
}

export function isTransientOpenAiError(error: unknown): boolean {
  const parsed =
    error instanceof OpenAiRequestError ? error : parseOpenAiError(error);
  return (
    parsed.code === 'rate_limited' ||
    parsed.code === 'overloaded' ||
    parsed.code === 'timeout' ||
    (parsed.code === 'unknown' &&
      (parsed.status === undefined || parsed.status >= 500))
  );
}

export function mayUseRulesFallback(error: OpenAiRequestError): boolean {
  return (
    error.code === 'overloaded' ||
    error.code === 'timeout' ||
    (error.code === 'unknown' &&
      (error.status === undefined || error.status >= 500))
  );
}

export function openAiHttpException(error: OpenAiRequestError): HttpException {
  const status =
    error.code === 'rate_limited'
      ? HttpStatus.TOO_MANY_REQUESTS
      : error.code === 'bad_request'
        ? HttpStatus.BAD_GATEWAY
        : HttpStatus.SERVICE_UNAVAILABLE;
  const code =
    error.code === 'rate_limited'
      ? 'AI_PROVIDER_RATE_LIMITED'
      : error.code === 'quota_exceeded'
        ? 'AI_PROVIDER_QUOTA_EXCEEDED'
        : error.code === 'invalid_api_key' || error.code === 'missing_api_key'
          ? 'AI_PROVIDER_CONFIGURATION_ERROR'
          : error.code === 'bad_request'
            ? 'AI_PROVIDER_REQUEST_REJECTED'
            : 'AI_PROVIDER_UNAVAILABLE';

  return new HttpException(
    { code, message: error.message, providerCode: error.code },
    status,
  );
}
