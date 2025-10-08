# Frontend - Tablero Kanban

Frontend del tablero Kanban colaborativo construido con **React**, **Vite**, **TypeScript**, **Tailwind CSS** y **shadcn/ui**.

## 🚀 Tecnologías

- **React 19** - Biblioteca UI
- **Vite 7** - Build tool y dev server
- **TypeScript** - Tipado estático
- **Tailwind CSS 4** - Estilos utility-first
- **shadcn/ui** - Componentes UI (estilo new-york)
- **@dnd-kit** - Drag & drop
- **Socket.io Client** - WebSocket en tiempo real
- **Axios** - Cliente HTTP
- **Sonner** - Toast notifications
- **Lucide** - Iconos

## 📋 Requisitos previos

- Node.js >= 18
- Backend ejecutándose en puerto 3000
- MongoDB ejecutándose
- n8n ejecutándose (para exportación)

## 🔧 Instalación

```bash
# Instalar dependencias
npm install

# Crear archivo .env (copiar de .env.example si existe)
# Configurar las variables de entorno
```

## ⚙️ Variables de entorno

Crea un archivo `.env` en la raíz del frontend:

```env
# Backend API URL
VITE_API_URL=http://localhost:3000/api

# WebSocket URL
VITE_WS_URL=http://localhost:3000
```

## 🏃 Ejecutar en desarrollo

```bash
# Modo desarrollo con hot-reload
npm run dev

# La aplicación estará disponible en:
# http://localhost:5173
```

## 📦 Build para producción

```bash
# Compilar
npm run build

# Preview de producción
npm run preview
```

## ✨ Funcionalidades

### 🎯 Características principales

- ✅ **Tablero Kanban** con 3 columnas (Por Hacer, En Progreso, Completado)
- ✅ **Drag & Drop** fluido entre columnas
- ✅ **CRUD de tareas** (Crear, Editar, Eliminar)
- ✅ **Colaboración en tiempo real** vía WebSocket
- ✅ **Exportar Backlog** a CSV vía email (⭐ crítico para el challenge)
- ✅ **Notificaciones toast** para todas las acciones
- ✅ **Dark mode** (configurado)
- ✅ **Responsive design**
- ✅ **Indicador de usuarios conectados**

### 🔌 WebSocket en tiempo real

El frontend se conecta automáticamente al servidor WebSocket y recibe actualizaciones en tiempo real:

- Nuevas tareas creadas por otros usuarios
- Tareas actualizadas
- Tareas eliminadas
- Tareas movidas entre columnas
- Usuarios conectados/desconectados

### 📤 Exportación de Backlog

El botón **"Exportar Backlog"** (ubicado en el header) permite:

1. Exportar todas las tareas del tablero
2. Generar un archivo CSV con los datos
3. Enviar el CSV por email (configurable)
4. Recibir notificaciones de éxito/error

**Flujo:**
```
[Botón Exportar] → [Backend API] → [n8n Workflow] → [CSV + Email]
```

## 📁 Estructura del proyecto

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # Componentes shadcn
│   │   ├── KanbanBoard.tsx  # Componente principal
│   │   ├── KanbanColumn.tsx # Columna del tablero
│   │   ├── TaskCard.tsx     # Tarjeta de tarea
│   │   ├── TaskDialog.tsx   # Modal crear/editar
│   │   └── ExportButton.tsx # Botón de exportación ⭐
│   ├── services/
│   │   ├── api.ts          # Cliente API (axios)
│   │   └── socket.ts       # Cliente WebSocket
│   ├── types/
│   │   └── index.ts        # Tipos TypeScript
│   ├── config/
│   │   └── api.ts          # Configuración API
│   ├── App.tsx             # Componente raíz
│   ├── main.tsx            # Entry point
│   └── index.css           # Estilos globales
├── components.json         # Config shadcn
├── vite.config.ts          # Config Vite
└── package.json
```

## 🎨 Componentes principales

### `<KanbanBoard />`
Componente principal que orquesta todo:
- Maneja el estado global de tareas
- Integra drag & drop
- Gestiona WebSocket
- Coordina todas las acciones

### `<KanbanColumn />`
Columna del tablero Kanban:
- Muestra tareas de una columna
- Implementa zona droppable
- Botón para agregar tareas

### `<TaskCard />`
Tarjeta de tarea:
- Draggable
- Botones de editar/eliminar
- Muestra título y descripción

### `<ExportButton />` ⭐
Botón crítico del challenge:
- Dispara exportación de backlog
- Modal para configurar email
- Notificaciones de éxito/error

## 🧪 Testing

```bash
# Linter
npm run lint

# Type check
npx tsc --noEmit
```

## 📝 Notas importantes

- El frontend requiere que el **backend esté corriendo** en puerto 3000
- La **exportación de backlog** requiere que **n8n** esté configurado
- WebSocket se conecta automáticamente al iniciar la app
- Las notificaciones toast aparecen en la esquina inferior derecha
- El indicador de usuarios conectados aparece en el header

## 🐛 Troubleshooting

### Error: "Cannot connect to backend"
- Verifica que el backend esté corriendo en `http://localhost:3000`
- Verifica las variables de entorno en `.env`

### WebSocket no conecta
- Verifica que `VITE_WS_URL` esté configurado correctamente
- Revisa la consola del navegador para ver errores de conexión

### Exportación falla
- Verifica que n8n esté corriendo en puerto 5678
- Verifica que el workflow de n8n esté importado y activado
- Revisa los logs del backend

## 🎯 Próximos pasos

- [ ] Añadir tests unitarios (Vitest)
- [ ] Añadir tests E2E (Playwright)
- [ ] Mejorar accesibilidad (a11y)
- [ ] Añadir más opciones de configuración
- [ ] Implementar paginación de tareas
- [ ] Añadir filtros y búsqueda
