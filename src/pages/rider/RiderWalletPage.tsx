// ============================================
// DISPATCH NG - Rider Wallet Page
// ============================================
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  Banknote,
  CheckCircle2,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/uiStore';
import type { WalletTransaction, BankAccount, WithdrawalRequest } from '@/types';
import { formatCurrency, formatDistanceToNow } from '@/utils/format';
import { cn } from '@/lib/utils';

const MIN_WITHDRAWAL = 200;

export function RiderWalletPage() {
  const { user, wallet, setWallet } = useAuthStore();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [pendingEarnings, setPendingEarnings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [showActiveWithdrawals, setShowActiveWithdrawals] = useState(true);
  const [showCompletedWithdrawals, setShowCompletedWithdrawals] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);

  const fetchWalletData = useCallback(async () => {
    if (!user?.id) {
      setTransactions([]);
      setBankAccounts([]);
      setWithdrawals([]);
      setPendingEarnings(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      if (walletError) throw walletError;

      if (walletData) {
        setWallet(walletData);
      }

      if (walletData?.id) {
        const { data: txData, error: txError } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('wallet_id', walletData.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (txError) throw txError;
        setTransactions(txData || []);
      } else {
        setTransactions([]);
      }

      const { data: bankData, error: bankError } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      if (bankError) throw bankError;
      setBankAccounts(bankData || []);

      if (bankData && bankData.length > 0) {
        const defaultBank = bankData.find((account) => account.is_default) || bankData[0];
        setSelectedBankId(defaultBank.id);
      } else {
        setSelectedBankId('');
      }

      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      if (withdrawalError) throw withdrawalError;
      setWithdrawals(withdrawalData || []);

      const { data: pendingJobs, error: pendingJobsError } = await supabase
        .from('dispatch_jobs')
        .select('rider_earnings')
        .eq('rider_id', user.id)
        .in('status', ['funded', 'in_progress', 'rider_marked_complete']);

      if (pendingJobsError) throw pendingJobsError;

      const totalPending = (pendingJobs || []).reduce((sum, item: any) => {
        return sum + Number(item.rider_earnings || 0);
      }, 0);

      setPendingEarnings(totalPending);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      showToast('error', 'Error', 'Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, setWallet]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  useEffect(() => {
    const handleWindowFocus = () => {
      fetchWalletData();
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [fetchWalletData]);

  const liveAvailableBalance = useMemo(() => {
    const latestBalanceTx = transactions.find(
      (tx: any) => tx.balance_after !== null && tx.balance_after !== undefined
    );

    if (latestBalanceTx) {
      return Number(latestBalanceTx.balance_after || 0);
    }

    return Number(wallet?.available_balance || 0);
  }, [transactions, wallet?.available_balance]);

  const activeWithdrawals = useMemo(() => {
    return withdrawals.filter((item: any) =>
      ['pending', 'approved', 'processing'].includes((item.status || 'pending').toLowerCase())
    );
  }, [withdrawals]);

  const completedWithdrawals = useMemo(() => {
    return withdrawals.filter((item: any) =>
      ['completed', 'rejected'].includes((item.status || '').toLowerCase())
    );
  }, [withdrawals]);

  const hasActiveWithdrawalRequest = activeWithdrawals.length > 0;

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);

    if (!wallet || !user) return;

    if (hasActiveWithdrawalRequest) {
      showToast(
        'error',
        'Withdrawal already pending',
        'You already have a withdrawal request in progress'
      );
      setShowWithdrawDialog(false);
      return;
    }

    if (!amount || Number.isNaN(amount)) {
      showToast('error', 'Invalid amount', 'Enter a valid withdrawal amount');
      return;
    }

    if (amount < MIN_WITHDRAWAL) {
      showToast(
        'error',
        'Invalid amount',
        `Minimum withdrawal is ${formatCurrency(MIN_WITHDRAWAL)}`
      );
      return;
    }

    if (amount > liveAvailableBalance) {
      showToast('error', 'Insufficient balance', "You don't have enough funds");
      return;
    }

    if (!selectedBankId) {
      showToast('error', 'No bank account', 'Please add a bank account first');
      return;
    }

    setIsWithdrawing(true);

    try {
      const { data: existingPending, error: existingPendingError } = await supabase
        .from('withdrawal_requests')
        .select('id, status')
        .eq('profile_id', user.id)
        .in('status', ['pending', 'approved', 'processing'])
        .limit(1);

      if (existingPendingError) throw existingPendingError;

      if (existingPending && existingPending.length > 0) {
        throw new Error('You already have a withdrawal request in progress');
      }

      const { data: createdRequest, error } = await supabase
        .from('withdrawal_requests')
        .insert({
          profile_id: user.id,
          wallet_id: wallet.id,
          bank_account_id: selectedBankId,
          amount,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      showToast(
        'success',
        'Withdrawal requested',
        'Your payout request has been submitted for the next Friday payout cycle'
      );
      setShowWithdrawDialog(false);
      setWithdrawAmount('');
      await fetchWalletData();

      if (!createdRequest) {
        showToast(
          'error',
          'Warning',
          'Request was submitted but could not be confirmed on screen'
        );
      }
    } catch (error: any) {
      console.error('Withdrawal request error:', error);
      showToast('error', 'Error', error.message || 'Failed to request withdrawal');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'escrow_release':
        return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      default:
        return <Lock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionAmountClass = (type: string) => {
    switch (type) {
      case 'escrow_release':
        return 'text-green-600';
      case 'withdrawal':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTransactionType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getWithdrawalStatusBadge = (status?: string | null) => {
    const value = (status || 'pending').toLowerCase();

    if (value === 'pending') return 'bg-amber-100 text-amber-700';
    if (value === 'approved') return 'bg-blue-100 text-blue-700';
    if (value === 'processing') return 'bg-violet-100 text-violet-700';
    if (value === 'completed') return 'bg-green-100 text-green-700';
    if (value === 'rejected') return 'bg-red-100 text-red-700';

    return 'bg-gray-100 text-gray-700';
  };

  const SectionHeader = ({
    title,
    count,
    isOpen,
    onToggle,
  }: {
    title: string;
    count: number;
    isOpen: boolean;
    onToggle: () => void;
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm hover:border-violet-200 hover:shadow transition-all"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-base font-semibold text-gray-900">{title}</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
            {count}
          </span>
        </div>

        <div className="flex items-center justify-center rounded-full bg-gray-100 p-2 text-gray-600">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
        <p className="text-gray-500">Manage your earnings</p>
      </div>

      <Card className="border-violet-100 bg-violet-50/60">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Info className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="font-medium text-violet-900">Weekly payouts every Friday</p>
              <p className="text-sm text-violet-700 mt-1">
                Withdrawal requests are reviewed and paid out every Friday. Submit your request
                before Friday to be included in the next payout cycle. Only one active withdrawal
                request can be open at a time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-6 h-6 text-violet-200" />
                <span className="text-violet-100">Available to Withdraw</span>
              </div>
            </div>

            <p className="text-4xl font-bold">{formatCurrency(liveAvailableBalance)}</p>

            <Button
              onClick={() => setShowWithdrawDialog(true)}
              disabled={hasActiveWithdrawalRequest}
              className="mt-4 bg-white text-violet-600 hover:bg-violet-50 disabled:bg-white/70 disabled:text-violet-400"
            >
              {hasActiveWithdrawalRequest ? 'Withdrawal In Progress' : 'Withdraw'}
            </Button>

            {hasActiveWithdrawalRequest && (
              <p className="text-xs text-violet-100 mt-3">
                You already have a withdrawal request in progress.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-6 h-6 text-amber-500" />
                <span className="text-gray-600">Pending</span>
              </div>
            </div>

            <p className="text-4xl font-bold text-gray-900">{formatCurrency(pendingEarnings)}</p>
            <p className="text-sm text-gray-500 mt-2">From active funded deliveries</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <SectionHeader
          title="Withdrawal Requests"
          count={activeWithdrawals.length}
          isOpen={showActiveWithdrawals}
          onToggle={() => setShowActiveWithdrawals((prev) => !prev)}
        />

        {showActiveWithdrawals && (
          <>
            {activeWithdrawals.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No withdrawal request in progress</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {activeWithdrawals.map((request: any) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <Banknote className="w-5 h-5 text-amber-600" />
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">Withdrawal Request</p>
                            <p className="text-sm text-gray-500">
                              {formatDistanceToNow(request.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(request.amount)}
                          </p>
                          <span
                            className={cn(
                              'inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                              getWithdrawalStatusBadge(request.status)
                            )}
                          >
                            {request.status || 'pending'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-3">
        <SectionHeader
          title="Processed Withdrawals"
          count={completedWithdrawals.length}
          isOpen={showCompletedWithdrawals}
          onToggle={() => setShowCompletedWithdrawals((prev) => !prev)}
        />

        {showCompletedWithdrawals && (
          <>
            {completedWithdrawals.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No processed withdrawals yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {completedWithdrawals.slice(0, 10).map((request: any) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                              (request.status || '').toLowerCase() === 'completed'
                                ? 'bg-green-100'
                                : 'bg-red-100'
                            )}
                          >
                            {(request.status || '').toLowerCase() === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">Withdrawal Request</p>
                            <p className="text-sm text-gray-500">
                              {formatDistanceToNow(request.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(request.amount)}
                          </p>
                          <span
                            className={cn(
                              'inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                              getWithdrawalStatusBadge(request.status)
                            )}
                          >
                            {request.status}
                          </span>
                        </div>
                      </div>

                      {request.rejection_reason && (
                        <p className="mt-3 text-sm text-red-600">{request.rejection_reason}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-3">
        <SectionHeader
          title="Recent Transactions"
          count={transactions.length}
          isOpen={showTransactions}
          onToggle={() => setShowTransactions((prev) => !prev)}
        />

        {showTransactions && (
          <>
            {isLoading ? (
              <Card className="border-dashed border-2">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">Loading transactions...</p>
                </CardContent>
              </Card>
            ) : transactions.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No transactions yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <Card key={tx.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            {getTransactionIcon(tx.transaction_type)}
                          </div>

                          <div>
                            <p className="font-medium text-gray-900">
                              {formatTransactionType(tx.transaction_type)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDistanceToNow(tx.created_at)}
                            </p>
                          </div>
                        </div>

                        <p
                          className={cn('font-semibold', getTransactionAmountClass(tx.transaction_type))}
                        >
                          {tx.transaction_type === 'escrow_release' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </p>
                      </div>

                      {tx.description && (
                        <p className="mt-2 text-sm text-gray-500">{tx.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {hasActiveWithdrawalRequest ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  You already have a pending withdrawal request. Wait for it to be processed before
                  creating another one.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
                  <p className="text-sm text-violet-800">
                    Withdrawal requests are paid out every Friday. Once submitted, your request will
                    be reviewed by admin and processed in the next payout cycle.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Amount (₦)</label>
                  <Input
                    type="number"
                    placeholder={`Minimum ${formatCurrency(MIN_WITHDRAWAL)}`}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>

                {bankAccounts.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      Please add a bank account in your profile first.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Bank Account</label>
                    <select
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      className="w-full mt-1 p-2 border rounded-lg"
                    >
                      {bankAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.bank_name} - {account.account_number}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || bankAccounts.length === 0}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {isWithdrawing ? 'Processing...' : 'Request Withdrawal'}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
