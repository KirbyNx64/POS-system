import React, { useState } from 'react';
import {
  Container,
  Paper,
  Button,
  Typography,
  Box,
  Alert,
  Avatar,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  Google as GoogleIcon, 
  PointOfSale as POSIcon,
  Store as StoreIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { useApp } from '../../contexts/AppContext';

function Login() {
  const { dispatch } = useApp();
  const { signInWithGoogle, error } = useFirebaseAuth();
  const [localError, setLocalError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleGoogleSignIn = async () => {
    try {
      setLocalError('');
      setIsSigningIn(true);
      
      // Timeout de seguridad más corto para ventanas cerradas
      const timeoutId = setTimeout(() => {
        console.log('🔐 Login: Timeout de seguridad - reactivando botón');
        setIsSigningIn(false);
      }, 5000); // 5 segundos máximo (más rápido para cancelaciones)
      
      const user = await signInWithGoogle();
      
      // Cancelar el timeout si el login se completó
      clearTimeout(timeoutId);
      
      // El usuario se establece automáticamente en el hook
      // Solo necesitamos sincronizarlo con nuestro contexto
      if (user) {
        dispatch({
          type: 'LOGIN',
          payload: {
            id: user.uid,
            name: user.displayName || 'Usuario',
            email: user.email,
            photoURL: user.photoURL,
            role: 'admin', // Por defecto admin
            loginTime: new Date().toISOString()
          }
        });
      }
      // Si user es null, significa que el usuario cerró la ventana sin seleccionar - no hacer nada
    } catch (error) {
      console.error('Error en login:', error);
      console.log('🔐 Login: Código de error recibido:', error.code);
      
      // Solo mostrar error si no es una cancelación del usuario (ventana cerrada)
      if (error.code !== 'auth/popup-closed-by-user' && 
          error.code !== 'auth/cancelled-popup-request' &&
          error.code !== 'auth/popup-blocked' &&
          error.code !== 'auth/user-cancelled') {
        setLocalError('Error al iniciar sesión con Google. Inténtalo de nuevo.');
      }
    } finally {
      // Reactivar el botón inmediatamente - esto es lo más importante
      console.log('🔐 Login: Reactivando botón en finally block');
      setIsSigningIn(false);
    }
  };

  const displayError = localError || error;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        p: isMobile ? 1 : 3,
        pt: isMobile ? 2 : 3
      }}
    >
      <Container maxWidth="md">
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 2 : 4,
            alignItems: 'center',
            mt: isMobile ? 1 : 0
          }}
        >
          {/* Panel Izquierdo - Información del Sistema */}
          <Box sx={{ flex: 1, textAlign: isMobile ? 'center' : 'left' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: isMobile ? 'center' : 'flex-start' }}>
              <Avatar
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  width: isMobile ? 60 : 80,
                  height: isMobile ? 60 : 80,
                  mr: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                <POSIcon sx={{ fontSize: isMobile ? 30 : 40 }} />
              </Avatar>
              <Box>
                <Typography
                  variant={isMobile ? "h4" : "h3"}
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                    mb: 1
                  }}
                >
                  Sistema POS
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'rgba(255,255,255,0.8)',
                    fontWeight: 300
                  }}
                >
                  Punto de Venta e Inventario
                </Typography>
              </Box>
            </Box>

            {/* En móvil, mostrar el formulario de login aquí */}
            {isMobile && (
              <Paper
                elevation={10}
                sx={{
                  p: 3,
                  width: '100%',
                  maxWidth: 400,
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                  mb: 3
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      color: 'primary.main',
                      fontWeight: 'bold',
                      mb: 1
                    }}
                  >
                    ¡Bienvenido!
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Inicia sesión para acceder a tu sistema de ventas
                  </Typography>
                </Box>

                {displayError && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {displayError}
                  </Alert>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<GoogleIcon />}
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  sx={{
                    py: 1.5,
                    mb: 3,
                    backgroundColor: '#4285f4',
                    borderRadius: 2,
                    fontSize: '1rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#357ae8',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(66, 133, 244, 0.4)'
                    },
                    '&:disabled': {
                      backgroundColor: '#e0e0e0',
                      color: '#9e9e9e'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isSigningIn ? 'Iniciando sesión...' : 'Iniciar Sesión con Google'}
                </Button>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Acceso seguro
                  </Typography>
                </Divider>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    🔒 Tus datos están protegidos con autenticación de Google
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    No almacenamos contraseñas, solo accedemos a tu cuenta de Google
                  </Typography>
                </Box>
              </Paper>
            )}

            {!isMobile && (
              <Typography
                variant="h5"
                sx={{
                  color: 'white',
                  mb: 3,
                  fontWeight: 500,
                  textAlign: 'left'
                }}
              >
                Gestiona tu negocio de forma inteligente
              </Typography>
            )}

            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2,
              alignItems: isMobile ? 'center' : 'flex-start'
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: 'white',
                justifyContent: 'flex-start',
                width: isMobile ? 'fit-content' : '100%',
                minWidth: isMobile ? '240px' : 'auto'
              }}>
                <StoreIcon sx={{ mr: 2, fontSize: 24, flexShrink: 0 }} />
                <Typography variant="body1">
                  Control total de inventario
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: 'white',
                justifyContent: 'flex-start',
                width: isMobile ? 'fit-content' : '100%',
                minWidth: isMobile ? '240px' : 'auto'
              }}>
                <TrendingUpIcon sx={{ mr: 2, fontSize: 24, flexShrink: 0 }} />
                <Typography variant="body1">
                  Reportes y análisis de ventas
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: 'white',
                justifyContent: 'flex-start',
                width: isMobile ? 'fit-content' : '100%',
                minWidth: isMobile ? '240px' : 'auto'
              }}>
                <SecurityIcon sx={{ mr: 2, fontSize: 24, flexShrink: 0 }} />
                <Typography variant="body1">
                  Acceso seguro con Google
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Panel Derecho - Formulario de Login (solo en desktop) */}
          {!isMobile && (
            <Paper
              elevation={10}
              sx={{
                p: 4,
                width: '100%',
                maxWidth: 400,
                borderRadius: 3,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography
                  variant="h5"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 'bold',
                    mb: 1
                  }}
                >
                  ¡Bienvenido!
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Inicia sesión para acceder a tu sistema de ventas
                </Typography>
              </Box>

              {displayError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {displayError}
                </Alert>
              )}

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                sx={{
                  py: 1.5,
                  mb: 3,
                  backgroundColor: '#4285f4',
                  borderRadius: 2,
                  fontSize: '1rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#357ae8',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(66, 133, 244, 0.4)'
                  },
                  '&:disabled': {
                    backgroundColor: '#e0e0e0',
                    color: '#9e9e9e'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {isSigningIn ? 'Iniciando sesión...' : 'Iniciar Sesión con Google'}
              </Button>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Acceso seguro
                </Typography>
              </Divider>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  🔒 Tus datos están protegidos con autenticación de Google
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  No almacenamos contraseñas, solo accedemos a tu cuenta de Google
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      </Container>
    </Box>
  );
}

export default Login;
