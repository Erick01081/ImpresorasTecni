import { NextRequest, NextResponse } from 'next/server';
import { leerImpresoras, crearImpresora } from '@/lib/database';

/**
 * Maneja las peticiones GET para obtener todas las impresoras
 * 
 * Esta función retorna todas las impresoras registradas en el sistema,
 * ordenadas por fecha de ingreso descendente.
 * 
 * Complejidad: O(n) donde n es el número de impresoras
 * 
 * @returns Respuesta JSON con array de impresoras
 */
export async function GET(): Promise<NextResponse> {
  try {
    const impresoras = await leerImpresoras();
    return NextResponse.json(impresoras);
  } catch (error) {
    console.error('Error al obtener impresoras:', error);
    return NextResponse.json(
      { error: 'Error al obtener impresoras' },
      { status: 500 }
    );
  }
}

/**
 * Maneja las peticiones POST para crear una nueva impresora
 * 
 * Esta función valida los campos obligatorios y crea un nuevo registro
 * de impresora en la base de datos. Retorna la impresora creada.
 * 
 * Complejidad: O(1) - Solo realiza una inserción
 * 
 * @param request - Objeto de petición con los datos de la impresora
 * @returns Respuesta JSON con la impresora creada o error
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { referencia, cliente, nitCC, telefono, observaciones } = body;

    // Validar campos obligatorios
    if (!referencia || !cliente || !nitCC || !telefono) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: referencia, cliente, nitCC, telefono' },
        { status: 400 }
      );
    }

    const nuevaImpresora = await crearImpresora(
      referencia.trim(),
      cliente.trim(),
      nitCC.trim(),
      telefono.trim(),
      observaciones?.trim() || ''
    );

    return NextResponse.json(nuevaImpresora, { status: 201 });
  } catch (error) {
    console.error('Error al crear impresora:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear impresora' },
      { status: 500 }
    );
  }
}

