import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.zlon.app',
  appName: 'ZLon',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
};

export default config;
