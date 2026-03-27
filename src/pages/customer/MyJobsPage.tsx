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

  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];

    switch (filter) {
      case 'active':
        filtered = filtered.filter((j) =>
          [
            'awaiting_rider',
            'awaiting_funding',
            'funded',
            'in_progress',
            'rider_marked_complete',
          ].includes(j.status)
        );
        break;
      case 'completed':
        filtered = filtered.filter((j) => j.status === 'completed');
        break;
      case 'cancelled':
        filtered = filtered.filter((j) => ['cancelled', 'refunded'].includes(j.status));
        break;
      default:
        break;
    }

    return filtered;
  }, [jobs, filter]);

  const filters: { value: JobFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Deliveries</h1>
          <p className="text-gray-500">Track and manage your deliveries</p>
        </div>

        <Link to="/create-job">
          <Button className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
            New Delivery
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              filter === f.value
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <button type="button" onClick={() => setShowJobsList((prev) => !prev)} className="w-full">
        <Card className="border-violet-100 bg-violet-50/50 hover:bg-violet-50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-left">
                <h2 className="text-lg font-semibold text-gray-900">Deliveries</h2>
                <p className="text-sm text-gray-500">
                  {filteredJobs.length} {filter} deliver{filteredJobs.length !== 1 ? 'ies' : 'y'}
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
                  <CardContent className="p-4">
                    <div className="h-20 bg-gray-200 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>

                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filter === 'all' ? 'No deliveries yet' : `No ${filter} deliveries`}
                </h3>

                <p className="text-gray-500 mb-4">
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
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <Link key={job.id} to={`/jobs/${job.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="text-sm font-medium text-gray-500">{job.job_number}</span>
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium',
                                getStatusColorClass(job.status)
                              )}
                            >
                              {formatJobStatus(job.status)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(job.created_at)}
                            </span>
                          </div>

                          <div className="space-y-2 mb-3">
                            <div className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                              <span className="text-sm text-gray-600 break-words">
                                {job.pickup_address}
                              </span>
                            </div>

                            <div className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                              <span className="text-sm text-gray-600 break-words">
                                {job.delivery_address}
                              </span>
                            </div>
                          </div>

                          {job.rider_name && (
                            <div className="flex items-center gap-2 text-sm min-w-0">
                              <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-xs font-medium text-violet-700 shrink-0">
                                {job.rider_name.charAt(0)}
                              </div>
                              <span className="text-gray-600 break-words">{job.rider_name}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:block sm:text-right shrink-0">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(job.agreed_amount)}
                          </p>
                          <ChevronRight className="w-5 h-5 text-gray-400 sm:ml-auto mt-2" />
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