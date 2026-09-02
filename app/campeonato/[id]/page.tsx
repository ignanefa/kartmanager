import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Fechas' }

function formatDate(d: string) {
  const [y, m, day] = d.split('-')
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${parseInt(day)} ${meses[parseInt(m) - 1]} ${y}`
}

export default async function CampeonatoPublicPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: fechas } = await supabase
    .from('fecha')
    .select('id, numero, nombre, circuito, fecha_desde, fecha_hasta, publicada')
    .eq('campeonato_id', id)
    .eq('publicada', true)
    .order('numero')

  const today = new Date().toISOString().slice(0, 10)
  const proximaIdx = (fechas ?? []).findIndex((f) => (f.fecha_hasta ?? f.fecha_desde) >= today)
  const proxima = proximaIdx >= 0 ? fechas?.[proximaIdx] : null

  return (
    <div>
      {/* Hero: próxima fecha */}
      {proxima && (
        <Link
          href={`/campeonato/${id}/fechas/${proxima.id}`}
          className="block mb-6 rounded-xl bg-gray-900 px-5 py-5 text-white hover:bg-gray-800 transition-colors"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Próxima fecha
          </p>
          <p className="mt-1 text-xl font-bold">
            Fecha {proxima.numero}
            {proxima.nombre ? ` — ${proxima.nombre}` : ''}
          </p>
          <p className="mt-0.5 text-sm text-gray-300">
            {proxima.circuito}
            {' · '}
            {formatDate(proxima.fecha_desde)}
            {proxima.fecha_hasta && proxima.fecha_hasta !== proxima.fecha_desde
              ? ` – ${formatDate(proxima.fecha_hasta)}`
              : ''}
          </p>
          <p className="mt-3 text-sm font-medium text-gray-400">Ver detalles →</p>
        </Link>
      )}

      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Calendario
        </h2>
        {fechas && fechas.length > 0 && (
          <span className="text-xs text-gray-400">
            {fechas.filter((f) => (f.fecha_hasta ?? f.fecha_desde) < today).length} de {fechas.length} completadas
          </span>
        )}
      </div>

      {(!fechas || fechas.length === 0) && (
        <div className="rounded-lg bg-white px-5 py-8 ring-1 ring-gray-200 text-center">
          <p className="text-sm font-medium text-gray-500">Todavía no hay fechas publicadas.</p>
          <p className="mt-1 text-xs text-gray-400">El calendario se irá publicando a medida que se confirmen las fechas.</p>
        </div>
      )}

      <div className="space-y-2">
        {fechas?.map((f, idx) => {
          const isPast = (f.fecha_hasta ?? f.fecha_desde) < today
          const isProxima = idx === proximaIdx
          if (isProxima) return null // ya la mostramos arriba como hero
          return (
            <Link
              key={f.id}
              href={`/campeonato/${id}/fechas/${f.id}`}
              className={`block rounded-lg px-4 py-3.5 ring-1 transition-all ${
                isPast
                  ? 'bg-white ring-gray-150 hover:ring-gray-300 opacity-60'
                  : 'bg-white ring-gray-200 hover:ring-gray-400'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className={`font-medium ${isPast ? 'text-gray-500' : 'text-gray-900'}`}>
                    Fecha {f.numero}
                    {f.nombre ? ` — ${f.nombre}` : ''}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-400">{f.circuito}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">
                    {formatDate(f.fecha_desde)}
                    {f.fecha_hasta && f.fecha_hasta !== f.fecha_desde
                      ? ` – ${formatDate(f.fecha_hasta)}`
                      : ''}
                  </p>
                  {isPast && (
                    <span className="text-xs rounded-full bg-gray-100 text-gray-400 px-2 py-0.5 font-medium">
                      Finalizada
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
