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
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900">Karting SaaS</h1>
        <p className="mt-2 text-gray-500">Sistema de gestión de campeonatos de karting</p>

        <div className="mt-8 space-y-3">
          {(!campeonatos || campeonatos.length === 0) && (
            <p className="text-sm text-gray-400">
              No hay campeonatos disponibles aún.{' '}
              <Link href="/admin" className="text-blue-600 hover:underline">
                Ir al panel de administración →
              </Link>
            </p>
          )}
          {campeonatos?.map((c) => (
            <Link
              key={c.id}
              href={`/campeonato/${c.id}`}
              className="block rounded-lg bg-white px-5 py-4 ring-1 ring-gray-200 hover:ring-blue-400 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{c.nombre}</p>
                  <p className="text-sm text-gray-500">{c.anio}</p>
                </div>
                {c.activo && (
                  <span className="text-xs rounded-full bg-green-100 text-green-700 px-2 py-0.5 font-medium">
                    Activo
                  </span>
                )}
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
