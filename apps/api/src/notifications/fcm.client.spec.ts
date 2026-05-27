import axios from 'axios';
import { resolveFcmTransport, sendFcmNotification } from './fcm.client';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('resolveFcmTransport', () => {
  it('prefers v1 when project and service account env are set', () => {
    const transport = resolveFcmTransport((key) => {
      if (key === 'FIREBASE_PROJECT_ID') return 'my-project';
      if (key === 'FIREBASE_CLIENT_EMAIL') return 'firebase@my-project.iam.gserviceaccount.com';
      if (key === 'FIREBASE_PRIVATE_KEY') return '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----';
      return undefined;
    });
    expect(transport.mode).toBe('v1');
  });

  it('falls back to legacy server key', () => {
    const transport = resolveFcmTransport((key) =>
      key === 'FCM_SERVER_KEY' ? 'legacy-key' : undefined,
    );
    expect(transport).toEqual({ mode: 'legacy', serverKey: 'legacy-key' });
  });
});

describe('sendFcmNotification', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns zero counts for empty token list', async () => {
    const result = await sendFcmNotification(
      { mode: 'legacy', serverKey: 'key' },
      [],
      'Hi',
      'Body',
    );
    expect(result).toEqual({ sent: 0, failed: 0, invalidTokens: [] });
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('posts to legacy FCM and maps invalid registration tokens', async () => {
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: {
        success: 1,
        failure: 2,
        results: [{}, { error: 'InvalidRegistration' }, { error: 'NotRegistered' }],
      },
    });

    const result = await sendFcmNotification(
      { mode: 'legacy', serverKey: 'test-key' },
      ['ok', 'bad1', 'bad2'],
      'Title',
      'Body',
    );

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://fcm.googleapis.com/fcm/send',
      expect.objectContaining({
        registration_ids: ['ok', 'bad1', 'bad2'],
      }),
      expect.any(Object),
    );
    expect(result.invalidTokens).toEqual(['bad1', 'bad2']);
  });

  it('posts to FCM HTTP v1 per device token', async () => {
    mockedAxios.post.mockResolvedValue({ status: 200, data: { name: 'projects/x/messages/1' } });

    const result = await sendFcmNotification(
      {
        mode: 'v1',
        projectId: 'plant-care-test',
        getAccessToken: async () => 'oauth-token',
      },
      ['device-a'],
      'Title',
      'Body',
      { route: '/garden/tasks' },
    );

    expect(result.sent).toBe(1);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://fcm.googleapis.com/v1/projects/plant-care-test/messages:send',
      expect.objectContaining({
        message: expect.objectContaining({ token: 'device-a' }),
      }),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer oauth-token' }),
      }),
    );
  });
});
