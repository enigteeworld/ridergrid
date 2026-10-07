# Dispatch NG — KYC and verification setup

1. Run `ridergrid-kyc-verification-settings-patch.sql` in Supabase SQL Editor.
2. Customer and rider KYC is available from their Profile pages. Documents are stored in the private `kyc-documents` bucket.
3. Admin > Verifications now reviews both customer and rider submissions. Approve/reject updates the KYC record, profile verification status, rider verification status where applicable, and creates an in-app notification.
4. Admin > Settings contains Email verification and Phone verification toggles. Both SQL defaults are OFF.
5. Email verification is wired through `send-email-verification` and `verify-account-code`. Before enabling it, deploy both Edge Functions and set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` secrets. The sender/domain must be verified in Resend.
6. Phone verification is deliberately OFF and provider-neutral. The database/status/UI wiring is present so a Vonage or Twilio send/verify function can be connected later without changing the account model.
7. The mobile customer/rider/admin drawers now sit above the bottom navigation and pin Sign Out to the drawer footer.
