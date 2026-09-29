'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { isActivePath, visibleNavItems } from '@/lib/navItems';
import { useRole } from '@/context/RoleContext';
import { BAR, MENU } from '@/lib/designSystem';

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { role, loading } = useRole();

  // ซ่อนเมนูที่บทบาทนี้ไม่มีสิทธิ์เข้าถึง (ระหว่างโหลดบทบาท แสดงเฉพาะเมนูที่ทุกบทบาทเข้าได้)
  const items = loading
    ? visibleNavItems('viewer')
    : visibleNavItems(role);

  return (
    <nav className={`w-full ${BAR.surface} ${BAR.line} ${BAR.shadow}`}>
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
                  className={`${MENU.shape} ${active ? MENU.active : MENU.inactive}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* ปุ่มเปิดเมนูสำหรับมือถือ */}
        <div className="flex md:hidden items-center justify-between py-2">
          <span className="text-xs font-bold uppercase tracking-wider text-navy-muted">
            เมนูระบบ
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'ปิดเมนู' : 'เปิดเมนู'}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-navy-raised border border-navy-outline text-navy-text text-sm font-semibold hover:bg-navy-outline transition-colors"
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
                    className={`${MENU.shapeMobile} ${
                      active
                        ? `${MENU.active} border border-brand-hover`
                        : 'bg-navy-raised border border-navy-outline text-navy-text hover:bg-navy-outline'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    <span
                      className={`text-[11px] font-normal ${
                        active ? MENU.hintActive : MENU.hintInactive
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
