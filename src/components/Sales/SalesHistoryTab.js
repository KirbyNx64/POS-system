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
  Alert,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  CardActions
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
import { useBusinessInfo } from '../../hooks/useBusinessInfo';

function SaleDetailDialog({ open, onClose, sale }) {
  const { businessInfo } = useBusinessInfo();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
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
      printInvoice(saleData, businessInfo);
    } catch (error) {
      console.error('Error al imprimir la factura:', error);
      alert('Error al generar la factura: ' + error.message);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <Receipt sx={{ mr: 1, fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
          <Typography variant={isMobile ? "h6" : "h5"}>
            Detalle de Venta #{sale.id.slice(-6)}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: isMobile ? 1 : 2 }}>
        <Grid container spacing={isMobile ? 1 : 2}>
          <Grid item xs={12}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.875rem' : '0.875rem' }}
            >
              Fecha: {format(new Date(sale.timestamp), 'dd/MM/yyyy HH:mm', { locale: es })}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.875rem' : '0.875rem' }}
            >
              Método de pago: {sale.paymentMethod}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            {/* Información del negocio para la factura */}
            {businessInfo && businessInfo.name && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Negocio:</strong> {businessInfo.name}
                  {businessInfo.address && ` - ${businessInfo.address}`}
                </Typography>
              </Alert>
            )}
            
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"} 
              gutterBottom
              sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
            >
              Productos Vendidos
            </Typography>
            <List sx={{ p: 0 }}>
              {sale.items.map((item, index) => (
                <ListItem 
                  key={index} 
                  divider
                  sx={{ 
                    px: isMobile ? 0 : 2,
                    py: isMobile ? 1 : 1.5
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography 
                        variant="body2"
                        sx={{ fontSize: isMobile ? '0.875rem' : '0.875rem' }}
                      >
                        {item.name}
                      </Typography>
                    }
                    secondary={
                      <Typography 
                        variant="caption"
                        sx={{ fontSize: isMobile ? '0.75rem' : '0.75rem' }}
                      >
                        {displayCurrency(item.price)} x {item.quantity}
                      </Typography>
                    }
                  />
                  <Typography 
                    variant="body2"
                    sx={{ fontSize: isMobile ? '0.875rem' : '0.875rem' }}
                  >
                    {displayCurrency(item.price * item.quantity)}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>Subtotal:</Typography>
              <Typography sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>{displayCurrency(sale.subtotal)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>IVA:</Typography>
              <Typography sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>{displayCurrency(sale.tax)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"}
                sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
              >
                Total:
              </Typography>
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} 
                color="primary"
                sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
              >
                {displayCurrency(sale.total)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: isMobile ? 1 : 2 }}>
        <Button 
          onClick={onClose}
          size={isMobile ? "small" : "medium"}
          fullWidth={isMobile}
        >
          Cerrar
        </Button>
        <Button 
          variant="contained" 
          startIcon={<Print fontSize={isMobile ? "small" : "medium"} />}
          onClick={handlePrintReceipt}
          size={isMobile ? "small" : "medium"}
          fullWidth={isMobile}
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
  const [showFilters, setShowFilters] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
      <Paper elevation={isMobile ? 0 : 1} sx={{ p: isMobile ? 1 : 2, mb: isMobile ? 2 : 3 }}>
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={isMobile ? 1 : 2}
        >
          <Box display="flex" alignItems="center">
            <FilterList sx={{ mr: 1, verticalAlign: 'middle', fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"}
              sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
            >
              Filtros de Búsqueda
            </Typography>
          </Box>
          {isMobile && (
            <IconButton 
              onClick={() => setShowFilters(!showFilters)}
              size="small"
            >
              {showFilters ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </Box>
        
        <Collapse in={!isMobile || showFilters}>
          <Grid container spacing={isMobile ? 1 : 2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar por ID de venta"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size={isMobile ? "small" : "medium"}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary', fontSize: isMobile ? '1rem' : '1.25rem' }} />,
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
                size={isMobile ? "small" : "medium"}
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
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      {/* Estadísticas */}
      <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: isMobile ? 3 : 4 }}>
        <Grid item xs={4} md={4}>
          <Paper 
            elevation={isMobile ? 0 : 1} 
            sx={{ 
              p: isMobile ? 1 : 2, 
              textAlign: 'center',
              height: isMobile ? '80px' : '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <Typography 
              variant={isMobile ? "h6" : "h4"} 
              color="primary"
              sx={{ 
                fontSize: isMobile ? '1.1rem' : '2.125rem',
                lineHeight: 1,
                mb: 0.5
              }}
            >
              {totalSales}
            </Typography>
            <Typography 
              variant={isMobile ? "caption" : "body2"} 
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
            >
              Total de Ventas
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={4} md={4}>
          <Paper 
            elevation={isMobile ? 0 : 1} 
            sx={{ 
              p: isMobile ? 1 : 2, 
              textAlign: 'center',
              height: isMobile ? '80px' : '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <Typography 
              variant={isMobile ? "h6" : "h4"} 
              color="success.main"
              sx={{ 
                fontSize: isMobile ? '1.1rem' : '2.125rem',
                lineHeight: 1,
                mb: 0.5
              }}
            >
              {displayCurrency(totalRevenue)}
            </Typography>
            <Typography 
              variant={isMobile ? "caption" : "body2"} 
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
            >
              Ingresos Totales
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={4} md={4}>
          <Paper 
            elevation={isMobile ? 0 : 1} 
            sx={{ 
              p: isMobile ? 1 : 2, 
              textAlign: 'center',
              height: isMobile ? '80px' : '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <Typography 
              variant={isMobile ? "h6" : "h4"} 
              color="info.main"
              sx={{ 
                fontSize: isMobile ? '1.1rem' : '2.125rem',
                lineHeight: 1,
                mb: 0.5
              }}
            >
              {totalItems}
            </Typography>
            <Typography 
              variant={isMobile ? "caption" : "body2"} 
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
            >
              Productos Vendidos
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Espaciado adicional */}
      <Box sx={{ mb: isMobile ? 2 : 3 }} />

      {/* Vista de ventas */}
      {isMobile ? (
        // Vista de cards para móvil
        <Box>
          {paginatedSales.map((sale) => (
            <Card 
              key={sale.id} 
              elevation={0} 
              sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}
            >
              <CardContent sx={{ p: 2, pb: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Typography 
                    variant="subtitle1" 
                    fontWeight="bold"
                    sx={{ fontSize: '1rem' }}
                  >
                    Venta #{sale.id.slice(-6)}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color="primary"
                    sx={{ fontSize: '1.1rem' }}
                  >
                    {displayCurrency(sale.total)}
                  </Typography>
                </Box>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: '0.875rem', mb: 1 }}
                >
                  {format(new Date(sale.timestamp), 'dd/MM/yyyy HH:mm', { locale: es })}
                </Typography>
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box display="flex" gap={1}>
                    <Chip 
                      label={sale.paymentMethod} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: '20px' }}
                    />
                    <Chip 
                      label={sale.status} 
                      size="small" 
                      color={sale.status === 'completed' ? 'success' : 'warning'}
                      sx={{ fontSize: '0.7rem', height: '20px' }}
                    />
                  </Box>
                  <Button
                    size="small"
                    onClick={() => handleToggleExpand(sale.id)}
                    startIcon={expandedRows.has(sale.id) ? <ExpandLess /> : <ExpandMore />}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {sale.items.length} productos
                  </Button>
                </Box>
              </CardContent>
              
              <Collapse in={expandedRows.has(sale.id)} timeout="auto" unmountOnExit>
                <Box sx={{ px: 2, pb: 1 }}>
                  <Typography 
                    variant="subtitle2" 
                    gutterBottom
                    sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}
                  >
                    Productos:
                  </Typography>
                  {sale.items.map((item, index) => (
                    <Box 
                      key={index} 
                      display="flex" 
                      justifyContent="space-between" 
                      alignItems="center"
                      py={0.5}
                      borderBottom={index < sale.items.length - 1 ? '1px solid' : 'none'}
                      borderColor="divider"
                    >
                      <Box>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: '0.8rem' }}
                        >
                          {item.name}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ fontSize: '0.7rem' }}
                        >
                          {displayCurrency(item.price)} x {item.quantity}
                        </Typography>
                      </Box>
                      <Typography 
                        variant="body2" 
                        color="primary"
                        sx={{ fontSize: '0.8rem' }}
                      >
                        {displayCurrency(item.price * item.quantity)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Collapse>
              
              <CardActions sx={{ p: 1, pt: 0 }}>
                <Button
                  size="small"
                  startIcon={<Visibility fontSize="small" />}
                  onClick={() => handleViewDetail(sale)}
                  fullWidth
                >
                  Ver Detalle
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      ) : (
        // Vista de tabla para desktop
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
        </Paper>
      )}
        
        {/* Paginación */}
        <TablePagination
          rowsPerPageOptions={isMobile ? [5, 10] : [5, 10, 25]}
          component="div"
          count={filteredSales.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={isMobile ? "Filas:" : "Filas por página:"}
          labelDisplayedRows={({ from, to, count }) => 
            isMobile ? `${from}-${to} de ${count}` : `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
          sx={{
            '& .MuiTablePagination-toolbar': {
              paddingLeft: isMobile ? 1 : 2,
              paddingRight: isMobile ? 1 : 2,
              minHeight: isMobile ? '52px' : '64px'
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: isMobile ? '0.75rem' : '0.875rem'
            }
          }}
        />

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
