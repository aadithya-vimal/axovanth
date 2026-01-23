import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider"; 
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

// 1. Force Edge Runtime for Cloudflare Pages
export const runtime = "edge";

// 2. Metadata
export const metadata: Metadata = {
  title: "Axovanth | Enterprise Operating System",
  description: "Advanced workspace management, ticketing, and asset control for modern enterprises.",
  keywords: ["enterprise", "workspace", "tickets", "kanban", "assets", "management", "saas"],
  openGraph: {
    title: "Axovanth OS",
    description: "The operating system for your organization.",
    url: "https://axovanth.com",
    siteName: "Axovanth",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Axovanth OS",
    description: "Streamline your enterprise operations.",
  },
};

// 3. Viewport
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.className} bg-background text-foreground antialiased overflow-x-hidden min-h-screen relative`}>
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}