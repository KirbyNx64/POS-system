import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  IconButton,
  Chip,
  Dialog,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  InputAdornment,
  Fab,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  FilterList,
  Inventory,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { useProducts } from '../../hooks/useProducts';
import ProductForm from './ProductForm';
import StockDialog from './StockDialog';
import { displayCurrency } from '../../utils/formatPrice';

function Products() {
  const { 
    products, 
    loading, 
    error, 
    deleteProduct, 
    updateStock 
  } = useProducts();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Categorías hardcodeadas por ahora (puedes moverlas a Firestore después)
  const categories = ['Electrónicos', 'Ropa', 'Alimentación', 'Hogar', 'Deportes', 'Otros'];
  const stockThreshold = 10;

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    if (!product.active) return false;
    
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = product.stock <= stockThreshold;
    } else if (stockFilter === 'out') {
      matchesStock = product.stock === 0;
    } else if (stockFilter === 'available') {
      matchesStock = product.stock > 0;
    }
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setDialogOpen(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await deleteProduct(productId);
        // El hook se encarga de actualizar la lista automáticamente
      } catch (error) {
        console.error('Error eliminando producto:', error);
        alert('Error al eliminar el producto: ' + error.message);
      }
    }
  };

  const handleStockManagement = (product) => {
    setSelectedProduct(product);
    setStockDialogOpen(true);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) {
      return { color: 'error', icon: <Warning />, text: 'Sin stock' };
    } else if (stock <= stockThreshold) {
      return { color: 'warning', icon: <Warning />, text: 'Stock bajo' };
    } else {
      return { color: 'success', icon: <CheckCircle />, text: 'Disponible' };
    }
  };

  // Mostrar loading mientras se cargan los datos
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Mostrar error si hay alguno
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error cargando productos: {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Gestión de Productos
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddProduct}
        >
          Nuevo Producto
        </Button>
      </Box>

      {/* Búsqueda y filtros */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Buscar productos"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtros
            </Button>
            {(categoryFilter || stockFilter) && (
              <Button
                variant="text"
                onClick={() => {
                  setCategoryFilter('');
                  setStockFilter('');
                }}
              >
                Limpiar Filtros
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Panel de filtros */}
      {showFilters && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={categoryFilter}
                label="Categoría"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Estado de Stock</InputLabel>
              <Select
                value={stockFilter}
                label="Estado de Stock"
                onChange={(e) => setStockFilter(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="available">Disponible</MenuItem>
                <MenuItem value="low">Stock Bajo</MenuItem>
                <MenuItem value="out">Sin Stock</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      )}

      {/* Alertas */}
      {filteredProducts.filter(p => p.stock === 0).length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {filteredProducts.filter(p => p.stock === 0).length} productos sin stock
        </Alert>
      )}

      {filteredProducts.filter(p => p.stock > 0 && p.stock <= stockThreshold).length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {filteredProducts.filter(p => p.stock > 0 && p.stock <= stockThreshold).length} productos con stock bajo
        </Alert>
      )}

      {/* Lista de productos */}
      <Grid container spacing={3}>
        {filteredProducts.map((product) => {
          const stockStatus = getStockStatus(product.stock);
          
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <Card elevation={3}>
                <CardMedia
                  component="div"
                  sx={{
                    height: 140,
                    backgroundColor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary'
                  }}
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Inventory sx={{ fontSize: 60 }} />
                  )}
                </CardMedia>
                <CardContent>
                  <Typography gutterBottom variant="h6" component="div">
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {product.description || 'Sin descripción'}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6" color="primary">
                      {displayCurrency(product.price)}
                    </Typography>
                    <Chip
                      label={product.category || 'Sin categoría'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip
                      icon={stockStatus.icon}
                      label={`Stock: ${product.stock}`}
                      color={stockStatus.color}
                      size="small"
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <IconButton
                    size="small"
                    onClick={() => handleStockManagement(product)}
                    title="Gestionar Stock"
                  >
                    <Inventory />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleEditProduct(product)}
                    title="Editar"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteProduct(product.id)}
                    title="Eliminar"
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filteredProducts.length === 0 && (
        <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
          <Inventory sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No se encontraron productos
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={2}>
            {products.length === 0 
              ? 'Comienza agregando tu primer producto'
              : 'Intenta cambiar los filtros de búsqueda'
            }
          </Typography>
          {products.length === 0 && (
            <Button variant="contained" startIcon={<Add />} onClick={handleAddProduct}>
              Agregar Primer Producto
            </Button>
          )}
        </Box>
      )}

      {/* FAB para móviles */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
        onClick={handleAddProduct}
      >
        <Add />
      </Fab>

      {/* Dialogs */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <ProductForm
          product={selectedProduct}
          onClose={() => setDialogOpen(false)}
        />
      </Dialog>

      <StockDialog
        open={stockDialogOpen}
        onClose={() => setStockDialogOpen(false)}
        product={selectedProduct}
      />
    </Box>
  );
}

export default Products;
