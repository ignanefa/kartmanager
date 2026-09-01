import { createClient } from '@/lib/supabase/server'

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
      <p className="mt-1 text-sm text-gray-500">Información sobre inscripciones y otros gastos.</p>
      <div className="mt-6 overflow-x-auto rounded-xl bg-white ring-1 ring-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left font-medium text-gray-600">Concepto</th>
              <th className="px-5 py-3 text-left font-medium text-gray-600 w-28">Monto</th>
              <th className="px-5 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {costos.map((c) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-5 py-3 font-medium text-gray-900">{c.concepto}</td>
                <td className="px-5 py-3 text-gray-700">{formatMonto(c.monto) ?? '—'}</td>
                <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{c.detalle ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
