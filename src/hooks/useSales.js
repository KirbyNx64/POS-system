import { useState, useEffect } from 'react';
import { useFirestore } from './useFirestore';
import { useProducts } from './useProducts';

export function useSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { data: salesData, addDocument: addSaleDocument, loading: salesLoading, error: salesError } = useFirestore('ventas');
  const { products, updateProduct, loading: productsLoading, error: productsError } = useProducts();

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

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const averageTicket = totalRevenue / totalSales;

    return { totalSales, totalRevenue, averageTicket };
  };

  return {
    sales,
    loading,
    error,
    processSale,
    getSalesByDate,
    getSalesStats
  };
}
