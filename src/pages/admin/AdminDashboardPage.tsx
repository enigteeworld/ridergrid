// ============================================
// DISPATCH NG - Admin Dashboard Page
// ============================================
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  ClipboardCheck,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Wallet,
  UserRound,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import {
  formatCurrency,
  formatDateTime,
  getStatusColorClass,
  formatJobStatus,
} from '@/utils/format';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalUsers: number;
  totalCustomers: number;
  totalRiders: number;
  totalJobs: number;
  completedJobs: number;
  pendingVerifications: number;
  openDisputes: number;
  pendingWithdrawals: number;
  platformRevenue: number;
}

interface RecentJobItem {
  id: string;
  job_number: string;
  status: string;
  customer_name?: string | null;
  rider_name?: string | null;
  agreed_amount: number;
  platform_fee?: number | null;
  created_at: string;
}

interface WithdrawalItem {
  id: string;
  amount: number;
  status?: string | null;
  created_at: string;
  profile_id?: string | null;
  wallet_id?: string | null;
  rider_name?: string | null;
  rider_email?: string | null;
}

interface StatCardItem {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  link?: string;
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCustomers: 0,
    totalRiders: 0,
    totalJobs: 0,
    completedJobs: 0,
    pendingVerifications: 0,
    openDisputes: 0,
    pendingWithdrawals: 0,
    platformRevenue: 0,
  });

  const [recentJobs, setRecentJobs] = useState<RecentJobItem[]>([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState<WithdrawalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);

      const [
        profilesRes,
        riderProfilesRes,
        jobsRes,
        completedJobsRes,
        pendingVerificationsRes,
        disputesRes,
        pendingWithdrawalsRes,
        completedRevenueRes,
        recentJobsRes,
        recentWithdrawalsRes,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, phone, user_type, created_at')
          .order('created_at', { ascending: false }),

        supabase
          .from('rider_profiles')
          .select('id, profile_id, verification_status'),

        supabase
          .from('job_details')
          .select('*', { count: 'exact', head: true }),

        supabase
          .from('job_details')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed'),

        supabase
          .from('rider_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('verification_status', 'pending'),

        supabase
          .from('disputes')
          .select('*', { count: 'exact', head: true })
          .in('status', ['open', 'under_review']),

        supabase
          .from('withdrawal_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),

        supabase
          .from('job_details')
          .select('platform_fee')
          .eq('status', 'completed'),

        supabase
          .from('job_details')
          .select(
            'id, job_number, status, customer_name, rider_name, agreed_amount, platform_fee, created_at'
          )
          .order('created_at', { ascending: false })
          .limit(5),

        supabase
          .from('withdrawal_requests')
          .select('id, amount, status, created_at, profile_id, wallet_id')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (riderProfilesRes.error) throw riderProfilesRes.error;
      if (jobsRes.error) throw jobsRes.error;
      if (completedJobsRes.error) throw completedJobsRes.error;
      if (pendingVerificationsRes.error) throw pendingVerificationsRes.error;
      if (disputesRes.error) throw disputesRes.error;
      if (pendingWithdrawalsRes.error) throw pendingWithdrawalsRes.error;
      if (completedRevenueRes.error) throw completedRevenueRes.error;
      if (recentJobsRes.error) throw recentJobsRes.error;
      if (recentWithdrawalsRes.error) throw recentWithdrawalsRes.error;

      const allProfiles = profilesRes.data || [];
      const riderProfiles = riderProfilesRes.data || [];

      const riderProfileIds = new Set(
        riderProfiles.map((rider) => rider.profile_id).filter(Boolean)
      );

      const adminProfiles = allProfiles.filter((profile) => profile.user_type === 'admin');

      const derivedCustomers = allProfiles.filter((profile) => {
        if (profile.user_type === 'admin') return false;
        if (riderProfileIds.has(profile.id)) return false;
        return true;
      });

      const totalCustomers = derivedCustomers.length;
      const totalRiders = riderProfiles.length;
      const totalUsers = totalCustomers + totalRiders + adminProfiles.length;

      const platformRevenue =
        completedRevenueRes.data?.reduce(
          (sum, job) => sum + Number(job.platform_fee || 0),
          0
        ) || 0;

      let recentWithdrawalsFormatted: WithdrawalItem[] = [];
      const withdrawalRows = recentWithdrawalsRes.data || [];

      if (withdrawalRows.length > 0) {
        const withdrawalProfileIds = [
          ...new Set(withdrawalRows.map((item) => item.profile_id).filter(Boolean)),
        ];

        let profileMap = new Map<
          string,
          { full_name: string | null; email: string | null }
        >();

        if (withdrawalProfileIds.length > 0) {
          const profilesLookupRes = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', withdrawalProfileIds);

          if (!profilesLookupRes.error && profilesLookupRes.data) {
            profileMap = new Map(
              profilesLookupRes.data.map((profile) => [
                profile.id,
                {
                  full_name: profile.full_name,
                  email: profile.email,
                },
              ])
            );
          } else if (profilesLookupRes.error) {
            console.warn(
              'Admin dashboard withdrawals profile lookup failed:',
              profilesLookupRes.error
            );
          }
        }

        recentWithdrawalsFormatted = withdrawalRows.map((item) => {
          const rider = item.profile_id ? profileMap.get(item.profile_id) : null;

          return {
            id: item.id,
            amount: Number(item.amount || 0),
            status: item.status || 'pending',
            created_at: item.created_at,
            profile_id: item.profile_id,
            wallet_id: item.wallet_id,
            rider_name: rider?.full_name || 'Rider',
            rider_email: rider?.email || null,
          };
        });
      }

      setStats({
        totalUsers,
        totalCustomers,
        totalRiders,
        totalJobs: jobsRes.count || 0,
        completedJobs: completedJobsRes.count || 0,
        pendingVerifications: pendingVerificationsRes.count || 0,
        openDisputes: disputesRes.count || 0,
        pendingWithdrawals: pendingWithdrawalsRes.count || 0,
        platformRevenue,
      });

      setRecentJobs((recentJobsRes.data as RecentJobItem[]) || []);
      setRecentWithdrawals(recentWithdrawalsFormatted);
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const handleWindowFocus = () => {
      fetchStats();
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [fetchStats]);

  const statCards: StatCardItem[] = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      label: 'Customers',
      value: stats.totalCustomers,
      icon: UserRound,
      color: 'bg-sky-500',
      link: '/admin/customers',
    },
    {
      label: 'Total Riders',
      value: stats.totalRiders,
      icon: Package,
      color: 'bg-violet-500',
      link: '/admin/riders',
    },
    {
      label: 'Total Jobs',
      value: stats.totalJobs,
      icon: TrendingUp,
      color: 'bg-green-500',
      link: '/admin/jobs',
    },
    {
      label: 'Pending Verifications',
      value: stats.pendingVerifications,
      icon: ClipboardCheck,
      color: 'bg-amber-500',
      link: '/admin/verifications',
    },
    {
      label: 'Open Disputes',
      value: stats.openDisputes,
      icon: AlertTriangle,
      color: 'bg-red-500',
      link: '/admin/disputes',
    },
    {
      label: 'Pending Withdrawals',
      value: stats.pendingWithdrawals,
      icon: Wallet,
      color: 'bg-orange-500',
      link: '/admin/withdrawals',
    },
    {
      label: 'Platform Revenue',
      value: formatCurrency(stats.platformRevenue),
      icon: DollarSign,
      color: 'bg-emerald-500',
      link: '/admin/revenue',
    },
  ];

  const getWithdrawalStatusClass = (status?: string | null) => {
    switch ((status || 'pending').toLowerCase()) {
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'approved':
        return 'bg-blue-100 text-blue-700';
      case 'processing':
        return 'bg-violet-100 text-violet-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const renderStatCard = (card: StatCardItem) => {
    const content = (
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-gray-500 text-sm leading-5">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 break-words">
                {card.value}
              </p>
            </div>
            <div className={`${card.color} p-3 rounded-xl shrink-0`}>
              <card.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    );

    if (!card.link) {
      return <div key={card.label}>{content}</div>;
    }

    return (
      <Link key={card.label} to={card.link} className="block">
        {content}
      </Link>
    );
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-500">
          Platform overview and statistics
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(renderStatCard)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <Card className="xl:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>

            <div className="space-y-3">
              <Link
                to="/admin/verifications"
                className="block p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <p className="font-medium text-amber-900 text-sm sm:text-base">
                  Review Pending Verifications
                </p>
                <p className="text-sm text-amber-700">
                  {stats.pendingVerifications} riders waiting for approval
                </p>
              </Link>

              <Link
                to="/admin/disputes"
                className="block p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <p className="font-medium text-red-900 text-sm sm:text-base">
                  Resolve Disputes
                </p>
                <p className="text-sm text-red-700">
                  {stats.openDisputes} open disputes
                </p>
              </Link>

              <Link
                to="/admin/withdrawals"
                className="block p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <p className="font-medium text-orange-900 text-sm sm:text-base">
                  Pending Withdrawals
                </p>
                <p className="text-sm text-orange-700">
                  {stats.pendingWithdrawals} request
                  {stats.pendingWithdrawals !== 1 ? 's' : ''} awaiting action
                </p>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Platform Health
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg gap-3">
                <span className="text-sm text-gray-600">System Status</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-medium shrink-0">
                  Operational
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg gap-3">
                <span className="text-sm text-gray-600">Database</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-medium shrink-0">
                  Connected
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg gap-3">
                <span className="text-sm text-gray-600">Auth Service</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-medium shrink-0">
                  Active
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg gap-3">
                <span className="text-sm text-gray-600">Completed Jobs</span>
                <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded-full text-xs sm:text-sm font-medium shrink-0">
                  {stats.completedJobs}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Recent Jobs
              </h3>
              <Link
                to="/admin/jobs"
                className="text-sm font-medium text-violet-600 hover:text-violet-700 shrink-0"
              >
                View all
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-lg bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : recentJobs.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-gray-500 text-sm">
                No jobs yet
              </div>
            ) : (
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <Link key={job.id} to="/admin/jobs" className="block">
                    <div className="rounded-lg border p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900 break-all">
                              {job.job_number}
                            </p>
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium',
                                getStatusColorClass(job.status)
                              )}
                            >
                              {formatJobStatus(job.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 break-words">
                            {job.customer_name || 'Customer'} →{' '}
                            {job.rider_name || 'No rider yet'}
                          </p>
                        </div>

                        <div className="sm:text-right shrink-0">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(job.agreed_amount)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDateTime(job.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Recent Withdrawal Requests
              </h3>
              <Link
                to="/admin/withdrawals"
                className="text-sm font-medium text-violet-600 hover:text-violet-700 shrink-0"
              >
                View all
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-lg bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : recentWithdrawals.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-gray-500 text-sm">
                No withdrawal requests yet
              </div>
            ) : (
              <div className="space-y-3">
                {recentWithdrawals.map((request) => (
                  <Link key={request.id} to="/admin/withdrawals" className="block">
                    <div className="rounded-lg border p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">
                            {request.rider_name || 'Withdrawal Request'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {request.rider_email || 'No email'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDateTime(request.created_at)}
                          </p>
                        </div>

                        <div className="sm:text-right shrink-0">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(request.amount)}
                          </p>
                          <span
                            className={cn(
                              'inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-1',
                              getWithdrawalStatusClass(request.status)
                            )}
                          >
                            {request.status || 'pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}