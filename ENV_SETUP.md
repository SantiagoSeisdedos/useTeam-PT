# 🔐 Configuración de Variables de Entorno

## Para Opción A (Todo en Docker)

Crea un archivo `.env` en la **raíz del proyecto** con:

```env
# OpenAI API Key (requerido)
OPENAI_API_KEY=sk-tu-api-key-aqui
```

**Comando rápido:**
```bash
echo "OPENAI_API_KEY=sk-tu-key" > .env
```

**⚠️ IMPORTANTE:** Reemplaza `sk-tu-key` con tu API Key real de OpenAI.

---

## Para Opción B (Desarrollo Local)

Crea un archivo `.env` en la carpeta **backend/** con:

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

---

## ⚠️ Notas de Seguridad

- ✅ El archivo `.env` está en `.gitignore` (no se commitea)
- ✅ Las credenciales son solo locales
- ✅ Nunca compartas tu API Key de OpenAI

---

Ver guía completa: [INSTALLATION.md](INSTALLATION.md)

