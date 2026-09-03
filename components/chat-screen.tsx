'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ImageIcon, Video, Gift, Plus, Trash2, Calendar } from 'lucide-react';
import { USERS, type User } from '@/lib/users';
import BonusModal, { type BonusEntry } from './bonus-modal';
import MemoryModal, { type Memory } from './memory-modal';

interface Message {
  id: string;
  sender: User;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
}

// Client-side id generator; swap for a real DB id when wired up.
const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function ChatScreen({
  currentUser,
  onLogout,
}: {
  currentUser: User;
  onLogout: () => void;
}) {
  const otherUser: User = currentUser === 'emerald' ? 'tough_honey' : 'emerald';
  const userMeta = USERS[currentUser];
  const otherMeta = USERS[otherUser];

  const [messages, setMessages] = useState<Message[]>([]);
  const [bonusEntries, setBonusEntries] = useState<BonusEntry[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bonusOpen, setBonusOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [initialMemory, setInitialMemory] = useState<Memory | null>(null);
  const [bonusPulse, setBonusPulse] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<Message | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [viewportHeight, setViewportHeight] = useState('100vh');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const isGirl = currentUser === 'tough_honey';
  const myFont = isGirl ? 'font-girl' : 'font-guy';

  const myTotalBonus = bonusEntries
    .filter((e) => e.receiver === currentUser)
    .reduce((sum, e) => sum + e.points, 0);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const onResize = () => {
      setViewportHeight(`${vv.height}px`);
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    onResize();
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const deleteMessage = useCallback((msg: Message) => {
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
  }, []);

  const sendText = () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setMessages((prev) => [
      ...prev,
      {
        id: newId(),
        sender: currentUser,
        content: text.trim(),
        media_url: null,
        media_type: null,
        created_at: new Date().toISOString(),
      },
    ]);
    setText('');
    setSending(false);
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    mediaType: 'image' | 'video',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploading(true);
    const mediaUrl = URL.createObjectURL(file);
    setMessages((prev) => [
      ...prev,
      {
        id: newId(),
        sender: currentUser,
        content: null,
        media_url: mediaUrl,
        media_type: mediaType,
        created_at: new Date().toISOString(),
      },
    ]);
    setUploading(false);
  };

  const addBonus = (entry: Omit<BonusEntry, 'id' | 'created_at'>) => {
    setBonusEntries((prev) => [
      ...prev,
      { ...entry, id: newId(), created_at: new Date().toISOString() },
    ]);
    if (entry.receiver === currentUser) {
      setBonusPulse(true);
      setTimeout(() => setBonusPulse(false), 400);
    }
  };

  const addMemory = (mem: Omit<Memory, 'id' | 'created_at'>) => {
    setMemories((prev) => [
      { ...mem, id: newId(), created_at: new Date().toISOString() },
      ...prev,
    ]);
  };

  const deleteMemory = (mem: Memory) => {
    setMemories((prev) => prev.filter((m) => m.id !== mem.id));
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const isMyMessage = (sender: User) => sender === currentUser;

  return (
    <div
      className="flex flex-col bg-white"
      style={{ height: viewportHeight }}
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <button
          onClick={() => setMemoryOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1.5 transition-all active:scale-95"
        >
          <Calendar className="h-3.5 w-3.5 text-white" />
          <span className="text-sm font-bold text-white">Memory</span>
        </button>

        <div className="flex flex-col items-center">
          <span className={`text-sm font-semibold ${otherMeta.font} text-neutral-900`}>
            {otherMeta.name}
          </span>
          <button
            onClick={onLogout}
            className="text-[10px] text-neutral-300 transition-colors hover:text-neutral-500"
          >
            sign out
          </button>
        </div>

        <button
          onClick={() => setBonusOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1.5 transition-all active:scale-95"
        >
          <Gift className="h-3.5 w-3.5 text-white" />
          <span
            className={`text-sm font-bold tabular-nums text-white ${bonusPulse ? 'animate-count-pulse' : ''}`}
          >
            {myTotalBonus > 0 ? '+' : ''}
            {myTotalBonus}
          </span>
        </button>
      </header>

      {memories.length > 0 && (
        <div className="border-b border-neutral-100 bg-amber-50/50 px-4 py-2">
          <div className="mx-auto flex max-w-md gap-2 overflow-x-auto memory-scroll pb-1">
            {memories.map((mem) => {
              const creatorMeta = USERS[mem.creator];
              return (
                <button
                  key={mem.id}
                  onClick={() => {
                    setInitialMemory(mem);
                    setMemoryOpen(true);
                  }}
                  className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-white/80 px-2.5 py-1.5 shadow-sm transition-all hover:bg-white active:scale-95"
                >
                  {mem.media_url && mem.media_type === 'image' ? (
                    <img src={mem.media_url} alt="" className="h-7 w-7 flex-shrink-0 rounded-md object-cover" />
                  ) : mem.media_url && mem.media_type === 'video' ? (
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-neutral-100">
                      <Video className="h-3.5 w-3.5 text-neutral-400" />
                    </div>
                  ) : (
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-neutral-100">
                      <Calendar className="h-3.5 w-3.5 text-amber-400" />
                    </div>
                  )}
                  <span className={`max-w-[100px] truncate text-xs font-medium text-neutral-700 ${creatorMeta.font}`}>
                    {mem.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-md space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center pt-20 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
                <Send className="h-6 w-6 text-neutral-300" />
              </div>
              <p className="text-sm text-neutral-400">Say hi to {otherMeta.name}</p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const mine = isMyMessage(msg.sender);
            const senderMeta = USERS[msg.sender];
            const prevMsg = messages[idx - 1];
            const showAvatar = !prevMsg || prevMsg.sender !== msg.sender;

            return (
              <div
                key={msg.id}
                className={`flex animate-message-in items-end gap-2 ${
                  mine ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div className="w-7 flex-shrink-0">
                  {showAvatar && (
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                        msg.sender === 'tough_honey' ? 'bg-rose-400' : 'bg-emerald-500'
                      } ${senderMeta.font}`}
                    >
                      {senderMeta.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div
                  className={`group relative max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    mine
                      ? msg.sender === 'tough_honey'
                        ? 'bg-rose-50 text-neutral-900 rounded-br-md'
                        : 'bg-emerald-50 text-neutral-900 rounded-br-md'
                      : 'bg-neutral-100 text-neutral-900 rounded-bl-md'
                  } ${senderMeta.font}`}
                >
                  {msg.media_type === 'image' && msg.media_url && (
                    <img
                      src={msg.media_url}
                      alt="shared photo"
                      className="mb-1 max-w-full cursor-pointer rounded-xl"
                      onClick={() => setPreviewMedia(msg)}
                    />
                  )}
                  {msg.media_type === 'video' && msg.media_url && (
                    <video
                      src={msg.media_url}
                      controls
                      playsInline
                      className="mb-1 max-w-full rounded-xl"
                    />
                  )}
                  {msg.content && (
                    <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                      {msg.content}
                    </p>
                  )}
                  <p className="mt-1 text-right text-[10px] text-neutral-400">
                    {formatTime(msg.created_at)}
                  </p>
                  {mine && (
                    <button
                      onClick={() => setDeleteTarget(msg)}
                      className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-neutral-500 opacity-0 shadow-sm transition-all hover:bg-red-100 hover:text-red-500 group-hover:opacity-100 active:scale-90"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {uploading && (
            <div className="flex justify-center">
              <div className="rounded-full bg-neutral-100 px-4 py-2 text-xs text-neutral-400">
                Uploading...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-neutral-100 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'image')}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'video')}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => videoInputRef.current?.click()}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          >
            <Video className="h-5 w-5" />
          </button>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendText();
              }
            }}
            placeholder="Message"
            className={`flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-[15px] text-neutral-900 outline-none transition-all placeholder:text-neutral-300 focus:border-neutral-300 focus:bg-white focus:ring-1 focus:ring-neutral-200 ${myFont}`}
          />

          <button
            onClick={sendText}
            disabled={!text.trim() || sending}
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-30 ${
              isGirl ? 'bg-rose-400 hover:bg-rose-500' : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      <BonusModal
        open={bonusOpen}
        onClose={() => setBonusOpen(false)}
        currentUser={currentUser}
        otherUser={otherUser}
        entries={bonusEntries}
        onSubmit={addBonus}
      />

      <MemoryModal
        open={memoryOpen}
        onClose={() => { setMemoryOpen(false); setInitialMemory(null); }}
        currentUser={currentUser}
        initialMemory={initialMemory}
        memories={memories}
        onAdd={addMemory}
        onDelete={deleteMemory}
      />

      {previewMedia && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreviewMedia(null)}
        >
          <button className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
            <Plus className="h-5 w-5 rotate-45" />
          </button>
          <img
            src={previewMedia.media_url!}
            alt="full size"
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-xs animate-fade-up rounded-3xl bg-white p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <Trash2 className="h-6 w-6 text-red-400" />
            </div>
            <p className="mb-1 text-base font-medium text-neutral-900">Delete message?</p>
            <p className="mb-6 text-sm text-neutral-400">This can't be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl bg-neutral-100 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteTarget) deleteMessage(deleteTarget);
                  setDeleteTarget(null);
                }}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
