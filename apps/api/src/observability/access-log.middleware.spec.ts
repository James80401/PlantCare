import { Logger } from '@nestjs/common';
import { accessLogMiddleware } from './access-log.middleware';

describe('accessLogMiddleware', () => {
  it('records the final response size from Content-Length', () => {
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    let finish: (() => void) | undefined;
    const req = {
      originalUrl: '/api/v1/dashboard',
      method: 'GET',
      requestId: 'request-1',
      user: { sub: 'user-1' },
    };
    const res = {
      statusCode: 200,
      getHeader: jest.fn().mockReturnValue('4321'),
      on: jest.fn((event: string, callback: () => void) => {
        if (event === 'finish') finish = callback;
      }),
    };
    const next = jest.fn();

    accessLogMiddleware(req as never, res as never, next);
    finish?.();

    expect(next).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(log.mock.calls[0][0]))).toMatchObject({
      event: 'http_request',
      requestId: 'request-1',
      method: 'GET',
      path: '/api/v1/dashboard',
      statusCode: 200,
      responseBytes: 4321,
      userId: 'user-1',
    });
    log.mockRestore();
  });
});
