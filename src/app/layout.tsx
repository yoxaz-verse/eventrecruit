import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EventRecruit",
  description: "Event services and expo recruitment marketplace for exhibitors, agencies, and verified event talent.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
