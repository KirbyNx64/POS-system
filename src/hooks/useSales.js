import { useState, useEffect } from 'react';
import { useFirestore } from './useFirestore';
import { useProducts } from './useProducts';

export function useSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { data: salesData, addDocument: addSaleDocument, updateDocument: updateSaleDocument, loading: salesLoading, error: salesError } = useFirestore('ventas');
  const { products, updateProduct } = useProducts();

  // Sincronizar ventas del hook useFirestore y convertir timestamps
  useEffect(() => {
    if (salesData && salesData.length > 0) {
      // Convertir timestamps de Firestore a objetos Date
      const convertedSales = salesData.map(sale => ({
        ...sale,
        timestamp: sale.timestamp?.toDate ? sale.timestamp.toDate() : new Date(sale.timestamp)
      }));
      setSales(convertedSales);
    } else {
      setSales([]);
    }
    setLoading(salesLoading);
    setError(salesError);
  }, [salesData, salesLoading, salesError]);

  // Procesar una venta completa
  const processSale = async (saleData) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Validar stock antes de procesar
      for (const item of saleData.items) {
        const product = products.find(p => p.id === item.id);
        if (!product) {
          throw new Error(`Producto no encontrado: ${item.name}`);
        }
        
        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`);
        }
      }

      // 2. Actualizar stock de todos los productos
      const stockUpdates = [];
      for (const item of saleData.items) {
        const product = products.find(p => p.id === item.id);
        const newStock = product.stock - item.quantity;
        
        stockUpdates.push(
          updateProduct(item.id, { stock: newStock })
        );
      }

      // 3. Ejecutar todas las actualizaciones de stock
      await Promise.all(stockUpdates);

      // 4. Guardar la venta en Firestore
      const saleDocument = {
        items: saleData.items,
        subtotal: saleData.subtotal,
        tax: saleData.tax,
        total: saleData.total,
        paymentMethod: saleData.paymentMethod,
        timestamp: new Date(),
        status: 'completed'
      };

      await addSaleDocument(saleDocument);

      return { success: true, message: 'Venta procesada exitosamente' };
    } catch (error) {
      console.error('Error procesando venta:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar una venta existente
  const updateSale = async (saleId, updatedSaleData) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Obtener la venta original
      const originalSale = sales.find(s => s.id === saleId);
      if (!originalSale) {
        throw new Error('Venta no encontrada');
      }

      const newStatus = updatedSaleData.status || 'completed';
      const originalStatus = originalSale.status || 'completed';

      // 2. Calcular diferencias en stock según el estado
      const stockChanges = {};
      
      // Solo manejar stock si hay cambio de estado o cambio de productos
      const statusChanged = originalStatus !== newStatus;
      const itemsChanged = JSON.stringify(originalSale.items) !== JSON.stringify(updatedSaleData.items);
      
      if (statusChanged || itemsChanged) {
        // Restaurar stock de productos originales (si la venta original estaba completada)
        if (originalStatus === 'completed') {
          for (const originalItem of originalSale.items) {
            const product = products.find(p => p.id === originalItem.id);
            if (product) {
              stockChanges[originalItem.id] = (stockChanges[originalItem.id] || 0) + originalItem.quantity;
            }
          }
        }
        
        // Aplicar lógica según el nuevo estado
        if (newStatus === 'completed' || newStatus === 'pending') {
          // Si se marca como completada o pendiente, reducir stock de productos nuevos
          for (const newItem of updatedSaleData.items) {
            const product = products.find(p => p.id === newItem.id);
            if (!product) {
              throw new Error(`Producto no encontrado: ${newItem.name}`);
            }
            
            const currentStock = product.stock + (stockChanges[newItem.id] || 0);
            if (currentStock < newItem.quantity) {
              throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${currentStock}, Solicitado: ${newItem.quantity}`);
            }
            
            stockChanges[newItem.id] = (stockChanges[newItem.id] || 0) - newItem.quantity;
          }
        } else if (newStatus === 'cancelled') {
          // Si se marca como cancelada, devolver todo el stock (ya se restauró arriba)
          // No se reduce stock adicional
        }
      }

      // 3. Actualizar stock de todos los productos afectados
      const stockUpdates = [];
      for (const [productId, stockChange] of Object.entries(stockChanges)) {
        if (stockChange !== 0) {
          const product = products.find(p => p.id === productId);
          let newStock = product.stock + stockChange;
          
          // Asegurar que el stock no sea negativo
          if (newStock < 0) {
            console.warn(`Stock negativo detectado para ${product.name}, ajustando a 0`);
            newStock = 0;
          }
          
          stockUpdates.push(
            updateProduct(productId, { stock: newStock })
          );
        }
      }

      // 4. Ejecutar todas las actualizaciones de stock
      await Promise.all(stockUpdates);

      // 5. Actualizar la venta en Firestore
      const updatedSaleDocument = {
        items: updatedSaleData.items,
        subtotal: updatedSaleData.subtotal,
        tax: updatedSaleData.tax,
        total: updatedSaleData.total,
        paymentMethod: updatedSaleData.paymentMethod,
        timestamp: originalSale.timestamp, // Mantener la fecha original
        status: newStatus
      };

      await updateSaleDocument(saleId, updatedSaleDocument);

      return { success: true, message: 'Venta actualizada exitosamente' };
    } catch (error) {
      console.error('Error actualizando venta:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Obtener ventas por fecha
  const getSalesByDate = (startDate, endDate) => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= startDate && saleDate <= endDate;
    });
  };

  // Obtener estadísticas de ventas
  const getSalesStats = () => {
    if (sales.length === 0) return { totalSales: 0, totalRevenue: 0, averageTicket: 0 };

    // Filtrar solo ventas completadas para estadísticas de ingresos
    const completedSales = sales.filter(sale => sale.status === 'completed');
    const totalSales = completedSales.length;
    const totalRevenue = completedSales.reduce((sum, sale) => sum + sale.total, 0);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    return { totalSales, totalRevenue, averageTicket };
  };

  return {
    sales,
    loading,
    error,
    processSale,
    updateSale,
    getSalesByDate,
    getSalesStats
  };
}
