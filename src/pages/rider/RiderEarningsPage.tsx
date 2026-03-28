// ============================================
// DISPATCH NG - Rider Earnings Page
// ============================================
import { useEffect, useState } from 'react';
import {
  DollarSign,
  ChevronDown,
  ChevronUp,
  Star,
  CheckCircle,
  TrendingUp,
  CalendarDays,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';

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
  const [showRecentEarnings, setShowRecentEarnings] = useState(true);

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

      const totalEarnings = safeJobs.reduce((sum, job) => sum + Number(job.rider_earnings || 0), 0);

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

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    accent,
    iconClassName,
    featured = false,
  }: {
    title: string;
    value: string;
    icon: React.ElementType;
    accent: string;
    iconClassName: string;
    featured?: boolean;
  }) => {
    if (featured) {
      return (
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.24)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-green-100">{title}</p>
                <p className="mt-2 break-words text-4xl font-bold tracking-tight">{value}</p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                <Icon className="h-8 w-8 text-green-100" />
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
        <div className={cn('absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b', accent)} />
        <CardContent className="p-5 pl-6 sm:p-6 sm:pl-7">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-gray-400">
                {title}
              </p>
              <p className="mt-3 break-words text-3xl font-bold tracking-tight text-gray-900">
                {value}
              </p>
            </div>

            <div
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-colors duration-200',
                iconClassName
              )}
            >
              <Icon className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const SectionHeader = ({
    title,
    subtitle,
    isOpen,
    onToggle,
  }: {
    title: string;
    subtitle: string;
    isOpen: boolean;
    onToggle: () => void;
  }) => (
    <button type="button" onClick={onToggle} className="w-full">
      <Card className="overflow-hidden border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-green-50/50 shadow-sm transition-all duration-200 hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1 text-left">
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100">
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Earnings</h1>
        <p className="text-gray-500">Track your income and performance</p>
      </div>

      <div className="space-y-4 rounded-3xl bg-gray-50/60 p-2">
        <MetricCard
          title="Today"
          value={formatCurrency(stats.today)}
          icon={DollarSign}
          accent="from-green-400 to-emerald-500"
          iconClassName="bg-green-50 text-green-500"
          featured
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            title="This Week"
            value={formatCurrency(stats.thisWeek)}
            icon={CalendarDays}
            accent="from-violet-500 to-fuchsia-500"
            iconClassName="bg-violet-50 text-violet-500 group-hover:bg-violet-100"
          />

          <MetricCard
            title="This Month"
            value={formatCurrency(stats.thisMonth)}
            icon={TrendingUp}
            accent="from-blue-400 to-cyan-500"
            iconClassName="bg-blue-50 text-blue-500 group-hover:bg-blue-100"
          />

          <MetricCard
            title="Lifetime Earnings"
            value={formatCurrency(stats.total)}
            icon={DollarSign}
            accent="from-amber-400 to-orange-500"
            iconClassName="bg-amber-50 text-amber-500 group-hover:bg-amber-100"
          />
        </div>
      </div>

      <Card className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <CardContent className="p-6">
          <h3 className="mb-5 text-xl font-semibold text-gray-900">Performance Stats</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-violet-100 bg-violet-50 p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm">
                <CheckCircle className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold tracking-tight text-violet-600">{deliveryCount}</p>
              <p className="mt-1 text-sm text-gray-500">Total Deliveries</p>
            </div>

            <div className="rounded-[24px] border border-amber-100 bg-amber-50 p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-amber-500 shadow-sm">
                <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
              </div>
              <p className="text-3xl font-bold tracking-tight text-amber-500">
                {riderProfile?.rating_average?.toFixed(1) || '0.0'}
              </p>
              <p className="mt-1 text-sm text-gray-500">Average Rating</p>
            </div>

            <div className="rounded-[24px] border border-green-100 bg-green-50 p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-green-600 shadow-sm">
                <TrendingUp className="h-6 w-6" />
              </div>
              <p className="break-words text-3xl font-bold tracking-tight text-green-600">
                {formatCurrency(averagePerDelivery)}
              </p>
              <p className="mt-1 text-sm text-gray-500">Avg per Delivery</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <SectionHeader
          title="Recent Earnings"
          subtitle={`Last ${Math.min(recentEarnings.length, 10)} completed earning${recentEarnings.length !== 1 ? 's' : ''}`}
          isOpen={showRecentEarnings}
          onToggle={() => setShowRecentEarnings((prev) => !prev)}
        />

        {showRecentEarnings && (
          <>
            {isLoading ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">Loading earnings...</p>
                </CardContent>
              </Card>
            ) : recentEarnings.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">
                    No earnings yet. Complete deliveries to start earning.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6 rounded-3xl bg-gray-50/60 p-2">
                {recentEarnings.map((earning) => (
                  <Card
                    key={earning.id}
                    className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]"
                  >
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald-400 to-green-500" />

                    <CardContent className="p-5 pl-6 sm:p-6 sm:pl-7">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-100">
                            <DollarSign className="h-5 w-5 text-green-600" />
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">Delivery Completed</p>
                            <p className="text-sm text-gray-500">
                              {earning.completed_at ? formatDate(earning.completed_at) : '-'}
                            </p>
                          </div>
                        </div>

                        <p className="shrink-0 font-semibold text-green-600">
                          +{formatCurrency(Number(earning.rider_earnings || 0))}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}