import { useState, useEffect } from 'react';
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useFirebaseAuth } from './useFirebaseAuth';

export function useBusinessInfo() {
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    rfc: '',
    website: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useFirebaseAuth();

  // Cargar información del negocio desde Firebase
  useEffect(() => {
    console.log('📡 useBusinessInfo: Configurando listener para información del negocio...');
    console.log('📡 useBusinessInfo: Usuario:', user);
    
    if (!user || !user.id) {
      console.log('⚠️ useBusinessInfo: No hay usuario autenticado, no se puede cargar información del negocio');
      setLoading(false);
      return;
    }

    const businessDocRef = doc(db, 'businessInfo', user.id);
    console.log('📡 useBusinessInfo: Referencia del documento:', businessDocRef);
    
    const unsubscribe = onSnapshot(businessDocRef, (doc) => {
      console.log('📡 useBusinessInfo: Datos recibidos de Firebase:', doc.exists() ? 'Documento existe' : 'Documento no existe');
      
      if (doc.exists()) {
        const data = doc.data();
        console.log('📡 useBusinessInfo: Datos del documento:', data);
        
        const info = {
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          rfc: data.rfc || '',
          website: data.website || ''
        };
        
        console.log('📡 useBusinessInfo: Información procesada:', info);
        setBusinessInfo(info);
      } else {
        // Si no existe el documento, usar valores por defecto
        const defaultInfo = {
          name: 'Mi Negocio',
          address: 'Dirección del negocio',
          phone: '',
          email: '',
          rfc: '',
          website: ''
        };
        console.log('📡 useBusinessInfo: Usando información por defecto:', defaultInfo);
        setBusinessInfo(defaultInfo);
      }
      setLoading(false);
    }, (error) => {
      console.error('❌ useBusinessInfo: Error cargando información del negocio:', error);
      setError(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Guardar información del negocio en Firebase
  const saveBusinessInfo = async (info) => {
    try {
      console.log('💾 useBusinessInfo: Intentando guardar información del negocio...');
      console.log('💾 useBusinessInfo: Usuario:', user);
      console.log('💾 useBusinessInfo: Información a guardar:', info);
      
      if (!user || !user.id) {
        console.error('❌ useBusinessInfo: Usuario no autenticado');
        throw new Error('Usuario no autenticado');
      }

      setError(null);
      const businessDocRef = doc(db, 'businessInfo', user.id);
      console.log('💾 useBusinessInfo: Referencia del documento:', businessDocRef);
      
      const dataToSave = {
        ...info,
        userId: user.id,
        updatedAt: serverTimestamp()
      };
      console.log('💾 useBusinessInfo: Datos a guardar en Firebase:', dataToSave);
      
      await setDoc(businessDocRef, dataToSave, { merge: true });
      console.log('✅ useBusinessInfo: Información del negocio guardada exitosamente en Firebase');

      return true;
    } catch (error) {
      console.error('❌ useBusinessInfo: Error guardando información del negocio:', error);
      console.error('❌ useBusinessInfo: Detalles del error:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      setError(error.message);
      throw error;
    }
  };

  // Cargar información del negocio una sola vez (para casos donde no se necesita tiempo real)
  const loadBusinessInfo = async () => {
    try {
      if (!user || !user.id) {
        throw new Error('Usuario no autenticado');
      }

      setError(null);
      const businessDocRef = doc(db, 'businessInfo', user.id);
      const docSnap = await getDoc(businessDocRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const info = {
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          rfc: data.rfc || '',
          website: data.website || ''
        };
        setBusinessInfo(info);
        return info;
      } else {
        // Si no existe, crear con valores por defecto
        const defaultInfo = {
          name: 'Mi Negocio',
          address: 'Dirección del negocio',
          phone: '',
          email: '',
          rfc: '',
          website: ''
        };
        await saveBusinessInfo(defaultInfo);
        return defaultInfo;
      }
    } catch (error) {
      console.error('Error cargando información del negocio:', error);
      setError(error.message);
      throw error;
    }
  };

  return {
    businessInfo,
    loading,
    error,
    saveBusinessInfo,
    loadBusinessInfo
  };
}
