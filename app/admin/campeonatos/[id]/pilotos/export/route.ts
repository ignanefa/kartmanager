import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: campeonato } = await supabase
    .from('campeonato')
    .select('nombre, anio')
    .eq('id', id)
    .single()

  if (!campeonato) {
    return new NextResponse('Campeonato no encontrado', { status: 404 })
  }

  const [{ data: pilotos }, { data: contactos }] = await Promise.all([
    supabase
      .from('piloto')
      .select('id, nombre, apellido, numero, equipo, categoria:categoria_id(nombre)')
      .eq('campeonato_id', id)
      .order('numero'),
    supabase
      .from('piloto_contacto')
      .select('piloto_id, email, telefono'),
  ])

  const contactoMap = Object.fromEntries(
    (contactos ?? []).map((c) => [c.piloto_id, { email: c.email, telefono: c.telefono }])
  )

  const rows: string[] = [
    'Numero,Nombre,Apellido,Equipo,Categoria,Email,Telefono',
  ]

  for (const p of pilotos ?? []) {
    const cat = p.categoria as unknown as { nombre: string }
    const contacto = contactoMap[p.id] ?? { email: null, telefono: null }
    const esc = (s: string | null) => `"${(s ?? '').replace(/"/g, '""')}"`
    rows.push([
      p.numero,
      esc(p.nombre),
      esc(p.apellido),
      esc(p.equipo),
      esc(cat?.nombre ?? ''),
      esc(contacto.email),
      esc(contacto.telefono),
    ].join(','))
  }

  const csv = rows.join('\n')
  const filename = `pilotos_${campeonato.nombre}_${campeonato.anio}`
    .replace(/[^a-zA-Z0-9_.-]/g, '_')
    .slice(0, 80) + '.csv'

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
