'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { navItemsForRole } from '@/lib/navItems';
import { useAuth } from '@/context/AuthContext';

export default function ModuleGrid() {
  const { role } = useAuth();
  const items = navItemsForRole(role);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="group bg-white/80 dark:bg-[#111827]/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-lg hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 active:scale-[0.98]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className={`w-6 h-6 ${item.accent}`} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{item.label}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.description}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 shrink-0 text-slate-300 dark:text-slate-600 group-hover:translate-x-1 group-hover:text-blue-500 transition-all duration-300" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
