import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoice = (saleData, businessInfo = {}) => {
  const doc = new jsPDF();
  
  // Configuración de la página
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;
  
  // Información del negocio
  if (businessInfo.name) {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(businessInfo.name, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
  }
  
  if (businessInfo.address) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(businessInfo.address, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
  }
  
  if (businessInfo.phone || businessInfo.email) {
    const contactInfo = [];
    if (businessInfo.phone) contactInfo.push(`Tel: ${businessInfo.phone}`);
    if (businessInfo.email) contactInfo.push(`Email: ${businessInfo.email}`);
    doc.text(contactInfo.join(' | '), pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
  }
  
  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;
  
  // Título de la factura
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;
  
  // Información de la venta
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const saleDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  doc.text(`Fecha: ${saleDate}`, margin, yPosition);
  doc.text(`Método de Pago: ${saleData.paymentMethod}`, pageWidth - margin - 60, yPosition);
  yPosition += 10;
  
  doc.text(`Factura #: ${Date.now()}`, margin, yPosition);
  if (businessInfo.rfc) {
    doc.text(`RFC: ${businessInfo.rfc}`, pageWidth - margin - 40, yPosition);
  }
  yPosition += 20;
  
  // Tabla de productos
  const tableData = saleData.items.map(item => [
    item.name,
    item.quantity.toString(),
    `$${item.price.toFixed(2)}`,
    `$${(item.price * item.quantity).toFixed(2)}`
  ]);
  
  // Agregar filas de totales
  tableData.push(['', '', 'Subtotal:', `$${saleData.subtotal.toFixed(2)}`]);
  if (saleData.tax > 0) {
    tableData.push(['', '', `${businessInfo.taxName || 'IVA'} (${((saleData.tax / saleData.subtotal) * 100).toFixed(0)}%):`, `$${saleData.tax.toFixed(2)}`]);
  }
  tableData.push(['', '', 'Total:', `$${saleData.total.toFixed(2)}`]);
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Producto', 'Cantidad', 'Precio Unit.', 'Total']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 80 }, // Producto
      1: { cellWidth: 25, halign: 'center' }, // Cantidad
      2: { cellWidth: 30, halign: 'right' }, // Precio Unit.
      3: { cellWidth: 30, halign: 'right' } // Total
    },
    margin: { left: margin, right: margin }
  });
  
  // Posición después de la tabla (aproximada)
  const finalY = yPosition + (tableData.length * 15) + 40;
  
  // Información adicional
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('¡Gracias por su compra!', pageWidth / 2, finalY, { align: 'center' });
  
  // Pie de página
  const footerY = doc.internal.pageSize.height - 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Esta factura fue generada automáticamente por el sistema POS', pageWidth / 2, footerY, { align: 'center' });
  
  return doc;
};

export const downloadInvoice = (saleData, businessInfo = {}) => {
  const doc = generateInvoice(saleData, businessInfo);
  const fileName = `factura_${Date.now()}.pdf`;
  doc.save(fileName);
};

export const printInvoice = (saleData, businessInfo = {}) => {
  const doc = generateInvoice(saleData, businessInfo);
  doc.autoPrint();
  doc.output('dataurlnewwindow');
};
