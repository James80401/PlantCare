import axios from 'axios';
import { sendFcmNotification } from './fcm.client';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('sendFcmNotification', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns zero counts for empty token list', async () => {
    const result = await sendFcmNotification('key', [], 'Hi', 'Body');
    expect(result).toEqual({ sent: 0, failed: 0, invalidTokens: [] });
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('posts to FCM and maps invalid registration tokens', async () => {
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: {
        success: 1,
        failure: 2,
        results: [{}, { error: 'InvalidRegistration' }, { error: 'NotRegistered' }],
      },
    });

    const result = await sendFcmNotification(
      'test-key',
      ['ok', 'bad1', 'bad2'],
      'Title',
      'Body',
    );

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://fcm.googleapis.com/fcm/send',
      expect.objectContaining({
        registration_ids: ['ok', 'bad1', 'bad2'],
        notification: { title: 'Title', body: 'Body' },
      }),
      expect.objectContaining({
        headers: { Authorization: 'key=test-key', 'Content-Type': 'application/json' },
      }),
    );
    expect(result.sent).toBe(1);
    expect(result.failed).toBe(2);
    expect(result.invalidTokens).toEqual(['bad1', 'bad2']);
  });

  it('throws on non-2xx FCM response', async () => {
    mockedAxios.post.mockResolvedValue({ status: 401, data: { error: 'Unauthorized' } });
    await expect(sendFcmNotification('bad', ['t1'], 'T', 'B')).rejects.toThrow('FCM HTTP 401');
  });
});
