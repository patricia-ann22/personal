'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { getUserByPassword, type User } from '@/lib/users';

export default function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = getUserByPassword(password.trim());
    if (user) {
      onLogin(user);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className={`w-full max-w-xs animate-fade-up ${shake ? 'animate-[shake_0.5s]' : ''}`}>
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900">
            <Lock className="h-7 w-7 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-light tracking-tight text-neutral-900">Us</h1>
          <p className="mt-2 text-sm text-neutral-400">Enter your password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            placeholder="Password"
            autoFocus
            className={`w-full rounded-xl border bg-neutral-50 px-4 py-3.5 text-center text-base text-neutral-900 outline-none transition-all placeholder:text-neutral-300 focus:bg-white focus:ring-2 ${
              error
                ? 'border-red-300 ring-2 ring-red-100'
                : 'border-neutral-200 focus:ring-neutral-900/10 focus:border-neutral-300'
            }`}
          />
          {error && (
            <p className="text-center text-sm text-red-400">Wrong password. Try again.</p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-neutral-900 py-3.5 text-sm font-medium text-white transition-all hover:bg-neutral-800 active:scale-[0.98]"
          >
            Enter
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-neutral-300">
          <span className="font-guy">Cutie</span>
          <span className="text-neutral-200">&</span>
          <span className="font-girl font-medium">Tough Honey</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
