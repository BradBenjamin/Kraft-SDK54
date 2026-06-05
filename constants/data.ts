export const COLORS = {
  background: '#12142B', // Main deep navy background
  cardBg: '#1D203E',     // Lighter navy for cards/inputs
  orange: '#D55B45',     // Primary accent
  textDark: '#FFFFFF',   // Reverted for dark mode (Titles)
  textLight: '#8F93A8',  // Subtitles
  lightGray: '#2B2F4E',  // Dividers/Input borders
  white: '#FFFFFF',
  green: '#4CAF50',
  darkBlue: '#12142B',   // Legacy alias mapped to new background
};

// Types matching your Supabase Tables
export interface Category {
  id: number;
  name: string;
  icon: string;
  image: string;
}

export interface Tasker {
  id: number;
  name: string;
  rating: number;
  reviews: number;
  tasks: number;
  tags: string[]; // Supabase returns this as an array
  rate: number;
  is_online: boolean;
  image: string;
}