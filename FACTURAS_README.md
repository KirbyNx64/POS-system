# Sistema de Facturas en PDF

Este sistema POS ahora incluye la funcionalidad para generar facturas en PDF automáticamente cuando se procesa una venta.

## Características

- ✅ **Generación automática**: Las facturas se generan automáticamente al completar una venta
- ✅ **Descarga automática**: Se descargan automáticamente al navegador
- ✅ **Impresión directa**: Opción para imprimir directamente desde el navegador
- ✅ **Personalización**: Información del negocio configurable
- ✅ **Formato profesional**: Diseño limpio y profesional para las facturas

## Configuración Inicial

### 1. Configurar Información del Negocio

Ve a **Configuración > Información del Negocio** y completa:

- **Nombre del Negocio**: Aparecerá en el encabezado de las facturas
- **Dirección**: Dirección completa del negocio
- **Teléfono**: Número de contacto
- **Email**: Correo electrónico
- **RFC**: Registro Federal de Contribuyentes (opcional pero recomendado)
- **Sitio Web**: URL del negocio (opcional)

### 2. Configurar Impuestos

En **Configuración > Configuración de Impuestos**:

- Habilita/deshabilita los impuestos
- Configura el porcentaje de impuesto
- Define el nombre del impuesto (ej: IVA, ISR, etc.)

## Uso del Sistema

### Generación Automática

1. **Procesar una venta** normalmente en el módulo de Ventas
2. **Al completar la venta**, la factura se genera y descarga automáticamente
3. **El archivo se guarda** en la carpeta de descargas del navegador

### Generación Manual

Durante el proceso de venta, antes de confirmar:

1. **Abre el diálogo de checkout**
2. **Usa los botones de factura**:
   - **Descargar Factura**: Descarga la factura actual
   - **Imprimir Factura**: Abre la vista de impresión del navegador

### Previsualización

En la configuración del negocio:

1. **Completa la información** del negocio
2. **Haz clic en "Previsualizar Factura"**
3. **Se abrirá una ventana** con la factura de ejemplo

## Estructura de la Factura

La factura incluye:

### Encabezado
- Nombre del negocio
- Dirección
- Información de contacto
- RFC (si está configurado)

### Detalles de la Venta
- Número de factura (timestamp)
- Fecha y hora de la venta
- Método de pago

### Productos
- Nombre del producto
- Cantidad
- Precio unitario
- Total por producto

### Totales
- Subtotal
- Impuestos (con porcentaje)
- Total general

### Pie de Página
- Mensaje de agradecimiento
- Información del sistema

## Archivos Generados

- **Formato**: PDF
- **Nombre**: `factura_[timestamp].pdf`
- **Ubicación**: Carpeta de descargas del navegador
- **Ejemplo**: `factura_1703123456789.pdf`

## Personalización

### Modificar el Diseño

Para personalizar el diseño de las facturas, edita el archivo:
```
src/components/Sales/InvoiceGenerator.js
```

### Cambiar Colores

Los colores se pueden modificar en la función `generateInvoice`:
- Color del encabezado de la tabla
- Color del texto
- Estilos de las líneas

### Agregar Campos

Para agregar campos adicionales:
1. Modifica el componente `BusinessSettings.js`
2. Actualiza el contexto `AppContext.js`
3. Modifica `InvoiceGenerator.js` para usar los nuevos campos

## Solución de Problemas

### La factura no se genera

1. **Verifica que jsPDF esté instalado**: `npm install jspdf jspdf-autotable`
2. **Revisa la consola del navegador** para errores
3. **Asegúrate de que la información del negocio esté configurada**

### Error de permisos

1. **Verifica que el navegador permita descargas**
2. **Revisa la configuración de bloqueadores de pop-ups**
3. **Intenta usar la opción de impresión directa**

### Factura con formato incorrecto

1. **Verifica que la información del negocio esté completa**
2. **Revisa que los productos tengan nombres válidos**
3. **Asegúrate de que los precios sean números válidos**

## Dependencias

El sistema utiliza las siguientes librerías:

- **jsPDF**: Generación de PDFs
- **jspdf-autotable**: Creación de tablas en PDF
- **Material-UI**: Interfaz de usuario

## Instalación

```bash
npm install jspdf jspdf-autotable
```

## Compatibilidad

- **Navegadores**: Chrome, Firefox, Safari, Edge
- **Versión mínima**: ES6+
- **Sistema**: Windows, macOS, Linux

## Soporte

Para problemas o preguntas sobre el sistema de facturas:

1. Revisa este README
2. Consulta la consola del navegador
3. Verifica la configuración del negocio
4. Revisa que todas las dependencias estén instaladas

---

**Nota**: Este sistema genera facturas para uso interno. Para facturación fiscal oficial, consulta con un contador o asesor fiscal sobre los requisitos específicos de tu jurisdicción.
