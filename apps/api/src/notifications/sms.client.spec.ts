import axios from 'axios';
import { resolveSmsTransport, sendSmsNotification } from './sms.client';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('resolveSmsTransport', () => {
  it('resolves live mode when all three Twilio env vars are set', () => {
    const transport = resolveSmsTransport(
      (key) =>
        ({
          TWILIO_ACCOUNT_SID: 'AC123',
          TWILIO_AUTH_TOKEN: 'secret',
          TWILIO_FROM_NUMBER: '+15550001111',
        })[key],
    );
    expect(transport).toEqual({
      mode: 'live',
      accountSid: 'AC123',
      authToken: 'secret',
      fromNumber: '+15550001111',
    });
  });

  it('falls back to none when any Twilio env var is missing', () => {
    const transport = resolveSmsTransport((key) =>
      key === 'TWILIO_ACCOUNT_SID' ? 'AC123' : undefined,
    );
    expect(transport).toEqual({ mode: 'none' });
  });

  it('falls back to none when all Twilio env vars are unset', () => {
    const transport = resolveSmsTransport(() => undefined);
    expect(transport).toEqual({ mode: 'none' });
  });
});

describe('sendSmsNotification', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns sent:false without calling axios when transport is none', async () => {
    const result = await sendSmsNotification({ mode: 'none' }, '+15551234567', 'hi');
    expect(result).toEqual({ sent: false });
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('returns sent:false without calling axios when the destination is empty', async () => {
    const result = await sendSmsNotification(
      { mode: 'live', accountSid: 'AC123', authToken: 'tok', fromNumber: '+15550001111' },
      '',
      'hi',
    );
    expect(result).toEqual({ sent: false });
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('posts a form-encoded body with Basic auth to the Twilio Messages endpoint', async () => {
    mockedAxios.post.mockResolvedValue({ status: 201, data: { sid: 'SM123' } });

    const result = await sendSmsNotification(
      { mode: 'live', accountSid: 'AC123', authToken: 'tok', fromNumber: '+15550001111' },
      '+15551234567',
      'Your plants need water',
    );

    expect(result).toEqual({ sent: true });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json',
      expect.any(URLSearchParams),
      expect.objectContaining({
        auth: { username: 'AC123', password: 'tok' },
        headers: expect.objectContaining({
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
      }),
    );
    const sentParams = mockedAxios.post.mock.calls[0][1] as URLSearchParams;
    expect(sentParams.get('To')).toBe('+15551234567');
    expect(sentParams.get('From')).toBe('+15550001111');
    expect(sentParams.get('Body')).toBe('Your plants need water');
  });

  it('returns sent:false with Twilio error details on a non-2xx response', async () => {
    mockedAxios.post.mockResolvedValue({
      status: 400,
      data: { code: 21211, message: "Invalid 'To' Phone Number" },
    });

    const result = await sendSmsNotification(
      { mode: 'live', accountSid: 'AC123', authToken: 'tok', fromNumber: '+15550001111' },
      'not-a-number',
      'hi',
    );

    expect(result).toEqual({
      sent: false,
      errorCode: 21211,
      errorMessage: "Invalid 'To' Phone Number",
    });
  });

  it('falls back to a generic message when the Twilio error body has no message', async () => {
    mockedAxios.post.mockResolvedValue({ status: 500, data: {} });

    const result = await sendSmsNotification(
      { mode: 'live', accountSid: 'AC123', authToken: 'tok', fromNumber: '+15550001111' },
      '+15551234567',
      'hi',
    );

    expect(result).toEqual({ sent: false, errorCode: undefined, errorMessage: 'Twilio HTTP 500' });
  });
});
