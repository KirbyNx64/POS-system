import { useState, useEffect, useCallback } from 'react';

// Hook para manejar errores de Firestore de manera centralizada
export const useFirestoreErrorHandler = () => {
  const [connectionError, setConnectionError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Función para manejar errores de conexión
  const handleFirestoreError = useCallback((error) => {
    console.warn('Error de Firestore detectado:', error);
    
    // Si es un error de conexión, incrementar contador de reintentos
    if (error.code === 'unavailable' || 
        error.message?.includes('transport errored') ||
        error.message?.includes('WebChannelConnection')) {
      setConnectionError(error);
      setRetryCount(prev => prev + 1);
    }
  }, []);

  // Función para limpiar errores
  const clearError = useCallback(() => {
    setConnectionError(null);
    setRetryCount(0);
  }, []);

  // Función para reintentar conexión
  const retryConnection = useCallback(() => {
    clearError();
    // Recargar la página para reiniciar la conexión
    window.location.reload();
  }, [clearError]);

  // Auto-limpiar errores después de un tiempo
  useEffect(() => {
    if (connectionError) {
      const timer = setTimeout(() => {
        setConnectionError(null);
      }, 30000); // 30 segundos

      return () => clearTimeout(timer);
    }
  }, [connectionError]);

  return {
    connectionError,
    retryCount,
    handleFirestoreError,
    clearError,
    retryConnection
  };
};
