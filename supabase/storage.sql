-- Run once in the Supabase SQL editor. Creates a public bucket for cropped
-- book-cover images uploaded via /api/books/cover-upload.
--
-- "public: true" means anyone with the exact file URL can view the image —
-- there's no auth check on GET. That's an acceptable tradeoff here because
-- filenames are random (userid/timestamp-random.ext, not guessable) and
-- the images are just book cover photos, not sensitive content. If that
-- tradeoff doesn't sit right with you, switch to a private bucket and
-- generate short-lived signed URLs instead (supabase.storage.from(...)
-- .createSignedUrl()) when reading cover_image_url.

insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do nothing;

-- Uploads only ever happen through /api/books/cover-upload using the
-- service_role key (bypasses storage RLS), so no INSERT policy is needed
-- here — same pattern as the rest of this app's write routes.
