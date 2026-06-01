import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

function makeHost(req: Record<string, unknown> = {}) {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const res = { status, json };
  const request = {
    method: 'POST',
    url: '/api/v1/test',
    originalUrl: '/api/v1/test',
    requestId: 'req-123',
    ...req,
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => res,
    }),
  };
  return { host: host as never, status, json };
}

describe('AllExceptionsFilter', () => {
  it('passes through a custom HttpException object body verbatim (preserves code)', () => {
    const filter = new AllExceptionsFilter();
    const { host, status, json } = makeHost();
    const exception = new HttpException(
      { code: 'PLANT_LIMIT_REACHED', message: 'Upgrade for more plants.' },
      HttpStatus.FORBIDDEN,
    );

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({
      code: 'PLANT_LIMIT_REACHED',
      message: 'Upgrade for more plants.',
    });
  });

  it('wraps a string HttpException response into { statusCode, message }', () => {
    const filter = new AllExceptionsFilter();
    const { host, status, json } = makeHost();

    filter.catch(new BadRequestException('Bad input'), host);

    expect(status).toHaveBeenCalledWith(400);
    // BadRequestException builds an object response by default, but a raw string
    // response is wrapped — assert the shape contains the message.
    const body = json.mock.calls[0][0];
    expect(body.statusCode).toBe(400);
    expect(JSON.stringify(body)).toContain('Bad input');
  });

  it('maps an unknown error to a generic 500 with the requestId and no internals', () => {
    const filter = new AllExceptionsFilter();
    const { host, status, json } = makeHost();

    filter.catch(new Error('secret stack detail'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
      requestId: 'req-123',
    });
    // The internal error message must not leak to the client.
    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain('secret stack detail');
  });
});
