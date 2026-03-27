// ============================================
// DISPATCH NG - Admin Revenue Page
// ============================================
import { useEffect, useMemo, useState } from 'react';
import { Search, DollarSign, CalendarDays, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime, getStatusColorClass, formatJobStatus } from '@/utils/format';
import { cn } from '@/lib/utils';

interface RevenueJobItem {
  id: string;
  job_number: string;
  customer_name: string | null;
  rider_name: string | null;
  status: string;
  agreed_amount: number;
  platform_fee: number;
  rider_earnings: number;
  created_at: string;
  completed_at: string | null;
}

export function AdminRevenuePage() {
  const [jobs, setJobs] = useState<RevenueJobItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRevenueJobs();
  }, []);

  const fetchRevenueJobs = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('job_details')
        .select(
          'id, job_number, customer_name, rider_name, status, agreed_amount, platform_fee, rider_earnings, created_at, completed_at'
        )
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (error) throw error;

      const formatted: RevenueJobItem[] =
        (data || []).map((job) => ({
          id: job.id,
          job_number: job.job_number,
          customer_name: job.customer_name || null,
          rider_name: job.rider_name || null,
          status: job.status,
          agreed_amount: Number(job.agreed_amount || 0),
          platform_fee: Number(job.platform_fee || 0),
          rider_earnings: Number(job.rider_earnings || 0),
          created_at: job.created_at,
          completed_at: job.completed_at || null,
        })) || [];

      setJobs(formatted);
    } catch (error) {
      console.error('Error fetching revenue jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs;

    const query = searchQuery.toLowerCase();

    return jobs.filter((job) => {
      return (
        job.job_number.toLowerCase().includes(query) ||
        job.customer_name?.toLowerCase().includes(query) ||
        job.rider_name?.toLowerCase().includes(query)
      );
    });
  }, [jobs, searchQuery]);

  const stats = useMemo(() => {
    const totalRevenue = jobs.reduce((sum, job) => sum + Number(job.platform_fee || 0), 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const monthRevenue = jobs
      .filter((job) => job.completed_at && new Date(job.completed_at) >= startOfMonth)
      .reduce((sum, job) => sum + Number(job.platform_fee || 0), 0);

    const weekRevenue = jobs
      .filter((job) => job.completed_at && new Date(job.completed_at) >= startOfWeek)
      .reduce((sum, job) => sum + Number(job.platform_fee || 0), 0);

    return {
      totalRevenue,
      monthRevenue,
      weekRevenue,
      completedJobs: jobs.length,
    };
  }, [jobs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
        <p className="text-gray-500">Track platform earnings from completed deliveries</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.monthRevenue)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-violet-500">
                <CalendarDays className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Last 7 Days</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.weekRevenue)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500">
                <CalendarDays className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedJobs}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search by job number, customer or rider..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-gray-100 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No completed revenue records found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{job.job_number}</p>
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
                      {job.customer_name || 'Customer'} → {job.rider_name || 'Rider'}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Completed: {job.completed_at ? formatDateTime(job.completed_at) : '-'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm text-gray-500">Platform Fee</p>
                    <p className="font-semibold text-emerald-600">
                      {formatCurrency(job.platform_fee)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Gross: {formatCurrency(job.agreed_amount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}