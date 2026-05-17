import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.plantcare.app',
  appName: 'Plant Care',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
