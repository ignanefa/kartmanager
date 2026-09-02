import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  const { data: campeonatos } = await supabase
    .from('campeonato')
    .select('id, nombre, anio, activo')
    .order('anio', { ascending: false })
    .order('nombre')

  if (campeonatos && campeonatos.length === 1) {
    redirect(`/campeonato/${campeonatos[0].id}`)
  }

  const activos = campeonatos?.filter((c) => c.activo) ?? []
  if (activos.length === 1) {
    redirect(`/campeonato/${activos[0].id}`)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">KartManager</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Campeonatos</h1>
        </div>

        {(!campeonatos || campeonatos.length === 0) && (
          <div className="rounded-xl bg-white px-5 py-8 ring-1 ring-gray-200 text-center">
            <p className="text-sm text-gray-500">No hay campeonatos disponibles aún.</p>
            <Link href="/admin" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
              Ir al panel de administración →
            </Link>
          </div>
        )}

        <div className="space-y-2">
          {campeonatos?.map((c) => (
            <Link
              key={c.id}
              href={`/campeonato/${c.id}`}
              className="flex items-center justify-between rounded-xl bg-white px-5 py-4 ring-1 ring-gray-200 hover:ring-gray-400 transition-all"
            >
              <div>
                <p className="font-semibold text-gray-900">{c.nombre}</p>
                <p className="text-sm text-gray-400">{c.anio}</p>
              </div>
              <div className="flex items-center gap-2">
                {c.activo && (
                  <span className="text-xs rounded-full bg-green-100 text-green-700 px-2 py-0.5 font-medium">
                    Activo
                  </span>
                )}
                <span className="text-gray-300">›</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200">
          <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600">
            Panel de administración →
          </Link>
        </div>
      </div>
    </main>
  )
}
