import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Chip,
  BottomNavigation,
  BottomNavigationAction,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Dashboard,
  Inventory,
  PointOfSale,
  Assessment,
  AccountCircle,
  Logout,
  Warning,
  Settings
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Productos', icon: <Inventory />, path: '/products' },
  { text: 'Ventas', icon: <PointOfSale />, path: '/sales' },
  { text: 'Reportes', icon: <Assessment />, path: '/reports' },
  { text: 'Configuración', icon: <Settings />, path: '/settings' },
];

function Layout({ children }) {
  const { state, dispatch } = useApp();
  const { user, logout } = useFirebaseAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Debug: Log del usuario para verificar datos
  React.useEffect(() => {
    if (user) {
      console.log('👤 Layout - Usuario actual:', user);
      console.log('👤 Layout - photoURL:', user.photoURL);
      console.log('👤 Layout - displayName:', user.name);
      console.log('👤 Layout - email:', user.email);
    }
  }, [user]);

  // Función para procesar la URL de la foto de Google
  const getProcessedPhotoURL = (photoURL) => {
    if (!photoURL) return null;
    
    // Si es una URL de Google Photos, usar un proxy para evitar límites de rate
    if (photoURL.includes('googleusercontent.com')) {
      // Usar el proxy de Google Images para evitar límites de rate
      const baseURL = photoURL.split('=')[0];
      const processedURL = `${baseURL}=s128-c`;
      
      // Intentar usar un proxy de imágenes para evitar 429 errors
      return `https://images.weserv.nl/?url=${encodeURIComponent(processedURL)}&w=128&h=128&fit=cover&output=webp`;
    }
    
    return photoURL;
  };

  // Componente de Avatar personalizado para manejar mejor las imágenes de Google
  const CustomAvatar = ({ src, children, sx, onError, onLoad }) => {
    const [imageError, setImageError] = React.useState(false);
    const [fallbackUsed, setFallbackUsed] = React.useState(false);

    const handleError = (e) => {
      console.log('❌ Error cargando imagen personalizada:', src);
      
      // Si es la primera vez que falla y es una URL de proxy, intentar la URL original
      if (!fallbackUsed && src && src.includes('images.weserv.nl')) {
        console.log('🔄 Intentando fallback a URL original...');
        setFallbackUsed(true);
        setImageError(false);
        
        // Extraer la URL original del proxy
        const originalURL = decodeURIComponent(src.split('url=')[1].split('&')[0]);
        e.target.src = originalURL;
        return;
      }
      
      setImageError(true);
      if (onError) onError(e);
    };

    const handleLoad = (e) => {
      console.log('✅ Imagen personalizada cargada exitosamente:', src);
      if (onLoad) onLoad(e);
    };

    if (src && !imageError) {
      return (
        <Avatar sx={sx}>
          <img
            src={src}
            alt="Profile"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%'
            }}
            onError={handleError}
            onLoad={handleLoad}
            crossOrigin="anonymous"
          />
        </Avatar>
      );
    }

    return (
      <Avatar sx={sx}>
        {children}
      </Avatar>
    );
  };

  // Calcular productos con stock bajo
  const lowStockProducts = state.products.filter(
    product => product.active && product.stock <= state.stockThreshold
  ).length;



  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      dispatch({ type: 'LOGOUT' });
      handleMenuClose();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Sistema POS
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
              }}
            >
              <ListItemIcon>
                {item.path === '/products' && lowStockProducts > 0 ? (
                  <Badge badgeContent={lowStockProducts} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  // Bottom navigation para móvil
  const bottomNavValue = menuItems.findIndex(item => item.path === location.pathname);

  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <CssBaseline />
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar sx={{ minHeight: '56px !important' }}>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontSize: '1.1rem' }}>
              {menuItems.find(item => item.path === location.pathname)?.text || 'Sistema POS'}
            </Typography>
            
            {lowStockProducts > 0 && (
              <Chip
                icon={<Warning />}
                label={lowStockProducts}
                color="warning"
                size="small"
                sx={{ mr: 1, fontSize: '0.7rem' }}
              />
            )}

            <IconButton
              size="small"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenuClick}
              color="inherit"
            >
              <CustomAvatar 
                src={getProcessedPhotoURL(user?.photoURL)} 
                sx={{ width: 28, height: 28, bgcolor: 'secondary.main', fontSize: '0.8rem' }}
                onError={(e) => {
                  console.log('❌ Error cargando foto de perfil:', getProcessedPhotoURL(user?.photoURL));
                }}
                onLoad={() => {
                  console.log('✅ Foto de perfil cargada exitosamente:', getProcessedPhotoURL(user?.photoURL));
                }}
              >
                {!user?.photoURL && (user?.name?.charAt(0) || user?.email?.charAt(0) || 'U')}
              </CustomAvatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleMenuClose}>
                <AccountCircle sx={{ mr: 1 }} />
                {user?.name || user?.email || 'Usuario'}
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Cerrar Sesión
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>



        {/* Contenido principal */}
        <Box
          component="main"
          sx={{ 
            flexGrow: 1, 
            p: { xs: 2, sm: 3 }, 
            pt: { xs: 8, sm: 10 },
            pb: { xs: 8, sm: 3 },
            overflow: 'auto'
          }}
        >
          {children}
        </Box>

        {/* Bottom Navigation */}
        <BottomNavigation
          value={bottomNavValue}
          onChange={(event, newValue) => {
            navigate(menuItems[newValue].path);
          }}
          showLabels
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
            backgroundColor: 'white',
            borderTop: '1px solid #e0e0e0',
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.7rem',
              fontWeight: 500
            },
            '& .MuiBottomNavigationAction-root.Mui-selected': {
              color: theme.palette.primary.main
            }
          }}
        >
          {menuItems.map((item, index) => (
            <BottomNavigationAction
              key={item.text}
              label={item.text}
              icon={
                item.path === '/products' && lowStockProducts > 0 ? (
                  <Badge badgeContent={lowStockProducts} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )
              }
            />
          ))}
        </BottomNavigation>
      </Box>
    );
  }

  // Layout para desktop
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Sistema POS'}
          </Typography>
          
          {lowStockProducts > 0 && (
            <Chip
              icon={<Warning />}
              label={`${lowStockProducts} productos con stock bajo`}
              color="warning"
              size="small"
              sx={{ mr: 2 }}
            />
          )}

          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuClick}
            color="inherit"
          >
            <CustomAvatar 
              src={getProcessedPhotoURL(user?.photoURL)} 
              sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}
              onError={(e) => {
                console.log('❌ Error cargando foto de perfil (desktop):', getProcessedPhotoURL(user?.photoURL));
              }}
              onLoad={() => {
                console.log('✅ Foto de perfil cargada exitosamente (desktop):', getProcessedPhotoURL(user?.photoURL));
              }}
            >
              {!user?.photoURL && (user?.name?.charAt(0) || user?.email?.charAt(0) || 'U')}
            </CustomAvatar>
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>
              <AccountCircle sx={{ mr: 1 }} />
              {user?.name || user?.email || 'Usuario'}
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} />
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

export default Layout;
