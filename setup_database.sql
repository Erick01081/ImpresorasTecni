
-- IMPORTANTE: usamos nombres de columnas en camelCase y los dejamos ENTRE COMILLAS
-- para que coincidan EXACTAMENTE con el código TypeScript (Supabase es sensible a mayúsculas/minúsculas).

CREATE TABLE IF NOT EXISTS impresoras (
  id TEXT PRIMARY KEY,
  referencia TEXT NOT NULL,
  cliente TEXT NOT NULL,
  "nitCC" TEXT NOT NULL,
  telefono TEXT NOT NULL,
  observaciones TEXT DEFAULT '',
  "fechaIngreso" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "fechaEntrega" TIMESTAMP WITH TIME ZONE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'resuelto')),
  "fechaActualizacionEstado" TIMESTAMP WITH TIME ZONE,
  "motivoResolucion" TEXT DEFAULT '',
  "descripcionProceso" TEXT DEFAULT '',
  "numeroCaso" INTEGER NOT NULL DEFAULT 1
);

-- Bloque de migración suave: agrega columnas camelCase si la tabla ya existía sin ellas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'impresoras' AND column_name = 'fechaIngreso'
  ) THEN
    ALTER TABLE impresoras ADD COLUMN "fechaIngreso" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'impresoras' AND column_name = 'fechaEntrega'
  ) THEN
    ALTER TABLE impresoras ADD COLUMN "fechaEntrega" TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'impresoras' AND column_name = 'fechaActualizacionEstado'
  ) THEN
    ALTER TABLE impresoras ADD COLUMN "fechaActualizacionEstado" TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'impresoras' AND column_name = 'nitCC'
  ) THEN
    ALTER TABLE impresoras ADD COLUMN "nitCC" TEXT NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'impresoras' AND column_name = 'motivoResolucion'
  ) THEN
    ALTER TABLE impresoras ADD COLUMN "motivoResolucion" TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'impresoras' AND column_name = 'descripcionProceso'
  ) THEN
    ALTER TABLE impresoras ADD COLUMN "descripcionProceso" TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'impresoras' AND column_name = 'numeroCaso'
  ) THEN
    -- Asignar números de caso consecutivos a las impresoras existentes
    ALTER TABLE impresoras ADD COLUMN "numeroCaso" INTEGER DEFAULT 1;
    -- Actualizar casos existentes con números consecutivos basados en fecha de ingreso
    WITH numeradas AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY "fechaIngreso" ASC) as num
      FROM impresoras
    )
    UPDATE impresoras
    SET "numeroCaso" = numeradas.num
    FROM numeradas
    WHERE impresoras.id = numeradas.id;
  END IF;
END $$;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_impresoras_estado ON impresoras(estado);
CREATE INDEX IF NOT EXISTS idx_impresoras_fechaIngreso ON impresoras("fechaIngreso" DESC);
CREATE INDEX IF NOT EXISTS idx_impresoras_cliente ON impresoras(cliente);
CREATE INDEX IF NOT EXISTS idx_impresoras_numeroCaso ON impresoras("numeroCaso" DESC);

-- Habilitar Row Level Security (RLS) - Opcional
-- ALTER TABLE impresoras ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones (ajusta según tus necesidades de seguridad)
-- CREATE POLICY "Permitir todas las operaciones" ON impresoras
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);
