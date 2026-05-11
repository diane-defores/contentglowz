import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FLUX.2 Playground - Powered by Vercel AI Gateway",
  description:
    "Generate stunning images with FLUX.2 [pro] by Black Forest Labs. A playground for exploring state-of-the-art image generation powered by Vercel AI Gateway.",
  generator: "v0.app",
  openGraph: {
    title: "FLUX.2 Playground",
    description: "Generate stunning images with FLUX.2 [pro] by Black Forest Labs. Powered by Vercel AI Gateway.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FLUX.2 Playground - AI Image Generation",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FLUX.2 Playground",
    description: "Generate stunning images with FLUX.2 [pro] by Black Forest Labs. Powered by Vercel AI Gateway.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
