'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Home, Settings, LayoutDashboard } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'Dashboard',
      icon: Home,
      active: pathname === '/'
    },
    {
      href: '/invoices',
      label: 'Invoices',
      icon: FileText,
      active: pathname === '/invoices' || pathname?.startsWith('/invoices/')
    },
    {
      href: '/integrations',
      label: 'Integrations',
      icon: Settings,
      active: pathname === '/integrations'
    }
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <LayoutDashboard className="w-8 h-8 text-blue-500" />
              <span className="text-white font-bold text-xl">InvoiceAI</span>
            </Link>
          </div>

          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    item.active
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-gray-400 text-sm">
              <span className="hidden sm:inline">Automated Invoice Processing</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
export default Navbar;
