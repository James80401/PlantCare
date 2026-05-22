import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Placeholder for native push registration. Mobile shells should call
 * `devicesApi.register(token, platform)` after obtaining a token from
 * `@capacitor/push-notifications` (see docs/operations/push-notifications.md).
 */
export function useRegisterPushDevice(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !Capacitor.isNativePlatform()) return;
    if (import.meta.env.DEV) {
      console.debug(
        '[push] Native platform detected — register device token via Capacitor push plugin.',
      );
    }
  }, [enabled]);
}
