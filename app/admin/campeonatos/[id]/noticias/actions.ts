'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createNoticia(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const campeonatoId = formData.get('campeonatoId') as string
  const titulo = (formData.get('titulo') as string).trim()
  const cuerpo = (formData.get('cuerpo') as string).trim()
  const publicada = formData.get('publicada') === 'on'

  const { data, error } = await supabase
    .from('noticia')
    .insert({
      campeonato_id: campeonatoId,
      titulo,
      cuerpo,
      publicada,
      fecha_pub: publicada ? new Date().toISOString() : null,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/campeonatos/${campeonatoId}/noticias`)
  redirect(`/admin/noticias/${data.id}?campeonatoId=${campeonatoId}`)
}

export async function updateNoticia(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const campeonatoId = formData.get('campeonatoId') as string
  const titulo = (formData.get('titulo') as string).trim()
  const cuerpo = (formData.get('cuerpo') as string).trim()
  const publicada = formData.get('publicada') === 'on'

  const { error } = await supabase
    .from('noticia')
    .update({
      titulo,
      cuerpo,
      publicada,
      fecha_pub: publicada ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/campeonatos/${campeonatoId}/noticias`)
  revalidatePath(`/admin/noticias/${id}`)
  redirect(`/admin/noticias/${id}?campeonatoId=${campeonatoId}`)
}

export async function deleteNoticia(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const campeonatoId = formData.get('campeonatoId') as string

  const { error } = await supabase.from('noticia').delete().eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/campeonatos/${campeonatoId}/noticias`)
  redirect(`/admin/campeonatos/${campeonatoId}/noticias`)
}
