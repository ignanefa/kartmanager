import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createArchivo, deleteArchivo, updateArchivo, updateArchivoPublicado } from './actions'
import ConfirmDelete from '@/components/ConfirmDelete'

const TIPO_LABEL: Record<string, string> = {
  reglamento: 'Reglamento',
  otro: 'Otro',
}

export default async function ArchivosAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ edit?: string }>
}) {
  const { id } = await params
  const { edit: editId } = await searchParams
  const supabase = await createClient()

  const [{ data: campeonato }, { data: archivos }] = await Promise.all([
    supabase.from('campeonato').select('id, nombre').eq('id', id).single(),
    supabase
      .from('archivo')
      .select('id, nombre, url, tipo, publicado, created_at')
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
        <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Reglamentos, cronogramas y otros archivos del campeonato.
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {(!archivos || archivos.length === 0) && (
          <p className="text-sm text-gray-400">Sin documentos todavía. Agregá el primero abajo.</p>
        )}
        {archivos?.map((a) => {
          const isEditing = editId === a.id
          return (
          <div
            key={a.id}
            className="rounded-lg bg-white px-4 py-3 ring-1 ring-gray-200"
          >
            {isEditing ? (
              <form action={updateArchivo} className="space-y-2">
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="campeonatoId" value={id} />
                <div className="flex flex-wrap gap-2 items-end">
                  <input
                    name="nombre"
                    type="text"
                    required
                    defaultValue={a.nombre}
                    placeholder="Nombre"
                    className="flex-1 min-w-48 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <select
                    name="tipo"
                    defaultValue={a.tipo}
                    className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="reglamento">Reglamento</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    name="url"
                    type="url"
                    required
                    defaultValue={a.url}
                    placeholder="https://..."
                    className="flex-1 min-w-48 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors">
                    Guardar
                  </button>
                  <Link href={`/admin/campeonatos/${id}/archivos`} className="text-xs text-gray-500 hover:text-gray-700">
                    Cancelar
                  </Link>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline truncate block"
                  >
                    {a.nombre}
                  </a>
                  <p className="mt-0.5 text-xs text-gray-400">{TIPO_LABEL[a.tipo] ?? a.tipo}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/admin/campeonatos/${id}/archivos?edit=${a.id}`}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Editar
                  </Link>
                  <form action={updateArchivoPublicado}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="campeonatoId" value={id} />
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        name="publicado"
                        type="checkbox"
                        defaultChecked={a.publicado}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onChange={(e) => (e.target.form as HTMLFormElement).requestSubmit()}
                      />
                      <span className="text-sm text-gray-600">Público</span>
                    </label>
                  </form>
                  <ConfirmDelete
                    action={deleteArchivo}
                    fields={[{ name: 'id', value: a.id }, { name: 'campeonatoId', value: id }]}
                    message={`¿Eliminar el documento "${a.nombre}"?`}
                  />
                </div>
              </div>
            )}
          </div>
          )
        })}
      </div>

      <form
        action={createArchivo}
        className="mt-6 rounded-lg bg-white px-4 py-4 ring-1 ring-gray-200 space-y-3"
      >
        <input type="hidden" name="campeonatoId" value={id} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Nombre *</label>
            <input
              name="nombre"
              type="text"
              required
              placeholder="ej. Reglamento Deportivo 2026"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">URL *</label>
            <input
              name="url"
              type="url"
              required
              placeholder="https://drive.google.com/..."
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo</label>
            <select
              name="tipo"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="reglamento">Reglamento</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                id="publicado_new"
                name="publicado"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Publicar inmediatamente</span>
            </label>
          </div>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Agregar documento
        </button>
      </form>
    </div>
  )
}
