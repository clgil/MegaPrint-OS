# MegaPrint OS - Sistema de Gestión para Talleres de Hardware

## 🖨️ Descripción

**MegaPrint OS** es una aplicación Android nativa desarrollada con React Native y Expo, diseñada para la gestión completa de talleres de reparación de hardware (impresoras y electrónica). Opera 100% offline utilizando SQLite como base de datos local.

## ✨ Características Principales

### Fase 1: Módulo de Órdenes de Servicio (Core) ✅ COMPLETADO
- ✅ Creación de órdenes con numeración automática (Ej: MPL-1001)
- ✅ Estados personalizables: Recibido, En Diagnóstico, Esperando Pieza, Reparado, Entregado, Sin Solución
- ✅ Registro de datos del cliente y equipo (marca, modelo, S/N)
- ✅ Checklist de estado estético del equipo
- ✅ Firma digital en pantalla
- ✅ Generación y exportación de PDFs profesionales

### Fase 2: Control Financiero y Dashboard ✅ IMPLEMENTADO
- ✅ **Registro de Ingresos**: Tracking separado de ingresos por servicios y ventas
- ✅ **Registro de Gastos**: Categorización de gastos operativos (insumos, herramientas, servicios, etc.)
- ✅ **Dashboard Financiero**: 
  - Resumen mensual con ingresos, gastos y ganancia neta
  - Comparación mes actual vs mes anterior
  - Cálculo de margen de ganancia y ticket promedio
  - Alertas de stock bajo y garantías pendientes
- ✅ **Gestión de Garantías**: 
  - Registro de reclamos de garantía
  - Seguimiento de estado (Pendiente, En Proceso, Resuelto, Rechazado)
  - Cálculo de costos asumidos por el taller

### Gestión de Clientes
- ✅ Directorio local con CRUD completo
- ✅ Historial de reparaciones por cliente
- ✅ Búsqueda rápida por nombre o teléfono

### Inventario de Repuestos
- ✅ Catálogo de piezas con categorías
- ✅ Control de stock con alertas de nivel bajo
- ✅ Cálculo de margen de ganancia

### Motor de Exportación PDF
- ✅ Comprobante de Recepción (para el cliente al dejar el equipo)
- ✅ Orden de Entrega y Garantía (con detalle de costos y firma)
- ✅ Compartir vía WhatsApp/Telegram directamente

## 🏗️ Arquitectura Técnica

```
MegaPrint-OS/
├── src/
│   ├── components/       # Componentes reutilizables
│   │   ├── OrderStatusBadge.tsx
│   │   ├── OrdersList.tsx
│   │   ├── NewOrderForm.tsx
│   │   └── SignaturePad.tsx
│   ├── screens/          # Pantallas principales
│   │   └── OrderDetailScreen.tsx
│   ├── database/         # Capa de datos
│   │   ├── index.ts      # Configuración SQLite
│   │   └── repositories.ts # Repositorios CRUD
│   ├── types/            # Tipos TypeScript
│   │   └── index.ts
│   └── utils/            # Utilidades
│       └── pdfGenerator.ts # Generación de PDFs
├── assets/               # Recursos gráficos
├── App.tsx               # Punto de entrada principal
├── app.json              # Configuración Expo
├── package.json          # Dependencias
└── tsconfig.json         # Configuración TypeScript
```

## 🚀 Instalación y Desarrollo

### Requisitos Previos

| Herramienta | Versión Mínima | Enlace de Descarga |
|-------------|----------------|-------------------|
| Node.js | 18.x o superior | [nodejs.org](https://nodejs.org/) |
| npm | 9.x o superior | Incluido con Node.js |
| Java JDK | 17 | [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) |
| Android Studio | Hedgehog o superior | [developer.android.com](https://developer.android.com/studio) |
| Expo CLI | Última versión | `npm install -g expo-cli` |
| EAS CLI | Última versión | `npm install -g eas-cli` |

### Pasos de Instalación para Desarrollo

```bash
# Navegar al directorio del proyecto
cd MegaPrint-OS

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo Expo
npm start

# Para Android (abre emulador o dispositivo conectado)
npm run android

# Para iOS (requiere macOS)
npm run ios
```

### Configuración del Entorno de Desarrollo

1. **Expo Go**: Descarga la app Expo Go en tu dispositivo Android/iOS
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **QR Code**: Escanea el código QR que aparece en la terminal con Expo Go

3. **Desarrollo Offline**: La app funciona sin internet una vez instalada

4. **Dispositivo Físico vs Emulador**:
   - **Emulador**: Más rápido para pruebas rápidas
   - **Dispositivo físico**: Mejor para testing de hardware (cámara, firma táctil)

---

## 📦 COMPILACIÓN Y DESPLIEGUE DE APK - GUÍA COMPLETA

Esta sección explica paso a paso cómo generar un archivo APK instalable para distribuir la aplicación.

### Opción 1: Usando EAS Build (Recomendado - Cloud Build)

EAS (Expo Application Services) es el método oficial y más sencillo para compilar aplicaciones Expo.

#### Paso 1: Instalar EAS CLI

```bash
npm install -g eas-cli
```

#### Paso 2: Iniciar sesión en Expo

```bash
eas login
```

Si no tienes cuenta Expo, créala en [expo.dev](https://expo.dev/)

#### Paso 3: Configurar EAS Build

```bash
eas build:configure
```

Esto creará un archivo `eas.json` en la raíz del proyecto con la configuración de builds.

#### Paso 4: Configurar eas.json

Edita el archivo `eas.json` generado y asegúrate de tener esta configuración:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

**Explicación de los perfiles:**
- `development`: Build de depuración con Expo Dev Client
- `preview`: APK para testing interno (lo que necesitas para distribución manual)
- `production`: AAB para Google Play Store

#### Paso 5: Crear Keystore para Firmar la APK

La primera vez que compiles, EAS te preguntará si quieres crear un nuevo keystore:

```bash
? Would you like to generate a new Keystore? › Yes
```

**IMPORTANTE**: Guarda las credenciales que te proporciona EAS:
- Keystore password
- Key alias
- Key password

Estas credenciales son necesarias para actualizar la app en el futuro.

#### Paso 6: Compilar APK para Testing/Distribución

Para generar un APK instalable:

```bash
eas build --profile preview --platform android
```

O de forma abreviada:

```bash
eas build -p android --profile preview
```

**Proceso de build:**
1. El código se sube a los servidores de Expo
2. Se compila en la nube (toma 5-15 minutos)
3. Recibirás un enlace para descargar el APK

#### Paso 7: Descargar el APK

Una vez completado el build:

```bash
eas build:list
```

Encuentra tu build más reciente y copia el enlace de descarga, o usa:

```bash
eas build:download --platform android --latest
```

El APK se descargará en tu carpeta de descargas y estará listo para instalar.

---

### Opción 2: Build Local (Solo para usuarios avanzados)

Si prefieres compilar localmente sin usar la nube de EAS:

#### Requisitos Adicionales

1. **Android Studio** instalado con:
   - Android SDK
   - Android SDK Build-Tools
   - Android Emulator (opcional)

2. **Variables de entorno configuradas**:

```bash
# En Windows (PowerShell)
$env:ANDROID_HOME = "C:\Users\TU_USUARIO\AppData\Local\Android\Sdk"

# En macOS/Linux
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

#### Paso 1: Prebuild del Proyecto

```bash
npx expo prebuild --platform android
```

Esto generará la carpeta `android/` con el proyecto nativo.

#### Paso 2: Generar Keystore para Firmar

```bash
keytool -genkey -v -keystore megaprint-release-key.keystore -alias megaprint -keyalg RSA -keysize 2048 -validity 10000
```

Te pedirá:
- Contraseña del keystore
- Nombre completo
- Unidad organizativa
- Organización
- Ciudad
- Estado/Provincia
- Código de país

**Guarda esta información en un lugar seguro!**

#### Paso 3: Configurar Gradle Properties

Crea o edita `android/gradle.properties`:

```properties
MEGAPRINT_UPLOAD_STORE_FILE=megaprint-release-key.keystore
MEGAPRINT_UPLOAD_KEY_ALIAS=megaprint
MEGAPRINT_UPLOAD_STORE_PASSWORD=tu_contraseña_keystore
MEGAPRINT_UPLOAD_KEY_PASSWORD=tu_contraseña_key
```

#### Paso 4: Compilar APK Debug (para testing)

```bash
cd android
./gradlew assembleDebug
```

El APK se generará en: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Paso 5: Compilar APK Release (para producción)

```bash
cd android
./gradlew assembleRelease
```

El APK firmado se generará en: `android/app/build/outputs/apk/release/app-release.apk`

---

### Opción 3: Development Client (Para desarrollo continuo)

Ideal para desarrollo diario con acceso a características nativas:

#### Paso 1: Instalar EAS CLI

```bash
npm install -g eas-cli
```

#### Paso 2: Configurar Development Client

En `app.json`, agrega:

```json
{
  "expo": {
    "plugins": [
      "expo-sqlite",
      "expo-print",
      "expo-sharing"
    ]
  }
}
```

#### Paso 3: Build del Development Client

```bash
eas build --profile development --platform android
```

#### Paso 4: Instalar en Dispositivo

Descarga e instala el APK resultante en tu dispositivo de desarrollo.

---

## 📋 Tabla Comparativa de Métodos de Build

| Método | Tiempo | Requiere Android Studio | Tipo de APK | Uso Recomendado |
|--------|--------|------------------------|-------------|-----------------|
| **EAS Cloud (preview)** | 5-15 min | ❌ No | APK firmado | Distribución a clientes |
| **EAS Cloud (production)** | 10-20 min | ❌ No | AAB | Google Play Store |
| **Local Debug** | 2-5 min | ✅ Sí | APK sin firmar | Testing rápido |
| **Local Release** | 5-10 min | ✅ Sí | APK firmado | Producción offline |
| **Development Client** | 10-15 min | ❌ No | APK debug | Desarrollo continuo |

---

## 🔐 Firma de Aplicaciones (Signing)

### ¿Por qué es importante firmar?

Android requiere que todas las APK estén firmadas digitalmente para:
- Verificar la autenticidad del desarrollador
- Permitir actualizaciones de la misma app
- Publicar en Google Play Store

### Gestión de Keystore

**NUNCA PIERDAS TU KEYSTORE** - Sin él, no podrás actualizar tu aplicación.

#### Mejores Prácticas:

1. **Backup múltiple**: Guarda copias en:
   - Disco duro externo
   - Servicio en la nube cifrado
   - Gestor de contraseñas

2. **Documenta las credenciales**:
   ```
   Archivo: megaprint-release-key.keystore
   Alias: megaprint
   Password Keystore: ************
   Password Key: ************
   Fecha de creación: DD/MM/AAAA
   Validez: 10000 días
   ```

3. **Versiona el keystore** (en repositorio privado seguro)

---

## 📱 Instalación del APK en Dispositivos

### Método 1: USB Directo

1. Conecta el dispositivo Android vía USB
2. Copia el APK al dispositivo
3. En el dispositivo, abre el archivo APK
4. Permite "Instalar desde fuentes desconocidas" si es necesario
5. Completa la instalación

### Método 2: ADB (Android Debug Bridge)

```bash
adb install megaprint-app.apk
```

Para reinstalar (actualizar):

```bash
adb install -r megaprint-app.apk
```

### Método 3: Distribución Remota

1. Sube el APK a un servicio de hosting (Google Drive, Dropbox, servidor propio)
2. Comparte el enlace con el cliente
3. El cliente descarga e instala directamente

### Método 4: Google Play Store (Producción)

1. Genera AAB con EAS:
   ```bash
   eas build --profile production --platform android
   ```

2. Sube el `.aab` a [Google Play Console](https://play.google.com/console)

3. Completa la ficha de la tienda y publica

---

## 🔧 Troubleshooting Común

### Error: "SDK location not found"

**Solución**: Crea un archivo `local.properties` en la carpeta `android/`:

```properties
sdk.dir=C:\\Users\\TU_USUARIO\\AppData\\Local\\Android\\Sdk
```

### Error: "Build failed with error code 1"

**Soluciones**:
1. Limpia el build:
   ```bash
   cd android
   ./gradlew clean
   ```

2. Elimina caché de Gradle:
   ```bash
   rm -rf ~/.gradle/caches/
   ```

3. Actualiza Gradle:
   ```bash
   cd android
   ./gradlew wrapper --gradle-version 8.0
   ```

### Error: "Keystore was tampered with, or password was incorrect"

**Solución**: Verifica que estás usando las credenciales correctas. Si las perdiste, deberás generar un nuevo keystore y cambiar el package name de la app.

### Error: "INSTALL_FAILED_UPDATE_INCOMPATIBLE"

**Solución**: La APK está firmada con un keystore diferente al de la versión instalada. Desinstala la versión anterior:

```bash
adb uninstall com.movisoft.megaprint
```

O firma con el mismo keystore original.

### Build muy lento en EAS

**Causas posibles**:
- Servidores de Expo congestionados
- Primera compilación (descarga de dependencias)
- Cambios grandes en el código

**Soluciones**:
1. Usa builds incrementales (haz cambios pequeños)
2. Espera a horas de menor tráfico
3. Considera build local si tienes buen hardware

---

## 📊 Optimización del APK

### Reducir Tamaño del APK

1. **Habilitar ProGuard/R8** en `eas.json`:
   ```json
   {
     "build": {
       "preview": {
         "android": {
           "buildType": "apk",
           "gradleCommand": ":app:assembleRelease"
         }
       }
     }
   }
   ```

2. **Eliminar recursos no utilizados**:
   - Imágenes no usadas en `assets/`
   - Librerías innecesarias en `package.json`

3. **Usar formatos de imagen optimizados**:
   - WebP en lugar de PNG
   - Compresión de imágenes antes de incluir

### Tamaño Esperado

| Tipo | Tamaño Aproximado |
|------|------------------|
| Debug APK | ~45-55 MB |
| Release APK | ~35-45 MB |
| AAB (Play Store) | ~30-40 MB |

---

## 🔄 Actualización de la Aplicación

### Para Usuarios con APK Manual

1. Genera nueva versión con número incrementado en `app.json`:
   ```json
   {
     "expo": {
       "version": "1.0.1",
       "android": {
         "versionCode": 2
       }
     }
   }
   ```

2. Compila nueva APK:
   ```bash
   eas build --profile preview --platform android
   ```

3. Distribuye la nueva APK a los usuarios

4. Los usuarios instalan sobre la versión anterior (se mantienen los datos SQLite)

### Actualización OTA (Over-The-Air)

Para actualizaciones menores sin cambiar código nativo:

```bash
eas update --branch production --message "Corrección de bugs"
```

Los usuarios recibirán la actualización automáticamente al abrir la app.

---

## 📱 Flujo de Uso

### Para Recepcionista
1. Abrir la app → Pantalla principal con lista de órdenes
2. Presionar "+ Nueva" para crear orden
3. Completar datos del cliente y equipo
4. Marcar estado estético visible
5. Capturar firma del cliente
6. Generar PDF de recepción y compartir por WhatsApp

### Para Técnico
1. Filtrar órdenes por estado "Pendientes" o "En Diagnóstico"
2. Abrir orden y actualizar diagnóstico
3. Registrar repuestos utilizados del inventario
4. Establecer costos (mano de obra + repuestos)
5. Marcar como "Reparado"

### Para Entrega
1. Buscar orden por número o cliente
2. Mostrar orden de entrega con costos
3. Capturar firma de conformidad
4. Generar PDF de entrega con garantía
5. Compartir con cliente

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| Framework | React Native (Expo SDK 52) |
| Lenguaje | TypeScript |
| Base de Datos | SQLite (expo-sqlite) |
| Navegación | React Navigation |
| PDF | expo-print + expo-sharing |
| UI Components | React Native nativos |
| Build System | EAS Build / Gradle |

---

## 📦 Dependencias Principales

```json
{
  "expo": "~52.0.0",
  "expo-sqlite": "~15.0.0",
  "expo-print": "~14.0.0",
  "expo-sharing": "~13.0.0",
  "@react-navigation/native": "^6.1.9",
  "react-native-signature-canvas": "^4.7.0"
}
```

---

## 🔐 Permisos Android

La aplicación requiere los siguientes permisos (configurados en `app.json`):

```json
{
  "expo": {
    "android": {
      "permissions": [
        "WRITE_EXTERNAL_STORAGE",
        "READ_EXTERNAL_STORAGE",
        "INTERNET"
      ]
    }
  }
}
```

---

## 📄 Fases de Desarrollo

### Fase 1 (MVP Interno) ✅
- [x] Creación de Órdenes
- [x] Exportación a PDF
- [x] Base de datos de clientes
- [x] Inventario básico

### Fase 2 (Control Financiero) 🔄
- [ ] Módulo de gastos
- [ ] Dashboard de métricas mensuales
- [ ] Gestión de garantías

### Fase 3 (Producto Comercial) ⏳
- [ ] Configuración de taller (logo, nombre, términos)
- [ ] Control de licencias
- [ ] Multi-usuario

---

## 🤝 Contribución

Este proyecto está desarrollado por **MoviSoft SURL**. Para contribuciones o soporte, contactar al equipo de desarrollo.

## 📞 Soporte

Para asistencia técnica o comercialización del producto:
- Email: soporte@movisoft.com
- Web: www.movisoft.com

---

## 📝 Checklist de Lanzamiento

Antes de distribuir la aplicación:

- [ ] Compilar APK en modo release
- [ ] Probar en múltiples dispositivos Android (diferentes versiones)
- [ ] Verificar que SQLite persiste datos correctamente
- [ ] Probar generación de PDFs en diferentes tamaños de pantalla
- [ ] Verificar firma digital funciona en tablets y smartphones
- [ ] Confirmar que la app funciona 100% offline
- [ ] Probar exportación y compartición de archivos
- [ ] Documentar credenciales del keystore en lugar seguro
- [ ] Crear backup inicial de la base de datos
- [ ] Preparar manual de usuario para clientes

---

**MegaPrint OS** © 2024 MoviSoft SURL - Todos los derechos reservados
