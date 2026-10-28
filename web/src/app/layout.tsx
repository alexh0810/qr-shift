import type { Metadata } from "next";
import localFont from "next/font/local";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  display: "swap",
  variable: "--font-body",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "QRShift",
  description: "QR-based time tracking for small businesses.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#2B59FF" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${geist.variable} ${geistMono.variable} font-body bg-background text-foreground antialiased`}
      >
        {children}
        <script
          dangerouslySetInnerHTML={{
             __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
