import { generateSampleData } from './sampleData';

// Función para resetear completamente el sistema
export const resetSystemData = () => {
  // Eliminar datos del localStorage
  localStorage.removeItem('pos-system-data');
  
  // Generar datos frescos y guardarlos
  const freshData = generateSampleData();
  localStorage.setItem('pos-system-data', JSON.stringify(freshData));
  
  // Recargar la página para cargar datos frescos
  window.location.reload();
};

// Función para limpiar solo las ventas pero mantener productos originales
export const clearSalesData = () => {
  // Generar datos frescos pero mantener solo productos originales
  const freshData = generateSampleData();
  
  // Obtener productos actuales (por si el usuario agregó productos nuevos)
  const savedData = localStorage.getItem('pos-system-data');
  let currentProducts = freshData.products; // productos por defecto
  
  if (savedData) {
    try {
      const data = JSON.parse(savedData);
      // Mantener productos que el usuario haya agregado (que no estén en los originales)
      const originalProductIds = freshData.products.map(p => p.name);
      const userAddedProducts = data.products.filter(p => 
        p.active && !originalProductIds.includes(p.name)
      );
      currentProducts = [...freshData.products, ...userAddedProducts];
    } catch (error) {
      console.error('Error procesando productos actuales:', error);
    }
  }
  
  const cleanData = {
    ...freshData,
    products: currentProducts,
    sales: [], // Sin ventas
    // Solo movimientos de stock inicial
    inventory: currentProducts.map(product => ({
      id: `inv-${product.id}`,
      productId: product.id,
      type: 'entrada',
      quantity: product.stock,
      reason: 'Stock inicial',
      date: product.createdAt || new Date().toISOString(),
      userId: '1'
    }))
  };
  
  localStorage.setItem('pos-system-data', JSON.stringify(cleanData));
  window.location.reload();
};

// Función para eliminar completamente todos los datos
export const clearAllData = () => {
  localStorage.removeItem('pos-system-data');
  window.location.reload();
};
