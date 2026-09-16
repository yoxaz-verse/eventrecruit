import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const geist = localFont({
  src: "./fonts/geist-latin.woff2",
  display: "swap",
  variable: "--font-geist",
  weight: "100 900",
});

export const metadata: Metadata = {
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
      <body>{children}</body>
    </html>
  );
}
