// ============================================
// DISPATCH NG - Admin Verifications Page
// ============================================

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, User, Bike, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/stores/uiStore';

interface PendingRider {
  id: string;
  profile_id: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string | null;
  vehicle_type: string;
  vehicle_plate: string;
  vehicle_color: string;
  license_number: string;
  created_at: string;
}

export function AdminVerificationsPage() {
  const [pendingRiders, setPendingRiders] = useState<PendingRider[]>([]);
  const [selectedRider, setSelectedRider] = useState<PendingRider | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPendingRiders();
  }, []);

  const fetchPendingRiders = async () => {
    try {
      const { data, error } = await supabase
        .from('rider_profiles')
        .select(`
          *,
          profile:profile_id(id, full_name, email, phone)
        `)
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = data?.map((r: any) => ({
        ...r,
        full_name: r.profile?.full_name,
        email: r.profile?.email,
        phone: r.profile?.phone,
      })) || [];

      setPendingRiders(formatted);
    } catch (error) {
      console.error('Error fetching pending riders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (riderId: string) => {
    try {
      const { error } = await supabase
        .from('rider_profiles')
        .update({ verification_status: 'verified' })
        .eq('profile_id', riderId);

      if (error) throw error;
      showToast('success', 'Rider approved', 'The rider can now start accepting jobs');
      fetchPendingRiders();
      setSelectedRider(null);
    } catch (error: any) {
      showToast('error', 'Error', error.message);
    }
  };

  const handleReject = async () => {
    if (!selectedRider) return;

    try {
      const { error } = await supabase
        .from('rider_profiles')
        .update({ verification_status: 'rejected' })
        .eq('profile_id', selectedRider.profile_id);

      if (error) throw error;
      showToast('success', 'Rider rejected', 'The application has been rejected');
      fetchPendingRiders();
      setShowRejectDialog(false);
      setSelectedRider(null);
      setRejectionReason('');
    } catch (error: any) {
      showToast('error', 'Error', error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pending Verifications</h1>
        <p className="text-gray-500">Review and approve rider applications</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Card key={i} className="animate-pulse h-20" />)}
        </div>
      ) : pendingRiders.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
            <p className="text-gray-500">No pending verifications</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingRiders.map(rider => (
            <Card key={rider.id} className="cursor-pointer hover:shadow-md" onClick={() => setSelectedRider(rider)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{rider.full_name}</p>
                      <p className="text-sm text-gray-500 capitalize">{rider.vehicle_type} • {rider.vehicle_plate}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                    Pending
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedRider} onOpenChange={() => setSelectedRider(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
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
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium">{selectedRider.company_name || 'N/A'}</p>
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
                  <p className="text-sm text-gray-500">Color</p>
                  <p className="font-medium">{selectedRider.vehicle_color}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">License</p>
                  <p className="font-medium uppercase">{selectedRider.license_number}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => handleApprove(selectedRider.profile_id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle className="w-4 h-4 mr-2" /> Approve
                </Button>
                <Button onClick={() => setShowRejectDialog(true)} variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Reason for rejection (optional)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
            <div className="flex gap-3">
              <Button onClick={() => setShowRejectDialog(false)} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={handleReject} variant="destructive" className="flex-1">Confirm Reject</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
