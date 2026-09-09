import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.centra.app',
  appName: 'Centra',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
