import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { PostHogProvider } from "@/components/PostHogProvider";
import {
  MAX_SPOT_PRICE_USD,
  MIN_SPOT_PRICE_USD,
  SPOT_COUNT,
  formatUsd,
} from "@/lib/spots";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spotBlurb = `${SPOT_COUNT} sticker spots on an iPhone 17 back from ${formatUsd(MIN_SPOT_PRICE_USD)} to ${formatUsd(MAX_SPOT_PRICE_USD)}. Claim a spot and your logo travels to cafés, coworking spaces and every build-in-public video.`;
const spotBlurbShort = `${SPOT_COUNT} sticker spots from ${formatUsd(MIN_SPOT_PRICE_USD)} to ${formatUsd(MAX_SPOT_PRICE_USD)}. Your logo travels with me.`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: `${siteConfig.name} - ${siteConfig.tagline}`,
  description: spotBlurb,
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: siteConfig.name,
    description: spotBlurbShort,
    url: siteConfig.siteUrl,
    siteName: siteConfig.name,
    locale: "en",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1672,
        height: 941,
        alt: `${siteConfig.name} - your brand on my iPhone`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: spotBlurbShort,
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
