// ============================================
// DISPATCH NG - Admin Jobs Page
// ============================================

import { useEffect, useMemo, useState } from 'react';
import { Search, MapPin, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import type { JobDetails } from '@/types';
import {
  formatCurrency,
  formatDateTime,
  getStatusColorClass,
  formatJobStatus,
} from '@/utils/format';
import { cn } from '@/lib/utils';

export function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('job_details')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs;

    const query = searchQuery.toLowerCase();
    return jobs.filter(
      (job) =>
        job.job_number?.toLowerCase().includes(query) ||
        job.customer_name?.toLowerCase().includes(query) ||
        job.rider_name?.toLowerCase().includes(query) ||
        job.pickup_address?.toLowerCase().includes(query) ||
        job.delivery_address?.toLowerCase().includes(query)
    );
  }, [jobs, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Jobs</h1>
        <p className="text-gray-500">Monitor all deliveries on the platform</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search by job number, customer, rider, or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-24" />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center text-gray-500">
            No jobs found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <Card
              key={job.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedJob(job)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-medium text-gray-900">{job.job_number}</span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          getStatusColorClass(job.status)
                        )}
                      >
                        {formatJobStatus(job.status)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500">
                      {job.customer_name || 'Customer'} → {job.rider_name || 'No rider'}
                    </p>

                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{job.pickup_address}</span>
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-violet-500" />
                        <span className="truncate">{job.delivery_address}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900">{formatCurrency(job.agreed_amount)}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(job.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="font-semibold text-lg text-gray-900">{selectedJob.job_number}</span>
                <span
                  className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    getStatusColorClass(selectedJob.status)
                  )}
                >
                  {formatJobStatus(selectedJob.status)}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500 mb-1">Customer</p>
                  <p className="font-medium text-gray-900">{selectedJob.customer_name || 'N/A'}</p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500 mb-1">Rider</p>
                  <p className="font-medium text-gray-900">{selectedJob.rider_name || 'Not assigned'}</p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500 mb-1">Amount</p>
                  <p className="font-medium text-gray-900">{formatCurrency(selectedJob.agreed_amount)}</p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500 mb-1">Platform Fee</p>
                  <p className="font-medium text-gray-900">{formatCurrency(selectedJob.platform_fee)}</p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500 mb-1">Rider Earnings</p>
                  <p className="font-medium text-violet-700">{formatCurrency(selectedJob.rider_earnings)}</p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500 mb-1">Created</p>
                  <p className="font-medium text-gray-900">{formatDateTime(selectedJob.created_at)}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-gray-500 mb-2">Pickup</p>
                  <p className="font-medium text-gray-900">{selectedJob.pickup_address}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedJob.pickup_contact_name || 'No contact'} • {selectedJob.pickup_contact_phone || 'No phone'}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-gray-500 mb-2">Delivery</p>
                  <p className="font-medium text-gray-900">{selectedJob.delivery_address}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedJob.delivery_contact_name || 'No contact'} • {selectedJob.delivery_contact_phone || 'No phone'}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Package
                </p>
                <p className="text-gray-900">{selectedJob.package_description || 'No description'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}