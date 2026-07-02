import axios from 'axios';

export type SmsTransportConfig =
  | { mode: 'live'; accountSid: string; authToken: string; fromNumber: string }
  | { mode: 'none' };

export interface SmsSendResult {
  sent: boolean;
  errorCode?: number;
  errorMessage?: string;
}

/** Resolve Twilio transport from env. Any missing/blank credential => 'none' (mock mode). */
export function resolveSmsTransport(
  get: (key: string) => string | undefined,
): SmsTransportConfig {
  const accountSid = get('TWILIO_ACCOUNT_SID');
  const authToken = get('TWILIO_AUTH_TOKEN');
  const fromNumber = get('TWILIO_FROM_NUMBER');

  if (accountSid && authToken && fromNumber) {
    return { mode: 'live', accountSid, authToken, fromNumber };
  }
  return { mode: 'none' };
}

export async function sendSmsNotification(
  transport: SmsTransportConfig,
  to: string,
  body: string,
): Promise<SmsSendResult> {
  if (transport.mode === 'none' || !to) {
    return { sent: false };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${transport.accountSid}/Messages.json`;
  const params = new URLSearchParams({
    To: to,
    From: transport.fromNumber,
    Body: body,
  });

  const res = await axios.post(url, params, {
    auth: { username: transport.accountSid, password: transport.authToken },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 10_000,
    validateStatus: () => true,
  });

  if (res.status >= 200 && res.status < 300) {
    return { sent: true };
  }

  const data = res.data as { code?: number; message?: string };
  return {
    sent: false,
    errorCode: data?.code,
    errorMessage: data?.message || `Twilio HTTP ${res.status}`,
  };
}
