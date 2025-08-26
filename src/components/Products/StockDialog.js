import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  InputAdornment
} from '@mui/material';
import { Add, Remove, Inventory } from '@mui/icons-material';
import { useApp } from '../../contexts/AppContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function StockDialog({ open, onClose, product }) {
  const { state, dispatch } = useApp();
  const [movementType, setMovementType] = useState('entrada');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!product) return null;

  // Obtener movimientos de inventario para este producto
  const productMovements = state.inventory
    .filter(movement => movement.productId === product.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    if (!reason.trim()) {
      setError('El motivo es requerido');
      return;
    }

    // Para salidas, verificar que hay suficiente stock
    if (movementType === 'salida' && qty > product.stock) {
      setError(`Stock insuficiente. Stock actual: ${product.stock}`);
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const movementQuantity = movementType === 'entrada' ? qty : -qty;
      
      dispatch({
        type: 'UPDATE_STOCK',
        payload: {
          productId: product.id,
          quantity: movementQuantity,
          type: movementType,
          reason: reason.trim()
        }
      });

      setLoading(false);
      setQuantity('');
      setReason('');
      onClose();
    }, 500);
  };

  const getMovementColor = (type) => {
    return type === 'entrada' ? 'success' : 'error';
  };

  const getMovementIcon = (type) => {
    return type === 'entrada' ? <Add /> : <Remove />;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <Inventory sx={{ mr: 1 }} />
          Gestión de Stock - {product.name}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Información actual del producto */}
          <Grid item xs={12}>
            <Alert 
              severity={product.stock === 0 ? 'error' : product.stock <= state.stockThreshold ? 'warning' : 'success'}
              sx={{ mb: 2 }}
            >
              <Typography variant="h6">
                Stock Actual: {product.stock} unidades
              </Typography>
              <Typography variant="body2">
                Precio: ${product.price.toLocaleString()} | Categoría: {product.category}
              </Typography>
            </Alert>
          </Grid>

          {/* Formulario de movimiento */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Nuevo Movimiento
            </Typography>
            
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Movimiento</InputLabel>
                    <Select
                      value={movementType}
                      onChange={(e) => setMovementType(e.target.value)}
                      label="Tipo de Movimiento"
                    >
                      <MenuItem value="entrada">
                        <Box display="flex" alignItems="center">
                          <Add sx={{ mr: 1, color: 'success.main' }} />
                          Entrada (Compra/Ajuste)
                        </Box>
                      </MenuItem>
                      <MenuItem value="salida">
                        <Box display="flex" alignItems="center">
                          <Remove sx={{ mr: 1, color: 'error.main' }} />
                          Salida (Ajuste/Devolución)
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Cantidad"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">unidades</InputAdornment>,
                    }}
                    inputProps={{ min: 1 }}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Motivo"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={
                      movementType === 'entrada' 
                        ? 'Ej: Compra a proveedor, Ajuste de inventario' 
                        : 'Ej: Producto dañado, Ajuste de inventario'
                    }
                    required
                  />
                </Grid>

                {error && (
                  <Grid item xs={12}>
                    <Alert severity="error">{error}</Alert>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    startIcon={getMovementIcon(movementType)}
                  >
                    {loading ? 'Procesando...' : `Registrar ${movementType}`}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Grid>

          {/* Historial de movimientos */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Historial de Movimientos
            </Typography>
            
            {productMovements.length > 0 ? (
              <List>
                {productMovements.map((movement) => (
                  <ListItem key={movement.id} divider>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Chip
                            icon={getMovementIcon(movement.type)}
                            label={`${movement.quantity > 0 ? '+' : ''}${movement.quantity}`}
                            color={getMovementColor(movement.type)}
                            size="small"
                          />
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(movement.date), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {movement.reason}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Usuario: {state.user?.name || 'Sistema'}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                No hay movimientos registrados para este producto
              </Alert>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default StockDialog;
