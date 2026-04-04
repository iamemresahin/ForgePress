import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ForgePress',
  description: 'Multi-site AI publishing engine for automated content operations.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
