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

function sortFilas(filas: FilaResultado[]): FilaResultado[] {
  return [...filas].sort((a, b) => {
    if (a.posicion === null && b.posicion === null) return a.numero - b.numero
    if (a.posicion === null) return 1
    if (b.posicion === null) return -1
    return a.posicion - b.posicion
  })
}

export default function ResultadosEditor({ sesionId, pilotos, resultadosIniciales }: Props) {
  const posicionPorPiloto = Object.fromEntries(
    resultadosIniciales.map((r) => [r.piloto_id, r.posicion])
  )

  const [filas, setFilas] = useState<FilaResultado[]>(
    sortFilas(
      pilotos.map((p) => ({
        piloto_id: p.id,
        nombre: p.nombre,
        apellido: p.apellido,
        numero: p.numero,
        posicion: posicionPorPiloto[p.id] ?? null,
      }))
    )
  )

  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  // Compute duplicate positions for live visual feedback
  const conteosPosicion = filas
    .filter((f) => f.posicion !== null && f.posicion > 0)
    .reduce<Record<number, number>>((acc, f) => {
      const p = f.posicion as number
      acc[p] = (acc[p] ?? 0) + 1
      return acc
    }, {})
  const esDuplicada = (posicion: number | null) =>
    posicion !== null && (conteosPosicion[posicion] ?? 0) > 1

  const hayDuplicados = Object.values(conteosPosicion).some((c) => c > 1)

  function actualizarPosicion(pilotoId: string, valor: string) {
    setFilas((prev) => {
      const updated = prev.map((f) =>
        f.piloto_id === pilotoId
          ? { ...f, posicion: valor === '' ? null : parseInt(valor, 10) }
          : f
      )
      return sortFilas(updated)
    })
    setMensaje(null)
  }

  function guardar() {
    if (hayDuplicados) {
      setMensaje({ tipo: 'error', texto: 'Hay posiciones duplicadas. Corregílas antes de guardar.' })
      return
    }

    const conPosicion = filas.filter((f) => f.posicion !== null && f.posicion > 0)

    startTransition(async () => {
      const result = await saveResultados(
        sesionId,
        conPosicion.map((f) => ({ piloto_id: f.piloto_id, posicion: f.posicion as number }))
      )
      if (result?.error) {
        setMensaje({ tipo: 'error', texto: result.error })
      } else {
        setMensaje({ tipo: 'ok', texto: `Resultados guardados — ${conPosicion.length} piloto${conPosicion.length !== 1 ? 's' : ''} clasificados` })
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
              <th className="px-4 py-2.5 text-left font-medium text-gray-600 w-16">Pos.</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600 w-14">N°</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600">Piloto</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600 w-36">Posición final</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => {
              const duplicada = esDuplicada(fila.posicion)
              return (
                <tr
                  key={fila.piloto_id}
                  className={`border-t border-gray-100 ${duplicada ? 'bg-red-50' : ''}`}
                >
                  <td className="px-4 py-2.5 text-gray-400 text-sm">
                    {fila.posicion !== null ? fila.posicion : '—'}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{fila.numero}</td>
                  <td className="px-4 py-2.5 text-gray-900">
                    {fila.nombre} {fila.apellido}
                    {duplicada && (
                      <span className="ml-2 text-xs font-medium text-red-600">duplicado</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      min={1}
                      value={fila.posicion ?? ''}
                      placeholder="—"
                      onChange={(e) => actualizarPosicion(fila.piloto_id, e.target.value)}
                      className={`w-24 rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 transition-colors ${
                        duplicada
                          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-400'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-400'
                      }`}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-gray-400">
        Los resultados se ordenan automáticamente. Dejá vacío para DNS/DNF.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={guardar}
          disabled={isPending || hayDuplicados}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-40 transition-colors"
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
        {hayDuplicados && !mensaje && (
          <span className="text-sm font-medium text-red-600">
            Hay posiciones duplicadas
          </span>
        )}
      </div>
    </div>
  )
}
