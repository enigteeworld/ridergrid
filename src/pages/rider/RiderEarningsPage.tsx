// ============================================
// DISPATCH NG - Rider Earnings Page
// ============================================
import { useEffect, useState } from 'react';
import { DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, formatDate } from '@/utils/format';

interface EarningStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  totalDeliveries: number;
}

interface CompletedEarningJob {
  id: string;
  rider_earnings: number | null;
  completed_at: string | null;
}

export function RiderEarningsPage() {
  const { user, riderProfile } = useAuthStore();
  const [stats, setStats] = useState<EarningStats>({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0,
    totalDeliveries: 0,
  });
  const [recentEarnings, setRecentEarnings] = useState<CompletedEarningJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setIsLoading(true);

      const { data: jobs, error } = await supabase
        .from('dispatch_jobs')
        .select('id, rider_earnings, completed_at')
        .eq('rider_id', user?.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (error) throw error;

      const safeJobs: CompletedEarningJob[] = (jobs || []).map((job) => ({
        id: job.id,
        rider_earnings: Number(job.rider_earnings || 0),
        completed_at: job.completed_at || null,
      }));

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(todayStart.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const todayEarnings = safeJobs
        .filter((job) => job.completed_at && new Date(job.completed_at) >= todayStart)
        .reduce((sum, job) => sum + Number(job.rider_earnings || 0), 0);

      const weekEarnings = safeJobs
        .filter((job) => job.completed_at && new Date(job.completed_at) >= weekStart)
        .reduce((sum, job) => sum + Number(job.rider_earnings || 0), 0);

      const monthEarnings = safeJobs
        .filter((job) => job.completed_at && new Date(job.completed_at) >= monthStart)
        .reduce((sum, job) => sum + Number(job.rider_earnings || 0), 0);

      const totalEarnings = safeJobs.reduce(
        (sum, job) => sum + Number(job.rider_earnings || 0),
        0
      );

      setStats({
        today: todayEarnings,
        thisWeek: weekEarnings,
        thisMonth: monthEarnings,
        total: totalEarnings,
        totalDeliveries: safeJobs.length,
      });

      setRecentEarnings(safeJobs.slice(0, 10));
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deliveryCount = stats.totalDeliveries;
  const averagePerDelivery = deliveryCount > 0 ? stats.total / deliveryCount : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Earnings</h1>
        <p className="text-gray-500">Track your income and performance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
          <CardContent className="p-4">
            <p className="text-green-100 text-sm">Today</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.today)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-gray-500 text-sm">This Week</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.thisWeek)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-gray-500 text-sm">This Month</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.thisMonth)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-gray-500 text-sm">Lifetime Earnings</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-violet-600">{deliveryCount}</p>
              <p className="text-sm text-gray-500">Total Deliveries</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-500">
                {riderProfile?.rating_average?.toFixed(1) || '0.0'}
              </p>
              <p className="text-sm text-gray-500">Average Rating</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(averagePerDelivery)}
              </p>
              <p className="text-sm text-gray-500">Avg per Delivery</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Earnings</h2>

        {isLoading ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Loading earnings...</p>
            </CardContent>
          </Card>
        ) : recentEarnings.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">
                No earnings yet. Complete deliveries to start earning.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentEarnings.map((earning) => (
              <Card key={earning.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Delivery Completed</p>
                        <p className="text-sm text-gray-500">
                          {earning.completed_at ? formatDate(earning.completed_at) : '-'}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-green-600">
                      +{formatCurrency(Number(earning.rider_earnings || 0))}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}