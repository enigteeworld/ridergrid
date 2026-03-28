// ============================================
// DISPATCH NG - Wallet Page (Customer)
// ============================================
import { useEffect, useState, useCallback } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Plus,
  History,
  CreditCard,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/uiStore';
import type { WalletTransaction } from '@/types';
import { formatCurrency, formatDistanceToNow } from '@/utils/format';
import { cn } from '@/lib/utils';

const MIN_FUNDING = Number(import.meta.env.VITE_MIN_WALLET_FUNDING || 500);

type InitializeFundingResponse = {
  ok?: boolean;
  message?: string;
  authorization_url?: string | null;
  access_code?: string | null;
  reference?: string | null;
  error?: string;
};

type VerifyFundingResponse = {
  ok?: boolean;
  already_processed?: boolean;
  message?: string;
  wallet?: any;
  amount?: number;
  reference?: string;
  error?: string;
};

export function WalletPage() {
  const { user, wallet, setWallet } = useAuthStore();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFundDialog, setShowFundDialog] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [isFunding, setIsFunding] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);

  const fetchWalletData = useCallback(async () => {
    if (!user?.id) {
      setTransactions([]);
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

  useEffect(() => {
    const verifyFundingFromUrl = async () => {
      if (!user?.id) return;

      const url = new URL(window.location.href);
      const reference = url.searchParams.get('reference');
      const trxref = url.searchParams.get('trxref');
      const paymentReference = reference || trxref;

      if (!paymentReference) return;

      try {
        setIsFunding(true);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session?.access_token) {
          throw new Error('You are not signed in');
        }

        const { data: result, error } = await supabase.functions.invoke<VerifyFundingResponse>(
          'paystack-verify-wallet-funding',
          {
            body: {
              reference: paymentReference,
            },
          }
        );

        if (error) {
          throw new Error(error.message || 'Failed to verify payment');
        }

        if (!result?.ok) {
          throw new Error(result?.error || result?.message || 'Failed to verify payment');
        }

        if (result.wallet) {
          setWallet(result.wallet);
        }

        await fetchWalletData();

        showToast(
          'success',
          'Wallet funded',
          result.message || 'Your wallet has been funded successfully'
        );

        url.searchParams.delete('reference');
        url.searchParams.delete('trxref');
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
      } catch (error: any) {
        console.error('Funding verification error:', error);
        showToast('error', 'Verification failed', error.message || 'Failed to verify payment');
      } finally {
        setIsFunding(false);
      }
    };

    verifyFundingFromUrl();
  }, [user?.id, fetchWalletData, setWallet]);

  const handleFundWallet = async () => {
    const amount = parseFloat(fundAmount);

    if (!wallet?.id) {
      showToast('error', 'Error', 'Wallet not found');
      return;
    }

    if (!amount || Number.isNaN(amount) || amount < MIN_FUNDING) {
      showToast(
        'error',
        'Invalid amount',
        `Minimum funding amount is ${formatCurrency(MIN_FUNDING)}`
      );
      return;
    }

    setIsFunding(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.access_token) {
        throw new Error('You are not signed in');
      }

      const { data: result, error } = await supabase.functions.invoke<InitializeFundingResponse>(
        'paystack-initialize-wallet-funding',
        {
          body: {
            amount,
            email: user?.email,
          },
        }
      );

      if (error) {
        throw new Error(error.message || 'Failed to initialize payment');
      }

      if (!result?.ok || !result.authorization_url) {
        throw new Error(result?.error || result?.message || 'Failed to initialize payment');
      }

      setShowFundDialog(false);
      setFundAmount('');
      window.location.href = result.authorization_url;
    } catch (error: any) {
      console.error('Wallet funding initialization error:', error);
      showToast('error', 'Error', error.message || 'Failed to initialize wallet funding');
    } finally {
      setIsFunding(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-5 w-5 text-red-500" />;
      case 'escrow_lock':
        return <Lock className="h-5 w-5 text-amber-500" />;
      case 'escrow_release':
        return <ArrowUpRight className="h-5 w-5 text-blue-500" />;
      case 'escrow_refund':
        return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
      default:
        return <History className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'escrow_refund':
        return 'text-green-600';
      case 'withdrawal':
      case 'escrow_lock':
      case 'escrow_release':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTransactionType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getTransactionPrefix = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'escrow_refund':
        return '+';
      case 'withdrawal':
      case 'escrow_lock':
      case 'escrow_release':
        return '-';
      default:
        return '';
    }
  };

  const getMetricAccent = (kind: 'held' | 'deposited' | 'spent') => {
    switch (kind) {
      case 'held':
        return 'from-amber-400 to-orange-500';
      case 'deposited':
        return 'from-emerald-400 to-green-500';
      case 'spent':
        return 'from-rose-400 to-red-500';
    }
  };

  const totalSpent = Math.max(
    0,
    Number(wallet?.total_deposited || 0) -
      Number(wallet?.available_balance || 0) -
      Number(wallet?.held_balance || 0)
  );

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
      <Card className="overflow-hidden rounded-[28px] border-violet-100 bg-gradient-to-br from-violet-50/70 via-white to-fuchsia-50/50 shadow-sm transition-all duration-200 hover:shadow-md">
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
        <p className="text-gray-500">Manage your funds and transactions</p>
      </div>

      <Card className="overflow-hidden rounded-[28px] border-violet-100 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
              <ShieldCheck className="h-5 w-5 text-violet-600" />
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-gray-900">Fund inside Dispatch NG</p>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Your wallet powers delivery funding, escrow protection, refunds where applicable,
                and a cleaner in-app payment flow.
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
                <p className="text-sm text-violet-100">Available Balance</p>
                <p className="mt-2 text-4xl font-bold tracking-tight">
                  {formatCurrency(Number(wallet?.available_balance || 0))}
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                <Wallet className="h-8 w-8 text-violet-100" />
              </div>
            </div>

            <Button
              onClick={() => setShowFundDialog(true)}
              className="mt-5 h-11 rounded-2xl bg-white text-violet-600 hover:bg-violet-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              Fund Wallet
            </Button>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
          <div
            className={cn(
              'absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b',
              getMetricAccent('held')
            )}
          />
          <CardContent className="p-6 pl-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.14em] text-gray-400">
                  Held in Escrow
                </p>
                <p className="mt-3 text-4xl font-bold tracking-tight text-gray-900">
                  {formatCurrency(Number(wallet?.held_balance || 0))}
                </p>
                <p className="mt-2 text-sm text-gray-500">Funds locked for active deliveries</p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 transition-colors duration-200 group-hover:bg-amber-100">
                <Lock className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
            <div
              className={cn(
                'absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b',
                getMetricAccent('deposited')
              )}
            />
            <CardContent className="p-5 pl-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.14em] text-gray-400">
                    Total Deposited
                  </p>
                  <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
                    {formatCurrency(Number(wallet?.total_deposited || 0))}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 transition-colors duration-200 group-hover:bg-emerald-100">
                  <ArrowDownLeft className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
            <div
              className={cn(
                'absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b',
                getMetricAccent('spent')
              )}
            />
            <CardContent className="p-5 pl-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.14em] text-gray-400">
                    Total Spent
                  </p>
                  <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
                    {formatCurrency(totalSpent)}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 transition-colors duration-200 group-hover:bg-rose-100">
                  <ArrowUpRight className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
              <div className="space-y-4 pt-2">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-5">
                      <div className="h-16 rounded-2xl bg-gray-200" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <Card className="rounded-[28px] border-2 border-dashed">
                <CardContent className="p-8 text-center">
                  <History className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900">No transactions yet</h3>
                  <p className="text-gray-500">Fund your wallet to get started</p>
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
                        tx.transaction_type === 'deposit' || tx.transaction_type === 'escrow_refund'
                          ? 'from-emerald-400 to-green-500'
                          : tx.transaction_type === 'escrow_lock'
                          ? 'from-amber-400 to-orange-500'
                          : 'from-rose-400 to-red-500'
                      )}
                    />
                    <CardContent className="p-5 pl-6 sm:p-6 sm:pl-7">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-100">
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

                        <div className="shrink-0 text-right">
                          <p className={cn('font-semibold', getTransactionColor(tx.transaction_type))}>
                            {getTransactionPrefix(tx.transaction_type)}
                            {formatCurrency(Number(tx.amount || 0))}
                          </p>
                          <p className="text-xs text-gray-400">
                            Balance: {formatCurrency(Number(tx.balance_after || 0))}
                          </p>
                        </div>
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

      <Dialog open={showFundDialog} onOpenChange={setShowFundDialog}>
        <DialogContent className="max-h-[88vh] overflow-y-auto rounded-[28px] border-0 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.20)] sm:max-w-md">
          <div className="bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
            <DialogHeader className="border-b border-violet-100/70 px-6 pb-4 pt-4 text-left sm:pt-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_10px_30px_rgba(124,58,237,0.25)]">
                <Wallet className="h-7 w-7 text-white" />
              </div>

              <DialogTitle className="text-2xl font-semibold tracking-tight text-gray-900">
                Fund Your Wallet
              </DialogTitle>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Add money securely with Paystack and use it to fund deliveries inside Dispatch NG.
              </p>
            </DialogHeader>

            <div className="space-y-5 px-6 pb-5 pt-4 sm:py-5">
              <div className="rounded-2xl border border-violet-200 bg-violet-50/80 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-violet-900">Secure checkout</p>
                    <p className="mt-1 text-sm leading-6 text-violet-800">
                      Payments are processed securely through Paystack. Your wallet balance updates
                      after successful verification.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <label className="mb-3 block text-sm font-semibold text-gray-800">
                  Amount (₦)
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-gray-500">
                    ₦
                  </span>
                  <Input
                    type="number"
                    placeholder={`Minimum ${formatCurrency(MIN_FUNDING)}`}
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    className="h-14 rounded-2xl border-gray-200 bg-gray-50 pl-10 text-base font-medium text-gray-900 placeholder:text-gray-400 focus:border-violet-300 focus:ring-violet-200"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <p className="text-gray-500">
                    Minimum funding:{' '}
                    <span className="font-medium text-gray-700">
                      {formatCurrency(MIN_FUNDING)}
                    </span>
                  </p>

                  {fundAmount && !Number.isNaN(parseFloat(fundAmount)) && (
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                      {formatCurrency(parseFloat(fundAmount || '0'))}
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Payment Method</p>
                    <p className="text-sm text-gray-500">Card payment via Paystack</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <Button
                  onClick={handleFundWallet}
                  disabled={isFunding || !fundAmount || parseFloat(fundAmount) < MIN_FUNDING}
                  className="h-12 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_12px_30px_rgba(124,58,237,0.20)] hover:from-violet-700 hover:to-fuchsia-700"
                >
                  {isFunding ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Processing...
                    </div>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {fundAmount
                        ? `Fund ${formatCurrency(parseFloat(fundAmount))}`
                        : 'Fund Wallet'}
                    </>
                  )}
                </Button>

                <p className="text-center text-xs leading-5 text-gray-400">
                  You’ll be redirected to Paystack to complete payment securely.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
