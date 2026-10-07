import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, MessageCircle, RefreshCw, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/uiStore';

type ChatMessage = {
  id: string;
  dispatch_job_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

export function DeliveryChat({ jobId, enabled = true }: { jobId: string; enabled?: boolean }) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  const loadMessages = useCallback(async () => {
    if (!jobId) return;
    try {
      setLoadError(null);
      const { data, error } = await supabase
        .from('delivery_messages' as any)
        .select('id, dispatch_job_id, sender_id, message, created_at')
        .eq('dispatch_job_id', jobId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (mountedRef.current) setMessages((data ?? []) as unknown as ChatMessage[]);
    } catch (error: any) {
      console.error('Delivery chat load failed:', error);
      if (mountedRef.current) setLoadError(error?.message || 'Unable to load delivery chat.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    mountedRef.current = true;
    setMessages([]);
    setLoading(true);
    void loadMessages();

    const channel = supabase
      .channel(`delivery-chat-${jobId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'delivery_messages', filter: `dispatch_job_id=eq.${jobId}` },
        (payload) => {
          const incoming = payload.new as ChatMessage;
          if (!incoming?.id) return;
          setMessages((current) =>
            current.some((item) => item.id === incoming.id) ? current : [...current, incoming]
          );
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') console.warn('Delivery chat realtime channel error');
      });

    return () => {
      mountedRef.current = false;
      void supabase.removeChannel(channel);
    };
  }, [jobId, loadMessages]);

  useEffect(() => {
    if (!messages.length) return;
    try {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch {
      // Chat scrolling should never be able to break the job details page.
    }
  }, [messages.length]);

  const send = async () => {
    const body = text.trim();
    if (!user?.id || !body || !enabled || sending) return;

    setSending(true);
    try {
      const { data, error } = await supabase
        .from('delivery_messages' as any)
        .insert({ dispatch_job_id: jobId, sender_id: user.id, message: body } as any)
        .select('id, dispatch_job_id, sender_id, message, created_at')
        .single();

      if (error) throw error;
      const inserted = data as unknown as ChatMessage;
      if (inserted?.id) {
        setMessages((current) =>
          current.some((item) => item.id === inserted.id) ? current : [...current, inserted]
        );
      }
      setText('');
      setLoadError(null);
    } catch (error: any) {
      console.error('Delivery chat send failed:', error);
      showToast('error', 'Message not sent', error?.message || 'Please try again.');
    } finally {
      if (mountedRef.current) setSending(false);
    }
  };

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center gap-3 border-b p-4">
        <div className="rounded-xl bg-emerald-50 p-2"><MessageCircle className="h-5 w-5 text-emerald-600" /></div>
        <div>
          <h3 className="font-bold text-gray-900">Delivery Chat</h3>
          <p className="text-xs text-gray-500">Messages stay attached to this delivery for support and dispute context.</p>
        </div>
      </div>

      <div className="max-h-80 min-h-40 space-y-3 overflow-y-auto bg-gray-50/60 p-4">
        {loading ? (
          <div className="flex min-h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
        ) : loadError ? (
          <div className="flex min-h-32 flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <p className="max-w-md text-sm text-gray-500">Chat is temporarily unavailable. The rest of this delivery page is unaffected.</p>
            <button type="button" onClick={() => { setLoading(true); void loadMessages(); }} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-gray-700">
              <RefreshCw className="h-3.5 w-3.5" /> Retry chat
            </button>
          </div>
        ) : messages.length === 0 ? (
          <p className="pt-12 text-center text-sm text-gray-400">No messages yet. Keep delivery arrangements here.</p>
        ) : (
          messages.map((message) => {
            const mine = message.sender_id === user?.id;
            return (
              <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${mine ? 'bg-emerald-600 text-white' : 'border bg-white text-gray-800'}`}>
                  <p className="mb-1 text-[11px] font-semibold opacity-70">{mine ? 'You' : 'Delivery participant'}</p>
                  <p className="whitespace-pre-wrap break-words text-sm">{message.message}</p>
                  <p className="mt-1 text-[10px] opacity-60">{message.created_at ? new Date(message.created_at).toLocaleString() : ''}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2 border-t p-3">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={!enabled || sending}
          maxLength={4000}
          placeholder={enabled ? 'Message about this delivery...' : 'Chat is unavailable for this delivery'}
          className="min-h-11 flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:border-emerald-400 disabled:bg-gray-100"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
        />
        <button type="button" onClick={() => void send()} disabled={!enabled || sending || !text.trim()} className="self-end rounded-xl bg-emerald-600 p-3 text-white disabled:opacity-40" aria-label="Send message">
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </div>
    </section>
  );
}
