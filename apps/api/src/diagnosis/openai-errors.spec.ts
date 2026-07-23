import axios from 'axios';
import {
  mayUseRulesFallback,
  openAiHttpException,
  parseOpenAiError,
} from './openai-errors';

describe('OpenAI error policy', () => {
  it('preserves provider rate limits instead of allowing a rules fallback', () => {
    const error = parseOpenAiError(
      new axios.AxiosError(
        'rate limited',
        'ERR_BAD_RESPONSE',
        undefined,
        undefined,
        {
          status: 429,
          statusText: 'Too Many Requests',
          headers: {},
          config: { headers: {} } as never,
          data: { error: { message: 'rate limit reached' } },
        },
      ),
    );

    expect(error.code).toBe('rate_limited');
    expect(mayUseRulesFallback(error)).toBe(false);
    expect(openAiHttpException(error).getStatus()).toBe(429);
    expect(openAiHttpException(error).getResponse()).toMatchObject({
      code: 'AI_PROVIDER_RATE_LIMITED',
      providerCode: 'rate_limited',
    });
  });

  it('allows a rules fallback for a provider timeout', () => {
    const error = parseOpenAiError(
      new axios.AxiosError('timeout', 'ECONNABORTED'),
    );

    expect(error.code).toBe('timeout');
    expect(mayUseRulesFallback(error)).toBe(true);
  });

  it('does not mask invalid credentials as care guidance', () => {
    const error = parseOpenAiError(
      new axios.AxiosError(
        'unauthorized',
        'ERR_BAD_RESPONSE',
        undefined,
        undefined,
        {
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config: { headers: {} } as never,
          data: { error: { message: 'bad key' } },
        },
      ),
    );

    expect(mayUseRulesFallback(error)).toBe(false);
    expect(openAiHttpException(error).getResponse()).toMatchObject({
      code: 'AI_PROVIDER_CONFIGURATION_ERROR',
    });
  });
});
