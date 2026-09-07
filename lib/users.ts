export type User = 'cutie' | 'tough_honey';

export const USERS: Record<User, { name: string; password: string; color: string; font: string }> = {
  cutie: {
    name: 'Cutie',
    password: 'cutie',
    color: 'cutie',
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
  if (password === USERS.cutie.password) return 'cutie';
  if (password === USERS.tough_honey.password) return 'tough_honey';
  return null;
}
