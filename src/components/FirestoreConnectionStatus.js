import React from 'react';
import { Alert, AlertTitle, Button, Box } from '@mui/material';
import { Refresh, WifiOff } from '@mui/icons-material';
import { useFirestoreErrorHandler } from '../hooks/useFirestoreErrorHandler';

const FirestoreConnectionStatus = () => {
  const { connectionError, retryCount, retryConnection, clearError } = useFirestoreErrorHandler();

  if (!connectionError) {
    return null;
  }

  return (
    <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, maxWidth: 400 }}>
      <Alert 
        severity="warning" 
        icon={<WifiOff />}
        action={
          <Box>
            <Button 
              color="inherit" 
              size="small" 
              onClick={retryConnection}
              startIcon={<Refresh />}
              sx={{ mr: 1 }}
            >
              Reintentar
            </Button>
            <Button 
              color="inherit" 
              size="small" 
              onClick={clearError}
            >
              Cerrar
            </Button>
          </Box>
        }
      >
        <AlertTitle>Problema de Conexión</AlertTitle>
        Se detectó un problema con la conexión a la base de datos. 
        {retryCount > 0 && ` (Reintento ${retryCount})`}
        <br />
        <small>Los datos se sincronizarán automáticamente cuando se restablezca la conexión.</small>
      </Alert>
    </Box>
  );
};

export default FirestoreConnectionStatus;
