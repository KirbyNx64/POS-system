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
  CircularProgress,
  useMediaQuery,
  useTheme,
  Paper,
  Collapse
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
    deleteProduct 
  } = useProducts();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems={isMobile ? "flex-start" : "center"} 
        mb={isMobile ? 2 : 3}
        flexDirection={isMobile ? "column" : "row"}
        gap={isMobile ? 2 : 0}
      >
        <Typography 
          variant={isMobile ? "h5" : "h4"}
          sx={{ fontSize: isMobile ? '1.3rem' : '2.125rem' }}
        >
          Gestión de Productos
        </Typography>
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddProduct}
          >
            Nuevo Producto
          </Button>
        )}
      </Box>

      {/* Búsqueda y filtros */}
      <Paper elevation={isMobile ? 0 : 1} sx={{ p: isMobile ? 1 : 2, mb: isMobile ? 2 : 3 }}>
        <Grid container spacing={isMobile ? 1 : 2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Buscar productos"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size={isMobile ? "small" : "medium"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize={isMobile ? "small" : "medium"} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" gap={isMobile ? 1 : 2} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<FilterList fontSize={isMobile ? "small" : "medium"} />}
                onClick={() => setShowFilters(!showFilters)}
                size={isMobile ? "small" : "medium"}
                fullWidth={isMobile}
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
                  size={isMobile ? "small" : "medium"}
                  fullWidth={isMobile}
                >
                  Limpiar Filtros
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Panel de filtros */}
      <Collapse in={showFilters}>
        <Paper elevation={isMobile ? 0 : 1} sx={{ p: isMobile ? 1 : 2, mb: isMobile ? 2 : 3 }}>
          <Grid container spacing={isMobile ? 1 : 2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
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
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
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
        </Paper>
      </Collapse>

      {/* Alertas */}
      {filteredProducts.filter(p => p.stock === 0).length > 0 && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: isMobile ? 1 : 2,
            fontSize: isMobile ? '0.875rem' : '1rem'
          }}
        >
          {filteredProducts.filter(p => p.stock === 0).length} productos sin stock
        </Alert>
      )}

      {filteredProducts.filter(p => p.stock > 0 && p.stock <= stockThreshold).length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: isMobile ? 1 : 2,
            fontSize: isMobile ? '0.875rem' : '1rem'
          }}
        >
          {filteredProducts.filter(p => p.stock > 0 && p.stock <= stockThreshold).length} productos con stock bajo
        </Alert>
      )}

      {/* Lista de productos */}
      <Grid container spacing={isMobile ? 1 : 3}>
        {filteredProducts.map((product) => {
          const stockStatus = getStockStatus(product.stock);
          
          return (
            <Grid item xs={isMobile ? 6 : 12} sm={6} md={4} lg={3} key={product.id}>
              <Card elevation={isMobile ? 0 : 3} sx={{ height: '100%' }}>
                <CardMedia
                  component="div"
                  sx={{
                    height: isMobile ? 100 : 140,
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
                    <Inventory sx={{ fontSize: isMobile ? 40 : 60 }} />
                  )}
                </CardMedia>
                <CardContent sx={{ p: isMobile ? 1 : 2, pb: isMobile ? 1 : 2 }}>
                  <Typography 
                    gutterBottom 
                    variant={isMobile ? "body1" : "h6"} 
                    component="div"
                    sx={{ 
                      fontSize: isMobile ? '0.875rem' : '1.25rem',
                      fontWeight: isMobile ? 'bold' : 'normal',
                      lineHeight: isMobile ? 1.2 : 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      minHeight: isMobile ? '2.1rem' : '3.25rem' // Altura fija para 2 líneas
                    }}
                  >
                    {product.name}
                  </Typography>
                  {!isMobile && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      paragraph
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minHeight: '2.5rem', // Altura fija para 2 líneas
                        marginBottom: 1
                      }}
                    >
                      {product.description || 'Sin descripción'}
                    </Typography>
                  )}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={isMobile ? 0.5 : 1}>
                    <Typography 
                      variant={isMobile ? "body1" : "h6"} 
                      color="primary"
                      sx={{ fontSize: isMobile ? '0.875rem' : '1.25rem' }}
                    >
                      {displayCurrency(product.price)}
                    </Typography>
                    <Chip
                      label={product.category || 'Sin categoría'}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip
                      icon={stockStatus.icon}
                      label={`Stock: ${product.stock}`}
                      color={stockStatus.color}
                      size="small"
                      sx={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}
                    />
                  </Box>
                </CardContent>
                <CardActions sx={{ p: isMobile ? 0.5 : 1, pt: 0 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleStockManagement(product)}
                    title="Gestionar Stock"
                    sx={{ minWidth: isMobile ? '28px' : '32px', height: isMobile ? '28px' : '32px' }}
                  >
                    <Inventory fontSize={isMobile ? "small" : "medium"} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleEditProduct(product)}
                    title="Editar"
                    sx={{ minWidth: isMobile ? '28px' : '32px', height: isMobile ? '28px' : '32px' }}
                  >
                    <Edit fontSize={isMobile ? "small" : "medium"} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteProduct(product.id)}
                    title="Eliminar"
                    color="error"
                    sx={{ minWidth: isMobile ? '28px' : '32px', height: isMobile ? '28px' : '32px' }}
                  >
                    <Delete fontSize={isMobile ? "small" : "medium"} />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filteredProducts.length === 0 && (
        <Box display="flex" flexDirection="column" alignItems="center" mt={isMobile ? 2 : 4}>
          <Inventory sx={{ fontSize: isMobile ? 60 : 80, color: 'text.secondary', mb: isMobile ? 1 : 2 }} />
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            color="text.secondary"
            sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
          >
            No se encontraron productos
          </Typography>
          <Typography 
            variant={isMobile ? "body2" : "body1"} 
            color="text.secondary" 
            mb={isMobile ? 1 : 2}
            textAlign="center"
            sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
          >
            {products.length === 0 
              ? 'Comienza agregando tu primer producto'
              : 'Intenta cambiar los filtros de búsqueda'
            }
          </Typography>
          {products.length === 0 && !isMobile && (
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
          bottom: { xs: 80, md: 16 }, // 80px en móvil para estar arriba de la barra de navegación
          right: 16,
          display: { xs: 'flex', md: 'none' },
          zIndex: theme.zIndex.speedDial
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
