// Función para formatear precios con exactamente 2 decimales
export const formatPrice = (price) => {
  const numPrice = parseFloat(price) || 0;
  return numPrice.toFixed(2);
};

// Función para mostrar precios formateados con símbolo de moneda
export const displayPrice = (price) => {
  return `$${formatPrice(price)}`;
};

// Función para formatear números grandes con separadores de miles y 2 decimales
export const formatCurrency = (amount) => {
  const numAmount = parseFloat(amount) || 0;
  return numAmount.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Función para mostrar moneda completa con símbolo
export const displayCurrency = (amount) => {
  return `$${formatCurrency(amount)}`;
};
