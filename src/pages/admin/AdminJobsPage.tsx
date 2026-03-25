// ============================================
// DISPATCH NG - Admin Jobs Page
// ============================================

import { useEffect, useState } from 'react';
import { Search, MapPin, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import type { JobDetails } from '@/types';
import { formatCurrency, formatDateTime, getStatusColorClass, formatJobStatus } from '@/utils/format';
import { cn } from '@/lib/utils';

export function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobDetails[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [searchQuery, jobs]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job_details')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      if (data) {
        setJobs(data);
        setFilteredJobs(data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterJobs = () => {
    if (!searchQuery) {
      setFilteredJobs(jobs);
      return;
    }
    const query = searchQuery.toLowerCase();
    setFilteredJobs(jobs.filter(j => 
      j.job_number.toLowerCase().includes(query) ||
      j.customer_name?.toLowerCase().includes(query) ||
      j.rider_name?.toLowerCase().includes(query)
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Jobs</h1>
        <p className="text-gray-500">Monitor all deliveries on the platform</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search by job number, customer, or rider..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Card key={i} className="animate-pulse h-20" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map(job => (
            <Card key={job.id} className="cursor-pointer hover:shadow-md" onClick={() => setSelectedJob(job)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{job.job_number}</span>
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getStatusColorClass(job.status))}>
                        {formatJobStatus(job.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {job.customer_name} → {job.rider_name || 'No rider'}
                    </p>
                  </div>
                  <div className="text-right">
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{selectedJob.job_number}</span>
                <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColorClass(selectedJob.status))}>
                  {formatJobStatus(selectedJob.status)}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-500">Customer: {selectedJob.customer_name}</p>
                <p className="text-sm text-gray-500">Rider: {selectedJob.rider_name || 'Not assigned'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium">{formatCurrency(selectedJob.agreed_amount)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Platform Fee</p>
                  <p className="font-medium">{formatCurrency(selectedJob.platform_fee)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Rider Earnings</p>
                  <p className="font-medium text-violet-700">{formatCurrency(selectedJob.rider_earnings)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{formatDateTime(selectedJob.created_at)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
