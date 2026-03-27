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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Riders</h1>
        <p className="text-gray-500">Discover verified dispatch riders near you</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search by name, company or vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {vehicleTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedVehicle(type)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                selectedVehicle === type
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-gray-500">
          Showing {filteredRiders.length} verified rider{filteredRiders.length !== 1 ? 's' : ''}
        </p>

        <div className="flex items-center gap-1 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          {onlineCount} online now
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredRiders.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No riders found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRiders.map((rider) => {
            const VehicleIcon = getVehicleIcon(rider.vehicle_type);

            return (
              <Card
                key={rider.id}
                className="hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => setSelectedRider(rider)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {rider.avatar_url ? (
                          <img
                            src={rider.avatar_url}
                            alt={rider.full_name}
                            className="w-16 h-16 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white text-xl font-medium">
                            {rider.full_name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        {rider.is_online && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors truncate">
                          {rider.full_name}
                        </h3>
                        {rider.company_name && (
                          <p className="text-sm text-gray-500 truncate">{rider.company_name}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg shrink-0">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-medium text-amber-700">
                        {Number(rider.rating_average || 0).toFixed(1).replace('.0', '')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <VehicleIcon className="w-4 h-4" />
                      <span className="capitalize">{rider.vehicle_type}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>{rider.completed_jobs_count || 0} deliveries</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-4 gap-2">
                    <div className="flex items-center gap-1 text-gray-500 min-w-0">
                      <UserCircle className="w-4 h-4 shrink-0" />
                      <span>{rider.service_radius_km}km radius</span>
                    </div>

                    {rider.is_online ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium shrink-0">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Online now
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium shrink-0">
                        <Clock3 className="w-3.5 h-3.5" />
                        Available on request
                      </span>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-violet-50 group-hover:border-violet-200 transition-colors"
                  >
                    View Profile
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedRider} onOpenChange={() => setSelectedRider(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rider Profile</DialogTitle>
          </DialogHeader>

          {selectedRider && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  {selectedRider.avatar_url ? (
                    <img
                      src={selectedRider.avatar_url}
                      alt={selectedRider.full_name}
                      className="w-20 h-20 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white text-2xl font-medium">
                      {selectedRider.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {selectedRider.is_online && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 truncate">
                    {selectedRider.full_name}
                  </h3>

                  {selectedRider.company_name && (
                    <p className="text-gray-500 truncate">{selectedRider.company_name}</p>
                  )}

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-medium text-amber-700">
                        {Number(selectedRider.rating_average || 0).toFixed(1).replace('.0', '')}
                      </span>
                    </div>

                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-500 capitalize">
                      {selectedRider.vehicle_type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedRider.completed_jobs_count || 0}
                  </p>
                  <p className="text-sm text-gray-500">Deliveries</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedRider.service_radius_km}km
                  </p>
                  <p className="text-sm text-gray-500">Service Radius</p>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                {selectedRider.is_online ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Online now
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">
                    <Clock3 className="w-3.5 h-3.5" />
                    Available on request
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Contact Rider</p>

                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleContact('call')}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <Phone className="w-6 h-6 text-green-600" />
                    <span className="text-xs">Call</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleContact('whatsapp')}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <MessageCircle className="w-6 h-6 text-green-500" />
                    <span className="text-xs">WhatsApp</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleContact('sms')}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <MessageCircle className="w-6 h-6 text-blue-500" />
                    <span className="text-xs">SMS</span>
                  </Button>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white"
                onClick={handleCreateDeliveryWithRider}
              >
                Create Delivery with this Rider
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}