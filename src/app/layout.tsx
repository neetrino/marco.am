import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '../components/ClientProviders';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';
import { MobileBottomNav } from '../components/MobileBottomNav';

const inter = Inter({ subsets: ['latin'] });
const montserratArm = Montserrat({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-montserrat-arm',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Shop - Professional E-commerce',
  description: 'Modern e-commerce platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} ${montserratArm.variable} bg-gray-50 text-gray-900 antialiased min-h-full font-sans`}>
        <Suspense fallback={null}>
          <ClientProviders>
            <div className="flex min-h-screen flex-col pb-16 lg:pb-0">
              <Header />
              <Breadcrumb />
              <main className="flex-1 w-full">
                {children}
              </main>
              <Footer />
              <MobileBottomNav />
            </div>
          </ClientProviders>
        </Suspense>
      </body>
    </html>
  );
}

