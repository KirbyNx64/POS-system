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
    try {
      const result = await addDocument({
        ...productData,
        active: true,
        stock: productData.stock || 0
      });
      return result;
    } catch (error) {
      console.error('❌ useProducts: Error agregando producto:', error);
      throw error;
    }
  };

  // Actualizar producto
  const updateProduct = async (id, updates) => {
    try {
      const result = await updateDocument(id, updates);
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
    const product = products.find(p => p.id === id);
    if (!product) {
      throw new Error('Producto no encontrado');
    }

    const newStock = type === 'entrada' 
      ? product.stock + quantity 
      : product.stock - quantity;

    if (newStock < 0) {
      throw new Error('Stock insuficiente');
    }

    try {
      await updateDocument(id, { stock: newStock });

      // Registrar movimiento de inventario
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
      
      await addInventoryDocument(inventoryData);
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
