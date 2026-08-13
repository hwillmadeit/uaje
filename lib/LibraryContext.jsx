"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { formatDate } from "./formatDate";
import { bookAdapters } from "./bookAdapters";

const LibraryContext = createContext(null);

export function LibraryProvider({ children }) {
  const [books, setBooks] = useState([]);
  const [sessionsByBook, setSessionsByBook] = useState({});
  const [recordsByBook, setRecordsByBook] = useState({});
  const [weeklyBookIds, setWeeklyBookIds] = useState([]);
  const [weekLabel, setWeekLabel] = useState("");
  const [newIds, setNewIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: bookRows, error: bookErr }, { data: sessionRows, error: sessErr }, { data: recordRows, error: recErr }, { data: curationRows, error: curErr }] =
        await Promise.all([
          supabase.from("books").select("*").order("id"),
          supabase.from("reading_sessions").select("*").order("book_id").order("read_number"),
          supabase.from("records").select("*").order("book_id").order("created_at"),
          supabase.from("weekly_curations").select("id, week_start, week_end, weekly_curation_books(book_id, order)").order("week_start", { ascending: false }).limit(1),
        ]);
      if (bookErr) throw bookErr;
      if (sessErr) throw sessErr;
      if (recErr) throw recErr;
      if (curErr) throw curErr;

      const sBy = {};
      (sessionRows || []).forEach((s) => {
        sBy[s.book_id] = sBy[s.book_id] || [];
        sBy[s.book_id].push({ id: s.id, date: formatDate(s.read_date), number: s.read_number });
      });

      const rBy = {};
      (recordRows || []).forEach((r) => {
        rBy[r.book_id] = rBy[r.book_id] || [];
        rBy[r.book_id].push({
          id: r.id,
          bookId: r.book_id,
          sessionId: r.reading_session_id,
          type: r.type,
          content: r.content,
          imageUrl: r.image_url,
          date: formatDate(r.created_at),
        });
      });

      const curation = curationRows?.[0];
      const weekly = curation?.weekly_curation_books
        ? [...curation.weekly_curation_books].sort((a, b) => a.order - b.order).map((w) => w.book_id)
        : [];

      setBooks(bookRows || []);
      setSessionsByBook(sBy);
      setRecordsByBook(rBy);
      setWeeklyBookIds(weekly);
      setWeekLabel(curation ? `${formatDate(curation.week_start)} — ${formatDate(curation.week_end)}` : "");
    } catch (e) {
      setError(e.message || String(e));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sessionsOf = useCallback((bookId) => sessionsByBook[bookId] || [], [sessionsByBook]);
  const recordsOf = useCallback((bookId) => recordsByBook[bookId] || [], [recordsByBook]);

  // Used by AddBookFlow's "N권 추가하기" — persists via /api/books/add, then
  // folds the (real, DB-assigned) result into local state.
  const addResolvedBooks = useCallback(async (confirmedItems) => {
    const { newBooks, newSessions, linkedExistingIds } = await bookAdapters.saveBooks(confirmedItems);

    if (newBooks?.length) {
      setBooks((prev) => [...prev, ...newBooks]);
      setNewIds((prev) => {
        const next = new Set(prev);
        newBooks.forEach((b) => next.add(b.id));
        return next;
      });
    }
    if (newSessions?.length) {
      setSessionsByBook((prev) => {
        const next = { ...prev };
        newSessions.forEach((s) => {
          next[s.book_id] = [...(next[s.book_id] || []), { id: s.id, date: formatDate(s.read_date), number: s.read_number }];
        });
        return next;
      });
    }
    const allIds = [...(newBooks || []).map((b) => b.id), ...(linkedExistingIds || [])];
    setWeeklyBookIds((prev) => Array.from(new Set([...prev, ...allIds])));

    return { addedCount: (newBooks?.length || 0) + (linkedExistingIds?.length || 0), newIds: (newBooks || []).map((b) => b.id) };
  }, []);

  const addRecord = useCallback(async ({ bookId, sessionId, type, content }) => {
    const { record } = await bookAdapters.addRecord({ bookId, sessionId, type, content });
    setRecordsByBook((prev) => ({
      ...prev,
      [bookId]: [
        ...(prev[bookId] || []),
        { id: record.id, bookId: record.book_id, sessionId: record.reading_session_id, type: record.type, content: record.content, date: formatDate(record.created_at) },
      ],
    }));
    return record;
  }, []);

  const addReadingDate = useCallback(async (bookId) => {
    const { session } = await bookAdapters.addReadingSession(bookId);
    setSessionsByBook((prev) => ({
      ...prev,
      [bookId]: [...(prev[bookId] || []), { id: session.id, date: formatDate(session.read_date), number: session.read_number }],
    }));
    return session;
  }, []);

  const updateBook = useCallback(async (bookId, { title, author }) => {
    const { book } = await bookAdapters.updateBook(bookId, { title, author });
    setBooks((prev) => prev.map((b) => (b.id === bookId ? { ...b, title: book.title, author: book.author } : b)));
    return book;
  }, []);

  const deleteBook = useCallback(async (bookId) => {
    await bookAdapters.deleteBook(bookId);
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    setWeeklyBookIds((prev) => prev.filter((id) => id !== bookId));
    setSessionsByBook((prev) => {
      const next = { ...prev };
      delete next[bookId];
      return next;
    });
    setRecordsByBook((prev) => {
      const next = { ...prev };
      delete next[bookId];
      return next;
    });
  }, []);

  const value = {
    books,
    weeklyBookIds,
    weekLabel,
    newIds,
    loading,
    error,
    sessionsOf,
    recordsOf,
    addResolvedBooks,
    addRecord,
    addReadingDate,
    updateBook,
    deleteBook,
    reload: load,
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used inside <LibraryProvider>");
  return ctx;
}
