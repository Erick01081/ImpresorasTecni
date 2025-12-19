'use client';

import { useState, useEffect } from 'react';
import { Impresora } from '@/types/impresora';
import { generarPDFRegistro, descargarPDF } from '@/lib/pdf';

interface FormularioImpresoraProps {
  abierto: boolean;
  onCerrar: () => void;
  onImpresoraCreada: () => void;
  impresoraEditar?: Impresora | null;
}

/**
 * Componente modal con formulario para crear o editar una impresora
 * 
 * Este componente muestra un modal que permite al usuario ingresar los datos
 * de una nueva impresora o editar una existente. Valida que todos los campos
 * obligatorios estén completos. Al crear una nueva impresora, genera y descarga
 * automáticamente un PDF de registro. Se cierra automáticamente después de
 * crear o actualizar exitosamente.
 * 
 * Complejidad: O(1) - Operaciones constantes
 * 
 * @param abierto - Indica si el modal está abierto o cerrado (boolean)
 * @param onCerrar - Función que se ejecuta al cerrar el modal (() => void)
 * @param onImpresoraCreada - Función que se ejecuta después de crear/actualizar exitosamente (() => void)
 * @param impresoraEditar - Impresora a editar, null si es creación nueva (Impresora | null | undefined)
 */
export default function FormularioImpresora({
  abierto,
  onCerrar,
  onImpresoraCreada,
  impresoraEditar = null,
}: FormularioImpresoraProps) {
  const [referencia, setReferencia] = useState<string>('');
  const [cliente, setCliente] = useState<string>('');
  const [nitCC, setNitCC] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);

  /**
   * Limpia el formulario cuando se cierra el modal o cambia la impresora a editar
   * Complejidad: O(1)
   */
  useEffect(() => {
    if (!abierto) {
      setReferencia('');
      setCliente('');
      setNitCC('');
      setTelefono('');
      setObservaciones('');
      setError('');
    } else if (impresoraEditar) {
      setReferencia(impresoraEditar.referencia);
      setCliente(impresoraEditar.cliente);
      setNitCC(impresoraEditar.nitCC);
      setTelefono(impresoraEditar.telefono);
      setObservaciones(impresoraEditar.observaciones || '');
      setError('');
    }
  }, [abierto, impresoraEditar]);

  /**
   * Maneja el cierre del modal con la tecla Escape
   * Complejidad: O(1)
   */
  useEffect(() => {
    const manejarEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && abierto) {
        onCerrar();
      }
    };

    window.addEventListener('keydown', manejarEscape);
    return () => window.removeEventListener('keydown', manejarEscape);
  }, [abierto, onCerrar]);

  /**
   * Maneja el envío del formulario para crear o actualizar una impresora
   * Complejidad: O(1) - Solo realiza llamadas HTTP
   */
  const manejarSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');

    // Validar campos obligatorios
    if (!referencia.trim() || !cliente.trim() || !nitCC.trim() || !telefono.trim()) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }

    setCargando(true);

    try {
      if (impresoraEditar) {
        // Actualizar impresora existente
        const respuesta = await fetch(`/api/impresoras/${impresoraEditar.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            referencia: referencia.trim(),
            cliente: cliente.trim(),
            nitCC: nitCC.trim(),
            telefono: telefono.trim(),
            observaciones: observaciones.trim(),
          }),
        });

        if (!respuesta.ok) {
          const datos = await respuesta.json();
          throw new Error(datos.error || 'Error al actualizar impresora');
        }

        onImpresoraCreada();
        onCerrar();
      } else {
        // Crear nueva impresora
        const respuesta = await fetch('/api/impresoras', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            referencia: referencia.trim(),
            cliente: cliente.trim(),
            nitCC: nitCC.trim(),
            telefono: telefono.trim(),
            observaciones: observaciones.trim(),
          }),
        });

        if (!respuesta.ok) {
          const datos = await respuesta.json();
          throw new Error(datos.error || 'Error al crear impresora');
        }

        const nuevaImpresora: Impresora = await respuesta.json();

        // Generar y descargar PDF automáticamente
        const pdfBlob = await generarPDFRegistro(nuevaImpresora);
        const nombreArchivo = `Registro_${nuevaImpresora.referencia}_${nuevaImpresora.id}.pdf`;
        descargarPDF(pdfBlob, nombreArchivo);

        onImpresoraCreada();
        onCerrar();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la solicitud');
    } finally {
      setCargando(false);
    }
  };

  if (!abierto) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800">
          {impresoraEditar ? 'Editar Impresora' : 'Registrar Nueva Impresora'}
        </h2>

        <form onSubmit={manejarSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm sm:text-base">
              Referencia de la Impresora <span className="text-red-500">*</span>:
            </label>
            <input
              type="text"
              value={referencia}
              onChange={(e) => {
                setReferencia(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="Ej: HP LaserJet Pro M404dn"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm sm:text-base">
              Cliente <span className="text-red-500">*</span>:
            </label>
            <input
              type="text"
              value={cliente}
              onChange={(e) => {
                setCliente(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="Ej: Juan Pérez"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm sm:text-base">
              NIT o CC <span className="text-red-500">*</span>:
            </label>
            <input
              type="text"
              value={nitCC}
              onChange={(e) => {
                setNitCC(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="Ej: 1234567890"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm sm:text-base">
              Teléfono de Contacto <span className="text-red-500">*</span>:
            </label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => {
                setTelefono(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="Ej: 3001234567"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm sm:text-base">
              Observaciones (opcional):
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => {
                setObservaciones(e.target.value);
                setError('');
              }}
              rows={3}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white resize-none"
              placeholder="Descripción del problema o detalles adicionales..."
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="w-full sm:w-auto px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 active:bg-gray-400 transition-colors font-medium text-base"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="w-full sm:w-auto px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-base"
            >
              {cargando
                ? impresoraEditar
                  ? 'Actualizando...'
                  : 'Registrando...'
                : impresoraEditar
                  ? 'Actualizar Impresora'
                  : 'Registrar Impresora'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


