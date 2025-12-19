/**
 * Estados posibles de un caso de impresora
 */
export type EstadoCaso = 'pendiente' | 'en_proceso' | 'resuelto';

/**
 * Tipo que representa una impresora en el sistema de gestión
 * 
 * Este tipo contiene toda la información necesaria para el registro,
 * seguimiento y entrega de una impresora en servicio técnico.
 * 
 * @property id - Identificador único de la impresora
 * @property referencia - Referencia o modelo de la impresora
 * @property cliente - Nombre completo del cliente
 * @property nitCC - NIT o Cédula del cliente
 * @property telefono - Teléfono de contacto del cliente
 * @property observaciones - Observaciones adicionales sobre el caso (opcional)
 * @property fechaIngreso - Fecha y hora de ingreso de la impresora (ISO string)
 * @property fechaEntrega - Fecha y hora de entrega de la impresora (ISO string, opcional)
 * @property estado - Estado actual del caso
 * @property fechaActualizacionEstado - Fecha y hora de la última actualización de estado (ISO string, opcional)
 * @property motivoResolucion - Descripción de cómo se resolvió el caso al cerrarlo (opcional)
 * @property descripcionProceso - Descripción del trabajo realizado cuando el estado es "en_proceso" (opcional)
 * @property numeroCaso - Número consecutivo del caso para identificación en documentos (number)
 */
export interface Impresora {
  id: string;
  referencia: string;
  cliente: string;
  nitCC: string;
  telefono: string;
  observaciones?: string;
  fechaIngreso: string;
  fechaEntrega?: string;
  estado: EstadoCaso;
  fechaActualizacionEstado?: string;
  motivoResolucion?: string;
  descripcionProceso?: string;
  numeroCaso: number;
}


