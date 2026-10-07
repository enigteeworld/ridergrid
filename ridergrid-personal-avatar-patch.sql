-- Dispatch NG personal greeting avatars
-- Safe to run more than once.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS personal_avatar_key text;

COMMENT ON COLUMN public.profiles.personal_avatar_key IS
  'Key for the built-in illustrated/emoji greeting character. Separate from avatar_url/profile photo.';

-- Existing profile RLS/update rules continue to govern this field; no storage bucket is required.
