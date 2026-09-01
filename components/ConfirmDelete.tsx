'use client'

interface Field {
  name: string
  value: string
}

interface Props {
  action: (formData: FormData) => Promise<void>
  fields: Field[]
  message: string
  label?: string
  className?: string
}

export default function ConfirmDelete({
  action,
  fields,
  message,
  label = 'Eliminar',
  className = 'text-sm text-red-400 hover:text-red-600 transition-colors',
}: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault()
      }}
    >
      {fields.map((f) => (
        <input key={f.name} type="hidden" name={f.name} value={f.value} />
      ))}
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  )
}
