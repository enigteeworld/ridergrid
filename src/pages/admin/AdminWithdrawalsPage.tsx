// ============================================
// DISPATCH NG - Admin Withdrawals Page
// ============================================
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, Wallet, CheckCircle, XCircle, Clock3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/stores/uiStore';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';

interface AdminWithdrawal {
  id: string;
  profile_id: string;
  wallet_id: string;
  bank_account_id: string;
  amount: number;
  status: string;
  processed_at: string | null;
  processed_by: string | null;
  rejection_reason: string | null;
  transaction_reference: string | null;
  created_at: string;
  updated_at: string;
  rider_name: string;
  rider_email: string | null;
  rider_phone: string | null;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
}

type WithdrawalStatusFilter =
  | 'all'
  | 'pending'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'rejected';

export function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatusFilter>('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<AdminWithdrawal | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchWithdrawals = useCallback(async () => {
    try {
      setIsLoading(true);

      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (withdrawalError) throw withdrawalError;

      const rows = withdrawalData || [];
      const profileIds = [...new Set(rows.map((item) => item.profile_id).filter(Boolean))];
      const bankAccountIds = [...new Set(rows.map((item) => item.bank_account_id).filter(Boolean))];

      let profilesMap = new Map<
        string,
        { full_name: string | null; email: string | null; phone: string | null }
      >();

      let bankMap = new Map<
        string,
        { bank_name: string | null; account_name: string | null; account_number: string | null }
      >();

      if (profileIds.length > 0) {
        const profilesRes = await supabase
          .from('profiles')
          .select('id, full_name, email, phone')
          .in('id', profileIds);

        if (!profilesRes.error && profilesRes.data) {
          profilesMap = new Map(
            profilesRes.data.map((profile) => [
              profile.id,
              {
                full_name: profile.full_name,
                email: profile.email,
                phone: profile.phone,
              },
            ])
          );
        } else {
          console.warn('Admin withdrawals: profiles lookup failed', profilesRes.error);
        }
      }

      if (bankAccountIds.length > 0) {
        const bankRes = await supabase
          .from('bank_accounts')
          .select('id, bank_name, account_name, account_number')
          .in('id', bankAccountIds);

        if (!bankRes.error && bankRes.data) {
          bankMap = new Map(
            bankRes.data.map((bank) => [
              bank.id,
              {
                bank_name: bank.bank_name,
                account_name: bank.account_name,
                account_number: bank.account_number,
              },
            ])
          );
        } else {
          console.warn('Admin withdrawals: bank accounts lookup failed', bankRes.error);
        }
      }

      const formatted: AdminWithdrawal[] = rows.map((item) => {
        const rider = profilesMap.get(item.profile_id);
        const bank = bankMap.get(item.bank_account_id);

        return {
          id: item.id,
          profile_id: item.profile_id,
          wallet_id: item.wallet_id,
          bank_account_id: item.bank_account_id,
          amount: Number(item.amount || 0),
          status: (item.status || 'pending').toLowerCase(),
          processed_at: item.processed_at,
          processed_by: item.processed_by,
          rejection_reason: item.rejection_reason,
          transaction_reference: item.transaction_reference,
          created_at: item.created_at,
          updated_at: item.updated_at,
          rider_name: rider?.full_name || 'Rider',
          rider_email: rider?.email || null,
          rider_phone: rider?.phone || null,
          bank_name: bank?.bank_name || null,
          account_name: bank?.account_name || null,
          account_number: bank?.account_number || null,
        };
      });

      setWithdrawals(formatted);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      showToast('error', 'Error', 'Failed to load withdrawal requests');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  useEffect(() => {
    const handleWindowFocus = () => {
      fetchWithdrawals();
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [fetchWithdrawals]);

  const filteredWithdrawals = useMemo(() => {
    let filtered = [...withdrawals];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (item) => (item.status || 'pending').toLowerCase() === statusFilter
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      filtered = filtered.filter(
        (item) =>
          item.rider_name.toLowerCase().includes(query) ||
          item.rider_email?.toLowerCase().includes(query) ||
          item.rider_phone?.toLowerCase().includes(query) ||
          item.bank_name?.toLowerCase().includes(query) ||
          item.account_name?.toLowerCase().includes(query) ||
          item.account_number?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [withdrawals, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    const value = (status || 'pending').toLowerCase();

    if (value === 'pending') return 'bg-amber-100 text-amber-700';
    if (value === 'approved') return 'bg-blue-100 text-blue-700';
    if (value === 'processing') return 'bg-violet-100 text-violet-700';
    if (value === 'completed') return 'bg-green-100 text-green-700';
    if (value === 'rejected') return 'bg-red-100 text-red-700';

    return 'bg-gray-100 text-gray-700';
  };

  const handleCompleteWithdrawal = async (withdrawal: AdminWithdrawal) => {
    const { data, error } = await supabase.rpc('complete_withdrawal_request', {
      p_withdrawal_id: withdrawal.id,
    });

    if (error) throw error;
    return data;
  };

  const handleUpdateStatus = async (
    status: 'approved' | 'processing' | 'completed' | 'rejected',
    rejection?: string
  ) => {
    if (!selectedWithdrawal) return;

    try {
      setIsProcessing(true);

      if (status === 'completed') {
        await handleCompleteWithdrawal(selectedWithdrawal);

        showToast(
          'success',
          'Updated',
          'Withdrawal marked as completed and wallet debited'
        );

        setSelectedWithdrawal(null);
        setRejectionReason('');
        await fetchWithdrawals();
        return;
      }

      const updatePayload: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
      };

      if (status === 'rejected') {
        updatePayload.rejection_reason = rejection || 'Rejected by admin';
      } else {
        updatePayload.rejection_reason = null;
      }

      const { error } = await supabase
        .from('withdrawal_requests')
        .update(updatePayload)
        .eq('id', selectedWithdrawal.id);

      if (error) throw error;

      showToast('success', 'Updated', `Withdrawal marked as ${status}`);
      setSelectedWithdrawal(null);
      setRejectionReason('');
      await fetchWithdrawals();
    } catch (error: any) {
      console.error('Withdrawal update error:', error);
      showToast('error', 'Error', error.message || 'Failed to update withdrawal');
    } finally {
      setIsProcessing(false);
    }
  };

  const statusTabs: WithdrawalStatusFilter[] = [
    'all',
    'pending',
    'approved',
    'processing',
    'completed',
    'rejected',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Withdrawals</h1>
        <p className="text-gray-500">Review and process rider withdrawal requests</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search by rider, email, bank or account number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {statusTabs.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                statusFilter === status
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-gray-100 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredWithdrawals.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No withdrawal requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredWithdrawals.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedWithdrawal(item)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <Wallet className="w-6 h-6 text-amber-600" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{item.rider_name}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {item.bank_name || 'Bank'} • {item.account_number || 'No account'}
                      </p>
                      <p className="text-sm text-gray-500">{formatDateTime(item.created_at)}</p>
                    </div>
                  </div>

                  <div className="text-left md:text-right shrink-0">
                    <p className="font-semibold text-gray-900">{formatCurrency(item.amount)}</p>
                    <span
                      className={cn(
                        'inline-flex mt-1 px-2 py-1 rounded-full text-xs font-medium',
                        getStatusBadge(item.status)
                      )}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Withdrawal Details</DialogTitle>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <p className="text-lg font-semibold text-gray-900">
                  {selectedWithdrawal.rider_name}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedWithdrawal.rider_email || 'No email'}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedWithdrawal.rider_phone || 'No phone'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(selectedWithdrawal.amount)}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Status</p>
                  <span
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      getStatusBadge(selectedWithdrawal.status)
                    )}
                  >
                    {selectedWithdrawal.status}
                  </span>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Bank Name</p>
                  <p className="font-medium text-gray-900">
                    {selectedWithdrawal.bank_name || 'N/A'}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Account Name</p>
                  <p className="font-medium text-gray-900">
                    {selectedWithdrawal.account_name || 'N/A'}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Account Number</p>
                  <p className="font-medium text-gray-900">
                    {selectedWithdrawal.account_number || 'N/A'}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Requested At</p>
                  <p className="font-medium text-gray-900">
                    {formatDateTime(selectedWithdrawal.created_at)}
                  </p>
                </div>
              </div>

              {selectedWithdrawal.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800">Rejection Reason</p>
                  <p className="text-sm text-red-700 mt-1">
                    {selectedWithdrawal.rejection_reason}
                  </p>
                </div>
              )}

              {(selectedWithdrawal.status === 'pending' ||
                selectedWithdrawal.status === 'approved' ||
                selectedWithdrawal.status === 'processing') && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Rejection reason (only needed if rejecting)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    {selectedWithdrawal.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleUpdateStatus('approved')}
                          disabled={isProcessing}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>

                        <Button
                          onClick={() => handleUpdateStatus('rejected', rejectionReason)}
                          disabled={isProcessing}
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}

                    {selectedWithdrawal.status === 'approved' && (
                      <Button
                        onClick={() => handleUpdateStatus('processing')}
                        disabled={isProcessing}
                        className="col-span-2 bg-violet-600 hover:bg-violet-700 text-white"
                      >
                        <Clock3 className="w-4 h-4 mr-2" />
                        Mark Processing
                      </Button>
                    )}

                    {selectedWithdrawal.status === 'processing' && (
                      <Button
                        onClick={() => handleUpdateStatus('completed')}
                        disabled={isProcessing}
                        className="col-span-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Completed
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}