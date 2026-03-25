// ============================================
// DISPATCH NG - Auth Layout Component
// ============================================

import { Outlet } from 'react-router-dom';
import { Package } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
            <Package className="w-12 h-12 text-white" />
          </div>
        </div>
        
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dispatch NG</h1>
          <p className="text-white/80">Fast, secure delivery at your fingertips</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <Outlet />
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-6">
          © 2025 Dispatch NG. All rights reserved.
        </p>
      </div>
    </div>
  );
}
