import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDF parsing libraries need to be externalized for Vercel serverless
  // These packages use Node.js-specific features (fs, path, etc.) that don't bundle well
  // See: https://github.com/vercel/community/discussions/5278
  serverExternalPackages: [
    'pdf-parse',
    'unpdf',
    'pdfjs-dist',
    'pdf2json',
    'mammoth',  // Word doc parsing
  ],
};

export default nextConfig;
