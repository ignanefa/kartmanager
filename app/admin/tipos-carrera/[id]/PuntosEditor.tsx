'use client'

import { useState, useTransition } from 'react'
import { savePuntos } from '../actions'

interface FilaEdicion {
  posicion: number
  puntos: number | null
}

interface Props {
  tipoId: string
  initialPuntos: { posicion: number; puntos: number }[]
}

export default function PuntosEditor({ tipoId, initialPuntos }: Props) {
  const [rows, setRows] = useState<FilaEdicion[]>(initialPuntos)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function agregarFila() {
    const maxPos = rows.length > 0 ? Math.max(...rows.map((r) => r.posicion)) : 0
    setRows([...rows, { posicion: maxPos + 1, puntos: null }])
    setMensaje(null)
  }

  function eliminarFila(index: number) {
    setRows(rows.filter((_, i) => i !== index))
    setMensaje(null)
  }

  function actualizarFila(index: number, campo: keyof FilaEdicion, valor: number | null) {
    setRows(rows.map((row, i) => (i === index ? { ...row, [campo]: valor } : row)))
    setMensaje(null)
  }

  function guardar() {
    const posiciones = rows.map((r) => r.posicion)
    if (posiciones.length !== new Set(posiciones).size) {
      setMensaje({ tipo: 'error', texto: 'Hay posiciones duplicadas en la tabla. Corregílas antes de guardar.' })
      return
    }
    startTransition(async () => {
      const result = await savePuntos(
        tipoId,
        rows.map((r) => ({ posicion: r.posicion, puntos: r.puntos ?? 0 }))
      )
      if (result?.error) {
        setMensaje({ tipo: 'error', texto: result.error })
      } else {
        setMensaje({ tipo: 'ok', texto: 'Tabla guardada correctamente' })
      }
    })
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg bg-white ring-1 ring-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600 w-32">Posición</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 w-32">Puntos</th>
              <th className="px-4 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-400">
                  Sin filas. Usá "Agregar posición" para empezar.
                </td>
              </tr>
            )}
            {rows.map((row, index) => (
              <tr key={index} className="border-t border-gray-100">
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    value={row.posicion}
                    onChange={(e) =>
                      actualizarFila(index, 'posicion', parseInt(e.target.value, 10) || 1)
                    }
                    className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    value={row.puntos ?? ''}
                    placeholder="0"
                    onChange={(e) => {
                      const v = e.target.value
                      actualizarFila(index, 'puntos', v === '' ? null : parseInt(v, 10))
                    }}
                    className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => eliminarFila(index)}
                    className="text-lg leading-none text-red-400 hover:text-red-600 transition-colors"
                    aria-label="Eliminar fila"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={agregarFila}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          + Agregar posición
        </button>
        <button
          type="button"
          onClick={guardar}
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Guardando...' : 'Guardar tabla'}
        </button>
        {mensaje && (
          <span className={`text-sm font-medium ${mensaje.tipo === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
            {mensaje.texto}
          </span>
        )}
      </div>
    </div>
  )
}
