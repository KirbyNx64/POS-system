import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useFirebaseAuth } from './useFirebaseAuth';

export function useFirestore(collectionName) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useFirebaseAuth();

  console.log('🔍 useFirestore: Hook inicializado para colección:', collectionName);
  console.log('🔍 useFirestore: Usuario actual:', user);
  console.log('🔍 useFirestore: user?.id:', user?.id);
  console.log('🔍 useFirestore: Tipo de usuario:', typeof user);
  console.log('🔍 useFirestore: Usuario completo:', JSON.stringify(user, null, 2));

  // Obtener datos en tiempo real
  useEffect(() => {
    if (!user || !user.id) {
      console.log('⚠️ useFirestore: No hay usuario o userId, no se pueden obtener datos');
      console.log('⚠️ useFirestore: user:', user);
      console.log('⚠️ useFirestore: user.id:', user?.id);
      setData([]);
      setLoading(false);
      return;
    }

    console.log('📡 useFirestore: Configurando listener para colección:', collectionName);
    console.log('📡 useFirestore: User ID:', user.id);
    
    const q = query(
      collection(db, collectionName),
      where('userId', '==', user.id)
      // orderBy('createdAt', 'desc') // Temporalmente comentado hasta que se cree el índice
    );
    
    console.log('📡 useFirestore: Query configurada para colección:', collectionName);
    console.log('📡 useFirestore: Query:', q);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📡 useFirestore: Datos recibidos:', snapshot.size, 'documentos para colección:', collectionName);
      const items = [];
      snapshot.forEach((doc) => {
        const docData = { id: doc.id, ...doc.data() };
        console.log('📡 useFirestore: Documento:', docData);
        items.push(docData);
      });
      console.log('📡 useFirestore: Items finales:', items);
      setData(items);
      setLoading(false);
    }, (error) => {
      console.error('❌ useFirestore: Error obteniendo datos:', error);
      console.error('❌ useFirestore: Detalles del error:', {
        message: error.message,
        code: error.code,
        collection: collectionName
      });
      setError(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, user]);

  // Agregar documento
  const addDocument = async (documentData) => {
    try {
      // Esperar un poco para asegurar que el usuario esté cargado
      if (!user || !user.id) {
        console.log('⏳ useFirestore: Esperando que el usuario se cargue...');
        console.log('⏳ useFirestore: user:', user);
        console.log('⏳ useFirestore: user.id:', user?.id);
        
        // Esperar hasta 2 segundos para que el usuario se cargue
        let attempts = 0;
        while ((!user || !user.id) && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
          console.log(`⏳ useFirestore: Intento ${attempts}/20 - user:`, user, 'user.id:', user?.id);
        }
        
        if (!user || !user.id) {
          console.error('❌ useFirestore: Usuario no autenticado después de esperar');
          throw new Error('Usuario no autenticado');
        }
      }

      console.log('📝 useFirestore: Intentando agregar documento...');
      console.log('📝 useFirestore: Collection:', collectionName);
      console.log('📝 useFirestore: User ID:', user.id);
      console.log('📝 useFirestore: Datos:', documentData);
      console.log('📝 useFirestore: Usuario completo:', user);

      setError(null);
      
      // Verificar que la colección existe
      console.log('📝 useFirestore: Verificando colección...');
      const collectionRef = collection(db, collectionName);
      console.log('📝 useFirestore: CollectionRef:', collectionRef);
      
      const docData = {
        ...documentData,
        userId: user.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log('📝 useFirestore: Datos finales a guardar:', docData);
      console.log('📝 useFirestore: Tipo de datos:', typeof docData);
      console.log('📝 useFirestore: Claves del objeto:', Object.keys(docData));
      console.log('📝 useFirestore: Verificando que userId existe:', docData.userId);
      
      const docRef = await addDoc(collectionRef, docData);

      console.log('✅ useFirestore: Documento agregado exitosamente:', docRef);
      console.log('✅ useFirestore: ID del documento:', docRef.id);
      return docRef;
    } catch (error) {
      console.error('❌ useFirestore: Error agregando documento:', error);
      console.error('❌ useFirestore: Detalles del error:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        collection: collectionName,
        user: user
      });
      setError(error.message);
      throw error;
    }
  };

  // Actualizar documento
  const updateDocument = async (id, updates) => {
    try {
      if (!user || !user.id) {
        throw new Error('Usuario no autenticado');
      }

      setError(null);
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error actualizando documento:', error);
      setError(error.message);
      throw error;
    }
  };

  // Eliminar documento
  const deleteDocument = async (id) => {
    try {
      if (!user || !user.id) {
        throw new Error('Usuario no autenticado');
      }

      setError(null);
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error eliminando documento:', error);
      setError(error.message);
      throw error;
    }
  };

  // Obtener documento por ID
  const getDocument = async (id) => {
    try {
      if (!user || !user.id) {
        throw new Error('Usuario no autenticado');
      }

      setError(null);
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDocs(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo documento:', error);
      setError(error.message);
      throw error;
    }
  };

  return {
    data,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
    getDocument
  };
}
