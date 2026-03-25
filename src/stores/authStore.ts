// ============================================
// DISPATCH NG - Authentication Store (Zustand)
// ============================================
import { create } from 'zustand';
import { supabase, getSession } from '@/lib/supabase';
import type { Profile, RiderProfile, Wallet } from '@/types';

let isInitializingAuth = false;

interface AuthState {
  user: Profile | null;
  riderProfile: RiderProfile | null;
  wallet: Wallet | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setUser: (user: Profile | null) => void;
  setRiderProfile: (profile: RiderProfile | null) => void;
  setWallet: (wallet: Wallet | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetAuthState: () => void;

  initializeAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  riderProfile: null,
  wallet: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setRiderProfile: (profile) => set({ riderProfile: profile }),
  setWallet: (wallet) => set({ wallet }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  resetAuthState: () =>
    set({
      user: null,
      riderProfile: null,
      wallet: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    }),

  initializeAuth: async () => {
    if (isInitializingAuth) return;
    isInitializingAuth = true;

    try {
      set({
        isLoading: true,
        error: null,
      });

      const { session } = await getSession();

      if (!session?.user) {
        set({
          user: null,
          riderProfile: null,
          wallet: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error during auth init:', profileError);
        set({
          user: null,
          riderProfile: null,
          wallet: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to load your profile.',
        });
        return;
      }

      if (!profile) {
        set({
          user: null,
          riderProfile: null,
          wallet: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Your account profile is not ready yet. Please sign in again shortly.',
        });
        return;
      }

      let riderProfile: RiderProfile | null = null;
      let wallet: Wallet | null = null;

      if (profile.user_type === 'rider') {
        const { data: riderData, error: riderError } = await supabase
          .from('rider_profiles')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (riderError) {
          console.error('Rider profile fetch error:', riderError);
        }

        riderProfile = riderData ?? null;
      }

      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (walletError) {
        console.error('Wallet fetch error:', walletError);
      }

      wallet = walletData ?? null;

      set({
        user: profile,
        riderProfile,
        wallet,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({
        user: null,
        riderProfile: null,
        wallet: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to initialize authentication.',
      });
    } finally {
      isInitializingAuth = false;
    }
  },

  refreshUser: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Refresh profile error:', profileError);
        return;
      }

      if (!profile) {
        set({
          user: null,
          riderProfile: null,
          wallet: null,
          isAuthenticated: false,
          error: 'Profile not found.',
        });
        return;
      }

      let riderProfile: RiderProfile | null = null;
      let wallet: Wallet | null = null;

      if (profile.user_type === 'rider') {
        const { data: riderData, error: riderError } = await supabase
          .from('rider_profiles')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (riderError) {
          console.error('Refresh rider profile error:', riderError);
        }

        riderProfile = riderData ?? null;
      }

      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (walletError) {
        console.error('Refresh wallet error:', walletError);
      }

      wallet = walletData ?? null;

      set({
        user: profile,
        riderProfile,
        wallet,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({
        user: null,
        riderProfile: null,
        wallet: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      set({ error: 'Failed to sign out' });
    }
  },
}));

export const initializeAuthListener = () => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event) => {
    const { initializeAuth, resetAuthState } = useAuthStore.getState();

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      initializeAuth();
    } else if (event === 'SIGNED_OUT') {
      resetAuthState();
    }
  });

  return () => {
    subscription.unsubscribe();
  };
};