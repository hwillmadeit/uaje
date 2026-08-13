// The production counterparts of the prototype's identifyBooksFromImageMock /
// searchBookMock / saveBooksMock. Same names, same shapes — AddBookFlow
// doesn't need to change at all.

function handleUnauthorized(res) {
  // Session cookie expired mid-use — send back to /login rather than
  // showing a confusing generic error.
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export async function identifyBooksFromImage(file) {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch("/api/books/identify", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) {
    handleUnauthorized(res);
    throw new Error(data?.error || "identify failed");
  }
  return data; // { detections } or { notConfigured: true, message }
}

export async function searchBook(query) {
  if (!query || !query.trim()) return [];
  const res = await fetch(`/api/books/search?q=${encodeURIComponent(query.trim())}`);
  if (!res.ok) {
    handleUnauthorized(res);
    throw new Error("search failed");
  }
  return res.json(); // Candidate[]
}

export async function saveBooks(confirmedItems) {
  const res = await fetch("/api/books/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: confirmedItems }),
  });
  const data = await res.json();
  if (!res.ok) {
    handleUnauthorized(res);
    throw new Error(data?.error || "save failed");
  }
  return data; // { newBooks, newSessions, linkedExistingIds }
}

export async function addRecord({ bookId, sessionId, type, content }) {
  const res = await fetch("/api/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookId, sessionId, type, content }),
  });
  const data = await res.json();
  if (!res.ok) {
    handleUnauthorized(res);
    throw new Error(data?.error || "add record failed");
  }
  return data; // { record }
}

export async function addReadingSession(bookId) {
  const res = await fetch("/api/reading-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookId }),
  });
  const data = await res.json();
  if (!res.ok) {
    handleUnauthorized(res);
    throw new Error(data?.error || "add reading session failed");
  }
  return data; // { session }
}

// Reads a single book cover photo: title, author, and a crop box (0..1
// normalized) marking where the cover sits in the frame.
export async function identifyCover(file) {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch("/api/books/cover", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) {
    handleUnauthorized(res);
    throw new Error(data?.error || "cover identify failed");
  }
  return data; // { title, author, box } or { notConfigured: true, message }
}

// Uploads an already-cropped cover image (a Blob from lib/cropImage.js) to
// Supabase Storage and returns its public URL.
export async function uploadCover(blob) {
  const form = new FormData();
  form.append("image", blob, "cover.jpg");
  const res = await fetch("/api/books/cover-upload", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) {
    handleUnauthorized(res);
    throw new Error(data?.error || "cover upload failed");
  }
  return data; // { url }
}

export const bookAdapters = { identifyBooksFromImage, searchBook, saveBooks, addRecord, addReadingSession, identifyCover, uploadCover };
