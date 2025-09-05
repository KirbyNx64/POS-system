import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress
} from '@mui/material';
import { useProducts } from '../hooks/useProducts';

function FirestoreTest() {
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('');
  
  const {
    products,
    loading,
    error,
    addProduct,
    deleteProduct
  } = useProducts();

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!productName || !productPrice || !productStock) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      await addProduct({
        name: productName,
        price: parseFloat(productPrice),
        stock: parseInt(productStock),
        category: 'Prueba',
        description: 'Producto de prueba para Firestore'
      });
      
      // Limpiar campos
      setProductName('');
      setProductPrice('');
      setProductStock('');
      
      alert('Producto agregado exitosamente a Firestore!');
    } catch (error) {
      console.error('❌ Error agregando producto:', error);
      alert('Error al agregar producto: ' + error.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await deleteProduct(productId);
        alert('Producto eliminado exitosamente!');
      } catch (error) {
        console.error('Error eliminando producto:', error);
        alert('Error al eliminar producto: ' + error.message);
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🧪 Prueba de Firestore
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Este componente te permite probar que Firestore esté funcionando correctamente.
        Agrega productos y verás cómo se sincronizan en tiempo real.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error: {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Agregar Producto de Prueba
        </Typography>
        
        <Box component="form" onSubmit={handleAddProduct} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Nombre del Producto"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
            size="small"
          />
          <TextField
            label="Precio"
            type="number"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
            required
            size="small"
            inputProps={{ step: "0.01", min: "0" }}
          />
          <TextField
            label="Stock"
            type="number"
            value={productStock}
            onChange={(e) => setProductStock(e.target.value)}
            required
            size="small"
            inputProps={{ min: "0" }}
          />
          <Button type="submit" variant="contained" size="small">
            Agregar Producto
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Productos en Firestore ({products.length})
        </Typography>
        
        {products.length === 0 ? (
          <Typography color="text.secondary">
            No hay productos aún. ¡Agrega uno arriba para probar!
          </Typography>
        ) : (
          <List>
            {products.map((product) => (
              <ListItem
                key={product.id}
                secondaryAction={
                  <Button
                    color="error"
                    size="small"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    Eliminar
                  </Button>
                }
              >
                <ListItemText
                  primary={product.name}
                  secondary={`Precio: $${product.price} | Stock: ${product.stock} | Categoría: ${product.category}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="body2" color="info.contrastText">
          💡 <strong>Consejo:</strong> Abre esta página en otra pestaña del navegador y verás cómo 
          los cambios se sincronizan en tiempo real entre ambas pestañas.
        </Typography>
      </Box>
    </Box>
  );
}

export default FirestoreTest;
