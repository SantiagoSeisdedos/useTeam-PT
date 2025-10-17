# 🚀 Guía de Instalación - Kanban Board

Esta guía te ayudará a configurar y ejecutar el proyecto completo desde cero.

---

## 📋 **Prerequisitos**

Antes de comenzar, asegúrate de tener instalado:

- ✅ **Node.js 18+** y npm ([Descargar](https://nodejs.org/))
- ✅ **Docker** y **Docker Compose** ([Descargar](https://www.docker.com/))
- ✅ **Git** ([Descargar](https://git-scm.com/))

### **Cuentas Necesarias:**
- ✅ **OpenAI API Key** ([Obtener](https://platform.openai.com/api-keys))
- ✅ **Mailtrap** - Recomendado para testing ([Crear cuenta gratis](https://mailtrap.io/))

---

## 🛠 **Instalación - Elige tu Modo**

Hay **2 formas** de ejecutar el proyecto. Elige la que prefieras:

---

## 🚀 **Opción A: Quick Testing (Todo en Docker)** ⚡

**Ventajas:** Setup rápido, un solo comando  
**Ideal para:** Evaluadores, testing rápido, demo

### **1. Clonar el Repositorio**

```bash
git clone https://github.com/tu-usuario/useTeam-PT.git
cd useTeam-PT
```

### **2. Crear archivo .env**

Crea un archivo `.env` en la raíz con:

```env
OPENAI_API_KEY=sk-tu-api-key-aqui
```

### **3. Levantar TODO con Docker**

```bash
docker-compose up -d
```

Esto levantará:
- ✅ MongoDB (puerto 27017)
- ✅ n8n (puerto 5678)
- ✅ Backend (puerto 3000)
- ✅ Frontend (puerto 5173)

### **4. Configurar n8n** (solo una vez)

Ver [sección de configuración n8n](#paso-4-configurar-n8n) más abajo.

### **5. Abrir navegador**

```
http://localhost:5173
```

**¡Listo!** Todo funcionando con un comando 🎉

---

## 🛠 **Opción B: Desarrollo Local (Infraestructura en Docker)**

**Ventajas:** Hot reload, debugging fácil, logs en consola  
**Ideal para:** Desarrollo, modificación de código

### **1. Clonar el Repositorio**

```bash
git clone https://github.com/tu-usuario/useTeam-PT.git
cd useTeam-PT
```

### **2. Levantar Solo Infraestructura**

```bash
docker-compose up -d mongodb n8n
```

Esto levantará solo:
- ✅ MongoDB (puerto 27017)
- ✅ n8n (puerto 5678)

### **3. Configurar Variables de Entorno**

#### **Backend (.env)**

Crea el archivo `backend/.env` con:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/kanban-board

# Server
PORT=3000

# N8N Integration
N8N_WEBHOOK_URL=http://localhost:5678/webhook/kanban-export

# OpenAI API (para mejoras con IA)
OPENAI_API_KEY=sk-tu-api-key-aqui

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173
```

**⚠️ IMPORTANTE:** Reemplaza `sk-tu-api-key-aqui` con tu API Key de OpenAI.

### **4. Configurar n8n** (solo una vez)

Ver [sección de configuración n8n](#configuración-de-n8n-ambas-opciones) más abajo.

### **5. Instalar y Levantar Backend**

```bash
cd backend
npm install
npm run start:dev
```

**✅ Verificar:** Backend en `http://localhost:3000`

### **6. Instalar y Levantar Frontend** (en otra terminal)

```bash
cd frontend
npm install
npm run dev
```

**✅ Verificar:** Frontend en `http://localhost:5173`

---

## ⚙️ **Configuración de n8n (Ambas Opciones)**

**Esta configuración es necesaria para AMBAS opciones.**

### **1. Abrir n8n**

```
http://localhost:5678
```

**Credenciales por defecto:**
- Usuario: `admin`
- Password: `admin`

### **2. Importar Workflow**

1. Click en **"+"** → **"Import from file"**
2. Seleccionar: `n8n/workflow.json` (desde la carpeta del proyecto)
3. Click **"Import"**
4. Verás "Kanban Backlog Export" en la lista

### **3. Configurar Credenciales**

#### **a) OpenAI API:**
- Click **Settings** (⚙️) → **Credentials** → **"Add Credential"**
- Buscar "OpenAI" → Ingresar tu API Key
- Guardar como "OpenAI API"

#### **b) Mailtrap (Email):**
- En **Credentials** → **"Add Credential"**
- Buscar "SMTP" → Configurar:
  ```
  Host: smtp.mailtrap.io
  Port: 2525
  Username: [tu username]
  Password: [tu password]
  ```
- Guardar como "Mailtrap SMTP"

### **4. Activar Workflow**

- Ir a **Workflows** → "Kanban Backlog Export"
- **Activar el switch** (esquina superior derecha)
- Debe quedar en verde con texto "Active"

**📖 Guía detallada:** [`n8n/setup-instructions.md`](n8n/setup-instructions.md)

---

## 🧪 **Verificar que Todo Funciona** (Ambas Opciones)

### **Poblar Base de Datos** (Opcional pero Recomendado)

El tablero se crea automáticamente al abrir la app por primera vez, pero puedes poblar con datos de ejemplo:

**Opción A (Docker):**
```bash
docker exec -it kanban-backend npm run seed
```

**Opción B (Local):**
```bash
cd backend
npm run seed
```

**Esto creará:**
- 1 tablero con 3 columnas predefinidas
- 8 tareas de ejemplo distribuidas

**⚠️ IMPORTANTE:** Si no ejecutas el seed, el tablero se creará vacío automáticamente al abrir `http://localhost:5173`

---

## ✅ **Tests de Funcionalidades**

### **1. Tablero Kanban**
- ✅ Abrir `http://localhost:5173`
- ✅ Ver tablero con 3 columnas
- ✅ Ver tareas (si ejecutaste el seed)

### **2. Crear Tarea**
- ✅ Click en "+" de cualquier columna
- ✅ Llenar título y descripción
- ✅ Click "Crear"
- ✅ Escuchar sonido de creación ✨

### **3. Drag & Drop**
- ✅ Arrastra una tarjeta a otra columna
- ✅ Ver feedback visual (escala, rotación)
- ✅ Soltar y verificar que se guarda

### **4. Tiempo Real** (2 ventanas)
- ✅ Abrir Chrome normal e Incognito
- ✅ Ver contador de usuarios: "2 conectado(s)"
- ✅ Crear tarea en ventana 1
- ✅ Ver actualización instantánea en ventana 2
- ✅ Escuchar sonido de notificación 🔔

### **5. Exportar Backlog**
- ✅ Click en "Exportar Backlog"
- ✅ Ingresar email (de Mailtrap)
- ✅ Click "Exportar"
- ✅ Escuchar acorde de éxito 🎵
- ✅ Revisar email en Mailtrap
- ✅ Descargar CSV adjunto
- ✅ Abrir en Google Sheets

### **6. Mejorar con IA**
- ✅ Crear/editar una tarea
- ✅ Escribir descripción básica
- ✅ Click "Mejorar con IA" ✨
- ✅ Seleccionar modo (Simple/Contextual)
- ✅ Ver preview de descripción mejorada
- ✅ Aceptar o descartar

---

## 🔧 **Troubleshooting**

### **Error: Backend no se conecta a MongoDB**
```bash
# Verificar que MongoDB esté corriendo
docker ps

# Si no está, levantar servicios
docker-compose up -d mongodb
```

### **Error: n8n no responde**
```bash
# Ver logs de n8n
docker logs n8n

# Reiniciar n8n
docker-compose restart n8n
```

### **Error: Frontend no encuentra backend**
- Verificar que backend esté en `http://localhost:3000`
- Revisar `frontend/src/config/api.ts`

### **Error: "OpenAI API key not configured"**
- Verificar que `OPENAI_API_KEY` esté en `backend/.env`
- Reiniciar el backend después de agregar la key

### **Error: Export no funciona**
- Verificar que el workflow esté **activado** en n8n
- Revisar credenciales de OpenAI y SMTP en n8n
- Ver logs en "Executions" de n8n

---

## 📡 **URLs del Sistema**

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | `http://localhost:5173` | Interfaz del Kanban |
| **Backend API** | `http://localhost:3000/api` | REST API |
| **WebSocket** | `ws://localhost:3000` | Tiempo real |
| **n8n UI** | `http://localhost:5678` | Admin de workflows |
| **MongoDB** | `localhost:27017` | Base de datos |

---

## 🎯 **Comandos Útiles**

### **Docker - Opción A (Todo en Docker)**
```bash
docker-compose up -d                    # Levantar TODO
docker-compose down                     # Detener TODO
docker-compose logs -f backend          # Ver logs backend
docker-compose logs -f frontend         # Ver logs frontend
docker-compose logs -f n8n              # Ver logs n8n
docker-compose restart backend          # Reiniciar backend
docker exec -it kanban-backend npm run seed  # Seed DB
```

### **Docker - Opción B (Solo Infraestructura)**
```bash
docker-compose up -d mongodb n8n        # Levantar solo infra
docker-compose down                     # Detener servicios
docker-compose logs -f n8n              # Ver logs n8n
docker-compose restart mongodb          # Reiniciar MongoDB
```

### **Backend (Opción B Local)**
```bash
cd backend
npm run start:dev    # Modo desarrollo con hot reload
npm run build        # Build para producción
npm run seed         # Poblar BD con datos
npm run format       # Formatear código
```

### **Frontend (Opción B Local)**
```bash
cd frontend
npm run dev          # Modo desarrollo con hot reload
npm run build        # Build para producción
npm run preview      # Preview del build
```

---

## ✅ **Checklist de Instalación**

### **Opción A: Todo en Docker** ⚡
- [ ] Docker Desktop instalado y corriendo
- [ ] Repositorio clonado
- [ ] Archivo `.env` creado en raíz con `OPENAI_API_KEY`
- [ ] `docker-compose up -d` ejecutado
- [ ] 4 contenedores corriendo: mongodb, n8n, backend, frontend
- [ ] **n8n:** Workflow importado y activado
- [ ] **n8n:** Credenciales configuradas (OpenAI + SMTP)
- [ ] Frontend visible en `http://localhost:5173`
- [ ] Test de exportación exitoso

### **Opción B: Desarrollo Local** 🛠
- [ ] Node.js 18+ instalado
- [ ] Docker Desktop instalado y corriendo
- [ ] Repositorio clonado
- [ ] `docker-compose up -d mongodb n8n` ejecutado
- [ ] `backend/.env` creado con variables
- [ ] Backend: `npm install` y `npm run start:dev`
- [ ] Frontend: `npm install` y `npm run dev`
- [ ] **n8n:** Workflow importado y activado
- [ ] **n8n:** Credenciales configuradas (OpenAI + SMTP)
- [ ] Tablero visible en `http://localhost:5173`
- [ ] Test de exportación exitoso

---

## 🎉 **¡Listo para Usar!**

Si completaste todos los pasos, deberías tener el sistema completamente funcional.

**Recursos adicionales:**
- [Documentación de n8n](n8n/setup-instructions.md)
- [Historial del proyecto](PROJECT_STATUS.md)
- [Errores comunes](PROJECT_ERRORS.md)

---

**¿Problemas?** Revisa la sección de Troubleshooting o consulta `PROJECT_ERRORS.md`

