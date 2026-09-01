import { createClient } from '@/lib/supabase/server'

export default async function PuntosPublicPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: tipos } = await supabase
    .from('tipo_carrera')
    .select('id, nombre, otorga_puntos')
    .eq('campeonato_id', id)
    .order('orden')
    .order('nombre')

  const puntosMap: Record<string, { posicion: number; puntos: number }[]> = {}

  if (tipos && tipos.length > 0) {
    const { data: puntos } = await supabase
      .from('punto_por_posicion')
      .select('tipo_carrera_id, posicion, puntos')
      .in(
        'tipo_carrera_id',
        tipos.map((t) => t.id)
      )
      .order('posicion')

    for (const p of puntos ?? []) {
      if (!puntosMap[p.tipo_carrera_id]) puntosMap[p.tipo_carrera_id] = []
      puntosMap[p.tipo_carrera_id].push({ posicion: p.posicion, puntos: p.puntos })
    }
  }

  if (!tipos || tipos.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900">Puntuación</h2>
        <p className="mt-4 text-sm text-gray-400">Sin información de puntuación disponible.</p>
      </div>
    )
  }

  const tiposConPuntos = tipos.filter((t) => t.otorga_puntos)
  const tiposSinPuntos = tipos.filter((t) => !t.otorga_puntos)

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Puntuación</h2>
      <p className="mt-1 text-sm text-gray-500">
        Tabla de puntos según posición de llegada.
      </p>

      <div className="mt-6 space-y-8">
        {tiposConPuntos.map((tipo) => {
          const rows = puntosMap[tipo.id] ?? []
          return (
            <div key={tipo.id}>
              <h3 className="text-base font-semibold text-gray-900">{tipo.nombre}</h3>
              <div className="mt-2 overflow-x-auto rounded-lg bg-white ring-1 ring-gray-200">
                {rows.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">Sin tabla de puntos cargada.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-600 w-24">Posición</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Puntos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.posicion} className="border-t border-gray-100">
                          <td className="px-4 py-2.5 text-gray-700">{r.posicion}°</td>
                          <td className="px-4 py-2.5 font-semibold text-gray-900">{r.puntos}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )
        })}

        {tiposSinPuntos.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-gray-900">Sin puntaje</h3>
            <p className="mt-1 text-sm text-gray-500">
              Las siguientes carreras no otorgan puntos al campeonato:{' '}
              {tiposSinPuntos.map((t) => t.nombre).join(', ')}.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
