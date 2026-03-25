# Dispatch NG

A full-stack escrow-based logistics marketplace built for the Nigerian market. Connect customers with verified dispatch riders for secure package deliveries.

![Dispatch NG](https://img.shields.io/badge/Dispatch-NG-purple)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)

## Features

### For Customers
- **Browse Riders** - Discover verified dispatch riders near you with ratings and reviews
- **Create Deliveries** - Post delivery jobs with pickup/delivery details
- **Secure Payments** - Fund wallet and lock money in escrow until delivery is complete
- **Track Deliveries** - Real-time status updates and delivery tracking
- **Rate & Review** - Share feedback after completed deliveries

### For Riders
- **Accept Jobs** - Browse and accept available delivery requests
- **Go Online/Offline** - Control your availability status
- **Earn Money** - Receive payments directly to your wallet after delivery
- **Build Reputation** - Collect ratings and reviews from customers
- **Withdraw Earnings** - Transfer earnings to your bank account

### For Admins
- **Verify Riders** - Review and approve rider applications
- **Monitor Jobs** - Track all deliveries and their statuses
- **Handle Disputes** - Resolve conflicts between customers and riders
- **Platform Settings** - Configure fees and platform policies

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Icons**: Lucide React

## Project Structure

```
src/
├── components/
│   ├── layout/          # Layout components (MainLayout, RiderLayout, AdminLayout)
│   ├── ui/              # shadcn/ui components
│   └── ui-custom/       # Custom UI components
├── pages/
│   ├── auth/            # Login, Signup, Onboarding
│   ├── customer/        # Customer-facing pages
│   ├── rider/           # Rider portal pages
│   └── admin/           # Admin dashboard pages
├── lib/
│   ├── supabase.ts      # Supabase client and helpers
│   └── utils.ts         # Utility functions
├── stores/
│   ├── authStore.ts     # Authentication state
│   ├── jobStore.ts      # Job/delivery state
│   ├── notificationStore.ts
│   └── uiStore.ts       # UI state (toasts, modals)
├── types/
│   ├── index.ts         # TypeScript types
│   └── database.ts      # Supabase database types
└── utils/
    └── format.ts        # Formatting utilities
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier works)
- Paystack account (for payments)

### 1. Clone and Install

```bash
git clone <repository-url>
cd dispatch-ng
npm install
```

### 2. Environment Setup

Copy `.env` to `.env.local` and fill in your values:

```bash
cp .env .env.local
```

Required environment variables:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Paystack (for payments)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_key

# Platform
VITE_PLATFORM_FEE=200
VITE_APP_NAME=Dispatch NG
```

### 3. Database Setup

1. Create a new Supabase project
2. Go to the SQL Editor
3. Copy the contents of `supabase-schema.sql`
4. Run the SQL to create all tables, indexes, and triggers

### 4. Storage Buckets

Create these storage buckets in Supabase:
- `profiles` - For user profile pictures
- `delivery-proofs` - For delivery proof photos
- `kyc-documents` - For KYC document uploads

Set appropriate RLS policies for each bucket.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 6. Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Database Schema

### Core Tables

- **profiles** - User profiles (extends auth.users)
- **kyc_records** - Identity verification documents
- **rider_profiles** - Rider-specific information
- **wallets** - User wallets with balance tracking
- **wallet_transactions** - Immutable transaction ledger
- **dispatch_jobs** - Delivery jobs/requests
- **escrow_records** - Escrow/locked funds tracking
- **delivery_proofs** - Proof of delivery uploads
- **ratings** - Customer ratings for riders
- **disputes** - Dispute records
- **notifications** - User notifications

### Key Features

- **Row Level Security (RLS)** - Users can only access their own data
- **Triggers** - Auto-generate job numbers, update timestamps, log status changes
- **Views** - Pre-joined views for common queries (available_riders, job_details)
- **Geospatial** - PostGIS extension for location-based queries

## Payment Flow

1. **Customer funds wallet** via Paystack/Flutterwave
2. **Customer creates delivery** and agrees on price
3. **Funds are locked in escrow** when rider accepts
4. **Rider delivers package** and marks complete
5. **Customer confirms delivery**
6. **Funds released to rider wallet** (minus platform fee)
7. **Rider can withdraw** to bank account

## User Roles

### Customer
- Can create delivery jobs
- Can browse and contact riders
- Can fund wallet and make payments
- Can rate and review riders

### Rider
- Can accept delivery jobs
- Can go online/offline
- Can mark deliveries complete
- Can withdraw earnings

### Admin
- Can verify/reject rider applications
- Can view all jobs and users
- Can resolve disputes
- Can configure platform settings

## API Integration

### Supabase
All database operations go through Supabase client with RLS policies.

### Paystack (Recommended)
For payment processing in Nigeria:
- Initialize transactions
- Verify payments
- Handle webhooks

### Google Maps (Optional)
For address autocomplete and distance calculation.

## Security Considerations

- All database access is protected by RLS policies
- Sensitive data (NIN, license numbers) should be encrypted
- File uploads are validated and scanned
- Rate limiting on authentication endpoints
- Input validation on all forms

## Customization

### Platform Fee
Edit `VITE_PLATFORM_FEE` in your `.env` file to change the fee per delivery.

### Minimum Funding
Edit the `min_wallet_funding` setting in `platform_settings` table.

### KYC Requirements
Toggle `require_customer_kyc` and `require_rider_kyc` in settings.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy

### Netlify

1. Build the project: `npm run build`
2. Deploy the `dist/` folder
3. Add environment variables in Netlify dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, email support@dispatchng.com or join our Slack channel.

---

Built with ❤️ for the Nigerian logistics market.
