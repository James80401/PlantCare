import { Capacitor } from '@capacitor/core';
import { devicesApi } from '../services/api';
import { getStoredPushToken, setStoredPushToken } from './pushTokenStorage';

let registering = false;

/** Register FCM/APNs token with the API (native Capacitor only). */
export async function registerPushNative(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || registering) return false;
  registering = true;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt') {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== 'granted') return false;

    const existing = getStoredPushToken();
    if (existing) {
      try {
        await devicesApi.register(existing, Capacitor.getPlatform());
        return true;
      } catch {
        /* re-register below */
      }
    }

    return await new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (ok: boolean) => {
        if (settled) return;
        settled = true;
        resolve(ok);
      };

      const regHandle = PushNotifications.addListener('registration', async (ev) => {
        if (!ev.value) {
          finish(false);
          return;
        }
        try {
          await devicesApi.register(ev.value, Capacitor.getPlatform());
          setStoredPushToken(ev.value);
          finish(true);
        } catch {
          finish(false);
        } finally {
          void regHandle.then((h) => h.remove());
          void errHandle.then((h) => h.remove());
        }
      });

      const errHandle = PushNotifications.addListener('registrationError', () => {
        void regHandle.then((h) => h.remove());
        void errHandle.then((h) => h.remove());
        finish(false);
      });

      void PushNotifications.register();

      window.setTimeout(() => finish(false), 12_000);
    });
  } catch {
    return false;
  } finally {
    registering = false;
  }
}
