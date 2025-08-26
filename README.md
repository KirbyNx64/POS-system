# Sistema POS - Punto de Venta e Inventario

Un sistema completo de punto de venta e inventario desarrollado en React con Material-UI.

## 🚀 Características

### ✅ Autenticación
- Sistema de login con usuarios de prueba
- Roles de usuario (administrador, vendedor, gerente)
- Sesiones persistentes

### ✅ Gestión de Productos
- **CRUD completo** de productos (crear, leer, actualizar, eliminar)
- Productos con nombre, precio, descripción, foto, categoría, código de barras y stock
- **📸 Subida de imágenes** desde archivo local (conversión a base64)
- **🏷️ Códigos de barras únicos** para identificación rápida
- Búsqueda y filtrado por categoría, stock, precio
- **Gestión de categorías** predefinidas
- **Marcado de productos como inactivos** en lugar de eliminarlos

### ✅ Control de Inventario
- **Alertas de stock bajo** configurables
- **Registro de movimientos** de inventario (entradas y salidas)
- **Seguimiento de stock** en tiempo real
- Historial completo de movimientos por producto
- **Motivos de movimientos** (compras, ventas, ajustes, productos dañados)

### ✅ Punto de Venta
- **🛒 Cajero POS** - Sistema tipo supermercado con escaneo de códigos de barras
- **📱 Escáner de códigos** - Búsqueda rápida por código de barras o nombre
- **⚡ Entrada rápida** - Focus automático en campo de código para agilizar ventas
- **Carrito de compras** interactivo con gestión de cantidades
- **Cálculo automático** de subtotal, impuestos (19% IVA) y total
- **Verificación de stock** antes de agregar al carrito
- **Actualización automática del inventario** al completar ventas
- **Múltiples métodos de pago** (efectivo, tarjeta, transferencia)
- **Generación de comprobantes** de venta

### ✅ Historial de Ventas
- **Consulta completa** de historial de ventas
- **Filtrado por fecha**, usuario y producto
- **Detalles expandibles** de cada venta
- **Vista de productos vendidos** en cada transacción
- **Paginación** para mejor rendimiento

### ✅ Reportes y Análisis
- **Reporte de ventas** con estadísticas detalladas
- **Productos más vendidos** con rankings
- **Ventas por categoría** y análisis de rendimiento
- **Reporte de inventario** con valoración
- **Identificación de productos** sin stock o stock bajo
- **Exportación de reportes** (JSON)
- **Filtros de fecha** personalizables

### ✅ Dashboard
- **Vista general** del estado del sistema
- **Estadísticas en tiempo real** (productos, ventas, ingresos)
- **Alertas visuales** para productos sin stock
- **Productos más vendidos** y ventas recientes
- **Valor total del inventario**

## 🛠️ Tecnologías Utilizadas

- **React 18** - Framework principal
- **Material-UI v5** - Biblioteca de componentes UI
- **React Router v6** - Navegación y enrutamiento
- **date-fns** - Manejo de fechas
- **UUID** - Generación de identificadores únicos
- **Local Storage** - Persistencia de datos en el navegador

## 📋 Usuarios de Prueba

El sistema incluye usuarios de prueba configurados:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin123` | Administrador |
| `vendedor` | `vendedor123` | Vendedor |
| `gerente` | `gerente123` | Gerente |

## 🚀 Instalación y Ejecución

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Ejecutar en modo desarrollo:**
   ```bash
   npm start
   ```

3. **Abrir en el navegador:**
   ```
   http://localhost:3000
   ```

## 📊 Sistema Limpio

El sistema inicia **completamente vacío**:
- **0 productos** - Agregar productos manualmente
- **0 ventas** - Sistema listo para usar desde cero
- **0 movimientos de inventario** - Historial limpio
- **Todas las funcionalidades activas** - Listo para personalizar completamente

### ✨ Funcionalidades Disponibles:
- **Subida de imágenes** desde archivos locales
- **Códigos de barras personalizados** para cada producto
- **Cajero POS** con escáner de códigos
- **Gestión completa** de inventario y ventas
- **Reportes detallados** de tu negocio

## 🔧 Funcionalidades Técnicas

### Persistencia de Datos
- **Local Storage** para mantener datos entre sesiones
- **Carga automática** de datos de ejemplo si no existen datos previos
- **Exportación/Importación** de datos del sistema

### Gestión de Estado
- **Context API** para manejo global del estado
- **useReducer** para operaciones complejas
- **Estado inmutable** con operaciones seguras

### Interfaz de Usuario
- **Diseño responsive** que funciona en desktop y móvil
- **Tema Material Design** consistente
- **Navegación intuitiva** con menú lateral
- **Feedback visual** para todas las acciones

### Validaciones
- **Validación de formularios** en tiempo real
- **Verificación de stock** antes de ventas
- **Prevención de datos duplicados**
- **Manejo de errores** robusto

## 📱 Uso del Sistema

### 1. Inicio de Sesión
- Usar cualquiera de los usuarios de prueba
- El sistema recordará la sesión

### 2. Gestión de Productos
- **Comenzar:** Haz clic en "Nuevo Producto" para agregar tu primer producto
- **Subir imagen:** Usa archivos locales o URLs de internet
- **Código de barras:** Asigna códigos únicos para el cajero POS
- **Categorías:** Elige entre categorías predefinidas
- **Gestionar stock:** Controla entradas y salidas de inventario

### 3. Realizar Ventas

#### Cajero POS (Recomendado):
- **Escanear códigos** de barras o escribirlos manualmente
- **Buscar por nombre** si no tienes el código
- **Ajustar cantidad** antes de agregar
- **Agregar productos** rápidamente con Enter
- **Procesar venta** cuando termines

#### Punto de Venta Tradicional:
- **Seleccionar productos** desde el catálogo visual
- **Agregar al carrito** con verificación de stock
- **Ajustar cantidades** directamente en el carrito
- **Procesar venta** con método de pago

### 4. Consultar Reportes
- **Filtrar por fechas** para períodos específicos
- **Analizar ventas** por producto y categoría
- **Revisar inventario** con estados de stock
- **Exportar datos** para análisis externos

## 🎯 Cumplimiento de Requerimientos

### Requerimientos Funcionales Implementados:

✅ **Autenticación individual de usuarios**
✅ **CRUD completo de productos** con todos los campos solicitados
✅ **Modificación de productos** (precio, descripción, foto, stock)
✅ **Eliminación/inactivación** de productos
✅ **Búsqueda y filtrado** avanzado de productos
✅ **Alertas de stock bajo** configurables
✅ **Registro de ingresos** de stock (compras)
✅ **Registro de egresos** de stock (ventas/ajustes)
✅ **Reportes de existencias** y movimientos
✅ **Registro de ventas** con selección de productos
✅ **Cálculo automático** de totales e impuestos
✅ **Descuento automático** del inventario en ventas
✅ **Generación de comprobantes** de venta
✅ **Historial completo** de ventas con filtros
✅ **Sistema de devoluciones** y ajustes de stock

## 🔄 Flujo de Trabajo Típico

1. **Login** con usuario de prueba
2. **Revisar Dashboard** para estado general
3. **Gestionar Productos** según necesidades
4. **Procesar Ventas** usando el punto de venta
5. **Consultar Reportes** para análisis del negocio
6. **Gestionar Inventario** cuando sea necesario

El sistema está completamente funcional y listo para ser usado como herramienta de punto de venta e inventario empresarial.
