// DB deletes (CASCADE) remove the rows, but never touch Storage — an
// uploaded cover or drawing left behind after its book/record is deleted
// stays sitting in the bucket, still reachable at its public URL forever.
// This is best-effort cleanup: failures are logged, never thrown, since a
// missing/already-gone file shouldn't block the actual delete the person
// asked for.

function parseStorageUrl(url) {
  if (!url) return null;
  const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!match) return null;
  return { bucket: match[1], path: match[2] };
}

export async function deleteStorageObjectFromUrl(supabase, url) {
  const parsed = parseStorageUrl(url);
  if (!parsed) return;
  try {
    await supabase.storage.from(parsed.bucket).remove([parsed.path]);
  } catch (e) {
    console.error("Storage cleanup failed for", url, e);
  }
}
