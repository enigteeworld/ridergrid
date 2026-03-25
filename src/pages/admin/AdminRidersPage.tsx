// ============================================
// DISPATCH NG - Admin Riders Page
// ============================================

import { useEffect, useState } from 'react';
import { Search, Bike, Star, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/stores/uiStore';
import { formatCurrency, getStatusColorClass } from '@/utils/format';
import { cn } from '@/lib/utils';

interface RiderWithProfile {
  id: string;
  profile_id: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string | null;
  vehicle_type: string;
  vehicle_plate: string;
  rating_average: number;
  total_deliveries: number;
  total_earnings: number;
  verification_status: string;
  is_online: boolean;
  created_at: string;
}

export function AdminRidersPage() {
  const [riders, setRiders] = useState<RiderWithProfile[]>([]);
  const [filteredRiders, setFilteredRiders] = useState<RiderWithProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRider, setSelectedRider] = useState<RiderWithProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRiders();
  }, []);

  useEffect(() => {
    filterRiders();
  }, [searchQuery, riders]);

  const fetchRiders = async () => {
    try {
      const { data, error } = await supabase
        .from('rider_profiles')
        .select(`
          *,
          profile:profile_id(id, full_name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRiders = data?.map((r: any) => ({
        ...r,
        full_name: r.profile?.full_name,
        email: r.profile?.email,
        phone: r.profile?.phone,
      })) || [];

      setRiders(formattedRiders);
      setFilteredRiders(formattedRiders);
    } catch (error) {
      console.error('Error fetching riders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterRiders = () => {
    if (!searchQuery) {
      setFilteredRiders(riders);
      return;
    }
    const query = searchQuery.toLowerCase();
    setFilteredRiders(riders.filter(r => 
      r.full_name?.toLowerCase().includes(query) ||
      r.email?.toLowerCase().includes(query) ||
      r.company_name?.toLowerCase().includes(query)
    ));
  };

  const handleSuspend = async (riderId: string) => {
    try {
      const { error } = await supabase
        .from('rider_profiles')
        .update({ verification_status: 'suspended', is_online: false })
        .eq('profile_id', riderId);

      if (error) throw error;
      showToast('success', 'Rider suspended', 'The rider has been suspended');
      fetchRiders();
      setSelectedRider(null);
    } catch (error: any) {
      showToast('error', 'Error', error.message);
    }
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
          placeholder="Search riders..."
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
          {filteredRiders.map(rider => (
            <Card key={rider.id} className="cursor-pointer hover:shadow-md" onClick={() => setSelectedRider(rider)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white font-medium">
                      {rider.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{rider.full_name}</p>
                      <p className="text-sm text-gray-500">{rider.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColorClass(rider.verification_status))}>
                      {rider.verification_status}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">{rider.total_deliveries} deliveries</p>
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
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white text-xl font-medium">
                  {selectedRider.full_name?.charAt(0)}
                </div>
                <div>
                  <p className="text-xl font-semibold">{selectedRider.full_name}</p>
                  <p className="text-gray-500">{selectedRider.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{selectedRider.phone}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <p className="font-medium capitalize">{selectedRider.vehicle_type}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Plate</p>
                  <p className="font-medium uppercase">{selectedRider.vehicle_plate}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Rating</p>
                  <p className="font-medium">{selectedRider.rating_average} ★</p>
                </div>
              </div>

              {selectedRider.verification_status === 'verified' && (
                <Button onClick={() => handleSuspend(selectedRider.profile_id)} variant="destructive" className="w-full">
                  <XCircle className="w-4 h-4 mr-2" /> Suspend Rider
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
