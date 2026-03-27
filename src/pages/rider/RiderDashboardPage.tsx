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

  if (riderProfile?.verification_status === 'pending') {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification Pending</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Your rider application is under review. We&apos;ll notify you once your account is approved.
        </p>
      </div>
    );
  }

  if (riderProfile?.verification_status === 'rejected') {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Application Rejected</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Unfortunately, your rider application was not approved. Please contact support for more
          information.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rider Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.full_name?.split(' ')[0]}</p>
        </div>

        <div
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full font-medium',
            riderProfile?.is_online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          )}
        >
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              riderProfile?.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            )}
          />
          {riderProfile?.is_online ? 'Online' : 'Offline'}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm">Available to Withdraw</p>
                <p className="text-2xl font-bold">{formatCurrency(availableBalance)}</p>
              </div>
              <Wallet className="w-8 h-8 text-violet-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Lifetime Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalEarnings)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDeliveries}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Rating</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold text-gray-900">{stats.rating.toFixed(1)}</p>
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                </div>
              </div>
              <Star className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {myJobs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">My Active Jobs</h2>
            <Link
              to="/rider/jobs"
              className="text-violet-600 hover:text-violet-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {myJobs.slice(0, 3).map((job) => (
              <Link key={job.id} to={`/rider/jobs/${job.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-500">{job.job_number}</span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              getStatusColorClass(job.status)
                            )}
                          >
                            {formatJobStatus(job.status)}
                          </span>
                        </div>
                        <p className="text-gray-700">
                          {job.pickup_address} → {job.delivery_address}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-violet-700">
                          {formatCurrency(job.rider_earnings)}
                        </p>
                        <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Available Jobs</h2>
          <span className="text-sm text-gray-500">
            {availableJobs.length} assigned job{availableJobs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {availableJobs.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs available</h3>
              <p className="text-gray-500">No delivery is currently waiting for your acceptance.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {availableJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-500">{job.job_number}</span>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(job.created_at)}
                        </span>
                      </div>

                      <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-violet-500" />
                          <span className="text-gray-600 truncate">{job.pickup_address}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-green-500" />
                          <span className="text-gray-600 truncate">{job.delivery_address}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-500">{job.package_description}</p>
                    </div>

                    <div className="text-right ml-4">
                      <p className="font-semibold text-violet-700">
                        {formatCurrency(job.rider_earnings)}
                      </p>
                      <p className="text-xs text-gray-400">You earn</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleAcceptJob(job.id)}
                    disabled={acceptingJobId === job.id}
                    className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {acceptingJobId === job.id ? 'Accepting...' : 'Accept Job'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}