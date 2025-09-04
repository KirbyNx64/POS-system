import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { displayCurrency } from './formatPrice';

// Función para generar PDF de reporte de ventas
export const generateSalesReportPDF = (salesData, businessInfo = {}) => {
  const doc = new jsPDF();
  
  // Configuración de la página
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  
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
  
  // Título del reporte
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DE VENTAS', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;
  
  // Información del período
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const reportDate = format(new Date(), 'dd/MM/yyyy HH:mm');
  doc.text(`Fecha del reporte: ${reportDate}`, margin, yPosition);
  doc.text(`Período: ${salesData.dateFrom} - ${salesData.dateTo}`, pageWidth - margin - 60, yPosition);
  yPosition += 20;
  
  // Estadísticas generales
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN GENERAL', margin, yPosition);
  yPosition += 15;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const stats = [
    [`Total de ventas:`, `${salesData.stats.totalSales} transacciones`],
    [`Ingresos totales:`, displayCurrency(salesData.stats.totalRevenue)],
    [`Artículos vendidos:`, `${salesData.stats.totalItems} unidades`],
    [`Venta promedio:`, displayCurrency(salesData.stats.averageSale)]
  ];
  
  stats.forEach(([label, value]) => {
    doc.text(label, margin, yPosition);
    doc.text(value, pageWidth - margin - 80, yPosition);
    yPosition += 8;
  });
  
  yPosition += 10;
  
  // Productos más vendidos
  if (salesData.topProducts && salesData.topProducts.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCTOS MÁS VENDIDOS', margin, yPosition);
    yPosition += 15;
    
    const tableData = salesData.topProducts.map(([productId, data], index) => [
      `${index + 1}. ${data.name}`,
      data.quantity.toString(),
      displayCurrency(data.revenue)
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Producto', 'Cantidad', 'Ingresos']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 4
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 100 }, // Producto
        1: { cellWidth: 30, halign: 'center' }, // Cantidad
        2: { cellWidth: 35, halign: 'right' } // Ingresos
      },
      margin: { left: margin, right: margin }
    });
    
    yPosition = doc.lastAutoTable.finalY + 15;
  }
  
  // Ventas por categoría
  if (salesData.categoryStats && Object.keys(salesData.categoryStats).length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('VENTAS POR CATEGORÍA', margin, yPosition);
    yPosition += 15;
    
    const categoryData = Object.entries(salesData.categoryStats)
      .sort(([,a], [,b]) => b.revenue - a.revenue)
      .map(([category, data]) => [
        category,
        data.sales.toString(),
        displayCurrency(data.revenue)
      ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Categoría', 'Ventas', 'Ingresos']],
      body: categoryData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 4
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 80 }, // Categoría
        1: { cellWidth: 30, halign: 'center' }, // Ventas
        2: { cellWidth: 35, halign: 'right' } // Ingresos
      },
      margin: { left: margin, right: margin }
    });
    
    yPosition = doc.lastAutoTable.finalY + 15;
  }
  
  // Pie de página
  const footerY = doc.internal.pageSize.height - 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Este reporte fue generado automáticamente por el sistema POS', pageWidth / 2, footerY, { align: 'center' });
  
  return doc;
};

// Función para generar PDF de reporte de inventario
export const generateInventoryReportPDF = (inventoryData, businessInfo = {}) => {
  const doc = new jsPDF();
  
  // Configuración de la página
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  
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
  
  // Título del reporte
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DE INVENTARIO', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;
  
  // Información del reporte
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const reportDate = format(new Date(), 'dd/MM/yyyy HH:mm');
  doc.text(`Fecha del reporte: ${reportDate}`, margin, yPosition);
  if (inventoryData.selectedCategory) {
    doc.text(`Categoría: ${inventoryData.selectedCategory}`, pageWidth - margin - 60, yPosition);
  }
  yPosition += 20;
  
  // Estadísticas generales
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN GENERAL', margin, yPosition);
  yPosition += 15;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const stats = [
    [`Total de productos:`, `${inventoryData.stats.totalProducts} artículos`],
    [`Valor del inventario:`, displayCurrency(inventoryData.stats.totalValue)],
    [`Productos sin stock:`, `${inventoryData.stats.outOfStock} artículos`],
    [`Productos con stock bajo:`, `${inventoryData.stats.lowStock} artículos`]
  ];
  
  stats.forEach(([label, value]) => {
    doc.text(label, margin, yPosition);
    doc.text(value, pageWidth - margin - 80, yPosition);
    yPosition += 8;
  });
  
  yPosition += 10;
  
  // Tabla de inventario
  if (inventoryData.products && inventoryData.products.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE INVENTARIO', margin, yPosition);
    yPosition += 15;
    
    const tableData = inventoryData.products.map(product => [
      product.name,
      product.category || 'Sin categoría',
      product.stock.toString(),
      displayCurrency(product.price),
      displayCurrency(product.value),
      product.status
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Producto', 'Categoría', 'Stock', 'Precio', 'Valor', 'Estado']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 50 }, // Producto
        1: { cellWidth: 30 }, // Categoría
        2: { cellWidth: 20, halign: 'center' }, // Stock
        3: { cellWidth: 25, halign: 'right' }, // Precio
        4: { cellWidth: 25, halign: 'right' }, // Valor
        5: { cellWidth: 25, halign: 'center' } // Estado
      },
      margin: { left: margin, right: margin }
    });
  }
  
  // Pie de página
  const footerY = doc.internal.pageSize.height - 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Este reporte fue generado automáticamente por el sistema POS', pageWidth / 2, footerY, { align: 'center' });
  
  return doc;
};

// Función para descargar reporte de ventas
export const downloadSalesReport = (salesData, businessInfo = {}) => {
  const doc = generateSalesReportPDF(salesData, businessInfo);
  const fileName = `reporte_ventas_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`;
  doc.save(fileName);
};

// Función para generar PDF de reporte de ventas totales (detallado)
export const generateTotalSalesReportPDF = (salesData, businessInfo = {}) => {
  const doc = new jsPDF();
  
  // Configuración de la página
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  
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
  
  // Título del reporte
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DE VENTAS TOTALES', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;
  
  // Información del período
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const reportDate = format(new Date(), 'dd/MM/yyyy HH:mm');
  doc.text(`Fecha del reporte: ${reportDate}`, margin, yPosition);
  doc.text(`Período: ${salesData.dateFrom} - ${salesData.dateTo}`, pageWidth - margin - 60, yPosition);
  yPosition += 20;
  
  // Estadísticas generales
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN GENERAL', margin, yPosition);
  yPosition += 15;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const stats = [
    [`Total de ventas:`, `${salesData.stats.totalSales} transacciones`],
    [`Ingresos totales:`, displayCurrency(salesData.stats.totalRevenue)],
    [`Artículos vendidos:`, `${salesData.stats.totalItems} unidades`],
    [`Venta promedio:`, displayCurrency(salesData.stats.averageSale)]
  ];
  
  stats.forEach(([label, value]) => {
    doc.text(label, margin, yPosition);
    doc.text(value, pageWidth - margin - 80, yPosition);
    yPosition += 8;
  });
  
  yPosition += 15;
  
  // Tabla detallada de ventas
  if (salesData.sales && salesData.sales.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE VENTAS', margin, yPosition);
    yPosition += 15;
    
    // Procesar cada venta para la tabla
    const tableData = salesData.sales.map((sale, index) => {
      const saleDate = new Date(sale.timestamp).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const itemsCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
      
      return [
        `${index + 1}`,
        saleDate,
        sale.paymentMethod || 'Efectivo',
        itemsCount.toString(),
        displayCurrency(sale.total)
      ];
    });
    
    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Fecha/Hora', 'Método Pago', 'Artículos', 'Total']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' }, // #
        1: { cellWidth: 50 }, // Fecha/Hora
        2: { cellWidth: 35 }, // Método Pago
        3: { cellWidth: 25, halign: 'center' }, // Artículos
        4: { cellWidth: 30, halign: 'right' } // Total
      },
      margin: { left: margin, right: margin },
      pageBreak: 'auto'
    });
    
    yPosition = doc.lastAutoTable.finalY + 15;
  }
  
  // Resumen por método de pago
  if (salesData.sales && salesData.sales.length > 0) {
    const paymentMethods = {};
    salesData.sales.forEach(sale => {
      const method = sale.paymentMethod || 'Efectivo';
      if (paymentMethods[method]) {
        paymentMethods[method].count += 1;
        paymentMethods[method].total += sale.total;
      } else {
        paymentMethods[method] = {
          count: 1,
          total: sale.total
        };
      }
    });
    
    if (Object.keys(paymentMethods).length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMEN POR MÉTODO DE PAGO', margin, yPosition);
      yPosition += 15;
      
      const paymentData = Object.entries(paymentMethods).map(([method, data]) => [
        method,
        data.count.toString(),
        displayCurrency(data.total)
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Método de Pago', 'Transacciones', 'Total']],
        body: paymentData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 4
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 60 }, // Método de Pago
          1: { cellWidth: 40, halign: 'center' }, // Transacciones
          2: { cellWidth: 40, halign: 'right' } // Total
        },
        margin: { left: margin, right: margin }
      });
    }
  }
  
  // Pie de página
  const footerY = doc.internal.pageSize.height - 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Este reporte fue generado automáticamente por el sistema POS', pageWidth / 2, footerY, { align: 'center' });
  
  return doc;
};

// Función para descargar reporte de inventario
export const downloadInventoryReport = (inventoryData, businessInfo = {}) => {
  const doc = generateInventoryReportPDF(inventoryData, businessInfo);
  const fileName = `reporte_inventario_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`;
  doc.save(fileName);
};

// Función para descargar reporte de ventas totales
export const downloadTotalSalesReport = (salesData, businessInfo = {}) => {
  const doc = generateTotalSalesReportPDF(salesData, businessInfo);
  const fileName = `reporte_ventas_totales_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`;
  doc.save(fileName);
};
