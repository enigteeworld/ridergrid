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
  Power
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/stores/uiStore';

const navItems = [
  { path: '/rider', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/rider/jobs', icon: ClipboardList, label: 'Jobs' },
  { path: '/rider/wallet', icon: Wallet, label: 'Wallet' },
  { path: '/rider/earnings', icon: TrendingUp, label: 'Earnings' },
  { path: '/rider/profile', icon: User, label: 'Profile' },
];

export function RiderLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, riderProfile, signOut, setRiderProfile } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  const handleSignOut = async () => {
    // Go offline before signing out
    if (riderProfile?.is_online) {
      // @ts-ignore
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
      // @ts-ignore
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
        newStatus ? 'Customers can now find you' : 'You won\'t receive new job requests'
      );
    } catch (error) {
      showToast('error', 'Error', 'Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink to="/rider" className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-violet-500 to-fuchsia-500 p-2 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent hidden sm:block">
                Rider Portal
              </span>
            </NavLink>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
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

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Online Status Toggle */}
              <button
                onClick={toggleOnlineStatus}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all',
                  riderProfile?.is_online
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                )}
              >
                <Power className={cn(
                  'w-4 h-4',
                  riderProfile?.is_online && 'animate-pulse'
                )} />
                <span className="hidden sm:inline text-sm">
                  {riderProfile?.is_online ? 'Online' : 'Offline'}
                </span>
              </button>

              {/* Notifications */}
              <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Button */}
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

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white">
          <div className="pt-20 px-4 pb-4">
            <nav className="space-y-2">
              {navItems.map((item) => (
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

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 p-2 transition-colors',
                  isActive 
                    ? 'text-violet-600' 
                    : 'text-gray-400'
                )
              }
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="md:hidden h-16" />
    </div>
  );
}
