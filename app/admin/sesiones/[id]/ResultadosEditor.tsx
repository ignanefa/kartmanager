'use client'

import { useState, useTransition } from 'react'
import { saveResultados } from '../actions'

interface Piloto {
  id: string
  nombre: string
  apellido: string
  numero: number
}

interface FilaResultado {
  piloto_id: string
  nombre: string
  apellido: string
  numero: number
  posicion: number | null
}

interface Props {
  sesionId: string
  pilotos: Piloto[]
  resultadosIniciales: { piloto_id: string; posicion: number }[]
}

export default function ResultadosEditor({ sesionId, pilotos, resultadosIniciales }: Props) {
  const posicionPorPiloto = Object.fromEntries(
    resultadosIniciales.map((r) => [r.piloto_id, r.posicion])
  )

  const [filas, setFilas] = useState<FilaResultado[]>(
    pilotos.map((p) => ({
      piloto_id: p.id,
      nombre: p.nombre,
      apellido: p.apellido,
      numero: p.numero,
      posicion: posicionPorPiloto[p.id] ?? null,
    }))
  )

  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function actualizarPosicion(pilotoId: string, valor: string) {
    setFilas((prev) =>
      prev.map((f) =>
        f.piloto_id === pilotoId
          ? { ...f, posicion: valor === '' ? null : parseInt(valor, 10) }
          : f
      )
    )
    setMensaje(null)
  }

  function guardar() {
    const conPosicion = filas.filter((f) => f.posicion !== null && f.posicion > 0)

    const posiciones = conPosicion.map((f) => f.posicion as number)
    const duplicados = posiciones.length !== new Set(posiciones).size
    if (duplicados) {
      setMensaje({ tipo: 'error', texto: 'Hay posiciones duplicadas. Revisá y corregí antes de guardar.' })
      return
    }

    startTransition(async () => {
      const result = await saveResultados(
        sesionId,
        conPosicion.map((f) => ({ piloto_id: f.piloto_id, posicion: f.posicion as number }))
      )
      if (result?.error) {
        setMensaje({ tipo: 'error', texto: result.error })
      } else {
        setMensaje({ tipo: 'ok', texto: `Resultados guardados (${conPosicion.length} pilotos)` })
      }
    })
  }

  if (pilotos.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        No hay pilotos inscriptos en esta divisional. Agregá pilotos desde la sección de categorías.
      </p>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg bg-white ring-1 ring-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600 w-16">N°</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Piloto</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 w-32">Posición</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.piloto_id} className="border-t border-gray-100">
                <td className="px-4 py-2 font-medium text-gray-900">{fila.numero}</td>
                <td className="px-4 py-2 text-gray-900">
                  {fila.nombre} {fila.apellido}
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min={1}
                    value={fila.posicion ?? ''}
                    placeholder="—"
                    onChange={(e) => actualizarPosicion(fila.piloto_id, e.target.value)}
                    className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-400">
        Dejá el campo vacío para pilotos que no finalizaron o no participaron.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={guardar}
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Guardando...' : 'Guardar resultados'}
        </button>
        {mensaje && (
          <span
            className={`text-sm font-medium ${
              mensaje.tipo === 'ok' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {mensaje.texto}
          </span>
        )}
      </div>
    </div>
  )
}
