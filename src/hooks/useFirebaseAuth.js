import { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  auth, 
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from '../firebase/config';

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
          loginTime: new Date().toISOString(),
          emailVerified: user.emailVerified
        };
        console.log('🔐 useFirebaseAuth: Usuario mapeado:', mappedUser);
        console.log('🔐 useFirebaseAuth: Email verificado:', user.emailVerified);
        setUser(mappedUser);
      } else {
        console.log('🔐 useFirebaseAuth: Usuario cerrado sesión');
        setUser(null);
      }
      setLoading(false);
    });
 
    return () => unsubscribe();
  }, [loading]);

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
      setLoading(false); // Desactivar loading inmediatamente en caso de éxito
      return result.user;
    } catch (error) {
      console.error('❌ useFirebaseAuth: Error al iniciar sesión con Google:', error);
      console.log('❌ useFirebaseAuth: Código de error:', error.code);
      
      // Verificar si es un error de cancelación del usuario (ventana cerrada sin seleccionar)
      if (error.code === 'auth/popup-closed-by-user' || 
          error.code === 'auth/cancelled-popup-request' ||
          error.code === 'auth/popup-blocked' ||
          error.code === 'auth/user-cancelled') {
        console.log('🔐 useFirebaseAuth: Usuario cerró la ventana sin seleccionar cuenta');
        // No establecer error para cancelaciones del usuario
        setError(null);
        setLoading(false); // Desactivar loading INMEDIATAMENTE para cancelaciones
        return null; // Retornar null sin lanzar error
      }
      
      // Para otros errores, establecer el mensaje de error
      setError(error.message);
      setLoading(false); // Desactivar loading para errores también
      throw error;
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      console.log('🔐 useFirebaseAuth: Iniciando signInWithEmail...');
      setLoading(true);
      setError(null);
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('🔐 useFirebaseAuth: Usuario autenticado con correo:', result.user);
      
      // No cerrar sesión si el email no está verificado, permitir que el guard maneje esto
      setLoading(false);
      return result.user;
    } catch (error) {
      console.error('❌ useFirebaseAuth: Error al iniciar sesión con correo:', error);
      setError(error.message);
      setLoading(false);
      throw error;
    }
  };

  const signUpWithEmail = async (email, password, displayName) => {
    try {
      console.log('🔐 useFirebaseAuth: Iniciando signUpWithEmail...');
      setLoading(true);
      setError(null);
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Actualizar el perfil del usuario con el nombre
      if (displayName) {
        await updateProfile(result.user, {
          displayName: displayName
        });
      }
      
      // Enviar email de verificación
      await sendEmailVerification(result.user);
      console.log('🔐 useFirebaseAuth: Email de verificación enviado');
      
      // NO cerrar sesión automáticamente - permitir que el usuario vea la pantalla de verificación
      console.log('🔐 useFirebaseAuth: Usuario registrado, manteniendo sesión para verificación');
      
      setLoading(false);
      return result.user;
    } catch (error) {
      console.error('❌ useFirebaseAuth: Error al registrar usuario con correo:', error);
      setError(error.message);
      setLoading(false);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      console.log('🔐 useFirebaseAuth: Enviando email de recuperación...');
      setError(null);
      
      await sendPasswordResetEmail(auth, email);
      console.log('🔐 useFirebaseAuth: Email de recuperación enviado');
      
      return true;
    } catch (error) {
      console.error('❌ useFirebaseAuth: Error al enviar email de recuperación:', error);
      setError(error.message);
      throw error;
    }
  };

  const resendEmailVerification = async (email, password) => {
    try {
      console.log('🔐 useFirebaseAuth: Reenviando email de verificación...');
      setError(null);
      
      // Si no hay usuario autenticado, intentar autenticarse temporalmente
      if (!auth.currentUser) {
        if (!email || !password) {
          throw new Error('Se requieren email y contraseña para reenviar el email de verificación');
        }
        
        console.log('🔐 useFirebaseAuth: Autenticando temporalmente para reenviar email...');
        const result = await signInWithEmailAndPassword(auth, email, password);
        
        // Enviar email de verificación
        await sendEmailVerification(result.user);
        console.log('🔐 useFirebaseAuth: Email de verificación reenviado');
        
        // Cerrar sesión inmediatamente después de enviar el email
        await signOut(auth);
        console.log('🔐 useFirebaseAuth: Sesión cerrada después de reenviar email');
        
        return true;
      } else {
        // Si ya hay un usuario autenticado, enviar directamente
        await sendEmailVerification(auth.currentUser);
        console.log('🔐 useFirebaseAuth: Email de verificación reenviado');
        return true;
      }
    } catch (error) {
      console.error('❌ useFirebaseAuth: Error al reenviar email de verificación:', error);
      setError(error.message);
      throw error;
    }
  };

  const isEmailVerified = () => {
    return user?.emailVerified === true;
  };

  const refreshUser = async () => {
    try {
      if (auth.currentUser) {
        console.log('🔐 useFirebaseAuth: Refrescando estado del usuario...');
        await auth.currentUser.reload();
        const updatedUser = auth.currentUser;
        
        if (updatedUser.emailVerified) {
          console.log('🔐 useFirebaseAuth: Email verificado detectado, actualizando usuario...');
          const mappedUser = {
            id: updatedUser.uid,
            name: updatedUser.displayName || 'Usuario',
            email: updatedUser.email,
            photoURL: updatedUser.photoURL,
            role: 'admin',
            loginTime: new Date().toISOString(),
            emailVerified: true
          };
          setUser(mappedUser);
          console.log('🔐 useFirebaseAuth: Usuario actualizado con email verificado');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('❌ useFirebaseAuth: Error al refrescar usuario:', error);
      return false;
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
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    resendEmailVerification,
    isEmailVerified,
    refreshUser,
    logout
  };
}
