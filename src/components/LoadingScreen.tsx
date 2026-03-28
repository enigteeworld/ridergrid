// ============================================
// DISPATCH NG - Loading Screen Component
// ============================================

import { Package } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0914]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.30),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(217,70,239,0.24),transparent_28%),linear-gradient(135deg,#0a0914_0%,#17142b_45%,#120f24_100%)]" />

      <div className="absolute -left-20 top-24 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute -right-20 bottom-24 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_20%,transparent_80%,rgba(255,255,255,0.02))]" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center px-6 text-center">
        <div className="relative mb-7">
          <div className="absolute inset-1 rounded-[30px] bg-violet-400/20 blur-2xl" />

          <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 animate-[pulse_2.8s_ease-in-out_infinite]" />

          <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/10 animate-ping" style={{ animationDuration: '2.4s' }} />

          <div className="relative flex h-28 w-28 items-center justify-center rounded-[28px] border border-white/10 bg-white/10 shadow-[0_20px_60px_rgba(124,58,237,0.28)] backdrop-blur-2xl">
            <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/10 via-transparent to-fuchsia-300/10" />
            <Package className="relative h-12 w-12 text-white" strokeWidth={2.2} />
          </div>
        </div>

        <h1 className="text-[2rem] font-bold tracking-tight text-white sm:text-4xl">
          Dispatch NG
        </h1>

        <p className="mt-2 text-base text-white/65">Getting your deliveries ready</p>

        <div className="mt-6 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-white/85 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/65 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/45 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
