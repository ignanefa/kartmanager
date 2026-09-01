import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateSesion } from '../actions'
import ResultadosEditor from './ResultadosEditor'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('sesion')
    .select('categoria:categoria_id(nombre), tipo_carrera:tipo_carrera_id(nombre), fecha:fecha_id(numero, campeonato:campeonato_id(nombre, anio))')
    .eq('id', id)
    .single()
  if (!data) return { title: 'Sesión' }
  const cat = data.categoria as unknown as { nombre: string }
  const tipo = data.tipo_carrera as unknown as { nombre: string }
  const fecha = data.fecha as unknown as { numero: number; campeonato: { nombre: string; anio: number } }
  return { title: `${cat.nombre} · ${tipo.nombre} · Fecha ${fecha.numero} · ${fecha.campeonato.nombre} ${fecha.campeonato.anio}` }
}

export default async function SesionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const { data: sesion } = await supabase
    .from('sesion')
    .select(
      '*, fecha:fecha_id(id, numero, nombre, campeonato_id, campeonato:campeonato_id(id, nombre)), categoria:categoria_id(id, nombre), tipo_carrera:tipo_carrera_id(id, nombre)'
    )
    .eq('id', id)
    .single()

  if (!sesion) notFound()

  const fecha = sesion.fecha as {
    id: string
    numero: number
    nombre: string | null
    campeonato_id: string
    campeonato: { id: string; nombre: string }
  }
  const categoria = sesion.categoria as { id: string; nombre: string }
  const tipoCarrera = sesion.tipo_carrera as { id: string; nombre: string }

  const [{ data: pilotos }, { data: resultados }] = await Promise.all([
    supabase
      .from('piloto')
      .select('id, nombre, apellido, numero')
      .eq('categoria_id', categoria.id)
      .eq('campeonato_id', fecha.campeonato_id)
      .order('numero'),
    supabase
      .from('resultado')
      .select('piloto_id, posicion')
      .eq('sesion_id', id)
      .order('posicion'),
  ])

  return (
    <div>
      <Link
        href={`/admin/fechas/${fecha.id}`}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← Fecha {fecha.numero}
        {fecha.nombre ? ` — ${fecha.nombre}` : ''}
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {categoria.nombre} · {tipoCarrera.nombre}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {fecha.campeonato.nombre}
          {sesion.multiplicador !== 1 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              ×{sesion.multiplicador}
            </span>
          )}
        </p>
      </div>

      {/* Editar sesión */}
      <form
        action={updateSesion}
        className="mt-4 rounded-lg bg-white px-4 py-4 ring-1 ring-gray-200 space-y-3"
      >
        <input type="hidden" name="id" value={sesion.id} />
        <input type="hidden" name="fechaId" value={fecha.id} />
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700">Multiplicador</label>
            <input
              name="multiplicador"
              type="number"
              min={1}
              step={0.5}
              defaultValue={sesion.multiplicador}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700">URL planilla</label>
            <input
              name="planilla_url"
              type="url"
              defaultValue={sesion.planilla_url ?? ''}
              placeholder="https://..."
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
          >
            Guardar
          </button>
        </div>
      </form>

      {/* Resultados */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Resultados</h2>
        <p className="mt-1 text-sm text-gray-500">
          Ingresá la posición de cada piloto. Los puntos se calculan automáticamente.
        </p>
        <div className="mt-3">
          <ResultadosEditor
            sesionId={id}
            pilotos={pilotos ?? []}
            resultadosIniciales={resultados ?? []}
          />
        </div>
      </div>
    </div>
  )
}
