import React, { useState, useEffect } from 'react';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { useApp } from '../../contexts/AppContext';
import { Box, CircularProgress, Typography, Container, Button, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Refresh as RefreshIcon, Cancel as CancelIcon, Logout as LogoutIcon } from '@mui/icons-material';

function EmailVerificationGuard({ children }) {
  const { user, loading, isEmailVerified, refreshUser, logout } = useFirebaseAuth();
  const { dispatch } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Verificar automáticamente cada 5 segundos si el email se ha verificado
  useEffect(() => {
    if (user && !isEmailVerified()) {
      const interval = setInterval(async () => {
        try {
          const isVerified = await refreshUser();
          if (isVerified) {
            console.log('🔐 EmailVerificationGuard: Verificación detectada automáticamente');
            setRefreshMessage('¡Email verificado! Accediendo al sistema...');
            // No recargar la página, dejar que el componente se actualice naturalmente
          }
        } catch (error) {
          console.error('Error en verificación automática:', error);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [user, isEmailVerified, refreshUser]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Verificando autenticación...
        </Typography>
      </Box>
    );
  }

  // Si no hay usuario, no mostrar nada (el AppRouter manejará el redirect)
  if (!user) {
    return null;
  }

  // Función para refrescar el estado de verificación
  const handleRefreshVerification = async () => {
    try {
      setIsRefreshing(true);
      setRefreshMessage('');
      
      const isVerified = await refreshUser();
      
      if (isVerified) {
        setRefreshMessage('¡Email verificado correctamente! Accediendo al sistema...');
        // No recargar la página, dejar que el componente se actualice naturalmente
      } else {
        setRefreshMessage('El email aún no ha sido verificado. Por favor, revisa tu bandeja de entrada.');
        setIsRefreshing(false);
      }
    } catch (error) {
      console.error('Error al refrescar verificación:', error);
      setRefreshMessage('Error al verificar el estado. Inténtalo de nuevo.');
      setIsRefreshing(false);
    }
  };

  // Función para cancelar y cerrar sesión
  const handleCancelVerification = async () => {
    try {
      await logout();
      // También limpiar el contexto de la aplicación
      dispatch({ type: 'LOGOUT' });
      setShowCancelDialog(false);
      setRefreshMessage('');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setRefreshMessage('Error al cerrar sesión. Inténtalo de nuevo.');
    }
  };

  // Si el usuario existe pero el email no está verificado, mostrar pantalla de verificación
  if (!isEmailVerified()) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            gap: 3
          }}
        >
          <Typography variant="h4" color="primary" gutterBottom>
            📧 Verificación Requerida
          </Typography>
          
          <Typography variant="h6" color="text.secondary" paragraph>
            Tu cuenta ha sido creada, pero necesitas verificar tu dirección de email antes de acceder al sistema.
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            Hemos enviado un enlace de verificación a <strong>{user.email}</strong>
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Por favor, revisa tu bandeja de entrada y haz clic en el enlace para verificar tu cuenta.
            Una vez verificado, haz clic en el botón de abajo para actualizar el estado.
          </Typography>

          {refreshMessage && (
            <Alert 
              severity={refreshMessage.includes('¡Email verificado') ? 'success' : 'info'} 
              sx={{ width: '100%' }}
            >
              {refreshMessage}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column', alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRefreshVerification}
              disabled={isRefreshing}
              sx={{ minWidth: 200 }}
            >
              {isRefreshing ? 'Verificando...' : 'Ya verifiqué mi email'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => setShowCancelDialog(true)}
              sx={{ minWidth: 200 }}
            >
              Cancelar
            </Button>
          </Box>

          {/* Diálogo de confirmación para cancelar */}
          <Dialog
            open={showCancelDialog}
            onClose={() => setShowCancelDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LogoutIcon color="warning" />
                Cancelar Verificación
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                ¿Estás seguro de que quieres cancelar la verificación de email?
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Si cancelas, se cerrará tu sesión y podrás iniciar sesión con un correo diferente.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Correo actual:</strong> {user?.email}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowCancelDialog(false)}>
                No, continuar
              </Button>
              <Button 
                onClick={handleCancelVerification}
                variant="contained"
                color="warning"
                startIcon={<LogoutIcon />}
              >
                Sí, cancelar
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    );
  }

  // Si el usuario está verificado, mostrar el contenido protegido
  return children;
}

export default EmailVerificationGuard;
