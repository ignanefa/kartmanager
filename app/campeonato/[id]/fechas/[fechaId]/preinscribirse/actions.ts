'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function preinscribirse(formData: FormData) {
  const fechaId = formData.get('fechaId') as string
  const campeonatoId = formData.get('campeonatoId') as string
  const nombre = (formData.get('nombre') as string).trim()
  const apellido = (formData.get('apellido') as string).trim()
  const email = (formData.get('email') as string).trim()
  const telefono = (formData.get('telefono') as string).trim()
  const categoria_texto = (formData.get('categoria_texto') as string).trim()
  const numero_deseado_raw = (formData.get('numero_deseado') as string).trim()
  const numero_deseado = numero_deseado_raw ? parseInt(numero_deseado_raw, 10) : null
  const equipo = ((formData.get('equipo') as string) ?? '').trim() || null
  const mensaje = ((formData.get('mensaje') as string) ?? '').trim() || null

  if (!EMAIL_REGEX.test(email)) {
    redirect(
      `/campeonato/${campeonatoId}/fechas/${fechaId}/preinscribirse?error=email_invalido`
    )
  }

  const supabase = await createClient()

  const { error } = await supabase.from('preinscripcion').insert({
    fecha_id: fechaId,
    nombre,
    apellido,
    email,
    telefono,
    categoria_texto,
    numero_deseado,
    equipo,
    mensaje,
    estado: 'nuevo',
  })

  if (error) throw new Error(error.message)

  redirect(`/campeonato/${campeonatoId}/fechas/${fechaId}?inscripto=1`)
}
