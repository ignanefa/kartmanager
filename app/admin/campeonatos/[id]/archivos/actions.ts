'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createArchivo(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const campeonatoId = formData.get('campeonatoId') as string
  const nombre = (formData.get('nombre') as string).trim()
  const url = (formData.get('url') as string).trim()
  const tipo = (formData.get('tipo') as string) || 'otro'
  const publicado = formData.get('publicado') === 'on'

  const { error } = await supabase.from('archivo').insert({
    campeonato_id: campeonatoId,
    nombre,
    url,
    tipo,
    publicado,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/campeonatos/${campeonatoId}/archivos`)
  redirect(`/admin/campeonatos/${campeonatoId}/archivos`)
}

export async function updateArchivoPublicado(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const campeonatoId = formData.get('campeonatoId') as string
  const publicado = formData.get('publicado') === 'on'

  const { error } = await supabase.from('archivo').update({ publicado }).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/campeonatos/${campeonatoId}/archivos`)
  redirect(`/admin/campeonatos/${campeonatoId}/archivos`)
}

export async function deleteArchivo(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const campeonatoId = formData.get('campeonatoId') as string

  const { error } = await supabase.from('archivo').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/campeonatos/${campeonatoId}/archivos`)
  redirect(`/admin/campeonatos/${campeonatoId}/archivos`)
}
