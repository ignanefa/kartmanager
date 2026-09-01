'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCategoria(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const campeonatoId = formData.get('campeonatoId') as string
  const nombre = (formData.get('nombre') as string).trim()

  const { data: maxRow } = await supabase
    .from('categoria')
    .select('orden')
    .eq('campeonato_id', campeonatoId)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()

  const orden = (maxRow?.orden ?? -1) + 1

  const { error } = await supabase
    .from('categoria')
    .insert({ campeonato_id: campeonatoId, nombre, orden })

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/campeonatos/${campeonatoId}`)
  redirect(`/admin/campeonatos/${campeonatoId}`)
}

export async function updateCategoria(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const nombre = (formData.get('nombre') as string).trim()

  const { error } = await supabase
    .from('categoria')
    .update({ nombre })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/categorias/${id}`)
  redirect(`/admin/categorias/${id}`)
}

export async function moveCategoria(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const campeonatoId = formData.get('campeonatoId') as string
  const direccion = formData.get('direccion') as 'up' | 'down'

  const { data: cats } = await supabase
    .from('categoria')
    .select('id, orden')
    .eq('campeonato_id', campeonatoId)
    .order('orden')

  if (!cats) { redirect(`/admin/campeonatos/${campeonatoId}`) }

  const idx = cats.findIndex((c) => c.id === id)
  const swapIdx = direccion === 'up' ? idx - 1 : idx + 1

  if (swapIdx < 0 || swapIdx >= cats.length) {
    redirect(`/admin/campeonatos/${campeonatoId}`)
  }

  await Promise.all([
    supabase.from('categoria').update({ orden: cats[swapIdx].orden }).eq('id', cats[idx].id),
    supabase.from('categoria').update({ orden: cats[idx].orden }).eq('id', cats[swapIdx].id),
  ])

  revalidatePath(`/admin/campeonatos/${campeonatoId}`)
  redirect(`/admin/campeonatos/${campeonatoId}`)
}

export async function deleteCategoria(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const campeonatoId = formData.get('campeonatoId') as string

  const { error } = await supabase.from('categoria').delete().eq('id', id)

  if (error?.code === '23503') {
    redirect(`/admin/campeonatos/${campeonatoId}?error=tiene_sesiones`)
  }
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/campeonatos/${campeonatoId}`)
  redirect(`/admin/campeonatos/${campeonatoId}`)
}
