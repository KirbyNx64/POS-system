import React, { useState, useEffect, useRef } from 'react';
import {
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
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
  Card,
  InputAdornment,
  Chip
} from '@mui/material';
import {
  Add,
  Remove,
  Delete,
  ShoppingCart,
  Payment,
  Receipt,
  Clear,
  QrCodeScanner,
  Search
} from '@mui/icons-material';
import { useProducts } from '../../hooks/useProducts';
import { useSales } from '../../hooks/useSales';
import { useApp } from '../../contexts/AppContext';
import { displayCurrency } from '../../utils/formatPrice';
import { downloadInvoice, printInvoice } from './InvoiceGenerator';

function CashierTab() {
  const { state, dispatch } = useApp();
  const { products: firestoreProducts } = useProducts(); // Usar productos de Firestore
  const { processSale, loading: saleProcessing } = useSales(); // Hook para procesar ventas
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [processing, setProcessing] = useState(false);
  const [lastScannedProduct, setLastScannedProduct] = useState(null);
  const barcodeInputRef = useRef(null);

  // Calcular totales del carrito
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = state.taxSettings.enabled ? state.taxSettings.rate : 0;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  // Focus automático en el campo de código de barras
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Buscar producto por código de barras o nombre
  const findProduct = (searchTerm) => {
    const term = searchTerm.toLowerCase().trim();
    return firestoreProducts.find(product => 
      product.active && 
      product.stock > 0 && 
      (product.barcode === term || 
       product.name.toLowerCase().includes(term) ||
       product.id.toLowerCase().includes(term))
    );
  };

  // Agregar producto por código de barras
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const product = findProduct(barcodeInput);
    if (product) {
      addToCart(product, quantity);
      setLastScannedProduct(product);
      setBarcodeInput('');
      setQuantity(1);
      // Mantener focus en el campo de código de barras
      setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }, 100);
    } else {
      alert(`Producto no encontrado: ${barcodeInput}`);
      setBarcodeInput('');
    }
  };

  // Buscar producto por nombre
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    const products = firestoreProducts.filter(product => 
      product.active && 
      product.stock > 0 && 
      product.name.toLowerCase().includes(searchInput.toLowerCase())
    );

    if (products.length === 1) {
      addToCart(products[0], 1);
      setSearchInput('');
    } else if (products.length > 1) {
      // Mostrar lista de productos encontrados
      alert(`Se encontraron ${products.length} productos. Especifica más el nombre.`);
    } else {
      alert(`No se encontraron productos con: ${searchInput}`);
    }
  };

  const addToCart = (product, qty = 1) => {
    if (product.stock <= 0) {
      alert('Producto sin stock');
      return;
    }

    const cartItem = state.cart.find(item => item.id === product.id);
    const currentQuantityInCart = cartItem ? cartItem.quantity : 0;
    
    if (currentQuantityInCart + qty > product.stock) {
      alert(`Stock insuficiente. Disponible: ${product.stock - currentQuantityInCart}`);
      return;
    }

    // Si ya existe en el carrito, actualizar cantidad
    if (cartItem) {
      dispatch({
        type: 'UPDATE_CART_QUANTITY',
        payload: { id: product.id, quantity: cartItem.quantity + qty }
      });
    } else {
      dispatch({
        type: 'ADD_TO_CART',
        payload: {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: qty,
          image: product.image,
          barcode: product.barcode
        }
      });
    }
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
    setLastScannedProduct(null);
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
      setLastScannedProduct(null);
      
      // Generar factura automáticamente
      try {
        downloadInvoice(saleData, state.businessInfo);
      } catch (invoiceError) {
        console.error('Error generando factura:', invoiceError);
        // No fallar la venta si hay error en la factura
      }
      
      // Mostrar comprobante y mantener focus en código de barras
      alert(`¡Venta completada!\nTotal: ${displayCurrency(total)}\nMétodo: ${paymentMethod}\n\nLa factura se ha descargado automáticamente.`);
      
      setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error('Error al procesar la venta:', error);
      alert('Error al procesar la venta: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Panel de entrada de datos */}
      <Grid item xs={12} lg={8}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            <QrCodeScanner sx={{ mr: 1, verticalAlign: 'middle' }} />
            Cajero POS
          </Typography>
          
          {/* Entrada por código de barras */}
          <Card elevation={1} sx={{ mb: 3, p: 2, bgcolor: 'primary.50' }}>
            <form onSubmit={handleBarcodeSubmit}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    ref={barcodeInputRef}
                    label="Código de Barras"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Escanea o escribe el código"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <QrCodeScanner />
                        </InputAdornment>
                      ),
                    }}
                    autoFocus
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Cantidad"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<Add />}
                  >
                    Agregar
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Card>

          {/* Búsqueda por nombre */}
          <Card elevation={1} sx={{ mb: 3, p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Búsqueda por Nombre
            </Typography>
            <form onSubmit={handleSearchSubmit}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="Nombre del Producto"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Buscar por nombre..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    type="submit"
                    variant="outlined"
                    fullWidth
                    size="large"
                    startIcon={<Search />}
                  >
                    Buscar
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Card>

          {/* Último producto escaneado */}
          {lastScannedProduct && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <strong>Producto agregado:</strong> {lastScannedProduct.name} - 
              {displayCurrency(lastScannedProduct.price)}
              {lastScannedProduct.barcode && (
                <Chip 
                  label={`Código: ${lastScannedProduct.barcode}`} 
                  size="small" 
                  sx={{ ml: 1 }}
                />
              )}
            </Alert>
          )}

          {/* Información de ayuda */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Instrucciones:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Escanea el código de barras o escríbelo manualmente
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Ajusta la cantidad antes de agregar
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • También puedes buscar productos por nombre
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Presiona Enter para agregar al carrito
            </Typography>
          </Box>
        </Paper>
      </Grid>

      {/* Carrito de compras */}
      <Grid item xs={12} lg={4}>
        <Paper elevation={2} sx={{ p: 2, position: 'sticky', top: 20 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              <ShoppingCart sx={{ mr: 1, verticalAlign: 'middle' }} />
              Carrito ({state.cart.length})
            </Typography>
            {state.cart.length > 0 && (
              <IconButton onClick={clearCart} color="error" size="small">
                <Clear />
              </IconButton>
            )}
          </Box>

          {state.cart.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={4}>
              <ShoppingCart sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" textAlign="center">
                Carrito vacío
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Escanea productos para agregar
              </Typography>
            </Box>
          ) : (
            <>
              {/* Artículos en el carrito */}
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {state.cart.map((item) => (
                  <ListItem key={item.id} divider sx={{ pr: 1, py: 2 }}>
                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                      {/* Información del producto */}
                      <Box mb={1.5}>
                        <Typography variant="body2" fontWeight="bold" sx={{ wordBreak: 'break-word', mb: 0.5 }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {displayCurrency(item.price)} c/u
                        </Typography>
                        {item.barcode && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Código: {item.barcode}
                          </Typography>
                        )}
                      </Box>
                      
                      {/* Controles de cantidad, total y eliminar */}
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center">
                          <IconButton
                            size="small"
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            sx={{ bgcolor: 'action.hover', mr: 1 }}
                          >
                            <Remove fontSize="small" />
                          </IconButton>
                          <Typography sx={{ mx: 1, minWidth: 30, textAlign: 'center', fontWeight: 'bold' }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            sx={{ bgcolor: 'action.hover', ml: 1 }}
                          >
                            <Add fontSize="small" />
                          </IconButton>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {displayCurrency(item.price * item.quantity)}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => removeFromCart(item.id)}
                            color="error"
                            sx={{ ml: 1 }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              {/* Resumen de totales */}
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Subtotal:</Typography>
                  <Typography>{displayCurrency(subtotal)}</Typography>
                </Box>
                {state.taxSettings.enabled && (
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>{state.taxSettings.name} ({(state.taxSettings.rate * 100).toFixed(0)}%):</Typography>
                    <Typography>{displayCurrency(tax)}</Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6" color="primary">
                    {displayCurrency(total)}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Payment />}
                  onClick={handleCheckout}
                  size="large"
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

          {/* Opciones de factura */}
          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom>
              Opciones de Factura:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const saleData = {
                    items: state.cart,
                    subtotal,
                    tax,
                    total,
                    paymentMethod
                  };
                  downloadInvoice(saleData, state.businessInfo);
                }}
                disabled={state.cart.length === 0}
              >
                Descargar Factura
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const saleData = {
                    items: state.cart,
                    subtotal,
                    tax,
                    total,
                    paymentMethod
                  };
                  printInvoice(saleData, state.businessInfo);
                }}
                disabled={state.cart.length === 0}
              >
                Imprimir Factura
              </Button>
            </Box>
          </Box>
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

export default CashierTab;
