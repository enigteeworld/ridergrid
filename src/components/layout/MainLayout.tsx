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
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { cn } from '@/lib/utils';

const desktopNavItems = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/find-riders', icon: Search, label: 'Find Riders' },
  { path: '/jobs', icon: ClipboardList, label: 'My Jobs' },
  { path: '/wallet', icon: Wallet, label: 'Wallet' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const mobileNavItems = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/find-riders', icon: Search, label: 'Find Riders' },
  { path: '/jobs', icon: ClipboardList, label: 'My Jobs' },
  { path: '/wallet', icon: Wallet, label: 'Wallet' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <NavLink to="/dashboard" className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-violet-500 to-fuchsia-500 p-2 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent hidden sm:block">
                Dispatch NG
              </span>
            </NavLink>

            <nav className="hidden md:flex items-center gap-1">
              {desktopNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'p-3 rounded-xl transition-all duration-200',
                      isActive
                        ? 'text-violet-600 bg-violet-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    )
                  }
                >
                  <item.icon className="w-6 h-6" />
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <NavLink to="/profile" className="hidden sm:block">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white font-medium overflow-hidden">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || 'Profile'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user?.full_name?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>
              </NavLink>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white">
          <div className="pt-20 px-4 pb-4">
            <nav className="space-y-2">
              {desktopNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-4 p-4 rounded-xl transition-all duration-200',
                      isActive
                        ? 'text-violet-600 bg-violet-50 font-medium'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    )
                  }
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-lg">{item.label}</span>
                </NavLink>
              ))}

              <hr className="my-4 border-gray-200" />

              <button
                onClick={handleSignOut}
                className="flex items-center gap-4 p-4 text-red-500 hover:bg-red-50 rounded-xl transition-colors w-full"
              >
                <span className="text-lg">Sign Out</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 p-2 transition-colors',
                  isActive ? 'text-violet-600' : 'text-gray-400'
                )
              }
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs">{item.label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="md:hidden h-16" />
    </div>
  );
}
