// ============================================
// DISPATCH NG - Rider Dashboard Page
// ============================================
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Wallet,
  Star,
  TrendingUp,
  CheckCircle,
  MapPin,
  ChevronRight,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock3,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/uiStore';
import type { JobDetails } from '@/types';
import {
  formatCurrency,
  formatDistanceToNow,
  getStatusColorClass,
  formatJobStatus,
} from '@/utils/format';
import { cn } from '@/lib/utils';

export function RiderDashboardPage() {
  const { user, riderProfile } = useAuthStore();

  const [availableJobs, setAvailableJobs] = useState<JobDetails[]>([]);
  const [myJobs, setMyJobs] = useState<JobDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [showActiveJobs, setShowActiveJobs] = useState(true);
  const [showAvailableJobs, setShowAvailableJobs] = useState(true);

  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalDeliveries: 0,
    rating: 0,
    pendingJobs: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      setAvailableJobs([]);
      setMyJobs([]);
      setAvailableBalance(0);
      setStats({
        totalEarnings: 0,
        totalDeliveries: 0,
        rating: 0,
        pendingJobs: 0,
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('id, available_balance')
        .eq('profile_id', user.id)
        .single();

      if (walletError && walletError.code !== 'PGRST116') {
        throw walletError;
      }

      setAvailableBalance(Number(walletData?.available_balance || 0));

      const { data: jobsData, error: jobsError } = await supabase
        .from('job_details')
        .select('*')
        .eq('rider_id', user.id)
        .eq('status', 'awaiting_rider')
        .order('created_at', { ascending: false })
        .limit(10);

      if (jobsError) throw jobsError;
      setAvailableJobs(jobsData ?? []);

      const { data: myJobsData, error: myJobsError } = await supabase
        .from('job_details')
        .select('*')
        .eq('rider_id', user.id)
        .in('status', [
          'awaiting_funding',
          'funded',
          'in_progress',
          'rider_marked_complete',
          'customer_marked_complete',
        ])
        .order('created_at', { ascending: false });

      if (myJobsError) throw myJobsError;
      setMyJobs(myJobsData ?? []);

      const { data: completedJobs, error: completedJobsError } = await supabase
        .from('dispatch_jobs')
        .select('id, rider_earnings')
        .eq('rider_id', user.id)
        .eq('status', 'completed');

      if (completedJobsError) throw completedJobsError;

      const totalEarnings =
        completedJobs?.reduce((sum, job) => sum + Number(job.rider_earnings || 0), 0) || 0;

      const totalDeliveries = completedJobs?.length || 0;

      setStats({
        totalEarnings,
        totalDeliveries,
        rating: Number(riderProfile?.rating_average || 0),
        pendingJobs: myJobsData?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      showToast('error', 'Error', 'Failed to load rider dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, riderProfile?.rating_average]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const handleWindowFocus = () => {
      fetchDashboardData();
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [fetchDashboardData]);

  const handleAcceptJob = async (jobId: string) => {
    if (!user?.id) {
      showToast('error', 'Error', 'You must be signed in');
      return;
    }

    try {
      setAcceptingJobId(jobId);

      const { data: existingJob, error: existingJobError } = await supabase
        .from('dispatch_jobs')
        .select('id, rider_id, status')
        .eq('id', jobId)
        .eq('rider_id', user.id)
        .maybeSingle();

      if (existingJobError) throw existingJobError;

      if (!existingJob) {
        throw new Error('Job not found for this rider.');
      }

      if (existingJob.status !== 'awaiting_rider') {
        throw new Error(`This job is already in "${existingJob.status}" state.`);
      }

      const { error: updateError } = await supabase
        .from('dispatch_jobs')
        .update({
          status: 'awaiting_funding',
          rider_assigned_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .eq('rider_id', user.id)
        .eq('status', 'awaiting_rider');

      if (updateError) throw updateError;

      const { data: updatedJob, error: verifyError } = await supabase
        .from('dispatch_jobs')
        .select('id, rider_id, status, rider_assigned_at')
        .eq('id', jobId)
        .eq('rider_id', user.id)
        .maybeSingle();

      if (verifyError) throw verifyError;

      if (!updatedJob) {
        throw new Error('Could not verify job after acceptance.');
      }

      if (updatedJob.status !== 'awaiting_funding') {
        throw new Error(
          `Job acceptance did not persist. Current status is still "${updatedJob.status}".`
        );
      }

      showToast('success', 'Job accepted!', 'Waiting for customer to fund the delivery');
      await fetchDashboardData();
    } catch (error: any) {
      console.error('Accept job error:', error);
      showToast('error', 'Error', error.message || 'Job acceptance failed');
    } finally {
      setAcceptingJobId(null);
    }
  };

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    accent,
    iconClassName,
    subtitle,
    valueClassName,
    children,
    featured = false,
  }: {
    title: string;
    value: string;
    icon: React.ElementType;
    accent: string;
    iconClassName: string;
    subtitle?: string;
    valueClassName?: string;
    children?: React.ReactNode;
    featured?: boolean;
  }) => (
    <Card
      className={cn(
        'group relative overflow-hidden rounded-[30px] border shadow-[0_10px_35px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(15,23,42,0.10)]',
        featured
          ? 'border-violet-100 bg-gradient-to-br from-white via-violet-50/60 to-fuchsia-50/60'
          : 'border-gray-100 bg-white'
      )}
    >
      <div className={cn('absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b', accent)} />
      {featured && (
        <>
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-200/25 blur-2xl" />
          <div className="absolute -bottom-12 left-10 h-28 w-28 rounded-full bg-fuchsia-200/20 blur-2xl" />
        </>
      )}

      <CardContent className="relative p-5 pl-6 sm:p-6 sm:pl-7">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p
              className={cn(
                'text-sm font-medium uppercase tracking-[0.18em]',
                featured ? 'text-gray-500' : 'text-gray-400'
              )}
            >
              {title}
            </p>

            <div className="mt-3">
              <p
                className={cn(
                  'break-words text-3xl font-bold tracking-tight text-gray-950',
                  featured && 'text-[2.2rem] sm:text-[2.35rem]',
                  valueClassName
                )}
              >
                {value}
              </p>

              {subtitle && <p className="mt-2 text-sm text-gray-500">{subtitle}</p>}
              {children}
            </div>
          </div>

          <div
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all duration-200',
              featured ? 'shadow-sm ring-1 ring-white/70' : '',
              iconClassName
            )}
          >
            <Icon className={cn('h-8 w-8', featured && 'scale-105')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SectionHeader = ({
    title,
    subtitle,
    isOpen,
    onToggle,
    tone = 'violet',
    rightContent,
  }: {
    title: string;
    subtitle: string;
    isOpen: boolean;
    onToggle: () => void;
    tone?: 'violet' | 'emerald';
    rightContent?: React.ReactNode;
  }) => (
    <button type="button" onClick={onToggle} className="w-full">
      <Card
        className={cn(
          'overflow-hidden rounded-[28px] shadow-sm transition-all duration-200 hover:shadow-md',
          tone === 'violet'
            ? 'border-violet-100 bg-gradient-to-br from-violet-50/80 via-white to-fuchsia-50/60'
            : 'border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-green-50/60'
        )}
      >
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1 text-left">
              <h2 className="text-xl font-semibold tracking-tight text-gray-900">{title}</h2>
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            </div>

            <div className="flex items-center gap-3">
              {rightContent}
              <div
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm',
                  tone === 'violet'
                    ? 'text-violet-600 ring-1 ring-violet-100'
                    : 'text-emerald-600 ring-1 ring-emerald-100'
                )}
              >
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );

  if (riderProfile?.verification_status === 'pending') {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="mx-auto mb-4 h-16 w-16 text-amber-500" />
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Verification Pending</h2>
        <p className="mx-auto max-w-md text-gray-500">
          Your rider application is under review. We&apos;ll notify you once your account is approved.
        </p>
      </div>
    );
  }

  if (riderProfile?.verification_status === 'rejected') {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Application Rejected</h2>
        <p className="mx-auto max-w-md text-gray-500">
          Unfortunately, your rider application was not approved. Please contact support for more
          information.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="relative overflow-hidden rounded-[32px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/70 p-5 shadow-sm sm:p-6">
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-violet-200/25 blur-3xl" />
        <div className="absolute -bottom-14 left-8 h-32 w-32 rounded-full bg-fuchsia-200/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-100 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Dispatch NG Rider
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-950">Rider Dashboard</h1>
            <p className="mt-2 text-base text-gray-600">
              Welcome back, {user?.full_name?.split(' ')[0]}
            </p>
          </div>

          <div
            className={cn(
              'inline-flex w-fit items-center gap-2 rounded-full px-4 py-2.5 font-medium shadow-sm ring-1',
              riderProfile?.is_online
                ? 'bg-green-100 text-green-700 ring-green-200'
                : 'bg-gray-100 text-gray-600 ring-gray-200'
            )}
          >
            <div
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                riderProfile?.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              )}
            />
            {riderProfile?.is_online ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-[32px] bg-gradient-to-b from-gray-50/90 to-white p-2">
        <MetricCard
          title="Available to Withdraw"
          value={formatCurrency(availableBalance)}
          icon={Wallet}
          accent="from-violet-500 to-fuchsia-500"
          iconClassName="bg-violet-50 text-violet-500 group-hover:bg-violet-100"
          subtitle="Ready for payout when you request withdrawal"
          featured
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            title="Lifetime Earnings"
            value={formatCurrency(stats.totalEarnings)}
            icon={TrendingUp}
            accent="from-emerald-400 to-green-500"
            iconClassName="bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100"
            subtitle="Total confirmed rider income"
          />

          <MetricCard
            title="Deliveries"
            value={`${stats.totalDeliveries}`}
            icon={CheckCircle}
            accent="from-blue-400 to-cyan-500"
            iconClassName="bg-blue-50 text-blue-500 group-hover:bg-blue-100"
            subtitle="Completed successfully"
          />

          <MetricCard
            title="Rating"
            value={stats.rating.toFixed(1)}
            icon={Star}
            accent="from-amber-400 to-orange-500"
            iconClassName="bg-amber-50 text-amber-500 group-hover:bg-amber-100"
            subtitle="Current customer average"
          >
            <div className="mt-2 flex items-center gap-1 text-amber-500">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium text-gray-500">Based on completed jobs</span>
            </div>
          </MetricCard>
        </div>
      </div>

      {myJobs.length > 0 && (
        <div className="space-y-3">
          <SectionHeader
            title="My Active Jobs"
            subtitle={`${myJobs.length} active job${myJobs.length !== 1 ? 's' : ''} in progress`}
            isOpen={showActiveJobs}
            onToggle={() => setShowActiveJobs((prev) => !prev)}
            tone="violet"
            rightContent={
              <Link
                to="/rider/jobs"
                onClick={(e) => e.stopPropagation()}
                className="hidden text-sm font-medium text-violet-600 hover:text-violet-700 sm:inline"
              >
                View All
              </Link>
            }
          />

          {showActiveJobs && (
            <div className="space-y-5 rounded-[32px] bg-gradient-to-b from-gray-50/90 to-white p-2">
              {myJobs.slice(0, 3).map((job) => (
                <Link key={job.id} to={`/rider/jobs/${job.id}`}>
                  <Card className="group relative cursor-pointer overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 active:scale-[0.995] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-violet-500 to-fuchsia-500" />

                    <CardContent className="p-5 pl-6 sm:p-6 sm:pl-7">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold tracking-tight text-gray-700">
                              {job.job_number}
                            </span>
                            <span
                              className={cn(
                                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                                getStatusColorClass(job.status)
                              )}
                            >
                              {formatJobStatus(job.status)}
                            </span>
                          </div>

                          <div className="space-y-3">
                            <div className="rounded-2xl bg-gray-50 p-4">
                              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                                <MapPin className="h-3.5 w-3.5 text-violet-500" />
                                Pickup
                              </div>
                              <p className="break-words text-sm leading-6 text-gray-700">
                                {job.pickup_address}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-violet-50/70 p-4">
                              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                                <MapPin className="h-3.5 w-3.5 text-green-500" />
                                Delivery
                              </div>
                              <p className="break-words text-sm leading-6 text-gray-700">
                                {job.delivery_address}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center justify-between sm:block sm:w-[132px] sm:text-right">
                          <div>
                            <p className="text-2xl font-bold tracking-tight text-violet-700">
                              {formatCurrency(job.rider_earnings)}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-gray-400">
                              You earn
                            </p>
                          </div>

                          <div className="mt-3 flex h-11 w-11 items-center justify-center rounded-full bg-violet-50 text-gray-400 transition-colors duration-200 group-hover:bg-violet-100 group-hover:text-violet-600 sm:ml-auto">
                            <ChevronRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <SectionHeader
          title="Available Jobs"
          subtitle={`${availableJobs.length} assigned job${availableJobs.length !== 1 ? 's' : ''}`}
          isOpen={showAvailableJobs}
          onToggle={() => setShowAvailableJobs((prev) => !prev)}
          tone="emerald"
        />

        {showAvailableJobs && (
          <>
            {availableJobs.length === 0 ? (
              <Card className="rounded-[28px] border-2 border-dashed">
                <CardContent className="p-8 text-center">
                  <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900">No jobs available</h3>
                  <p className="text-gray-500">
                    No delivery is currently waiting for your acceptance.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-5 rounded-[32px] bg-gradient-to-b from-gray-50/90 to-white p-2">
                {availableJobs.map((job) => (
                  <Card
                    key={job.id}
                    className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]"
                  >
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald-400 to-green-500" />

                    <CardContent className="p-5 pl-6 sm:p-6 sm:pl-7">
                      <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold tracking-tight text-gray-700">
                                {job.job_number}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock3 className="h-3.5 w-3.5" />
                                {formatDistanceToNow(job.created_at)}
                              </span>
                            </div>

                            <div className="mb-4 space-y-3">
                              <div className="rounded-2xl bg-gray-50 p-4">
                                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                                  <MapPin className="h-3.5 w-3.5 text-violet-500" />
                                  Pickup
                                </div>
                                <p className="break-words text-sm leading-6 text-gray-700">
                                  {job.pickup_address}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-emerald-50/80 p-4">
                                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                  <MapPin className="h-3.5 w-3.5 text-green-500" />
                                  Delivery
                                </div>
                                <p className="break-words text-sm leading-6 text-gray-700">
                                  {job.delivery_address}
                                </p>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-gray-100 bg-white p-4">
                              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                                Package
                              </p>
                              <p className="break-words text-sm leading-6 text-gray-600">
                                {job.package_description}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 sm:w-[130px] sm:text-right">
                            <p className="text-2xl font-bold tracking-tight text-violet-700">
                              {formatCurrency(job.rider_earnings)}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-gray-400">
                              You earn
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleAcceptJob(job.id)}
                          disabled={acceptingJobId === job.id}
                          className="h-12 w-full rounded-2xl bg-violet-600 text-white hover:bg-violet-700"
                        >
                          {acceptingJobId === job.id ? 'Accepting...' : 'Accept Job'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}