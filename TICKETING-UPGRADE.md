# RiderGrid Resolution Center upgrade

## Deployment order
1. Back up the Supabase database.
2. Run `ridergrid-ticketing-patch.sql` once in the Supabase SQL Editor.
3. Deploy the updated frontend source/build as normal.

## Implemented
- Customer Resolution Center at `/support`.
- Rider support cases at `/rider/support`.
- Admin Resolution Center at `/admin/disputes`.
- RGT ticket numbers, priorities, waiting states, threaded replies, internal admin notes, evidence attachments, assignment fields and resolution outcomes.
- Rider visibility is limited to cases on jobs assigned to that rider.
- Customer visibility is limited to their cases/jobs.
- Admin-only internal notes and case controls.
- Evidence storage bucket and RLS policies.
- Legacy dispute statuses are migrated to the new workflow.
- `refund_request` is accepted by the database.

## Financial handling
Resolution amounts/outcomes are recorded but this patch intentionally does not automatically move wallet/escrow funds. That prevents a support UI action from silently changing money while the existing payment workflow remains unchanged.

## Delivery photo proof
Riders must now upload 1–3 JPG/PNG/WEBP photos (maximum 8MB each) before an in-progress delivery can be marked complete. Files are stored in the private `delivery-proofs` Supabase Storage bucket. Customers receive short-lived signed URLs on the delivery page, and admins can review the same proof directly in Resolution Center cases. Riders have no update/delete storage policy after submission.

Run `ridergrid-delivery-proof-patch.sql` after the ticketing migration. The patch can create/configure the private bucket automatically; alternatively create a private bucket named exactly `delivery-proofs` before running it.
