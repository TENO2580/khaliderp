import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { cn } from "@/lib/utils";

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'Tripidio ERP — Cloud Manufacturing & Enterprise System',
  description: 'Enterprise Cloud ERP System for Lakshmi Candles',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(roboto.variable, "font-sans")}>
      <body className={`font-sans antialiased bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
