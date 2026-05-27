import { existsSync, readFileSync } from 'fs';
import axios from 'axios';

export interface FcmSendResult {
  sent: number;
  failed: number;
  invalidTokens: string[];
}

export type FcmTransportConfig =
  | { mode: 'legacy'; serverKey: string }
  | { mode: 'v1'; projectId: string; getAccessToken: () => Promise<string> }
  | { mode: 'none' };

type ServiceAccountJson = {
  project_id?: string;
  client_email: string;
  private_key: string;
};

let v1TokenCache: { token: string; expiresAt: number } | null = null;

function loadServiceAccount(get: (key: string) => string | undefined): ServiceAccountJson | null {
  const path =
    get('GOOGLE_APPLICATION_CREDENTIALS') ||
    get('FIREBASE_SERVICE_ACCOUNT_PATH') ||
    undefined;
  if (path && existsSync(path)) {
    try {
      return JSON.parse(readFileSync(path, 'utf8')) as ServiceAccountJson;
    } catch {
      return null;
    }
  }

  const email = get('FIREBASE_CLIENT_EMAIL');
  const privateKey = get('FIREBASE_PRIVATE_KEY');
  if (email && privateKey) {
    return {
      client_email: email,
      private_key: privateKey.replace(/\\n/g, '\n'),
      project_id: get('FIREBASE_PROJECT_ID'),
    };
  }

  return null;
}

async function createV1AccessTokenProvider(
  credentials: ServiceAccountJson,
): Promise<() => Promise<string>> {
  const { GoogleAuth } = await import('google-auth-library');
  const auth = new GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });
  const client = await auth.getClient();

  return async () => {
    if (v1TokenCache && v1TokenCache.expiresAt > Date.now() + 60_000) {
      return v1TokenCache.token;
    }
    const access = await client.getAccessToken();
    const token = access.token;
    if (!token) throw new Error('Failed to obtain FCM v1 access token');
    v1TokenCache = { token, expiresAt: Date.now() + 3_500_000 };
    return token;
  };
}

/** Resolve FCM transport: prefer HTTP v1 (service account), fall back to legacy server key. */
export function resolveFcmTransport(
  get: (key: string) => string | undefined,
): FcmTransportConfig {
  const serviceAccount = loadServiceAccount(get);
  const projectId =
    get('FIREBASE_PROJECT_ID') || serviceAccount?.project_id || undefined;

  if (projectId && serviceAccount?.client_email && serviceAccount.private_key) {
    let tokenProvider: (() => Promise<string>) | null = null;
    return {
      mode: 'v1',
      projectId,
      getAccessToken: async () => {
        if (!tokenProvider) {
          tokenProvider = await createV1AccessTokenProvider(serviceAccount);
        }
        return tokenProvider();
      },
    };
  }

  const serverKey = get('FCM_SERVER_KEY');
  if (serverKey) {
    return { mode: 'legacy', serverKey };
  }

  return { mode: 'none' };
}

function isInvalidV1Error(status: number, data: unknown): boolean {
  if (status === 404) return true;
  const body = data as { error?: { details?: Array<{ errorCode?: string }> } };
  const codes = body?.error?.details?.map((d) => d.errorCode) ?? [];
  return codes.includes('UNREGISTERED') || codes.includes('INVALID_ARGUMENT');
}

async function sendFcmV1(
  config: Extract<FcmTransportConfig, { mode: 'v1' }>,
  tokens: string[],
  title: string,
  body: string,
  extraData: Record<string, string>,
): Promise<FcmSendResult> {
  const accessToken = await config.getAccessToken();
  const url = `https://fcm.googleapis.com/v1/projects/${config.projectId}/messages:send`;

  let sent = 0;
  let failed = 0;
  const invalidTokens: string[] = [];

  for (const token of tokens) {
    const payload = {
      message: {
        token,
        notification: { title, body },
        data: Object.fromEntries(
          Object.entries({ title, body, ...extraData }).map(([k, v]) => [k, String(v)]),
        ),
        android: { priority: 'HIGH' },
      },
    };

    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10_000,
      validateStatus: () => true,
    });

    if (res.status >= 200 && res.status < 300) {
      sent++;
      continue;
    }

    failed++;
    if (isInvalidV1Error(res.status, res.data)) {
      invalidTokens.push(token);
    }
  }

  return { sent, failed, invalidTokens };
}

async function sendFcmLegacy(
  serverKey: string,
  tokens: string[],
  title: string,
  body: string,
  extraData: Record<string, string>,
): Promise<FcmSendResult> {
  const payload = {
    registration_ids: tokens,
    notification: { title, body },
    data: { title, body, ...extraData },
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

  const responseBody = res.data as {
    success?: number;
    failure?: number;
    results?: Array<{ error?: string }>;
  };

  const invalidTokens: string[] = [];
  const results = responseBody.results ?? [];
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
    sent: Number(responseBody.success) || 0,
    failed: Number(responseBody.failure) || 0,
    invalidTokens,
  };
}

export async function sendFcmNotification(
  transport: FcmTransportConfig,
  tokens: string[],
  title: string,
  body: string,
  extraData: Record<string, string> = {},
): Promise<FcmSendResult> {
  if (!tokens.length || transport.mode === 'none') {
    return { sent: 0, failed: 0, invalidTokens: [] };
  }

  if (transport.mode === 'v1') {
    return sendFcmV1(transport, tokens, title, body, extraData);
  }

  return sendFcmLegacy(transport.serverKey, tokens, title, body, extraData);
}
