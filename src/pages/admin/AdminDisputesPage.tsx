// ============================================
// DISPATCH NG - Admin Disputes Page
// ============================================

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/stores/uiStore';
import { formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';

interface DisputeWithDetails {
  id: string;
  dispatch_job_id: string;
  job_number: string;
  raised_by: string;
  raised_by_name: string;
  dispute_type: string;
  description: string;
  status: string;
  resolution_notes: string | null;
  created_at: string;
}

export function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeWithDetails[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<DisputeWithDetails | null>(null);
  const [resolution, setResolution] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('disputes')
        .select(`
          *,
          job:dispatch_job_id(job_number),
          raised_by_profile:raised_by(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted =
        data?.map((d: any) => ({
          ...d,
          job_number: d.job?.job_number || 'Unknown job',
          raised_by_name: d.raised_by_profile?.full_name || 'Unknown user',
        })) || [];

      setDisputes(formatted);
    } catch (error) {
      console.error('Error fetching disputes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (resolutionType: 'customer' | 'rider' | 'split') => {
    if (!selectedDispute) return;

    try {
      const nextStatus =
        resolutionType === 'customer'
          ? 'resolved_customer_favor'
          : resolutionType === 'rider'
          ? 'resolved_rider_favor'
          : 'resolved_split';

      const { error } = await supabase
        .from('disputes')
        .update({
          status: nextStatus,
          resolution_notes: resolution || null,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', selectedDispute.id);

      if (error) throw error;

      showToast('success', 'Dispute resolved', 'The dispute has been resolved');
      setSelectedDispute(null);
      setResolution('');
      fetchDisputes();
    } catch (error: any) {
      showToast('error', 'Error', error.message || 'Failed to resolve dispute');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: 'bg-red-100 text-red-700',
      under_review: 'bg-amber-100 text-amber-700',
      resolved_customer_favor: 'bg-blue-100 text-blue-700',
      resolved_rider_favor: 'bg-green-100 text-green-700',
      resolved_split: 'bg-purple-100 text-purple-700',
      closed: 'bg-gray-100 text-gray-700',
    };

    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>
        <p className="text-gray-500">Manage and resolve customer/rider disputes</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-24" />
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No disputes</h3>
            <p className="text-gray-500">All clear for now</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute) => (
            <Card
              key={dispute.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedDispute(dispute);
                setResolution(dispute.resolution_notes || '');
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900">{dispute.job_number}</p>
                      <p className="text-sm text-gray-500 capitalize">
                        {dispute.dispute_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-gray-500">Raised by {dispute.raised_by_name}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        getStatusBadge(dispute.status)
                      )}
                    >
                      {dispute.status.replace(/_/g, ' ')}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(dispute.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dispute Details</DialogTitle>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Job</p>
                <p className="font-medium">{selectedDispute.job_number}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Raised By</p>
                <p className="font-medium">{selectedDispute.raised_by_name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Issue Type</p>
                <p className="font-medium capitalize">
                  {selectedDispute.dispute_type.replace(/_/g, ' ')}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedDispute.description}</p>
              </div>

              {selectedDispute.status === 'open' || selectedDispute.status === 'under_review' ? (
                <>
                  <Textarea
                    placeholder="Resolution notes..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={4}
                  />

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleResolve('customer')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Customer Wins
                    </Button>

                    <Button
                      onClick={() => handleResolve('rider')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      Rider Wins
                    </Button>

                    <Button
                      onClick={() => handleResolve('split')}
                      variant="outline"
                      className="flex-1"
                    >
                      Split
                    </Button>
                  </div>
                </>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">Resolved</p>
                  <p className="text-green-700 text-sm mt-1">
                    {selectedDispute.resolution_notes || 'No notes provided'}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}