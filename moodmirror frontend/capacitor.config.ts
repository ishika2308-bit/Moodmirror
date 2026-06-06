import type { CapacitorConfig } from '@capacitor/cli';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

const config: CapacitorConfig = {
  appId: 'com.sunshine.moodmirror',
  appName: 'moodmirror',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: process.env.VITE_GOOGLE_CLIENT_ID || '',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
