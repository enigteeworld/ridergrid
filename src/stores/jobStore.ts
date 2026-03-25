// ============================================
// DISPATCH NG - Job/Dispatch Store (Zustand)
// ============================================

import { create } from 'zustand';
import type { DispatchJob, JobDetails, AvailableRider, DeliveryProof } from '@/types';

interface JobState {
  // State
  currentJob: JobDetails | null;
  customerJobs: JobDetails[];
  riderJobs: JobDetails[];
  availableRiders: AvailableRider[];
  deliveryProofs: DeliveryProof[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentJob: (job: JobDetails | null) => void;
  setCustomerJobs: (jobs: JobDetails[]) => void;
  setRiderJobs: (jobs: JobDetails[]) => void;
  setAvailableRiders: (riders: AvailableRider[]) => void;
  setDeliveryProofs: (proofs: DeliveryProof[]) => void;
  addCustomerJob: (job: JobDetails) => void;
  updateJob: (jobId: string, updates: Partial<JobDetails>) => void;
  removeCustomerJob: (jobId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useJobStore = create<JobState>((set, get) => ({
  // Initial state
  currentJob: null,
  customerJobs: [],
  riderJobs: [],
  availableRiders: [],
  deliveryProofs: [],
  isLoading: false,
  error: null,

  // Setters
  setCurrentJob: (job) => set({ currentJob: job }),
  setCustomerJobs: (jobs) => set({ customerJobs: jobs }),
  setRiderJobs: (jobs) => set({ riderJobs: jobs }),
  setAvailableRiders: (riders) => set({ availableRiders: riders }),
  setDeliveryProofs: (proofs) => set({ deliveryProofs: proofs }),

  // Add a new customer job
  addCustomerJob: (job) => {
    const { customerJobs } = get();
    set({ customerJobs: [job, ...customerJobs] });
  },

  // Update a job
  updateJob: (jobId, updates) => {
    const { customerJobs, riderJobs, currentJob } = get();
    
    // Update in customer jobs
    const updatedCustomerJobs = customerJobs.map(job => 
      job.id === jobId ? { ...job, ...updates } : job
    );
    
    // Update in rider jobs
    const updatedRiderJobs = riderJobs.map(job => 
      job.id === jobId ? { ...job, ...updates } : job
    );
    
    // Update current job if it's the same
    const updatedCurrentJob = currentJob?.id === jobId 
      ? { ...currentJob, ...updates } 
      : currentJob;

    set({ 
      customerJobs: updatedCustomerJobs,
      riderJobs: updatedRiderJobs,
      currentJob: updatedCurrentJob
    });
  },

  // Remove a customer job
  removeCustomerJob: (jobId) => {
    const { customerJobs } = get();
    set({ 
      customerJobs: customerJobs.filter(job => job.id !== jobId),
      currentJob: get().currentJob?.id === jobId ? null : get().currentJob
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  
  reset: () => set({
    currentJob: null,
    customerJobs: [],
    riderJobs: [],
    availableRiders: [],
    deliveryProofs: [],
    isLoading: false,
    error: null
  })
}));
