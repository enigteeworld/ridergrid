# Dispatch NG — Paystack funding rollback + public updates

## Included
- Original Paystack webhook, wallet funding verification, and funding initialization functions restored **byte-for-byte** from `ridergrid-logo-header-enlarged.zip`.
- Public pages, navigation and rider Sign Out positioning from the later update retained.
- Admin reconciliation page retained as **READ-ONLY**: verifies a reference against Paystack and inspects matching wallet ledger entries. No automatic wallet credits or refunds.
- Removed the experimental financial SQL patch and shared crediting helper.

## Deploy
1. **Do not run** `dispatch-ng-financial-safety-patch.sql` from the earlier archive. This archive does not include it.
2. If you have not deployed the previous financial changes, there is **no need** to redeploy the working Paystack functions. Upload/build only this frontend, and optionally deploy `admin-reconcile-paystack`.
3. If you already deployed the previous financial Edge Functions, redeploy the restored `paystack-webhook` and `paystack-verify-wallet-funding` from this archive. Do not attempt to reverse any SQL migration blindly; first inspect the deployed schema and data.
4. For the read-only reconciliation tool deploy `admin-reconcile-paystack`, keeping JWT verification enabled. It requires `PAYSTACK_SECRET_KEY` and the standard Supabase secrets.
5. Build the frontend with `npm install` and `npm run build`; upload `dist` as usual.
6. Confirm Paystack test funding works and verify the public pages, rider profile ordering and admin reconciliation page.

## Cautions
- Restoring original funding functions preserves their original behavior and any original limitations; it is **not** a financial security certification.
- The read-only reconciliation result is not enough to safely authorize a manual wallet credit. The actual safe credit-recovery workflow still needs to be designed against the live database schema.
- No automatic bank payouts or dispute refunds were added.
- The Terms, Privacy and Cookies pages are drafts requiring review.
