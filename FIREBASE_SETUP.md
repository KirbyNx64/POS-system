# Configuración de Firebase para Sistema POS

## Pasos para configurar Firebase

### 1. Crear proyecto en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear un proyecto"
3. Dale un nombre a tu proyecto (ej: "sistema-pos")
4. Puedes deshabilitar Google Analytics si no lo necesitas
5. Haz clic en "Crear proyecto"

### 2. Configurar autenticación

1. En el panel izquierdo, haz clic en "Authentication"
2. Haz clic en "Comenzar"
3. Ve a la pestaña "Sign-in method"
4. Haz clic en "Google" en la lista de proveedores
5. Habilita Google como proveedor de autenticación
6. Agrega tu correo electrónico como correo de soporte
7. Haz clic en "Guardar"

### 3. Obtener configuración de la app

1. En el panel izquierdo, haz clic en el ícono de configuración (⚙️)
2. Selecciona "Configuración del proyecto"
3. Ve a la pestaña "General"
4. En la sección "Tus apps", haz clic en el ícono de web (</>)
5. Dale un nombre a tu app (ej: "Sistema POS Web")
6. Haz clic en "Registrar app"
7. Copia la configuración que aparece

### 4. Configurar el proyecto

1. Copia el archivo `firebase-config-example.js` como `src/firebase/config.js`
2. Reemplaza los valores de configuración con los de tu proyecto Firebase
3. Asegúrate de que el archivo esté en `.gitignore` para no exponer las claves

### 5. Reglas de Firestore (opcional)

Si planeas usar Firestore para almacenar datos, configura las reglas de seguridad:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Estructura de archivos modificados

- `src/firebase/config.js` - Configuración de Firebase
- `src/hooks/useFirebaseAuth.js` - Hook personalizado para autenticación
- `src/components/Auth/Login.js` - Componente de login actualizado
- `src/components/Layout/Layout.js` - Layout con logout de Firebase
- `src/components/AppRouter.js` - Router con verificación de autenticación

## Características implementadas

✅ Autenticación con Google  
✅ Persistencia de sesión  
✅ Logout automático  
✅ Protección de rutas  
✅ Interfaz moderna y responsive  
✅ Manejo de errores  

## Notas importantes

- El sistema ahora requiere una cuenta de Google válida para acceder
- Los usuarios se asignan automáticamente el rol de "admin"
- Puedes personalizar la lógica de roles según tus necesidades
- La sesión persiste entre recargas de página
- Todos los datos se siguen guardando en localStorage por defecto
