'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createTipoCarrera(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const campeonatoId = formData.get('campeonatoId') as string
  const nombre = (formData.get('nombre') as string).trim()
  const otorga_puntos = formData.get('otorga_puntos') === 'on'

  const { data: maxRow } = await supabase
    .from('tipo_carrera')
    .select('orden')
    .eq('campeonato_id', campeonatoId)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()

  const orden = (maxRow?.orden ?? -1) + 1

  const { error } = await supabase
    .from('tipo_carrera')
    .insert({ campeonato_id: campeonatoId, nombre, otorga_puntos, orden })

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/campeonatos/${campeonatoId}`)
  redirect(`/admin/campeonatos/${campeonatoId}`)
}

export async function updateTipoCarrera(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const campeonatoId = formData.get('campeonatoId') as string
  const nombre = (formData.get('nombre') as string).trim()
  const otorga_puntos = formData.get('otorga_puntos') === 'on'

  const { error } = await supabase
    .from('tipo_carrera')
    .update({ nombre, otorga_puntos })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/tipos-carrera/${id}`)
  redirect(`/admin/tipos-carrera/${id}`)
}

export async function moveTipoCarrera(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const campeonatoId = formData.get('campeonatoId') as string
  const direccion = formData.get('direccion') as 'up' | 'down'

  const { data: tipos } = await supabase
    .from('tipo_carrera')
    .select('id, orden')
    .eq('campeonato_id', campeonatoId)
    .order('orden')

  if (!tipos) { redirect(`/admin/campeonatos/${campeonatoId}`) }

  const idx = tipos.findIndex((t) => t.id === id)
  const swapIdx = direccion === 'up' ? idx - 1 : idx + 1

  if (swapIdx < 0 || swapIdx >= tipos.length) {
    redirect(`/admin/campeonatos/${campeonatoId}`)
  }

  await Promise.all([
    supabase.from('tipo_carrera').update({ orden: tipos[swapIdx].orden }).eq('id', tipos[idx].id),
    supabase.from('tipo_carrera').update({ orden: tipos[idx].orden }).eq('id', tipos[swapIdx].id),
  ])

  revalidatePath(`/admin/campeonatos/${campeonatoId}`)
  redirect(`/admin/campeonatos/${campeonatoId}`)
}

export async function deleteTipoCarrera(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const campeonatoId = formData.get('campeonatoId') as string

  const { error } = await supabase.from('tipo_carrera').delete().eq('id', id)

  if (error?.code === '23503') {
    redirect(`/admin/campeonatos/${campeonatoId}?error=tipo_tiene_sesiones`)
  }
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/campeonatos/${campeonatoId}`)
  redirect(`/admin/campeonatos/${campeonatoId}`)
}

export async function savePuntos(
  tipoCarreraId: string,
  rows: { posicion: number; puntos: number }[]
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error: delError } = await supabase
    .from('punto_por_posicion')
    .delete()
    .eq('tipo_carrera_id', tipoCarreraId)

  if (delError) return { error: delError.message }

  if (rows.length > 0) {
    const { error: insError } = await supabase.from('punto_por_posicion').insert(
      rows.map((r) => ({
        tipo_carrera_id: tipoCarreraId,
        posicion: r.posicion,
        puntos: r.puntos,
      }))
    )
    if (insError) return { error: insError.message }
  }

  revalidatePath(`/admin/tipos-carrera/${tipoCarreraId}`)
  return {}
}
