// ============================================
// DISPATCH NG - My Jobs Page
// ============================================
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  MapPin,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock3,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

type JobFilter = 'all' | 'active' | 'completed' | 'cancelled';

export function MyJobsPage() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<JobDetails[]>([]);
  const [filter, setFilter] = useState<JobFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showJobsList, setShowJobsList] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('job_details')
        .select('*')
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setJobs(data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      showToast('error', 'Error', 'Failed to load your deliveries');
    } finally {
      setIsLoading(false);
    }
  };

  const activeJobs = useMemo(
    () =>
      jobs.filter((j) =>
        [
          'awaiting_rider',
          'awaiting_funding',
          'funded',
          'in_progress',
          'rider_marked_complete',
        ].includes(j.status)
      ),
    [jobs]
  );

  const completedJobs = useMemo(() => jobs.filter((j) => j.status === 'completed'), [jobs]);

  const cancelledJobs = useMemo(
    () => jobs.filter((j) => ['cancelled', 'refunded'].includes(j.status)),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    switch (filter) {
      case 'active':
        return activeJobs;
      case 'completed':
        return completedJobs;
      case 'cancelled':
        return cancelledJobs;
      default:
        return jobs;
    }
  }, [jobs, filter, activeJobs, completedJobs, cancelledJobs]);

  const filters: { value: JobFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: jobs.length },
    { value: 'active', label: 'Active', count: activeJobs.length },
    { value: 'completed', label: 'Completed', count: completedJobs.length },
    { value: 'cancelled', label: 'Cancelled', count: cancelledJobs.length },
  ];

  const filterSummaryLabel =
    filter === 'all'
      ? `${filteredJobs.length} total deliver${filteredJobs.length !== 1 ? 'ies' : 'y'}`
      : `${filteredJobs.length} ${filter} deliver${filteredJobs.length !== 1 ? 'ies' : 'y'}`;

  const getCardAccent = (status: string) => {
    switch (status) {
      case 'completed':
        return 'from-emerald-400 to-green-500';
      case 'in_progress':
      case 'rider_marked_complete':
        return 'from-blue-400 to-cyan-500';
      case 'awaiting_rider':
      case 'awaiting_funding':
      case 'funded':
        return 'from-violet-500 to-fuchsia-500';
      case 'cancelled':
      case 'refunded':
      case 'disputed':
        return 'from-rose-400 to-red-500';
      default:
        return 'from-gray-300 to-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Deliveries</h1>
          <p className="text-gray-500">Track and manage your deliveries</p>
        </div>

        
      </div>

      <div className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50/80 via-white to-fuchsia-50/70 p-3 shadow-sm">
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((f) => {
            const isActive = filter === f.value;

            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'group flex shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-2xl border px-5 py-2.5 transition-all duration-200',
                  isActive
                    ? 'border-violet-200 bg-white text-violet-700 shadow-sm shadow-violet-100'
                    : 'border-gray-200 bg-white/70 text-gray-600 hover:bg-white hover:text-gray-900'
                )}
              >
                <span className="text-sm font-semibold">{f.label}</span>

                <span
                  className={cn(
                    'inline-flex min-w-[1.6rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                    isActive
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button type="button" onClick={() => setShowJobsList((prev) => !prev)} className="w-full">
        <Card className="overflow-hidden border-violet-100 bg-gradient-to-br from-violet-50/70 via-white to-fuchsia-50/50 shadow-sm transition-all duration-200 hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 text-left">
                <h2 className="text-xl font-semibold text-gray-900">Deliveries</h2>
                <p className="mt-1 text-sm text-gray-500">{filterSummaryLabel}</p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-violet-600 shadow-sm ring-1 ring-violet-100">
                {showJobsList ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </button>

      {showJobsList && (
        <>
          {isLoading ? (
            <div className="space-y-4 pt-2">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-5">
                    <div className="h-28 rounded-2xl bg-gray-200" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>

                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  {filter === 'all' ? 'No deliveries yet' : `No ${filter} deliveries`}
                </h3>

                <p className="mb-4 text-gray-500">
                  {filter === 'all'
                    ? 'Create your first delivery to get started'
                    : 'Try a different filter'}
                </p>

                {filter === 'all' && (
                  <Link to="/create-job">
                    <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
                      Create Delivery
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6 rounded-3xl bg-gray-50/60 p-2">
              {filteredJobs.map((job) => (
                <Link key={job.id} to={`/jobs/${job.id}`} className="block">
                  <Card className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 active:scale-[0.985] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
                    <div
                      className={cn(
                        'absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b',
                        getCardAccent(job.status)
                      )}
                    />
                    <CardContent className="p-5 pl-6 sm:p-6 sm:pl-7">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-4 flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold tracking-tight text-gray-600">
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

                          <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
                            <Clock3 className="h-4 w-4" />
                            <span>{formatDistanceToNow(job.created_at)}</span>
                          </div>

                          <div className="mb-4 space-y-3">
                            <div className="flex items-start gap-2.5">
                              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" />
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                              <span className="break-words text-sm text-gray-600">
                                {job.pickup_address}
                              </span>
                            </div>

                            <div className="flex items-start gap-2.5">
                              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                              <span className="break-words text-sm text-gray-600">
                                {job.delivery_address}
                              </span>
                            </div>
                          </div>

                          {job.rider_name && (
                            <div className="flex min-w-0 items-center gap-2.5 text-sm">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                                {job.rider_name.charAt(0)}
                              </div>
                              <span className="break-words text-gray-600">{job.rider_name}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center justify-between sm:block sm:text-right">
                          <div>
                            <p className="text-lg font-semibold text-gray-900">
                              {formatCurrency(job.agreed_amount)}
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
        </>
      )}
    </div>
  );
}
