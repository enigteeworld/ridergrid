// ============================================
// DISPATCH NG - Admin Riders Page
// ============================================
import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Star,
  XCircle,
  Phone,
  Bike,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

interface RiderWithProfile {
  id: string;
  profile_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  company_name: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  vehicle_color: string | null;
  service_radius_km: number | null;
  rating_average: number | null;
  total_deliveries: number;
  verification_status: string;
  is_online: boolean;
  created_at: string;
}

export function AdminRidersPage() {
  const [riders, setRiders] = useState<RiderWithProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRider, setSelectedRider] = useState<RiderWithProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      setIsLoading(true);

      const [
        riderProfilesRes,
        publicCardsRes,
      ] = await Promise.all([
        supabase
          .from('rider_profiles')
          .select(`
            id,
            profile_id,
            company_name,
            vehicle_type,
            vehicle_plate,
            vehicle_color,
            service_radius_km,
            rating_average,
            total_deliveries,
            verification_status,
            is_online,
            created_at
          `)
          .order('created_at', { ascending: false }),

        supabase
          .from('public_rider_cards')
          .select(`
            profile_id,
            full_name,
            email,
            phone,
            avatar_url,
            company_name,
            vehicle_type,
            rating_average,
            total_deliveries,
            service_radius_km,
            verification_status,
            is_online
          `),
      ]);

      if (riderProfilesRes.error) throw riderProfilesRes.error;
      if (publicCardsRes.error) throw publicCardsRes.error;

      const riderProfiles = riderProfilesRes.data || [];
      const publicCards = publicCardsRes.data || [];

      const publicCardMap = new Map(
        publicCards.map((card) => [card.profile_id, card])
      );

      const formattedRiders: RiderWithProfile[] = riderProfiles.map((rider) => {
        const publicCard = publicCardMap.get(rider.profile_id);

        return {
          id: rider.id,
          profile_id: rider.profile_id,
          full_name: publicCard?.full_name || null,
          email: publicCard?.email || null,
          phone: publicCard?.phone || null,
          avatar_url: publicCard?.avatar_url || null,
          company_name: rider.company_name || publicCard?.company_name || null,
          vehicle_type: rider.vehicle_type || publicCard?.vehicle_type || null,
          vehicle_plate: rider.vehicle_plate || null,
          vehicle_color: rider.vehicle_color || null,
          service_radius_km: Number(
            rider.service_radius_km ?? publicCard?.service_radius_km ?? 0
          ),
          rating_average: Number(
            rider.rating_average ?? publicCard?.rating_average ?? 0
          ),
          total_deliveries: Number(
            publicCard?.total_deliveries ?? rider.total_deliveries ?? 0
          ),
          verification_status: rider.verification_status,
          is_online: Boolean(rider.is_online),
          created_at: rider.created_at,
        };
      });

      setRiders(formattedRiders);
    } catch (error) {
      console.error('Error fetching riders:', error);
      showToast('error', 'Error', 'Failed to load riders');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRiders = useMemo(() => {
    if (!searchQuery.trim()) return riders;

    const query = searchQuery.toLowerCase();

    return riders.filter(
      (rider) =>
        rider.full_name?.toLowerCase().includes(query) ||
        rider.email?.toLowerCase().includes(query) ||
        rider.phone?.toLowerCase().includes(query) ||
        rider.company_name?.toLowerCase().includes(query) ||
        rider.vehicle_plate?.toLowerCase().includes(query)
    );
  }, [riders, searchQuery]);

  const handleSuspend = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('rider_profiles')
        .update({
          verification_status: 'suspended',
          is_online: false,
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', profileId);

      if (error) throw error;

      showToast('success', 'Rider suspended', 'The rider has been suspended');
      setSelectedRider(null);
      fetchRiders();
    } catch (error: any) {
      showToast('error', 'Error', error.message || 'Failed to suspend rider');
    }
  };

  const renderAvatar = (rider: RiderWithProfile, size = 'w-12 h-12') => {
    if (rider.avatar_url) {
      return (
        <img
          src={rider.avatar_url}
          alt={rider.full_name || 'Rider'}
          className={`${size} rounded-full object-cover border border-gray-200`}
        />
      );
    }

    return (
      <div
        className={`${size} rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white font-medium`}
      >
        {(rider.full_name || 'R').charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Riders</h1>
        <p className="text-gray-500">Manage all registered riders</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search riders by name, email, phone, company, or plate..."
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
      ) : filteredRiders.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center text-gray-500">
            No riders found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRiders.map((rider) => (
            <Card
              key={rider.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedRider(rider)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {renderAvatar(rider)}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 truncate">
                          {rider.full_name || 'Unnamed rider'}
                        </p>
                        {rider.verification_status === 'verified' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{rider.email || 'No email'}</p>
                      <p className="text-sm text-gray-500">
                        {rider.company_name || 'Independent rider'} •{' '}
                        <span className="capitalize">{rider.vehicle_type || 'vehicle not set'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-gray-900">
                      {rider.total_deliveries} deliveries
                    </p>
                    <p className="text-sm text-gray-500">
                      {Number(rider.rating_average || 0).toFixed(1)} ★
                    </p>
                    <span
                      className={cn(
                        'inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        rider.is_online
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-50 text-amber-700'
                      )}
                    >
                      {rider.is_online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedRider} onOpenChange={() => setSelectedRider(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Rider Details</DialogTitle>
          </DialogHeader>

          {selectedRider && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                {renderAvatar(selectedRider, 'w-16 h-16')}
                <div>
                  <p className="text-xl font-semibold text-gray-900">
                    {selectedRider.full_name || 'Unnamed rider'}
                  </p>
                  <p className="text-gray-500">{selectedRider.email || 'No email'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </p>
                  <p className="font-medium">{selectedRider.phone || 'Not set'}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Bike className="w-4 h-4" />
                    Vehicle
                  </p>
                  <p className="font-medium capitalize">
                    {selectedRider.vehicle_type || 'Not set'}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Plate</p>
                  <p className="font-medium uppercase">
                    {selectedRider.vehicle_plate || 'Not set'}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Color</p>
                  <p className="font-medium capitalize">
                    {selectedRider.vehicle_color || 'Not set'}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    Rating
                  </p>
                  <p className="font-medium">
                    {Number(selectedRider.rating_average || 0).toFixed(1)}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Radius
                  </p>
                  <p className="font-medium">{selectedRider.service_radius_km || 0} km</p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Company</p>
                    <p className="font-medium text-gray-900">
                      {selectedRider.company_name || 'Independent rider'}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Deliveries</p>
                    <p className="font-medium text-gray-900">
                      {selectedRider.total_deliveries}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Verification</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {selectedRider.verification_status}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Status</p>
                    <p className="font-medium text-gray-900">
                      {selectedRider.is_online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>

              {selectedRider.verification_status === 'verified' && (
                <Button
                  onClick={() => handleSuspend(selectedRider.profile_id)}
                  variant="destructive"
                  className="w-full"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Suspend Rider
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}