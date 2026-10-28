-- ============================================================================
-- QHRT — user avatars
--
-- One cropped photo per account. Stored as base64 so we do not need Storage
-- buckets. RLS keeps each row to its owner.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS before CREATE.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_avatars (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mime_type     TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  image_base64  TEXT NOT NULL CHECK (char_length(image_base64) <= 600000),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_avatars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own avatar" ON public.user_avatars;
CREATE POLICY "Users can view their own avatar"
  ON public.user_avatars FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own avatar" ON public.user_avatars;
CREATE POLICY "Users can insert their own avatar"
  ON public.user_avatars FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own avatar" ON public.user_avatars;
CREATE POLICY "Users can update their own avatar"
  ON public.user_avatars FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON public.user_avatars;
CREATE POLICY "Users can delete their own avatar"
  ON public.user_avatars FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_avatars TO authenticated;
GRANT ALL ON public.user_avatars TO service_role;
