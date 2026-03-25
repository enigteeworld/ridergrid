// ============================================
// DISPATCH NG - Global Loader Component
// ============================================

import { Package } from 'lucide-react';

interface GlobalLoaderProps {
  message?: string;
}

export function GlobalLoader({ message = 'Please wait...' }: GlobalLoaderProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center">
        <div className="relative">
          <div className="absolute inset-0 -m-4">
            <div className="w-16 h-16 rounded-full border-4 border-violet-200 animate-ping" style={{ animationDuration: '1.5s' }} />
          </div>
          <div className="relative bg-gradient-to-br from-violet-500 to-fuchsia-500 p-4 rounded-xl">
            <Package className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>
        <p className="mt-6 text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}
