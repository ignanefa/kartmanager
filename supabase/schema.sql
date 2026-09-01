-- ================================================================
-- Karting SaaS — Esquema de base de datos + RLS
-- Blueprint §5.2 · MVP
--
-- INSTRUCCIONES:
--   Supabase → SQL Editor → New query → pegá todo esto → Run (F5)
--
-- Una sola pasada sobre una base de datos vacía.
-- ================================================================


-- ----------------------------------------------------------------
-- TABLAS
-- ----------------------------------------------------------------

-- organizacion
-- Tenant raíz. En el MVP hay una sola; el campo organizacion_id
-- en campeonato ya deja el esquema listo para multi-tenant (v1).
CREATE TABLE organizacion (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL    DEFAULT now(),
  nombre     text        NOT NULL
);

-- campeonato  (ej. "PAKO 2026")
CREATE TABLE campeonato (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL    DEFAULT now(),
  organizacion_id uuid        NOT NULL    REFERENCES organizacion(id) ON DELETE RESTRICT,
  nombre          text        NOT NULL,
  anio            int         NOT NULL,
  activo          bool        NOT NULL    DEFAULT true
);

-- categoria  (divisional: "150", "Nenes Prof", etc.)
CREATE TABLE categoria (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL    DEFAULT now(),
  campeonato_id uuid        NOT NULL    REFERENCES campeonato(id)  ON DELETE CASCADE,
  nombre        text        NOT NULL,
  orden         int         NOT NULL    DEFAULT 0
);

-- tipo_carrera  ("Final", "Serie", "Pole", "Clasificación", etc.)
-- Vive al nivel del campeonato: un mismo tipo comparte su tabla de puntos
-- en todas las divisionales. otorga_puntos=false modela sesiones que
-- existen pero no puntúan (ej. Clasificación).
CREATE TABLE tipo_carrera (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL    DEFAULT now(),
  campeonato_id   uuid        NOT NULL    REFERENCES campeonato(id)  ON DELETE CASCADE,
  nombre          text        NOT NULL,
  otorga_puntos   bool        NOT NULL    DEFAULT true,
  orden           int         NOT NULL    DEFAULT 0
);

-- punto_por_posicion  (tabla posición → puntos por tipo de carrera)
-- Posición sin fila aquí = 0 puntos (cubre "solo puntúan los primeros N").
CREATE TABLE punto_por_posicion (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL    DEFAULT now(),
  tipo_carrera_id uuid        NOT NULL    REFERENCES tipo_carrera(id) ON DELETE CASCADE,
  posicion        int         NOT NULL,
  puntos          int         NOT NULL,
  UNIQUE (tipo_carrera_id, posicion)
);

-- piloto  (datos públicos: nombre, número, equipo)
-- Sin login en MVP. Lo crea el organizador.
CREATE TABLE piloto (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL    DEFAULT now(),
  campeonato_id uuid        NOT NULL    REFERENCES campeonato(id)  ON DELETE RESTRICT,
  categoria_id  uuid        NOT NULL    REFERENCES categoria(id)   ON DELETE RESTRICT,
  nombre        text        NOT NULL,
  apellido      text        NOT NULL,
  numero        int         NOT NULL,
  equipo        text,
  UNIQUE (campeonato_id, categoria_id, numero)
);

-- piloto_contacto  (datos personales — solo el organizador puede leer)
-- Relación 1:1 con piloto. RLS bloquea todo acceso anónimo.
CREATE TABLE piloto_contacto (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL    DEFAULT now(),
  piloto_id  uuid        NOT NULL    REFERENCES piloto(id) ON DELETE CASCADE,
  email      text        NOT NULL,
  telefono   text,
  UNIQUE (piloto_id)
);

-- fecha  (ronda / fin de semana de carrera)
-- publicada=false → invisible en el portal público.
CREATE TABLE fecha (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     timestamptz NOT NULL    DEFAULT now(),
  campeonato_id  uuid        NOT NULL    REFERENCES campeonato(id) ON DELETE RESTRICT,
  numero         int         NOT NULL,
  nombre         text,
  circuito       text        NOT NULL,
  fecha_desde    date        NOT NULL,
  fecha_hasta    date,
  cronograma_url text,
  publicada      bool        NOT NULL    DEFAULT false
);

-- sesion  (instancia de un tipo_carrera dentro de una fecha, para una categoría)
-- categoria_id es explícito porque tipo_carrera ya no cuelga de categoria.
-- multiplicador=2 en fechas especiales (decisión D10 del Blueprint).
CREATE TABLE sesion (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL    DEFAULT now(),
  fecha_id        uuid        NOT NULL    REFERENCES fecha(id)        ON DELETE CASCADE,
  categoria_id    uuid        NOT NULL    REFERENCES categoria(id)    ON DELETE RESTRICT,
  tipo_carrera_id uuid        NOT NULL    REFERENCES tipo_carrera(id) ON DELETE RESTRICT,
  multiplicador   numeric     NOT NULL    DEFAULT 1,
  planilla_url    text,
  orden           int         NOT NULL    DEFAULT 0
);

-- resultado  (posición de un piloto en una sesión)
-- Los PUNTOS nunca se guardan acá: se calculan en vista_campeonato.
-- Dos UNIQUE garantizan: un piloto una vez por sesión, una posición por sesión.
CREATE TABLE resultado (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL    DEFAULT now(),
  sesion_id  uuid        NOT NULL    REFERENCES sesion(id)  ON DELETE CASCADE,
  piloto_id  uuid        NOT NULL    REFERENCES piloto(id)  ON DELETE RESTRICT,
  posicion   int         NOT NULL,
  UNIQUE (sesion_id, piloto_id),
  UNIQUE (sesion_id, posicion)
);

-- archivo  (PDFs de reglamentos y otros documentos)
-- fecha_id y categoria_id son opcionales: el archivo puede pertenecer
-- al campeonato en general, a una fecha específica, o a una categoría.
CREATE TABLE archivo (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL    DEFAULT now(),
  campeonato_id uuid        NOT NULL    REFERENCES campeonato(id)  ON DELETE CASCADE,
  fecha_id      uuid                    REFERENCES fecha(id)       ON DELETE CASCADE,
  categoria_id  uuid                    REFERENCES categoria(id)   ON DELETE CASCADE,
  tipo          text        NOT NULL    CHECK (tipo IN ('reglamento', 'otro')),
  nombre        text        NOT NULL,
  url           text        NOT NULL,
  publicado     bool        NOT NULL    DEFAULT false
);

-- noticia  (comunicados y novedades del campeonato)
CREATE TABLE noticia (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL    DEFAULT now(),
  campeonato_id uuid        NOT NULL    REFERENCES campeonato(id) ON DELETE CASCADE,
  titulo        text        NOT NULL,
  cuerpo        text        NOT NULL,
  publicada     bool        NOT NULL    DEFAULT false,
  fecha_pub     timestamptz
);

-- costo  (lista de costos pública: inscripción, neumáticos, etc.)
-- fecha_id opcional: costo puede ser de la temporada o de una fecha puntual.
CREATE TABLE costo (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL    DEFAULT now(),
  campeonato_id uuid        NOT NULL    REFERENCES campeonato(id) ON DELETE CASCADE,
  fecha_id      uuid                    REFERENCES fecha(id)      ON DELETE CASCADE,
  concepto      text        NOT NULL,
  monto         numeric,
  detalle       text
);

-- preinscripcion  (formulario público sin cobro)
-- Cualquier visitante puede INSERT. Solo el organizador puede SELECT.
CREATE TABLE preinscripcion (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL    DEFAULT now(),
  fecha_id        uuid        NOT NULL    REFERENCES fecha(id) ON DELETE CASCADE,
  nombre          text        NOT NULL,
  apellido        text        NOT NULL,
  email           text        NOT NULL,
  telefono        text        NOT NULL,
  categoria_texto text        NOT NULL,
  numero_deseado  int,
  equipo          text,
  mensaje         text,
  estado          text        NOT NULL    DEFAULT 'nuevo'
                              CHECK (estado IN ('nuevo', 'contactado', 'confirmado'))
);


-- ----------------------------------------------------------------
-- VISTA DE CAMPEONATO
-- Calcula puntos al vuelo. Nunca los guarda (decisión D4 del Blueprint).
-- Solo suma resultados de fechas con publicada=true.
-- Fórmula §5.3: otorga_puntos * COALESCE(puntos_posicion, 0) * multiplicador
-- ----------------------------------------------------------------

CREATE OR REPLACE VIEW vista_campeonato AS
SELECT
  p.id            AS piloto_id,
  p.campeonato_id,
  p.categoria_id,
  p.nombre,
  p.apellido,
  p.numero,
  COALESCE(
    SUM(
      CASE
        WHEN f.publicada = true AND tc.otorga_puntos = true
        THEN COALESCE(pp.puntos, 0) * s.multiplicador
        ELSE 0
      END
    ),
    0
  )               AS total_puntos
FROM            piloto              p
LEFT JOIN       resultado           r   ON  r.piloto_id        = p.id
LEFT JOIN       sesion              s   ON  s.id               = r.sesion_id
                                        AND s.categoria_id     = p.categoria_id
LEFT JOIN       fecha               f   ON  f.id               = s.fecha_id
LEFT JOIN       tipo_carrera        tc  ON  tc.id              = s.tipo_carrera_id
LEFT JOIN       punto_por_posicion  pp  ON  pp.tipo_carrera_id = s.tipo_carrera_id
                                        AND pp.posicion        = r.posicion
GROUP BY p.id, p.campeonato_id, p.categoria_id, p.nombre, p.apellido, p.numero
ORDER BY total_puntos DESC;

-- Dar acceso de lectura a la vista a ambos roles (anon y authenticated)
GRANT SELECT ON vista_campeonato TO anon, authenticated;


-- ----------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------

-- Habilitar RLS en las 14 tablas
ALTER TABLE organizacion       ENABLE ROW LEVEL SECURITY;
ALTER TABLE campeonato         ENABLE ROW LEVEL SECURITY;
ALTER TABLE categoria          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipo_carrera       ENABLE ROW LEVEL SECURITY;
ALTER TABLE punto_por_posicion ENABLE ROW LEVEL SECURITY;
ALTER TABLE piloto             ENABLE ROW LEVEL SECURITY;
ALTER TABLE piloto_contacto    ENABLE ROW LEVEL SECURITY;
ALTER TABLE fecha              ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesion             ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultado          ENABLE ROW LEVEL SECURITY;
ALTER TABLE archivo            ENABLE ROW LEVEL SECURITY;
ALTER TABLE noticia            ENABLE ROW LEVEL SECURITY;
ALTER TABLE costo              ENABLE ROW LEVEL SECURITY;
ALTER TABLE preinscripcion     ENABLE ROW LEVEL SECURITY;


-- ── organizacion ─────────────────────────────────────────────────
-- Solo el organizador autenticado puede ver y editar.
-- El rol anon no tiene ninguna política → acceso bloqueado.
CREATE POLICY "org_auth_todo" ON organizacion
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);


-- ── campeonato ───────────────────────────────────────────────────
-- El portal público necesita leer campeonatos para navegar.
CREATE POLICY "campeonato_anon_lee" ON campeonato
  FOR SELECT TO anon USING (true);
CREATE POLICY "campeonato_auth_todo" ON campeonato
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ── categoria ────────────────────────────────────────────────────
CREATE POLICY "categoria_anon_lee" ON categoria
  FOR SELECT TO anon USING (true);
CREATE POLICY "categoria_auth_todo" ON categoria
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ── tipo_carrera ─────────────────────────────────────────────────
CREATE POLICY "tipo_carrera_anon_lee" ON tipo_carrera
  FOR SELECT TO anon USING (true);
CREATE POLICY "tipo_carrera_auth_todo" ON tipo_carrera
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ── punto_por_posicion ───────────────────────────────────────────
CREATE POLICY "ppp_anon_lee" ON punto_por_posicion
  FOR SELECT TO anon USING (true);
CREATE POLICY "ppp_auth_todo" ON punto_por_posicion
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ── piloto ───────────────────────────────────────────────────────
-- nombre, apellido, número y equipo son públicos.
-- Email y teléfono van en piloto_contacto (tabla separada).
CREATE POLICY "piloto_anon_lee" ON piloto
  FOR SELECT TO anon USING (true);
CREATE POLICY "piloto_auth_todo" ON piloto
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ── piloto_contacto ──────────────────────────────────────────────
-- Datos personales. El rol anon NO tiene ninguna política aquí.
-- Acceso bloqueado para visitantes sin login.
CREATE POLICY "contacto_auth_todo" ON piloto_contacto
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ── fecha ────────────────────────────────────────────────────────
-- El público solo ve fechas ya publicadas.
-- El organizador ve y edita todas (incluidas las no publicadas todavía).
CREATE POLICY "fecha_anon_lee_publicadas" ON fecha
  FOR SELECT TO anon USING (publicada = true);
CREATE POLICY "fecha_auth_todo" ON fecha
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ── sesion ───────────────────────────────────────────────────────
-- Las sesiones son públicas. Si la fecha padre no está publicada,
-- el portal la filtra en la app (o no la muestra porque tampoco
-- puede leer la fecha en sí).
CREATE POLICY "sesion_anon_lee" ON sesion
  FOR SELECT TO anon USING (true);
CREATE POLICY "sesion_auth_todo" ON sesion
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ── resultado ────────────────────────────────────────────────────
CREATE POLICY "resultado_anon_lee" ON resultado
  FOR SELECT TO anon USING (true);
CREATE POLICY "resultado_auth_todo" ON resultado
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ── archivo ──────────────────────────────────────────────────────
-- Solo los archivos marcados como publicado=true son visibles al público.
CREATE POLICY "archivo_anon_lee_publicados" ON archivo
  FOR SELECT TO anon USING (publicado = true);
CREATE POLICY "archivo_auth_todo" ON archivo
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ── noticia ──────────────────────────────────────────────────────
CREATE POLICY "noticia_anon_lee_publicadas" ON noticia
  FOR SELECT TO anon USING (publicada = true);
CREATE POLICY "noticia_auth_todo" ON noticia
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ── costo ────────────────────────────────────────────────────────
-- Todos los costos son información pública.
CREATE POLICY "costo_anon_lee" ON costo
  FOR SELECT TO anon USING (true);
CREATE POLICY "costo_auth_todo" ON costo
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ── preinscripcion ───────────────────────────────────────────────
-- El visitante anónimo puede enviar el formulario (INSERT).
-- No puede leer, editar ni borrar ningún registro.
-- El organizador autenticado puede hacer todo.
CREATE POLICY "preinscripcion_anon_inserta" ON preinscripcion
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "preinscripcion_auth_todo" ON preinscripcion
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ================================================================
-- FIN DEL ESQUEMA
-- Próximos pasos:
--   1. Verificar en Table Editor que aparecen las 14 tablas.
--   2. Verificar en Authentication → Policies que cada tabla
--      muestra sus políticas activas.
--   3. Insertar la fila de organizacion (una sola):
--      INSERT INTO organizacion (nombre) VALUES ('PAKO');
-- ================================================================
