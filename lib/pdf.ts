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
 * Carga una imagen desde una URL y la convierte a base64
 * 
 * Esta función carga una imagen desde una URL y la convierte a formato base64
 * para poder ser utilizada en jsPDF. Si falla la carga, retorna null.
 * 
 * Complejidad: O(1) - Operación asíncrona de carga de imagen
 * 
 * @param url - URL de la imagen a cargar (string)
 * @returns Promise que resuelve con la imagen en base64 o null si falla (Promise<string | null>)
 */
async function cargarImagenBase64(url: string): Promise<string | null> {
  try {
    const respuesta = await fetch(url);
    const blob = await respuesta.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error al cargar imagen:', error);
    return null;
  }
}

/**
 * Agrega el logo al PDF en la posición especificada
 * 
 * Esta función intenta cargar el logo desde /logo.png y agregarlo al PDF.
 * Si no puede cargar el logo, continúa sin él.
 * 
 * Complejidad: O(1) - Operación asíncrona
 * 
 * @param doc - Documento jsPDF
 * @param x - Posición X donde colocar el logo (number)
 * @param y - Posición Y donde colocar el logo (number)
 * @param width - Ancho del logo en puntos (number, opcional, default: 40)
 * @param height - Alto del logo en puntos (number, opcional, default: 20)
 */
async function agregarLogo(doc: jsPDF, x: number, y: number, width: number = 40, height: number = 20): Promise<void> {
  try {
    const logoBase64 = await cargarImagenBase64('/logo.png');
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', x, y, width, height);
    }
  } catch (error) {
    console.error('Error al agregar logo al PDF:', error);
  }
}

/**
 * Genera un PDF inicial de registro de impresora
 * 
 * Esta función crea un documento PDF con todos los datos de la impresora
 * registrada, incluyendo un espacio visible para la firma del cliente.
 * El PDF se genera con formato profesional y legible, con paginación automática
 * si el contenido excede una página. Incluye el número de caso consecutivo y el logo.
 * 
 * Complejidad: O(1) - Operaciones constantes de generación de PDF
 * 
 * @param impresora - Datos de la impresora a incluir en el PDF (Impresora)
 * @returns Promise que resuelve con el Blob del PDF generado (Promise<Blob>)
 */
export async function generarPDFRegistro(impresora: Impresora): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Logo centrado en la parte superior
  const logoWidth = 120;
  const logoHeight = 20;
  const logoX = (pageWidth - logoWidth) / 2; // Centrar horizontalmente
  await agregarLogo(doc, logoX, yPos, logoWidth, logoHeight);
  yPos += logoHeight + 10; // Espacio después del logo

  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('REGISTRO DE INGRESO DE IMPRESORA', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Número de caso
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Número de Caso: ${impresora.numeroCaso}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 8;

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
  yPos += 15;

  // Información de contacto
  yPos = verificarYPaginar(doc, yPos, 20, pageHeight, margin);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const contactoTexto = '601 211-0216    •    57 311-2757417    •    57 321-9671908    •    ventas@tecnirecargas.com    •    www.tecnirecargas.com';
  doc.text(contactoTexto, pageWidth / 2, yPos, { align: 'center' });

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
 * Incluye el número de caso consecutivo y el logo.
 * 
 * Complejidad: O(1) - Operaciones constantes de generación de PDF
 * 
 * @param impresora - Datos completos de la impresora (Impresora)
 * @returns Promise que resuelve con el Blob del PDF generado (Promise<Blob>)
 */
export async function generarPDFEntrega(impresora: Impresora): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Logo centrado en la parte superior
  const logoWidth = 120;
  const logoHeight = 20;
  const logoX = (pageWidth - logoWidth) / 2; // Centrar horizontalmente
  await agregarLogo(doc, logoX, yPos, logoWidth, logoHeight);
  yPos += logoHeight + 10; // Espacio después del logo

  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ACTA DE ENTREGA Y GARANTÍA', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Número de caso
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Número de Caso: ${impresora.numeroCaso}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 8;

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
  yPos += 15;

  // Información de contacto
  yPos = verificarYPaginar(doc, yPos, 20, pageHeight, margin);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const contactoTexto = '601 211-0216    •    57 311-2757417    •    57 321-9671908    •    ventas@tecnirecargas.com, tecnirecargas.com';
  doc.text(contactoTexto, pageWidth / 2, yPos, { align: 'center' });

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
