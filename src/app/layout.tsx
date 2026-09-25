import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import { NavigationProgressBar } from "@/components/navigation-progress-bar";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";
import "./globals.css";

const geist = localFont({
  src: "./fonts/geist-latin.woff2",
  display: "swap",
  variable: "--font-geist",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "exporb | Verified event and retail talent across India",
    template: "%s | exporb",
  },
  description: "Find and coordinate verified talent for exhibitions, retail activations, product launches, roadshows, and brand campaigns across India.",
  applicationName: "exporb",
  keywords: ["event staffing India", "exhibition staff", "retail promoters", "brand activation talent"],
  openGraph: {
    title: "exporb | Verified event and retail talent across India",
    description: "Find and coordinate verified people for events, stores, launches, and activations across India.",
    siteName: "exporb",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "exporb | Verified event and retail talent across India",
    description: "Find and coordinate verified people for events, stores, launches, and activations across India.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8f7f2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geist.variable}>
      <body>
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        <WebVitalsReporter />
        {children}
      </body>
    </html>
  );
}
