'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Calendar, Plus, ImageIcon, Video, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { supabase, USERS, type User } from '@/lib/supabase';

export interface Memory {
  id: string;
  creator: User;
  title: string;
  description: string | null;
  memory_date: string;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function MemoryModal({
  open,
  onClose,
  currentUser,
  initialMemory,
}: {
  open: boolean;
  onClose: () => void;
  currentUser: User;
  initialMemory?: Memory | null;
}) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [view, setView] = useState<'calendar' | 'add' | 'detail'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [detailMemory, setDetailMemory] = useState<Memory | null>(null);

  // Add form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [addDate, setAddDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedType, setUploadedType] = useState<'image' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (initialMemory) {
        setDetailMemory(initialMemory);
        setView('detail');
      } else {
        setView('calendar');
        setDetailMemory(null);
      }
      setSelectedDate(null);
      loadMemories();
    }
  }, [open, initialMemory]);

  useEffect(() => {
    if (!open) return;
    const channel = supabase
      .channel(`memories-realtime-${currentUser}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'memories' },
        (payload) => {
          setMemories((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as Memory];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'memories' },
        (payload) => {
          const deletedId = payload.old.id;
          setMemories((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, currentUser]);

  const loadMemories = async () => {
    const { data } = await supabase.from('memories').select('*').order('memory_date', { ascending: false });
    if (data) setMemories(data as Memory[]);
  };

  const isGirl = currentUser === 'tough_honey';
  const myFont = isGirl ? 'font-girl' : 'font-guy';

  // Build calendar grid
  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  // Map dates to memories
  const memoriesByDate = new Map<string, Memory[]>();
  memories.forEach((m) => {
    const key = m.memory_date;
    if (!memoriesByDate.has(key)) memoriesByDate.set(key, []);
    memoriesByDate.get(key)!.push(m);
  });

  const todayStr = new Date().toISOString().slice(0, 10);

  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, mediaType: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploading(true);
    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `memories/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
    setUploadedUrl(urlData.publicUrl);
    setUploadedType(mediaType);
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from('memories').insert({
      creator: currentUser,
      title: title.trim(),
      description: description.trim() || null,
      memory_date: addDate,
      media_url: uploadedUrl,
      media_type: uploadedType,
    });
    setSubmitting(false);
    if (!error) {
      resetForm();
      setView('calendar');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAddDate(new Date().toISOString().slice(0, 10));
    setUploadedUrl(null);
    setUploadedType(null);
  };

  const deleteMemory = useCallback(async (mem: Memory) => {
    const { error } = await supabase.from('memories').delete().eq('id', mem.id);
    if (!error) {
      setMemories((prev) => prev.filter((m) => m.id !== mem.id));
      if (mem.media_url) {
        try {
          const url = new URL(mem.media_url);
          const pathMatch = url.pathname.match(/\/media\/(.+)$/);
          if (pathMatch) supabase.storage.from('media').remove([pathMatch[1]]);
        } catch {
          // ignore
        }
      }
      setDetailMemory(null);
      setView('calendar');
    }
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  if (!open) return null;

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
            <p className="text-xs uppercase tracking-wider text-neutral-400">Memory Lane</p>
            <h2 className={`text-xl font-semibold ${myFont} text-neutral-900`}>
              {view === 'calendar' && 'Our Memories'}
              {view === 'add' && 'New Memory'}
              {view === 'detail' && 'Memory'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {view !== 'calendar' && (
              <button
                onClick={() => { setView('calendar'); setDetailMemory(null); }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 transition-colors hover:bg-neutral-200"
              >
                <ChevronLeft className="h-4 w-4 text-neutral-500" />
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 transition-colors hover:bg-neutral-200"
            >
              <X className="h-4 w-4 text-neutral-500" />
            </button>
          </div>
        </div>

        {/* CALENDAR VIEW */}
        {view === 'calendar' && (
          <>
            {/* Month navigation */}
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-semibold text-neutral-900">
                {MONTHS[calendarMonth]} {calendarYear}
              </span>
              <button
                onClick={nextMonth}
                className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Day headers */}
            <div className="mb-2 grid grid-cols-7 gap-1">
              {DAYS.map((d, i) => (
                <div key={i} className="text-center text-xs font-medium text-neutral-300">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((day, i) => {
                if (day === null) {
                  return <div key={i} className="aspect-square" />;
                }
                const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayMemories = memoriesByDate.get(dateStr) || [];
                const hasMemories = dayMemories.length > 0;
                const isToday = dateStr === todayStr;

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (hasMemories && dayMemories.length === 1) {
                        setDetailMemory(dayMemories[0]);
                        setView('detail');
                      } else if (hasMemories) {
                        setSelectedDate(dateStr);
                      } else {
                        setAddDate(dateStr);
                        setView('add');
                      }
                    }}
                    className={`relative flex aspect-square items-center justify-center rounded-lg text-sm transition-all ${
                      isToday
                        ? 'bg-neutral-900 font-bold text-white'
                        : hasMemories
                        ? 'bg-amber-50 font-medium text-amber-600 hover:bg-amber-100'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {day}
                    {hasMemories && !isToday && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Memories for selected date */}
            {selectedDate && (
              <div className="mt-4 border-t border-neutral-100 pt-4">
                <p className="mb-3 text-xs uppercase tracking-wider text-neutral-400">
                  {formatDate(selectedDate)}
                </p>
                <div className="space-y-2">
                  {(memoriesByDate.get(selectedDate) || []).map((mem) => {
                    const creatorMeta = USERS[mem.creator];
                    return (
                      <button
                        key={mem.id}
                        onClick={() => { setDetailMemory(mem); setView('detail'); }}
                        className="flex w-full items-center gap-3 rounded-xl bg-neutral-50 px-3 py-3 text-left transition-colors hover:bg-neutral-100"
                      >
                        {mem.media_url && mem.media_type === 'image' ? (
                          <img src={mem.media_url} alt="" className="h-12 w-12 flex-shrink-0 rounded-lg object-cover" />
                        ) : mem.media_url && mem.media_type === 'video' ? (
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-200">
                            <Video className="h-5 w-5 text-neutral-400" />
                          </div>
                        ) : (
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-200">
                            <Calendar className="h-5 w-5 text-neutral-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`truncate text-sm font-medium text-neutral-900 ${creatorMeta.font}`}>
                            {mem.title}
                          </p>
                          <p className="text-xs text-neutral-400">by {creatorMeta.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add memory button */}
            <button
              onClick={() => { resetForm(); setView('add'); }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-3.5 text-sm font-medium text-white transition-all hover:bg-neutral-800 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Add Memory
            </button>
          </>
        )}

        {/* ADD VIEW */}
        {view === 'add' && (
          <div className="space-y-5">
            {/* Date */}
            <div>
              <p className="mb-2 text-xs text-neutral-400">Date</p>
              <input
                type="date"
                value={addDate}
                onChange={(e) => setAddDate(e.target.value)}
                className={`w-full rounded-2xl border bg-neutral-50 px-4 py-3 text-sm outline-none transition-all focus:bg-white focus:ring-2 ${
                  isGirl
                    ? 'font-girl border-rose-100 focus:ring-rose-200'
                    : 'font-guy border-emerald-100 focus:ring-emerald-200'
                }`}
              />
            </div>

            {/* Title */}
            <div>
              <p className="mb-2 text-xs text-neutral-400">Title</p>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give this memory a title..."
                className={`w-full rounded-2xl border bg-neutral-50 px-4 py-3 text-sm outline-none transition-all placeholder:text-neutral-300 focus:bg-white focus:ring-2 ${
                  isGirl
                    ? 'font-girl border-rose-100 focus:ring-rose-200'
                    : 'font-guy border-emerald-100 focus:ring-emerald-200'
                }`}
              />
            </div>

            {/* Description */}
            <div>
              <p className="mb-2 text-xs text-neutral-400">Description (optional)</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened?"
                rows={2}
                className={`w-full resize-none rounded-2xl border bg-neutral-50 px-4 py-3 text-sm outline-none transition-all placeholder:text-neutral-300 focus:bg-white focus:ring-2 ${
                  isGirl
                    ? 'font-girl border-rose-100 focus:ring-rose-200'
                    : 'font-guy border-emerald-100 focus:ring-emerald-200'
                }`}
              />
            </div>

            {/* Media upload */}
            <div>
              <p className="mb-2 text-xs text-neutral-400">Photo or Video (optional)</p>
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

              {uploadedUrl ? (
                <div className="relative rounded-2xl bg-neutral-50 p-2">
                  {uploadedType === 'image' ? (
                    <img src={uploadedUrl} alt="" className="max-h-40 w-full rounded-xl object-cover" />
                  ) : (
                    <video src={uploadedUrl} controls playsInline className="max-h-40 w-full rounded-xl" />
                  )}
                  <button
                    onClick={() => { setUploadedUrl(null); setUploadedType(null); }}
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 shadow-sm"
                  >
                    <X className="h-3.5 w-3.5 text-neutral-500" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 py-3 text-sm text-neutral-500 transition-all hover:bg-neutral-100 disabled:opacity-50"
                  >
                    <ImageIcon className="h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Photo'}
                  </button>
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 py-3 text-sm text-neutral-500 transition-all hover:bg-neutral-100 disabled:opacity-50"
                  >
                    <Video className="h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Video'}
                  </button>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || submitting}
              className="w-full rounded-2xl bg-neutral-900 py-3.5 text-sm font-medium text-white transition-all hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Memory'}
            </button>
          </div>
        )}

        {/* DETAIL VIEW */}
        {view === 'detail' && detailMemory && (
          <div className="space-y-4">
            {detailMemory.media_url && detailMemory.media_type === 'image' && (
              <img
                src={detailMemory.media_url}
                alt={detailMemory.title}
                className="w-full rounded-2xl object-cover"
              />
            )}
            {detailMemory.media_url && detailMemory.media_type === 'video' && (
              <video
                src={detailMemory.media_url}
                controls
                playsInline
                className="w-full rounded-2xl"
              />
            )}

            <div>
              <h3 className={`text-lg font-semibold text-neutral-900 ${USERS[detailMemory.creator].font}`}>
                {detailMemory.title}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-400">
                <Calendar className="h-3 w-3" />
                {formatDate(detailMemory.memory_date)}
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                by {USERS[detailMemory.creator].name}
              </p>
            </div>

            {detailMemory.description && (
              <p className="text-sm leading-relaxed text-neutral-700">
                {detailMemory.description}
              </p>
            )}

            {detailMemory.creator === currentUser && (
              <button
                onClick={() => deleteMemory(detailMemory)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 py-3 text-sm font-medium text-red-500 transition-all hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
                Delete Memory
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
