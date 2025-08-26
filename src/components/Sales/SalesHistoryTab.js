import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  TextField,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Collapse,
  TablePagination,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Receipt,
  ExpandMore,
  ExpandLess,
  Search,
  FilterList,
  Print,
  Visibility
} from '@mui/icons-material';
import { useSales } from '../../hooks/useSales';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { displayCurrency } from '../../utils/formatPrice';
import { printInvoice } from './InvoiceGenerator';
import { useApp } from '../../contexts/AppContext';

function SaleDetailDialog({ open, onClose, sale }) {
  const { state } = useApp();
  
  if (!sale) return null;

  const handlePrintReceipt = () => {
    try {
      // Preparar datos de la venta para la factura
      const saleData = {
        items: sale.items,
        subtotal: sale.subtotal,
        tax: sale.tax,
        total: sale.total,
        paymentMethod: sale.paymentMethod
      };
      
      // Generar e imprimir la factura
      printInvoice(saleData, state.businessInfo);
    } catch (error) {
      console.error('Error al imprimir la factura:', error);
      alert('Error al generar la factura: ' + error.message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <Receipt sx={{ mr: 1 }} />
          Detalle de Venta #{sale.id.slice(-6)}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Fecha: {format(new Date(sale.timestamp), 'dd/MM/yyyy HH:mm', { locale: es })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Método de pago: {sale.paymentMethod}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Productos Vendidos
            </Typography>
            <List>
              {sale.items.map((item, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={item.name}
                    secondary={`${displayCurrency(item.price)} x ${item.quantity}`}
                  />
                  <Typography variant="body2">
                    {displayCurrency(item.price * item.quantity)}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography>Subtotal:</Typography>
              <Typography>{displayCurrency(sale.subtotal)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography>IVA:</Typography>
              <Typography>{displayCurrency(sale.tax)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6" color="primary">
                {displayCurrency(sale.total)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button 
          variant="contained" 
          startIcon={<Print />}
          onClick={handlePrintReceipt}
        >
          Imprimir Factura
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SalesHistoryTab() {
  const { sales, loading, error } = useSales();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filtrar ventas
  const filteredSales = sales.filter(sale => {
    // Validar que el timestamp sea válido
    if (!sale.timestamp || isNaN(new Date(sale.timestamp).getTime())) {
      console.warn('Venta con timestamp inválido:', sale);
      return false;
    }

    const saleDate = new Date(sale.timestamp);
    
    // Filtro por ID de venta
    const matchesSearch = !searchTerm || 
      sale.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por fecha desde
    const matchesDateFrom = !dateFrom || 
      saleDate >= startOfDay(parseISO(dateFrom));
    
    // Filtro por fecha hasta
    const matchesDateTo = !dateTo || 
      saleDate <= endOfDay(parseISO(dateTo));
    
    return matchesSearch && matchesDateFrom && matchesDateTo;
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Paginación
  const paginatedSales = filteredSales.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleToggleExpand = (saleId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
    }
    setExpandedRows(newExpanded);
  };

  const handleViewDetail = (sale) => {
    setSelectedSale(sale);
    setDetailDialogOpen(true);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calcular estadísticas
  const totalSales = filteredSales.length;
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalItems = filteredSales.reduce((sum, sale) => 
    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  // Mostrar loading
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error cargando historial de ventas: {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Filtros */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
          Filtros de Búsqueda
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Buscar por ID de venta"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Fecha desde"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Fecha hasta"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Estadísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {totalSales}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total de Ventas
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {displayCurrency(totalRevenue)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresos Totales
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {totalItems}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Productos Vendidos
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabla de ventas */}
      <Paper elevation={1}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Productos</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Método</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSales.map((sale) => (
                <React.Fragment key={sale.id}>
                  <TableRow>
                    <TableCell>{sale.id.slice(-6)}</TableCell>
                    <TableCell>
                      {format(new Date(sale.timestamp), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => handleToggleExpand(sale.id)}
                        startIcon={expandedRows.has(sale.id) ? <ExpandLess /> : <ExpandMore />}
                      >
                        {sale.items.length} productos
                      </Button>
                    </TableCell>
                    <TableCell>{displayCurrency(sale.total)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={sale.paymentMethod} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={sale.status} 
                        size="small" 
                        color={sale.status === 'completed' ? 'success' : 'warning'} 
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetail(sale)}
                        title="Ver detalle"
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  
                  {/* Fila expandible con detalles */}
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                      <Collapse in={expandedRows.has(sale.id)} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                          <Typography variant="h6" gutterBottom component="div">
                            Detalles de la Venta
                          </Typography>
                          <Grid container spacing={2}>
                            {sale.items.map((item, index) => (
                              <Grid item xs={12} sm={6} md={4} key={index}>
                                <Paper elevation={1} sx={{ p: 1 }}>
                                  <Typography variant="body2" fontWeight="bold">
                                    {item.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {displayCurrency(item.price)} x {item.quantity}
                                  </Typography>
                                  <Typography variant="body2" color="primary">
                                    {displayCurrency(item.price * item.quantity)}
                                  </Typography>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Paginación */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredSales.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Paper>

      {/* Diálogo de detalle */}
      <SaleDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        sale={selectedSale}
      />
    </Box>
  );
}

export default SalesHistoryTab;
