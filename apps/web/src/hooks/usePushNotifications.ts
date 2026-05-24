import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../services/api';
import { registerPushNative } from '../lib/registerPushNative';
import { unregisterPushNative } from '../lib/unregisterPushNative';

function routeFromNotificationData(data: Record<string, unknown> | undefined): string | null {
  const route = data?.route;
  return typeof route === 'string' && route.startsWith('/') ? route : null;
}

async function shouldRegisterPush(): Promise<boolean> {
  try {
    const { data } = await usersApi.me();
    return Boolean(data.notifyPush);
  } catch {
    return false;
  }
}

/**
 * Native push: register token, re-register on app resume, handle notification taps.
 */
export function usePushNotifications(authReady: boolean) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!authReady || !Capacitor.isNativePlatform()) return;

    let cancelled = false;

    const tryRegister = async () => {
      if (cancelled) return;
      if (!(await shouldRegisterPush())) return;
      await registerPushNative();
    };

    void tryRegister();

    let resumeHandle: { remove: () => void } | undefined;
    void App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void tryRegister();
    }).then((h) => {
      resumeHandle = h;
    });

    let receivedHandle: { remove: () => void } | undefined;
    let actionHandle: { remove: () => void } | undefined;

    void import('@capacitor/push-notifications').then(({ PushNotifications }) => {
      if (cancelled) return;

      void PushNotifications.addListener('pushNotificationReceived', (n) => {
        if (import.meta.env.DEV) {
          console.debug('[push] received', n.title, n.data);
        }
      }).then((h) => {
        receivedHandle = h;
      });

      void PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const route = routeFromNotificationData(
          action.notification.data as Record<string, unknown> | undefined,
        );
        if (route) navigate(route);
      }).then((h) => {
        actionHandle = h;
      });
    });

    return () => {
      cancelled = true;
      resumeHandle?.remove();
      receivedHandle?.remove();
      actionHandle?.remove();
    };
  }, [authReady, navigate]);
}

export { registerPushNative, unregisterPushNative, shouldRegisterPush };
