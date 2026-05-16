import axios from 'axios';

export type OpenAiErrorCode =
  | 'missing_api_key'
  | 'invalid_api_key'
  | 'quota_exceeded'
  | 'rate_limited'
  | 'overloaded'
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
