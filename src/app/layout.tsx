import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { UsageProvider } from "@/lib/usage-context";
import { NotificationProvider, NotificationToastContainer } from "@/lib/notification-context";
import CookieConsent from "@/components/CookieConsent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Hyred - AI CV Screening for South African SMEs",
    template: "%s | Hyred",
  },
  description: "Screen CVs in seconds with explainable AI. Less noise. Better hires. Built for South African businesses with POPIA-compliant evidence-based decisions.",
  keywords: [
    "CV screening",
    "AI recruiting",
    "hiring",
    "SME",
    "South Africa",
    "talent acquisition",
    "recruitment software",
    "applicant tracking",
    "HR technology",
    "automated screening",
    "POPIA compliant",
    "explainable AI",
  ],
  authors: [{ name: "Hyred", url: "https://hireinbox.co.za" }],
  creator: "Hyred",
  publisher: "Hyred",
  metadataBase: new URL("https://hireinbox.co.za"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Hyred - AI CV Screening for South African SMEs",
    description: "Screen CVs in seconds with explainable AI. Less noise. Better hires. Built for South African businesses.",
    type: "website",
    locale: "en_ZA",
    siteName: "Hyred",
    url: "https://hireinbox.co.za",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Hyred - AI CV Screening",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hyred - AI CV Screening for South African SMEs",
    description: "Screen CVs in seconds with explainable AI. Less noise. Better hires.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add these when you have them
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#4f46e5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://hireinbox.co.za/#organization",
                  "name": "Hyred",
                  "url": "https://hireinbox.co.za",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://hireinbox.co.za/logo.png"
                  },
                  "description": "AI-powered CV screening platform for South African businesses",
                  "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Cape Town",
                    "addressCountry": "ZA"
                  },
                  "sameAs": []
                },
                {
                  "@type": "SoftwareApplication",
                  "@id": "https://hireinbox.co.za/#application",
                  "name": "Hyred",
                  "applicationCategory": "BusinessApplication",
                  "operatingSystem": "Web Browser",
                  "description": "AI CV Screening for South African SMEs - Screen CVs in seconds with explainable AI decisions",
                  "offers": {
                    "@type": "Offer",
                    "price": "1750",
                    "priceCurrency": "ZAR",
                    "priceValidUntil": "2026-12-31",
                    "description": "Per role pricing - unlimited CVs"
                  },
                  "provider": {
                    "@id": "https://hireinbox.co.za/#organization"
                  },
                  "featureList": [
                    "AI CV Screening",
                    "Evidence-based decisions",
                    "POPIA compliant",
                    "South African context",
                    "Unlimited CVs per role"
                  ]
                },
                {
                  "@type": "WebSite",
                  "@id": "https://hireinbox.co.za/#website",
                  "url": "https://hireinbox.co.za",
                  "name": "Hyred",
                  "publisher": {
                    "@id": "https://hireinbox.co.za/#organization"
                  },
                  "inLanguage": "en-ZA"
                }
              ]
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <UsageProvider>
            <NotificationProvider>
              {children}
              <NotificationToastContainer />
              <CookieConsent />
            </NotificationProvider>
          </UsageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
