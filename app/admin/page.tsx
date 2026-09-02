import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type PreinscripcionNueva = { fecha_id: string; fecha: { campeonato_id: string } }

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
      .select('fecha_id, fecha:fecha_id(campeonato_id)')
      .eq('estado', 'nuevo'),
  ])

  const nuevasPorCampeonato = ((nuevas ?? []) as unknown as PreinscripcionNueva[])
    .reduce<Record<string, { count: number; fechaIds: string[] }>>((acc, p) => {
      const cid = p.fecha?.campeonato_id
      if (cid) {
        if (!acc[cid]) acc[cid] = { count: 0, fechaIds: [] }
        acc[cid].count++
        if (p.fecha_id && !acc[cid].fechaIds.includes(p.fecha_id)) {
          acc[cid].fechaIds.push(p.fecha_id)
        }
      }
      return acc
    }, {})

  const activos = campeonatos?.filter((c) => c.activo) ?? []
  const inactivos = campeonatos?.filter((c) => !c.activo) ?? []

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel</h1>
          <p className="mt-1 text-sm text-gray-400">{user?.email}</p>
        </div>
        <Link
          href="/admin/campeonatos"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Todos los campeonatos
        </Link>
      </div>

      {(campeonatos?.length === 0) && (
        <div className="mt-8 rounded-xl bg-white px-5 py-8 ring-1 ring-gray-200 text-center">
          <p className="text-sm text-gray-500">No hay campeonatos configurados todavía.</p>
          <Link href="/admin/campeonatos" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
            Crear el primero →
          </Link>
        </div>
      )}

      {activos.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Activos
          </p>
          <div className="space-y-3">
            {activos.map((c) => {
              const nuevasData = nuevasPorCampeonato[c.id]
              const primeraFechaId = nuevasData?.fechaIds[0]
              return (
                <div key={c.id} className="rounded-xl bg-white px-5 py-4 ring-1 ring-gray-200">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{c.nombre} {c.anio}</p>
                      {nuevasData && nuevasData.count > 0 && primeraFechaId && (
                        <Link
                          href={`/admin/fechas/${primeraFechaId}/preinscripciones`}
                          className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-900"
                        >
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                          {nuevasData.count} preinscripción{nuevasData.count !== 1 ? 'es' : ''} nueva{nuevasData.count !== 1 ? 's' : ''}
                          {nuevasData.fechaIds.length > 1 ? ` (${nuevasData.fechaIds.length} fechas)` : ''}
                          {' →'}
                        </Link>
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
                        className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
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

      {inactivos.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Inactivos
          </p>
          <div className="space-y-2">
            {inactivos.map((c) => (
              <Link
                key={c.id}
                href={`/admin/campeonatos/${c.id}`}
                className="flex items-center justify-between rounded-xl bg-white px-5 py-3 ring-1 ring-gray-200 hover:ring-gray-300 transition-all"
              >
                <span className="text-sm text-gray-500">{c.nombre} {c.anio}</span>
                <span className="text-gray-300 text-xs">›</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
