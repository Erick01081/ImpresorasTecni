import { Impresora, EstadoCaso } from '@/types/impresora';
import { createClient } from '@supabase/supabase-js';

const TABLA_IMPRESORAS = 'impresoras';

/**
 * Obtiene el cliente de Supabase si está configurado
 * 
 * Esta función verifica si las variables de entorno de Supabase están configuradas
 * y retorna una instancia del cliente. Si no están configuradas, retorna null.
 * Se utiliza para todas las operaciones de base de datos.
 * 
 * Complejidad: O(1)
 * 
 * @returns Cliente de Supabase o null si no está configurado
 */
function obtenerClienteSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    return createClient(supabaseUrl, supabaseKey);
  }

  return null;
}

/**
 * Lee todas las impresoras desde Supabase
 * 
 * Esta función consulta la tabla de impresoras en Supabase y retorna
 * todas las impresoras ordenadas por fecha de ingreso descendente.
 * 
 * Complejidad: O(n) donde n es el número de impresoras
 * 
 * @returns Array de impresoras ordenadas por fecha de ingreso descendente
 */
export async function leerImpresoras(): Promise<Impresora[]> {
  const supabase = obtenerClienteSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLA_IMPRESORAS)
        .select('*')
        .order('fechaIngreso', { ascending: false });

      if (error) {
        console.error('Error al leer impresoras desde Supabase:', error);
        return [];
      }

      // Asegurar que todas las impresoras tengan numeroCaso
      const impresoras = (data || []).map((imp: any) => ({
        ...imp,
        numeroCaso: imp.numeroCaso || 0, // Valor por defecto si no existe
      })) as Impresora[];

      return impresoras;
    } catch (error) {
      console.error('Error al leer impresoras desde Supabase:', error);
      return [];
    }
  }

  return [];
}

/**
 * Obtiene una impresora por su ID
 * 
 * Esta función busca una impresora específica en la base de datos usando su ID.
 * Útil para operaciones de edición o consulta individual.
 * 
 * Complejidad: O(1) - Consulta indexada por ID
 * 
 * @param id - ID de la impresora a buscar (string)
 * @returns La impresora encontrada o null si no existe (Impresora | null)
 */
export async function obtenerImpresoraPorId(id: string): Promise<Impresora | null> {
  const supabase = obtenerClienteSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLA_IMPRESORAS)
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return null;
      }

      // Asegurar que tenga numeroCaso
      const impresora = {
        ...data,
        numeroCaso: data.numeroCaso || 0,
      } as Impresora;

      return impresora;
    } catch (error) {
      console.error('Error al obtener impresora por ID:', error);
      return null;
    }
  }

  return null;
}

/**
 * Obtiene el siguiente número de caso consecutivo
 * 
 * Esta función consulta la base de datos para obtener el número de caso más alto
 * y retorna el siguiente número consecutivo. Si no hay casos previos, retorna 1.
 * 
 * Complejidad: O(1) - Consulta con ordenamiento y límite
 * 
 * @returns El siguiente número de caso (number)
 */
async function obtenerSiguienteNumeroCaso(): Promise<number> {
  const supabase = obtenerClienteSupabase();

  if (supabase) {
    try {
      // Obtener el número de caso más alto
      const { data, error } = await supabase
        .from(TABLA_IMPRESORAS)
        .select('numeroCaso')
        .order('numeroCaso', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error al obtener siguiente número de caso:', error);
        return 1;
      }

      if (data && data.length > 0 && data[0].numeroCaso) {
        return (data[0].numeroCaso as number) + 1;
      }

      return 1;
    } catch (error) {
      console.error('Error al obtener siguiente número de caso:', error);
      return 1;
    }
  }

  return 1;
}

/**
 * Crea una nueva impresora en la base de datos
 * 
 * Esta función crea un nuevo registro de impresora con los datos proporcionados.
 * La fecha de ingreso se genera automáticamente y el estado inicial es 'pendiente'.
 * El ID se genera usando timestamp y un string aleatorio para garantizar unicidad.
 * Se asigna automáticamente un número de caso consecutivo.
 * 
 * Complejidad: O(1) - Solo realiza una inserción y una consulta MAX
 * 
 * @param referencia - Referencia de la impresora (string)
 * @param cliente - Nombre del cliente (string)
 * @param nitCC - NIT o CC del cliente (string)
 * @param telefono - Teléfono de contacto (string)
 * @param observaciones - Observaciones opcionales (string | undefined)
 * @returns La impresora creada (Impresora)
 */
export async function crearImpresora(
  referencia: string,
  cliente: string,
  nitCC: string,
  telefono: string,
  observaciones?: string
): Promise<Impresora> {
  const numeroCaso = await obtenerSiguienteNumeroCaso();

  const nuevaImpresora: Impresora = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    referencia,
    cliente,
    nitCC,
    telefono,
    observaciones: observaciones || '',
    fechaIngreso: new Date().toISOString(),
    estado: 'pendiente',
    numeroCaso,
  };

  const supabase = obtenerClienteSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLA_IMPRESORAS)
        .insert([nuevaImpresora])
        .select()
        .single();

      if (error) {
        console.error('Error al crear impresora en Supabase:', error);
        throw new Error(`Error de Supabase: ${error.message}`);
      }

      return data as Impresora;
    } catch (error) {
      console.error('Error al crear impresora:', error);
      throw error;
    }
  }

  throw new Error('Supabase no está configurado');
}

/**
 * Actualiza los datos de una impresora
 * 
 * Esta función actualiza los campos editables de una impresora existente.
 * No modifica la fecha de ingreso ni el ID. Permite actualizar cualquier
 * campo excepto los campos protegidos.
 * 
 * Complejidad: O(1) - Solo realiza una actualización
 * 
 * @param id - ID de la impresora a actualizar (string)
 * @param datos - Datos parciales de la impresora a actualizar (Partial<Omit<Impresora, 'id' | 'fechaIngreso'>>)
 * @returns La impresora actualizada o null si no existe (Impresora | null)
 */
export async function actualizarImpresora(
  id: string,
  datos: Partial<Omit<Impresora, 'id' | 'fechaIngreso'>>
): Promise<Impresora | null> {
  const supabase = obtenerClienteSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLA_IMPRESORAS)
        .update(datos)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        console.error('Error al actualizar impresora:', error);
        return null;
      }

      return data as Impresora;
    } catch (error) {
      console.error('Error al actualizar impresora:', error);
      return null;
    }
  }

  return null;
}

/**
 * Cambia el estado de un caso de impresora
 * 
 * Esta función actualiza el estado de una impresora y registra la fecha
 * de actualización. Si el estado es 'resuelto', también registra
 * la fecha de entrega automáticamente.
 * 
 * Complejidad: O(1) - Solo realiza una actualización
 * 
 * @param id - ID de la impresora (string)
 * @param nuevoEstado - Nuevo estado del caso (EstadoCaso)
 * @returns La impresora actualizada o null si no existe (Impresora | null)
 */
export async function cambiarEstadoCaso(
  id: string,
  nuevoEstado: EstadoCaso
): Promise<Impresora | null> {
  const datosActualizacion: Partial<Impresora> = {
    estado: nuevoEstado,
    fechaActualizacionEstado: new Date().toISOString(),
  };

  if (nuevoEstado === 'resuelto') {
    datosActualizacion.fechaEntrega = new Date().toISOString();
  }

  return await actualizarImpresora(id, datosActualizacion);
}

/**
 * Elimina una impresora de la base de datos
 * 
 * Esta función elimina permanentemente un registro de impresora.
 * Se recomienda solicitar confirmación antes de llamar a esta función.
 * 
 * Complejidad: O(1) - Solo realiza una eliminación
 * 
 * @param id - ID de la impresora a eliminar (string)
 * @returns true si se eliminó correctamente, false si no existe o hubo error (boolean)
 */
export async function eliminarImpresora(id: string): Promise<boolean> {
  const supabase = obtenerClienteSupabase();

  if (supabase) {
    try {
      const { error } = await supabase
        .from(TABLA_IMPRESORAS)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error al eliminar impresora en Supabase:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error al eliminar impresora:', error);
      return false;
    }
  }

  return false;
}


