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

  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];

    switch (filter) {
      case 'active':
        filtered = filtered.filter((job) =>
          [
            'awaiting_rider',
            'awaiting_funding',
            'funded',
            'in_progress',
            'rider_marked_complete',
            'customer_marked_complete',
          ].includes(job.status)
        );
        break;
      case 'completed':
        filtered = filtered.filter((job) => job.status === 'completed');
        break;
      case 'cancelled':
        filtered = filtered.filter((job) => ['cancelled', 'refunded'].includes(job.status));
        break;
      default:
        break;
    }

    return filtered;
  }, [jobs, filter]);

  const filters: { value: RiderJobFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
        <p className="text-gray-500">View and manage your deliveries</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              filter === item.value
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <button type="button" onClick={() => setShowJobsList((prev) => !prev)} className="w-full">
        <Card className="border-violet-100 bg-violet-50/50 hover:bg-violet-50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-left">
                <h2 className="text-lg font-semibold text-gray-900">Jobs</h2>
                <p className="text-sm text-gray-500">
                  {filteredJobs.length} {filter} job{filteredJobs.length !== 1 ? 's' : ''}
                </p>
              </div>

              {showJobsList ? (
                <ChevronUp className="w-5 h-5 text-violet-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-violet-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </button>

      {showJobsList && (
        <>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 h-24" />
                </Card>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filter === 'all' ? 'No jobs yet' : `No ${filter} jobs`}
                </h3>
                <p className="text-gray-500 mb-4">Accept jobs from your dashboard to get started</p>
                <Link to="/rider">
                  <Button className="bg-violet-600 text-white">Go to Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <Link key={job.id} to={`/rider/jobs/${job.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
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

                          <div className="space-y-2">
                            <div className="flex items-start gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                              <span className="text-gray-600 break-words">{job.pickup_address}</span>
                            </div>

                            <div className="flex items-start gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                              <span className="text-gray-600 break-words">{job.delivery_address}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:block sm:text-right shrink-0">
                          <div>
                            <p className="font-semibold text-violet-700">
                              {formatCurrency(job.rider_earnings)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDistanceToNow(job.created_at)}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 sm:ml-auto mt-1" />
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