# 🔐 Configuración de Variables de Entorno

## Para Opción A (Todo en Docker)

Crea un archivo `.env` en la **raíz del proyecto** con:

```env
# OpenAI API Key (opcional, para mejoras con IA)
OPENAI_API_KEY=sk-tu-api-key-aqui

# WalletConnect Project ID (requerido para conectar wallets)
# Obtén uno gratis en: https://cloud.walletconnect.com/
VITE_WALLETCONNECT_PROJECT_ID=tu-project-id-aqui

# JWT Secret (requerido para autenticación)
# Usa una cadena aleatoria segura. En producción, usa un valor más complejo.
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Comando rápido:**
```bash
echo "OPENAI_API_KEY=sk-tu-key" > .env
echo "VITE_WALLETCONNECT_PROJECT_ID=tu-project-id" >> .env
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
```

En Windows PowerShell:
```powershell
echo "OPENAI_API_KEY=sk-tu-key" > .env
echo "VITE_WALLETCONNECT_PROJECT_ID=tu-project-id" >> .env
echo "JWT_SECRET=your-super-secret-jwt-key-change-this-in-production" >> .env
```

**⚠️ IMPORTANTE:** 
- Reemplaza `sk-tu-key` con tu API Key real de OpenAI (opcional)
- **Obtén un WalletConnect Project ID gratis:**
  1. Ve a https://cloud.walletconnect.com/
  2. Crea una cuenta (gratis)
  3. Crea un nuevo proyecto
  4. Copia el Project ID
  5. Agrégalo al archivo `.env` como `VITE_WALLETCONNECT_PROJECT_ID`

---

## Para Opción B (Desarrollo Local)

### **Backend (.env)**

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

# JWT Secret (requerido para autenticación)
# Usa una cadena aleatoria segura
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173
```

### **Frontend (.env)**

Crea un archivo `.env` en la carpeta **frontend/** con:

```env
# WalletConnect Project ID (requerido para conectar wallets)
# Obtén uno gratis en: https://cloud.walletconnect.com/
VITE_WALLETCONNECT_PROJECT_ID=tu-project-id-aqui
```

**⚠️ IMPORTANTE:** 
- El WalletConnect Project ID es **obligatorio** para que la aplicación funcione.
- Obtén uno gratis en https://cloud.walletconnect.com/

---

## ⚠️ Notas de Seguridad

- ✅ El archivo `.env` está en `.gitignore` (no se commitea)
- ✅ Las credenciales son solo locales
- ✅ Nunca compartas tu API Key de OpenAI

---

Ver guía completa: [INSTALLATION.md](INSTALLATION.md)

