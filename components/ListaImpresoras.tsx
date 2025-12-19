'use client';

import { Impresora, EstadoCaso } from '@/types/impresora';

interface ListaImpresorasProps {
  impresoras: Impresora[];
  onEditar: (impresora: Impresora) => void;
  onEliminar: (id: string) => void;
  onCambiarEstado: (id: string, nuevoEstado: EstadoCaso, referencia: string) => void;
  onCerrarCaso: (impresora: Impresora) => void;
}

/**
 * Componente que muestra la lista de impresoras en una tabla
 * 
 * Este componente renderiza todas las impresoras del inventario en formato de tabla,
 * mostrando todos los datos relevantes. Incluye botones para editar, eliminar,
 * cambiar estado y cerrar caso. El diseño es responsivo con vista de tarjetas para móvil
 * y tabla para desktop. Muestra colores diferentes según el estado del caso.
 * 
 * Complejidad: O(n) donde n es el número de impresoras a renderizar
 * 
 * @param impresoras - Array de impresoras a mostrar (Impresora[])
 * @param onEditar - Función que se ejecuta al hacer clic en editar (Impresora) => void
 * @param onEliminar - Función que se ejecuta al hacer clic en eliminar (string) => void
 * @param onCambiarEstado - Función que se ejecuta al cambiar el estado (string, EstadoCaso) => void
 * @param onCerrarCaso - Función que se ejecuta al cerrar un caso (Impresora) => void
 */
export default function ListaImpresoras({
  impresoras,
  onEditar,
  onEliminar,
  onCambiarEstado,
  onCerrarCaso,
}: ListaImpresorasProps) {
  if (impresoras.length === 0) {
    return null;
  }

  /**
   * Obtiene el texto y color del estado
   * Complejidad: O(1)
   */
  const obtenerEstiloEstado = (estado: EstadoCaso): { texto: string; color: string; bgColor: string } => {
    switch (estado) {
      case 'pendiente':
        return { texto: 'Pendiente', color: 'text-yellow-800', bgColor: 'bg-yellow-100' };
      case 'en_proceso':
        return { texto: 'En Proceso', color: 'text-blue-800', bgColor: 'bg-blue-100' };
      case 'resuelto':
        return { texto: 'Resuelto', color: 'text-green-800', bgColor: 'bg-green-100' };
      default:
        return { texto: estado, color: 'text-gray-800', bgColor: 'bg-gray-100' };
    }
  };

  /**
   * Formatea una fecha ISO a formato legible
   * Complejidad: O(1)
   */
  const formatearFecha = (fechaISO: string): string => {
    return new Date(fechaISO).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Vista de tarjetas para móvil */}
      <div className="block md:hidden space-y-4">
        {impresoras.map((impresora) => {
          const estiloEstado = obtenerEstiloEstado(impresora.estado);
          return (
            <div key={impresora.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{impresora.referencia}</h3>
                <p className="text-sm text-gray-600">Cliente: {impresora.cliente}</p>
                <p className="text-sm text-gray-600">NIT/CC: {impresora.nitCC}</p>
                <p className="text-sm text-gray-600">Tel: {impresora.telefono}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Ingreso: {formatearFecha(impresora.fechaIngreso)}
                </p>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Estado</p>
                  <span
                    className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${estiloEstado.color} ${estiloEstado.bgColor}`}
                  >
                    {estiloEstado.texto}
                  </span>
                </div>
              </div>
              {impresora.observaciones && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Observaciones</p>
                  <p className="text-sm text-gray-700">{impresora.observaciones}</p>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onEditar(impresora)}
                  className="w-full text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 px-4 py-2.5 rounded-lg transition-colors font-medium text-sm"
                >
                  Editar
                </button>
                <select
                  value={impresora.estado}
                  onChange={(e) => onCambiarEstado(impresora.id, e.target.value as EstadoCaso, impresora.referencia)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm text-gray-900 bg-white"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="resuelto">Resuelto</option>
                </select>
                {impresora.estado === 'resuelto' && (
                  <button
                    onClick={() => onCerrarCaso(impresora)}
                    className="w-full text-green-700 bg-green-50 hover:bg-green-100 active:bg-green-200 px-4 py-2.5 rounded-lg transition-colors font-medium text-sm"
                  >
                    Cerrar Caso y Generar PDF
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm(`¿Está seguro de eliminar la impresora ${impresora.referencia}?`)) {
                      onEliminar(impresora.id);
                    }
                  }}
                  className="w-full text-red-700 bg-red-50 hover:bg-red-100 active:bg-red-200 px-4 py-2.5 rounded-lg transition-colors font-medium text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vista de tabla para desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NIT/CC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Ingreso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {impresoras.map((impresora) => {
                const estiloEstado = obtenerEstiloEstado(impresora.estado);
                return (
                  <tr key={impresora.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{impresora.referencia}</div>
                      {impresora.observaciones && (
                        <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                          {impresora.observaciones}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{impresora.cliente}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{impresora.nitCC}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{impresora.telefono}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatearFecha(impresora.fechaIngreso)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${estiloEstado.color} ${estiloEstado.bgColor}`}
                      >
                        {estiloEstado.texto}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => onEditar(impresora)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded transition-colors text-xs"
                          title="Editar impresora"
                        >
                          Editar
                        </button>
                        <select
                          value={impresora.estado}
                          onChange={(e) => onCambiarEstado(impresora.id, e.target.value as EstadoCaso, impresora.referencia)}
                          className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs text-gray-900 bg-white"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="en_proceso">En Proceso</option>
                          <option value="resuelto">Resuelto</option>
                        </select>
                        {impresora.estado === 'resuelto' && (
                          <button
                            onClick={() => onCerrarCaso(impresora)}
                            className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded transition-colors text-xs"
                            title="Cerrar caso y generar PDF"
                          >
                            Cerrar Caso
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`¿Está seguro de eliminar ${impresora.referencia}?`)) {
                              onEliminar(impresora.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition-colors text-xs"
                          title="Eliminar impresora"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}


