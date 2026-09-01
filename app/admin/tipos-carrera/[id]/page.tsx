import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateTipoCarrera } from '../actions'
import PuntosEditor from './PuntosEditor'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('tipo_carrera')
    .select('nombre, campeonato:campeonato_id(nombre, anio)')
    .eq('id', id)
    .single()
  if (!data) return { title: 'Tipo de carrera' }
  const camp = data.campeonato as unknown as { nombre: string; anio: number }
  return { title: `${data.nombre} · ${camp.nombre} ${camp.anio}` }
}

export default async function TipoCarreraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const { data: tipo } = await supabase
    .from('tipo_carrera')
    .select('*, campeonato:campeonato_id(id, nombre)')
    .eq('id', id)
    .single()

  if (!tipo) notFound()

  const { data: puntos } = await supabase
    .from('punto_por_posicion')
    .select('posicion, puntos')
    .eq('tipo_carrera_id', id)
    .order('posicion')

  const campeonato = tipo.campeonato as { id: string; nombre: string }

  return (
    <div>
      <Link
        href={`/admin/campeonatos/${campeonato.id}`}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← {campeonato.nombre}
      </Link>

      {/* Editar tipo de carrera */}
      <div className="mt-4">
        <h1 className="text-2xl font-bold text-gray-900">{tipo.nombre}</h1>
        <form
          action={updateTipoCarrera}
          className="mt-4 rounded-lg bg-white px-4 py-4 ring-1 ring-gray-200 space-y-3"
        >
          <input type="hidden" name="id" value={tipo.id} />
          <input type="hidden" name="campeonatoId" value={campeonato.id} />
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                name="nombre"
                type="text"
                required
                defaultValue={tipo.nombre}
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
          <div className="flex items-center gap-2">
            <input
              id="otorga_puntos"
              name="otorga_puntos"
              type="checkbox"
              defaultChecked={tipo.otorga_puntos}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="otorga_puntos" className="text-sm text-gray-700">
              Otorga puntos al campeonato
            </label>
          </div>
        </form>
      </div>

      {/* Tabla de puntos */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Tabla de puntos</h2>
        <p className="mt-1 text-sm text-gray-500">
          Aplica a todas las divisionales. Las posiciones sin fila valen 0 puntos.
        </p>
        <div className="mt-3">
          <PuntosEditor tipoId={tipo.id} initialPuntos={puntos ?? []} />
        </div>
      </div>
    </div>
  )
}
