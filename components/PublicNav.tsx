'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
}

export default function PublicNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  // The first item (Fechas) is the root — active when no other item matches.
  // Other items use prefix matching.
  const activeHref =
    items.slice(1).find((item) => pathname.startsWith(item.href))?.href ??
    items[0].href

  return (
    <nav className="flex overflow-x-auto scrollbar-hide gap-0.5 pb-px">
      {items.map(({ href, label }) => {
        const isActive = href === activeHref
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
