'use client';

import { useState, useEffect } from 'react';
import { Plus, Minus, X, Heart, Frown } from 'lucide-react';
import { USERS, type User } from '@/lib/users';

export interface BonusEntry {
  id: string;
  giver: User;
  receiver: User;
  points: number;
  reason: string | null;
  created_at: string;
}

export default function BonusModal({
  open,
  onClose,
  currentUser,
  otherUser,
  entries,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  currentUser: User;
  otherUser: User;
  entries: BonusEntry[];
  onSubmit: (entry: Omit<BonusEntry, 'id' | 'created_at'>) => void;
}) {
  const [mode, setMode] = useState<'add' | 'reduce'>('add');
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<'given' | 'received'>('received');

  useEffect(() => {
    if (open) {
      setMode('add');
      setAmount(1);
      setReason('');
      setTab('received');
    }
  }, [open]);

  if (!open) return null;

  const otherMeta = USERS[otherUser];
  const isGirl = otherUser === 'tough_honey';

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const pts = mode === 'add' ? amount : -amount;
    onSubmit({
      giver: currentUser,
      receiver: otherUser,
      points: pts,
      reason: reason.trim() || null,
    });
    setSubmitting(false);
    onClose();
  };

  const myAwardedTotal = entries
    .filter((e) => e.giver === currentUser && e.receiver === otherUser)
    .reduce((sum, e) => sum + e.points, 0);

  const myReceivedTotal = entries
    .filter((e) => e.giver === otherUser && e.receiver === currentUser)
    .reduce((sum, e) => sum + e.points, 0);

  const givenEntries = entries
    .filter((e) => e.giver === currentUser && e.receiver === otherUser)
    .slice(-10)
    .reverse();

  const receivedEntries = entries
    .filter((e) => e.giver === otherUser && e.receiver === currentUser)
    .slice(-10)
    .reverse();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    const diffD = Math.floor(diffH / 24);
    if (diffD > 0) return `${diffD}d ago`;
    if (diffH > 0) return `${diffH}h ago`;
    const diffM = Math.floor(diffMs / (1000 * 60));
    if (diffM > 0) return `${diffM}m ago`;
    return 'just now';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center">
      <div
        className="w-full max-w-md animate-fade-up rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
      >
        {/* Handle bar */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-200 sm:hidden" />

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-400">Bonus Points</p>
            <h2 className={`text-xl font-semibold ${otherMeta.font} text-neutral-900`}>
              {otherMeta.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 transition-colors hover:bg-neutral-200"
          >
            <X className="h-4 w-4 text-neutral-500" />
          </button>
        </div>

        {/* Two totals: received and given */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-neutral-50 px-4 py-3">
            <span className="block text-xs text-neutral-400">You've received</span>
            <span
              className={`text-lg font-bold tabular-nums ${
                myReceivedTotal > 0
                  ? 'text-emerald-500'
                  : myReceivedTotal < 0
                  ? 'text-rose-400'
                  : 'text-neutral-400'
              }`}
            >
              {myReceivedTotal > 0 ? '+' : ''}
              {myReceivedTotal} pts
            </span>
          </div>
          <div className="rounded-2xl bg-neutral-50 px-4 py-3">
            <span className="block text-xs text-neutral-400">You've awarded</span>
            <span
              className={`text-lg font-bold tabular-nums ${
                myAwardedTotal > 0
                  ? 'text-emerald-500'
                  : myAwardedTotal < 0
                  ? 'text-rose-400'
                  : 'text-neutral-400'
              }`}
            >
              {myAwardedTotal > 0 ? '+' : ''}
              {myAwardedTotal} pts
            </span>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-neutral-100 p-1">
          <button
            onClick={() => setMode('add')}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium transition-all ${
              mode === 'add'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-neutral-400'
            }`}
          >
            <Heart className="h-4 w-4" />
            Add
          </button>
          <button
            onClick={() => setMode('reduce')}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium transition-all ${
              mode === 'reduce'
                ? 'bg-white text-rose-500 shadow-sm'
                : 'text-neutral-400'
            }`}
          >
            <Frown className="h-4 w-4" />
            Reduce
          </button>
        </div>

        {/* Amount selector */}
        <div className="mb-5">
          <p className="mb-2 text-xs text-neutral-400">Amount</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setAmount((a) => Math.max(1, a - 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 transition-all hover:bg-neutral-200 active:scale-95"
            >
              <Minus className="h-5 w-5 text-neutral-600" />
            </button>
            <div className="flex min-w-[80px] items-center justify-center">
              <span
                className={`text-4xl font-bold tabular-nums ${
                  mode === 'add' ? 'text-emerald-500' : 'text-rose-400'
                }`}
              >
                {mode === 'add' ? '+' : '−'}
                {amount}
              </span>
            </div>
            <button
              onClick={() => setAmount((a) => Math.min(50, a + 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 transition-all hover:bg-neutral-200 active:scale-95"
            >
              <Plus className="h-5 w-5 text-neutral-600" />
            </button>
          </div>
        </div>

        {/* Reason */}
        <div className="mb-5">
          <p className="mb-2 text-xs text-neutral-400">Reason (optional)</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={mode === 'add' ? 'What made you happy?' : 'What made you upset?'}
            rows={2}
            className={`w-full resize-none rounded-2xl border bg-neutral-50 px-4 py-3 text-sm outline-none transition-all placeholder:text-neutral-300 focus:bg-white focus:ring-2 ${
              isGirl
                ? 'font-girl border-rose-100 focus:ring-rose-200 focus:border-rose-200'
                : 'font-guy border-emerald-100 focus:ring-emerald-200 focus:border-emerald-200'
            }`}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full rounded-2xl py-3.5 text-sm font-medium text-white transition-all active:scale-[0.98] disabled:opacity-50 ${
            mode === 'add' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-400 hover:bg-rose-500'
          }`}
        >
          {submitting ? 'Saving...' : `${mode === 'add' ? 'Add' : 'Reduce'} ${amount} point${amount > 1 ? 's' : ''}`}
        </button>

        {/* History tabs */}
        <div className="mt-6 border-t border-neutral-100 pt-4">
          <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl bg-neutral-100 p-1">
            <button
              onClick={() => setTab('received')}
              className={`rounded-lg py-2 text-xs font-medium transition-all ${
                tab === 'received' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400'
              }`}
            >
              From {otherMeta.name}
            </button>
            <button
              onClick={() => setTab('given')}
              className={`rounded-lg py-2 text-xs font-medium transition-all ${
                tab === 'given' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400'
              }`}
            >
              You gave
            </button>
          </div>

          <div className="space-y-2">
            {tab === 'received' && receivedEntries.length === 0 && (
              <p className="py-4 text-center text-sm text-neutral-300">
                No points from {otherMeta.name} yet
              </p>
            )}
            {tab === 'given' && givenEntries.length === 0 && (
              <p className="py-4 text-center text-sm text-neutral-300">
                You haven't given any points yet
              </p>
            )}
            {tab === 'received' &&
              receivedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-xl bg-neutral-50 px-3 py-2.5"
                >
                  <span
                    className={`mt-0.5 text-sm font-bold tabular-nums ${
                      entry.points > 0 ? 'text-emerald-500' : 'text-rose-400'
                    }`}
                  >
                    {entry.points > 0 ? '+' : ''}
                    {entry.points}
                  </span>
                  <div className="flex-1">
                    {entry.reason ? (
                      <p className="text-sm text-neutral-700">{entry.reason}</p>
                    ) : (
                      <p className="text-sm italic text-neutral-300">No reason given</p>
                    )}
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {formatDate(entry.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            {tab === 'given' &&
              givenEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-xl bg-neutral-50 px-3 py-2.5"
                >
                  <span
                    className={`mt-0.5 text-sm font-bold tabular-nums ${
                      entry.points > 0 ? 'text-emerald-500' : 'text-rose-400'
                    }`}
                  >
                    {entry.points > 0 ? '+' : ''}
                    {entry.points}
                  </span>
                  <div className="flex-1">
                    {entry.reason ? (
                      <p className="text-sm text-neutral-700">{entry.reason}</p>
                    ) : (
                      <p className="text-sm italic text-neutral-300">No reason given</p>
                    )}
                    <p className="mt-0.5 text-xs text-neutral-400">
                      to {otherMeta.name} · {formatDate(entry.created_at)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
