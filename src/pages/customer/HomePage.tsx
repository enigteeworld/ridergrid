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
  Bike,
  CheckCircle,
  Clock3,
  UserCircle,
  Phone,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
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
        (ridersData || [])
          .map((r: any) => r.profile_id)
          .filter(Boolean) || [];

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
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const activeJobCount = recentJobs.filter((job) =>
    ['awaiting_rider', 'awaiting_funding', 'funded', 'in_progress'].includes(job.status)
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hello, {user?.full_name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-gray-500">Ready to send a package today?</p>
      </div>

      <Card className="border-violet-100 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-violet-600" />
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-gray-900">Pay inside Dispatch NG</p>
              <p className="text-sm text-gray-600 mt-1 leading-6">
                For your protection, always fund deliveries inside the app. In-app payments are
                covered by escrow, support review, and dispute handling if anything goes wrong.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm">Wallet Balance</p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(wallet?.available_balance || 0)}
                </p>
              </div>
              <Wallet className="w-9 h-9 text-violet-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Deliveries</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalDeliveries}</p>
              </div>
              <Package className="w-9 h-9 text-violet-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Jobs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{activeJobCount}</p>
              </div>
              <Clock className="w-9 h-9 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Riders Near You</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{nearbyRiders.length}</p>
              </div>
              <Bike className="w-9 h-9 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Deliveries</h2>
          <Link
            to="/jobs"
            className="text-violet-600 hover:text-violet-700 text-sm font-medium flex items-center gap-1"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentJobs.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto bg-violet-100 rounded-full flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-violet-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries yet</h3>
              <p className="text-gray-500 mb-4">
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
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <Link key={job.id} to={`/jobs/${job.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-500">{job.job_number}</span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              getStatusColor(job.status)
                            )}
                          >
                            {getStatusLabel(job.status)}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-600 truncate">{job.pickup_address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-violet-500 shrink-0" />
                            <span className="text-gray-600 truncate">{job.delivery_address}</span>
                          </div>
                        </div>

                        {job.rider_name && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-xs font-medium text-violet-700">
                              {job.rider_name.charAt(0)}
                            </div>
                            <span className="text-sm text-gray-600">{job.rider_name}</span>
                            {job.rider_rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                <span className="text-sm text-gray-500">{job.rider_rating}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(job.agreed_amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(job.created_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Riders Near You</h2>
          <Link
            to="/find-riders"
            className="text-violet-600 hover:text-violet-700 text-sm font-medium flex items-center gap-1"
          >
            Find More
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {nearbyRiders.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No riders available at the moment</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {nearbyRiders.map((rider) => (
              <Card
                key={rider.id}
                className="w-full hover:shadow-lg transition-all border border-gray-100 overflow-hidden"
              >
                <CardContent className="p-5">
                  <div className="relative">
                    <div className="absolute top-0 right-0">
                      <div
                        className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                        title="Verified"
                      >
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="relative inline-block">
                        {rider.avatar_url ? (
                          <img
                            src={rider.avatar_url}
                            alt={rider.full_name}
                            className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center mx-auto border-4 border-white shadow-lg text-white text-2xl font-semibold">
                            {rider.full_name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        {rider.is_online && (
                          <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>

                      <h3 className="font-semibold text-gray-900 mt-4">{rider.full_name}</h3>

                      <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mt-1">
                        <UserCircle className="w-4 h-4" />
                        <span className="capitalize">{rider.vehicle_type}</span>
                      </div>

                      {rider.company_name && (
                        <p className="text-sm text-gray-500 mt-1">{rider.company_name}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 my-5">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="font-semibold">
                            {Number(rider.rating_average || 0).toFixed(1).replace('.0', '')}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">rating</span>
                      </div>

                      <div className="text-center border-x border-gray-100">
                        <div className="font-semibold">{rider.completed_jobs_count || 0}</div>
                        <span className="text-xs text-gray-500">deliveries</span>
                      </div>

                      <div className="text-center">
                        <div
                          className={cn(
                            'font-semibold',
                            rider.is_online ? 'text-green-600' : 'text-amber-700'
                          )}
                        >
                          {rider.is_online ? 'Online' : 'Available'}
                        </div>
                        <span className="text-xs text-gray-500">status</span>
                      </div>
                    </div>

                    <div className="flex justify-center mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {rider.service_radius_km || 0}km radius
                      </span>
                    </div>

                    <div className="flex justify-center mb-4">
                      {rider.is_online ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium text-sm">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          Online now
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium text-sm">
                          <Clock3 className="w-3.5 h-3.5" />
                          Available on request
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Button
                        className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                        onClick={() => handleBookRider(rider)}
                      >
                        Book Rider
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleContactRider(rider, 'call')}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          <Phone className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Call</span>
                        </button>

                        <button
                          onClick={() => handleContactRider(rider, 'whatsapp')}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-700">WhatsApp</span>
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
