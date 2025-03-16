import './globals.css'
import type { Metadata } from 'next'
import { AppProvider } from '../components/app-context'
import { BrandingProvider } from '../components/branding-context'

export const metadata: Metadata = {
  title: 'Road Assistance App',
  description: 'Digital roadside assistance with AI support',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <BrandingProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </BrandingProvider>
      </body>
    </html>
  )
}
