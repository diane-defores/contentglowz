import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "v0 Theme Song Generator",
  description:
    "Generate AI-powered theme songs with ElevenLabs Music API. Create custom compositions with advanced controls and composition planning.",
  generator: "v0.app",
  keywords: ["AI music", "theme song", "ElevenLabs", "music generation", "composition"],
  authors: [{ name: "v0" }],
  openGraph: {
    title: "v0 Theme Song Generator",
    description: "Generate AI-powered theme songs with ElevenLabs Music API",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
