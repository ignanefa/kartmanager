import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Costos' }

function formatMonto(m: number | null) {
  if (m === null) return null
  return `$${m.toLocaleString('es-AR')}`
}

export default async function CostosPublicPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: costos } = await supabase
    .from('costo')
    .select('id, concepto, monto, detalle')
    .eq('campeonato_id', id)
    .order('created_at')

  if (!costos || costos.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900">Costos</h2>
        <p className="mt-4 text-sm text-gray-400">No hay información de costos disponible todavía.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Costos</h2>
      <p className="mt-1 text-sm text-gray-500">Inscripciones y otros gastos del campeonato.</p>

      {/* Mobile: cards */}
      <div className="mt-6 space-y-2 sm:hidden">
        {costos.map((c) => (
          <div key={c.id} className="rounded-xl bg-white px-4 py-3.5 ring-1 ring-gray-200">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-gray-900">{c.concepto}</p>
              <p className="shrink-0 font-semibold text-gray-900">{formatMonto(c.monto) ?? '—'}</p>
            </div>
            {c.detalle && (
              <p className="mt-1 text-sm text-gray-500">{c.detalle}</p>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="mt-6 hidden sm:block overflow-x-auto rounded-xl bg-white ring-1 ring-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-5 py-3 text-left font-medium text-gray-500">Concepto</th>
              <th className="px-5 py-3 text-left font-medium text-gray-500 w-32">Monto</th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {costos.map((c) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-5 py-3 font-medium text-gray-900">{c.concepto}</td>
                <td className="px-5 py-3 font-semibold text-gray-900">{formatMonto(c.monto) ?? '—'}</td>
                <td className="px-5 py-3 text-gray-500">{c.detalle ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
