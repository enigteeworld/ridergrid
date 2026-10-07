import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, getNotifications, markNotificationRead, subscribeToNotifications } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import type { Notification } from '@/types';

export function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { notifications, unreadCount, setNotifications, addNotification, markAsRead, markAllAsRead } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    setLoading(true);
    getNotifications(user.id).then(({ data }) => { if (alive) setNotifications((data || []) as Notification[]); }).finally(() => alive && setLoading(false));
    const channel = subscribeToNotifications(user.id, payload => addNotification(payload.new as Notification));
    return () => { alive = false; void supabase.removeChannel(channel); };
  }, [user?.id, setNotifications, addNotification]);

  const destination = (n: Notification) => {
    const d = (n.data || {}) as Record<string, any>;
    if (d.ticket_id) return user?.user_type === 'rider' ? '/rider/support' : user?.user_type === 'admin' ? '/admin/disputes' : '/support';
    if (d.job_id) return user?.user_type === 'rider' ? `/rider/jobs/${d.job_id}` : user?.user_type === 'admin' ? '/admin/jobs' : `/jobs/${d.job_id}`;
    return user?.user_type === 'rider' ? '/rider' : user?.user_type === 'admin' ? '/admin' : '/dashboard';
  };

  const openNotification = async (n: Notification) => {
    if (!n.is_read) { await markNotificationRead(n.id); markAsRead(n.id); }
    setOpen(false); navigate(destination(n));
  };

  const readAll = async () => {
    if (!user?.id) return;
    await supabase.from('notifications').update({ is_read: true }).eq('profile_id', user.id).eq('is_read', false);
    markAllAsRead();
  };

  return <div className="relative">
    <button onClick={() => setOpen(v => !v)} aria-label="Notifications" className="relative rounded-2xl p-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700">
      <Bell className="h-6 w-6" />
      {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
    </button>
    {open && <><button aria-label="Close notifications" className="fixed inset-0 z-[60] cursor-default" onClick={() => setOpen(false)} />
      <div className="fixed left-3 right-3 top-[72px] z-[70] max-h-[70vh] overflow-hidden rounded-2xl border bg-white shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[390px]">
        <div className="flex items-center justify-between border-b p-4"><div><h3 className="font-bold text-gray-900">Notifications</h3><p className="text-xs text-gray-500">{unreadCount} unread</p></div>{unreadCount > 0 && <button onClick={readAll} className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCheck className="h-4 w-4"/>Mark all read</button>}</div>
        <div className="max-h-[58vh] overflow-y-auto">{loading ? <div className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin"/></div> : notifications.length === 0 ? <div className="p-8 text-center text-sm text-gray-500">You're all caught up.</div> : notifications.map(n => <button key={n.id} onClick={() => void openNotification(n)} className={`w-full border-b p-4 text-left hover:bg-gray-50 ${!n.is_read ? 'bg-emerald-50/60' : ''}`}><div className="flex gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${!n.is_read ? 'bg-emerald-600' : 'bg-transparent'}`}/><div><p className="text-sm font-semibold text-gray-900">{n.title}</p><p className="mt-1 text-sm text-gray-600">{n.message}</p><p className="mt-2 text-[11px] text-gray-400">{new Date(n.created_at).toLocaleString()}</p></div></div></button>)}</div>
      </div></>}
  </div>;
}
