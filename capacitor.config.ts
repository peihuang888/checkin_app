import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.checkin.app',
  appName: '微信打卡助手',
  webDir: 'dist/client',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FF6B4A',
    },
  },
};

export default config;
