import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createCosto, deleteCosto } from './actions'
import ConfirmDelete from '@/components/ConfirmDelete'

function formatMonto(m: number | null) {
  if (m === null) return '—'
  return `$${m.toLocaleString('es-AR')}`
}

export default async function CostosAdminPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: campeonato }, { data: costos }] = await Promise.all([
    supabase.from('campeonato').select('id, nombre').eq('id', id).single(),
    supabase.from('costo').select('*').eq('campeonato_id', id).order('created_at'),
  ])

  if (!campeonato) notFound()

  return (
    <div>
      <Link href={`/admin/campeonatos/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
        ← {campeonato.nombre}
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-gray-900">Costos</h1>
        <p className="mt-1 text-sm text-gray-500">Información pública sobre inscripción, neumáticos, etc.</p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg bg-white ring-1 ring-gray-200">
        {(!costos || costos.length === 0) ? (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">Sin costos configurados. Agregá el primero abajo.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Concepto</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600 w-28">Monto</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600 hidden sm:table-cell">Detalle</th>
                <th className="px-4 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {costos.map((c) => (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{c.concepto}</td>
                  <td className="px-4 py-2.5 text-gray-700">{formatMonto(c.monto)}</td>
                  <td className="px-4 py-2.5 text-gray-500 hidden sm:table-cell">{c.detalle ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <ConfirmDelete
                      action={deleteCosto}
                      fields={[{ name: 'id', value: c.id }, { name: 'campeonatoId', value: id }]}
                      message={`¿Eliminar el costo "${c.concepto}"?`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <form
        action={createCosto}
        className="mt-4 rounded-lg bg-white px-4 py-4 ring-1 ring-gray-200 space-y-3"
      >
        <input type="hidden" name="campeonatoId" value={id} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">Concepto *</label>
            <input
              name="concepto"
              type="text"
              required
              placeholder="ej. Inscripción"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Monto ($)</label>
            <input
              name="monto"
              type="number"
              min={0}
              step={0.01}
              placeholder="opcional"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Detalle</label>
            <input
              name="detalle"
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
            Agregar costo
          </button>
        </div>
      </form>
    </div>
  )
}
