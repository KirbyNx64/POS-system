// Función para generar datos de ejemplo (sistema vacío)
export const generateSampleData = () => {
  // Sistema completamente vacío - sin productos preconfigurados
  const sampleProducts = [];

  // Sin ventas de ejemplo - sistema limpio
  const sampleSales = [];

  // Sin movimientos de inventario - sistema completamente vacío
  const sampleInventory = [];

  return {
    products: sampleProducts,
    sales: sampleSales,
    inventory: sampleInventory,
    categories: [
      'Electrónicos',
      'Ropa y Accesorios',
      'Alimentación',
      'Bebidas',
      'Hogar y Decoración',
      'Deportes y Fitness',
      'Salud y Belleza',
      'Libros y Papelería',
      'Juguetes y Juegos',
      'Automotriz',
      'Jardín y Exterior',
      'Mascotas',
      'Farmacia',
      'Oficina',
      'Construcción',
      'Otros'
    ],
    stockThreshold: 10
  };
};

// Función para cargar datos de ejemplo si no existen
export const loadSampleDataIfEmpty = (currentData) => {
  // Solo cargar datos de ejemplo si no hay productos
  if (currentData.products && currentData.products.length > 0) {
    return currentData;
  }
  
  const sampleData = generateSampleData();
  
  return {
    ...currentData,
    ...sampleData
  };
};
