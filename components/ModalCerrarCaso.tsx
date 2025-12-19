'use client';

import { useState, useEffect } from 'react';

interface ModalCerrarCasoProps {
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: (motivoResolucion: string) => void;
  referenciaImpresora: string;
}

/**
 * Componente modal para capturar el motivo de resolución al cerrar un caso
 * 
 * Este componente muestra un modal que solicita al usuario ingresar una descripción
 * de cómo se resolvió el caso antes de cerrarlo. Valida que el campo no esté vacío
 * antes de permitir la confirmación.
 * 
 * Complejidad: O(1) - Operaciones constantes
 * 
 * @param abierto - Indica si el modal está abierto o cerrado (boolean)
 * @param onCerrar - Función que se ejecuta al cerrar el modal (() => void)
 * @param onConfirmar - Función que se ejecuta al confirmar con el motivo (string) => void
 * @param referenciaImpresora - Referencia de la impresora para mostrar en el título (string)
 */
export default function ModalCerrarCaso({
  abierto,
  onCerrar,
  onConfirmar,
  referenciaImpresora,
}: ModalCerrarCasoProps) {
  const [motivoResolucion, setMotivoResolucion] = useState<string>('');
  const [error, setError] = useState<string>('');

  /**
   * Limpia el formulario cuando se cierra el modal
   * Complejidad: O(1)
   */
  useEffect(() => {
    if (!abierto) {
      setMotivoResolucion('');
      setError('');
    }
  }, [abierto]);

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
   * Maneja la confirmación del cierre de caso
   * Complejidad: O(1)
   */
  const manejarConfirmar = (): void => {
    if (!motivoResolucion.trim()) {
      setError('Por favor ingrese el motivo de resolución del caso');
      return;
    }

    onConfirmar(motivoResolucion.trim());
    setMotivoResolucion('');
    setError('');
  };

  if (!abierto) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800">
          Cerrar Caso - {referenciaImpresora}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm sm:text-base">
              Motivo de Resolución <span className="text-red-500">*</span>:
            </label>
            <textarea
              value={motivoResolucion}
              onChange={(e) => {
                setMotivoResolucion(e.target.value);
                setError('');
              }}
              rows={6}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white resize-none"
              placeholder="Describa cómo se resolvió el caso, qué se reparó, qué se reemplazó, etc..."
              required
              autoFocus
            />
            <p className="mt-2 text-xs text-gray-500">
              Este motivo se incluirá en el PDF de entrega y quedará registrado en el historial del caso.
            </p>
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
              type="button"
              onClick={manejarConfirmar}
              className="w-full sm:w-auto px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors font-medium text-base"
            >
              Confirmar y Generar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


