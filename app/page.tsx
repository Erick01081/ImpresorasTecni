'use client';

import { useState, useEffect } from 'react';
import { Impresora, EstadoCaso } from '@/types/impresora';
import FormularioImpresora from '@/components/FormularioImpresora';
import ListaImpresoras from '@/components/ListaImpresoras';
import ModalCerrarCaso from '@/components/ModalCerrarCaso';
import ModalEnProceso from '@/components/ModalEnProceso';
import { generarPDFEntrega, descargarPDF } from '@/lib/pdf';

/**
 * Componente principal de la aplicación de gestión de impresoras
 * 
 * Este componente gestiona el estado global de la aplicación, incluyendo la lista
 * de impresoras y el modal para crear/editar. Se encarga de cargar las impresoras
 * desde la API, crear nuevas impresoras, actualizar, eliminar, cambiar estados
 * y cerrar casos con generación de PDF final.
 * 
 * Complejidad: O(n) donde n es el número de impresoras (al cargar y renderizar)
 */
export default function HomePage(): JSX.Element {
  const [impresoras, setImpresoras] = useState<Impresora[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [modalCrearAbierto, setModalCrearAbierto] = useState<boolean>(false);
  const [impresoraEditar, setImpresoraEditar] = useState<Impresora | null>(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoCaso | 'todos'>('todos');
  const [modalCerrarCasoAbierto, setModalCerrarCasoAbierto] = useState<boolean>(false);
  const [impresoraCerrarCaso, setImpresoraCerrarCaso] = useState<Impresora | null>(null);
  const [modalEnProcesoAbierto, setModalEnProcesoAbierto] = useState<boolean>(false);
  const [impresoraEnProceso, setImpresoraEnProceso] = useState<{ id: string; referencia: string } | null>(null);

  /**
   * Carga todas las impresoras desde la API
   * Complejidad: O(1) - Solo realiza una llamada HTTP
   */
  const cargarImpresoras = async (): Promise<void> => {
    try {
      const respuesta = await fetch('/api/impresoras');
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setImpresoras(datos);
      }
    } catch (error) {
      console.error('Error al cargar impresoras:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarImpresoras();
  }, []);

  /**
   * Maneja la edición de una impresora
   * Complejidad: O(1)
   * @param impresora - Impresora a editar
   */
  const manejarEditar = (impresora: Impresora): void => {
    setImpresoraEditar(impresora);
    setModalCrearAbierto(true);
  };

  /**
   * Cierra el modal y limpia el estado de edición
   * Complejidad: O(1)
   */
  const cerrarModal = (): void => {
    setModalCrearAbierto(false);
    setImpresoraEditar(null);
  };

  /**
   * Elimina una impresora del inventario
   * Complejidad: O(1) - Solo realiza una llamada HTTP
   * @param id - ID de la impresora a eliminar
   */
  const manejarEliminar = async (id: string): Promise<void> => {
    try {
      const respuesta = await fetch(`/api/impresoras/${id}`, {
        method: 'DELETE',
      });

      if (respuesta.ok) {
        await cargarImpresoras();
      } else {
        const datos = await respuesta.json();
        alert(datos.error || 'Error al eliminar impresora');
      }
    } catch (error) {
      alert('Error al eliminar impresora');
    }
  };

  /**
   * Cambia el estado de un caso de impresora
   * Complejidad: O(1) - Solo realiza una llamada HTTP
   * @param id - ID de la impresora
   * @param nuevoEstado - Nuevo estado del caso
   * @param referencia - Referencia de la impresora para mostrar en modales
   */
  const manejarCambiarEstado = async (id: string, nuevoEstado: EstadoCaso, referencia: string): Promise<void> => {
    // Si el nuevo estado es "en_proceso", abrir modal para solicitar descripción
    if (nuevoEstado === 'en_proceso') {
      setImpresoraEnProceso({ id, referencia });
      setModalEnProcesoAbierto(true);
      return;
    }

    // Para otros estados, cambiar directamente
    try {
      const respuesta = await fetch(`/api/impresoras/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (respuesta.ok) {
        await cargarImpresoras();
      } else {
        const datos = await respuesta.json();
        alert(datos.error || 'Error al cambiar estado');
      }
    } catch (error) {
      alert('Error al cambiar estado');
    }
  };

  /**
   * Confirma el cambio a estado "en_proceso" con la descripción del proceso
   * Complejidad: O(1) - Solo realiza llamadas HTTP
   * @param descripcionProceso - Descripción del trabajo en proceso
   */
  const manejarConfirmarEnProceso = async (descripcionProceso: string): Promise<void> => {
    if (!impresoraEnProceso) return;

    try {
      // Buscar la impresora en el estado local para obtener las observaciones actuales
      const impresoraActual = impresoras.find(imp => imp.id === impresoraEnProceso.id);
      
      // Si no está en el estado local, obtenerla de la API
      let observacionesExistentes = '';
      if (impresoraActual) {
        observacionesExistentes = impresoraActual.observaciones || '';
      } else {
        const respuestaGet = await fetch(`/api/impresoras/${impresoraEnProceso.id}`);
        if (respuestaGet.ok) {
          const impresoraDesdeAPI = await respuestaGet.json();
          observacionesExistentes = impresoraDesdeAPI.observaciones || '';
        }
      }
      
      // Agregar la nueva descripción al final de las observaciones
      const fechaActual = new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      
      // Concatenar correctamente: si hay observaciones existentes, agregar con salto de línea
      let nuevaObservacion = '';
      if (observacionesExistentes && observacionesExistentes.trim()) {
        nuevaObservacion = `${observacionesExistentes.trim()}\n\n[${fechaActual}] En Proceso: ${descripcionProceso}`;
      } else {
        nuevaObservacion = `[${fechaActual}] En Proceso: ${descripcionProceso}`;
      }

      // Actualizar estado y observaciones
      const respuesta = await fetch(`/api/impresoras/${impresoraEnProceso.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: 'en_proceso',
          observaciones: nuevaObservacion,
        }),
      });

      if (respuesta.ok) {
        await cargarImpresoras();
        setModalEnProcesoAbierto(false);
        setImpresoraEnProceso(null);
      } else {
        const datos = await respuesta.json();
        alert(datos.error || 'Error al cambiar estado');
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar estado');
    }
  };

  /**
   * Abre el modal para cerrar un caso
   * Complejidad: O(1)
   * @param impresora - Impresora cuyo caso se va a cerrar
   */
  const manejarAbrirCerrarCaso = (impresora: Impresora): void => {
    setImpresoraCerrarCaso(impresora);
    setModalCerrarCasoAbierto(true);
  };

  /**
   * Confirma el cierre de caso con el motivo de resolución y genera el PDF
   * Complejidad: O(1) - Solo realiza llamadas HTTP y genera PDF
   * @param motivoResolucion - Motivo de cómo se resolvió el caso
   */
  const manejarConfirmarCerrarCaso = async (motivoResolucion: string): Promise<void> => {
    if (!impresoraCerrarCaso) return;

    try {
      // Asegurar que el estado sea 'resuelto' y guardar el motivo
      const respuesta = await fetch(`/api/impresoras/${impresoraCerrarCaso.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: 'resuelto',
          motivoResolucion: motivoResolucion,
        }),
      });

      if (respuesta.ok) {
        const impresoraActualizada = await respuesta.json();
        await cargarImpresoras();

        // Generar y descargar PDF
        const pdfBlob = await generarPDFEntrega(impresoraActualizada);
        const nombreArchivo = `Entrega_${impresoraActualizada.referencia}_${impresoraActualizada.id}.pdf`;
        descargarPDF(pdfBlob, nombreArchivo);

        // Cerrar modal
        setModalCerrarCasoAbierto(false);
        setImpresoraCerrarCaso(null);
      } else {
        const datos = await respuesta.json();
        alert(datos.error || 'Error al cerrar caso');
      }
    } catch (error) {
      alert('Error al cerrar caso');
    }
  };

  /**
   * Filtra las impresoras según el término de búsqueda y el estado
   * Complejidad: O(n) donde n es el número de impresoras
   * @returns Array de impresoras filtradas
   */
  const impresorasFiltradas = impresoras.filter((impresora) => {
    // Filtro por estado
    if (filtroEstado !== 'todos' && impresora.estado !== filtroEstado) {
      return false;
    }

    // Filtro por término de búsqueda
    if (!terminoBusqueda.trim()) {
      return true;
    }
    const busqueda = terminoBusqueda.toLowerCase().trim();
    return (
      impresora.referencia.toLowerCase().includes(busqueda) ||
      impresora.cliente.toLowerCase().includes(busqueda) ||
      impresora.nitCC.toLowerCase().includes(busqueda) ||
      impresora.telefono.toLowerCase().includes(busqueda)
    );
  });

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <img
              src="/logo.png"
              alt="Logo Tecnirecargas"
              className="h-10 sm:h-16 w-auto flex-shrink-0"
            />
            <h1 className="text-lg sm:text-2xl md:text-4xl font-bold text-gray-800 leading-tight">
              Gestión de Impresoras Tecnirecargas
            </h1>
          </div>
          <button
            onClick={() => {
              setImpresoraEditar(null);
              setModalCrearAbierto(true);
            }}
            className="w-full sm:w-auto bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors font-semibold shadow-md text-base sm:text-lg whitespace-nowrap"
          >
            + Registrar Impresora
          </button>
        </div>

        {/* Buscador y Filtros */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Buscador */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={terminoBusqueda}
                  onChange={(e) => setTerminoBusqueda(e.target.value)}
                  placeholder="Buscar por referencia, cliente, NIT/CC o teléfono..."
                  className="w-full px-4 py-3 pl-10 pr-10 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {terminoBusqueda && (
                  <button
                    onClick={() => setTerminoBusqueda('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Limpiar búsqueda"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Filtro por Estado */}
              <div className="md:w-48">
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value as EstadoCaso | 'todos')}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="resuelto">Resuelto</option>
                </select>
              </div>
            </div>

            {(terminoBusqueda || filtroEstado !== 'todos') && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <p className="text-sm text-gray-600">
                  {impresorasFiltradas.length === 0
                    ? 'No se encontraron impresoras'
                    : `${impresorasFiltradas.length} impresora${impresorasFiltradas.length !== 1 ? 's' : ''} encontrada${impresorasFiltradas.length !== 1 ? 's' : ''}`}
                </p>
                {(terminoBusqueda || filtroEstado !== 'todos') && (
                  <button
                    onClick={() => {
                      setTerminoBusqueda('');
                      setFiltroEstado('todos');
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {impresoras.length === 0 && !terminoBusqueda && filtroEstado === 'todos' ? (
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
            <p className="text-gray-500 text-base sm:text-lg">No hay impresoras registradas</p>
            <p className="text-gray-400 mt-2 text-sm sm:text-base">
              Registra tu primera impresora usando el botón de arriba
            </p>
          </div>
        ) : (
          <ListaImpresoras
            impresoras={impresorasFiltradas}
            onEditar={manejarEditar}
            onEliminar={manejarEliminar}
            onCambiarEstado={manejarCambiarEstado}
            onCerrarCaso={manejarAbrirCerrarCaso}
          />
        )}

        <FormularioImpresora
          abierto={modalCrearAbierto}
          onCerrar={cerrarModal}
          onImpresoraCreada={cargarImpresoras}
          impresoraEditar={impresoraEditar}
        />

        <ModalCerrarCaso
          abierto={modalCerrarCasoAbierto}
          onCerrar={() => {
            setModalCerrarCasoAbierto(false);
            setImpresoraCerrarCaso(null);
          }}
          onConfirmar={manejarConfirmarCerrarCaso}
          referenciaImpresora={impresoraCerrarCaso?.referencia || ''}
        />

        <ModalEnProceso
          abierto={modalEnProcesoAbierto}
          onCerrar={() => {
            setModalEnProcesoAbierto(false);
            setImpresoraEnProceso(null);
          }}
          onConfirmar={manejarConfirmarEnProceso}
          referenciaImpresora={impresoraEnProceso?.referencia || ''}
        />
      </div>
    </div>
  );
}


