'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createFecha(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const campeonatoId = formData.get('campeonatoId') as string
  const numero = parseInt(formData.get('numero') as string, 10)
  const nombre = ((formData.get('nombre') as string) ?? '').trim() || null
  const circuito = (formData.get('circuito') as string).trim()
  const fecha_desde = formData.get('fecha_desde') as string
  const fecha_hasta = ((formData.get('fecha_hasta') as string) ?? '').trim() || null
  const cronograma_url = ((formData.get('cronograma_url') as string) ?? '').trim() || null

  const { data, error } = await supabase
    .from('fecha')
    .insert({
      campeonato_id: campeonatoId,
      numero,
      nombre,
      circuito,
      fecha_desde,
      fecha_hasta,
      cronograma_url,
      publicada: false,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/campeonatos/${campeonatoId}`)
  redirect(`/admin/fechas/${data.id}`)
}

export async function updateFecha(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const campeonatoId = formData.get('campeonatoId') as string
  const numero = parseInt(formData.get('numero') as string, 10)
  const nombre = ((formData.get('nombre') as string) ?? '').trim() || null
  const circuito = (formData.get('circuito') as string).trim()
  const fecha_desde = formData.get('fecha_desde') as string
  const fecha_hasta = ((formData.get('fecha_hasta') as string) ?? '').trim() || null
  const cronograma_url = ((formData.get('cronograma_url') as string) ?? '').trim() || null
  const publicada = formData.get('publicada') === 'on'

  const { error } = await supabase
    .from('fecha')
    .update({ numero, nombre, circuito, fecha_desde, fecha_hasta, cronograma_url, publicada })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/fechas/${id}`)
  revalidatePath(`/admin/campeonatos/${campeonatoId}`)
  redirect(`/admin/fechas/${id}`)
}

export async function deleteFecha(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const campeonatoId = formData.get('campeonatoId') as string

  const { error } = await supabase.from('fecha').delete().eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/campeonatos/${campeonatoId}`)
  redirect(`/admin/campeonatos/${campeonatoId}`)
}
