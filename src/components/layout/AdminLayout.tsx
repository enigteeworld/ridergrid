// ============================================
// DISPATCH NG - Admin Layout Component
// ============================================

import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardCheck, ClipboardList, AlertTriangle,
  Settings, Menu, X, LogOut, CreditCard,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/BrandMark';
import { useBranding } from '@/hooks/useBranding';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/riders', icon: Users, label: 'Riders' },
  { path: '/admin/verifications', icon: ClipboardCheck, label: 'Verifications' },
  { path: '/admin/jobs', icon: ClipboardList, label: 'Jobs' },
  { path: '/admin/disputes', icon: AlertTriangle, label: 'Resolution Center' },
  { path: '/admin/reconciliation', icon: CreditCard, label: 'Reconcile Payments' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function AdminLayout() {
  const branding = useBranding();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { signOut } = useAuthStore();
  const handleSignOut = async () => { await signOut(); };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-100">
      {/* Desktop sidebar owns the complete left rail, including its brand/header area. */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 hidden border-r border-gray-200 bg-white transition-[width] duration-300 lg:flex lg:flex-col',
        sidebarOpen ? 'w-64' : 'w-20'
      )}>
        <div className="flex h-16 shrink-0 items-center border-b border-gray-200 px-3">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label={sidebarOpen ? 'Collapse admin sidebar' : 'Expand admin sidebar'}
          >
            <Menu className="h-5 w-5" />
          </button>
          {sidebarOpen && (
            <NavLink to="/admin" className="ml-2 flex min-w-0 flex-1 items-center overflow-hidden">
              <BrandMark className="max-h-11" imageClassName="max-h-11 max-w-[155px] object-contain" iconClassName="h-5 w-5" />
              {!branding.logo_url && <span className="ml-2 truncate text-base font-bold text-emerald-700">{branding.site_name}</span>}
            </NavLink>
          )}
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => cn(
              'flex items-center rounded-xl py-3 transition-colors duration-200',
              sidebarOpen ? 'gap-3 px-4' : 'justify-center px-2',
              isActive ? 'bg-slate-50 font-medium text-emerald-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            )}>
              <item.icon className="h-6 w-6 shrink-0" />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Header starts exactly where the desktop sidebar ends. */}
      <header className={cn(
        'fixed left-0 right-0 top-0 z-40 h-16 border-b border-gray-200 bg-white transition-[left] duration-300',
        sidebarOpen ? 'lg:left-64' : 'lg:left-20'
      )}>
        <div className="flex h-full items-center px-4 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center lg:hidden">
            <NavLink to="/admin" className="flex min-w-0 items-center">
              <BrandMark className="max-h-11" imageClassName="max-h-11 max-w-[155px] object-contain" iconClassName="h-5 w-5" />
            </NavLink>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button onClick={() => setMobileMenuOpen(v => !v)} className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 lg:hidden" aria-label="Toggle admin menu">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <button onClick={handleSignOut} className="flex items-center gap-2 rounded-xl px-3 py-2 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600">
              <LogOut className="h-5 w-5" /><span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[70] flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-white lg:hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-20">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavLink key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => cn(
                  'flex items-center gap-4 rounded-xl p-4 transition-colors duration-200',
                  isActive ? 'bg-slate-50 font-medium text-emerald-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                )}><item.icon className="h-6 w-6 shrink-0" /><span className="text-lg">{item.label}</span></NavLink>
              ))}
            </nav>
          </div>
          <div className="sticky bottom-0 z-10 shrink-0 border-t border-gray-100 bg-white px-4 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.06)]">
            <button onClick={handleSignOut} className="flex w-full items-center gap-4 rounded-xl p-4 text-red-500 hover:bg-red-50"><LogOut className="h-6 w-6" /><span className="text-lg">Sign Out</span></button>
          </div>
        </div>
      )}

      <main className={cn(
        'min-w-0 overflow-x-hidden px-4 pb-5 pt-20 transition-[margin] duration-300 sm:px-5 sm:pb-6 sm:pt-20 lg:px-6',
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
      )}>
        <div className="mx-auto w-full min-w-0 max-w-7xl"><Outlet /></div>
      </main>
    </div>
  );
}
