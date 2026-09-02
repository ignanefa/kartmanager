import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PublicNav from '@/components/PublicNav'

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
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex items-start gap-3 pt-3 pb-1">
            <div className="min-w-0 flex-1">
              <Link
                href="/"
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Inicio
              </Link>
              <h1 className="mt-0.5 text-base font-bold text-gray-900 truncate">
                {campeonato.nombre}
                <span className="ml-1.5 text-sm font-medium text-gray-400">
                  {campeonato.anio}
                </span>
              </h1>
            </div>
          </div>
          <div className="mt-1 mb-2">
            <PublicNav
              items={[
                { href: `/campeonato/${id}`, label: 'Fechas' },
                { href: `/campeonato/${id}/clasificacion`, label: 'Clasificación' },
                { href: `/campeonato/${id}/noticias`, label: 'Noticias' },
                { href: `/campeonato/${id}/costos`, label: 'Costos' },
                { href: `/campeonato/${id}/puntos`, label: 'Puntuación' },
                { href: `/campeonato/${id}/documentos`, label: 'Documentos' },
              ]}
            />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  )
}
