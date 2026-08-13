/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow real book-cover thumbnails once /api/books/search returns them
    // (e.g. Google Books' books.google.com content, or your own Supabase
    // Storage bucket's public host).
    remotePatterns: [
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
