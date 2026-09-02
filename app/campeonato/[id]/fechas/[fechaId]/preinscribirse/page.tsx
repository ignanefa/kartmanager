import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { preinscribirse } from './actions'
import FlashMessage from '@/components/FlashMessage'
import SubmitButton from '@/components/SubmitButton'

export default async function PreinscribirsePublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; fechaId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id, fechaId } = await params
  const { error: errorParam } = await searchParams

  const supabase = await createClient()

  const [{ data: fecha }, { data: categorias }] = await Promise.all([
    supabase
      .from('fecha')
      .select('id, numero, nombre, circuito, campeonato_id')
      .eq('id', fechaId)
      .eq('campeonato_id', id)
      .eq('publicada', true)
      .single(),
    supabase
      .from('categoria')
      .select('nombre')
      .eq('campeonato_id', id)
      .order('orden')
      .order('nombre'),
  ])

  if (!fecha) notFound()

  const errorMessages: Record<string, string> = {
    email_invalido: 'El email ingresado no tiene un formato válido.',
    error_general: 'Hubo un problema al enviar la preinscripción. Intentá de nuevo.',
  }

  return (
    <div>
      <Link
        href={`/campeonato/${id}/fechas/${fechaId}`}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← Fecha {fecha.numero}{fecha.nombre ? ` — ${fecha.nombre}` : ''}
      </Link>

      <div className="mt-4">
        <h2 className="text-xl font-bold text-gray-900">Preinscripción</h2>
        <p className="mt-1 text-sm text-gray-500">
          {fecha.circuito} · Fecha {fecha.numero}
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Completá el formulario y el organizador se pondrá en contacto para confirmar tu participación.
        </p>
      </div>

      {errorParam && (
        <FlashMessage
          type="error"
          message={errorMessages[errorParam] ?? 'Hubo un problema. Intentá de nuevo.'}
        />
      )}

      <form
        action={preinscribirse}
        className="mt-6 rounded-xl bg-white px-5 py-5 ring-1 ring-gray-200 space-y-4"
      >
        <input type="hidden" name="fechaId" value={fechaId} />
        <input type="hidden" name="campeonatoId" value={id} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre *</label>
            <input
              name="nombre"
              type="text"
              required
              autoComplete="given-name"
              placeholder="ej. Juan"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Apellido *</label>
            <input
              name="apellido"
              type="text"
              required
              autoComplete="family-name"
              placeholder="ej. García"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email *</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@email.com"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono *</label>
            <input
              name="telefono"
              type="tel"
              required
              autoComplete="tel"
              placeholder="+54 11..."
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Categoría *</label>
            {categorias && categorias.length > 0 ? (
              <select
                name="categoria_texto"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                <option value="">Seleccioná tu categoría...</option>
                {categorias.map((c) => (
                  <option key={c.nombre} value={c.nombre}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name="categoria_texto"
                type="text"
                required
                placeholder="ej. 150cc Standard"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Número deseado{' '}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              name="numero_deseado"
              type="number"
              min={1}
              placeholder="—"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Equipo{' '}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              name="equipo"
              type="text"
              placeholder="—"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Mensaje{' '}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              name="mensaje"
              rows={3}
              placeholder="Consultas o información adicional"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
        </div>

        <div className="pt-1">
          <SubmitButton
            pendingText="Enviando..."
            className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Enviar preinscripción
          </SubmitButton>
          <p className="mt-2 text-xs text-gray-400 text-center">
            Tus datos son confidenciales y solo serán usados para confirmar tu participación.
          </p>
        </div>
      </form>
    </div>
  )
}
