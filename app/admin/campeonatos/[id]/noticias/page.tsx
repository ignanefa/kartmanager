import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createNoticia, deleteNoticia, toggleNoticiaPublicada } from './actions'
import ConfirmDelete from '@/components/ConfirmDelete'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('campeonato').select('nombre, anio').eq('id', id).single()
  if (!data) return { title: 'Noticias' }
  return { title: `Noticias · ${data.nombre} ${data.anio}` }
}

export default async function NoticiasAdminPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: campeonato }, { data: noticias }] = await Promise.all([
    supabase.from('campeonato').select('id, nombre').eq('id', id).single(),
    supabase
      .from('noticia')
      .select('id, titulo, publicada, fecha_pub, created_at')
      .eq('campeonato_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!campeonato) notFound()

  return (
    <div>
      <Link href={`/admin/campeonatos/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
        ← {campeonato.nombre}
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-gray-900">Noticias</h1>
      </div>

      <div className="mt-4 space-y-2">
        {(!noticias || noticias.length === 0) && (
          <p className="text-sm text-gray-400">Sin noticias todavía. Creá la primera abajo.</p>
        )}
        {noticias?.map((n) => (
          <div
            key={n.id}
            className="flex items-center justify-between rounded-lg bg-white px-4 py-3 ring-1 ring-gray-200"
          >
            <Link
              href={`/admin/noticias/${n.id}?campeonatoId=${id}`}
              className="flex-1 min-w-0"
            >
              <p className="font-medium text-gray-900 hover:text-blue-600">{n.titulo}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                {new Date(n.fecha_pub ?? n.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </Link>
            <div className="flex items-center gap-3 ml-4 shrink-0">
              <form action={toggleNoticiaPublicada}>
                <input type="hidden" name="id" value={n.id} />
                <input type="hidden" name="campeonatoId" value={id} />
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    name="publicada"
                    type="checkbox"
                    defaultChecked={n.publicada}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    onChange={(e) => (e.target.form as HTMLFormElement).requestSubmit()}
                  />
                  <span className={`text-xs font-medium ${n.publicada ? 'text-green-700' : 'text-gray-400'}`}>
                    {n.publicada ? 'Publicada' : 'Borrador'}
                  </span>
                </label>
              </form>
              <ConfirmDelete
                action={deleteNoticia}
                fields={[{ name: 'id', value: n.id }, { name: 'campeonatoId', value: id }]}
                message={`¿Eliminar la noticia "${n.titulo}"?`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Crear noticia — título y va directo al editor completo */}
      <form
        action={createNoticia}
        className="mt-6 rounded-lg bg-white px-4 py-4 ring-1 ring-gray-200"
      >
        <input type="hidden" name="campeonatoId" value={id} />
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700">Nueva noticia</label>
            <input
              name="titulo"
              type="text"
              required
              placeholder="ej. Resultados Fecha 1"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
          >
            Crear y editar
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Abrirás el editor completo para escribir el contenido.
        </p>
      </form>
    </div>
  )
}
