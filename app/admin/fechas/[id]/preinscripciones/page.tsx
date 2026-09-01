import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateEstadoPreinscripcion } from './actions'

const ESTADOS = ['nuevo', 'contactado', 'confirmado'] as const
type Estado = (typeof ESTADOS)[number]

const estadoLabel: Record<Estado, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  confirmado: 'Confirmado',
}

const estadoClase: Record<Estado, string> = {
  nuevo: 'bg-blue-100 text-blue-700',
  contactado: 'bg-amber-100 text-amber-700',
  confirmado: 'bg-green-100 text-green-700',
}

function formatFecha(ts: string) {
  return new Date(ts).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function PreinscripcionesAdminPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const { data: fecha } = await supabase
    .from('fecha')
    .select('id, numero, nombre, circuito, campeonato_id, campeonato:campeonato_id(id, nombre)')
    .eq('id', id)
    .single()

  if (!fecha) notFound()

  const campeonato = fecha.campeonato as unknown as { id: string; nombre: string }

  const { data: preinscripciones } = await supabase
    .from('preinscripcion')
    .select('*')
    .eq('fecha_id', id)
    .order('created_at', { ascending: false })

  const total = preinscripciones?.length ?? 0
  const confirmados = preinscripciones?.filter((p) => p.estado === 'confirmado').length ?? 0

  return (
    <div>
      <Link
        href={`/admin/fechas/${id}`}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← Fecha {fecha.numero}{fecha.nombre ? ` — ${fecha.nombre}` : ''}
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-gray-900">Preinscripciones</h1>
        <p className="mt-1 text-sm text-gray-500">
          {fecha.circuito} · {campeonato.nombre}
        </p>
        <div className="mt-3 flex gap-4 text-sm">
          <span className="font-medium text-gray-900">{total} total</span>
          <span className="text-green-700 font-medium">{confirmados} confirmados</span>
          <span className="text-amber-700 font-medium">
            {preinscripciones?.filter((p) => p.estado === 'nuevo').length ?? 0} nuevos
          </span>
        </div>
      </div>

      {(!preinscripciones || preinscripciones.length === 0) && (
        <p className="mt-6 text-sm text-gray-400">Todavía no hay preinscripciones para esta fecha.</p>
      )}

      <div className="mt-4 space-y-3">
        {preinscripciones?.map((p) => (
          <div
            key={p.id}
            className="rounded-lg bg-white px-5 py-4 ring-1 ring-gray-200"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">
                  {p.nombre} {p.apellido}
                </p>
                <p className="text-sm text-gray-500">
                  {p.categoria_texto}
                  {p.numero_deseado ? ` · #${p.numero_deseado}` : ''}
                  {p.equipo ? ` · ${p.equipo}` : ''}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  <a href={`mailto:${p.email}`} className="hover:underline">{p.email}</a>
                  {' · '}
                  <a href={`tel:${p.telefono}`} className="hover:underline">{p.telefono}</a>
                </p>
                {p.mensaje && (
                  <p className="mt-1 text-sm text-gray-500 italic">&ldquo;{p.mensaje}&rdquo;</p>
                )}
                <p className="mt-1 text-xs text-gray-400">{formatFecha(p.created_at)}</p>
              </div>

              <form action={updateEstadoPreinscripcion} className="flex items-center gap-2 shrink-0">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="fechaId" value={id} />
                <select
                  name="estado"
                  defaultValue={p.estado}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>
                      {estadoLabel[e]}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  ✓
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
