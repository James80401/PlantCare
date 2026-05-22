import axios from 'axios';

export interface FcmSendResult {
  sent: number;
  failed: number;
  invalidTokens: string[];
}

/** Legacy FCM HTTP API (server key). Returns invalid registration IDs to prune. */
export async function sendFcmNotification(
  serverKey: string,
  tokens: string[],
  title: string,
  body: string,
): Promise<FcmSendResult> {
  if (!tokens.length) {
    return { sent: 0, failed: 0, invalidTokens: [] };
  }

  const payload = {
    registration_ids: tokens,
    notification: { title, body },
    data: { title, body },
    priority: 'high',
  };

  const res = await axios.post('https://fcm.googleapis.com/fcm/send', payload, {
    headers: {
      Authorization: `key=${serverKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 10_000,
    validateStatus: () => true,
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`FCM HTTP ${res.status}: ${JSON.stringify(res.data)?.slice(0, 200)}`);
  }

  const data = res.data as {
    success?: number;
    failure?: number;
    results?: Array<{ error?: string }>;
  };

  const invalidTokens: string[] = [];
  const results = data.results ?? [];
  for (let i = 0; i < results.length; i++) {
    const err = results[i]?.error;
    if (
      err === 'InvalidRegistration' ||
      err === 'NotRegistered' ||
      err === 'MismatchSenderId'
    ) {
      invalidTokens.push(tokens[i]);
    }
  }

  return {
    sent: data.success ?? 0,
    failed: data.failure ?? 0,
    invalidTokens,
  };
}
