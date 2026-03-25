// ============================================
// DISPATCH NG - My Jobs Page
// ============================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, MapPin, Clock, ChevronRight, Filter,
  CheckCircle, XCircle, Clock4, AlertCircle 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/uiStore';
import type { JobDetails } from '@/types';
import { formatCurrency, formatDate, formatDistanceToNow, getStatusColorClass, formatJobStatus } from '@/utils/format';
import { cn } from '@/lib/utils';

type JobFilter = 'all' | 'active' | 'completed' | 'cancelled';

export function MyJobsPage() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<JobDetails[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobDetails[]>([]);
  const [filter, setFilter] = useState<JobFilter>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [filter, jobs]);

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
        setFilteredJobs(data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      showToast('error', 'Error', 'Failed to load your deliveries');
    } finally {
      setIsLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = [...jobs];

    switch (filter) {
      case 'active':
        filtered = filtered.filter(j => 
          ['awaiting_rider', 'awaiting_funding', 'funded', 'in_progress', 'rider_marked_complete'].includes(j.status)
        );
        break;
      case 'completed':
        filtered = filtered.filter(j => j.status === 'completed');
        break;
      case 'cancelled':
        filtered = filtered.filter(j => ['cancelled', 'refunded'].includes(j.status));
        break;
    }

    setFilteredJobs(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
      case 'refunded':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'in_progress':
        return <Clock4 className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const filters: { value: JobFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Deliveries</h1>
          <p className="text-gray-500">Track and manage your deliveries</p>
        </div>
        <Link to="/create-job">
          <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
            New Delivery
          </Button>
        </Link>
      </div>

      {/* Filters */}
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

      {/* Jobs List */}
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
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-medium text-gray-500">{job.job_number}</span>
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getStatusColorClass(job.status))}>
                          {formatJobStatus(job.status)}
                        </span>
                        <span className="text-xs text-gray-400">{formatDistanceToNow(job.created_at)}</span>
                      </div>

                      {/* Route */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-violet-500" />
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 truncate">{job.pickup_address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 truncate">{job.delivery_address}</span>
                        </div>
                      </div>

                      {/* Rider Info */}
                      {job.rider_name && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-xs font-medium text-violet-700">
                            {job.rider_name.charAt(0)}
                          </div>
                          <span className="text-gray-600">{job.rider_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(job.agreed_amount)}</p>
                      <ChevronRight className="w-5 h-5 text-gray-400 ml-auto mt-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
