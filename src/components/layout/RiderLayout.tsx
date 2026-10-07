// ============================================
// DISPATCH NG - Rider Layout Component
// ============================================
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Wallet,
  TrendingUp,
  User,
  Menu,
  X,
  Package,
  Bell,
  Power,
  LogOut,
  ChevronRight,
  LifeBuoy,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { NotificationBell } from '@/components/NotificationBell';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/BrandMark';
import { useBranding } from '@/hooks/useBranding';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/stores/uiStore';

const navItems = [
  { path: '/rider', icon: LayoutDashboard, label: 'Dashboard', shortLabel: 'Dashboard' },
  { path: '/rider/jobs', icon: ClipboardList, label: 'Jobs', shortLabel: 'Jobs' },
  { path: '/rider/wallet', icon: Wallet, label: 'Wallet', shortLabel: 'Wallet' },
  { path: '/rider/earnings', icon: TrendingUp, label: 'Earnings', shortLabel: 'Earnings' },
  { path: '/rider/support', icon: LifeBuoy, label: 'Support', shortLabel: 'Support' },
  { path: '/rider/profile', icon: User, label: 'Profile', shortLabel: 'Profile' },
];

// Keep the mobile bottom bar to five primary destinations.
// Support remains available from the menu and contextual support links.
const mobileNavItems = navItems.filter((item) => item.path !== '/rider/support');

export function RiderLayout() {
  const branding = useBranding();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, riderProfile, signOut, setRiderProfile } = useAuthStore();

  const handleSignOut = async () => {
    if (riderProfile?.is_online) {
      await supabase
        .from('rider_profiles')
        .update({ is_online: false })
        .eq('profile_id', user?.id);
    }

    await signOut();
  };

  const toggleOnlineStatus = async () => {
    if (!user) return;

    try {
      const newStatus = !riderProfile?.is_online;

      const { data, error } = await supabase
        .from('rider_profiles')
        .update({ is_online: newStatus })
        .eq('profile_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setRiderProfile(data);
      showToast(
        'success',
        newStatus ? 'You are now online' : 'You are now offline',
        newStatus ? 'Customers can now find you' : "You won't receive new job requests"
      );
    } catch (error) {
      showToast('error', 'Error', 'Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white md:bg-white/95 md:backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex h-14 items-center justify-between">
            <NavLink to="/rider" className="flex items-center gap-3">
              <BrandMark className="max-h-9" imageClassName="max-w-[132px]" iconClassName="h-4.5 w-4.5" />

              {!branding.logo_url && <span className="hidden bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-xl font-bold text-transparent sm:block">Rider Portal</span>}
            </NavLink>

            <nav className="hidden items-center gap-2 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/rider'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-slate-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleOnlineStatus}
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all sm:px-4',
                  riderProfile?.is_online
                    ? 'bg-green-100 text-green-700 ring-1 ring-green-200'
                    : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'
                )}
              >
                <Power
                  className={cn(
                    'h-4 w-4',
                    riderProfile?.is_online && 'animate-pulse'
                  )}
                />
                <span className="hidden sm:inline">
                  {riderProfile?.is_online ? 'Online' : 'Offline'}
                </span>
              </button>

              <NotificationBell />

              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="rounded-2xl p-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 md:hidden"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 md:hidden',
          mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setMobileMenuOpen(false)}
      />

      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 h-[100dvh] max-h-[100dvh] w-[88%] max-w-sm border-l border-gray-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.16)] transition-transform duration-200 md:hidden',
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <div className="border-b border-gray-100 px-5 pb-5 pt-5">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BrandMark className="max-h-9" imageClassName="max-w-[132px]" iconClassName="h-4.5 w-4.5" />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-lg font-bold text-transparent">
                  Rider Portal
                </span>
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-2xl bg-gray-100 p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <NavLink
              to="/rider/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block"
            >
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/70 p-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 text-base font-semibold text-white shadow-sm">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || 'Profile'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{user?.full_name?.charAt(0).toUpperCase() || 'R'}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">
                    {user?.full_name || 'Rider'}
                  </p>
                  <p className="truncate text-sm text-gray-500">
                    {riderProfile?.is_online ? 'Currently online' : 'Currently offline'}
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 text-emerald-500" />
              </div>
            </NavLink>

            <button
              onClick={toggleOnlineStatus}
              className={cn(
                'mt-4 flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left transition-all',
                riderProfile?.is_online
                  ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
                  : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-2xl',
                    riderProfile?.is_online ? 'bg-white text-green-600' : 'bg-white text-gray-500'
                  )}
                >
                  <Power
                    className={cn(
                      'h-5 w-5',
                      riderProfile?.is_online && 'animate-pulse'
                    )}
                  />
                </div>
                <div>
                  <p className="font-medium">
                    {riderProfile?.is_online ? 'You are online' : 'You are offline'}
                  </p>
                  <p className="text-xs opacity-80">
                    {riderProfile?.is_online
                      ? 'Customers can find you now'
                      : 'Turn on availability for new jobs'}
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/rider'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all duration-200',
                      isActive
                        ? 'bg-slate-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    )
                  }
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 transition-colors group-hover:bg-gray-200">
                    <item.icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-base font-medium">{item.label}</span>
                  </div>

                  <ChevronRight className="h-4 w-4 opacity-60" />
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="shrink-0 border-t border-gray-100 bg-white px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-red-500 transition-colors hover:bg-red-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <LogOut className="h-5 w-5" />
              </div>
              <span className="text-base font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="mx-auto max-w-5xl px-4 py-4 sm:py-6">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/80 bg-white md:bg-white/95 md:backdrop-blur-xl md:hidden">
        <div className="mx-auto max-w-5xl px-2 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-2">
          <div className="grid grid-cols-5 gap-1">
            {mobileNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/rider'}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center rounded-xl px-1 py-2 transition-all duration-200',
                    isActive
                      ? 'bg-slate-50 text-emerald-700'
                      : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={cn(
                        'mb-1 flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200',
                        isActive ? 'bg-white shadow-sm ring-1 ring-emerald-100' : 'bg-transparent'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-medium leading-none">
                      {item.shortLabel}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <div className="h-20 md:hidden" />
    </div>
  );
}