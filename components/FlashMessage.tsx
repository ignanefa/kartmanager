'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function FlashMessage({
  type,
  message,
  paramKey = 'error',
}: {
  type: 'error' | 'success' | 'warning'
  message: string
  paramKey?: string
}) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Clear the flash param from URL without a page reload, using window.location.search
    // to avoid needing useSearchParams (which requires Suspense)
    const params = new URLSearchParams(window.location.search)
    params.delete(paramKey)
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(newUrl, { scroll: false })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const classes = {
    error: 'bg-red-50 text-red-700 ring-red-200',
    success: 'bg-green-50 text-green-700 ring-green-200',
    warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  }

  return (
    <div className={`mt-4 rounded-lg px-4 py-3 text-sm ring-1 ${classes[type]}`}>
      {message}
    </div>
  )
}
