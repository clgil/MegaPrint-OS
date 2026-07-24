# MegaPrint OS - Sistema de Gestión para Talleres de Hardware

## 🖨️ Descripción

**MegaPrint OS** es una aplicación Android nativa desarrollada con React Native y Expo, diseñada para la gestión completa de talleres de reparación de hardware (impresoras y electrónica). Opera 100% offline utilizando SQLite como base de datos local.

## ✨ Características Principales

### Módulo de Órdenes de Servicio (Core)
- ✅ Creación de órdenes con numeración automática (Ej: MPL-1001)
- ✅ Estados personalizables: Recibido, En Diagnóstico, Esperando Pieza, Reparado, Entregado, Sin Solución
- ✅ Registro de datos del cliente y equipo (marca, modelo, S/N)
- ✅ Checklist de estado estético del equipo
- ✅ Firma digital en pantalla
- ✅ Generación y exportación de PDFs profesionales

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
- Node.js 18+ 
- npm o yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (para emulador Android) o dispositivo físico
- Expo Go app (para testing en dispositivo físico)

### Pasos de Instalación

```bash
# Navegar al directorio del proyecto
cd MegaPrint-OS

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo Expo
npm start

# Para Android
npm run android

# Para iOS (requiere macOS)
npm run ios
```

### Configuración del Entorno

1. **Expo Go**: Descarga la app Expo Go en tu dispositivo Android/iOS
2. **QR Code**: Escanea el código QR que aparece en la terminal
3. **Desarrollo Offline**: La app funciona sin internet una vez instalada

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

## 🛠️ Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| Framework | React Native (Expo SDK 52) |
| Lenguaje | TypeScript |
| Base de Datos | SQLite (expo-sqlite) |
| Navegación | React Navigation |
| PDF | expo-print + expo-sharing |
| UI Components | React Native nativos |

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

## 🔐 Permisos Android

La aplicación requiere los siguientes permisos:
- `WRITE_EXTERNAL_STORAGE`: Guardar PDFs
- `READ_EXTERNAL_STORAGE`: Leer archivos para compartir

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

## 🤝 Contribución

Este proyecto está desarrollado por **MoviSoft SURL**. Para contribuciones o soporte, contactar al equipo de desarrollo.

## 📞 Soporte

Para asistencia técnica o comercialización del producto:
- Email: soporte@movisoft.com
- Web: www.movisoft.com

---

**MegaPrint OS** © 2024 MoviSoft SURL - Todos los derechos reservados
