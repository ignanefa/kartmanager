import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateCategoria } from '../actions'
import { createPiloto, deletePiloto } from '@/app/admin/pilotos/actions'
import ConfirmDelete from '@/components/ConfirmDelete'

export default async function CategoriaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error: errorParam } = await searchParams

  const supabase = await createClient()

  const [{ data: categoria }, { data: pilotos }] = await Promise.all([
    supabase
      .from('categoria')
      .select('*, campeonato:campeonato_id(id, nombre)')
      .eq('id', id)
      .single(),
    supabase
      .from('piloto')
      .select('*')
      .eq('categoria_id', id)
      .order('numero'),
  ])

  if (!categoria) notFound()

  const campeonato = categoria.campeonato as { id: string; nombre: string }

  return (
    <div>
      <Link
        href={`/admin/campeonatos/${campeonato.id}`}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← {campeonato.nombre}
      </Link>

      {errorParam === 'numero_duplicado' && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          Ese número ya está usado en esta categoría. Elegí otro.
        </div>
      )}
      {errorParam === 'email_invalido' && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          El email ingresado no tiene un formato válido.
        </div>
      )}
      {errorParam === 'piloto_tiene_resultados' && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          No se puede eliminar el piloto: ya tiene resultados registrados.
        </div>
      )}

      {/* Editar categoría */}
      <div className="mt-4">
        <h1 className="text-2xl font-bold text-gray-900">{categoria.nombre}</h1>
        <form
          action={updateCategoria}
          className="mt-4 flex flex-wrap items-end gap-3 rounded-lg bg-white px-4 py-4 ring-1 ring-gray-200"
        >
          <input type="hidden" name="id" value={categoria.id} />
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              name="nombre"
              type="text"
              required
              defaultValue={categoria.nombre}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
          >
            Guardar
          </button>
        </form>
      </div>

      {/* Pilotos */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Pilotos</h2>
        <p className="mt-1 text-sm text-gray-500">Pilotos inscriptos en esta divisional.</p>

        <div className="mt-3 overflow-x-auto rounded-lg bg-white ring-1 ring-gray-200">
          {(!pilotos || pilotos.length === 0) ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">
              Sin pilotos todavía. Agregá el primero abajo.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600 w-16">N°</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Piloto</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600 hidden sm:table-cell">Equipo</th>
                  <th className="px-4 py-2 w-28"></th>
                </tr>
              </thead>
              <tbody>
                {pilotos.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.numero}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {p.nombre} {p.apellido}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                      {p.equipo ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/pilotos/${p.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Editar
                        </Link>
                        <ConfirmDelete
                          action={deletePiloto}
                          fields={[{ name: 'id', value: p.id }, { name: 'categoriaId', value: id }]}
                          message={`¿Eliminar a ${p.nombre} ${p.apellido}?`}
                          className="text-sm text-red-400 hover:text-red-600 transition-colors"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Form agregar piloto */}
        <form
          action={createPiloto}
          className="mt-4 rounded-lg bg-white px-4 py-4 ring-1 ring-gray-200 space-y-3"
        >
          <input type="hidden" name="campeonatoId" value={campeonato.id} />
          <input type="hidden" name="categoriaId" value={categoria.id} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre *</label>
              <input
                name="nombre"
                type="text"
                required
                placeholder="ej. Juan"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Apellido *</label>
              <input
                name="apellido"
                type="text"
                required
                placeholder="ej. García"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Número *</label>
              <input
                name="numero"
                type="number"
                required
                min={1}
                placeholder="ej. 7"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Equipo</label>
              <input
                name="equipo"
                type="text"
                placeholder="opcional"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                name="email"
                type="email"
                placeholder="opcional"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                name="telefono"
                type="tel"
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
              Agregar piloto
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
