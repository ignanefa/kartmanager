import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FlashMessage from '@/components/FlashMessage'

function formatDate(d: string) {
  const [y, m, day] = d.split('-')
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${parseInt(day)} ${meses[parseInt(m) - 1]} ${y}`
}

type PilotoRow = { nombre: string; apellido: string; numero: number }
type ResultadoRow = { posicion: number; piloto: PilotoRow }
type SesionRow = {
  id: string
  multiplicador: number
  planilla_url: string | null
  categoria: { nombre: string }
  tipo_carrera: { nombre: string }
  resultado: ResultadoRow[]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; fechaId: string }>
}): Promise<Metadata> {
  const { id, fechaId } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('fecha')
    .select('numero, nombre')
    .eq('id', fechaId)
    .eq('campeonato_id', id)
    .single()
  if (!data) return { title: 'Fecha' }
  return { title: `Fecha ${data.numero}${data.nombre ? ` — ${data.nombre}` : ''}` }
}

export default async function FechaPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; fechaId: string }>
  searchParams: Promise<{ inscripto?: string }>
}) {
  const { id, fechaId } = await params
  const { inscripto } = await searchParams
  const supabase = await createClient()

  const [{ data: fecha }, { data: sesiones }] = await Promise.all([
    supabase
      .from('fecha')
      .select('*')
      .eq('id', fechaId)
      .eq('campeonato_id', id)
      .eq('publicada', true)
      .single(),
    supabase
      .from('sesion')
      .select(
        'id, multiplicador, planilla_url, categoria:categoria_id(nombre), tipo_carrera:tipo_carrera_id(nombre), resultado(posicion, piloto:piloto_id(nombre, apellido, numero))'
      )
      .eq('fecha_id', fechaId)
      .order('orden'),
  ])

  if (!fecha) notFound()

  const sesionesTyped = (sesiones ?? []) as unknown as SesionRow[]
  const today = new Date().toISOString().slice(0, 10)
  const esFutura = (fecha.fecha_hasta ?? fecha.fecha_desde) >= today

  return (
    <div>
      <Link
        href={`/campeonato/${id}`}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← Fechas
      </Link>

      {/* Cabecera de la fecha */}
      <div className="mt-4">
        <h2 className="text-xl font-bold text-gray-900">
          Fecha {fecha.numero}
          {fecha.nombre ? ` — ${fecha.nombre}` : ''}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {fecha.circuito}
          {' · '}
          {formatDate(fecha.fecha_desde)}
          {fecha.fecha_hasta && fecha.fecha_hasta !== fecha.fecha_desde
            ? ` – ${formatDate(fecha.fecha_hasta)}`
            : ''}
        </p>
        {fecha.cronograma_url && (
          <a
            href={fecha.cronograma_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-blue-600 hover:underline"
          >
            Ver cronograma →
          </a>
        )}
      </div>

      {/* Banner: preinscripción enviada */}
      {inscripto === '1' && (
        <FlashMessage
          type="success"
          paramKey="inscripto"
          message="¡Preinscripción enviada! El organizador se pondrá en contacto para confirmar tu participación."
        />
      )}

      {/* CTA preinscripción — solo si la fecha es futura y no vienen del formulario */}
      {esFutura && inscripto !== '1' && (
        <div className="mt-5">
          <Link
            href={`/campeonato/${id}/fechas/${fechaId}/preinscribirse`}
            className="inline-block rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
          >
            Preinscribirse
          </Link>
        </div>
      )}

      {/* Sesiones y resultados */}
      {sesionesTyped.length === 0 ? (
        <div className="mt-8 rounded-xl bg-white px-5 py-6 ring-1 ring-gray-200 text-center">
          <p className="text-sm text-gray-400">Los resultados se publicarán al finalizar la fecha.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {sesionesTyped.map((s) => {
            const resultados = [...s.resultado].sort((a, b) => a.posicion - b.posicion)

            return (
              <div key={s.id}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {s.categoria.nombre}
                    <span className="mx-1.5 text-gray-300">·</span>
                    {s.tipo_carrera.nombre}
                  </h3>
                  {s.multiplicador !== 1 && (
                    <span className="text-xs rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 font-medium">
                      ×{s.multiplicador}
                    </span>
                  )}
                  {s.planilla_url && (
                    <a
                      href={s.planilla_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Planilla →
                    </a>
                  )}
                </div>

                <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-gray-200">
                  {resultados.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-gray-400">Sin resultados cargados aún.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-medium text-gray-500 w-10">Pos.</th>
                          <th className="px-4 py-2.5 text-left font-medium text-gray-500 w-12">N°</th>
                          <th className="px-4 py-2.5 text-left font-medium text-gray-500">Piloto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultados.map((r) => {
                          const medal = r.posicion === 1 ? '🥇' : r.posicion === 2 ? '🥈' : r.posicion === 3 ? '🥉' : null
                          return (
                            <tr
                              key={r.posicion}
                              className={`border-t border-gray-100 ${r.posicion <= 3 ? 'font-medium' : ''}`}
                            >
                              <td className="px-4 py-2.5 text-gray-500 text-sm">
                                {medal ?? r.posicion}
                              </td>
                              <td className="px-4 py-2.5 font-medium text-gray-900">
                                {r.piloto.numero}
                              </td>
                              <td className="px-4 py-2.5 text-gray-900">
                                {r.piloto.nombre} {r.piloto.apellido}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
