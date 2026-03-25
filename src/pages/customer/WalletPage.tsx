// ============================================
// DISPATCH NG - Wallet Page (Customer)
// ============================================

import { useEffect, useState } from 'react';
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, Lock, 
  Plus, History, CreditCard 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/uiStore';
import type { WalletTransaction } from '@/types';
import { formatCurrency, formatDateTime, formatDistanceToNow } from '@/utils/format';
import { cn } from '@/lib/utils';

const MIN_FUNDING = 500;

export function WalletPage() {
  const { user, wallet, setWallet } = useAuthStore();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fund wallet dialog
  const [showFundDialog, setShowFundDialog] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [isFunding, setIsFunding] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch wallet
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('profile_id', user?.id)
        .single();
      
      if (walletData) {
        setWallet(walletData);
      }

      // Fetch transactions
      if (walletData?.id) {
        const { data: txData } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('wallet_id', walletData.id)
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (txData) {
          setTransactions(txData);
        }
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFundWallet = async () => {
    const amount = parseFloat(fundAmount);
    
    if (amount < MIN_FUNDING) {
      showToast('error', 'Invalid amount', `Minimum funding amount is ${formatCurrency(MIN_FUNDING)}`);
      return;
    }

    setIsFunding(true);

    try {
      // In a real app, you would integrate with Paystack/Flutterwave here
      // For now, we'll simulate a successful payment
      
      // Create deposit transaction
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet?.id,
          transaction_type: 'deposit',
          amount: amount,
          balance_before: wallet?.available_balance || 0,
          balance_after: (wallet?.available_balance || 0) + amount,
          description: 'Wallet funding via card',
        });

      if (txError) throw txError;

      // Update wallet balance
      const { data: updatedWallet } = await supabase
        .from('wallets')
        .update({
          available_balance: (wallet?.available_balance || 0) + amount,
          total_deposited: (wallet?.total_deposited || 0) + amount,
        })
        .eq('id', wallet?.id)
        .select()
        .single();

      if (updatedWallet) {
        setWallet(updatedWallet);
      }

      showToast('success', 'Success!', `Your wallet has been funded with ${formatCurrency(amount)}`);
      setShowFundDialog(false);
      setFundAmount('');
      fetchWalletData();
    } catch (error: any) {
      showToast('error', 'Error', error.message);
    } finally {
      setIsFunding(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      case 'escrow_lock':
        return <Lock className="w-5 h-5 text-amber-500" />;
      case 'escrow_release':
        return <ArrowUpRight className="w-5 h-5 text-blue-500" />;
      case 'escrow_refund':
        return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
      default:
        return <History className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'escrow_refund':
        return 'text-green-600';
      case 'withdrawal':
      case 'escrow_lock':
        return 'text-red-600';
      case 'escrow_release':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTransactionType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
        <p className="text-gray-500">Manage your funds and transactions</p>
      </div>

      {/* Balance Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-6 h-6 text-violet-200" />
                <span className="text-violet-100">Available Balance</span>
              </div>
            </div>
            <p className="text-4xl font-bold">{formatCurrency(wallet?.available_balance || 0)}</p>
            <Button
              onClick={() => setShowFundDialog(true)}
              className="mt-4 bg-white text-violet-600 hover:bg-violet-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Fund Wallet
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-6 h-6 text-amber-500" />
                <span className="text-gray-600">Held in Escrow</span>
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900">{formatCurrency(wallet?.held_balance || 0)}</p>
            <p className="text-sm text-gray-500 mt-2">
              Funds locked for active deliveries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Deposited</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(wallet?.total_deposited || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Spent</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatCurrency((wallet?.total_deposited || 0) - (wallet?.available_balance || 0) - (wallet?.held_balance || 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-12 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
              <p className="text-gray-500">Fund your wallet to get started</p>
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
                        <p className="font-medium text-gray-900">{formatTransactionType(tx.transaction_type)}</p>
                        <p className="text-sm text-gray-500">{formatDistanceToNow(tx.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn('font-semibold', getTransactionColor(tx.transaction_type))}>
                        {['deposit', 'escrow_refund'].includes(tx.transaction_type) ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Balance: {formatCurrency(tx.balance_after)}
                      </p>
                    </div>
                  </div>
                  {tx.description && (
                    <p className="mt-2 text-sm text-gray-500">{tx.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Fund Wallet Dialog */}
      <Dialog open={showFundDialog} onOpenChange={setShowFundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fund Your Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Amount (₦)</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₦</span>
                <Input
                  type="number"
                  placeholder={`Minimum ${formatCurrency(MIN_FUNDING)}`}
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="pl-8"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">Minimum funding: {formatCurrency(MIN_FUNDING)}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-700">Payment Method</span>
              </div>
              <p className="text-sm text-gray-500">Card payment via Paystack (simulated)</p>
            </div>

            <Button
              onClick={handleFundWallet}
              disabled={isFunding || !fundAmount || parseFloat(fundAmount) < MIN_FUNDING}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isFunding ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                `Fund ${fundAmount ? formatCurrency(parseFloat(fundAmount)) : 'Wallet'}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
