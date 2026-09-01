import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: campeonato }, { data: categorias }, { data: clasificacion }] = await Promise.all([
    supabase.from('campeonato').select('nombre, anio').eq('id', id).single(),
    supabase.from('categoria').select('id, nombre').eq('campeonato_id', id).order('orden').order('nombre'),
    supabase
      .from('vista_campeonato')
      .select('piloto_id, categoria_id, nombre, apellido, numero, total_puntos')
      .eq('campeonato_id', id),
  ])

  if (!campeonato) {
    return new NextResponse('Campeonato no encontrado', { status: 404 })
  }

  const rows: string[] = [
    'Categoria,Posicion,Numero,Nombre,Apellido,Puntos',
  ]

  for (const cat of categorias ?? []) {
    const pilotos = (clasificacion ?? [])
      .filter((p) => p.categoria_id === cat.id)
      .sort((a, b) => Number(b.total_puntos) - Number(a.total_puntos))

    pilotos.forEach((p, i) => {
      const nombre = `"${p.nombre.replace(/"/g, '""')}"`
      const apellido = `"${p.apellido.replace(/"/g, '""')}"`
      const categoria = `"${cat.nombre.replace(/"/g, '""')}"`
      rows.push(`${categoria},${i + 1},${p.numero},${nombre},${apellido},${Number(p.total_puntos)}`)
    })
  }

  const csv = rows.join('\n')
  const filename = `clasificacion_${campeonato.nombre}_${campeonato.anio}.csv`
    .replace(/[^a-zA-Z0-9_.-]/g, '_')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
