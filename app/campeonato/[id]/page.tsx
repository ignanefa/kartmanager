import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Calendario de fechas</h2>

      {(!fechas || fechas.length === 0) && (
        <p className="mt-6 text-sm text-gray-400">
          Todavía no hay fechas publicadas para este campeonato.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {fechas?.map((f) => {
          const isPast = (f.fecha_hasta ?? f.fecha_desde) < today
          return (
            <Link
              key={f.id}
              href={`/campeonato/${id}/fechas/${f.id}`}
              className={`block rounded-lg px-5 py-4 ring-1 transition-all ${
                isPast
                  ? 'bg-gray-50 ring-gray-200 hover:ring-gray-300 opacity-70'
                  : 'bg-white ring-gray-200 hover:ring-blue-400'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className={`font-semibold ${isPast ? 'text-gray-500' : 'text-gray-900'}`}>
                    Fecha {f.numero}
                    {f.nombre ? ` — ${f.nombre}` : ''}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">{f.circuito}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-600">
                    {formatDate(f.fecha_desde)}
                    {f.fecha_hasta && f.fecha_hasta !== f.fecha_desde
                      ? ` – ${formatDate(f.fecha_hasta)}`
                      : ''}
                  </p>
                  {isPast && (
                    <span className="text-xs rounded-full bg-gray-100 text-gray-500 px-2 py-0.5 font-medium">
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
