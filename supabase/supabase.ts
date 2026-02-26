import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// expoConfig.extra is where app.config.js injects env vars when running under Expo
const expoExtra =
  (Constants.expoConfig && (Constants.expoConfig as any).extra) ||
  (Constants.manifest && (Constants.manifest as any).extra) ||
  {};

const supabaseUrl = expoExtra.SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabasePublishableKey = expoExtra.PUBLISHABLE_KEY ?? process.env.PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase credentials: set SUPABASE_URL and PUBLISHABLE_KEY in .env or app.json extra.'
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});