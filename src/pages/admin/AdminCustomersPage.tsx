// ============================================
// DISPATCH NG - Admin Customers Page
// ============================================
import { useEffect, useMemo, useState } from 'react';
import { Search, Phone, Wallet, Package, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime } from '@/utils/format';

interface AdminCustomer {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  user_type: string | null;
  is_active: boolean | null;
  created_at: string;
  wallet_balance: number;
  held_balance: number;
  total_jobs: number;
  completed_jobs: number;
  cancelled_jobs: number;
}

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);

      const [{ data: profilesData, error: profilesError }, { data: riderProfilesData, error: riderProfilesError }] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('id, full_name, email, phone, avatar_url, user_type, is_active, created_at')
            .order('created_at', { ascending: false }),

          supabase
            .from('rider_profiles')
            .select('profile_id'),
        ]);

      if (profilesError) throw profilesError;
      if (riderProfilesError) throw riderProfilesError;

      const riderProfileIds = new Set(
        (riderProfilesData || []).map((rider) => rider.profile_id).filter(Boolean)
      );

      const customerProfiles = (profilesData || []).filter((profile) => {
        if (profile.user_type === 'admin') return false;
        if (riderProfileIds.has(profile.id)) return false;
        return true;
      });

      const customerIds = customerProfiles.map((customer) => customer.id);

      let walletMap = new Map<string, { available_balance: number; held_balance: number }>();
      let jobsMap = new Map<
        string,
        { total_jobs: number; completed_jobs: number; cancelled_jobs: number }
      >();

      if (customerIds.length > 0) {
        const [{ data: walletsData, error: walletsError }, { data: jobsData, error: jobsError }] =
          await Promise.all([
            supabase
              .from('wallets')
              .select('profile_id, available_balance, held_balance')
              .in('profile_id', customerIds),

            supabase
              .from('dispatch_jobs')
              .select('customer_id, status')
              .in('customer_id', customerIds),
          ]);

        if (walletsError) throw walletsError;
        if (jobsError) throw jobsError;

        walletMap = new Map(
          (walletsData || []).map((wallet) => [
            wallet.profile_id,
            {
              available_balance: Number(wallet.available_balance || 0),
              held_balance: Number(wallet.held_balance || 0),
            },
          ])
        );

        jobsMap = (jobsData || []).reduce((map, job) => {
          const current = map.get(job.customer_id) || {
            total_jobs: 0,
            completed_jobs: 0,
            cancelled_jobs: 0,
          };

          current.total_jobs += 1;

          if (job.status === 'completed') current.completed_jobs += 1;
          if (job.status === 'cancelled') current.cancelled_jobs += 1;

          map.set(job.customer_id, current);
          return map;
        }, new Map<string, { total_jobs: number; completed_jobs: number; cancelled_jobs: number }>());
      }

      const formattedCustomers: AdminCustomer[] =
        customerProfiles.map((customer) => {
          const wallet = walletMap.get(customer.id);
          const jobs = jobsMap.get(customer.id);

          return {
            id: customer.id,
            full_name: customer.full_name,
            email: customer.email,
            phone: customer.phone,
            avatar_url: customer.avatar_url,
            user_type: customer.user_type,
            is_active: customer.is_active,
            created_at: customer.created_at,
            wallet_balance: wallet?.available_balance || 0,
            held_balance: wallet?.held_balance || 0,
            total_jobs: jobs?.total_jobs || 0,
            completed_jobs: jobs?.completed_jobs || 0,
            cancelled_jobs: jobs?.cancelled_jobs || 0,
          };
        }) || [];

      setCustomers(formattedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;

    const query = searchQuery.toLowerCase();

    return customers.filter((customer) => {
      return (
        customer.full_name?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query)
      );
    });
  }, [customers, searchQuery]);

  const renderAvatar = (customer: AdminCustomer) => {
    if (customer.avatar_url) {
      return (
        <img
          src={customer.avatar_url}
          alt={customer.full_name || 'Customer'}
          className="w-12 h-12 rounded-full object-cover border border-gray-200"
        />
      );
    }

    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white font-medium">
        {customer.full_name?.charAt(0)?.toUpperCase() || 'C'}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500">Manage all customer accounts</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search by name, email or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
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
      ) : filteredCustomers.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No customers found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((customer) => (
            <Card
              key={customer.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedCustomer(customer)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {renderAvatar(customer)}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {customer.full_name || 'Customer'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{customer.email || 'No email'}</p>
                      <p className="text-sm text-gray-500 truncate">{customer.phone || 'No phone'}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(customer.wallet_balance)}
                    </p>
                    <p className="text-sm text-gray-500">{customer.total_jobs} jobs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedCustomer.avatar_url ? (
                  <img
                    src={selectedCustomer.avatar_url}
                    alt={selectedCustomer.full_name || 'Customer'}
                    className="w-16 h-16 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white text-xl font-medium">
                    {selectedCustomer.full_name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                )}
                <div>
                  <p className="text-xl font-semibold text-gray-900">
                    {selectedCustomer.full_name || 'Customer'}
                  </p>
                  <p className="text-sm text-gray-500">{selectedCustomer.email || 'No email'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </p>
                  <p className="font-medium text-gray-900">{selectedCustomer.phone || 'Not set'}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Joined
                  </p>
                  <p className="font-medium text-gray-900">
                    {formatDateTime(selectedCustomer.created_at)}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Wallet Balance
                  </p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(selectedCustomer.wallet_balance)}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Held in Escrow
                  </p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(selectedCustomer.held_balance)}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Total Jobs
                  </p>
                  <p className="font-medium text-gray-900">{selectedCustomer.total_jobs}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Completed Jobs
                  </p>
                  <p className="font-medium text-gray-900">{selectedCustomer.completed_jobs}</p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm text-gray-500 mb-1">Account Status</p>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedCustomer.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {selectedCustomer.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}