import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from '../components/app-context'
import WebhookSync from '../components/webhook-sync'
import DevelopmentTools from '../components/development-tools'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Get application info from environment variables
const appName = process.env.NEXT_PUBLIC_APP_NAME || "RoadAssist App";
const appDescription = process.env.NEXT_PUBLIC_APP_DESCRIPTION || "BMW Digital Roadside Assistance";

export const metadata: Metadata = {
  title: appName,
  description: appDescription,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProvider>
          {children}
          <WebhookSync />
          <DevelopmentTools />
        </AppProvider>
      </body>
    </html>
  );
}
