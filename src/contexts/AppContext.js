import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { loadSampleDataIfEmpty } from '../utils/sampleData';

const AppContext = createContext();

const initialState = {
  user: null,
  products: [],
  sales: [],
  inventory: [],
  categories: ['Electrónicos', 'Ropa', 'Alimentación', 'Hogar', 'Deportes', 'Otros'],
  cart: [],
  stockThreshold: 10,
  taxSettings: {
    enabled: true,
    rate: 0.19, // 19% por defecto
    name: 'IVA'
  },
  businessInfo: {
    name: 'Mi Negocio',
    address: 'Dirección del negocio',
    phone: '',
    email: '',
    rfc: '',
    website: ''
  }
};

function appReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload };
    
    case 'LOGOUT':
      return { ...state, user: null, cart: [] };
    
    case 'ADD_PRODUCT':
      const newProduct = {
        id: uuidv4(),
        ...action.payload,
        active: true,
        createdAt: new Date().toISOString()
      };
      return {
        ...state,
        products: [...state.products, newProduct]
      };
    
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(product =>
          product.id === action.payload.id ? { ...product, ...action.payload } : product
        )
      };
    
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.map(product =>
          product.id === action.payload ? { ...product, active: false } : product
        )
      };
    
    case 'UPDATE_STOCK':
      return {
        ...state,
        products: state.products.map(product =>
          product.id === action.payload.productId 
            ? { ...product, stock: product.stock + action.payload.quantity }
            : product
        ),
        inventory: [
          ...state.inventory,
          {
            id: uuidv4(),
            productId: action.payload.productId,
            type: action.payload.type, // 'entrada' o 'salida'
            quantity: action.payload.quantity,
            reason: action.payload.reason,
            date: new Date().toISOString(),
            userId: state.user?.id
          }
        ]
      };
    
    case 'ADD_TO_CART':
      const existingItem = state.cart.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        };
      }
      return {
        ...state,
        cart: [...state.cart, action.payload]
      };
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.id !== action.payload)
      };
    
    case 'UPDATE_CART_QUANTITY':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };
    
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    
    case 'COMPLETE_SALE':
      const sale = {
        id: uuidv4(),
        items: action.payload.items,
        subtotal: action.payload.subtotal,
        tax: action.payload.tax,
        total: action.payload.total,
        date: new Date().toISOString(),
        userId: state.user?.id,
        paymentMethod: action.payload.paymentMethod
      };
      
      // Actualizar stock de productos vendidos
      const updatedProducts = state.products.map(product => {
        const soldItem = action.payload.items.find(item => item.id === product.id);
        if (soldItem) {
          return { ...product, stock: product.stock - soldItem.quantity };
        }
        return product;
      });
      
      // Registrar movimientos de inventario
      const inventoryMovements = action.payload.items.map(item => ({
        id: uuidv4(),
        productId: item.id,
        type: 'salida',
        quantity: -item.quantity,
        reason: `Venta #${sale.id.slice(-6)}`,
        date: new Date().toISOString(),
        userId: state.user?.id
      }));
      
      return {
        ...state,
        sales: [...state.sales, sale],
        products: updatedProducts,
        inventory: [...state.inventory, ...inventoryMovements],
        cart: []
      };
    
    case 'UPDATE_TAX_SETTINGS':
      return { 
        ...state, 
        taxSettings: { ...state.taxSettings, ...action.payload }
      };

    case 'UPDATE_BUSINESS_INFO':
      return {
        ...state,
        businessInfo: { ...state.businessInfo, ...action.payload }
      };

    case 'LOAD_DATA':
      return { ...state, ...action.payload };
    
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedData = localStorage.getItem('pos-system-data');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        const dataWithSamples = loadSampleDataIfEmpty(data);
        dispatch({ type: 'LOAD_DATA', payload: dataWithSamples });
      } catch (error) {
        console.error('Error cargando datos guardados:', error);
        // Si hay error, cargar datos de ejemplo
        const sampleData = loadSampleDataIfEmpty(initialState);
        dispatch({ type: 'LOAD_DATA', payload: sampleData });
      }
    } else {
      // Si no hay datos guardados, cargar datos de ejemplo
      const sampleData = loadSampleDataIfEmpty(initialState);
      dispatch({ type: 'LOAD_DATA', payload: sampleData });
    }
  }, []);

  // Guardar datos en localStorage cuando cambie el estado
  useEffect(() => {
    const dataToSave = {
      products: state.products,
      sales: state.sales,
      inventory: state.inventory,
      categories: state.categories,
      stockThreshold: state.stockThreshold,
      taxSettings: state.taxSettings,
      businessInfo: state.businessInfo
    };
    localStorage.setItem('pos-system-data', JSON.stringify(dataToSave));
  }, [state.products, state.sales, state.inventory, state.categories, state.stockThreshold, state.taxSettings, state.businessInfo]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de AppProvider');
  }
  return context;
}
