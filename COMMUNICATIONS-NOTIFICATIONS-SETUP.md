# RiderGrid communications update

## SQL
Run `ridergrid-communications-patch.sql` after the ticketing and delivery-proof patches.

## Resend email Edge Function
Deploy `supabase/functions/send-notification-email` as `send-notification-email`.
Set Edge Function secrets:
- `RESEND_API_KEY` = your Resend API key
- `RESEND_FROM_EMAIL` = a verified sender, e.g. `RiderGrid <notifications@yourdomain.com>`
- `APP_URL` = your production RiderGrid URL (no trailing slash)
- `EMAIL_WEBHOOK_SECRET` = a long random secret you choose
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are normally available to Supabase Edge Functions; add them if your project does not expose them.

Deploy with `supabase functions deploy send-notification-email --no-verify-jwt`.

In Supabase Dashboard -> Database -> Webhooks, create an HTTP webhook:
- Table: `notifications`
- Event: INSERT
- Method: POST
- URL: your deployed `send-notification-email` function URL
- Header: `x-ridergrid-webhook-secret` = the exact `EMAIL_WEBHOOK_SECRET` value

This makes the database notification the source of truth: the bell receives it in realtime and the webhook sends the corresponding email.

## Chat
`delivery_messages` is limited by RLS to the customer and selected rider on that delivery (admins can read for support/audit). Messages cannot be edited/deleted through client policies. Each new message creates an in-app/email notification for the other participant.
