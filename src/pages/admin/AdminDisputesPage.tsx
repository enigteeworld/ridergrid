// ============================================
// DISPATCH NG - Admin Disputes Page
// ============================================

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Search,
  Clock3,
  XCircle,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
  updated_at?: string | null;
  resolved_at?: string | null;
}

type DisputeStatusFilter = 'all' | 'open' | 'under_review' | 'resolved' | 'closed';

export function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeWithDetails[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<DisputeWithDetails | null>(null);
  const [resolution, setResolution] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DisputeStatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    void fetchDisputes();
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

      const formatted: DisputeWithDetails[] =
        data?.map((d: any) => ({
          id: d.id,
          dispatch_job_id: d.dispatch_job_id,
          job_number: d.job?.job_number || 'Unknown job',
          raised_by: d.raised_by,
          raised_by_name: d.raised_by_profile?.full_name || 'Unknown user',
          dispute_type: d.dispute_type || 'other',
          description: d.description || '',
          status: (d.status || 'open').toLowerCase(),
          resolution_notes: d.resolution_notes || null,
          created_at: d.created_at,
          updated_at: d.updated_at || null,
          resolved_at: d.resolved_at || null,
        })) || [];

      setDisputes(formatted);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      showToast('error', 'Error', 'Failed to load disputes');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDisputes = useMemo(() => {
    let filtered = [...disputes];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => (item.status || 'open') === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      filtered = filtered.filter(
        (item) =>
          item.job_number.toLowerCase().includes(query) ||
          item.raised_by_name.toLowerCase().includes(query) ||
          item.dispute_type.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [disputes, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: 'bg-red-100 text-red-700',
      under_review: 'bg-amber-100 text-amber-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
    };

    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDisputeType = (value: string) => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const openDisputeModal = (dispute: DisputeWithDetails) => {
    setSelectedDispute(dispute);
    setResolution(dispute.resolution_notes || '');
  };

  const closeDisputeModal = () => {
    setSelectedDispute(null);
    setResolution('');
  };

  const handleUpdateStatus = async (nextStatus: 'under_review' | 'resolved' | 'closed') => {
    if (!selectedDispute) return;

    try {
      setIsUpdating(true);

      const payload: Record<string, any> = {
        status: nextStatus,
        resolution_notes: resolution.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (nextStatus === 'resolved' || nextStatus === 'closed') {
        payload.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('disputes')
        .update(payload)
        .eq('id', selectedDispute.id);

      if (error) throw error;

      showToast(
        'success',
        'Dispute updated',
        nextStatus === 'under_review'
          ? 'Dispute marked as under review'
          : nextStatus === 'resolved'
          ? 'Dispute resolved successfully'
          : 'Dispute closed successfully'
      );

      closeDisputeModal();
      await fetchDisputes();
    } catch (error: any) {
      console.error('Dispute update error:', error);
      showToast('error', 'Error', error.message || 'Failed to update dispute');
    } finally {
      setIsUpdating(false);
    }
  };

  const statusTabs: DisputeStatusFilter[] = ['all', 'open', 'under_review', 'resolved', 'closed'];

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>
        <p className="text-gray-500">
          Track support cases, review complaints, and close dispute tickets
        </p>
      </div>

      <Card className="border-violet-100 bg-violet-50/60">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-violet-900">Manual support workflow</p>
              <p className="text-sm text-violet-700 mt-1 leading-6">
                Disputes are handled as support cases. Refunds and rider settlement decisions are
                reviewed manually by admin rather than being auto-processed in-app.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search by job number, user, issue type, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusTabs.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0',
                statusFilter === status
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {status === 'all'
                ? 'All'
                : status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-gray-100 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDisputes.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No disputes found</h3>
            <p className="text-gray-500">There are no dispute cases matching this view</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDisputes.map((dispute) => (
            <Card
              key={dispute.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openDisputeModal(dispute)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 break-words">{dispute.job_number}</p>
                      <p className="text-sm text-gray-500 capitalize">
                        {formatDisputeType(dispute.dispute_type)}
                      </p>
                      <p className="text-sm text-gray-500 break-words">
                        Raised by {dispute.raised_by_name}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <span
                      className={cn(
                        'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                        getStatusBadge(dispute.status)
                      )}
                    >
                      {formatDisputeType(dispute.status)}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(dispute.created_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-sm text-gray-600 line-clamp-3 break-words">
                    {dispute.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedDispute} onOpenChange={closeDisputeModal}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dispute Details</DialogTitle>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Job</p>
                  <p className="font-medium text-gray-900 break-words">
                    {selectedDispute.job_number}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Raised By</p>
                  <p className="font-medium text-gray-900 break-words">
                    {selectedDispute.raised_by_name}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Issue Type</p>
                  <p className="font-medium text-gray-900">
                    {formatDisputeType(selectedDispute.dispute_type)}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Status</p>
                  <span
                    className={cn(
                      'inline-flex mt-1 px-2 py-1 rounded-full text-xs font-medium',
                      getStatusBadge(selectedDispute.status)
                    )}
                  >
                    {formatDisputeType(selectedDispute.status)}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Opened</p>
                  <p className="font-medium text-gray-900">
                    {formatDateTime(selectedDispute.created_at)}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium text-gray-900">
                    {formatDateTime(selectedDispute.updated_at || selectedDispute.created_at)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Customer / Rider Message</p>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {selectedDispute.description}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Admin Notes / Resolution</p>
                <Textarea
                  placeholder="Add internal notes, support summary, refund decision, or next steps..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={5}
                />
              </div>

              {(selectedDispute.status === 'resolved' || selectedDispute.status === 'closed') && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-green-700 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Case summary</p>
                      <p className="text-sm text-green-700 mt-1 break-words whitespace-pre-wrap">
                        {selectedDispute.resolution_notes || 'No resolution notes were added.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex xl:flex-wrap gap-3">
                {selectedDispute.status === 'open' && (
                  <Button
                    onClick={() => handleUpdateStatus('under_review')}
                    disabled={isUpdating}
                    className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Clock3 className="w-4 h-4 mr-2" />
                    Mark Under Review
                  </Button>
                )}

                {(selectedDispute.status === 'open' ||
                  selectedDispute.status === 'under_review') && (
                  <Button
                    onClick={() => handleUpdateStatus('resolved')}
                    disabled={isUpdating}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Resolve Case
                  </Button>
                )}

                {(selectedDispute.status === 'open' ||
                  selectedDispute.status === 'under_review' ||
                  selectedDispute.status === 'resolved') && (
                  <Button
                    onClick={() => handleUpdateStatus('closed')}
                    disabled={isUpdating}
                    variant="outline"
                    className="w-full sm:w-auto text-gray-700"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Close Case
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
