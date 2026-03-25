// ============================================
// DISPATCH NG - Rider Jobs Page
// ============================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, MapPin, ChevronRight, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { JobDetails } from '@/types';
import { formatCurrency, formatDistanceToNow, getStatusColorClass, formatJobStatus } from '@/utils/format';
import { cn } from '@/lib/utils';

export function RiderJobsPage() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<JobDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
        <p className="text-gray-500">View and manage your deliveries</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-24" />
            </Card>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
            <p className="text-gray-500 mb-4">Accept jobs from your dashboard to get started</p>
            <Link to="/rider">
              <Button className="bg-violet-600 text-white">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link key={job.id} to={`/rider/jobs/${job.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-500">{job.job_number}</span>
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getStatusColorClass(job.status))}>
                          {formatJobStatus(job.status)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-violet-500" />
                          <span className="text-gray-600 truncate">{job.pickup_address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-green-500" />
                          <span className="text-gray-600 truncate">{job.delivery_address}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-violet-700">{formatCurrency(job.rider_earnings)}</p>
                      <p className="text-xs text-gray-400">{formatDistanceToNow(job.created_at)}</p>
                      <ChevronRight className="w-5 h-5 text-gray-400 ml-auto mt-1" />
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
