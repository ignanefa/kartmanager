import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Noticias' }

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function NoticiasPublicPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: noticias } = await supabase
    .from('noticia')
    .select('id, titulo, cuerpo, fecha_pub, created_at')
    .eq('campeonato_id', id)
    .eq('publicada', true)
    .order('fecha_pub', { ascending: false })

  if (!noticias || noticias.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900">Noticias</h2>
        <p className="mt-4 text-sm text-gray-400">No hay noticias publicadas todavía.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Noticias</h2>
      <div className="mt-6 space-y-6">
        {noticias.map((n) => (
          <article key={n.id} className="rounded-xl bg-white p-6 ring-1 ring-gray-200">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              {formatFecha(n.fecha_pub ?? n.created_at)}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900">{n.titulo}</h3>
            <div className="mt-3 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
              {n.cuerpo}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
