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
import { useFirestoreErrorHandler } from './useFirestoreErrorHandler';

export function useFirestore(collectionName) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useFirebaseAuth();
  const { handleFirestoreError } = useFirestoreErrorHandler();

  // Obtener datos en tiempo real
  useEffect(() => {
    if (!user || !user.id) {
      setData([]);
      setLoading(false);
      return;
    }
    
    const q = query(
      collection(db, collectionName),
      where('userId', '==', user.id)
      // orderBy('createdAt', 'desc') // Temporalmente comentado hasta que se cree el índice
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        const docData = { id: doc.id, ...doc.data() };
        items.push(docData);
      });
      setData(items);
      setLoading(false);
      setError(null); // Limpiar errores si la conexión se restablece
    }, (error) => {
      console.error('❌ useFirestore: Error obteniendo datos:', error);
      handleFirestoreError(error);
      setError(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, user, handleFirestoreError]);

  // Agregar documento
  const addDocument = async (documentData) => {
    try {
      // Esperar un poco para asegurar que el usuario esté cargado
      if (!user || !user.id) {
        
        // Esperar hasta 2 segundos para que el usuario se cargue
        let attempts = 0;
        while ((!user || !user.id) && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!user || !user.id) {
          throw new Error('Usuario no autenticado');
        }
      }

      setError(null);
      const collectionRef = collection(db, collectionName);
      
      const docData = {
        ...documentData,
        userId: user.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collectionRef, docData);
      return docRef;
    } catch (error) {
      console.error('❌ useFirestore: Error agregando documento:', error);
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
