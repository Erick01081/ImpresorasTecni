import { jsPDF } from 'jspdf';
import { Impresora } from '@/types/impresora';

/**
 * Función auxiliar para verificar si se necesita una nueva página y crearla si es necesario
 * 
 * Complejidad: O(1)
 * 
 * @param doc - Documento jsPDF
 * @param yPos - Posición Y actual
 * @param espacioNecesario - Espacio necesario en puntos
 * @param pageHeight - Altura de la página
 * @param margin - Margen inferior
 * @returns Nueva posición Y (puede ser en una nueva página)
 */
function verificarYPaginar(doc: jsPDF, yPos: number, espacioNecesario: number, pageHeight: number, margin: number): number {
  if (yPos + espacioNecesario > pageHeight - margin) {
    doc.addPage();
    return margin;
  }
  return yPos;
}

/**
 * Genera un PDF inicial de registro de impresora
 * 
 * Esta función crea un documento PDF con todos los datos de la impresora
 * registrada, incluyendo un espacio visible para la firma del cliente.
 * El PDF se genera con formato profesional y legible, con paginación automática
 * si el contenido excede una página. Incluye el número de caso consecutivo.
 * 
 * Complejidad: O(1) - Operaciones constantes de generación de PDF
 * 
 * @param impresora - Datos de la impresora a incluir en el PDF (Impresora)
 * @returns Blob del PDF generado (Blob)
 */
export function generarPDFRegistro(impresora: Impresora): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('REGISTRO DE INGRESO DE IMPRESORA', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Número de caso
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Número de Caso: ${impresora.numeroCaso}`, pageWidth - margin, yPos - 10, { align: 'right' });

  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Información de la impresora
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const datos = [
    ['Referencia:', impresora.referencia],
    ['Cliente:', impresora.cliente],
    ['NIT/CC:', impresora.nitCC],
    ['Teléfono:', impresora.telefono],
    ['Fecha de Ingreso:', new Date(impresora.fechaIngreso).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })],
  ];

  datos.forEach(([label, value]) => {
    yPos = verificarYPaginar(doc, yPos, 8, pageHeight, margin);
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), margin + 50, yPos);
    yPos += 8;
  });

  // Observaciones si existen
  if (impresora.observaciones && impresora.observaciones.trim()) {
    yPos = verificarYPaginar(doc, yPos, 20, pageHeight, margin);
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones:', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const observacionesLines = doc.splitTextToSize(impresora.observaciones, pageWidth - 2 * margin);
    
    observacionesLines.forEach((line: string) => {
      yPos = verificarYPaginar(doc, yPos, 6, pageHeight, margin);
      doc.text(line, margin, yPos);
      yPos += 6;
    });
    yPos += 5;
  }

  // Espacio para firma (más grande)
  yPos = verificarYPaginar(doc, yPos, 80, pageHeight, margin);
  yPos += 10;
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 20;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FIRMA DEL CLIENTE', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Área amplia para firma (rectángulo)
  yPos = verificarYPaginar(doc, yPos, 50, pageHeight, margin);
  const firmaX = margin + 20;
  const firmaY = yPos;
  const firmaWidth = pageWidth - 2 * margin - 40;
  const firmaHeight = 35; // Espacio más grande para la firma
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(firmaX, firmaY, firmaWidth, firmaHeight);
  yPos += firmaHeight + 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(0, 0, 0);
  doc.text('Nombre del cliente:', margin + 20, yPos);
  doc.text(impresora.cliente, margin + 20, yPos + 6);
  yPos += 12;

  doc.text('Fecha:', margin + 20, yPos);
  doc.text(new Date(impresora.fechaIngreso).toLocaleDateString('es-CO'), margin + 20, yPos + 6);

  // Generar blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

/**
 * Genera un PDF final de entrega y garantía
 * 
 * Esta función crea un documento PDF completo con los datos del cliente,
 * la impresora, fecha de entrega, confirmación de recepción y declaración
 * de garantía de 30 días. Incluye espacio visible para la firma del cliente.
 * Maneja paginación automática si el contenido excede una página.
 * Incluye el número de caso consecutivo.
 * 
 * Complejidad: O(1) - Operaciones constantes de generación de PDF
 * 
 * @param impresora - Datos completos de la impresora (Impresora)
 * @returns Blob del PDF generado (Blob)
 */
export function generarPDFEntrega(impresora: Impresora): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ACTA DE ENTREGA Y GARANTÍA', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Número de caso
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Número de Caso: ${impresora.numeroCaso}`, pageWidth - margin, yPos - 10, { align: 'right' });

  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Información del cliente y la impresora
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const fechaEntrega = impresora.fechaEntrega 
    ? new Date(impresora.fechaEntrega).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

  const datos = [
    ['Referencia de la Impresora:', impresora.referencia],
    ['Cliente:', impresora.cliente],
    ['NIT/CC:', impresora.nitCC],
    ['Teléfono:', impresora.telefono],
    ['Fecha de Ingreso:', new Date(impresora.fechaIngreso).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })],
    ['Fecha de Entrega:', fechaEntrega],
  ];

  datos.forEach(([label, value]) => {
    yPos = verificarYPaginar(doc, yPos, 8, pageHeight, margin);
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), margin + 60, yPos);
    yPos += 8;
  });

  // Observaciones si existen
  if (impresora.observaciones && impresora.observaciones.trim()) {
    yPos = verificarYPaginar(doc, yPos, 20, pageHeight, margin);
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones:', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const observacionesLines = doc.splitTextToSize(impresora.observaciones, pageWidth - 2 * margin);
    
    observacionesLines.forEach((line: string) => {
      yPos = verificarYPaginar(doc, yPos, 6, pageHeight, margin);
      doc.text(line, margin, yPos);
      yPos += 6;
    });
    yPos += 10;
  }

  // Confirmación de recepción
  yPos = verificarYPaginar(doc, yPos, 30, pageHeight, margin);
  yPos += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIRMACIÓN DE RECEPCIÓN', margin, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const confirmacionTexto = `Por medio del presente documento, ${impresora.cliente} con identificación ${impresora.nitCC}, confirma que ha recibido la impresora ${impresora.referencia} en perfecto estado de funcionamiento y acepta las condiciones de garantía establecidas.`;
  const confirmacionLines = doc.splitTextToSize(confirmacionTexto, pageWidth - 2 * margin);
  
  confirmacionLines.forEach((line: string) => {
    yPos = verificarYPaginar(doc, yPos, 5, pageHeight, margin);
    doc.text(line, margin, yPos);
    yPos += 5;
  });
  yPos += 10;

  // Declaración de garantía
  yPos = verificarYPaginar(doc, yPos, 30, pageHeight, margin);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DECLARACIÓN DE GARANTÍA', margin, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const garantiaTexto = `Se otorga garantía de 30 días calendario sobre el trabajo realizado en la impresora ${impresora.referencia}, contados a partir de la fecha de entrega. Esta garantía cubre los defectos de fabricación o reparación relacionados con el servicio técnico prestado. La garantía no cubre daños causados por mal uso, accidentes, o modificaciones no autorizadas.`;
  const garantiaLines = doc.splitTextToSize(garantiaTexto, pageWidth - 2 * margin);
  
  garantiaLines.forEach((line: string) => {
    yPos = verificarYPaginar(doc, yPos, 5, pageHeight, margin);
    doc.text(line, margin, yPos);
    yPos += 5;
  });
  yPos += 15;

  // Motivo de resolución si existe
  if (impresora.motivoResolucion && impresora.motivoResolucion.trim()) {
    yPos = verificarYPaginar(doc, yPos, 30, pageHeight, margin);
    yPos += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('MOTIVO DE RESOLUCIÓN', margin, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const motivoLines = doc.splitTextToSize(impresora.motivoResolucion, pageWidth - 2 * margin);
    
    motivoLines.forEach((line: string) => {
      yPos = verificarYPaginar(doc, yPos, 5, pageHeight, margin);
      doc.text(line, margin, yPos);
      yPos += 5;
    });
    yPos += 10;
  }

  // Espacio para firma (más grande)
  yPos = verificarYPaginar(doc, yPos, 80, pageHeight, margin);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 20;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FIRMA DEL CLIENTE', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Área amplia para firma (rectángulo)
  yPos = verificarYPaginar(doc, yPos, 50, pageHeight, margin);
  const firmaX = margin + 20;
  const firmaY = yPos;
  const firmaWidth = pageWidth - 2 * margin - 40;
  const firmaHeight = 35; // Espacio más grande para la firma
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(firmaX, firmaY, firmaWidth, firmaHeight);
  yPos += firmaHeight + 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(0, 0, 0);
  doc.text('Nombre del cliente:', margin + 20, yPos);
  doc.text(impresora.cliente, margin + 20, yPos + 6);
  yPos += 12;

  doc.text('Fecha:', margin + 20, yPos);
  doc.text(fechaEntrega, margin + 20, yPos + 6);

  // Generar blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

/**
 * Descarga un PDF desde un Blob
 * 
 * Esta función auxiliar crea un enlace temporal para descargar
 * el PDF generado con un nombre de archivo específico.
 * 
 * Complejidad: O(1)
 * 
 * @param blob - Blob del PDF a descargar (Blob)
 * @param nombreArchivo - Nombre del archivo para la descarga (string)
 */
export function descargarPDF(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
