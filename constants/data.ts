export const COLORS = {
  darkBlue: '#1F2041',
  orange: '#D35D47',
  beige: '#FDFCF8',
  lightGray: '#F4F4F4',
  textDark: '#1a1a2e',
  textLight: '#888888',
  white: '#FFFFFF',
  green: '#9CBF78',
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