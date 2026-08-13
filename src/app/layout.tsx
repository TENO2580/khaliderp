import type { Metadata } from 'next';
import { Roboto, Inter, Open_Sans, Geist, Nunito } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { cn } from "@/lib/utils";

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  variable: '--font-roboto',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
});

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
});

export const metadata: Metadata = {
  title: 'Tripidio ERP — Cloud Manufacturing & Enterprise System',
  description: 'Enterprise Cloud ERP System for Lakshmi Candles',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tripidio',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: '#080810',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(roboto.variable, inter.variable, openSans.variable, geist.variable, nunito.variable, "font-sans")}>
      <body className={`font-sans antialiased bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
