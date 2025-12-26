import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HireInbox - Less noise. Better hires.",
  description: "AI-powered CV screening for SMEs. Screen candidates in seconds, not hours.",
  keywords: ["CV screening", "AI recruiting", "hiring", "SME", "South Africa", "talent acquisition"],
  authors: [{ name: "HireInbox" }],
  creator: "HireInbox",
  openGraph: {
    title: "HireInbox - Less noise. Better hires.",
    description: "AI-powered CV screening for SMEs. Screen candidates in seconds, not hours.",
    type: "website",
    locale: "en_ZA",
    siteName: "HireInbox",
  },
  twitter: {
    card: "summary_large_image",
    title: "HireInbox - Less noise. Better hires.",
    description: "AI-powered CV screening for SMEs. Screen candidates in seconds, not hours.",
  },
  robots: {
    index: true,
    follow: true,
  },
  themeColor: "#4F46E5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
