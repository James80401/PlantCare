import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { usersApi } from '../services/api';
import { registerPushNative } from '../lib/registerPushNative';

/**
 * Registers device push token on native when the user has push notifications enabled.
 */
export function useRegisterPushDevice(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !Capacitor.isNativePlatform()) return;

    let cancelled = false;

    usersApi
      .me()
      .then(({ data }) => {
        if (cancelled || !data.notifyPush) return;
        return registerPushNative();
      })
      .then((ok) => {
        if (ok && import.meta.env.DEV) {
          console.debug('[push] Device token registered with API');
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [enabled]);
}
