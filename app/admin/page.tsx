import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()
  const [
    { data: { user } },
    { data: campeonatos },
    { data: nuevas },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('campeonato')
      .select('id, nombre, anio, activo')
      .order('anio', { ascending: false })
      .order('nombre')
      .limit(10),
    supabase
      .from('preinscripcion')
      .select('fecha:fecha_id(campeonato_id)')
      .eq('estado', 'nuevo'),
  ])

  const nuevasPorCampeonato = ((nuevas ?? []) as unknown as { fecha: { campeonato_id: string } }[])
    .reduce<Record<string, number>>((acc, p) => {
      const cid = p.fecha?.campeonato_id
      if (cid) acc[cid] = (acc[cid] ?? 0) + 1
      return acc
    }, {})

  const activos = campeonatos?.filter((c) => c.activo) ?? []

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de administración</h1>
          <p className="mt-1 text-sm text-gray-500">{user?.email}</p>
        </div>
        <Link
          href="/admin/campeonatos"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Todos los campeonatos
        </Link>
      </div>

      {activos.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Campeonatos activos</h2>
          <div className="mt-3 space-y-3">
            {activos.map((c) => {
              const nuevasCount = nuevasPorCampeonato[c.id] ?? 0
              return (
                <div key={c.id} className="rounded-lg bg-white px-5 py-4 ring-1 ring-gray-200">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-gray-900">{c.nombre} {c.anio}</p>
                      {nuevasCount > 0 && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          {nuevasCount} nuevas
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/campeonatos/${c.id}`}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Configuración
                      </Link>
                      <Link
                        href={`/admin/campeonatos/${c.id}/clasificacion`}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Clasificación
                      </Link>
                      <Link
                        href={`/campeonato/${c.id}`}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Ver portal →
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {(campeonatos?.length === 0) && (
        <div className="mt-8">
          <p className="text-sm text-gray-400">
            No hay campeonatos configurados todavía.{' '}
            <Link href="/admin/campeonatos" className="text-blue-600 hover:underline">
              Crear el primero →
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
