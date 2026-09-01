import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ClasificacionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const [{ data: campeonato }, { data: categorias }, { data: clasificacion }] = await Promise.all([
    supabase.from('campeonato').select('id, nombre, anio').eq('id', id).single(),
    supabase.from('categoria').select('id, nombre').eq('campeonato_id', id).order('orden').order('nombre'),
    supabase
      .from('vista_campeonato')
      .select('piloto_id, categoria_id, nombre, apellido, numero, total_puntos')
      .eq('campeonato_id', id),
  ])

  if (!campeonato) notFound()

  const pilotosPorCategoria = (categorias ?? []).map((cat) => {
    const pilotos = (clasificacion ?? [])
      .filter((p) => p.categoria_id === cat.id)
      .sort((a, b) => Number(b.total_puntos) - Number(a.total_puntos))
    return { categoria: cat, pilotos }
  })

  return (
    <div>
      <Link
        href={`/admin/campeonatos/${id}`}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← {campeonato.nombre}
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-gray-900">Clasificación</h1>
        <p className="mt-1 text-sm text-gray-500">
          {campeonato.nombre} {campeonato.anio} · Solo suma fechas publicadas.
        </p>
      </div>

      {pilotosPorCategoria.length === 0 && (
        <p className="mt-6 text-sm text-gray-400">No hay categorías configuradas.</p>
      )}

      <div className="mt-6 space-y-8">
        {pilotosPorCategoria.map(({ categoria, pilotos }) => (
          <div key={categoria.id}>
            <h2 className="text-lg font-semibold text-gray-900">{categoria.nombre}</h2>
            <div className="mt-2 overflow-x-auto rounded-lg bg-white ring-1 ring-gray-200">
              {pilotos.length === 0 ? (
                <p className="px-4 py-4 text-sm text-gray-400">Sin pilotos inscriptos.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 w-12">Pos.</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 w-14">N°</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Piloto</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600 w-24">Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pilotos.map((p, i) => (
                      <tr key={p.piloto_id} className="border-t border-gray-100">
                        <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{p.numero}</td>
                        <td className="px-4 py-2.5 text-gray-900">
                          {p.nombre} {p.apellido}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                          {Number(p.total_puntos)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
