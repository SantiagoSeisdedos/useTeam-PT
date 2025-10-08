# Backend - Kanban Board API

Backend del tablero Kanban colaborativo construido con **NestJS**, **MongoDB** y **Socket.io**.

## 🚀 Tecnologías

- **NestJS** - Framework backend
- **MongoDB + Mongoose** - Base de datos y ODM
- **Socket.io** - WebSocket para tiempo real
- **TypeScript** - Tipado estático
- **class-validator** - Validación de DTOs

## 📋 Requisitos previos

- Node.js >= 18
- MongoDB (local o remoto)
- n8n ejecutándose (para exportación de backlog)

## 🔧 Instalación

```bash
# Instalar dependencias
npm install

# Copiar archivo de ejemplo de variables de entorno
cp .env.example .env

# Editar .env con tus configuraciones
```

## ⚙️ Variables de entorno

Ver archivo `.env.example`:

```env
MONGODB_URI=mongodb://localhost:27017/kanban-board
PORT=3000
NODE_ENV=development
N8N_WEBHOOK_URL=http://localhost:5678/webhook/kanban-export
FRONTEND_URL=http://localhost:5173
```

## 🏃 Ejecutar en desarrollo

```bash
# Modo desarrollo con hot-reload
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```

## 📡 Endpoints API

### Tasks

- `GET /api/tasks` - Listar todas las tareas
- `GET /api/tasks?column=columna` - Filtrar por columna
- `GET /api/tasks/:id` - Obtener tarea por ID
- `POST /api/tasks` - Crear nueva tarea
- `PATCH /api/tasks/:id` - Actualizar tarea
- `PATCH /api/tasks/:id/move` - Mover tarea (drag & drop)
- `DELETE /api/tasks/:id` - Eliminar tarea

### Boards

- `GET /api/boards` - Listar todos los tableros
- `GET /api/boards/:id` - Obtener tablero por ID
- `POST /api/boards` - Crear nuevo tablero
- `PATCH /api/boards/:id` - Actualizar tablero
- `DELETE /api/boards/:id` - Eliminar tablero

### Export (⭐ Crítico para el challenge)

- `POST /api/export/backlog` - Exportar backlog vía n8n

**Ejemplo:**

```bash
curl -X POST http://localhost:3000/api/export/backlog \
  -H "Content-Type: application/json" \
  -d '{"email": "tu@email.com"}'
```

## 🔌 WebSocket Events

### Cliente → Servidor

- `task-created` - Notificar creación de tarea
- `task-updated` - Notificar actualización de tarea
- `task-deleted` - Notificar eliminación de tarea
- `task-moved` - Notificar movimiento de tarea

### Servidor → Cliente

- `user-connected` - Usuario conectado
- `user-disconnected` - Usuario desconectado
- Todos los eventos anteriores (broadcast)

## 📁 Estructura del proyecto

```
backend/
├── src/
│   ├── boards/          # Módulo de tableros
│   ├── tasks/           # Módulo de tareas
│   ├── export/          # Módulo de exportación (n8n)
│   ├── gateway/         # WebSocket Gateway
│   ├── schemas/         # Schemas de Mongoose
│   ├── app.module.ts    # Módulo principal
│   └── main.ts          # Entry point
├── .env                 # Variables de entorno (no commit)
├── .env.example         # Ejemplo de variables
└── package.json
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 🐳 Docker

Para levantar solo MongoDB con Docker:

```bash
docker run -d \
  --name mongo-kanban \
  -p 27017:27017 \
  mongo:latest
```

## 📝 Notas importantes

- El endpoint `/api/export/backlog` requiere que **n8n** esté ejecutándose
- El webhook de n8n debe estar configurado en `N8N_WEBHOOK_URL`
- WebSocket funciona automáticamente con Socket.io client
- CORS está configurado para `FRONTEND_URL`
