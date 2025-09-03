import React, { useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Box,
  List,
  ListItem,
  IconButton,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Add,
  Remove,
  Delete,
  ShoppingCart,
  Search,
  Payment,
  Receipt,
  Clear,
  Inventory
} from '@mui/icons-material';
import { useProducts } from '../../hooks/useProducts';
import { useSales } from '../../hooks/useSales';
import { useApp } from '../../contexts/AppContext';
import { useTaxSettings } from '../../hooks/useTaxSettings';
import { displayCurrency } from '../../utils/formatPrice';

function PointOfSaleTab() {
  const { state, dispatch } = useApp();
  const { products: firestoreProducts } = useProducts(); // Usar productos de Firestore
  const { processSale } = useSales(); // Hook para procesar ventas
  const { taxSettings } = useTaxSettings(); // Hook para configuración de impuestos desde Firebase
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [processing, setProcessing] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Filtrar productos disponibles
  const availableProducts = firestoreProducts.filter(product => 
    product.active && 
    product.stock > 0 &&
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (!selectedCategory || product.category === selectedCategory)
  );

  // Calcular totales del carrito
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = taxSettings.enabled ? taxSettings.rate : 0;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert('Producto sin stock');
      return;
    }

    const cartItem = state.cart.find(item => item.id === product.id);
    const currentQuantityInCart = cartItem ? cartItem.quantity : 0;
    
    if (currentQuantityInCart >= product.stock) {
      alert(`Stock insuficiente. Disponible: ${product.stock}`);
      return;
    }

    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image
      }
    });
  };

  const updateCartQuantity = (productId, newQuantity) => {
    const product = firestoreProducts.find(p => p.id === productId);
    
    // Validar que el producto existe
    if (!product) {
      console.error('Producto no encontrado:', productId);
      alert('Producto no encontrado. Se eliminará del carrito.');
      dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
      return;
    }
    
    if (newQuantity <= 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
      return;
    }
    
    if (newQuantity > product.stock) {
      alert(`Stock insuficiente. Disponible: ${product.stock}`);
      return;
    }

    dispatch({
      type: 'UPDATE_CART_QUANTITY',
      payload: { id: productId, quantity: newQuantity }
    });
  };

  const removeFromCart = (productId) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const handleCheckout = () => {
    if (state.cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    setCheckoutDialogOpen(true);
  };

  const completeSale = async () => {
    setProcessing(true);
    
    try {
      // Preparar datos de la venta
      const saleData = {
        items: state.cart,
        subtotal,
        tax,
        total,
        paymentMethod
      };

      // Procesar la venta usando useSales (esto actualizará el stock en Firestore)
      await processSale(saleData);

      // Limpiar el carrito y cerrar el diálogo
      dispatch({ type: 'CLEAR_CART' });
      setCheckoutDialogOpen(false);
      setPaymentMethod('efectivo');
      
      // Mostrar comprobante
      alert('¡Venta completada exitosamente!');
    } catch (error) {
      console.error('Error al procesar la venta:', error);
      alert('Error al procesar la venta: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Grid container spacing={isMobile ? 2 : 3}>
      {/* Panel de productos */}
      <Grid item xs={12} lg={8}>
        <Paper elevation={isMobile ? 0 : 2} sx={{ p: isMobile ? 1 : 2 }}>
          <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
            Seleccionar Productos
          </Typography>
          
          {/* Búsqueda y filtros */}
          <Grid container spacing={isMobile ? 1 : 2} mb={isMobile ? 2 : 3}>
            <Grid item xs={12} md={8}>
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
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Categoría"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {state.categories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Lista de productos */}
          <Grid container spacing={isMobile ? 1 : 2}>
            {availableProducts.map((product) => (
              <Grid item xs={isMobile ? 6 : 12} sm={6} md={4} key={product.id}>
                <Card elevation={isMobile ? 0 : 1} sx={{ height: '100%' }}>
                  <CardMedia
                    component="div"
                    sx={{
                      height: isMobile ? 80 : 100,
                      backgroundColor: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Inventory color="disabled" fontSize={isMobile ? "small" : "medium"} />
                    )}
                  </CardMedia>
                  <CardContent sx={{ pb: 1, px: isMobile ? 1 : 2 }}>
                    <Typography 
                      variant={isMobile ? "body2" : "subtitle1"} 
                      noWrap
                      sx={{ fontSize: isMobile ? '0.75rem' : '1rem' }}
                    >
                      {product.name}
                    </Typography>
                    <Typography 
                      variant={isMobile ? "body1" : "h6"} 
                      color="primary"
                      sx={{ fontSize: isMobile ? '0.875rem' : '1.25rem' }}
                    >
                      {displayCurrency(product.price)}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                      <Chip
                        label={`Stock: ${product.stock}`}
                        size="small"
                        color={product.stock <= state.stockThreshold ? 'warning' : 'success'}
                        sx={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}
                      />
                    </Box>
                  </CardContent>
                  <CardActions sx={{ px: isMobile ? 1 : 2, pb: isMobile ? 1 : 2 }}>
                    <Button
                      size={isMobile ? "small" : "small"}
                      variant="contained"
                      startIcon={<Add fontSize={isMobile ? "small" : "medium"} />}
                      onClick={() => addToCart(product)}
                      fullWidth
                      sx={{ 
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        minHeight: isMobile ? '32px' : '36px'
                      }}
                    >
                      Agregar
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {availableProducts.length === 0 && (
            <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
              <Typography variant="h6" color="text.secondary">
                No hay productos disponibles
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {state.products.filter(p => p.active).length === 0 
                  ? 'No hay productos registrados'
                  : 'Revisa los filtros de búsqueda o agrega stock a los productos'
                }
              </Typography>
            </Box>
          )}
        </Paper>
      </Grid>

      {/* Carrito de compras */}
      <Grid item xs={12} lg={4}>
        <Paper 
          elevation={isMobile ? 0 : 2} 
          sx={{ 
            p: isMobile ? 1 : 2, 
            position: isMobile ? 'static' : 'sticky', 
            top: isMobile ? 'auto' : 20 
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={isMobile ? 1 : 2}>
            <Typography variant={isMobile ? "subtitle1" : "h6"}>
              Carrito de Ventas
            </Typography>
            {state.cart.length > 0 && (
              <IconButton onClick={clearCart} color="error" size="small">
                <Clear fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            )}
          </Box>

          {state.cart.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={isMobile ? 2 : 4}>
              <ShoppingCart sx={{ fontSize: isMobile ? 40 : 60, color: 'text.secondary', mb: isMobile ? 1 : 2 }} />
              <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary">
                Carrito vacío
              </Typography>
              <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
                Agrega productos para comenzar la venta
              </Typography>
            </Box>
          ) : (
            <>
              {/* Artículos en el carrito */}
              <List>
                {state.cart.map((item) => (
                  <ListItem key={item.id} divider sx={{ pr: 1, py: isMobile ? 1 : 2 }}>
                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                      {/* Información del producto */}
                      <Box mb={isMobile ? 1 : 1.5}>
                        <Typography 
                          variant={isMobile ? "caption" : "body2"} 
                          fontWeight="bold" 
                          sx={{ 
                            wordBreak: 'break-word', 
                            mb: isMobile ? 0.5 : 0.5,
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            display: 'block'
                          }}
                        >
                          {item.name}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: isMobile ? '0.65rem' : '0.75rem',
                            display: 'block',
                            mt: isMobile ? 0.25 : 0
                          }}
                        >
                          {displayCurrency(item.price)} c/u
                        </Typography>
                      </Box>
                      
                      {/* Controles de cantidad, total y eliminar */}
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center">
                          <IconButton
                            size={isMobile ? "small" : "small"}
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            sx={{ 
                              bgcolor: 'action.hover', 
                              mr: isMobile ? 0.5 : 1,
                              minWidth: isMobile ? '28px' : '32px',
                              height: isMobile ? '28px' : '32px'
                            }}
                          >
                            <Remove fontSize={isMobile ? "small" : "small"} />
                          </IconButton>
                          <Typography 
                            sx={{ 
                              mx: isMobile ? 0.5 : 1, 
                              minWidth: isMobile ? 20 : 30, 
                              textAlign: 'center', 
                              fontWeight: 'bold',
                              fontSize: isMobile ? '0.75rem' : '0.875rem'
                            }}
                          >
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size={isMobile ? "small" : "small"}
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            sx={{ 
                              bgcolor: 'action.hover', 
                              ml: isMobile ? 0.5 : 1,
                              minWidth: isMobile ? '28px' : '32px',
                              height: isMobile ? '28px' : '32px'
                            }}
                          >
                            <Add fontSize={isMobile ? "small" : "small"} />
                          </IconButton>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={isMobile ? 0.5 : 1}>
                          <Typography 
                            variant={isMobile ? "caption" : "body2"} 
                            fontWeight="bold" 
                            color="primary"
                            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                          >
                            {displayCurrency(item.price * item.quantity)}
                          </Typography>
                          <IconButton
                            size={isMobile ? "small" : "small"}
                            onClick={() => removeFromCart(item.id)}
                            color="error"
                            sx={{ 
                              ml: isMobile ? 0.5 : 1,
                              minWidth: isMobile ? '28px' : '32px',
                              height: isMobile ? '28px' : '32px'
                            }}
                          >
                            <Delete fontSize={isMobile ? "small" : "small"} />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: isMobile ? 1 : 2 }} />

              {/* Resumen de totales */}
              <Box>
                <Box display="flex" justifyContent="space-between" mb={isMobile ? 0.5 : 1}>
                  <Typography variant={isMobile ? "body2" : "body1"}>Subtotal:</Typography>
                  <Typography variant={isMobile ? "body2" : "body1"}>{displayCurrency(subtotal)}</Typography>
                </Box>
                {taxSettings.enabled && (
                  <Box display="flex" justifyContent="space-between" mb={isMobile ? 0.5 : 1}>
                    <Typography variant={isMobile ? "body2" : "body1"}>
                      {taxSettings.name} ({(taxSettings.rate * 100).toFixed(0)}%):
                    </Typography>
                    <Typography variant={isMobile ? "body2" : "body1"}>{displayCurrency(tax)}</Typography>
                  </Box>
                )}
                <Divider sx={{ my: isMobile ? 0.5 : 1 }} />
                <Box display="flex" justifyContent="space-between" mb={isMobile ? 1 : 2}>
                  <Typography variant={isMobile ? "subtitle1" : "h6"}>Total:</Typography>
                  <Typography variant={isMobile ? "subtitle1" : "h6"} color="primary">
                    {displayCurrency(total)}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Payment fontSize={isMobile ? "small" : "medium"} />}
                  onClick={handleCheckout}
                  size={isMobile ? "medium" : "large"}
                  sx={{
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    minHeight: isMobile ? '40px' : '48px'
                  }}
                >
                  Procesar Venta
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Grid>

      {/* Dialog de checkout */}
      <Dialog open={checkoutDialogOpen} onClose={() => setCheckoutDialogOpen(false)}>
        <DialogTitle>Confirmar Venta</DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <Typography variant="h6" gutterBottom>
              Resumen de la Venta
            </Typography>
            {state.cart.map((item) => (
              <Box key={item.id} display="flex" justifyContent="space-between" mb={1}>
                <Typography>
                  {item.name} x{item.quantity}
                </Typography>
                <Typography>
                  {displayCurrency(item.price * item.quantity)}
                </Typography>
              </Box>
            ))}
            <Divider sx={{ my: 1 }} />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6" color="primary">
                {displayCurrency(total)}
              </Typography>
            </Box>
          </Box>

          <FormControl fullWidth>
            <InputLabel>Método de Pago</InputLabel>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              label="Método de Pago"
            >
              <MenuItem value="efectivo">Efectivo</MenuItem>
              <MenuItem value="tarjeta">Tarjeta</MenuItem>
              <MenuItem value="transferencia">Transferencia</MenuItem>
            </Select>
          </FormControl>

          {processing && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Procesando venta...
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutDialogOpen(false)} disabled={processing}>
            Cancelar
          </Button>
          <Button
            onClick={completeSale}
            variant="contained"
            startIcon={<Receipt />}
            disabled={processing}
          >
            {processing ? 'Procesando...' : 'Confirmar Venta'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

export default PointOfSaleTab;
