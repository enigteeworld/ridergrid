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
  ChevronDown,
  ChevronUp,
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
  const [showDisputesList, setShowDisputesList] = useState(true);

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

  const filterSummaryLabel =
    statusFilter === 'all'
      ? `${filteredDisputes.length} total dispute${filteredDisputes.length !== 1 ? 's' : ''}`
      : `${filteredDisputes.length} ${statusFilter.replace(/_/g, ' ')} dispute${
          filteredDisputes.length !== 1 ? 's' : ''
        }`;

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>
        <p className="text-gray-500">Track support cases, review complaints, and close dispute tickets</p>
      </div>

      <Card className="border-violet-100 bg-violet-50/70 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
            <div className="min-w-0">
              <p className="font-medium text-violet-900">Manual support workflow</p>
              <p className="mt-1 text-sm leading-6 text-violet-700 break-words">
                Disputes are handled as support cases. Refunds and rider settlement decisions are
                reviewed manually by admin rather than being auto-processed in-app.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50/80 via-white to-fuchsia-50/70 p-2 shadow-sm">
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {statusTabs.map((status) => {
            const isActive = statusFilter === status;

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'group flex shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-2xl border px-4 py-2.5 transition-all duration-200',
                  isActive
                    ? 'border-violet-200 bg-white text-violet-700 shadow-sm shadow-violet-100'
                    : 'border-transparent bg-transparent text-gray-600 hover:border-white/70 hover:bg-white/70 hover:text-gray-900'
                )}
              >
                <span className="text-sm font-semibold">
                  {status === 'all'
                    ? 'All'
                    : status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                </span>
                <span
                  className={cn(
                    'inline-flex min-w-[1.6rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold transition-colors',
                    isActive
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                  )}
                >
                  {status === 'all'
                    ? disputes.length
                    : disputes.filter((item) => (item.status || 'open') === status).length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search by job number, user, issue type, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <button
        type="button"
        onClick={() => setShowDisputesList((prev) => !prev)}
        className="w-full"
      >
        <Card className="overflow-hidden border-violet-100 bg-gradient-to-br from-violet-50/70 via-white to-fuchsia-50/50 shadow-sm transition-all duration-200 hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 text-left">
                <h2 className="text-xl font-semibold text-gray-900">Dispute Cases</h2>
                <p className="mt-1 text-sm text-gray-500 capitalize">{filterSummaryLabel}</p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-violet-600 shadow-sm ring-1 ring-violet-100">
                {showDisputesList ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>
          </CardContent>
        </Card>
      </button>

      {showDisputesList && (
        <>
          {isLoading ? (
            <div className="space-y-4 pt-1">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-28 p-4" />
                </Card>
              ))}
            </div>
          ) : filteredDisputes.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="p-8 text-center">
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">No disputes found</h3>
                <p className="text-gray-500">There are no dispute cases matching this view</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-5 pt-1">
              {filteredDisputes.map((dispute) => (
                <Card
                  key={dispute.id}
                  className="cursor-pointer border-gray-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  onClick={() => openDisputeModal(dispute)}
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 flex-1 items-start gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="break-words text-base font-semibold text-gray-900">
                              {dispute.job_number}
                            </span>
                            <span
                              className={cn(
                                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                                getStatusBadge(dispute.status)
                              )}
                            >
                              {formatDisputeType(dispute.status)}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm text-gray-500">
                              {formatDisputeType(dispute.dispute_type)}
                            </p>
                            <p className="text-sm text-gray-500 break-words">
                              Raised by {dispute.raised_by_name}
                            </p>
                          </div>

                          <div className="mt-4 rounded-xl bg-gray-50 p-3">
                            <p className="text-sm leading-6 text-gray-700 break-words">
                              {dispute.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center justify-between sm:block sm:text-right">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Opened</p>
                          <p className="text-xs text-gray-400">{formatDateTime(dispute.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={!!selectedDispute} onOpenChange={closeDisputeModal}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dispute Details</DialogTitle>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="break-words text-lg font-semibold text-gray-900">
                  {selectedDispute.job_number}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium self-start',
                    getStatusBadge(selectedDispute.status)
                  )}
                >
                  {formatDisputeType(selectedDispute.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="mb-1 text-sm text-gray-500">Raised By</p>
                  <p className="break-words font-medium text-gray-900">
                    {selectedDispute.raised_by_name}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="mb-1 text-sm text-gray-500">Issue Type</p>
                  <p className="font-medium text-gray-900">
                    {formatDisputeType(selectedDispute.dispute_type)}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="mb-1 text-sm text-gray-500">Opened</p>
                  <p className="font-medium text-gray-900">
                    {formatDateTime(selectedDispute.created_at)}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="mb-1 text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium text-gray-900">
                    {formatDateTime(selectedDispute.updated_at || selectedDispute.created_at)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <p className="mb-2 text-sm text-gray-500">Customer / Rider Message</p>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-800">
                  {selectedDispute.description}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm text-gray-500">Admin Notes / Resolution</p>
                <Textarea
                  placeholder="Add internal notes, support summary, refund decision, or next steps..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={5}
                />
              </div>

              {(selectedDispute.status === 'resolved' || selectedDispute.status === 'closed') && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-green-700" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-green-800">Case summary</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-green-700">
                        {selectedDispute.resolution_notes || 'No resolution notes were added.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {selectedDispute.status === 'open' && (
                  <Button
                    onClick={() => handleUpdateStatus('under_review')}
                    disabled={isUpdating}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Clock3 className="mr-2 h-4 w-4" />
                    Mark Under Review
                  </Button>
                )}

                {(selectedDispute.status === 'open' ||
                  selectedDispute.status === 'under_review') && (
                  <Button
                    onClick={() => handleUpdateStatus('resolved')}
                    disabled={isUpdating}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
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
                    className="w-full text-gray-700"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
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
