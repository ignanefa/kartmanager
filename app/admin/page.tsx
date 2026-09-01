import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Panel de administración</h1>
      <p className="mt-1 text-gray-500">PAKO 2026 · Karting SaaS MVP</p>

      <div className="mt-6 rounded-lg bg-white px-4 py-3 ring-1 ring-gray-200 text-sm">
        <span className="text-gray-500">Sesión activa: </span>
        <span className="font-medium text-gray-900">{user?.email}</span>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/campeonatos"
          className="rounded-lg bg-white px-5 py-4 ring-1 ring-gray-200 hover:ring-blue-400 transition-all"
        >
          <p className="font-semibold text-gray-900">Campeonatos</p>
          <p className="mt-1 text-sm text-gray-500">
            Campeonatos, categorías, tipos de carrera y esquemas de puntaje
          </p>
        </Link>
      </div>
    </div>
  )
}
