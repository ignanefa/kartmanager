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

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Calendario de fechas</h2>

      {(!fechas || fechas.length === 0) && (
        <p className="mt-6 text-sm text-gray-400">
          Todavía no hay fechas publicadas para este campeonato.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {fechas?.map((f) => (
          <Link
            key={f.id}
            href={`/campeonato/${id}/fechas/${f.id}`}
            className="block rounded-lg bg-white px-5 py-4 ring-1 ring-gray-200 hover:ring-blue-400 transition-all"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900">
                  Fecha {f.numero}
                  {f.nombre ? ` — ${f.nombre}` : ''}
                </p>
                <p className="mt-0.5 text-sm text-gray-500">{f.circuito}</p>
              </div>
              <p className="text-sm font-medium text-gray-700">
                {formatDate(f.fecha_desde)}
                {f.fecha_hasta && f.fecha_hasta !== f.fecha_desde
                  ? ` – ${formatDate(f.fecha_hasta)}`
                  : ''}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
