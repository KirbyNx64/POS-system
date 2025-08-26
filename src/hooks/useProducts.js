import { useFirestore } from './useFirestore';

export function useProducts() {
  const {
    data: products,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
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
  const updateStock = async (id, quantity, type, reason) => {
    const product = products.find(p => p.id === id);
    if (!product) throw new Error('Producto no encontrado');

    const newStock = type === 'entrada' 
      ? product.stock + quantity 
      : product.stock - quantity;

    if (newStock < 0) throw new Error('Stock insuficiente');

    await updateDocument(id, { stock: newStock });

    // Registrar movimiento de inventario
    await addInventoryDocument({
      productId: id,
      type,
      quantity,
      reason,
      previousStock: product.stock,
      newStock
    });
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
