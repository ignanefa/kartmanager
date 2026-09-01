import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateCampeonato } from '../actions'
import { createCategoria, deleteCategoria } from '@/app/admin/categorias/actions'
import { createTipoCarrera, deleteTipoCarrera } from '@/app/admin/tipos-carrera/actions'
import { createFecha, deleteFecha, toggleFechaPublicada } from '@/app/admin/fechas/actions'
import ConfirmDelete from '@/components/ConfirmDelete'

function formatDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export default async function CampeonatoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error: errorParam } = await searchParams

  const supabase = await createClient()

  const [{ data: campeonato }, { data: categorias }, { data: tipos }, { data: fechas }] = await Promise.all([
    supabase.from('campeonato').select('*').eq('id', id).single(),
    supabase.from('categoria').select('*').eq('campeonato_id', id).order('orden').order('nombre'),
    supabase.from('tipo_carrera').select('*').eq('campeonato_id', id).order('orden').order('nombre'),
    supabase.from('fecha').select('*').eq('campeonato_id', id).order('numero'),
  ])

  if (!campeonato) notFound()

  return (
    <div>
      <Link href="/admin/campeonatos" className="text-sm text-gray-500 hover:text-gray-700">
        ← Campeonatos
      </Link>

      {errorParam === 'tiene_sesiones' && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          No se puede eliminar la divisional: tiene pilotos o sesiones asociadas. Eliminá los datos relacionados primero.
        </div>
      )}
      {errorParam === 'tipo_tiene_sesiones' && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          No se puede eliminar el tipo de carrera: ya tiene sesiones registradas.
        </div>
      )}

      {/* Editar campeonato */}
      <div className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{campeonato.nombre}</h1>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/admin/campeonatos/${campeonato.id}/pilotos/export`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Pilotos CSV
            </a>
            <Link
              href={`/campeonato/${campeonato.id}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Ver portal →
            </Link>
            <Link
              href={`/admin/campeonatos/${campeonato.id}/clasificacion`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Clasificación
            </Link>
            <Link
              href={`/admin/campeonatos/${campeonato.id}/noticias`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Noticias
            </Link>
            <Link
              href={`/admin/campeonatos/${campeonato.id}/costos`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Costos
            </Link>
            <Link
              href={`/admin/campeonatos/${campeonato.id}/archivos`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Documentos
            </Link>
          </div>
        </div>
        <form
          action={updateCampeonato}
          className="mt-4 rounded-lg bg-white px-4 py-4 ring-1 ring-gray-200 space-y-3"
        >
          <input type="hidden" name="id" value={campeonato.id} />
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                defaultValue={campeonato.nombre}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="w-28">
              <label htmlFor="anio" className="block text-sm font-medium text-gray-700">
                Año
              </label>
              <input
                id="anio"
                name="anio"
                type="number"
                required
                defaultValue={campeonato.anio}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="activo"
              name="activo"
              type="checkbox"
              defaultChecked={campeonato.activo}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="activo" className="text-sm text-gray-700">
              Activo
            </label>
          </div>
          <div>
            <button
              type="submit"
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>

      {/* Divisionales / Categorías */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Divisionales</h2>
        <p className="mt-1 text-sm text-gray-500">Las categorías que compiten en este campeonato.</p>

        <div className="mt-3 space-y-2">
          {(!categorias || categorias.length === 0) && (
            <p className="text-sm text-gray-400">Sin divisionales todavía. Agregá la primera abajo.</p>
          )}
          {categorias?.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-lg bg-white px-4 py-3 ring-1 ring-gray-200"
            >
              <Link
                href={`/admin/categorias/${cat.id}`}
                className="font-medium text-gray-900 hover:text-blue-600"
              >
                {cat.nombre}
              </Link>
              <div className="flex items-center gap-4">
                <ConfirmDelete
                  action={deleteCategoria}
                  fields={[{ name: 'id', value: cat.id }, { name: 'campeonatoId', value: campeonato.id }]}
                  message={`¿Eliminar la divisional "${cat.nombre}"? Se eliminarán también sus pilotos si no tienen resultados.`}
                />
              </div>
            </div>
          ))}
        </div>

        <form
          action={createCategoria}
          className="mt-4 flex flex-wrap items-end gap-3 rounded-lg bg-white px-4 py-4 ring-1 ring-gray-200"
        >
          <input type="hidden" name="campeonatoId" value={campeonato.id} />
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              name="nombre"
              type="text"
              required
              placeholder="ej. 150cc Standard"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Agregar divisional
          </button>
        </form>
      </div>

      {/* Tipos de carrera */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Tipos de carrera</h2>
        <p className="mt-1 text-sm text-gray-500">
          Se configuran una sola vez. La tabla de puntos de cada tipo aplica a todas las divisionales.
        </p>

        <div className="mt-3 space-y-2">
          {(!tipos || tipos.length === 0) && (
            <p className="text-sm text-gray-400">Sin tipos de carrera todavía. Agregá el primero abajo.</p>
          )}
          {tipos?.map((tipo) => (
            <div
              key={tipo.id}
              className="flex items-center justify-between rounded-lg bg-white px-4 py-3 ring-1 ring-gray-200"
            >
              <Link
                href={`/admin/tipos-carrera/${tipo.id}`}
                className="font-medium text-gray-900 hover:text-blue-600"
              >
                {tipo.nombre}
              </Link>
              <div className="flex items-center gap-4">
                <span
                  className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                    tipo.otorga_puntos ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {tipo.otorga_puntos ? 'Puntúa' : 'Sin puntos'}
                </span>
                <ConfirmDelete
                  action={deleteTipoCarrera}
                  fields={[{ name: 'id', value: tipo.id }, { name: 'campeonatoId', value: campeonato.id }]}
                  message={`¿Eliminar el tipo de carrera "${tipo.nombre}"? Solo es posible si no tiene sesiones registradas.`}
                />
              </div>
            </div>
          ))}
        </div>

        <form
          action={createTipoCarrera}
          className="mt-4 rounded-lg bg-white px-4 py-4 ring-1 ring-gray-200 space-y-3"
        >
          <input type="hidden" name="campeonatoId" value={campeonato.id} />
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                name="nombre"
                type="text"
                required
                placeholder="ej. Final"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Agregar tipo
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="otorga_puntos"
              name="otorga_puntos"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="otorga_puntos" className="text-sm text-gray-700">
              Otorga puntos al campeonato
            </label>
          </div>
        </form>
      </div>

      {/* Fechas */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Fechas</h2>
        <p className="mt-1 text-sm text-gray-500">
          Rondas del campeonato. Cada fecha agrupa las sesiones de todas las divisionales.
        </p>

        <div className="mt-3 space-y-2">
          {(!fechas || fechas.length === 0) && (
            <p className="text-sm text-gray-400">Sin fechas todavía. Agregá la primera abajo.</p>
          )}
          {fechas?.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-lg bg-white px-4 py-3 ring-1 ring-gray-200"
            >
              <Link href={`/admin/fechas/${f.id}`} className="flex-1 hover:text-blue-600">
                <span className="font-medium text-gray-900">
                  Fecha {f.numero}{f.nombre ? ` — ${f.nombre}` : ''}
                </span>
                <span className="ml-3 text-sm text-gray-500">
                  {f.circuito} · {formatDate(f.fecha_desde)}
                  {f.fecha_hasta ? ` al ${formatDate(f.fecha_hasta)}` : ''}
                </span>
              </Link>
              <div className="flex items-center gap-3 ml-4 shrink-0">
                <form action={toggleFechaPublicada}>
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="campeonatoId" value={campeonato.id} />
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      name="publicada"
                      type="checkbox"
                      defaultChecked={f.publicada}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      onChange={(e) => (e.target.form as HTMLFormElement).requestSubmit()}
                    />
                    <span className={`text-xs font-medium ${f.publicada ? 'text-green-700' : 'text-gray-400'}`}>
                      {f.publicada ? 'Publicada' : 'Borrador'}
                    </span>
                  </label>
                </form>
                <ConfirmDelete
                  action={deleteFecha}
                  fields={[{ name: 'id', value: f.id }, { name: 'campeonatoId', value: campeonato.id }]}
                  message={`¿Eliminar Fecha ${f.numero}? Se borrarán también todas sus sesiones y resultados.`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Form crear fecha */}
        <form
          action={createFecha}
          className="mt-4 rounded-lg bg-white px-4 py-4 ring-1 ring-gray-200 space-y-3"
        >
          <input type="hidden" name="campeonatoId" value={campeonato.id} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700">N° de fecha *</label>
              <input
                name="numero"
                type="number"
                required
                min={1}
                defaultValue={(fechas?.length ?? 0) + 1}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Circuito *</label>
              <input
                name="circuito"
                type="text"
                required
                placeholder="ej. Autódromo AVEC"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de inicio *</label>
              <input
                name="fecha_desde"
                type="date"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de cierre</label>
              <input
                name="fecha_hasta"
                type="date"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre / descripción</label>
              <input
                name="nombre"
                type="text"
                placeholder="opcional"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Agregar fecha
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
