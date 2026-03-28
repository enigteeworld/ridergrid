// ============================================
// DISPATCH NG - Find Riders Page
// Customer rider discovery
// ============================================
import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Star,
  Bike,
  Phone,
  MessageCircle,
  ArrowRight,
  CheckCircle,
  UserCircle,
  Clock3,
  Car,
  Truck,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/stores/uiStore';
import type { AvailableRider } from '@/types';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type CustomerRider = AvailableRider & {
  profile_id: string;
  email?: string | null;
  verification_status?: string;
  is_online?: boolean;
  avatar_url?: string | null;
  company_name?: string | null;
  completed_jobs_count?: number;
};

const vehicleTypes = ['all', 'motorcycle', 'bicycle', 'car', 'van', 'truck'];

const getVehicleIcon = (vehicleType?: string) => {
  switch (vehicleType) {
    case 'car':
      return Car;
    case 'van':
    case 'truck':
      return Truck;
    default:
      return Bike;
  }
};

export function FindRidersPage() {
  const navigate = useNavigate();
  const [riders, setRiders] = useState<CustomerRider[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [selectedRider, setSelectedRider] = useState<CustomerRider | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('public_rider_cards')
        .select('*')
        .eq('verification_status', 'verified')
        .order('rating_average', { ascending: false });

      if (error) throw error;

      const profileIds = (data || []).map((r: any) => r.profile_id).filter(Boolean);

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

      const formatted: CustomerRider[] =
        data?.map((r: any) => {
          const completedCount =
            completedJobsMap.get(r.profile_id) || Number(r.total_deliveries || 0);

          return {
            id: r.id,
            profile_id: r.profile_id,
            full_name: r.full_name || 'Rider',
            avatar_url: r.avatar_url || null,
            phone: r.phone || null,
            company_name: r.company_name || null,
            vehicle_type: r.vehicle_type,
            vehicle_color: r.vehicle_color || null,
            rating_average: Number(r.rating_average || 0),
            total_deliveries: completedCount,
            completed_jobs_count: completedCount,
            lat: Number(r.lat || 0),
            lng: Number(r.lng || 0),
            service_radius_km: Number(r.service_radius_km || 0),
            email: r.email || null,
            verification_status: r.verification_status,
            is_online: r.is_online ?? false,
          };
        }) || [];

      setRiders(formatted);
    } catch (error) {
      console.error('Error fetching riders:', error);
      showToast('error', 'Error', 'Failed to load riders');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRiders = useMemo(() => {
    let filtered = [...riders];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      filtered = filtered.filter(
        (rider) =>
          rider.full_name.toLowerCase().includes(query) ||
          rider.company_name?.toLowerCase().includes(query) ||
          rider.vehicle_type?.toLowerCase().includes(query)
      );
    }

    if (selectedVehicle !== 'all') {
      filtered = filtered.filter((rider) => rider.vehicle_type === selectedVehicle);
    }

    return filtered;
  }, [riders, searchQuery, selectedVehicle]);

  const handleContact = (type: 'call' | 'whatsapp' | 'sms') => {
    if (!selectedRider?.phone) {
      showToast('error', 'Error', 'Rider phone number not available');
      return;
    }

    const phone = selectedRider.phone.replace(/\D/g, '');
    const message = `Hello ${selectedRider.full_name}, I'm interested in your delivery services on Dispatch NG.`;

    switch (type) {
      case 'call':
        window.open(`tel:${phone}`, '_self');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
        break;
      case 'sms':
        window.open(`sms:${phone}?body=${encodeURIComponent(message)}`, '_self');
        break;
    }
  };

  const handleCreateDeliveryWithRider = () => {
    if (!selectedRider) return;

    navigate(`/create-job?riderId=${selectedRider.profile_id}`, {
      state: {
        riderId: selectedRider.profile_id,
        riderName: selectedRider.full_name,
        riderCompanyName: selectedRider.company_name,
        riderVehicleType: selectedRider.vehicle_type,
      },
    });

    setSelectedRider(null);
  };

  const onlineCount = riders.filter((r) => r.is_online).length;

  const getRiderAccent = (rider: CustomerRider) => {
    if (rider.is_online) return 'from-emerald-400 to-green-500';
    return 'from-amber-400 to-orange-500';
  };

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Riders</h1>
        <p className="text-gray-500">Discover verified dispatch riders near you</p>
      </div>

      <div className="space-y-4 rounded-3xl bg-gray-50/60 p-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name, company or vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 rounded-2xl border-gray-200 bg-white pl-11 text-base placeholder:text-gray-400"
          />
        </div>

        <div className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50/80 via-white to-fuchsia-50/70 p-3 shadow-sm">
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {vehicleTypes.map((type) => {
              const isActive = selectedVehicle === type;

              return (
                <button
                  key={type}
                  onClick={() => setSelectedVehicle(type)}
                  className={cn(
                    'group flex shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-2xl border px-5 py-2.5 transition-all duration-200',
                    isActive
                      ? 'border-violet-200 bg-white text-violet-700 shadow-sm shadow-violet-100'
                      : 'border-gray-200 bg-white/70 text-gray-600 hover:bg-white hover:text-gray-900'
                  )}
                >
                  <span className="text-sm font-semibold">
                    {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-gray-500">
          Showing {filteredRiders.length} verified rider{filteredRiders.length !== 1 ? 's' : ''}
        </p>

        <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm text-green-700">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          {onlineCount} online now
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse rounded-[28px]">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                    <div className="h-3 w-1/2 rounded bg-gray-200" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredRiders.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">No riders found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 rounded-3xl bg-gray-50/60 p-2">
          {filteredRiders.map((rider) => {
            const VehicleIcon = getVehicleIcon(rider.vehicle_type);

            return (
              <Card
                key={rider.id}
                className="group relative cursor-pointer overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 active:scale-[0.985] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]"
                onClick={() => setSelectedRider(rider)}
              >
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b',
                    getRiderAccent(rider)
                  )}
                />

                <CardContent className="p-5 pl-6 sm:p-6 sm:pl-7">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative shrink-0">
                        {rider.avatar_url ? (
                          <img
                            src={rider.avatar_url}
                            alt={rider.full_name}
                            className="h-16 w-16 rounded-full border border-gray-200 object-cover shadow-sm"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 text-xl font-medium text-white shadow-sm">
                            {rider.full_name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        {rider.is_online && (
                          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-green-500">
                            <div className="h-2 w-2 rounded-full bg-white" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold text-gray-900 transition-colors group-hover:text-violet-600">
                          {rider.full_name}
                        </h3>
                        {rider.company_name && (
                          <p className="truncate text-sm text-gray-500">{rider.company_name}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1.5">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium text-amber-700">
                        {Number(rider.rating_average || 0).toFixed(1).replace('.0', '')}
                      </span>
                    </div>
                  </div>

                  <div className="mb-5 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <VehicleIcon className="h-4 w-4" />
                      <span className="capitalize">{rider.vehicle_type}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4" />
                      <span>{rider.completed_jobs_count || 0} deliveries</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{rider.service_radius_km}km radius</span>
                    </div>
                  </div>

                  <div className="mb-5 flex items-center justify-between gap-3">
                    {rider.is_online ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Online now
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
                        <Clock3 className="h-3.5 w-3.5" />
                        Available on request
                      </span>
                    )}

                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-50 text-gray-400 transition-colors duration-200 group-hover:bg-violet-100 group-hover:text-violet-600">
                      <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="h-12 w-full rounded-2xl border-violet-200 bg-white text-violet-700 transition-colors hover:bg-violet-50 hover:text-violet-800"
                  >
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedRider} onOpenChange={() => setSelectedRider(null)}>
        <DialogContent className="overflow-hidden rounded-[28px] border-0 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.20)] sm:max-w-md">
          {selectedRider && (
            <div className="bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
              <DialogHeader className="border-b border-violet-100/70 px-6 pb-4 pt-6 text-left">
                <div className="mb-4 flex items-center gap-4">
                  <div className="relative shrink-0">
                    {selectedRider.avatar_url ? (
                      <img
                        src={selectedRider.avatar_url}
                        alt={selectedRider.full_name}
                        className="h-20 w-20 rounded-full border border-gray-200 object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 text-2xl font-medium text-white shadow-sm">
                        {selectedRider.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {selectedRider.is_online && (
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-white bg-green-500" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <DialogTitle className="truncate text-2xl font-semibold tracking-tight text-gray-900">
                      {selectedRider.full_name}
                    </DialogTitle>

                    {selectedRider.company_name && (
                      <p className="mt-1 truncate text-gray-500">{selectedRider.company_name}</p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium text-amber-700">
                          {Number(selectedRider.rating_average || 0).toFixed(1).replace('.0', '')}
                        </span>
                      </div>

                      <span className="text-gray-300">•</span>
                      <span className="text-sm capitalize text-gray-500">
                        {selectedRider.vehicle_type}
                      </span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5 px-6 py-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedRider.completed_jobs_count || 0}
                    </p>
                    <p className="text-sm text-gray-500">Deliveries</p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedRider.service_radius_km}km
                    </p>
                    <p className="text-sm text-gray-500">Service Radius</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {selectedRider.is_online ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Online now
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
                      <Clock3 className="h-3.5 w-3.5" />
                      Available on request
                    </span>
                  )}
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <p className="mb-3 text-sm font-medium text-gray-700">Contact Rider</p>

                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleContact('call')}
                      className="flex h-auto flex-col items-center gap-2 rounded-2xl py-4"
                    >
                      <Phone className="h-6 w-6 text-green-600" />
                      <span className="text-xs">Call</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleContact('whatsapp')}
                      className="flex h-auto flex-col items-center gap-2 rounded-2xl py-4"
                    >
                      <MessageCircle className="h-6 w-6 text-green-500" />
                      <span className="text-xs">WhatsApp</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleContact('sms')}
                      className="flex h-auto flex-col items-center gap-2 rounded-2xl py-4"
                    >
                      <MessageCircle className="h-6 w-6 text-blue-500" />
                      <span className="text-xs">SMS</span>
                    </Button>
                  </div>
                </div>

                <Button
                  className="h-12 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
                  onClick={handleCreateDeliveryWithRider}
                >
                  Create Delivery with this Rider
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
