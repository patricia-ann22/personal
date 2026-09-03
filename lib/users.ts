export type User = 'emerald' | 'tough_honey';

export const USERS: Record<User, { name: string; password: string; color: string; font: string }> = {
  emerald: {
    name: 'Emerald',
    password: 'emerald',
    color: 'emerald',
    font: 'font-guy',
  },
  tough_honey: {
    name: 'Tough Honey',
    password: 'toughhoney',
    color: 'rose',
    font: 'font-girl',
  },
};

export function getUserByPassword(password: string): User | null {
  if (password === USERS.emerald.password) return 'emerald';
  if (password === USERS.tough_honey.password) return 'tough_honey';
  return null;
}
