'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, AlertCircle, Upload, Database } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/providers', label: 'Providers', icon: Users },
  { href: '/quality', label: 'Data Quality', icon: AlertCircle },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-100 tracking-tight">
              Doxy<span className="text-emerald-400">Metrics</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-emerald-500/20 text-emerald-300' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Upload Button */}
          <Link
            href="/?upload=true"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              bg-gradient-to-r from-emerald-500 to-teal-500 text-white
              hover:from-emerald-400 hover:to-teal-400 transition-all duration-200
              shadow-lg shadow-emerald-500/20"
          >
            <Upload className="w-4 h-4" />
            Upload Data
          </Link>
        </div>
      </div>
    </nav>
  );
}

