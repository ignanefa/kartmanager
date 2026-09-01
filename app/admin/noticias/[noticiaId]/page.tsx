import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateNoticia } from '@/app/admin/campeonatos/[id]/noticias/actions'

export default async function NoticiaEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ noticiaId: string }>
  searchParams: Promise<{ campeonatoId?: string }>
}) {
  const { noticiaId } = await params
  const { campeonatoId } = await searchParams

  const supabase = await createClient()

  const { data: noticia } = await supabase
    .from('noticia')
    .select('*')
    .eq('id', noticiaId)
    .single()

  if (!noticia) notFound()

  const backHref = campeonatoId
    ? `/admin/campeonatos/${campeonatoId}/noticias`
    : `/admin/campeonatos/${noticia.campeonato_id}/noticias`

  const resolvedCampeonatoId = campeonatoId ?? noticia.campeonato_id

  return (
    <div>
      <Link href={backHref} className="text-sm text-gray-500 hover:text-gray-700">
        ← Noticias
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-gray-900">{noticia.titulo}</h1>
      </div>

      <form
        action={updateNoticia}
        className="mt-4 rounded-lg bg-white px-4 py-4 ring-1 ring-gray-200 space-y-3"
      >
        <input type="hidden" name="id" value={noticia.id} />
        <input type="hidden" name="campeonatoId" value={resolvedCampeonatoId} />
        <div>
          <label className="block text-sm font-medium text-gray-700">Título *</label>
          <input
            name="titulo"
            type="text"
            required
            defaultValue={noticia.titulo}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Contenido *</label>
          <textarea
            name="cuerpo"
            required
            rows={10}
            defaultValue={noticia.cuerpo}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <input
              id="publicada_edit"
              name="publicada"
              type="checkbox"
              defaultChecked={noticia.publicada}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="publicada_edit" className="text-sm text-gray-700">
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
  )
}
