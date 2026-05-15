import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qbelgyhzdjexhlrvttxc.supabase.co';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZWxneWh6ZGpleGhscnZ0dHhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMjQyMjMsImV4cCI6MjA5MjkwMDIyM30.UfLcVyR3fhJwpA4ii7ysW2XtMKVlU-fgWz_Y6iDT8z4';
const isWebServer = Platform.OS === 'web' && typeof window === 'undefined';

const serverStorage = {
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined,
};

export const hasSupabaseConfig = Boolean(url && anonKey);

export const supabase = hasSupabaseConfig
  ? createClient(url, anonKey, {
      auth: {
        storage: isWebServer ? serverStorage : AsyncStorage,
        autoRefreshToken: !isWebServer,
        persistSession: !isWebServer,
        detectSessionInUrl: Platform.OS === 'web' && !isWebServer,
      },
    })
  : null;
