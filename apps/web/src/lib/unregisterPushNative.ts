import { Capacitor } from '@capacitor/core';
import { devicesApi } from '../services/api';
import { clearStoredPushToken, getStoredPushToken } from './pushTokenStorage';

/** Remove this device's push token from the API (logout / push disabled). */
export async function unregisterPushNative(): Promise<void> {
  const token = getStoredPushToken();
  if (!token) return;

  try {
    if (Capacitor.isNativePlatform()) {
      await devicesApi.unregister(token);
    }
  } catch {
    /* token may already be gone */
  } finally {
    clearStoredPushToken();
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      await PushNotifications.removeAllListeners();
    } catch {
      /* plugin unavailable */
    }
  }
}
