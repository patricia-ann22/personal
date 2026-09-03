'use client';

import { useState, useEffect } from 'react';
import LoginScreen from '@/components/login-screen';
import ChatScreen from '@/components/chat-screen';
import type { User } from '@/lib/users';

const STORAGE_KEY = 'us-current-user';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY) : null;
    if (saved === 'emerald' || saved === 'tough_honey') {
      setUser(saved);
    }
    setHydrated(true);
  }, []);

  const handleLogin = (u: User) => {
    sessionStorage.setItem(STORAGE_KEY, u);
    setUser(u);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  if (!hydrated) {
    return <div className="flex min-h-screen items-center justify-center bg-white" />;
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <ChatScreen currentUser={user} onLogout={handleLogout} />;
}
