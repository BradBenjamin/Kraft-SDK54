import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual keys from Supabase Settings > API
const supabaseUrl = 'https://xwbivkfueyhijvftwvny.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3Yml2a2Z1ZXloaWp2ZnR3dm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMTEzOTAsImV4cCI6MjA4MjY4NzM5MH0.3F0zpG7c9awvXGY-Yx6voshMP7QfGgnnXKOUDClZuAk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});