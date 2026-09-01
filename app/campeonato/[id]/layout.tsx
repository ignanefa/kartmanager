import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('campeonato').select('nombre, anio').eq('id', id).single()
  if (!data) return { title: 'Campeonato' }
  return { title: { template: `%s · ${data.nombre} ${data.anio}`, default: `${data.nombre} ${data.anio}` } }
}

export default async function CampeonatoPublicLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: campeonato } = await supabase
    .from('campeonato')
    .select('id, nombre, anio')
    .eq('id', id)
    .single()

  if (!campeonato) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                {campeonato.anio}
              </p>
              <h1 className="text-xl font-bold text-gray-900">{campeonato.nombre}</h1>
            </div>
            <nav className="flex flex-wrap gap-1">
              <Link
                href={`/campeonato/${id}`}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                Fechas
              </Link>
              <Link
                href={`/campeonato/${id}/clasificacion`}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                Clasificación
              </Link>
              <Link
                href={`/campeonato/${id}/noticias`}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                Noticias
              </Link>
              <Link
                href={`/campeonato/${id}/costos`}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                Costos
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  )
}
