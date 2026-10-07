// ============================================
// DISPATCH NG - Main Layout (Customer)
// ============================================
import { Outlet, NavLink } from 'react-router-dom';
import {
  Home,
  Search,
  ClipboardList,
  Wallet,
  User,
  Menu,
  X,
  Package,
  Bell,
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

const desktopNavItems = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/find-riders', icon: Search, label: 'Find Riders' },
  { path: '/jobs', icon: ClipboardList, label: 'My Jobs' },
  { path: '/wallet', icon: Wallet, label: 'Wallet' },
  { path: '/support', icon: LifeBuoy, label: 'Support' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const mobileNavItems = [
  { path: '/dashboard', icon: Home, label: 'Home', shortLabel: 'Home' },
  { path: '/find-riders', icon: Search, label: 'Find Riders', shortLabel: 'Find' },
  { path: '/jobs', icon: ClipboardList, label: 'My Jobs', shortLabel: 'My' },
  { path: '/wallet', icon: Wallet, label: 'Wallet', shortLabel: 'Wallet' },
  { path: '/profile', icon: User, label: 'Profile', shortLabel: 'Profile' },
];

export function MainLayout() {
  const branding = useBranding();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white md:bg-white/95 md:backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex h-16 items-center justify-between">
            <NavLink to="/dashboard" className="flex items-center gap-3">
              <BrandMark className="h-10 min-w-10" iconClassName="h-5 w-5" />

              <span className="hidden bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-xl font-bold text-transparent sm:block">
                {branding.site_name}
              </span>
            </NavLink>

            <nav className="hidden items-center gap-2 md:flex">
              {desktopNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
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
              <NotificationBell />

              <NavLink to="/profile" className="hidden sm:block">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 text-sm font-semibold text-white shadow-sm ring-2 ring-white">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || 'Profile'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{user?.full_name?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>
              </NavLink>

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
          'fixed right-0 top-0 z-50 h-full w-[88%] max-w-sm border-l border-gray-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.16)] transition-transform duration-200 md:hidden',
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-gray-100 px-5 pb-5 pt-5">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BrandMark className="h-10 min-w-10" iconClassName="h-5 w-5" />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-lg font-bold text-transparent">
                  {branding.site_name}
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
              to="/profile"
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
                    <span>{user?.full_name?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">
                    {user?.full_name || 'User'}
                  </p>
                  <p className="truncate text-sm text-gray-500">
                    {user?.email || 'View profile'}
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 text-emerald-500" />
              </div>
            </NavLink>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <nav className="space-y-2">
              {desktopNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
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

          <div className="border-t border-gray-100 px-4 py-4">
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
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center rounded-2xl px-1 py-2.5 transition-all duration-200',
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
                        'mb-1.5 flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-200',
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