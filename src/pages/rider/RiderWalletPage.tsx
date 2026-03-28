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
  CreditCard,
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
        return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-5 w-5 text-red-500" />;
      default:
        return <Lock className="h-5 w-5 text-gray-500" />;
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
    <button type="button" onClick={onToggle} className="w-full">
      <Card className="overflow-hidden border-violet-100 bg-gradient-to-br from-violet-50/70 via-white to-fuchsia-50/50 shadow-sm transition-all duration-200 hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                <p className="truncate text-left text-xl font-semibold text-gray-900">{title}</p>
                <span className="inline-flex min-w-[2.25rem] items-center justify-center rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                  {count}
                </span>
              </div>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-violet-600 shadow-sm ring-1 ring-violet-100">
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
        <p className="text-gray-500">Manage your earnings</p>
      </div>

      <Card className="overflow-hidden border-violet-100 bg-gradient-to-r from-violet-50/80 via-white to-fuchsia-50/70 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
              <Info className="h-5 w-5 text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-violet-900">Weekly payouts every Friday</p>
              <p className="mt-1 text-sm leading-6 text-violet-700">
                Withdrawal requests are reviewed and paid out every Friday. Submit your request
                before Friday to be included in the next payout cycle. Only one active withdrawal
                request can be open at a time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 rounded-3xl bg-gray-50/60 p-2">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-[0_10px_30px_rgba(124,58,237,0.25)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-violet-100">Available to Withdraw</p>
                <p className="mt-2 text-4xl font-bold tracking-tight">
                  {formatCurrency(liveAvailableBalance)}
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                <Wallet className="h-8 w-8 text-violet-100" />
              </div>
            </div>

            <Button
              onClick={() => setShowWithdrawDialog(true)}
              disabled={hasActiveWithdrawalRequest}
              className="mt-5 bg-white text-violet-600 hover:bg-violet-50 disabled:bg-white/70 disabled:text-violet-400"
            >
              {hasActiveWithdrawalRequest ? 'Withdrawal In Progress' : 'Withdraw'}
            </Button>

            {hasActiveWithdrawalRequest && (
              <p className="mt-3 text-xs text-violet-100">
                You already have a withdrawal request in progress.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-400 to-orange-500" />
          <CardContent className="p-6 pl-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.14em] text-gray-400">
                  Pending
                </p>
                <p className="mt-3 text-4xl font-bold tracking-tight text-gray-900">
                  {formatCurrency(pendingEarnings)}
                </p>
                <p className="mt-2 text-sm text-gray-500">From active funded deliveries</p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 transition-colors duration-200 group-hover:bg-amber-100">
                <Lock className="h-8 w-8" />
              </div>
            </div>
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
              <Card className="border-2 border-dashed">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No withdrawal request in progress</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6 rounded-3xl bg-gray-50/60 p-2">
                {activeWithdrawals.map((request: any) => (
                  <Card
                    key={request.id}
                    className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]"
                  >
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-400 to-orange-500" />
                    <CardContent className="p-5 pl-6 sm:p-6 sm:pl-7">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                            <Banknote className="h-5 w-5 text-amber-600" />
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">Withdrawal Request</p>
                            <p className="text-sm text-gray-500">
                              {formatDistanceToNow(request.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(request.amount)}
                          </p>
                          <span
                            className={cn(
                              'mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize',
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
              <Card className="border-2 border-dashed">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No processed withdrawals yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6 rounded-3xl bg-gray-50/60 p-2">
                {completedWithdrawals.slice(0, 10).map((request: any) => (
                  <Card
                    key={request.id}
                    className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]"
                  >
                    <div
                      className={cn(
                        'absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b',
                        (request.status || '').toLowerCase() === 'completed'
                          ? 'from-emerald-400 to-green-500'
                          : 'from-rose-400 to-red-500'
                      )}
                    />
                    <CardContent className="p-5 pl-6 sm:p-6 sm:pl-7">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                              (request.status || '').toLowerCase() === 'completed'
                                ? 'bg-green-100'
                                : 'bg-red-100'
                            )}
                          >
                            {(request.status || '').toLowerCase() === 'completed' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">Withdrawal Request</p>
                            <p className="text-sm text-gray-500">
                              {formatDistanceToNow(request.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(request.amount)}
                          </p>
                          <span
                            className={cn(
                              'mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize',
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
              <Card className="border-2 border-dashed">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">Loading transactions...</p>
                </CardContent>
              </Card>
            ) : transactions.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No transactions yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6 rounded-3xl bg-gray-50/60 p-2">
                {transactions.map((tx) => (
                  <Card
                    key={tx.id}
                    className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]"
                  >
                    <div
                      className={cn(
                        'absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b',
                        tx.transaction_type === 'escrow_release'
                          ? 'from-emerald-400 to-green-500'
                          : tx.transaction_type === 'withdrawal'
                          ? 'from-rose-400 to-red-500'
                          : 'from-gray-400 to-gray-500'
                      )}
                    />

                    <CardContent className="p-5 pl-6 sm:p-6 sm:pl-7">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100">
                            {getTransactionIcon(tx.transaction_type)}
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">
                              {formatTransactionType(tx.transaction_type)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDistanceToNow(tx.created_at)}
                            </p>
                          </div>
                        </div>

                        <p
                          className={cn(
                            'shrink-0 font-semibold',
                            getTransactionAmountClass(tx.transaction_type)
                          )}
                        >
                          {tx.transaction_type === 'escrow_release' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </p>
                      </div>

                      {tx.description && (
                        <p className="mt-3 text-sm text-gray-500">{tx.description}</p>
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
        <DialogContent className="overflow-hidden rounded-[28px] border-0 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.20)] sm:max-w-md">
          <div className="bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
            <DialogHeader className="border-b border-violet-100/70 px-6 pb-4 pt-6 text-left">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_10px_30px_rgba(124,58,237,0.22)]">
                <Wallet className="h-7 w-7 text-white" />
              </div>
              <DialogTitle className="text-2xl font-semibold tracking-tight text-gray-900">
                Withdraw Funds
              </DialogTitle>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Request a payout from your available balance. Approved withdrawals are processed in
                the next payout cycle.
              </p>
            </DialogHeader>

            <div className="space-y-5 px-6 py-5">
              {hasActiveWithdrawalRequest ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm leading-6 text-amber-800">
                    You already have a pending withdrawal request. Wait for it to be processed before
                    creating another one.
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-violet-200 bg-violet-50/80 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-violet-900">Friday payout cycle</p>
                        <p className="mt-1 text-sm leading-6 text-violet-800">
                          Withdrawal requests are paid out every Friday after review. Submit early to
                          be included in the next cycle.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <label className="mb-3 block text-sm font-semibold text-gray-800">
                      Amount (₦)
                    </label>
                    <Input
                      type="number"
                      placeholder={`Minimum ${formatCurrency(MIN_WITHDRAWAL)}`}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="h-14 rounded-2xl border-gray-200 bg-gray-50 text-base font-medium text-gray-900 placeholder:text-gray-400 focus:border-violet-300 focus:ring-violet-200"
                    />
                    <p className="mt-3 text-sm text-gray-500">
                      Minimum withdrawal: {formatCurrency(MIN_WITHDRAWAL)}
                    </p>
                  </div>

                  {bankAccounts.length === 0 ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm leading-6 text-amber-800">
                        Please add a bank account in your profile first.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <label className="mb-3 block text-sm font-semibold text-gray-800">
                        Bank Account
                      </label>
                      <select
                        value={selectedBankId}
                        onChange={(e) => setSelectedBankId(e.target.value)}
                        className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base font-medium text-gray-900 outline-none transition-all focus:border-violet-300 focus:ring-4 focus:ring-violet-200/60"
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
                    className="h-12 w-full rounded-2xl bg-violet-600 text-white hover:bg-violet-700"
                  >
                    {isWithdrawing ? 'Processing...' : 'Request Withdrawal'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
