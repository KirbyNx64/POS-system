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
  Button,
  useMediaQuery,
  useTheme,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material';
import {
  Inventory,
  AttachMoney,
  Warning,
  TrendingUp,
  ShoppingCart,
  Refresh,
  CleaningServices,
  DeleteForever,
  Settings
} from '@mui/icons-material';
import { useSales } from '../../hooks/useSales';
import { useProducts } from '../../hooks/useProducts';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { clearFirebaseSales, clearAllFirebaseData } from '../../utils/resetSystem';
import { displayCurrency } from '../../utils/formatPrice';
import TaxSettings from '../Settings/TaxSettings';

function StatCard({ title, value, icon, color = 'primary', subtitle, isMobile = false }) {
  return (
    <Card elevation={isMobile ? 1 : 3} sx={{ height: isMobile ? 'auto' : '100%' }}>
      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box sx={{ flex: 1 }}>
            <Typography 
              color="textSecondary" 
              gutterBottom 
              variant={isMobile ? "caption" : "body2"}
              sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
            >
              {title}
            </Typography>
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              component="h2" 
              color={color}
              sx={{ fontSize: isMobile ? '1.2rem' : '2.125rem' }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography 
                variant={isMobile ? "caption" : "body2"} 
                color="textSecondary"
                sx={{ fontSize: isMobile ? '0.65rem' : '0.875rem' }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box 
            color={color === 'primary' ? 'primary.main' : `${color}.main`}
            sx={{ ml: 1 }}
          >
            {React.cloneElement(icon, { 
              fontSize: isMobile ? 'medium' : 'large' 
            })}
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
  const { user } = useFirebaseAuth();
  const [taxSettingsOpen, setTaxSettingsOpen] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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



  const handleClearSales = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar todas las ventas? Los productos se mantendrán intactos.')) {
      try {
        if (!user || !user.id) {
          alert('Error: Usuario no autenticado');
          return;
        }
        
        const result = await clearFirebaseSales(user.id);
        alert(`Ventas eliminadas correctamente. Se eliminaron ${result.deletedCount} ventas.`);
        
        // Recargar la página para actualizar los datos
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } catch (error) {
        console.error('Error al limpiar ventas:', error);
        alert('Error al limpiar las ventas. Por favor, inténtalo de nuevo.');
      }
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar TODOS los datos? Esto borrará productos, ventas e inventario completamente.')) {
      try {
        if (!user || !user.id) {
          alert('Error: Usuario no autenticado');
          return;
        }
        
        const result = await clearAllFirebaseData(user.id);
        alert(`Todos los datos han sido eliminados. Se eliminaron ${result.deletedCount} documentos.`);
        
        // Recargar la página para actualizar los datos
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } catch (error) {
        console.error('Error al eliminar todos los datos:', error);
        alert('Error al eliminar los datos. Por favor, inténtalo de nuevo.');
      }
    }
  };

  const speedDialActions = [
    {
      icon: <Settings />,
      name: 'Configurar Impuestos',
      onClick: () => setTaxSettingsOpen(true)
    },
    {
      icon: <CleaningServices />,
      name: 'Limpiar Ventas',
      onClick: handleClearSales
    },
    {
      icon: <DeleteForever />,
      name: 'Borrar Todo',
      onClick: handleClearAll
    }
  ];

  return (
    <Box>
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={isMobile ? 2 : 3}
        flexDirection={isMobile ? 'column' : 'row'}
        gap={isMobile ? 2 : 0}
      >
        <Typography 
          variant={isMobile ? "h5" : "h4"}
          sx={{ fontSize: isMobile ? '1.3rem' : '2.125rem' }}
        >
          Dashboard
        </Typography>
        
        {!isMobile && (
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
        )}
      </Box>
      
      <Grid container spacing={isMobile ? 2 : 3}>
        {/* Estadísticas principales */}
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Productos Activos"
            value={activeProducts}
            subtitle={`de ${totalProducts} total`}
            icon={<Inventory />}
            isMobile={isMobile}
          />
        </Grid>
        
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Ventas Hoy"
            value={todaySales.length}
            subtitle={`${todayItemsSold} artículos`}
            icon={<ShoppingCart />}
            color="success"
            isMobile={isMobile}
          />
        </Grid>
        
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Ingresos Hoy"
            value={displayCurrency(todayRevenue)}
            subtitle={`Semana: ${displayCurrency(weekRevenue)}`}
            icon={<AttachMoney />}
            color="success"
            isMobile={isMobile}
          />
        </Grid>
        
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Total de Ventas"
            value={displayCurrency(sales.reduce((sum, sale) => sum + sale.total, 0))}
            subtitle={`${sales.length} ventas totales`}
            icon={<TrendingUp />}
            color="info"
            isMobile={isMobile}
          />
        </Grid>

        {/* Alertas de stock */}
        {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
          <Grid item xs={12}>
            <Paper elevation={isMobile ? 1 : 3} sx={{ p: isMobile ? 1.5 : 2 }}>
              <Box display="flex" alignItems="center" mb={isMobile ? 1 : 2}>
                <Warning color="warning" sx={{ mr: 1, fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"}
                  sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
                >
                  Alertas de Inventario
                </Typography>
              </Box>
              
              <Grid container spacing={isMobile ? 1 : 2}>
                {outOfStockProducts.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Typography 
                      variant={isMobile ? "body2" : "subtitle1"} 
                      color="error" 
                      gutterBottom
                      sx={{ fontSize: isMobile ? '0.8rem' : '1rem' }}
                    >
                      Sin Stock ({outOfStockProducts.length})
                    </Typography>
                    <List dense>
                      {outOfStockProducts.slice(0, isMobile ? 3 : 5).map(product => (
                        <ListItem key={product.id} sx={{ px: 0 }}>
                          <ListItemText
                            primary={product.name}
                            secondary={product.category}
                            primaryTypographyProps={{ 
                              fontSize: isMobile ? '0.8rem' : '0.875rem' 
                            }}
                            secondaryTypographyProps={{ 
                              fontSize: isMobile ? '0.7rem' : '0.75rem' 
                            }}
                          />
                          <Chip 
                            label="Sin stock" 
                            color="error" 
                            size="small"
                            sx={{ fontSize: isMobile ? '0.6rem' : '0.75rem' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
                
                {lowStockProducts.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Typography 
                      variant={isMobile ? "body2" : "subtitle1"} 
                      color="warning.main" 
                      gutterBottom
                      sx={{ fontSize: isMobile ? '0.8rem' : '1rem' }}
                    >
                      Stock Bajo ({lowStockProducts.length})
                    </Typography>
                    <List dense>
                      {lowStockProducts.slice(0, isMobile ? 3 : 5).map(product => (
                        <ListItem key={product.id} sx={{ px: 0 }}>
                          <ListItemText
                            primary={product.name}
                            secondary={`Stock: ${product.stock}`}
                            primaryTypographyProps={{ 
                              fontSize: isMobile ? '0.8rem' : '0.875rem' 
                            }}
                            secondaryTypographyProps={{ 
                              fontSize: isMobile ? '0.7rem' : '0.75rem' 
                            }}
                          />
                          <Chip 
                            label={`${product.stock} unidades`} 
                            color="warning" 
                            size="small"
                            sx={{ fontSize: isMobile ? '0.6rem' : '0.75rem' }}
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
          <Paper 
            elevation={isMobile ? 1 : 3} 
            sx={{ 
              p: isMobile ? 1.5 : 2, 
              height: isMobile ? 'auto' : '400px',
              minHeight: isMobile ? '200px' : '400px'
            }}
          >
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"} 
              gutterBottom
              sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
            >
              Productos Más Vendidos
            </Typography>
            <List>
              {topProducts.length > 0 ? (
                topProducts.slice(0, isMobile ? 3 : 5).map(([productId, data], index) => (
                  <ListItem key={productId} sx={{ px: 0 }}>
                    <ListItemText
                      primary={`${index + 1}. ${data.name}`}
                      secondary={`${data.quantity} vendidos - ${displayCurrency(data.revenue)}`}
                      primaryTypographyProps={{ 
                        fontSize: isMobile ? '0.8rem' : '0.875rem' 
                      }}
                      secondaryTypographyProps={{ 
                        fontSize: isMobile ? '0.7rem' : '0.75rem' 
                      }}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText 
                    primary="No hay ventas registradas aún"
                    primaryTypographyProps={{ 
                      fontSize: isMobile ? '0.8rem' : '0.875rem' 
                    }}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Ventas recientes */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={isMobile ? 1 : 3} 
            sx={{ 
              p: isMobile ? 1.5 : 2, 
              height: isMobile ? 'auto' : '400px',
              minHeight: isMobile ? '200px' : '400px'
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={isMobile ? 1 : 2}>
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"}
                sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
              >
                Ventas Recientes
              </Typography>
              <IconButton size="small">
                <Refresh fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
            </Box>
            <List>
              {sales.slice(-5).reverse().slice(0, isMobile ? 3 : 5).map(sale => (
                <ListItem key={sale.id} sx={{ px: 0 }}>
                  <ListItemText
                    primary={`Venta #${sale.id.slice(-6)}`}
                    secondary={
                      <Box>
                        <Typography 
                          variant="body2" 
                          color="textSecondary"
                          sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                        >
                          {format(new Date(sale.timestamp), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </Typography>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                        >
                          {sale.items.length} artículos - {displayCurrency(sale.total)}
                        </Typography>
                      </Box>
                    }
                    primaryTypographyProps={{ 
                      fontSize: isMobile ? '0.8rem' : '0.875rem' 
                    }}
                  />
                </ListItem>
              ))}
              {sales.length === 0 && (
                <ListItem>
                  <ListItemText 
                    primary="No hay ventas registradas aún"
                    primaryTypographyProps={{ 
                      fontSize: isMobile ? '0.8rem' : '0.875rem' 
                    }}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Speed Dial para móvil */}
      {isMobile && (
        <SpeedDial
          ariaLabel="Acciones rápidas"
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16,
            zIndex: theme.zIndex.speedDial,
            '& .MuiFab-primary': {
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark
              }
            }
          }}
          icon={<SpeedDialIcon />}
          onClose={() => setSpeedDialOpen(false)}
          onOpen={() => setSpeedDialOpen(true)}
          open={speedDialOpen}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={() => {
                action.onClick();
                setSpeedDialOpen(false);
              }}
            />
          ))}
        </SpeedDial>
      )}

      {/* Dialog de configuración de impuestos */}
      <TaxSettings
        open={taxSettingsOpen}
        onClose={() => setTaxSettingsOpen(false)}
      />
    </Box>
  );
}

export default Dashboard;
