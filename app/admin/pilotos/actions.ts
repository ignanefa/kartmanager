'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function createPiloto(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const campeonatoId = formData.get('campeonatoId') as string
  const categoriaId = formData.get('categoriaId') as string
  const nombre = (formData.get('nombre') as string).trim()
  const apellido = (formData.get('apellido') as string).trim()
  const numero = parseInt(formData.get('numero') as string, 10)
  const equipo = ((formData.get('equipo') as string) ?? '').trim() || null
  const email = ((formData.get('email') as string) ?? '').trim()
  const telefono = ((formData.get('telefono') as string) ?? '').trim() || null

  if (email && !EMAIL_REGEX.test(email)) {
    redirect(`/admin/categorias/${categoriaId}?error=email_invalido`)
  }

  const { data: piloto, error } = await supabase
    .from('piloto')
    .insert({ campeonato_id: campeonatoId, categoria_id: categoriaId, nombre, apellido, numero, equipo })
    .select('id')
    .single()

  if (error?.code === '23505') {
    redirect(`/admin/categorias/${categoriaId}?error=numero_duplicado`)
  }
  if (error) throw new Error(error.message)

  if (email) {
    const { error: contactError } = await supabase
      .from('piloto_contacto')
      .insert({ piloto_id: piloto.id, email, telefono })

    if (contactError) throw new Error(contactError.message)
  }

  revalidatePath(`/admin/categorias/${categoriaId}`)
  redirect(`/admin/categorias/${categoriaId}`)
}

export async function updatePiloto(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const nombre = (formData.get('nombre') as string).trim()
  const apellido = (formData.get('apellido') as string).trim()
  const numero = parseInt(formData.get('numero') as string, 10)
  const equipo = ((formData.get('equipo') as string) ?? '').trim() || null
  const email = ((formData.get('email') as string) ?? '').trim()
  const telefono = ((formData.get('telefono') as string) ?? '').trim() || null

  if (email && !EMAIL_REGEX.test(email)) {
    redirect(`/admin/pilotos/${id}?error=email_invalido`)
  }

  const { error } = await supabase
    .from('piloto')
    .update({ nombre, apellido, numero, equipo })
    .eq('id', id)

  if (error?.code === '23505') {
    redirect(`/admin/pilotos/${id}?error=numero_duplicado`)
  }
  if (error) throw new Error(error.message)

  if (email) {
    const { error: contactError } = await supabase
      .from('piloto_contacto')
      .upsert({ piloto_id: id, email, telefono }, { onConflict: 'piloto_id' })

    if (contactError) throw new Error(contactError.message)
  }

  revalidatePath(`/admin/pilotos/${id}`)
  redirect(`/admin/pilotos/${id}`)
}

export async function deletePiloto(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const categoriaId = formData.get('categoriaId') as string

  const { error } = await supabase.from('piloto').delete().eq('id', id)

  if (error?.code === '23503') {
    redirect(`/admin/categorias/${categoriaId}?error=piloto_tiene_resultados`)
  }
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/categorias/${categoriaId}`)
  redirect(`/admin/categorias/${categoriaId}`)
}
