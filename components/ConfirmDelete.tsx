'use client'

import { useRef, useState } from 'react'

interface Field {
  name: string
  value: string
}

interface Props {
  action: (formData: FormData) => Promise<void>
  fields: Field[]
  message?: string  // kept for call-site compatibility, not displayed
  label?: string
  className?: string
}

export default function ConfirmDelete({
  action,
  fields,
  label = 'Eliminar',
  className = 'text-sm text-red-400 hover:text-red-600 transition-colors',
}: Props) {
  const [confirming, setConfirming] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5 text-xs">
        <span className="text-gray-500 shrink-0">¿Seguro?</span>
        <button
          type="button"
          onClick={() => formRef.current?.requestSubmit()}
          className="font-medium text-red-600 hover:text-red-800 transition-colors"
        >
          Sí
        </button>
        <span className="text-gray-300">/</span>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          No
        </button>
        <form ref={formRef} action={action} className="hidden">
          {fields.map((f) => (
            <input key={f.name} type="hidden" name={f.name} value={f.value} />
          ))}
        </form>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className={className}
    >
      {label}
    </button>
  )
}
