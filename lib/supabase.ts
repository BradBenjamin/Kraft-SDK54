import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual keys from Supabase Settings > API
const supabaseUrl = 'https://nupohgrujcfuumjphofy.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51cG9oZ3J1amNmdXVtanBob2Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NTcxODEsImV4cCI6MjA5NjEzMzE4MX0.de0CieQw_jm9WF9hlgZ4BuNVT4j-_0GSMJg7AyXRV6o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});