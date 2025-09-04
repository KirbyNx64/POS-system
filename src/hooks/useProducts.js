import { useFirestore } from './useFirestore';

export function useProducts() {
  const {
    data: products,
    loading,
    error,
    addDocument,
    updateDocument,
    getDocument
  } = useFirestore('productos');

  const {
    addDocument: addInventoryDocument
  } = useFirestore('inventario');

  // Agregar producto
  const addProduct = async (productData) => {
    console.log('🚀 useProducts: addProduct ejecutado');
    console.log('🚀 useProducts: Datos recibidos:', productData);
    
    try {
      const result = await addDocument({
        ...productData,
        active: true,
        stock: productData.stock || 0
      });
      console.log('✅ useProducts: Producto agregado exitosamente:', result);
      return result;
    } catch (error) {
      console.error('❌ useProducts: Error agregando producto:', error);
      throw error;
    }
  };

  // Actualizar producto
  const updateProduct = async (id, updates) => {
    console.log('🔄 useProducts: updateProduct ejecutado');
    console.log('🔄 useProducts: ID:', id, 'Updates:', updates);
    
    try {
      const result = await updateDocument(id, updates);
      console.log('✅ useProducts: Producto actualizado exitosamente');
      return result;
    } catch (error) {
      console.error('❌ useProducts: Error actualizando producto:', error);
      throw error;
    }
  };

  // Eliminar producto (soft delete)
  const deleteProduct = async (id) => {
    return await updateDocument(id, { active: false });
  };

  // Actualizar stock
  const updateStock = async (id, quantity, type, reason, userName = 'Sistema') => {
    console.log('🔄 useProducts: updateStock ejecutado');
    console.log('🔄 useProducts: ID:', id, 'Quantity:', quantity, 'Type:', type, 'Reason:', reason);
    
    const product = products.find(p => p.id === id);
    if (!product) {
      console.error('❌ useProducts: Producto no encontrado con ID:', id);
      throw new Error('Producto no encontrado');
    }

    console.log('🔄 useProducts: Producto encontrado:', product.name, 'Stock actual:', product.stock);

    const newStock = type === 'entrada' 
      ? product.stock + quantity 
      : product.stock - quantity;

    console.log('🔄 useProducts: Nuevo stock calculado:', newStock);

    if (newStock < 0) {
      console.error('❌ useProducts: Stock insuficiente. Stock actual:', product.stock, 'Cantidad solicitada:', quantity);
      throw new Error('Stock insuficiente');
    }

    try {
      // Actualizar el stock del producto en Firebase
      console.log('📝 useProducts: Actualizando stock del producto en Firebase...');
      await updateDocument(id, { stock: newStock });
      console.log('✅ useProducts: Stock del producto actualizado exitosamente');

      // Registrar movimiento de inventario
      console.log('📝 useProducts: Registrando movimiento de inventario...');
      const inventoryData = {
        productId: id,
        type,
        quantity: type === 'entrada' ? quantity : -quantity, // Guardar cantidad con signo
        reason,
        userName,
        previousStock: product.stock,
        newStock,
        date: new Date().toISOString()
      };
      console.log('📝 useProducts: Datos del movimiento:', inventoryData);
      
      const inventoryResult = await addInventoryDocument(inventoryData);
      console.log('✅ useProducts: Movimiento de inventario registrado exitosamente:', inventoryResult);
    } catch (error) {
      console.error('❌ useProducts: Error en updateStock:', error);
      throw error;
    }
  };

  // Obtener productos activos
  const activeProducts = products.filter(p => p.active);

  // Obtener productos con stock bajo
  const lowStockProducts = activeProducts.filter(p => p.stock <= 10);

  return {
    products: activeProducts,
    allProducts: products,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    lowStockProducts,
    getProduct: getDocument
  };
}
