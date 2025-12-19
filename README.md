# Sistema de Gestión de Impresoras - Tecnirecargas

Aplicación web para la gestión completa del ciclo de ingreso y entrega de impresoras para servicio técnico, incluyendo generación de documentos PDF y trazabilidad del caso.

## Características

- ✅ Registro de impresoras con campos obligatorios
- ✅ Generación automática de PDF al registrar
- ✅ Gestión completa de inventario (CRUD)
- ✅ Control de estados del caso (Pendiente, En Proceso, Resuelto)
- ✅ Cierre de caso con PDF final de entrega y garantía
- ✅ Interfaz responsive y moderna
- ✅ Búsqueda y filtrado de impresoras

## Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase (para base de datos)

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
Crear un archivo `.env.local` en la raíz del proyecto con:
```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

3. Configurar la base de datos en Supabase:
Crear una tabla llamada `impresoras` con la siguiente estructura:
```sql
CREATE TABLE impresoras (
  id TEXT PRIMARY KEY,
  referencia TEXT NOT NULL,
  cliente TEXT NOT NULL,
  nitCC TEXT NOT NULL,
  telefono TEXT NOT NULL,
  observaciones TEXT,
  fechaIngreso TIMESTAMP WITH TIME ZONE NOT NULL,
  fechaEntrega TIMESTAMP WITH TIME ZONE,
  estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'en_proceso', 'resuelto')),
  fechaActualizacionEstado TIMESTAMP WITH TIME ZONE
);
```

## Uso

1. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

2. Abrir [http://localhost:3000](http://localhost:3000) en el navegador

## Funcionalidades Principales

### RF1. Registro de Impresoras
- Campos obligatorios: Referencia, Cliente, NIT/CC, Teléfono
- Campo opcional: Observaciones
- Fecha de ingreso generada automáticamente
- Generación automática de PDF al registrar

### RF2. Gestión del Inventario
- Visualización en tabla/tarjetas responsive
- Edición de información
- Eliminación con confirmación
- Cambio de estado del caso

### RF3. Cierre del Caso
- Disponible cuando el estado es "resuelto"
- Genera PDF final con:
  - Datos completos del cliente y la impresora
  - Fecha de entrega
  - Confirmación de recepción
  - Declaración de garantía de 30 días
  - Espacio para firma del cliente

## Estructura del Proyecto

```
impresorasTecni/
├── app/
│   ├── api/
│   │   └── impresoras/
│   │       ├── route.ts          # GET, POST
│   │       └── [id]/route.ts     # GET, PATCH, DELETE
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # Página principal
├── components/
│   ├── FormularioImpresora.tsx   # Modal de crear/editar
│   └── ListaImpresoras.tsx       # Tabla/tarjetas de impresoras
├── lib/
│   ├── database.ts               # Funciones de base de datos
│   └── pdf.ts                    # Generación de PDFs
├── types/
│   └── impresora.ts              # Tipos TypeScript
└── public/
    ├── logo.png
    └── favicon.png
```

## Tecnologías Utilizadas

- **Next.js 14** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **Supabase** - Base de datos
- **jsPDF** - Generación de PDFs

## Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia servidor de producción
- `npm run lint` - Ejecuta el linter

## Notas

- Los PDFs se descargan automáticamente al registrar una impresora y al cerrar un caso
- Los cambios de estado se registran con sello de tiempo
- La interfaz es completamente responsive


