'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { isActivePath, navItemsForRole } from '@/lib/navItems';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { role } = useAuth();
  const [open, setOpen] = useState(false);

  // ซ่อนเมนูที่ผู้ใช้ไม่มีสิทธิ์เข้าถึง (เช่น /users สำหรับ Technician)
  const items = navItemsForRole(role);

  return (
    <nav className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md border-b border-slate-200 dark:border-blue-900/40 shadow-sm dark:shadow-lg dark:shadow-blue-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* เมนูหลัก (จอใหญ่) */}
        <ul className="hidden md:flex items-center gap-1 py-2 overflow-x-auto">
          {items.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                    active
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.35)]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* ปุ่มเปิดเมนูสำหรับมือถือ */}
        <div className="flex md:hidden items-center justify-between py-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            เมนูระบบ
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'ปิดเมนู' : 'เปิดเมนู'}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors"
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span>{open ? 'ปิด' : 'เมนู'}</span>
          </button>
        </div>

        {/* เมนูสำหรับมือถือ */}
        {open && (
          <ul className="md:hidden pb-3 space-y-1">
            {items.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.35)]'
                        : 'text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-white' : item.accent}`} />
                    <span className="flex-1">{item.label}</span>
                    <span
                      className={`text-[11px] font-normal ${
                        active ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {item.description}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </nav>
  );
}
