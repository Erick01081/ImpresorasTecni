import { NextRequest, NextResponse } from 'next/server';
import {
  obtenerImpresoraPorId,
  actualizarImpresora,
  eliminarImpresora,
  cambiarEstadoCaso,
} from '@/lib/database';
import { EstadoCaso } from '@/types/impresora';

/**
 * Maneja las peticiones GET para obtener una impresora por ID
 * 
 * Esta función busca y retorna una impresora específica usando su ID.
 * 
 * Complejidad: O(1) - Consulta indexada por ID
 * 
 * @param request - Objeto de petición
 * @param params - Parámetros de la ruta que incluyen el ID
 * @returns Respuesta JSON con la impresora o error 404
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const impresora = await obtenerImpresoraPorId(params.id);

    if (!impresora) {
      return NextResponse.json(
        { error: 'Impresora no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(impresora);
  } catch (error) {
    console.error('Error al obtener impresora:', error);
    return NextResponse.json(
      { error: 'Error al obtener impresora' },
      { status: 500 }
    );
  }
}

/**
 * Maneja las peticiones PATCH para actualizar una impresora
 * 
 * Esta función permite actualizar los datos de una impresora existente.
 * Valida que los campos obligatorios estén presentes si se envían.
 * 
 * Complejidad: O(1) - Solo realiza una actualización
 * 
 * @param request - Objeto de petición con los datos a actualizar
 * @param params - Parámetros de la ruta que incluyen el ID
 * @returns Respuesta JSON con la impresora actualizada o error
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { referencia, cliente, nitCC, telefono, observaciones, estado, motivoResolucion, descripcionProceso } = body;

    // Validar que exista la impresora
    const impresoraExistente = await obtenerImpresoraPorId(params.id);
    if (!impresoraExistente) {
      return NextResponse.json(
        { error: 'Impresora no encontrada' },
        { status: 404 }
      );
    }

    // Si se envía estado, usar la función específica para cambiar estado
    if (estado && ['pendiente', 'en_proceso', 'resuelto'].includes(estado)) {
      const impresoraActualizada = await cambiarEstadoCaso(params.id, estado as EstadoCaso);
      if (!impresoraActualizada) {
        return NextResponse.json(
          { error: 'Error al actualizar estado' },
          { status: 500 }
        );
      }
      
      // Si también se envía motivoResolucion, descripcionProceso u observaciones, actualizarlos
      const datosAdicionales: any = {};
      if (motivoResolucion !== undefined) {
        datosAdicionales.motivoResolucion = motivoResolucion.trim();
      }
      if (descripcionProceso !== undefined) {
        datosAdicionales.descripcionProceso = descripcionProceso.trim();
      }
      if (observaciones !== undefined) {
        datosAdicionales.observaciones = observaciones;
      }
      
      if (Object.keys(datosAdicionales).length > 0) {
        const impresoraCompleta = await actualizarImpresora(params.id, datosAdicionales);
        if (impresoraCompleta) {
          return NextResponse.json(impresoraCompleta);
        }
      }
      
      return NextResponse.json(impresoraActualizada);
    }

    // Validar campos obligatorios si se están actualizando
    const datosActualizacion: any = {};
    if (referencia !== undefined) {
      if (!referencia.trim()) {
        return NextResponse.json(
          { error: 'La referencia no puede estar vacía' },
          { status: 400 }
        );
      }
      datosActualizacion.referencia = referencia.trim();
    }
    if (cliente !== undefined) {
      if (!cliente.trim()) {
        return NextResponse.json(
          { error: 'El cliente no puede estar vacío' },
          { status: 400 }
        );
      }
      datosActualizacion.cliente = cliente.trim();
    }
    if (nitCC !== undefined) {
      if (!nitCC.trim()) {
        return NextResponse.json(
          { error: 'El NIT/CC no puede estar vacío' },
          { status: 400 }
        );
      }
      datosActualizacion.nitCC = nitCC.trim();
    }
    if (telefono !== undefined) {
      if (!telefono.trim()) {
        return NextResponse.json(
          { error: 'El teléfono no puede estar vacío' },
          { status: 400 }
        );
      }
      datosActualizacion.telefono = telefono.trim();
    }
    if (observaciones !== undefined) {
      datosActualizacion.observaciones = observaciones?.trim() || '';
    }
    if (motivoResolucion !== undefined) {
      datosActualizacion.motivoResolucion = motivoResolucion?.trim() || '';
    }
    if (descripcionProceso !== undefined) {
      datosActualizacion.descripcionProceso = descripcionProceso?.trim() || '';
    }

    const impresoraActualizada = await actualizarImpresora(params.id, datosActualizacion);

    if (!impresoraActualizada) {
      return NextResponse.json(
        { error: 'Error al actualizar impresora' },
        { status: 500 }
      );
    }

    return NextResponse.json(impresoraActualizada);
  } catch (error) {
    console.error('Error al actualizar impresora:', error);
    return NextResponse.json(
      { error: 'Error al actualizar impresora' },
      { status: 500 }
    );
  }
}

/**
 * Maneja las peticiones DELETE para eliminar una impresora
 * 
 * Esta función elimina permanentemente un registro de impresora.
 * Se recomienda solicitar confirmación antes de llamar a esta función.
 * 
 * Complejidad: O(1) - Solo realiza una eliminación
 * 
 * @param request - Objeto de petición
 * @param params - Parámetros de la ruta que incluyen el ID
 * @returns Respuesta JSON con confirmación o error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const exito = await eliminarImpresora(params.id);

    if (!exito) {
      return NextResponse.json(
        { error: 'Impresora no encontrada o error al eliminar' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Impresora eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar impresora:', error);
    return NextResponse.json(
      { error: 'Error al eliminar impresora' },
      { status: 500 }
    );
  }
}

