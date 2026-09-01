import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createCampeonato } from './actions'

export default async function CampeonatosPage() {
  const supabase = await createClient()
  const { data: campeonatos } = await supabase
    .from('campeonato')
    .select('id, nombre, anio, activo')
    .order('anio', { ascending: false })
    .order('nombre')

  const anioActual = new Date().getFullYear()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Campeonatos</h1>
      <p className="mt-1 text-sm text-gray-500">Estructura de competición: campeonatos, categorías y esquemas de puntaje.</p>

      <div className="mt-6 space-y-2">
        {(!campeonatos || campeonatos.length === 0) && (
          <p className="text-sm text-gray-400">No hay campeonatos todavía. Creá el primero abajo.</p>
        )}
        {campeonatos?.map((c) => (
          <Link
            key={c.id}
            href={`/admin/campeonatos/${c.id}`}
            className="flex items-center justify-between rounded-lg bg-white px-4 py-3 ring-1 ring-gray-200 hover:ring-blue-400 transition-all"
          >
            <span className="font-medium text-gray-900">{c.nombre}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{c.anio}</span>
              <span
                className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                  c.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {c.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-base font-semibold text-gray-900">Nuevo campeonato</h2>
        <form
          action={createCampeonato}
          className="mt-3 flex flex-wrap items-end gap-3 rounded-lg bg-white px-4 py-4 ring-1 ring-gray-200"
        >
          <div className="flex-1 min-w-48">
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              placeholder="ej. PAKO 2026"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="w-28">
            <label htmlFor="anio" className="block text-sm font-medium text-gray-700">
              Año
            </label>
            <input
              id="anio"
              name="anio"
              type="number"
              required
              defaultValue={anioActual}
              min={2000}
              max={2100}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Crear
          </button>
        </form>
      </div>
    </div>
  )
}
