import { useState } from 'react';
import { Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

const PERSONAL_AVATARS = [
  { key: 'wave', face: '👋🏾', bg: 'from-emerald-100 to-slate-100' },
  { key: 'cap', face: '🧢', bg: 'from-sky-100 to-cyan-100' },
  { key: 'cool', face: '😎', bg: 'from-amber-100 to-orange-100' },
  { key: 'smile', face: '😊', bg: 'from-lime-100 to-emerald-100' },
  { key: 'helmet', face: '⛑️', bg: 'from-red-100 to-orange-100' },
  { key: 'bike', face: '🚴🏾', bg: 'from-slate-100 to-cyan-100' },
  { key: 'scooter', face: '🛵', bg: 'from-emerald-100 to-lime-100' },
  { key: 'parcel', face: '📦', bg: 'from-amber-100 to-yellow-100' },
  { key: 'rocket', face: '🚀', bg: 'from-sky-100 to-indigo-100' },
  { key: 'pin', face: '📍', bg: 'from-rose-100 to-orange-100' },
  { key: 'star', face: '⭐', bg: 'from-yellow-100 to-amber-100' },
  { key: 'bolt', face: '⚡', bg: 'from-lime-100 to-yellow-100' },
  { key: 'heart', face: '💚', bg: 'from-emerald-100 to-green-100' },
  { key: 'shield', face: '🛡️', bg: 'from-slate-100 to-slate-100' },
  { key: 'map', face: '🗺️', bg: 'from-cyan-100 to-emerald-100' },
  { key: 'check', face: '✅', bg: 'from-green-100 to-emerald-100' },
] as const;

export type PersonalAvatarKey = (typeof PERSONAL_AVATARS)[number]['key'];

function avatarFor(key?: string | null) {
  return PERSONAL_AVATARS.find((item) => item.key === key) || PERSONAL_AVATARS[0];
}

export function PersonalAvatar({
  size = 'md',
  editable = true,
  className,
}: {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  editable?: boolean;
  className?: string;
}) {
  const { user, setUser } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const selected = avatarFor(user?.personal_avatar_key);
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-sm' : size === 'lg' ? 'h-14 w-14 text-2xl' : size === 'hero' ? 'h-20 w-20 text-4xl sm:h-24 sm:w-24 sm:text-5xl' : 'h-9 w-9 text-lg';

  const choose = async (key: PersonalAvatarKey) => {
    if (!user || saving) return;
    setSaving(key);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ personal_avatar_key: key, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      setUser(data);
      setOpen(false);
      showToast('success', 'Avatar updated', 'Your Dispatch NG character has been saved');
    } catch (error: any) {
      showToast('error', 'Could not save avatar', error.message || 'Please try again');
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => editable && setOpen(true)}
        disabled={!editable}
        aria-label={editable ? 'Choose your Dispatch NG avatar' : 'Dispatch NG avatar'}
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ring-1 ring-white/80 shadow-sm',
          selected.bg,
          sizeClass,
          editable && 'cursor-pointer transition-transform hover:scale-105 active:scale-95',
          className
        )}
      >
        <span aria-hidden="true">{selected.face}</span>
      </button>

      {editable && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[360px] rounded-3xl p-5">
            <DialogHeader>
              <DialogTitle>Choose your character</DialogTitle>
            </DialogHeader>
            <p className="-mt-1 text-sm text-gray-500">
              Pick a small personality icon for greetings and role badges. Your profile photo stays unchanged.
            </p>
            <div className="grid grid-cols-4 gap-3 pt-2">
              {PERSONAL_AVATARS.map((item) => {
                const active = selected.key === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => choose(item.key)}
                    disabled={!!saving}
                    className={cn(
                      'relative flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-br text-2xl ring-1 transition-all hover:-translate-y-0.5',
                      item.bg,
                      active ? 'ring-2 ring-emerald-500 shadow-md' : 'ring-slate-200'
                    )}
                    aria-label={`Select ${item.key} avatar`}
                  >
                    <span aria-hidden="true">{item.face}</span>
                    {active && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
