// ============================================
// DISPATCH NG - Rider Jobs Page
// ============================================
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  MapPin,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { JobDetails } from '@/types';
import {
  formatCurrency,
  formatDistanceToNow,
  getStatusColorClass,
  formatJobStatus,
} from '@/utils/format';
import { cn } from '@/lib/utils';

type RiderJobFilter = 'all' | 'active' | 'completed' | 'cancelled';

export function RiderJobsPage() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<JobDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<RiderJobFilter>('all');
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
        .eq('rider_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const activeJobs = useMemo(
    () =>
      jobs.filter((job) =>
        [
          'awaiting_rider',
          'awaiting_funding',
          'funded',
          'in_progress',
          'rider_marked_complete',
          'customer_marked_complete',
        ].includes(job.status)
      ),
    [jobs]
  );

  const completedJobs = useMemo(
    () => jobs.filter((job) => job.status === 'completed'),
    [jobs]
  );

  const cancelledJobs = useMemo(
    () => jobs.filter((job) => ['cancelled', 'refunded'].includes(job.status)),
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

  const filters: { value: RiderJobFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: jobs.length },
    { value: 'active', label: 'Active', count: activeJobs.length },
    { value: 'completed', label: 'Completed', count: completedJobs.length },
    { value: 'cancelled', label: 'Cancelled', count: cancelledJobs.length },
  ];

  const filterSummaryLabel =
    filter === 'all'
      ? `${filteredJobs.length} total job${filteredJobs.length !== 1 ? 's' : ''}`
      : `${filteredJobs.length} ${filter} job${filteredJobs.length !== 1 ? 's' : ''}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
        <p className="text-gray-500">View and manage your deliveries</p>
      </div>

      <div className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50/80 via-white to-fuchsia-50/70 p-2 shadow-sm">
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((item) => {
            const isActive = filter === item.value;

            return (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={cn(
                  'group flex shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-2xl border px-4 py-2.5 transition-all duration-200',
                  isActive
                    ? 'border-violet-200 bg-white text-violet-700 shadow-sm shadow-violet-100'
                    : 'border-transparent bg-transparent text-gray-600 hover:border-white/70 hover:bg-white/70 hover:text-gray-900'
                )}
              >
                <span className="text-sm font-semibold">{item.label}</span>
                <span
                  className={cn(
                    'inline-flex min-w-[1.6rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold transition-colors',
                    isActive
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                  )}
                >
                  {item.count}
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
                <h2 className="text-xl font-semibold text-gray-900">Jobs</h2>
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
            <div className="space-y-4 pt-1">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-24 p-4" />
                </Card>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="p-8 text-center">
                <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  {filter === 'all' ? 'No jobs yet' : `No ${filter} jobs`}
                </h3>
                <p className="mb-4 text-gray-500">Accept jobs from your dashboard to get started</p>
                <Link to="/rider">
                  <Button className="bg-violet-600 text-white">Go to Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-5 pt-1">
              {filteredJobs.map((job) => (
                <Link key={job.id} to={`/rider/jobs/${job.id}`}>
                  <Card className="cursor-pointer border-gray-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-4 flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">{job.job_number}</span>
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
                            <div className="flex items-start gap-2.5 text-sm">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                              <span className="break-words text-gray-600">{job.pickup_address}</span>
                            </div>

                            <div className="flex items-start gap-2.5 text-sm">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                              <span className="break-words text-gray-600">
                                {job.delivery_address}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center justify-between sm:block sm:text-right">
                          <div>
                            <p className="text-lg font-semibold text-violet-700">
                              {formatCurrency(job.rider_earnings)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDistanceToNow(job.created_at)}
                            </p>
                          </div>
                          <ChevronRight className="mt-2 h-5 w-5 text-gray-400 sm:ml-auto" />
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
