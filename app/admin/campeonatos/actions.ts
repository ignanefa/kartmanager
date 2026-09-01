'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCampeonato(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let { data: org } = await supabase
    .from('organizacion')
    .select('id')
    .limit(1)
    .maybeSingle()

  if (!org) {
    const { data: nueva } = await supabase
      .from('organizacion')
      .insert({ nombre: 'PAKO' })
      .select('id')
      .single()
    org = nueva
  }

  if (!org) throw new Error('No se pudo obtener ni crear la organización')

  const nombre = (formData.get('nombre') as string).trim()
  const anio = parseInt(formData.get('anio') as string, 10)

  const { data, error } = await supabase
    .from('campeonato')
    .insert({ organizacion_id: org.id, nombre, anio, activo: true })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  redirect(`/admin/campeonatos/${data.id}`)
}

export async function updateCampeonato(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const nombre = (formData.get('nombre') as string).trim()
  const anio = parseInt(formData.get('anio') as string, 10)
  const activo = formData.get('activo') === 'on'

  const { error } = await supabase
    .from('campeonato')
    .update({ nombre, anio, activo })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/campeonatos/${id}`)
  redirect(`/admin/campeonatos/${id}`)
}
