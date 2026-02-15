import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Invoice Automation - Manage Your Invoices',
  description: 'Automated invoice management system with OCR, PDF parsing, and email sending capabilities',
  keywords: ['invoice', 'automation', 'billing', 'OCR', 'PDF'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">
                    Invoice Automation
                  </h1>
                </div>
                <nav className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Dashboard
                  </span>
                </nav>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <p className="text-center text-sm text-gray-500">
                © {new Date().getFullYear()} Invoice Automation. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}