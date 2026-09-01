import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateFecha } from '../actions'
import { createSesion, deleteSesion, moveSesion } from '@/app/admin/sesiones/actions'
import ConfirmDelete from '@/components/ConfirmDelete'

function formatDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export default async function FechaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const { data: fecha } = await supabase
    .from('fecha')
    .select('*, campeonato:campeonato_id(id, nombre)')
    .eq('id', id)
    .single()

  if (!fecha) notFound()

  const campeonato = fecha.campeonato as { id: string; nombre: string }

  const [{ data: sesiones }, { data: categorias }, { data: tipos }, { data: preinscripciones }] = await Promise.all([
    supabase
      .from('sesion')
      .select('*, categoria:categoria_id(nombre, piloto(count)), tipo_carrera:tipo_carrera_id(nombre), resultado(count)')
      .eq('fecha_id', id)
      .order('orden'),
    supabase
      .from('categoria')
      .select('id, nombre')
      .eq('campeonato_id', campeonato.id)
      .order('orden')
      .order('nombre'),
    supabase
      .from('tipo_carrera')
      .select('id, nombre')
      .eq('campeonato_id', campeonato.id)
      .order('orden')
      .order('nombre'),
    supabase
      .from('preinscripcion')
      .select('estado')
      .eq('fecha_id', id),
  ])

  const nuevosCount = preinscripciones?.filter((p) => p.estado === 'nuevo').length ?? 0
  const totalCount = preinscripciones?.length ?? 0

  return (
    <div>
      <Link
        href={`/admin/campeonatos/${campeonato.id}`}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← {campeonato.nombre}
      </Link>

      {/* Editar fecha */}
      <div className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            Fecha {fecha.numero}
            {fecha.nombre ? ` — ${fecha.nombre}` : ''}
          </h1>
          <Link
            href={`/admin/fechas/${id}/preinscripciones`}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Preinscripciones
            {totalCount > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                nuevosCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {nuevosCount > 0 ? nuevosCount : totalCount}
              </span>
            )}
          </Link>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {fecha.circuito} · {formatDate(fecha.fecha_desde)}
          {fecha.fecha_hasta ? ` al ${formatDate(fecha.fecha_hasta)}` : ''}
        </p>

        <form
          action={updateFecha}
          className="mt-4 rounded-lg bg-white px-4 py-4 ring-1 ring-gray-200 space-y-3"
        >
          <input type="hidden" name="id" value={fecha.id} />
          <input type="hidden" name="campeonatoId" value={campeonato.id} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">N° de fecha *</label>
              <input
                name="numero"
                type="number"
                required
                min={1}
                defaultValue={fecha.numero}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Circuito *</label>
              <input
                name="circuito"
                type="text"
                required
                defaultValue={fecha.circuito}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de inicio *</label>
              <input
                name="fecha_desde"
                type="date"
                required
                defaultValue={fecha.fecha_desde}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de cierre</label>
              <input
                name="fecha_hasta"
                type="date"
                defaultValue={fecha.fecha_hasta ?? ''}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre / descripción</label>
              <input
                name="nombre"
                type="text"
                defaultValue={fecha.nombre ?? ''}
                placeholder="opcional"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">URL cronograma</label>
              <input
                name="cronograma_url"
                type="url"
                defaultValue={fecha.cronograma_url ?? ''}
                placeholder="https://..."
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <input
                id="publicada"
                name="publicada"
                type="checkbox"
                defaultChecked={fecha.publicada}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="publicada" className="text-sm text-gray-700">
                Publicada (visible en el portal)
              </label>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>

      {/* Sesiones */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Sesiones</h2>
        <p className="mt-1 text-sm text-gray-500">
          Cada sesión es una carrera (o clasificación) de una divisional en esta fecha.
        </p>

        <div className="mt-3 space-y-2">
          {(!sesiones || sesiones.length === 0) && (
            <p className="text-sm text-gray-400">Sin sesiones todavía. Agregá la primera abajo.</p>
          )}
          {sesiones?.map((s, idx) => {
            const cat = s.categoria as { nombre: string; piloto: { count: number }[] }
            const tipo = s.tipo_carrera as { nombre: string }
            const resultadoCount = (s.resultado as unknown as { count: number }[])?.[0]?.count ?? 0
            const pilotoCount = cat.piloto?.[0]?.count ?? 0
            const isFirst = idx === 0
            const isLast = idx === (sesiones.length - 1)
            return (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg bg-white px-4 py-3 ring-1 ring-gray-200"
              >
                <Link
                  href={`/admin/sesiones/${s.id}`}
                  className="flex-1 hover:text-blue-600"
                >
                  <span className="font-medium text-gray-900">{cat.nombre}</span>
                  <span className="mx-2 text-gray-300">·</span>
                  <span className="text-gray-700">{tipo.nombre}</span>
                  {s.multiplicador !== 1 && (
                    <span className="ml-2 text-xs rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 font-medium">
                      ×{s.multiplicador}
                    </span>
                  )}
                  {pilotoCount > 0 && (
                    <span className={`ml-2 text-xs rounded-full px-2 py-0.5 font-medium ${
                      resultadoCount === 0
                        ? 'bg-gray-100 text-gray-400'
                        : resultadoCount >= pilotoCount
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}>
                      {resultadoCount}/{pilotoCount}
                    </span>
                  )}
                </Link>
                <div className="flex items-center gap-1 ml-4 shrink-0">
                  <form action={moveSesion}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="fechaId" value={id} />
                    <input type="hidden" name="direccion" value="up" />
                    <button
                      type="submit"
                      disabled={isFirst}
                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-default transition-colors"
                      title="Mover arriba"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moveSesion}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="fechaId" value={id} />
                    <input type="hidden" name="direccion" value="down" />
                    <button
                      type="submit"
                      disabled={isLast}
                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-default transition-colors"
                      title="Mover abajo"
                    >
                      ↓
                    </button>
                  </form>
                  <Link
                    href={`/admin/sesiones/${s.id}`}
                    className="ml-3 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Resultados
                  </Link>
                  <div className="ml-1">
                    <ConfirmDelete
                      action={deleteSesion}
                      fields={[{ name: 'id', value: s.id }, { name: 'fechaId', value: id }]}
                      message={`¿Eliminar la sesión ${cat.nombre} · ${tipo.nombre}? Se borrarán todos los resultados cargados.`}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Form crear sesión */}
        {(!categorias || categorias.length === 0 || !tipos || tipos.length === 0) ? (
          <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-amber-200">
            Para agregar sesiones, primero creá al menos una divisional y un tipo de carrera en el campeonato.
          </div>
        ) : (
          <form
            action={createSesion}
            className="mt-4 rounded-lg bg-white px-4 py-4 ring-1 ring-gray-200 space-y-3"
          >
            <input type="hidden" name="fechaId" value={id} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Divisional *</label>
                <select
                  name="categoriaId"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Seleccioná...</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de carrera *</label>
                <select
                  name="tipoCarreraId"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Seleccioná...</option>
                  {tipos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Multiplicador</label>
                <input
                  name="multiplicador"
                  type="number"
                  min={1}
                  step={0.5}
                  defaultValue={1}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Agregar sesión
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
