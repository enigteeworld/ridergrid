// ============================================
// DISPATCH NG - Admin Layout Component
// ============================================

import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  ClipboardList,
  AlertTriangle,
  Settings,
  Menu,
  X,
  Package,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/riders', icon: Users, label: 'Riders' },
  { path: '/admin/verifications', icon: ClipboardCheck, label: 'Verifications' },
  { path: '/admin/jobs', icon: ClipboardList, label: 'Jobs' },
  { path: '/admin/disputes', icon: AlertTriangle, label: 'Disputes' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-100">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="px-4 sm:px-5 lg:px-6">
          <div className="flex h-16 items-center justify-between gap-3">
            {/* Left Section */}
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 lg:block"
              >
                <Menu className="h-6 w-6" />
              </button>

              <NavLink to="/admin" className="flex min-w-0 items-center gap-2">
                <div className="rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-2">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <span className="truncate text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Admin
                </span>
              </NavLink>
            </div>

            {/* Right Section */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 lg:hidden"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 sm:px-4"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-w-0">
        {/* Sidebar - Desktop */}
        <aside
          className={cn(
            'fixed bottom-0 left-0 top-16 z-40 hidden overflow-y-auto border-r border-gray-200 bg-white transition-all duration-300 lg:block',
            sidebarOpen ? 'w-64' : 'w-20'
          )}
        >
          <nav className="space-y-2 p-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
                    isActive
                      ? 'bg-violet-50 font-medium text-violet-600'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  )
                }
              >
                <item.icon className="h-6 w-6 shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-white lg:hidden">
            <div className="px-4 pb-4 pt-20">
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-4 rounded-xl p-4 transition-all duration-200',
                        isActive
                          ? 'bg-violet-50 font-medium text-violet-600'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                      )
                    }
                  >
                    <item.icon className="h-6 w-6 shrink-0" />
                    <span className="text-lg">{item.label}</span>
                  </NavLink>
                ))}

                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-4 rounded-xl p-4 text-red-500 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-6 w-6 shrink-0" />
                  <span className="text-lg">Sign Out</span>
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main
          className={cn(
            'min-w-0 flex-1 overflow-x-hidden px-4 py-5 sm:px-5 sm:py-6 lg:px-6',
            sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
          )}
        >
          <div className="mx-auto w-full min-w-0 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}