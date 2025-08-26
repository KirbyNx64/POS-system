import { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';

export function useFirebaseAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Escuchar cambios en el estado de autenticación
  useEffect(() => {
    console.log('🔐 useFirebaseAuth: Configurando listener de autenticación...');
    console.log('🔐 useFirebaseAuth: Estado inicial - loading:', loading);
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔐 useFirebaseAuth: Estado de autenticación cambiado:', user ? 'Usuario autenticado' : 'Usuario no autenticado');
      console.log('🔐 useFirebaseAuth: Usuario recibido de Firebase:', user);
      
      if (user) {
        // Mapear usuario de Firebase a nuestro formato
        const mappedUser = {
          id: user.uid,
          name: user.displayName || 'Usuario',
          email: user.email,
          photoURL: user.photoURL,
          role: 'admin', // Por defecto admin, puedes personalizar según tu lógica
          loginTime: new Date().toISOString()
        };
        console.log('🔐 useFirebaseAuth: Usuario mapeado:', mappedUser);
        setUser(mappedUser);
      } else {
        console.log('🔐 useFirebaseAuth: Usuario cerrado sesión');
        setUser(null);
      }
      setLoading(false);
    });
 
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      console.log('🔐 useFirebaseAuth: Iniciando signInWithGoogle...');
      setLoading(true);
      setError(null);
      
      console.log('🔐 useFirebaseAuth: Llamando a signInWithPopup...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('🔐 useFirebaseAuth: Resultado de signInWithPopup:', result);
      console.log('🔐 useFirebaseAuth: Usuario de Firebase:', result.user);
      
      // El usuario se establece automáticamente en el useEffect
      return result.user;
    } catch (error) {
      console.error('❌ useFirebaseAuth: Error al iniciar sesión con Google:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      setError(error.message);
    }
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    logout
  };
}
