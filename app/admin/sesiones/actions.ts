'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveResultados(
  sesionId: string,
  rows: { piloto_id: string; posicion: number }[]
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error: delError } = await supabase
    .from('resultado')
    .delete()
    .eq('sesion_id', sesionId)

  if (delError) return { error: delError.message }

  if (rows.length > 0) {
    const { error: insError } = await supabase.from('resultado').insert(
      rows.map((r) => ({ sesion_id: sesionId, piloto_id: r.piloto_id, posicion: r.posicion }))
    )
    if (insError) return { error: insError.message }
  }

  revalidatePath(`/admin/sesiones/${sesionId}`)
  return {}
}

export async function createSesion(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const fechaId = formData.get('fechaId') as string
  const categoriaId = formData.get('categoriaId') as string
  const tipoCarreraId = formData.get('tipoCarreraId') as string
  const multiplicador = parseFloat(formData.get('multiplicador') as string) || 1
  const planilla_url = ((formData.get('planilla_url') as string) ?? '').trim() || null

  const { data: maxRow } = await supabase
    .from('sesion')
    .select('orden')
    .eq('fecha_id', fechaId)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()

  const orden = (maxRow?.orden ?? -1) + 1

  const { data, error } = await supabase
    .from('sesion')
    .insert({
      fecha_id: fechaId,
      categoria_id: categoriaId,
      tipo_carrera_id: tipoCarreraId,
      multiplicador,
      planilla_url,
      orden,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/fechas/${fechaId}`)
  redirect(`/admin/sesiones/${data.id}`)
}

export async function updateSesion(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const fechaId = formData.get('fechaId') as string
  const multiplicador = parseFloat(formData.get('multiplicador') as string) || 1
  const planilla_url = ((formData.get('planilla_url') as string) ?? '').trim() || null

  const { error } = await supabase
    .from('sesion')
    .update({ multiplicador, planilla_url })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/sesiones/${id}`)
  revalidatePath(`/admin/fechas/${fechaId}`)
  redirect(`/admin/sesiones/${id}`)
}

export async function deleteSesion(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const fechaId = formData.get('fechaId') as string

  const { error } = await supabase.from('sesion').delete().eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/fechas/${fechaId}`)
  redirect(`/admin/fechas/${fechaId}`)
}
