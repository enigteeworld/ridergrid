// ============================================
// DISPATCH NG - Supabase Client Configuration
// ============================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'dispatch-ng-auth',
  },
});

// Auth helpers
export const signUp = async (
  email: string,
  password: string,
  userData: {
    full_name: string;
    phone: string;
    user_type: 'customer' | 'rider';
  }
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
};

export const getSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  return { session, error };
};

// Profile helpers
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateProfile = async (userId: string, updates: Record<string, any>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
};

// Wallet helpers
export const getWallet = async (userId: string) => {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('profile_id', userId)
    .single();
  return { data, error };
};

export const getWalletTransactions = async (walletId: string, limit = 20) => {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data, error };
};

// Rider helpers
export const getRiderProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('rider_profiles')
    .select('*')
    .eq('profile_id', userId)
    .single();
  return { data, error };
};

export const updateRiderProfile = async (userId: string, updates: Record<string, any>) => {
  const { data, error } = await supabase
    .from('rider_profiles')
    .update(updates)
    .eq('profile_id', userId)
    .select()
    .single();
  return { data, error };
};

export const getAvailableRiders = async () => {
  const { data, error } = await supabase
    .from('available_riders')
    .select('*')
    .order('rating_average', { ascending: false });
  return { data, error };
};

// Dispatch job helpers
export const createDispatchJob = async (jobData: Record<string, any>) => {
  const { data, error } = await supabase
    .from('dispatch_jobs')
    .insert(jobData)
    .select()
    .single();
  return { data, error };
};

export const getJob = async (jobId: string) => {
  const { data, error } = await supabase
    .from('job_details')
    .select('*')
    .eq('id', jobId)
    .single();
  return { data, error };
};

export const getCustomerJobs = async (customerId: string) => {
  const { data, error } = await supabase
    .from('job_details')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const getRiderJobs = async (riderId: string) => {
  const { data, error } = await supabase
    .from('job_details')
    .select('*')
    .eq('rider_id', riderId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const updateJobStatus = async (jobId: string, updates: Record<string, any>) => {
  const { data, error } = await supabase
    .from('dispatch_jobs')
    .update(updates)
    .eq('id', jobId)
    .select()
    .single();
  return { data, error };
};

export const assignRider = async (jobId: string, riderId: string) => {
  const { data, error } = await supabase
    .from('dispatch_jobs')
    .update({
      rider_id: riderId,
      status: 'awaiting_funding',
      rider_assigned_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select()
    .single();
  return { data, error };
};

// Escrow helpers
export const lockEscrow = async (escrowData: Record<string, any>) => {
  const { data, error } = await supabase
    .from('escrow_records')
    .insert(escrowData)
    .select()
    .single();
  return { data, error };
};

export const releaseEscrow = async (jobId: string) => {
  const { data, error } = await supabase
    .from('escrow_records')
    .update({
      status: 'released',
      released_at: new Date().toISOString(),
    })
    .eq('dispatch_job_id', jobId)
    .select()
    .single();
  return { data, error };
};

// Rating helpers
export const createRating = async (ratingData: Record<string, any>) => {
  const { data, error } = await supabase
    .from('ratings')
    .insert(ratingData)
    .select()
    .single();
  return { data, error };
};

export const getRiderRatings = async (riderId: string) => {
  const { data, error } = await supabase
    .from('ratings')
    .select(`
      *,
      customer:customer_id(full_name, avatar_url)
    `)
    .eq('rider_id', riderId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false });
  return { data, error };
};

// KYC helpers
export const submitKyc = async (kycData: Record<string, any>) => {
  const { data, error } = await supabase
    .from('kyc_records')
    .insert(kycData)
    .select()
    .single();
  return { data, error };
};

export const getKycRecords = async (profileId: string) => {
  const { data, error } = await supabase
    .from('kyc_records')
    .select('*')
    .eq('profile_id', profileId);
  return { data, error };
};

// Withdrawal helpers
export const requestWithdrawal = async (withdrawalData: Record<string, any>) => {
  const { data, error } = await supabase
    .from('withdrawal_requests')
    .insert(withdrawalData)
    .select()
    .single();
  return { data, error };
};

export const getWithdrawalRequests = async (profileId: string) => {
  const { data, error } = await supabase
    .from('withdrawal_requests')
    .select(`
      *,
      bank_account:bank_account_id(*)
    `)
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
  return { data, error };
};

// Notification helpers
export const getNotifications = async (profileId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(50);
  return { data, error };
};

export const markNotificationRead = async (notificationId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select()
    .single();
  return { data, error };
};

// Admin helpers
export const getPendingVerifications = async () => {
  const { data, error } = await supabase
    .from('rider_profiles')
    .select(`
      *,
      profile:profile_id(*),
      kyc:kyc_records(*)
    `)
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: false });
  return { data, error };
};

export const verifyRider = async (riderId: string, status: string) => {
  const { data, error } = await supabase
    .from('rider_profiles')
    .update({
      verification_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('profile_id', riderId)
    .select()
    .single();
  return { data, error };
};

export const getOpenDisputes = async () => {
  const { data, error } = await supabase
    .from('disputes')
    .select(`
      *,
      job:dispatch_job_id(*),
      raised_by_profile:raised_by(full_name, phone)
    `)
    .in('status', ['open', 'under_review'])
    .order('created_at', { ascending: false });
  return { data, error };
};

// Realtime subscriptions
export const subscribeToJobUpdates = (jobId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`job:${jobId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'dispatch_jobs',
        filter: `id=eq.${jobId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToNotifications = (profileId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`notifications:${profileId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `profile_id=eq.${profileId}`,
      },
      callback
    )
    .subscribe();
};

// File upload helpers
export const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  return { data, error };
};

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};