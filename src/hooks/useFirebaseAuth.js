import { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
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
        setUser(mappedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
 
    return () => unsubscribe();
  }, [loading]);

  // Manejar el resultado del redirect de Google
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // El usuario se autenticó correctamente via redirect
          setUser(result.user);
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ useFirebaseAuth: Error al procesar redirect de Google:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    handleRedirectResult();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Intentar usar popup primero, si falla por COOP, usar redirect
      try {
        const result = await signInWithPopup(auth, googleProvider);
        setLoading(false);
        return result.user;
      } catch (popupError) {
        // Si es un error de COOP o popup bloqueado, usar redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.message?.includes('Cross-Origin-Opener-Policy') ||
            popupError.message?.includes('window.closed')) {
          
          console.warn('⚠️ Popup bloqueado por COOP, usando redirect...');
          await signInWithRedirect(auth, googleProvider);
          // No retornamos nada aquí porque la página se redirigirá
          return;
        }
        
        // Para otros errores de popup, re-lanzar el error
        throw popupError;
      }
    } catch (error) {
      console.error('❌ useFirebaseAuth: Error al iniciar sesión con Google:', error);
      
      // Verificar si es un error de cancelación del usuario
      if (error.code === 'auth/popup-closed-by-user' || 
          error.code === 'auth/cancelled-popup-request' ||
          error.code === 'auth/user-cancelled') {
        setError(null);
        setLoading(false);
        return null;
      }
      
      setError(error.message);
      setLoading(false);
      throw error;
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      
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
      
      // NO cerrar sesión automáticamente - permitir que el usuario vea la pantalla de verificación
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
      setError(null);
      
      await sendPasswordResetEmail(auth, email);
      
      return true;
    } catch (error) {
      console.error('❌ useFirebaseAuth: Error al enviar email de recuperación:', error);
      setError(error.message);
      throw error;
    }
  };

  const resendEmailVerification = async (email, password) => {
    try {
      setError(null);
      
      // Si no hay usuario autenticado, intentar autenticarse temporalmente
      if (!auth.currentUser) {
        if (!email || !password) {
          throw new Error('Se requieren email y contraseña para reenviar el email de verificación');
        }
        
        const result = await signInWithEmailAndPassword(auth, email, password);
        
        // Enviar email de verificación
        await sendEmailVerification(result.user);
        
        // Cerrar sesión inmediatamente después de enviar el email
        await signOut(auth);
        
        return true;
      } else {
        // Si ya hay un usuario autenticado, enviar directamente
        await sendEmailVerification(auth.currentUser);
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
        await auth.currentUser.reload();
        const updatedUser = auth.currentUser;
        
        if (updatedUser.emailVerified) {
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
