import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  useMediaQuery,
  useTheme,
  Collapse,
  IconButton
} from '@mui/material';
import {
  Inventory,
  TrendingUp,
  Download,
  DateRange,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { useSales } from '../../hooks/useSales';
import { useProducts } from '../../hooks/useProducts';
import { useBusinessInfo } from '../../hooks/useBusinessInfo';
import { format, startOfDay, endOfDay, subDays, parseISO } from 'date-fns';
import { displayCurrency } from '../../utils/formatPrice';
import { downloadSalesReport, downloadInventoryReport, downloadTotalSalesReport } from '../../utils/reportPdfGenerator';

function TabPanel({ children, value, index, isMobile = false, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: isMobile ? 1 : 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function Reports() {
  console.log('Reports - Hook ejecutándose');
  const { sales, loading: salesLoading, error: salesError } = useSales();
  const { allProducts, loading: productsLoading, error: productsError } = useProducts();
  const { businessInfo } = useBusinessInfo();
  const [activeTab, setActiveTab] = useState(0);
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Mostrar loading mientras se cargan los datos
  if (salesLoading || productsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6">Cargando reportes...</Typography>
      </Box>
    );
  }

  // Mostrar error si hay problemas
  if (salesError || productsError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="error">
          Error cargando reportes: {salesError || productsError}
        </Typography>
      </Box>
    );
  }

  // Debug: verificar datos cargados
  console.log('Reports - Datos cargados:', { 
    productsCount: allProducts.length, 
    salesCount: sales.length,
    sampleProduct: allProducts[0],
    sampleSale: sales[0]
  });

  // Filtrar ventas por fecha
  const filteredSales = sales.filter(sale => {
    try {
      // Validar que el timestamp sea válido
      if (!sale.timestamp) {
        return false;
      }
      
      const saleDate = new Date(sale.timestamp);
      if (isNaN(saleDate.getTime())) {
        return false;
      }
      
      const from = dateFrom ? startOfDay(parseISO(dateFrom)) : null;
      const to = dateTo ? endOfDay(parseISO(dateTo)) : null;
      
      return (!from || saleDate >= from) && (!to || saleDate <= to);
    } catch (error) {
      console.warn('Error procesando fecha de venta:', sale.id, sale.timestamp, error);
      return false;
    }
  });

  // Calcular estadísticas de ventas
  const salesStats = {
    totalSales: filteredSales.length,
    totalRevenue: filteredSales.reduce((sum, sale) => sum + sale.total, 0),
    totalItems: filteredSales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    ),
    averageSale: filteredSales.length > 0 ? 
      filteredSales.reduce((sum, sale) => sum + sale.total, 0) / filteredSales.length : 0
  };

  // Productos más vendidos
  const productSales = {};
  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
      if (productSales[item.id]) {
        productSales[item.id].quantity += item.quantity;
        productSales[item.id].revenue += item.price * item.quantity;
      } else {
        productSales[item.id] = {
          name: item.name,
          quantity: item.quantity,
          revenue: item.price * item.quantity,
          category: allProducts.find(p => p.id === item.id)?.category || 'N/A'
        };
      }
    });
  });

  const topProducts = Object.entries(productSales)
    .sort(([,a], [,b]) => b.quantity - a.quantity)
    .slice(0, 10);

  // Ventas por categoría
  const categoryStats = {};
  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
      const product = allProducts.find(p => p.id === item.id);
      const category = product?.category || 'Sin categoría';
      
      if (categoryStats[category]) {
        categoryStats[category].quantity += item.quantity;
        categoryStats[category].revenue += item.price * item.quantity;
        categoryStats[category].sales += 1;
      } else {
        categoryStats[category] = {
          quantity: item.quantity,
          revenue: item.price * item.quantity,
          sales: 1
        };
      }
    });
  });

  // Reporte de inventario
  const inventoryReport = allProducts
    .filter(p => p.active)
    .filter(p => !selectedCategory || p.category === selectedCategory)
    .map(product => {
      const value = product.price * product.stock;
      // Por ahora no tenemos movimientos de inventario, usar fecha de creación
      let lastMovement = 'N/A';
      if (product.createdAt) {
        try {
          const date = new Date(product.createdAt);
          if (!isNaN(date.getTime())) {
            lastMovement = format(date, 'dd/MM/yyyy');
          }
        } catch (error) {
          console.warn('Fecha inválida para producto:', product.id, product.createdAt);
        }
      }
      
      return {
        ...product,
        value,
        lastMovement,
        status: product.stock === 0 ? 'Sin stock' : 
                product.stock <= 10 ? 'Stock bajo' : 'Normal' // Usar valor fijo por ahora
      };
    })
    .sort((a, b) => b.value - a.value);

  const inventoryStats = {
    totalProducts: inventoryReport.length,
    totalValue: inventoryReport.reduce((sum, product) => sum + product.value, 0),
    outOfStock: inventoryReport.filter(p => p.stock === 0).length,
    lowStock: inventoryReport.filter(p => p.stock > 0 && p.stock <= 10).length // Usar valor fijo por ahora
  };

  // Función para exportar reportes a PDF
  const exportReport = (type) => {
    try {
      if (type === 'sales') {
        const salesReportData = {
          dateFrom,
          dateTo,
          stats: salesStats,
          topProducts,
          categoryStats
        };
        downloadSalesReport(salesReportData, businessInfo);
      } else if (type === 'totalSales') {
        const totalSalesReportData = {
          dateFrom,
          dateTo,
          stats: salesStats,
          sales: filteredSales
        };
        downloadTotalSalesReport(totalSalesReportData, businessInfo);
      } else if (type === 'inventory') {
        const inventoryReportData = {
          selectedCategory,
          stats: inventoryStats,
          products: inventoryReport
        };
        downloadInventoryReport(inventoryReportData, businessInfo);
      }
    } catch (error) {
      console.error('Error generando reporte PDF:', error);
      // Fallback al método anterior si hay error
      const data = type === 'sales' || type === 'totalSales' ? filteredSales : inventoryReport;
      const csvContent = "data:text/csv;charset=utf-8," + 
        JSON.stringify(data, null, 2);
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `reporte_${type}_${format(new Date(), 'yyyy-MM-dd')}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Box>
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        gutterBottom
        sx={{ fontSize: isMobile ? '1.3rem' : '2.125rem', mb: isMobile ? 2 : 3 }}
      >
        Reportes y Análisis
      </Typography>

      {/* Filtros de fecha */}
      <Paper elevation={isMobile ? 0 : 1} sx={{ p: isMobile ? 1 : 2, mb: isMobile ? 2 : 3 }}>
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={isMobile ? 1 : 2}
        >
          <Box display="flex" alignItems="center">
            <DateRange sx={{ mr: 1, verticalAlign: 'middle', fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"} 
              component="span"
              sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
            >
              Período de Análisis
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
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Fecha desde"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Fecha hasta"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      <Paper elevation={isMobile ? 0 : 1} sx={{ mb: isMobile ? 2 : 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant={isMobile ? "fullWidth" : "standard"}
          sx={{
            '& .MuiTab-root': {
              minHeight: isMobile ? '48px' : '48px',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              padding: isMobile ? '6px 8px' : '12px 16px'
            },
            '& .MuiTab-iconWrapper': {
              marginBottom: isMobile ? '4px' : '6px'
            }
          }}
        >
          <Tab 
            icon={<TrendingUp fontSize={isMobile ? 'small' : 'medium'} />} 
            label={isMobile ? "Ventas" : "Reporte de Ventas"} 
            id="reports-tab-0"
          />
          <Tab 
            icon={<Inventory fontSize={isMobile ? 'small' : 'medium'} />} 
            label={isMobile ? "Inventario" : "Reporte de Inventario"} 
            id="reports-tab-1"
          />
        </Tabs>
      </Paper>

      {/* Reporte de Ventas */}
      <TabPanel value={activeTab} index={0} isMobile={isMobile}>
        <Grid container spacing={isMobile ? 1 : 3}>
          {/* Estadísticas generales */}
          <Grid item xs={6} sm={6} md={3}>
            <Card elevation={isMobile ? 0 : 1}>
              <CardContent sx={{ p: isMobile ? 1 : 2, pb: isMobile ? 1 : 2 }}>
                <Typography 
                  color="textSecondary" 
                  gutterBottom
                  variant={isMobile ? "caption" : "body2"}
                  sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                >
                  Total Ventas
                </Typography>
                <Typography 
                  variant={isMobile ? "h6" : "h4"} 
                  color="primary"
                  sx={{ fontSize: isMobile ? '1.1rem' : '2.125rem' }}
                >
                  {salesStats.totalSales}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card elevation={isMobile ? 0 : 1}>
              <CardContent sx={{ p: isMobile ? 1 : 2, pb: isMobile ? 1 : 2 }}>
                <Typography 
                  color="textSecondary" 
                  gutterBottom
                  variant={isMobile ? "caption" : "body2"}
                  sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                >
                  Ingresos Totales
                </Typography>
                <Typography 
                  variant={isMobile ? "h6" : "h4"} 
                  color="success.main"
                  sx={{ fontSize: isMobile ? '1.1rem' : '2.125rem' }}
                >
                  {displayCurrency(salesStats.totalRevenue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card elevation={isMobile ? 0 : 1}>
              <CardContent sx={{ p: isMobile ? 1 : 2, pb: isMobile ? 1 : 2 }}>
                <Typography 
                  color="textSecondary" 
                  gutterBottom
                  variant={isMobile ? "caption" : "body2"}
                  sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                >
                  Artículos Vendidos
                </Typography>
                <Typography 
                  variant={isMobile ? "h6" : "h4"} 
                  color="info.main"
                  sx={{ fontSize: isMobile ? '1.1rem' : '2.125rem' }}
                >
                  {salesStats.totalItems}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card elevation={isMobile ? 0 : 1}>
              <CardContent sx={{ p: isMobile ? 1 : 2, pb: isMobile ? 1 : 2 }}>
                <Typography 
                  color="textSecondary" 
                  gutterBottom
                  variant={isMobile ? "caption" : "body2"}
                  sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                >
                  Venta Promedio
                </Typography>
                <Typography 
                  variant={isMobile ? "h6" : "h4"}
                  sx={{ fontSize: isMobile ? '1.1rem' : '2.125rem' }}
                >
                  {displayCurrency(salesStats.averageSale)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Productos más vendidos */}
          <Grid item xs={12} md={6}>
            <Paper elevation={isMobile ? 0 : 2} sx={{ p: isMobile ? 1 : 2 }}>
              <Box 
                display="flex" 
                justifyContent="space-between" 
                alignItems="center" 
                mb={isMobile ? 1 : 2}
                flexDirection={isMobile ? "column" : "row"}
                gap={isMobile ? 1 : 0}
              >
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"}
                  sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
                >
                  Productos Más Vendidos
                </Typography>
                <Button
                  size="small"
                  startIcon={<Download fontSize={isMobile ? "small" : "medium"} />}
                  onClick={() => exportReport('sales')}
                  fullWidth={isMobile}
                >
                  Exportar
                </Button>
              </Box>
              <TableContainer>
                <Table size={isMobile ? "small" : "small"}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Producto</TableCell>
                      <TableCell align="right" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Vendidos</TableCell>
                      <TableCell align="right" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Ingresos</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topProducts.slice(0, 5).map(([productId, data], index) => (
                      <TableRow key={productId}>
                        <TableCell>
                          <Typography 
                            variant="body2"
                            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                          >
                            {index + 1}. {data.name}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}
                          >
                            {data.category}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                          {data.quantity}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                          {displayCurrency(data.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {topProducts.length === 0 && (
                <Alert 
                  severity="info"
                  sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                >
                  No hay datos de ventas en el período seleccionado
                </Alert>
              )}
            </Paper>
          </Grid>

          {/* Ventas por categoría */}
          <Grid item xs={12} md={6}>
            <Paper elevation={isMobile ? 0 : 2} sx={{ p: isMobile ? 1 : 2 }}>
              <Box 
                display="flex" 
                justifyContent="space-between" 
                alignItems="center" 
                mb={isMobile ? 1 : 2}
                flexDirection={isMobile ? "column" : "row"}
                gap={isMobile ? 1 : 0}
              >
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"}
                  sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
                >
                  Ventas por Categoría
                </Typography>
                <Button
                  size="small"
                  startIcon={<Download fontSize={isMobile ? "small" : "medium"} />}
                  onClick={() => exportReport('totalSales')}
                  fullWidth={isMobile}
                  variant="outlined"
                >
                  Ventas Totales
                </Button>
              </Box>
              <TableContainer>
                <Table size={isMobile ? "small" : "small"}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Categoría</TableCell>
                      <TableCell align="right" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Ventas</TableCell>
                      <TableCell align="right" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Ingresos</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(categoryStats)
                      .sort(([,a], [,b]) => b.revenue - a.revenue)
                      .map(([category, data]) => (
                        <TableRow key={category}>
                          <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                            {category}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                            {data.sales}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                            {displayCurrency(data.revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {Object.keys(categoryStats).length === 0 && (
                <Alert 
                  severity="info"
                  sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                >
                  No hay datos de ventas en el período seleccionado
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Reporte de Inventario */}
      <TabPanel value={activeTab} index={1} isMobile={isMobile}>
        <Grid container spacing={isMobile ? 1 : 3}>
          {/* Estadísticas de inventario */}
          <Grid item xs={6} sm={6} md={3}>
            <Card elevation={isMobile ? 0 : 1}>
              <CardContent sx={{ p: isMobile ? 1 : 2, pb: isMobile ? 1 : 2 }}>
                <Typography 
                  color="textSecondary" 
                  gutterBottom
                  variant={isMobile ? "caption" : "body2"}
                  sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                >
                  Total Productos
                </Typography>
                <Typography 
                  variant={isMobile ? "h6" : "h4"} 
                  color="primary"
                  sx={{ fontSize: isMobile ? '1.1rem' : '2.125rem' }}
                >
                  {inventoryStats.totalProducts}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card elevation={isMobile ? 0 : 1}>
              <CardContent sx={{ p: isMobile ? 1 : 2, pb: isMobile ? 1 : 2 }}>
                <Typography 
                  color="textSecondary" 
                  gutterBottom
                  variant={isMobile ? "caption" : "body2"}
                  sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                >
                  Valor Inventario
                </Typography>
                <Typography 
                  variant={isMobile ? "h6" : "h4"} 
                  color="success.main"
                  sx={{ fontSize: isMobile ? '1.1rem' : '2.125rem' }}
                >
                  {displayCurrency(inventoryStats.totalValue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card elevation={isMobile ? 0 : 1}>
              <CardContent sx={{ p: isMobile ? 1 : 2, pb: isMobile ? 1 : 2 }}>
                <Typography 
                  color="textSecondary" 
                  gutterBottom
                  variant={isMobile ? "caption" : "body2"}
                  sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                >
                  Sin Stock
                </Typography>
                <Typography 
                  variant={isMobile ? "h6" : "h4"} 
                  color="error.main"
                  sx={{ fontSize: isMobile ? '1.1rem' : '2.125rem' }}
                >
                  {inventoryStats.outOfStock}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card elevation={isMobile ? 0 : 1}>
              <CardContent sx={{ p: isMobile ? 1 : 2, pb: isMobile ? 1 : 2 }}>
                <Typography 
                  color="textSecondary" 
                  gutterBottom
                  variant={isMobile ? "caption" : "body2"}
                  sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                >
                  Stock Bajo
                </Typography>
                <Typography 
                  variant={isMobile ? "h6" : "h4"} 
                  color="warning.main"
                  sx={{ fontSize: isMobile ? '1.1rem' : '2.125rem' }}
                >
                  {inventoryStats.lowStock}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Filtros de inventario */}
          <Grid item xs={12}>
            <Paper elevation={isMobile ? 0 : 1} sx={{ p: isMobile ? 1 : 2 }}>
              <Grid container spacing={isMobile ? 1 : 2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                    <InputLabel>Filtrar por Categoría</InputLabel>
                    <Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      label="Filtrar por Categoría"
                    >
                      <MenuItem value="">Todas las categorías</MenuItem>
                      {Array.from(new Set(allProducts.map(p => p.category).filter(Boolean))).map(category => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Button
                    startIcon={<Download fontSize={isMobile ? "small" : "medium"} />}
                    onClick={() => exportReport('inventory')}
                    fullWidth={isMobile}
                    size={isMobile ? "small" : "medium"}
                  >
                    Exportar Inventario
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Tabla de inventario */}
          <Grid item xs={12}>
            <Paper elevation={isMobile ? 0 : 2}>
              <TableContainer>
                <Table size={isMobile ? "small" : "medium"}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Producto</TableCell>
                      {!isMobile && <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Categoría</TableCell>}
                      <TableCell align="right" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Stock</TableCell>
                      {!isMobile && <TableCell align="right" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Precio</TableCell>}
                      <TableCell align="right" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Valor</TableCell>
                      <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Estado</TableCell>
                      {!isMobile && <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>Último Movimiento</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventoryReport.slice(0, 20).map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Typography 
                            variant="body2"
                            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                          >
                            {product.name}
                          </Typography>
                          {isMobile && (
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ fontSize: '0.65rem' }}
                            >
                              {product.category}
                            </Typography>
                          )}
                        </TableCell>
                        {!isMobile && <TableCell>{product.category}</TableCell>}
                        <TableCell align="right" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                          {product.stock}
                        </TableCell>
                        {!isMobile && (
                          <TableCell align="right" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                            {displayCurrency(product.price)}
                          </TableCell>
                        )}
                        <TableCell align="right" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                          {displayCurrency(product.value)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={product.status}
                            color={
                              product.status === 'Sin stock' ? 'error' :
                              product.status === 'Stock bajo' ? 'warning' : 'success'
                            }
                            size="small"
                            sx={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}
                          />
                        </TableCell>
                        {!isMobile && <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>{product.lastMovement}</TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {inventoryReport.length === 0 && (
                <Box p={isMobile ? 2 : 4} textAlign="center">
                  <Alert 
                    severity="info"
                    sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                  >
                    No hay productos en la categoría seleccionada
                  </Alert>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
}

export default Reports;
