'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const links = [
  { href: '/', label: 'Orders', icon: '📋' },
  { href: '/inventory', label: 'Inventory', icon: '📦' },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="mt-2 px-2 space-y-0.5">
      {links.map(({ href, label, icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
              isActive
                ? 'bg-canals-accent-lighter text-canals-accent font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="text-gray-600">{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
