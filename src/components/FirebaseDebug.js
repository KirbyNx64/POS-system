import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Alert } from '@mui/material';
import { db, auth } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function FirebaseDebug() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const testFirebaseConnection = async () => {
    try {
      setStatus('Probando conexión con Firebase...');
      setError('');

      // Verificar que db esté definido
      if (!db) {
        throw new Error('db no está definido');
      }

      // Verificar que auth esté definido
      if (!auth) {
        throw new Error('auth no está definido');
      }

      // Verificar usuario autenticado
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      setStatus(`Usuario autenticado: ${user.email} (${user.uid})`);

      // Intentar agregar un documento de prueba
      setStatus('Intentando agregar documento de prueba...');
      
      const docRef = await addDoc(collection(db, 'test'), {
        message: 'Prueba de conexión',
        userId: user.uid,
        timestamp: serverTimestamp()
      });

      setStatus(`✅ Documento agregado exitosamente! ID: ${docRef.id}`);
      
    } catch (error) {
      console.error('Error en prueba:', error);
      setError(`❌ Error: ${error.message}`);
      setStatus('');
    }
  };

  const testSimpleAdd = async () => {
    try {
      setStatus('Agregando documento simple...');
      setError('');

      const docRef = await addDoc(collection(db, 'productos'), {
        name: 'Producto de prueba',
        price: 100,
        stock: 10,
        userId: 'test-user',
        createdAt: new Date()
      });

      setStatus(`✅ Producto agregado! ID: ${docRef.id}`);
      
    } catch (error) {
      console.error('Error agregando producto:', error);
      setError(`❌ Error: ${error.message}`);
      setStatus('');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🐛 Debug de Firebase
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Este componente te ayuda a diagnosticar problemas con Firebase.
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Pruebas de Firebase
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button 
            variant="contained" 
            onClick={testFirebaseConnection}
            color="primary"
          >
            Probar Conexión
          </Button>
          
          <Button 
            variant="contained" 
            onClick={testSimpleAdd}
            color="secondary"
          >
            Agregar Producto Simple
          </Button>
        </Box>

        {status && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {status}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Información de Debug
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          <strong>db definido:</strong> {db ? '✅ Sí' : '❌ No'}<br/>
          <strong>auth definido:</strong> {auth ? '✅ Sí' : '❌ No'}<br/>
          <strong>Usuario actual:</strong> {auth?.currentUser ? `✅ ${auth.currentUser.email}` : '❌ No autenticado'}
        </Typography>
      </Paper>
    </Box>
  );
}

export default FirebaseDebug;
