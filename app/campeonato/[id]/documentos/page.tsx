import { createClient } from '@/lib/supabase/server'

const TIPO_LABEL: Record<string, string> = {
  reglamento: 'Reglamento',
  otro: 'Documento',
}

export default async function DocumentosPublicPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: archivos } = await supabase
    .from('archivo')
    .select('id, nombre, url, tipo')
    .eq('campeonato_id', id)
    .eq('publicado', true)
    .order('tipo')
    .order('nombre')

  if (!archivos || archivos.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900">Documentos</h2>
        <p className="mt-4 text-sm text-gray-400">No hay documentos publicados todavía.</p>
      </div>
    )
  }

  const reglamentos = archivos.filter((a) => a.tipo === 'reglamento')
  const otros = archivos.filter((a) => a.tipo !== 'reglamento')

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Documentos</h2>

      <div className="mt-6 space-y-8">
        {reglamentos.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-gray-900">Reglamentos</h3>
            <ul className="mt-3 space-y-2">
              {reglamentos.map((a) => (
                <li key={a.id}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg bg-white px-5 py-3.5 ring-1 ring-gray-200 hover:ring-blue-400 transition-all group"
                  >
                    <span className="text-xl">📄</span>
                    <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {a.nombre}
                    </span>
                    <span className="ml-auto text-sm text-gray-400">Ver →</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {otros.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-gray-900">Otros documentos</h3>
            <ul className="mt-3 space-y-2">
              {otros.map((a) => (
                <li key={a.id}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg bg-white px-5 py-3.5 ring-1 ring-gray-200 hover:ring-blue-400 transition-all group"
                  >
                    <span className="text-xl">📎</span>
                    <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {a.nombre}
                    </span>
                    <span className="ml-auto text-sm text-gray-400">Ver →</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
