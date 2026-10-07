import { Package } from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';
interface GlobalLoaderProps { message?: string; }
export function GlobalLoader({ message = 'Please wait...' }: GlobalLoaderProps) {
  const branding = useBranding();
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[linear-gradient(145deg,#fafafa_0%,#f6faf8_48%,#f4f9f9_100%)]">
      <div className="pointer-events-none absolute -left-24 top-1/4 h-56 w-56 rounded-full bg-emerald-100/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-56 w-56 rounded-full bg-teal-100/35 blur-3xl" />
      <div className="relative flex min-w-64 flex-col items-center px-7 py-8 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-white bg-white/90 shadow-[0_18px_55px_rgba(15,118,110,0.10)]">
          {branding.isLoaded && branding.favicon_url ? <img src={branding.favicon_url} alt={`${branding.site_name} icon`} className="h-16 w-16 animate-[dispatchFaviconFloat_1.25s_ease-in-out_infinite] object-contain" /> : branding.isLoaded ? <div className="flex h-16 w-16 animate-[dispatchFaviconFloat_1.25s_ease-in-out_infinite] items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white"><Package className="h-8 w-8" /></div> : <div className="h-16 w-16 animate-pulse rounded-2xl bg-slate-200/80" />}
        </div>
        <div className="mt-5 text-xl font-bold tracking-tight text-slate-900">{branding.isLoaded ? branding.site_name : 'Dispatch NG'}</div>
        <div className="mt-1 text-sm font-medium text-slate-500">Safe deliveries. Protected payments.</div>
        <div className="mt-5 h-1 w-28 overflow-hidden rounded-full bg-slate-200/80"><div className="h-full w-1/2 animate-[brandLoad_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" /></div>
        <p className="mt-3 text-xs font-medium tracking-wide text-slate-400">{message}</p>
      </div>
    </div>
  );
}
