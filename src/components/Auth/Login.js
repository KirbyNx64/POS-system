import React, { useState } from 'react';
import {
  Container,
  Paper,
  Button,
  Typography,
  Box,
  Alert,
  Avatar,
  Divider
} from '@mui/material';
import { Google as GoogleIcon, LockOutlined } from '@mui/icons-material';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { useApp } from '../../contexts/AppContext';

function Login() {
  const { dispatch } = useApp();
  const { signInWithGoogle, loading, error } = useFirebaseAuth();
  const [localError, setLocalError] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setLocalError('');
      const user = await signInWithGoogle();
      
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
    } catch (error) {
      console.error('Error en login:', error);
      setLocalError('Error al iniciar sesión con Google. Inténtalo de nuevo.');
    }
  };

  const displayError = localError || error;

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
              <LockOutlined />
            </Avatar>
            <Typography component="h1" variant="h5">
              Sistema POS
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Punto de Venta e Inventario
            </Typography>

            {displayError && (
              <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
                {displayError}
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignIn}
              disabled={loading}
              sx={{ 
                mt: 1, 
                mb: 2,
                backgroundColor: '#4285f4',
                '&:hover': {
                  backgroundColor: '#357ae8'
                }
              }}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión con Google'}
            </Button>

            <Divider sx={{ width: '100%', my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                o
              </Typography>
            </Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Accede con tu cuenta de Google
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Se requiere una cuenta de Google válida para acceder al sistema
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;
