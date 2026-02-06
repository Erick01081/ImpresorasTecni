import { jsPDF } from 'jspdf';
import { Impresora, EstadoCaso } from '@/types/impresora';

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
 * Comprime y redimensiona una imagen usando canvas
 * 
 * Esta función carga una imagen, la redimensiona y comprime para reducir
 * significativamente su tamaño antes de agregarla al PDF.
 * Maneja correctamente imágenes con transparencia reemplazando el fondo
 * transparente con blanco antes de convertir a JPEG.
 * 
 * Complejidad: O(1) - Operación asíncrona de procesamiento de imagen
 * 
 * @param url - URL de la imagen a cargar (string)
 * @param maxWidth - Ancho máximo en píxeles (number, default: 400)
 * @param maxHeight - Alto máximo en píxeles (number, default: 200)
 * @param quality - Calidad de compresión 0-1 (number, default: 0.7)
 * @returns Promise que resuelve con la imagen comprimida en base64 o null si falla (Promise<string | null>)
 */
async function cargarYComprimirImagen(url: string, maxWidth: number = 400, maxHeight: number = 200, quality: number = 0.7): Promise<string | null> {
  try {
    const respuesta = await fetch(url);
    const blob = await respuesta.blob();
    
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        img.onload = () => {
          // Calcular dimensiones manteniendo proporción
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }
          
          // Crear canvas para comprimir
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve(null);
            return;
          }
          
          // Rellenar fondo blanco para manejar transparencia
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          
          // Dibujar imagen redimensionada sobre el fondo blanco
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convertir a base64 con compresión JPEG
          const base64 = canvas.toDataURL('image/jpeg', quality);
          resolve(base64);
        };
        
        img.onerror = () => resolve(null);
        img.src = reader.result as string;
      };
      
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error al cargar y comprimir imagen:', error);
    return null;
  }
}

/**
 * Agrega el logo al PDF en la posición especificada
 * 
 * Esta función intenta cargar el logo desde /logo.png, lo comprime y lo agrega al PDF.
 * La imagen se comprime para reducir significativamente el tamaño del PDF.
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
    // Comprimir imagen con mejor calidad: máximo 400x200 píxeles con calidad 0.8 (80%)
    // Balance entre calidad visual y tamaño del PDF
    // El logo se muestra pequeño (120x20 puntos = ~42x7 mm), pero necesita buena calidad
    const logoBase64 = await cargarYComprimirImagen('/logo.png', 400, 200, 0.8);
    if (logoBase64) {
      // Usar JPEG comprimido en lugar de PNG para reducir tamaño
      doc.addImage(logoBase64, 'JPEG', x, y, width, height);
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
 * El PDF se genera con formato profesional y legible, optimizado para
 * caber siempre en una sola página. Incluye el número de caso consecutivo y el logo.
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
  const logoWidth = 100;
  const logoHeight = 16;
  const logoX = (pageWidth - logoWidth) / 2; // Centrar horizontalmente
  await agregarLogo(doc, logoX, yPos, logoWidth, logoHeight);
  yPos += logoHeight + 6; // Espacio después del logo

  // Título
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('REGISTRO DE INGRESO DE IMPRESORA', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Número de caso
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Número de Caso: ${impresora.numeroCaso}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 6;

  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Información de la impresora
  doc.setFontSize(11);
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
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), margin + 50, yPos);
    yPos += 7;
  });

  // Observaciones si existen (mostrar TODAS las observaciones en una sola página)
  if (impresora.observaciones && impresora.observaciones.trim()) {
    yPos += 3;
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones:', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    
    // Calcular espacio disponible para observaciones
    // Espacio fijo para firma: línea separadora (6) + espacio antes de título (12) + título (10) + 
    // área de firma (25) + espacio después (8) + datos cliente (10) + datos fecha (12) + 
    // línea contacto (8) + contacto (8) = 99 puntos
    // Redondeado a 105 para margen de seguridad
    const ESPACIO_FIRMA = 105;
    const espacioDisponible = pageHeight - margin - yPos - ESPACIO_FIRMA;
    
    // Dividir el texto en líneas usando un ancho fijo
    doc.setFontSize(10);
    const observacionesLines = doc.splitTextToSize(impresora.observaciones, pageWidth - 2 * margin);
    
    // Calcular el alto de línea necesario para que todo quepa
    // Línea de 5pt proporciona buena legibilidad, 4pt es aceptable, 3.5pt es el mínimo legible
    const MIN_LINE_HEIGHT = 3.5; // Mínimo para mantener legibilidad
    let lineHeight = 5;
    let totalHeight = observacionesLines.length * lineHeight;
    
    // Si no cabe con lineHeight de 5, reducir a 4
    if (totalHeight > espacioDisponible) {
      lineHeight = 4;
      totalHeight = observacionesLines.length * lineHeight;
    }
    
    // Si aún no cabe, reducir el tamaño de fuente y ajustar line height dinámicamente
    if (totalHeight > espacioDisponible) {
      doc.setFontSize(9);
      const newLines = doc.splitTextToSize(impresora.observaciones, pageWidth - 2 * margin);
      const calculatedLineHeight = espacioDisponible / newLines.length;
      
      // Verificar que el line height calculado sea legible
      if (calculatedLineHeight >= MIN_LINE_HEIGHT) {
        lineHeight = calculatedLineHeight;
        // Mostrar todas las líneas con el tamaño y espaciado ajustado
        newLines.forEach((line: string) => {
          doc.text(line, margin, yPos);
          yPos += lineHeight;
        });
      } else {
        // Si el texto es extremadamente largo (más de ~175 líneas), usar mínimo legible
        // y aceptar que puede extenderse ligeramente, pero priorizar legibilidad
        lineHeight = MIN_LINE_HEIGHT;
        newLines.forEach((line: string) => {
          doc.text(line, margin, yPos);
          yPos += lineHeight;
        });
      }
    } else {
      // Mostrar todas las líneas con tamaño normal
      observacionesLines.forEach((line: string) => {
        doc.text(line, margin, yPos);
        yPos += lineHeight;
      });
    }
    yPos += 2;
  }

  // Espacio para firma (compacto)
  yPos += 6;
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 12;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('FIRMA DEL CLIENTE', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Área compacta para firma (rectángulo)
  const firmaX = margin + 20;
  const firmaY = yPos;
  const firmaWidth = pageWidth - 2 * margin - 40;
  const firmaHeight = 25; // Espacio compacto para la firma
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(firmaX, firmaY, firmaWidth, firmaHeight);
  yPos += firmaHeight + 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(0, 0, 0);
  doc.text('Nombre del cliente:', margin + 20, yPos);
  doc.text(impresora.cliente, margin + 20, yPos + 5);
  yPos += 10;

  doc.text('Fecha:', margin + 20, yPos);
  doc.text(new Date(impresora.fechaIngreso).toLocaleDateString('es-CO'), margin + 20, yPos + 5);
  yPos += 12;

  // Información de contacto
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;
  
  doc.setFontSize(8);
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
 * Genera un PDF con el listado completo de impresoras
 * 
 * Esta función crea un documento PDF con todas las impresoras del sistema
 * organizadas en formato de tabla legible, mostrando la información clave
 * de cada impresora (referencia, cliente, NIT/CC, teléfono, fecha de ingreso,
 * estado y observaciones). Incluye paginación automática si hay muchas impresoras.
 * 
 * Complejidad: O(n) donde n es el número de impresoras
 * 
 * @param impresoras - Array de impresoras a incluir en el listado (Impresora[])
 * @returns Promise que resuelve con el Blob del PDF generado (Promise<Blob>)
 */
export async function generarPDFListado(impresoras: Impresora[]): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Logo centrado en la parte superior
  const logoWidth = 100;
  const logoHeight = 17;
  const logoX = (pageWidth - logoWidth) / 2;
  await agregarLogo(doc, logoX, yPos, logoWidth, logoHeight);
  yPos += logoHeight + 8;

  // Título
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LISTADO DE IMPRESORAS', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Fecha del reporte
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const fechaReporte = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Fecha del reporte: ${fechaReporte}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;

  // Total de impresoras
  doc.text(`Total de impresoras: ${impresoras.length}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Función auxiliar para obtener el texto del estado
  const obtenerTextoEstado = (estado: EstadoCaso): string => {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_proceso':
        return 'En Proceso';
      case 'resuelto':
        return 'Resuelto';
      default:
        return estado;
    }
  };

  // Recorrer cada impresora y agregarla al PDF
  impresoras.forEach((impresora, index) => {
    // Verificar si necesitamos una nueva página
    // Espacio necesario: título (5) + datos (6*5) + observaciones (variable) + separador (3) = ~40
    const espacioNecesario = 40;
    yPos = verificarYPaginar(doc, yPos, espacioNecesario, pageHeight, margin);

    // Número de caso y referencia
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`#${impresora.numeroCaso} - ${impresora.referencia}`, margin, yPos);
    yPos += 5;

    // Información de la impresora
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const datos = [
      `Cliente: ${impresora.cliente}`,
      `NIT/CC: ${impresora.nitCC}`,
      `Teléfono: ${impresora.telefono}`,
      `Fecha Ingreso: ${new Date(impresora.fechaIngreso).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })}`,
      `Estado: ${obtenerTextoEstado(impresora.estado)}`,
    ];

    datos.forEach((linea) => {
      yPos = verificarYPaginar(doc, yPos, 5, pageHeight, margin);
      doc.text(linea, margin + 3, yPos);
      yPos += 5;
    });

    // Observaciones si existen
    if (impresora.observaciones && impresora.observaciones.trim()) {
      yPos = verificarYPaginar(doc, yPos, 10, pageHeight, margin);
      doc.setFont('helvetica', 'italic');
      const obsTexto = `Observaciones: ${impresora.observaciones}`;
      const obsLines = doc.splitTextToSize(obsTexto, pageWidth - 2 * margin - 6);
      
      obsLines.forEach((line: string) => {
        yPos = verificarYPaginar(doc, yPos, 4, pageHeight, margin);
        doc.text(line, margin + 3, yPos);
        yPos += 4;
      });
      doc.setFont('helvetica', 'normal');
    }

    // Separador entre impresoras (excepto la última)
    if (index < impresoras.length - 1) {
      yPos += 2;
      yPos = verificarYPaginar(doc, yPos, 3, pageHeight, margin);
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;
      doc.setDrawColor(0, 0, 0);
    }
  });

  // Información de contacto al final
  yPos = verificarYPaginar(doc, yPos, 15, pageHeight, margin);
  yPos += 5;
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const contactoTexto = '601 211-0216    •    57 311-2757417    •    57 321-9671908    •    ventas@tecnirecargas.com    •    www.tecnirecargas.com';
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

