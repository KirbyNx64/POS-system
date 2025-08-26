import React, { useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Button
} from '@mui/material';
import {
  Inventory,
  AttachMoney,
  Warning,
  TrendingUp,
  ShoppingCart,
  Refresh,
  RestartAlt,
  CleaningServices,
  DeleteForever,
  Settings
} from '@mui/icons-material';
import { useSales } from '../../hooks/useSales';
import { useProducts } from '../../hooks/useProducts';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { resetSystemData, clearSalesData, clearAllData } from '../../utils/resetSystem';
import { displayCurrency } from '../../utils/formatPrice';
import TaxSettings from '../Settings/TaxSettings';

function StatCard({ title, value, icon, color = 'primary', subtitle }) {
  return (
    <Card elevation={3}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="h2" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box color={color === 'primary' ? 'primary.main' : `${color}.main`}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  console.log('Dashboard - Hook ejecutándose');
  const { sales, loading: salesLoading, error: salesError } = useSales();
  const { allProducts, loading: productsLoading, error: productsError } = useProducts();
  const [taxSettingsOpen, setTaxSettingsOpen] = useState(false);

  // Mostrar loading mientras se cargan los datos
  if (salesLoading || productsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6">Cargando datos del dashboard...</Typography>
      </Box>
    );
  }

  // Mostrar error si hay problemas
  if (salesError || productsError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="error">
          Error cargando datos: {salesError || productsError}
        </Typography>
      </Box>
    );
  }

  // Debug: verificar datos cargados
  console.log('Dashboard - Datos cargados:', { 
    productsCount: allProducts.length, 
    salesCount: sales.length,
    products: allProducts.slice(0, 2), // Primeros 2 productos
    sales: sales.slice(0, 2) // Primeras 2 ventas
  });

  // Calcular estadísticas
  const activeProducts = allProducts.filter(p => p.active).length;
  const totalProducts = allProducts.length;
  
  const lowStockProducts = allProducts.filter(
    p => p.active && p.stock <= 10 // Usar un valor fijo por ahora
  );
  
  const outOfStockProducts = allProducts.filter(
    p => p.active && p.stock === 0
  );

  // Ventas de hoy
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  
  const todaySales = sales.filter(sale => {
    // Validar que el timestamp sea válido
    if (!sale.timestamp || isNaN(new Date(sale.timestamp).getTime())) {
      return false;
    }
    const saleDate = new Date(sale.timestamp);
    return saleDate >= todayStart && saleDate <= todayEnd;
  });

  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const todayItemsSold = todaySales.reduce((sum, sale) => 
    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  // Ventas de la semana
  const weekStart = subDays(today, 7);
  const weekSales = sales.filter(sale => {
    // Validar que el timestamp sea válido
    if (!sale.timestamp || isNaN(new Date(sale.timestamp).getTime())) {
      return false;
    }
    const saleDate = new Date(sale.timestamp);
    return saleDate >= weekStart;
  });
  const weekRevenue = weekSales.reduce((sum, sale) => sum + sale.total, 0);

  // Productos más vendidos
  const productSales = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (productSales[item.id]) {
        productSales[item.id].quantity += item.quantity;
        productSales[item.id].revenue += item.price * item.quantity;
      } else {
        productSales[item.id] = {
          name: item.name,
          quantity: item.quantity,
          revenue: item.price * item.quantity
        };
      }
    });
  });

  const topProducts = Object.entries(productSales)
    .sort(([,a], [,b]) => b.quantity - a.quantity)
    .slice(0, 5);

  // Valor total del inventario
  const inventoryValue = allProducts
    .filter(p => p.active)
    .reduce((sum, product) => sum + (product.price * product.stock), 0);

  const handleResetSystem = () => {
    if (window.confirm('¿Estás seguro de que quieres resetear el sistema? Esto eliminará todos los productos y ventas.')) {
      resetSystemData();
    }
  };

  const handleClearSales = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar todas las ventas? Los productos se mantendrán intactos.')) {
      clearSalesData();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar TODOS los datos? Esto borrará productos, ventas e inventario completamente.')) {
      clearAllData();
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Dashboard
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => setTaxSettingsOpen(true)}
            sx={{ mr: 1 }}
            size="small"
          >
            Configurar Impuestos
          </Button>
          <Button
            variant="outlined"
            startIcon={<CleaningServices />}
            onClick={handleClearSales}
            sx={{ mr: 1 }}
            size="small"
          >
            Limpiar Ventas
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteForever />}
            onClick={handleClearAll}
            size="small"
          >
            Borrar Todo
          </Button>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {/* Estadísticas principales */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Productos Activos"
            value={activeProducts}
            subtitle={`de ${totalProducts} total`}
            icon={<Inventory fontSize="large" />}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ventas Hoy"
            value={todaySales.length}
            subtitle={`${todayItemsSold} artículos`}
            icon={<ShoppingCart fontSize="large" />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ingresos Hoy"
            value={displayCurrency(todayRevenue)}
            subtitle={`Semana: ${displayCurrency(weekRevenue)}`}
            icon={<AttachMoney fontSize="large" />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Ventas"
            value={displayCurrency(sales.reduce((sum, sale) => sum + sale.total, 0))}
            subtitle={`${sales.length} ventas totales`}
            icon={<TrendingUp fontSize="large" />}
            color="info"
          />
        </Grid>

        {/* Alertas de stock */}
        {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Warning color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Alertas de Inventario
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                {outOfStockProducts.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" color="error" gutterBottom>
                      Sin Stock ({outOfStockProducts.length})
                    </Typography>
                    <List dense>
                      {outOfStockProducts.slice(0, 5).map(product => (
                        <ListItem key={product.id}>
                          <ListItemText
                            primary={product.name}
                            secondary={product.category}
                          />
                          <Chip label="Sin stock" color="error" size="small" />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
                
                {lowStockProducts.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" color="warning.main" gutterBottom>
                      Stock Bajo ({lowStockProducts.length})
                    </Typography>
                    <List dense>
                      {lowStockProducts.slice(0, 5).map(product => (
                        <ListItem key={product.id}>
                          <ListItemText
                            primary={product.name}
                            secondary={`Stock: ${product.stock}`}
                          />
                          <Chip 
                            label={`${product.stock} unidades`} 
                            color="warning" 
                            size="small" 
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Productos más vendidos */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
              Productos Más Vendidos
            </Typography>
            <List>
              {topProducts.length > 0 ? (
                topProducts.map(([productId, data], index) => (
                  <ListItem key={productId}>
                    <ListItemText
                      primary={`${index + 1}. ${data.name}`}
                      secondary={`${data.quantity} vendidos - ${displayCurrency(data.revenue)}`}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No hay ventas registradas aún" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Ventas recientes */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '400px' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Ventas Recientes
              </Typography>
              <IconButton size="small">
                <Refresh />
              </IconButton>
            </Box>
            <List>
              {sales.slice(-5).reverse().map(sale => (
                <ListItem key={sale.id}>
                  <ListItemText
                    primary={`Venta #${sale.id.slice(-6)}`}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          {format(new Date(sale.timestamp), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </Typography>
                        <Typography variant="body2">
                          {sale.items.length} artículos - {displayCurrency(sale.total)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {sales.length === 0 && (
                <ListItem>
                  <ListItemText primary="No hay ventas registradas aún" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog de configuración de impuestos */}
      <TaxSettings
        open={taxSettingsOpen}
        onClose={() => setTaxSettingsOpen(false)}
      />
    </Box>
  );
}

export default Dashboard;
