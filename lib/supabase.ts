import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = 'emerald' | 'tough_honey';

export const USERS: Record<User, { name: string; password: string; color: string; font: string }> = {
  emerald: {
    name: 'Emerald',
    password: 'betterone',
    color: 'emerald',
    font: 'font-guy',
  },
  tough_honey: {
    name: 'Tough Honey',
    password: 'bettertwo',
    color: 'rose',
    font: 'font-girl',
  },
};

export function getUserByPassword(password: string): User | null {
  if (password === USERS.emerald.password) return 'emerald';
  if (password === USERS.tough_honey.password) return 'tough_honey';
  return null;
}
