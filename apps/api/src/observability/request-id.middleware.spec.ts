import { requestIdMiddleware, REQUEST_ID_HEADER } from './request-id.middleware';

function run(headers: Record<string, unknown> = {}) {
  const req = { headers } as never as { requestId?: string; headers: Record<string, unknown> };
  const setHeader = jest.fn();
  const res = { setHeader } as never;
  const next = jest.fn();
  requestIdMiddleware(req as never, res, next);
  return { req, setHeader, next };
}

describe('requestIdMiddleware', () => {
  it('generates a request id when none is provided and echoes it in the header', () => {
    const { req, setHeader, next } = run();
    expect(typeof req.requestId).toBe('string');
    expect(req.requestId!.length).toBeGreaterThan(0);
    expect(setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, req.requestId);
    expect(next).toHaveBeenCalled();
  });

  it('honours a sane inbound x-request-id for trace propagation', () => {
    const { req, setHeader } = run({ [REQUEST_ID_HEADER]: 'trace-abc-1' });
    expect(req.requestId).toBe('trace-abc-1');
    expect(setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, 'trace-abc-1');
  });

  it('rejects an oversized inbound id and generates one instead (anti log-injection)', () => {
    const huge = 'x'.repeat(500);
    const { req } = run({ [REQUEST_ID_HEADER]: huge });
    expect(req.requestId).not.toBe(huge);
    expect(req.requestId!.length).toBeLessThanOrEqual(128);
  });
});
