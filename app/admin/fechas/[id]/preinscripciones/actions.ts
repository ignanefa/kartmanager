'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateEstadoPreinscripcion(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const estado = formData.get('estado') as string
  const fechaId = formData.get('fechaId') as string

  const { error } = await supabase
    .from('preinscripcion')
    .update({ estado })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/fechas/${fechaId}/preinscripciones`)
  redirect(`/admin/fechas/${fechaId}/preinscripciones`)
}
