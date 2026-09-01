'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCosto(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const campeonatoId = formData.get('campeonatoId') as string
  const concepto = (formData.get('concepto') as string).trim()
  const monto_raw = ((formData.get('monto') as string) ?? '').trim()
  const monto = monto_raw ? parseFloat(monto_raw) : null
  const detalle = ((formData.get('detalle') as string) ?? '').trim() || null

  const { error } = await supabase.from('costo').insert({
    campeonato_id: campeonatoId,
    concepto,
    monto,
    detalle,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/campeonatos/${campeonatoId}/costos`)
  redirect(`/admin/campeonatos/${campeonatoId}/costos`)
}

export async function deleteCosto(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const campeonatoId = formData.get('campeonatoId') as string

  const { error } = await supabase.from('costo').delete().eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/campeonatos/${campeonatoId}/costos`)
  redirect(`/admin/campeonatos/${campeonatoId}/costos`)
}
