import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updatePiloto, deletePiloto } from '../actions'
import ConfirmDelete from '@/components/ConfirmDelete'

export default async function PilotoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error: errorParam } = await searchParams

  const supabase = await createClient()

  const [{ data: piloto }, { data: contacto }] = await Promise.all([
    supabase
      .from('piloto')
      .select('*, categoria:categoria_id(id, nombre, campeonato_id, campeonato:campeonato_id(id, nombre))')
      .eq('id', id)
      .single(),
    supabase
      .from('piloto_contacto')
      .select('email, telefono')
      .eq('piloto_id', id)
      .maybeSingle(),
  ])

  if (!piloto) notFound()

  const categoria = piloto.categoria as { id: string; nombre: string; campeonato: { id: string; nombre: string } }

  return (
    <div>
      <Link
        href={`/admin/categorias/${categoria.id}`}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← {categoria.nombre}
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

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {piloto.nombre} {piloto.apellido}
        </h1>

        <form
          action={updatePiloto}
          className="mt-4 rounded-lg bg-white px-4 py-4 ring-1 ring-gray-200 space-y-3"
        >
          <input type="hidden" name="id" value={piloto.id} />
          <input type="hidden" name="categoriaId" value={categoria.id} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre *</label>
              <input
                name="nombre"
                type="text"
                required
                defaultValue={piloto.nombre}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Apellido *</label>
              <input
                name="apellido"
                type="text"
                required
                defaultValue={piloto.apellido}
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
                defaultValue={piloto.numero}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Equipo</label>
              <input
                name="equipo"
                type="text"
                defaultValue={piloto.equipo ?? ''}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                name="email"
                type="email"
                defaultValue={contacto?.email ?? ''}
                placeholder="opcional"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                name="telefono"
                type="tel"
                defaultValue={contacto?.telefono ?? ''}
                placeholder="opcional"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
            >
              Guardar cambios
            </button>
          </div>
        </form>

        <div className="mt-6">
          <ConfirmDelete
            action={deletePiloto}
            fields={[{ name: 'id', value: piloto.id }, { name: 'categoriaId', value: categoria.id }]}
            message={`¿Eliminar a ${piloto.nombre} ${piloto.apellido}? Esta acción no se puede deshacer.`}
            label="Eliminar piloto"
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          />
        </div>
      </div>
    </div>
  )
}
