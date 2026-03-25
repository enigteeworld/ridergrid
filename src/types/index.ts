// ============================================
// DISPATCH NG - TypeScript Type Definitions
// ============================================

// User Types
export type UserType = 'customer' | 'rider' | 'admin';

export interface Profile {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  avatar_url: string | null;
  user_type: UserType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  role?: string | null;
  verification_status?: VerificationStatus | null;
}

// KYC Types
export type DocumentType = 'nin' | 'drivers_license' | 'passport' | 'voters_card' | 'cac';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export interface KycRecord {
  id: string;
  profile_id: string;
  document_type: DocumentType;
  document_number: string | null;
  document_image_url: string | null;
  selfie_image_url: string | null;
  verification_status: VerificationStatus;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

// Rider Types
export type VehicleType = 'motorcycle' | 'bicycle' | 'car' | 'van' | 'truck';
export type RiderVerificationStatus = 'pending' | 'verified' | 'suspended' | 'rejected';

export interface RiderProfile {
  id: string;
  profile_id: string;
  company_name: string | null;
  vehicle_type: VehicleType;
  vehicle_plate: string | null;
  vehicle_color: string | null;
  license_number: string | null;
  is_online: boolean;
  is_available: boolean;
  current_location: GeoLocation | null;
  service_radius_km: number;
  total_deliveries: number;
  rating_average: number;
  total_earnings: number;
  verification_status: RiderVerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface AvailableRider {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  company_name: string | null;
  vehicle_type: VehicleType;
  vehicle_color: string | null;
  rating_average: number;
  total_deliveries: number;
  lat: number;
  lng: number;
  service_radius_km: number;
}

// Bank Account
export interface BankAccount {
  id: string;
  profile_id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  bank_code: string | null;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Wallet Types
export interface Wallet {
  id: string;
  profile_id: string;
  available_balance: number;
  held_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 
  | 'deposit' 
  | 'withdrawal' 
  | 'escrow_lock' 
  | 'escrow_release' 
  | 'escrow_refund' 
  | 'platform_fee' 
  | 'adjustment' 
  | 'dispute_hold' 
  | 'dispute_release';

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  transaction_type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_id: string | null;
  reference_type: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  created_by: string | null;
}

// Withdrawal Types
export type WithdrawalStatus = 'pending' | 'approved' | 'processing' | 'paid' | 'failed' | 'rejected';

export interface WithdrawalRequest {
  id: string;
  profile_id: string;
  wallet_id: string;
  bank_account_id: string;
  amount: number;
  status: WithdrawalStatus;
  processed_at: string | null;
  processed_by: string | null;
  rejection_reason: string | null;
  transaction_reference: string | null;
  created_at: string;
  updated_at: string;
}

// Dispatch Job Types
export type JobStatus = 
  | 'draft'
  | 'awaiting_rider'
  | 'awaiting_funding'
  | 'funded'
  | 'in_progress'
  | 'rider_marked_complete'
  | 'customer_marked_complete'
  | 'completed'
  | 'disputed'
  | 'cancelled'
  | 'refunded';

export interface DispatchJob {
  id: string;
  job_number: string;
  customer_id: string;
  rider_id: string | null;
  
  // Pickup
  pickup_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  pickup_contact_name: string | null;
  pickup_contact_phone: string | null;
  pickup_notes: string | null;
  
  // Delivery
  delivery_address: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  delivery_contact_name: string | null;
  delivery_contact_phone: string | null;
  delivery_notes: string | null;
  
  // Package
  package_description: string | null;
  package_weight_kg: number | null;
  package_value: number | null;
  
  // Financial
  agreed_amount: number;
  platform_fee: number;
  rider_earnings: number;
  
  // Status
  status: JobStatus;
  
  // Timestamps
  created_at: string;
  rider_assigned_at: string | null;
  funded_at: string | null;
  started_at: string | null;
  rider_completed_at: string | null;
  customer_completed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  
  // OTP
  delivery_otp: string | null;
  otp_verified: boolean;
  
  updated_at: string;
}

export interface JobDetails extends DispatchJob {
  customer_name: string;
  customer_phone: string | null;
  customer_avatar: string | null;
  rider_name: string | null;
  rider_phone: string | null;
  rider_avatar: string | null;
  rider_rating: number | null;
  escrow_status: EscrowStatus | null;
  locked_amount: number | null;
  escrow_released_at: string | null;
}

// Escrow Types
export type EscrowStatus = 'not_created' | 'locked' | 'partially_released' | 'released' | 'refunded' | 'under_review';

export interface EscrowRecord {
  id: string;
  dispatch_job_id: string;
  customer_wallet_id: string;
  rider_wallet_id: string | null;
  locked_amount: number;
  platform_fee: number;
  status: EscrowStatus;
  locked_at: string;
  released_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
}

// Job Status History
export interface JobStatusHistory {
  id: string;
  dispatch_job_id: string;
  status_from: string | null;
  status_to: string;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

// Delivery Proof Types
export type ProofType = 'photo' | 'signature' | 'otp' | 'note' | 'receipt';

export interface DeliveryProof {
  id: string;
  dispatch_job_id: string;
  proof_type: ProofType;
  image_url: string | null;
  signature_data: string | null;
  notes: string | null;
  uploaded_by: string;
  created_at: string;
}

// Dispute Types
export type DisputeType = 'not_delivered' | 'damaged' | 'wrong_item' | 'rider_no_show' | 'customer_no_show' | 'payment_issue' | 'other';
export type DisputeStatus = 'open' | 'under_review' | 'resolved_customer_favor' | 'resolved_rider_favor' | 'resolved_split' | 'closed';

export interface Dispute {
  id: string;
  dispatch_job_id: string;
  raised_by: string;
  dispute_type: DisputeType;
  description: string;
  status: DisputeStatus;
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  refund_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface DisputeEvidence {
  id: string;
  dispute_id: string;
  uploaded_by: string;
  evidence_type: 'image' | 'document' | 'chat' | 'other';
  file_url: string | null;
  description: string | null;
  created_at: string;
}

// Rating Types
export interface Rating {
  id: string;
  dispatch_job_id: string;
  rider_id: string;
  customer_id: string;
  rating: number;
  review: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

// Notification Types
export type NotificationType = 
  | 'job_assigned' 
  | 'job_funded' 
  | 'job_started' 
  | 'job_completed' 
  | 'payment_received' 
  | 'withdrawal_processed' 
  | 'kyc_status' 
  | 'dispute_opened' 
  | 'system';

export interface Notification {
  id: string;
  profile_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

// Admin Types
export interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_table: string | null;
  target_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
}

export interface PlatformSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

// UI/UX Types
export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  user_type: 'customer' | 'rider';
}

export interface CreateJobFormData {
  pickup_address: string;
  pickup_contact_name: string;
  pickup_contact_phone: string;
  pickup_notes: string;
  delivery_address: string;
  delivery_contact_name: string;
  delivery_contact_phone: string;
  delivery_notes: string;
  package_description: string;
  package_weight_kg: number;
  agreed_amount: number;
}

export interface RiderOnboardingData {
  company_name: string;
  vehicle_type: VehicleType;
  vehicle_plate: string;
  vehicle_color: string;
  license_number: string;
  service_radius_km: number;
}

// Stats Types
export interface RiderStats {
  total_deliveries: number;
  completed_deliveries: number;
  cancelled_deliveries: number;
  total_earnings: number;
  rating_average: number;
  pending_withdrawals: number;
}

export interface AdminStats {
  total_users: number;
  total_riders: number;
  total_jobs: number;
  pending_verifications: number;
  open_disputes: number;
  platform_revenue: number;
}
