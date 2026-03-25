// ============================================
// DISPATCH NG - Loading Screen Component
// ============================================

import { Package } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex flex-col items-center justify-center">
      <div className="relative">
        {/* Animated rings */}
        <div className="absolute inset-0 -m-8">
          <div className="w-32 h-32 rounded-full border-4 border-white/20 animate-ping" style={{ animationDuration: '2s' }} />
        </div>
        <div className="absolute inset-0 -m-4">
          <div className="w-24 h-24 rounded-full border-4 border-white/30 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
        </div>
        
        {/* Logo */}
        <div className="relative bg-white/20 backdrop-blur-sm p-6 rounded-2xl">
          <Package className="w-16 h-16 text-white animate-pulse" />
        </div>
      </div>
      
      <h1 className="mt-8 text-2xl font-bold text-white">Dispatch NG</h1>
      <p className="mt-2 text-white/70">Loading...</p>
    </div>
  );
}
