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
  Chip
} from '@mui/material';
import {
  Inventory,
  TrendingUp,
  Download,
  DateRange
} from '@mui/icons-material';
import { useSales } from '../../hooks/useSales';
import { useProducts } from '../../hooks/useProducts';
import { format, startOfDay, endOfDay, subDays, parseISO } from 'date-fns';
import { displayCurrency } from '../../utils/formatPrice';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
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
  const [activeTab, setActiveTab] = useState(0);
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedCategory, setSelectedCategory] = useState('');

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

  // Función para exportar reportes (simulada)
  const exportReport = (type) => {
    const data = type === 'sales' ? filteredSales : inventoryReport;
    const csvContent = "data:text/csv;charset=utf-8," + 
      JSON.stringify(data, null, 2);
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_${type}_${format(new Date(), 'yyyy-MM-dd')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reportes y Análisis
      </Typography>

      {/* Filtros de fecha */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <DateRange sx={{ mr: 1, verticalAlign: 'middle' }} />
            <Typography variant="h6" component="span">
              Período de Análisis
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Fecha desde"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
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
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab 
            icon={<TrendingUp />} 
            label="Reporte de Ventas" 
            id="reports-tab-0"
          />
          <Tab 
            icon={<Inventory />} 
            label="Reporte de Inventario" 
            id="reports-tab-1"
          />
        </Tabs>
      </Paper>

      {/* Reporte de Ventas */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          {/* Estadísticas generales */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Ventas
                </Typography>
                <Typography variant="h4" color="primary">
                  {salesStats.totalSales}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Ingresos Totales
                </Typography>
                <Typography variant="h4" color="success.main">
                  {displayCurrency(salesStats.totalRevenue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Artículos Vendidos
                </Typography>
                <Typography variant="h4" color="info.main">
                  {salesStats.totalItems}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Venta Promedio
                </Typography>
                <Typography variant="h4">
                  {displayCurrency(salesStats.averageSale)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Productos más vendidos */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Productos Más Vendidos
                </Typography>
                <Button
                  size="small"
                  startIcon={<Download />}
                  onClick={() => exportReport('sales')}
                >
                  Exportar
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Vendidos</TableCell>
                      <TableCell align="right">Ingresos</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topProducts.slice(0, 5).map(([productId, data], index) => (
                      <TableRow key={productId}>
                        <TableCell>
                          <Typography variant="body2">
                            {index + 1}. {data.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {data.category}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{data.quantity}</TableCell>
                        <TableCell align="right">
                          {displayCurrency(data.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {topProducts.length === 0 && (
                <Alert severity="info">No hay datos de ventas en el período seleccionado</Alert>
              )}
            </Paper>
          </Grid>

          {/* Ventas por categoría */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Ventas por Categoría
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Categoría</TableCell>
                      <TableCell align="right">Ventas</TableCell>
                      <TableCell align="right">Ingresos</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(categoryStats)
                      .sort(([,a], [,b]) => b.revenue - a.revenue)
                      .map(([category, data]) => (
                        <TableRow key={category}>
                          <TableCell>{category}</TableCell>
                          <TableCell align="right">{data.sales}</TableCell>
                          <TableCell align="right">
                            {displayCurrency(data.revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {Object.keys(categoryStats).length === 0 && (
                <Alert severity="info">No hay datos de ventas en el período seleccionado</Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Reporte de Inventario */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          {/* Estadísticas de inventario */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Productos
                </Typography>
                <Typography variant="h4" color="primary">
                  {inventoryStats.totalProducts}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Valor Inventario
                </Typography>
                <Typography variant="h4" color="success.main">
                  {displayCurrency(inventoryStats.totalValue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Sin Stock
                </Typography>
                <Typography variant="h4" color="error.main">
                  {inventoryStats.outOfStock}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Stock Bajo
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {inventoryStats.lowStock}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Filtros de inventario */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
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
                <Grid item>
                  <Button
                    startIcon={<Download />}
                    onClick={() => exportReport('inventory')}
                  >
                    Exportar Inventario
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Tabla de inventario */}
          <Grid item xs={12}>
            <Paper elevation={2}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell>Categoría</TableCell>
                      <TableCell align="right">Stock</TableCell>
                      <TableCell align="right">Precio</TableCell>
                      <TableCell align="right">Valor Total</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Último Movimiento</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventoryReport.slice(0, 20).map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {product.name}
                          </Typography>
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell align="right">{product.stock}</TableCell>
                        <TableCell align="right">
                          {displayCurrency(product.price)}
                        </TableCell>
                        <TableCell align="right">
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
                          />
                        </TableCell>
                        <TableCell>{product.lastMovement}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {inventoryReport.length === 0 && (
                <Box p={4} textAlign="center">
                  <Alert severity="info">
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
