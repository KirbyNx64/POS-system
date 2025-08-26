// Configuración del entorno
const isDevelopment = process.env.NODE_ENV === 'development';
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1';

// URL base de la aplicación
export const BASE_URL = isDevelopment && isLocalhost 
  ? '' // Sin homepage para desarrollo local
  : 'https://KirbyNx64.github.io/POS-system';

// Configuración de Firebase
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDHG_kYePcdG2fU77GUSgn2XaWxN0ck6pY",
  authDomain: "sistema-pos-400f1.firebaseapp.com",
  projectId: "sistema-pos-400f1",
  storageBucket: "sistema-pos-400f1.firebasestorage.app",
  messagingSenderId: "926981241531",
  appId: "1:926981241531:web:ca253965a93e67ef9e879e",
  measurementId: "G-0JQ6V6SBCV"
};

// Configuración de la aplicación
export const APP_CONFIG = {
  name: 'Sistema POS',
  version: '1.0.0',
  environment: isDevelopment ? 'development' : 'production',
  isLocalhost,
  isDevelopment
};
