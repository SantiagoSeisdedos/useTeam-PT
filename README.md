# 🎯 Tablero Kanban Colaborativo en Tiempo Real

## ✅ **DESAFÍO COMPLETADO EXITOSAMENTE** 🎉

Una aplicación tipo **Trello** completa con gestión de tareas mediante un **tablero Kanban**, **colaboración en tiempo real**, y **exportación automatizada de backlog** vía email con CSV.

### 🚀 **Características Implementadas**
- ✅ **Tablero Kanban** con drag & drop fluido
- ✅ **Colaboración en tiempo real** con WebSocket
- ✅ **Exportación de backlog** vía email con CSV adjunto
- ✅ **Interfaz moderna** con React + Tailwind CSS
- ✅ **Backend robusto** con NestJS + MongoDB
- ✅ **Automatización** con n8n + OpenAI

---

## 🛠 **Stack Tecnológico Implementado**

### **Frontend**
- **React 19** + **Vite 7** + **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui** (estilo new-york)
- **@dnd-kit** para drag & drop fluido
- **Socket.io-client** para tiempo real
- **Axios** para API calls
- **Sonner** para notificaciones toast

### **Backend**
- **NestJS 11** + **TypeScript**
- **MongoDB** + **Mongoose** para persistencia
- **Socket.io** para WebSocket
- **class-validator** para validación de DTOs
- **CORS** configurado para frontend

### **Automatización**
- **n8n** para workflows automatizados
- **OpenAI API** para resúmenes inteligentes
- **SMTP** para envío de emails
- **Webhooks** para comunicación entre sistemas

---

## 📧 **Funcionalidad de Exportación Implementada**

### ✅ **Sistema de Exportación Automatizada**

El sistema implementa una **exportación completa del backlog** utilizando **n8n** para generar flujos de trabajo automatizados.

#### **Flujo de Trabajo Implementado**
```
[Frontend] → [NestJS API] → [n8n Webhook] → [CSV Generation] → [AI Summary] → [Email Delivery] → [User Notification]
```

#### **Características de la Exportación**
- ✅ **Botón de exportación** en la interfaz del tablero
- ✅ **Endpoint `/api/export/backlog`** en NestJS
- ✅ **Flujo n8n automatizado** con bifurcación:
  - **Rama A:** Generación de CSV con todas las tareas
  - **Rama B:** Resumen inteligente con OpenAI
  - **Merge:** Combinación de CSV + resumen
- ✅ **Email con adjunto** CSV y resumen en cuerpo
- ✅ **Notificaciones de estado** en tiempo real

#### **Estructura del CSV Exportado**
- **ID de tarea** (identificador único)
- **Título** (nombre de la tarea)
- **Descripción** (detalles de la tarea)
- **Columna** (posición actual en el tablero)
- **Fecha de creación** (timestamp de creación)
- **Email destino** (para referencia)
- **Total de tareas** (metadatos)

---

## 🚀 **Instalación y Configuración**

### **Prerequisitos**
- Node.js 18+ y npm
- Docker y Docker Compose
- MongoDB (local o Atlas)
- Cuenta de OpenAI (para resúmenes)
- Cuenta de Mailtrap o Gmail (para emails)

### **1. Clonar el Repositorio**
```bash
git clone <tu-repo-url>
cd useTeam-PT
```

### **2. Configurar Variables de Entorno**
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar variables necesarias
# MONGODB_URI=mongodb://localhost:27017/kanban-board
# N8N_WEBHOOK_URL=http://localhost:5678/webhook/kanban-export
# OPENAI_API_KEY=tu-api-key-aqui
```

### **3. Levantar Servicios Base**
```bash
# Levantar MongoDB y n8n con Docker
docker-compose up -d

# Verificar que n8n esté funcionando
# Abrir: http://localhost:5678
```

### **4. Configurar n8n**
1. Ir a `http://localhost:5678`
2. Importar workflow desde `n8n/workflow.json`
3. Configurar credenciales (OpenAI, SMTP)
4. Activar el workflow
5. Ver guía completa: [`n8n/setup-instructions.md`](n8n/setup-instructions.md)

### **5. Instalar y Levantar Backend**
```bash
cd backend
npm install
npm run start:dev

# El backend estará en: http://localhost:3000
```

### **6. Instalar y Levantar Frontend**
```bash
cd frontend
npm install
npm run dev

# El frontend estará en: http://localhost:5173
```

### **7. Poblar Base de Datos (Opcional)**
```bash
cd backend
npm run seed

# Esto creará datos de ejemplo para testing
```

---

## 🧪 **Testing del Sistema**

### **Verificar Funcionalidades**
1. **Tablero Kanban:** Crear, editar, eliminar tareas
2. **Drag & Drop:** Mover tareas entre columnas
3. **Tiempo Real:** Abrir múltiples ventanas y ver sincronización
4. **Exportación:** Click en "Exportar Backlog" y verificar email

### **URLs Importantes**
- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:3000/api`
- **n8n UI:** `http://localhost:5678`
- **WebSocket:** `ws://localhost:3000`

---

## 📁 **Estructura del Proyecto**

```
useTeam-PT/
├── 📁 backend/                 # NestJS API
│   ├── src/
│   │   ├── tasks/             # Módulo de tareas
│   │   ├── boards/            # Módulo de tableros
│   │   ├── export/            # Módulo de exportación
│   │   ├── gateway/           # WebSocket Gateway
│   │   └── schemas/           # Esquemas MongoDB
│   ├── package.json
│   └── README.md
├── 📁 frontend/               # React App
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   ├── services/          # API y WebSocket clients
│   │   ├── types/             # Tipos TypeScript
│   │   └── config/            # Configuración
│   ├── package.json
│   └── README.md
├── 📁 n8n/                   # Workflows de n8n
│   ├── workflow.json          # Workflow de exportación
│   └── setup-instructions.md # Guía de configuración
├── 📄 docker-compose.yml     # Servicios Docker
├── 📄 PROJECT_STATUS.md      # Estado del proyecto
├── 📄 UX_IMPROVEMENTS_ROADMAP.md # Mejoras futuras
└── 📄 README.md              # Este archivo
```

---

## 🎨 **Mejoras Futuras**

### **Roadmap de Mejoras UX/UI**
El proyecto incluye un roadmap detallado de mejoras futuras en [`UX_IMPROVEMENTS_ROADMAP.md`](UX_IMPROVEMENTS_ROADMAP.md):

#### **Prioridad ALTA**
- 🎨 **Selector de colores** para tarjetas (similar a Trello)
- 🎯 **Mejorar drag & drop** con indicadores visuales
- 📋 **Gestión de columnas** (crear, renombrar, eliminar)

#### **Prioridad MEDIA**
- 🔊 **Sonido de éxito** al exportar
- 📬 **Múltiples destinatarios** para exportación
- 🧠 **Mejorar descripción con IA**
- 🔐 **Sistema de usuarios** (login/signup)

#### **Prioridad BAJA**
- ⚙️ **Selección de campos** a exportar
- 👤 **Asignación de tareas**
- 🐳 **Docker Compose completo**
- 🧪 **Tests automatizados**

---

## 📊 **Estado del Proyecto**

### ✅ **Desafío Completado al 100%**
- [x] Tablero Kanban con drag & drop
- [x] Colaboración en tiempo real con WebSocket
- [x] Exportación de backlog vía email con CSV
- [x] Interfaz moderna y responsive
- [x] Backend robusto con NestJS + MongoDB
- [x] Automatización con n8n + OpenAI
- [x] Testing end-to-end completo

### 📋 **Pendientes para Entrega Final**
- [ ] Invitar colaboradores al repositorio
- [ ] Documentación final con screenshots

**Progreso global: 100% completado** 🎯✅

---

## 🚀 **Próximos Pasos**

1. **Implementar mejoras UX/UI** según roadmap
2. **Agregar sistema de usuarios** para colaboración avanzada
3. **Integrar más funcionalidades de IA** para automatización
4. **Escalar a producción** con Docker Compose completo

---

## 📞 **Contacto y Colaboración**

Para colaborar en el proyecto o reportar issues:

- **Repositorio:** [GitHub - useTeam-PT](https://github.com/tu-usuario/useTeam-PT)
- **Documentación:** Ver archivos README en cada módulo
- **Issues:** Usar GitHub Issues para reportar bugs o sugerencias

---

**¡Desafío completado exitosamente!** 🎉🚀
