// ============================================
// DISPATCH NG - Main App Component
// ============================================
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, initializeAuthListener } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

// Layouts
import { MainLayout } from '@/components/layout/MainLayout';
import { RiderLayout } from '@/components/layout/RiderLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { OnboardingPage } from '@/pages/auth/OnboardingPage';

// Public Pages
import { LandingPage } from '@/pages/public/LandingPage';
import { PublicRidersPage } from '@/pages/public/PublicRidersPage';

// Customer Pages
import { HomePage } from '@/pages/customer/HomePage';
import { FindRidersPage } from '@/pages/customer/FindRidersPage';
import { CreateJobPage } from '@/pages/customer/CreateJobPage';
import { JobDetailsPage } from '@/pages/customer/JobDetailsPage';
import { MyJobsPage } from '@/pages/customer/MyJobsPage';
import { WalletPage } from '@/pages/customer/WalletPage';
import { ProfilePage } from '@/pages/customer/ProfilePage';

// Rider Pages
import { RiderDashboardPage } from '@/pages/rider/RiderDashboardPage';
import { RiderJobsPage } from '@/pages/rider/RiderJobsPage';
import { RiderJobDetailsPage } from '@/pages/rider/RiderJobDetailsPage';
import { RiderWalletPage } from '@/pages/rider/RiderWalletPage';
import { RiderProfilePage } from '@/pages/rider/RiderProfilePage';
import { RiderEarningsPage } from '@/pages/rider/RiderEarningsPage';

// Admin Pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminRidersPage } from '@/pages/admin/AdminRidersPage';
import { AdminVerificationsPage } from '@/pages/admin/AdminVerificationsPage';
import { AdminJobsPage } from '@/pages/admin/AdminJobsPage';
import { AdminDisputesPage } from '@/pages/admin/AdminDisputesPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';

// Components
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ToastContainer } from '@/components/ToastContainer';
import { GlobalLoader } from '@/components/GlobalLoader';

function App() {
  const { initializeAuth, isLoading, isAuthenticated, user, riderProfile } = useAuthStore();
  const { globalLoading, loadingMessage } = useUIStore();

  useEffect(() => {
    let isMounted = true;

    const boot = async () => {
      if (!isMounted) return;
      await initializeAuth();
    };

    boot();

    const unsubscribe = initializeAuthListener();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [initializeAuth]);

  const getAuthenticatedHome = () => {
    if (!isAuthenticated || !user) return '/';

    if (user.user_type === 'admin') return '/admin';

    if (user.user_type === 'rider') {
      if (!riderProfile) return '/onboarding';
      return '/rider';
    }

    return '/dashboard';
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              isAuthenticated && user ? <Navigate to={getAuthenticatedHome()} replace /> : <LandingPage />
            }
          />
          <Route path="/riders" element={<PublicRidersPage />} />

          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route
              path="/login"
              element={
                isAuthenticated && user ? <Navigate to={getAuthenticatedHome()} replace /> : <LoginPage />
              }
            />
            <Route
              path="/signup"
              element={
                isAuthenticated && user ? <Navigate to={getAuthenticatedHome()} replace /> : <SignupPage />
              }
            />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Customer Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<HomePage />} />
            <Route path="/find-riders" element={<FindRidersPage />} />
            <Route path="/create-job" element={<CreateJobPage />} />
            <Route path="/jobs" element={<MyJobsPage />} />
            <Route path="/jobs/:jobId" element={<JobDetailsPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Rider Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['rider']}>
                <RiderLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/rider" element={<RiderDashboardPage />} />
            <Route path="/rider/jobs" element={<RiderJobsPage />} />
            <Route path="/rider/jobs/:jobId" element={<RiderJobDetailsPage />} />
            <Route path="/rider/wallet" element={<RiderWalletPage />} />
            <Route path="/rider/earnings" element={<RiderEarningsPage />} />
            <Route path="/rider/profile" element={<RiderProfilePage />} />
          </Route>

          {/* Admin Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/riders" element={<AdminRidersPage />} />
            <Route path="/admin/verifications" element={<AdminVerificationsPage />} />
            <Route path="/admin/jobs" element={<AdminJobsPage />} />
            <Route path="/admin/disputes" element={<AdminDisputesPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to={isAuthenticated && user ? getAuthenticatedHome() : '/'} replace />}
          />
        </Routes>
      </BrowserRouter>

      <ToastContainer />
      {globalLoading && <GlobalLoader message={loadingMessage} />}
    </>
  );
}

export default App;