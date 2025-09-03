import { useState, useEffect } from 'react';
import { useFirestore } from './useFirestore';
import { useFirebaseAuth } from './useFirebaseAuth';

export function useTaxSettings() {
  const [taxSettings, setTaxSettings] = useState({
    enabled: true,
    rate: 0.19, // 19% por defecto
    name: 'IVA'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user } = useFirebaseAuth();
  const { 
    data: settingsData, 
    addDocument, 
    updateDocument, 
    loading: firestoreLoading, 
    error: firestoreError 
  } = useFirestore('configuracion');

  // Cargar configuración de impuestos
  useEffect(() => {
    console.log('🔧 useTaxSettings: Datos recibidos:', settingsData);
    console.log('🔧 useTaxSettings: Usuario:', user);
    console.log('🔧 useTaxSettings: Loading:', firestoreLoading);
    console.log('🔧 useTaxSettings: Error:', firestoreError);
    
    if (settingsData && settingsData.length > 0) {
      // Buscar configuración de impuestos para el usuario actual
      const taxConfig = settingsData.find(item => 
        item.type === 'taxSettings' && item.userId === user?.id
      );
      console.log('🔧 useTaxSettings: Configuración encontrada:', taxConfig);
      
      if (taxConfig) {
        console.log('🔧 useTaxSettings: Aplicando configuración:', taxConfig.data);
        setTaxSettings(taxConfig.data);
      } else {
        console.log('🔧 useTaxSettings: No se encontró configuración para el usuario');
      }
    } else {
      console.log('🔧 useTaxSettings: No hay datos de configuración disponibles');
    }
    
    setLoading(firestoreLoading);
    setError(firestoreError);
  }, [settingsData, firestoreLoading, firestoreError, user]);

  // Guardar configuración de impuestos
  const saveTaxSettings = async (newSettings) => {
    try {
      if (!user || !user.id) {
        throw new Error('Usuario no autenticado');
      }

      setLoading(true);
      setError(null);

      // Buscar si ya existe configuración de impuestos para este usuario
      const existingConfig = settingsData.find(item => 
        item.type === 'taxSettings' && item.userId === user.id
      );
      
      const configData = {
        type: 'taxSettings',
        data: newSettings,
        userId: user.id,
        updatedAt: new Date()
      };

      if (existingConfig) {
        // Actualizar configuración existente
        await updateDocument(existingConfig.id, configData);
      } else {
        // Crear nueva configuración
        await addDocument(configData);
      }

      setTaxSettings(newSettings);
      return { success: true, message: 'Configuración de impuestos guardada exitosamente' };
      
    } catch (error) {
      console.error('Error guardando configuración de impuestos:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    taxSettings,
    loading,
    error,
    saveTaxSettings
  };
}
