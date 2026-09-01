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

  const { data: fecha } = await supabase
    .from('fecha')
    .select('numero, nombre, circuito')
    .eq('id', id)
    .single()

  if (!fecha) {
    return new NextResponse('Fecha no encontrada', { status: 404 })
  }

  const { data: preinscripciones } = await supabase
    .from('preinscripcion')
    .select('nombre, apellido, email, telefono, categoria_texto, numero_deseado, equipo, mensaje, estado, created_at')
    .eq('fecha_id', id)
    .order('created_at', { ascending: false })

  const rows: string[] = [
    'Nombre,Apellido,Email,Telefono,Categoria,Numero deseado,Equipo,Mensaje,Estado,Fecha registro',
  ]

  for (const p of preinscripciones ?? []) {
    const esc = (s: string | null) => `"${(s ?? '').replace(/"/g, '""')}"`
    rows.push([
      esc(p.nombre),
      esc(p.apellido),
      esc(p.email),
      esc(p.telefono),
      esc(p.categoria_texto),
      p.numero_deseado?.toString() ?? '',
      esc(p.equipo),
      esc(p.mensaje),
      p.estado,
      new Date(p.created_at).toLocaleDateString('es-AR'),
    ].join(','))
  }

  const csv = rows.join('\n')
  const nombre = fecha.nombre ? `_${fecha.nombre}` : ''
  const filename = `preinscripciones_Fecha${fecha.numero}${nombre}_${fecha.circuito}`
    .replace(/[^a-zA-Z0-9_.-]/g, '_')
    .slice(0, 80) + '.csv'

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
