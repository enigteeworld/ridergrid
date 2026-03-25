// ============================================
// DISPATCH NG - Public Riders Browse Page
// ============================================
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  Phone,
  MessageCircle,
  Search,
  Filter,
  Bike,
  Car,
  Truck,
  Navigation,
  ArrowRight,
  CheckCircle,
  Shield,
  UserCircle,
  Clock3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

type PublicRider = {
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
};

const vehicleTypes = [
  { id: 'all', label: 'All Types', icon: Navigation },
  { id: 'motorcycle', label: 'Motorcycle', icon: Bike },
  { id: 'bicycle', label: 'Bicycle', icon: Bike },
  { id: 'car', label: 'Car', icon: Car },
  { id: 'van', label: 'Van', icon: Truck },
  { id: 'truck', label: 'Truck', icon: Truck },
];

export function PublicRidersPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [riders, setRiders] = useState<PublicRider[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRiders = useCallback(async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('public_rider_cards')
        .select('*')
        .order('rating_average', { ascending: false });

      if (error) throw error;

      const riderCards = (data as PublicRider[]) ?? [];
      const profileIds = riderCards.map((rider) => rider.profile_id).filter(Boolean);

      let completedJobsMap = new Map<string, number>();

      if (profileIds.length > 0) {
        const { data: completedJobs, error: completedJobsError } = await supabase
          .from('dispatch_jobs')
          .select('rider_id')
          .in('rider_id', profileIds)
          .eq('status', 'completed');

        if (completedJobsError) throw completedJobsError;

        completedJobsMap = (completedJobs || []).reduce((map: Map<string, number>, job: any) => {
          const current = map.get(job.rider_id) || 0;
          map.set(job.rider_id, current + 1);
          return map;
        }, new Map<string, number>());
      }

      const mergedRiders = riderCards.map((rider) => ({
        ...rider,
        total_deliveries:
          completedJobsMap.get(rider.profile_id) ?? Number(rider.total_deliveries ?? 0),
        rating_average: Number(rider.rating_average ?? 0),
        service_radius_km: Number(rider.service_radius_km ?? 0),
      }));

      setRiders(mergedRiders);
    } catch (error) {
      console.error('Error fetching public riders:', error);
      showToast('error', 'Error', 'Failed to load riders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  useEffect(() => {
    const handleWindowFocus = () => {
      fetchRiders();
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [fetchRiders]);

  const filteredRiders = useMemo(() => {
    let filtered = [...riders];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (rider) =>
          rider.full_name.toLowerCase().includes(query) ||
          rider.company_name?.toLowerCase().includes(query) ||
          rider.vehicle_type.toLowerCase().includes(query)
      );
    }

    if (selectedVehicle !== 'all') {
      filtered = filtered.filter((rider) => rider.vehicle_type === selectedVehicle);
    }

    return filtered;
  }, [riders, searchQuery, selectedVehicle]);

  const onlineCount = riders.filter((r) => r.is_online).length;

  const handleContactRider = (rider: PublicRider, type: 'call' | 'whatsapp') => {
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

  const handleBookRider = (rider: PublicRider) => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: '/riders',
          message: 'Sign in to book a rider',
        },
      });
      return;
    }

    if (user?.user_type !== 'customer') {
      showToast(
        'info',
        'Customer account required',
        'Please use a customer account to create deliveries'
      );
      navigate('/');
      return;
    }

    navigate(`/create-job?riderId=${rider.profile_id}`, {
      state: {
        riderId: rider.profile_id,
        riderName: rider.full_name,
        riderCompanyName: rider.company_name,
        riderVehicleType: rider.vehicle_type,
      },
    });
  };

  const renderAvatar = (rider: PublicRider) => {
    if (rider.avatar_url) {
      return (
        <img
          src={rider.avatar_url}
          alt={rider.full_name}
          className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
        />
      );
    }

    return (
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center mx-auto border-4 border-white shadow-lg text-white text-2xl font-semibold">
        {rider.full_name.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                Dispatch NG
              </span>
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Button
                  onClick={() => navigate(user?.user_type === 'rider' ? '/rider' : '/dashboard')}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    className="text-gray-600"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => navigate('/signup')}
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Find Verified Riders
          </h1>
          <p className="text-violet-100 text-lg">
            Browse verified dispatch riders and contact the one you want to book.
          </p>
        </div>
      </div>

      <div className="sticky top-16 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, company or vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 px-6"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Vehicle Type
              </label>
              <div className="flex flex-wrap gap-2">
                {vehicleTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedVehicle(type.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors',
                      selectedVehicle === type.id
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredRiders.length}</span>{' '}
            verified riders
          </p>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600">{onlineCount} online now</span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse"
              >
                <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto mb-4" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto mb-4" />
                <div className="h-10 bg-gray-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredRiders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No riders found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRiders.map((rider) => (
              <div
                key={rider.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-violet-200 transition-all"
              >
                <div className="relative p-6 pb-0">
                  <div className="absolute top-4 right-4">
                    <div
                      className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                      title="Verified"
                    >
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="relative inline-block">
                      {renderAvatar(rider)}
                      {rider.is_online && (
                        <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full" />
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
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-semibold">
                          {Number(rider.rating_average ?? 0).toFixed(1).replace('.0', '')}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">rating</span>
                    </div>

                    <div className="text-center border-x border-gray-100">
                      <div className="font-semibold">{rider.total_deliveries ?? 0}</div>
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
                      {rider.service_radius_km ?? 0}km radius
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
              </div>
            ))}
          </div>
        )}

        {!isAuthenticated && (
          <div className="mt-12 bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-2xl p-8 text-center">
            <Shield className="w-12 h-12 text-violet-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to book a rider?
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Sign up to book riders, track deliveries, and manage payments securely.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
              >
                Create Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Button variant="outline" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}