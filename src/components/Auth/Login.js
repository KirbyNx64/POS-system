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
  TextField,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  Google as GoogleIcon, 
  PointOfSale as POSIcon,
  Store as StoreIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { useApp } from '../../contexts/AppContext';

function Login() {
  const { dispatch } = useApp();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, resendEmailVerification, error } = useFirebaseAuth();
  const [localError, setLocalError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
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

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    try {
      setLocalError('');
      setSuccessMessage('');
      setIsSigningIn(true);
      
      const user = await signInWithEmail(email, password);
      
      if (user) {
        // Verificar si el email está verificado antes de hacer login
        if (user.emailVerified) {
          dispatch({
            type: 'LOGIN',
            payload: {
              id: user.uid,
              name: user.displayName || 'Usuario',
              email: user.email,
              photoURL: user.photoURL,
              role: 'admin',
              loginTime: new Date().toISOString()
            }
          });
        } else {
          // Si el email no está verificado, mostrar mensaje pero no hacer login
          setLocalError('Debes verificar tu email antes de acceder al sistema. Revisa tu bandeja de entrada.');
        }
      }
    } catch (error) {
      console.error('Error en login con correo:', error);
      setLocalError('Error al iniciar sesión. Verifica tu correo y contraseña.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    try {
      setLocalError('');
      setSuccessMessage('');
      setIsSigningIn(true);
      
      if (password !== confirmPassword) {
        setLocalError('Las contraseñas no coinciden');
        return;
      }
      
      if (password.length < 6) {
        setLocalError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      
      const user = await signUpWithEmail(email, password, displayName);
      
      if (user) {
        // Verificar si el email está verificado (aunque es poco probable después del registro)
        if (user.emailVerified) {
          // Si por alguna razón ya está verificado, hacer login
          dispatch({
            type: 'LOGIN',
            payload: {
              id: user.uid,
              name: user.displayName || displayName || 'Usuario',
              email: user.email,
              photoURL: user.photoURL,
              role: 'admin',
              loginTime: new Date().toISOString()
            }
          });
        } else {
          // Mostrar pantalla de verificación
          setSuccessMessage('¡Cuenta creada exitosamente! Se ha enviado un email de verificación a tu correo electrónico. Por favor, verifica tu email antes de continuar.');
          setShowEmailVerification(true);
        }
      }
    } catch (error) {
      console.error('Error en registro con correo:', error);
      if (error.code === 'auth/email-already-in-use') {
        setLocalError('Este correo ya está registrado. Intenta iniciar sesión.');
      } else if (error.code === 'auth/weak-password') {
        setLocalError('La contraseña es muy débil. Usa al menos 6 caracteres.');
      } else if (error.code === 'auth/invalid-email') {
        setLocalError('El formato del correo electrónico no es válido.');
      } else {
        setLocalError('Error al crear la cuenta. Inténtalo de nuevo.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      setLocalError('');
      setSuccessMessage('');
      
      await resetPassword(resetEmail);
      setSuccessMessage('Se ha enviado un enlace de recuperación a tu correo electrónico.');
      setShowResetPassword(false);
      setResetEmail('');
    } catch (error) {
      console.error('Error al enviar email de recuperación:', error);
      if (error.code === 'auth/user-not-found') {
        setLocalError('No existe una cuenta con este correo electrónico.');
      } else if (error.code === 'auth/invalid-email') {
        setLocalError('El formato del correo electrónico no es válido.');
      } else {
        setLocalError('Error al enviar el email de recuperación. Inténtalo de nuevo.');
      }
    }
  };

  const handleResendVerification = async () => {
    try {
      setLocalError('');
      setSuccessMessage('');
      
      // Si no hay email y contraseña, mostrar error
      if (!email || !password) {
        setLocalError('Por favor, ingresa tu email y contraseña para reenviar el email de verificación.');
        return;
      }
      
      await resendEmailVerification(email, password);
      setSuccessMessage('Se ha reenviado el email de verificación. Revisa tu bandeja de entrada.');
    } catch (error) {
      console.error('Error al reenviar email de verificación:', error);
      if (error.message.includes('invalid-credential')) {
        setLocalError('Email o contraseña incorrectos. Verifica tus datos.');
      } else if (error.message.includes('too-many-requests')) {
        setLocalError('Has intentado reenviar el email demasiadas veces. Espera unos minutos antes de intentar de nuevo.');
      } else {
        setLocalError('Error al reenviar el email de verificación. Inténtalo de nuevo.');
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setLocalError('');
    setSuccessMessage('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setShowEmailVerification(false);
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

                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  centered
                  sx={{ mb: 3 }}
                >
                  <Tab label="Iniciar Sesión" />
                  <Tab label="Registrarse" />
                </Tabs>

                {displayError && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {displayError}
                  </Alert>
                )}

                {successMessage && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    {successMessage}
                  </Alert>
                )}

                {!showResetPassword && !showEmailVerification ? (
                  <>
                    {tabValue === 0 ? (
                      <form onSubmit={handleEmailSignIn}>
                        <TextField
                          fullWidth
                          label="Correo electrónico"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          sx={{ mb: 2 }}
                          InputProps={{
                            startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                        <TextField
                          fullWidth
                          label="Contraseña"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          sx={{ mb: 2 }}
                          InputProps={{
                            startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                        <Button
                          fullWidth
                          variant="contained"
                          type="submit"
                          disabled={isSigningIn}
                          sx={{ mb: 2, py: 1.5 }}
                        >
                          {isSigningIn ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </Button>
                        <Button
                          fullWidth
                          variant="text"
                          onClick={() => setShowResetPassword(true)}
                          sx={{ mb: 2 }}
                        >
                          ¿Olvidaste tu contraseña?
                        </Button>
                      </form>
                    ) : (
                      <form onSubmit={handleEmailSignUp}>
                        <TextField
                          fullWidth
                          label="Nombre completo"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          required
                          sx={{ mb: 2 }}
                          InputProps={{
                            startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                        <TextField
                          fullWidth
                          label="Correo electrónico"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          sx={{ mb: 2 }}
                          InputProps={{
                            startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                        <TextField
                          fullWidth
                          label="Contraseña"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          sx={{ mb: 2 }}
                          InputProps={{
                            startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                        <TextField
                          fullWidth
                          label="Confirmar contraseña"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          sx={{ mb: 2 }}
                          InputProps={{
                            startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                        <Button
                          fullWidth
                          variant="contained"
                          type="submit"
                          disabled={isSigningIn}
                          sx={{ mb: 2, py: 1.5 }}
                        >
                          {isSigningIn ? 'Creando cuenta...' : 'Crear Cuenta'}
                        </Button>
                      </form>
                    )}
                  </>
                ) : showEmailVerification ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                      📧 Verifica tu Email
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Hemos enviado un enlace de verificación a tu correo electrónico. 
                      Por favor, revisa tu bandeja de entrada y haz clic en el enlace para verificar tu cuenta.
                    </Typography>
                    
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        ¿No recibiste el email? Ingresa tus datos para reenviarlo:
                      </Typography>
                      <TextField
                        fullWidth
                        label="Correo electrónico"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        sx={{ mb: 2 }}
                        size="small"
                        InputProps={{
                          startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                      <TextField
                        fullWidth
                        label="Contraseña"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        sx={{ mb: 2 }}
                        size="small"
                        InputProps={{
                          startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleResendVerification}
                        sx={{ mb: 2 }}
                        size="small"
                      >
                        Reenviar Email de Verificación
                      </Button>
                    </Box>
                    
                    <Button
                      fullWidth
                      variant="text"
                      onClick={() => {
                        setShowEmailVerification(false);
                        setTabValue(0);
                      }}
                    >
                      Volver al Inicio de Sesión
                    </Button>
                  </Box>
                ) : (
                  <form onSubmit={handleResetPassword}>
                    <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                      Recuperar Contraseña
                    </Typography>
                    <TextField
                      fullWidth
                      label="Correo electrónico"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      sx={{ mb: 2 }}
                      InputProps={{
                        startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      type="submit"
                      sx={{ mb: 2, py: 1.5 }}
                    >
                      Enviar Enlace de Recuperación
                    </Button>
                    <Button
                      fullWidth
                      variant="text"
                      onClick={() => setShowResetPassword(false)}
                    >
                      Volver al inicio de sesión
                    </Button>
                  </form>
                )}

                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    O continúa con
                  </Typography>
                </Divider>

                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<GoogleIcon />}
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  sx={{
                    py: 1.5,
                    mb: 2,
                    borderColor: '#4285f4',
                    color: '#4285f4',
                    '&:hover': {
                      backgroundColor: '#f8f9ff',
                      borderColor: '#357ae8'
                    }
                  }}
                >
                  Google
                </Button>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    🔒 Tus datos están protegidos con autenticación segura
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

              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                centered
                sx={{ mb: 3 }}
              >
                <Tab label="Iniciar Sesión" />
                <Tab label="Registrarse" />
              </Tabs>

              {displayError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {displayError}
                </Alert>
              )}

              {successMessage && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {successMessage}
                </Alert>
              )}

              {!showResetPassword && !showEmailVerification ? (
                <>
                  {tabValue === 0 ? (
                    <form onSubmit={handleEmailSignIn}>
                      <TextField
                        fullWidth
                        label="Correo electrónico"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        sx={{ mb: 2 }}
                        InputProps={{
                          startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                      <TextField
                        fullWidth
                        label="Contraseña"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        sx={{ mb: 2 }}
                        InputProps={{
                          startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                      <Button
                        fullWidth
                        variant="contained"
                        type="submit"
                        disabled={isSigningIn}
                        sx={{ mb: 2, py: 1.5 }}
                      >
                        {isSigningIn ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                      </Button>
                      <Button
                        fullWidth
                        variant="text"
                        onClick={() => setShowResetPassword(true)}
                        sx={{ mb: 2 }}
                      >
                        ¿Olvidaste tu contraseña?
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleEmailSignUp}>
                      <TextField
                        fullWidth
                        label="Nombre completo"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                        sx={{ mb: 2 }}
                        InputProps={{
                          startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                      <TextField
                        fullWidth
                        label="Correo electrónico"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        sx={{ mb: 2 }}
                        InputProps={{
                          startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                      <TextField
                        fullWidth
                        label="Contraseña"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        sx={{ mb: 2 }}
                        InputProps={{
                          startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                      <TextField
                        fullWidth
                        label="Confirmar contraseña"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        sx={{ mb: 2 }}
                        InputProps={{
                          startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                      <Button
                        fullWidth
                        variant="contained"
                        type="submit"
                        disabled={isSigningIn}
                        sx={{ mb: 2, py: 1.5 }}
                      >
                        {isSigningIn ? 'Creando cuenta...' : 'Crear Cuenta'}
                      </Button>
                    </form>
                                      )}
                  </>
                ) : showEmailVerification ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                      📧 Verifica tu Email
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Hemos enviado un enlace de verificación a tu correo electrónico. 
                      Por favor, revisa tu bandeja de entrada y haz clic en el enlace para verificar tu cuenta.
                    </Typography>
                    
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        ¿No recibiste el email? Ingresa tus datos para reenviarlo:
                      </Typography>
                      <TextField
                        fullWidth
                        label="Correo electrónico"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        sx={{ mb: 2 }}
                        size="small"
                        InputProps={{
                          startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                      <TextField
                        fullWidth
                        label="Contraseña"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        sx={{ mb: 2 }}
                        size="small"
                        InputProps={{
                          startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleResendVerification}
                        sx={{ mb: 2 }}
                        size="small"
                      >
                        Reenviar Email de Verificación
                      </Button>
                    </Box>
                    
                    <Button
                      fullWidth
                      variant="text"
                      onClick={() => {
                        setShowEmailVerification(false);
                        setTabValue(0);
                      }}
                    >
                      Volver al Inicio de Sesión
                    </Button>
                  </Box>
                ) : (
                <form onSubmit={handleResetPassword}>
                  <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                    Recuperar Contraseña
                  </Typography>
                  <TextField
                    fullWidth
                    label="Correo electrónico"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    sx={{ mb: 2, py: 1.5 }}
                  >
                    Enviar Enlace de Recuperación
                  </Button>
                  <Button
                    fullWidth
                    variant="text"
                    onClick={() => setShowResetPassword(false)}
                  >
                    Volver al inicio de sesión
                  </Button>
                </form>
              )}

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  O continúa con
                </Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                sx={{
                  py: 1.5,
                  mb: 2,
                  borderColor: '#4285f4',
                  color: '#4285f4',
                  '&:hover': {
                    backgroundColor: '#f8f9ff',
                    borderColor: '#357ae8'
                  }
                }}
              >
                Google
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  🔒 Tus datos están protegidos con autenticación segura
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
