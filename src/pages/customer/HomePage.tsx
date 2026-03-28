// ============================================
// DISPATCH NG - Customer Home Page
// ============================================
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Package,
  Clock,
  Star,
  Wallet,
  ChevronRight,
  ChevronDown,
  Bike,
  CheckCircle,
  Clock3,
  UserCircle,
  Phone,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/uiStore';
import type { JobDetails } from '@/types';
import { formatDistanceToNow, formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';

type HomeRider = {
  id: string;
  profile_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  company_name: string | null;
  vehicle_type: 'motorcycle' | 'bicycle' | 'car' | 'van' | 'truck';
  vehicle_color: string | null;
  rating_average: number | null;
  total_deliveries: number | null;
  service_radius_km: number | null;
  verification_status: string;
  is_online: boolean | null;
  created_at: string;
  completed_jobs_count: number;
};

export function HomePage() {
  const navigate = useNavigate();
  const { user, wallet } = useAuthStore();

  const [recentJobs, setRecentJobs] = useState<JobDetails[]>([]);
  const [nearbyRiders, setNearbyRiders] = useState<HomeRider[]>([]);
  const [totalDeliveries, setTotalDeliveries] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedJobs, setExpandedJobs] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setRecentJobs([]);
      setNearbyRiders([]);
      setTotalDeliveries(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const { data: jobs, error: jobsError } = await supabase
        .from('job_details')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (jobsError) throw jobsError;
      setRecentJobs(jobs ?? []);

      const { count, error: countError } = await supabase
        .from('dispatch_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', user.id);

      if (countError) throw countError;
      setTotalDeliveries(count || 0);

      const { data: ridersData, error: ridersError } = await supabase
        .from('public_rider_cards')
        .select('*')
        .order('rating_average', { ascending: false })
        .limit(4);

      if (ridersError) throw ridersError;

      const profileIds =
        (ridersData || []).map((r: any) => r.profile_id).filter(Boolean) || [];

      let completedJobsMap = new Map<string, number>();

      if (profileIds.length > 0) {
        const { data: completedJobs, error: completedJobsError } = await supabase
          .from('dispatch_jobs')
          .select('rider_id')
          .in('rider_id', profileIds)
          .eq('status', 'completed');

        if (completedJobsError) throw completedJobsError;

        completedJobsMap = (completedJobs || []).reduce(
          (map: Map<string, number>, job: { rider_id: string }) => {
            const current = map.get(job.rider_id) || 0;
            map.set(job.rider_id, current + 1);
            return map;
          },
          new Map<string, number>()
        );
      }

      const formattedRiders: HomeRider[] =
        (ridersData || []).map((r: any) => {
          const completedCount =
            completedJobsMap.get(r.profile_id) || Number(r.total_deliveries || 0);

          return {
            id: r.id,
            profile_id: r.profile_id,
            full_name: r.full_name || 'Rider',
            email: r.email || null,
            phone: r.phone || null,
            avatar_url: r.avatar_url || null,
            company_name: r.company_name || null,
            vehicle_type: r.vehicle_type,
            vehicle_color: r.vehicle_color || null,
            rating_average: Number(r.rating_average || 0),
            total_deliveries: completedCount,
            service_radius_km: Number(r.service_radius_km || 0),
            verification_status: r.verification_status,
            is_online: r.is_online ?? false,
            created_at: r.created_at,
            completed_jobs_count: completedCount,
          };
        }) || [];

      setNearbyRiders(formattedRiders);
    } catch (error) {
      console.error('Error fetching home data:', error);
      showToast('error', 'Error', 'Failed to load homepage data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (recentJobs.length > 0) {
      setExpandedJobs((prev) => prev.filter((id) => recentJobs.some((job) => job.id === id)));
    } else {
      setExpandedJobs([]);
    }
  }, [recentJobs]);

  const toggleJobExpanded = (jobId: string) => {
    setExpandedJobs((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const handleContactRider = (rider: HomeRider, type: 'call' | 'whatsapp') => {
    if (!rider.phone) {
      showToast('error', 'Unavailable', 'This rider has no phone number yet');
      return;
    }

    const phone = rider.phone.replace(/\D/g, '');
    const message = `Hello ${rider.full_name}, I found your profile on Dispatch NG and would like to discuss a delivery.`;

    if (type === 'call') {
      window.open(`tel:${phone}`, '_self');
      return;
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleBookRider = (rider: HomeRider) => {
    navigate(`/create-job?riderId=${rider.profile_id}`, {
      state: {
        riderId: rider.profile_id,
        riderName: rider.full_name,
        riderCompanyName: rider.company_name,
        riderVehicleType: rider.vehicle_type,
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'awaiting_rider':
      case 'awaiting_funding':
        return 'bg-amber-100 text-amber-700';
      case 'funded':
        return 'bg-violet-100 text-violet-700';
      case 'cancelled':
      case 'refunded':
      case 'disputed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getCardAccent = (status: string) => {
    switch (status) {
      case 'completed':
        return 'from-emerald-400 to-green-500';
      case 'in_progress':
      case 'rider_marked_complete':
        return 'from-blue-400 to-cyan-500';
      case 'awaiting_rider':
      case 'awaiting_funding':
      case 'funded':
        return 'from-violet-500 to-fuchsia-500';
      case 'cancelled':
      case 'refunded':
      case 'disputed':
        return 'from-rose-400 to-red-500';
      default:
        return 'from-gray-300 to-gray-400';
    }
  };

  const activeJobCount = recentJobs.filter((job) =>
    ['awaiting_rider', 'awaiting_funding', 'funded', 'in_progress'].includes(job.status)
  ).length;

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    accent,
    iconClassName,
    subtitle,
    featured = false,
  }: {
    title: string;
    value: string;
    icon: React.ElementType;
    accent: string;
    iconClassName: string;
    subtitle?: string;
    featured?: boolean;
  }) => (
    <Card
      className={cn(
        'group relative overflow-hidden rounded-[30px] border shadow-[0_10px_35px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(15,23,42,0.10)]',
        featured
          ? 'border-violet-100 bg-gradient-to-br from-white via-violet-50/60 to-fuchsia-50/60'
          : 'border-gray-100 bg-white'
      )}
    >
      <div className={cn('absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b', accent)} />
      {featured && (
        <>
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-200/25 blur-2xl" />
          <div className="absolute -bottom-12 left-10 h-28 w-28 rounded-full bg-fuchsia-200/20 blur-2xl" />
        </>
      )}

      <CardContent className="relative p-5 pl-6 sm:p-6 sm:pl-7">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p
              className={cn(
                'text-sm font-medium uppercase tracking-[0.18em]',
                featured ? 'text-gray-500' : 'text-gray-400'
              )}
            >
              {title}
            </p>
            <div className="mt-3">
              <p
                className={cn(
                  'break-words text-3xl font-bold tracking-tight text-gray-950',
                  featured && 'text-[2.2rem] sm:text-[2.35rem]'
                )}
              >
                {value}
              </p>
              {subtitle && <p className="mt-2 text-sm text-gray-500">{subtitle}</p>}
            </div>
          </div>

          <div
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all duration-200',
              featured ? 'shadow-sm ring-1 ring-white/70' : '',
              iconClassName
            )}
          >
            <Icon className={cn('h-8 w-8', featured && 'scale-105')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SectionHeader = ({
    title,
    subtitle,
    tone = 'violet',
    action,
  }: {
    title: string;
    subtitle?: string;
    tone?: 'violet' | 'emerald';
    action?: React.ReactNode;
  }) => (
    <Card
      className={cn(
        'overflow-hidden rounded-[28px] shadow-sm',
        tone === 'violet'
          ? 'border-violet-100 bg-gradient-to-br from-violet-50/80 via-white to-fuchsia-50/60'
          : 'border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-green-50/60'
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-7">
      <div className="relative overflow-hidden rounded-[32px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/70 p-5 shadow-sm sm:p-6">
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-violet-200/25 blur-3xl" />
        <div className="absolute -bottom-14 left-8 h-32 w-32 rounded-full bg-fuchsia-200/20 blur-3xl" />

        <div className="relative">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-100 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Dispatch NG Customer
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-950">
            Hello, {user?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="mt-2 text-base text-gray-600">Ready to send a package today?</p>
        </div>
      </div>

      <Card className="overflow-hidden rounded-[28px] border-violet-100 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100">
              <ShieldCheck className="h-5 w-5 text-violet-600" />
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-gray-900">Pay inside Dispatch NG</p>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                For your protection, always fund deliveries inside the app. In-app payments are
                covered by escrow, support review, and dispute handling if anything goes wrong.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 rounded-[32px] bg-gradient-to-b from-gray-50/90 to-white p-2">
        <MetricCard
          title="Wallet Balance"
          value={formatCurrency(wallet?.available_balance || 0)}
          icon={Wallet}
          accent="from-violet-500 to-fuchsia-500"
          iconClassName="bg-violet-50 text-violet-500 group-hover:bg-violet-100"
          subtitle="Available now for funding deliveries"
          featured
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            title="Total Deliveries"
            value={`${totalDeliveries}`}
            icon={Package}
            accent="from-violet-500 to-fuchsia-500"
            iconClassName="bg-violet-50 text-violet-500 group-hover:bg-violet-100"
            subtitle="All delivery requests created"
          />

          <MetricCard
            title="Active Jobs"
            value={`${activeJobCount}`}
            icon={Clock}
            accent="from-amber-400 to-orange-500"
            iconClassName="bg-amber-50 text-amber-500 group-hover:bg-amber-100"
            subtitle="Currently moving or awaiting action"
          />

          <MetricCard
            title="Riders Near You"
            value={`${nearbyRiders.length}`}
            icon={Bike}
            accent="from-emerald-400 to-green-500"
            iconClassName="bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100"
            subtitle="Verified riders available to book"
          />
        </div>
      </div>

      <div className="space-y-3">
        <SectionHeader
          title="Recent Deliveries"
          subtitle={
            recentJobs.length > 0
              ? `${recentJobs.length} recent delivery${recentJobs.length !== 1 ? 'ies' : ''}`
              : 'Your most recent delivery activity'
          }
          tone="violet"
          action={
            <Link
              to="/jobs"
              className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          }
        />

        {recentJobs.length === 0 ? (
          <Card className="rounded-[28px] border-2 border-dashed">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100">
                <Package className="h-8 w-8 text-violet-500" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">No deliveries yet</h3>
              <p className="mb-4 text-gray-500">
                Start by choosing a rider and creating your first delivery
              </p>
              <Link to="/find-riders">
                <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
                  Find Riders
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5 rounded-[32px] bg-gradient-to-b from-gray-50/90 to-white p-2">
            {recentJobs.map((job) => {
              const isExpanded = expandedJobs.includes(job.id);

              return (
                <Card
                  key={job.id}
                  className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]"
                >
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b',
                      getCardAccent(job.status)
                    )}
                  />

                  <button
                    type="button"
                    onClick={() => toggleJobExpanded(job.id)}
                    className="w-full text-left transition-transform duration-150 active:scale-[0.995]"
                  >
                    <CardContent className="p-5 pl-6 sm:p-6 sm:pl-7">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-4 flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold tracking-tight text-gray-700">
                              {job.job_number}
                            </span>
                            <span
                              className={cn(
                                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                                getStatusColor(job.status)
                              )}
                            >
                              {getStatusLabel(job.status)}
                            </span>
                          </div>

                          <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
                            <Clock3 className="h-4 w-4" />
                            <span>{formatDistanceToNow(job.created_at)}</span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs uppercase tracking-[0.16em] text-gray-400">
                                Delivery Fee
                              </p>
                              <p className="mt-1 text-lg font-semibold text-gray-900">
                                {formatCurrency(job.agreed_amount)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition-colors duration-200 group-hover:bg-violet-100">
                              <span>{isExpanded ? 'Hide details' : 'View details'}</span>
                              <ChevronDown
                                className={cn(
                                  'h-4 w-4 transition-transform duration-200',
                                  isExpanded && 'rotate-180'
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </button>

                  <div
                    className={cn(
                      'grid transition-all duration-300 ease-out',
                      isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-violet-100/80 bg-white/80 px-5 pb-5 pt-2 sm:px-6">
                        <div className="space-y-4 pt-3">
                          <div className="rounded-2xl bg-gray-50 p-4">
                            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                              <MapPin className="h-3.5 w-3.5 text-gray-400" />
                              Pickup
                            </div>
                            <p className="text-sm leading-6 text-gray-700">{job.pickup_address}</p>
                          </div>

                          <div className="rounded-2xl bg-violet-50 p-4">
                            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-violet-600">
                              <MapPin className="h-3.5 w-3.5 text-violet-500" />
                              Delivery
                            </div>
                            <p className="text-sm leading-6 text-gray-700">{job.delivery_address}</p>
                          </div>

                          {job.rider_name && (
                            <div className="rounded-2xl border border-violet-100 bg-white p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
                                    {job.rider_name.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-gray-900">
                                      {job.rider_name}
                                    </p>
                                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                                      <span>Assigned rider</span>
                                      {job.rider_rating && (
                                        <span className="flex items-center gap-1">
                                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                          {job.rider_rating}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="pt-1">
                            <Link to={`/jobs/${job.id}`} className="block">
                              <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
                                Open Delivery
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <SectionHeader
          title="Riders Near You"
          subtitle={`${nearbyRiders.length} verified rider${nearbyRiders.length !== 1 ? 's' : ''} nearby`}
          tone="emerald"
          action={
            <Link
              to="/find-riders"
              className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              Find More
              <ChevronRight className="h-4 w-4" />
            </Link>
          }
        />

        {nearbyRiders.length === 0 ? (
          <Card className="rounded-[28px] border-2 border-dashed">
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No riders available at the moment</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5 rounded-[32px] bg-gradient-to-b from-gray-50/90 to-white p-2">
            {nearbyRiders.map((rider) => (
              <Card
                key={rider.id}
                className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]"
              >
                <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald-400 to-green-500" />

                <CardContent className="p-5 pl-6 sm:p-6 sm:pl-7">
                  <div className="relative">
                    <div className="absolute right-0 top-0">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 shadow-sm"
                        title="Verified"
                      >
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="relative inline-block">
                        {rider.avatar_url ? (
                          <img
                            src={rider.avatar_url}
                            alt={rider.full_name}
                            className="mx-auto h-20 w-20 rounded-full border-4 border-white object-cover shadow-lg"
                          />
                        ) : (
                          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-violet-400 to-fuchsia-400 text-2xl font-semibold text-white shadow-lg">
                            {rider.full_name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        {rider.is_online && (
                          <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500" />
                        )}
                      </div>

                      <h3 className="mt-4 text-2xl font-semibold tracking-tight text-gray-900">
                        {rider.full_name}
                      </h3>

                      <div className="mt-2 flex items-center justify-center gap-1 text-base text-gray-500">
                        <UserCircle className="h-4 w-4" />
                        <span className="capitalize">{rider.vehicle_type}</span>
                      </div>

                      {rider.company_name && (
                        <p className="mt-2 text-base text-gray-500">{rider.company_name}</p>
                      )}
                    </div>

                    <div className="my-6 grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900">
                          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                          <span>
                            {Number(rider.rating_average || 0).toFixed(1).replace('.0', '')}
                          </span>
                        </div>
                        <span className="mt-1 block text-sm text-gray-500">rating</span>
                      </div>

                      <div className="border-x border-gray-100 text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {rider.completed_jobs_count || 0}
                        </div>
                        <span className="mt-1 block text-sm text-gray-500">deliveries</span>
                      </div>

                      <div className="text-center">
                        <div
                          className={cn(
                            'text-2xl font-bold',
                            rider.is_online ? 'text-green-600' : 'text-amber-700'
                          )}
                        >
                          {rider.is_online ? 'Online' : 'Active'}
                        </div>
                        <span className="mt-1 block text-sm text-gray-500">status</span>
                      </div>
                    </div>

                    <div className="mb-4 flex justify-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-4 py-2 text-base text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {rider.service_radius_km || 0}km radius
                      </span>
                    </div>

                    <div className="mb-5 flex justify-center">
                      {rider.is_online ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-base font-medium text-green-700">
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          Online now
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-base font-medium text-amber-700">
                          <Clock3 className="h-4 w-4" />
                          Available on request
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Button
                        className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                        onClick={() => handleBookRider(rider)}
                      >
                        Book Rider
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleContactRider(rider, 'call')}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-100 py-3 transition-colors hover:bg-green-200"
                        >
                          <Phone className="h-5 w-5 text-green-600" />
                          <span className="text-base font-medium text-green-700">Call</span>
                        </button>

                        <button
                          onClick={() => handleContactRider(rider, 'whatsapp')}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-100 py-3 transition-colors hover:bg-emerald-200"
                        >
                          <MessageCircle className="h-5 w-5 text-emerald-600" />
                          <span className="text-base font-medium text-emerald-700">WhatsApp</span>
                        </button>
                      </div>
                    </div>
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