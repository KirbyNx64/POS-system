import { generateSampleData } from './sampleData';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase/config';

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
  try {
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
        // Si hay error, usar solo productos por defecto
        currentProducts = freshData.products;
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
    
    // Guardar datos limpios
    localStorage.setItem('pos-system-data', JSON.stringify(cleanData));
    
    // Recargar la página después de un pequeño delay para asegurar que se guarde
    setTimeout(() => {
      window.location.reload();
    }, 100);
    
  } catch (error) {
    console.error('Error en clearSalesData:', error);
    throw error; // Re-lanzar el error para que se maneje en el componente
  }
};

// Función para eliminar completamente todos los datos
export const clearAllData = () => {
  try {
    localStorage.removeItem('pos-system-data');
    
    // Recargar la página después de un pequeño delay para asegurar que se elimine
    setTimeout(() => {
      window.location.reload();
    }, 100);
    
  } catch (error) {
    console.error('Error en clearAllData:', error);
    throw error; // Re-lanzar el error para que se maneje en el componente
  }
};

// Función para limpiar solo las ventas de Firebase
export const clearFirebaseSales = async (userId) => {
  try {
    console.log('🧹 Limpiando ventas de Firebase para usuario:', userId);
    
    // Obtener todas las ventas del usuario
    const salesQuery = query(
      collection(db, 'ventas'),
      where('userId', '==', userId)
    );
    
    const salesSnapshot = await getDocs(salesQuery);
    console.log(`📊 Encontradas ${salesSnapshot.size} ventas para eliminar`);
    
    // Eliminar cada venta
    const deletePromises = [];
    salesSnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    
    await Promise.all(deletePromises);
    console.log('✅ Todas las ventas eliminadas de Firebase');
    
    return { success: true, deletedCount: salesSnapshot.size };
    
  } catch (error) {
    console.error('❌ Error limpiando ventas de Firebase:', error);
    throw error;
  }
};

// Función para limpiar todo de Firebase
export const clearAllFirebaseData = async (userId) => {
  try {
    console.log('🧹 Limpiando todos los datos de Firebase para usuario:', userId);
    
    const collections = ['ventas', 'productos', 'inventario'];
    let totalDeleted = 0;
    
    for (const collectionName of collections) {
      console.log(`🗑️ Limpiando colección: ${collectionName}`);
      
      const collectionQuery = query(
        collection(db, collectionName),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(collectionQuery);
      console.log(`📊 Encontrados ${snapshot.size} documentos en ${collectionName}`);
      
      // Eliminar cada documento
      const deletePromises = [];
      snapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      
      await Promise.all(deletePromises);
      totalDeleted += snapshot.size;
      console.log(`✅ ${snapshot.size} documentos eliminados de ${collectionName}`);
    }
    
    console.log(`✅ Total de documentos eliminados: ${totalDeleted}`);
    return { success: true, deletedCount: totalDeleted };
    
  } catch (error) {
    console.error('❌ Error limpiando datos de Firebase:', error);
    throw error;
  }
};
