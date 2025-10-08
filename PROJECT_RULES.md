# PROJECT_RULES.md

## 🎯 Propósito del proyecto
Desarrollar una aplicación tipo Trello (tablero Kanban) con soporte de colaboración en tiempo real y una funcionalidad requerida: **exportación del backlog vía email en CSV** mediante un flujo automatizado en **n8n**. Este repo contiene frontend, backend y el flujo n8n que automatiza la extracción y envío del CSV (con resumen generado por IA).

Este documento define el *stack*, la *arquitectura*, las *reglas de desarrollo* y las *buenas prácticas* que debe seguir el asistente (Cursor/IA) y los desarrolladores.

---

## 📦 Stack tecnológico (requerido)
- **Frontend:** React.js (React + DnD library como `react-beautiful-dnd` o equivalente).
- **Backend:** NestJS (TypeScript) con WebSocket (Socket.io) para colaboración en tiempo real.
- **DB:** MongoDB (almacenamiento de tasks / columnas).
- **Automatización:** n8n (workflow orchestration).
- **Correo de pruebas:** Mailtrap (sandbox).
- **IA / Resumen:** OpenAI (GPT-3.5 / GPT-4 según disponibilidad).
- **Contenedores:** Docker / docker-compose (opcional pero recomendado).
- **Otros:** Node.js, npm/yarn, Git.

---

## 🗂 Estructura recomendada de carpetas (raíz del repo)
useTeam-PT/
├── README.md
├── .env.example
├── frontend/
│ ├── package.json
│ └── src/
├── backend/
│ ├── package.json
│ └── src/
├── n8n/
│ ├── workflow.json
│ └── setup-instructions.md
├── docker-compose.yml (opcional)
└── PROJECT_RULES.md
└── PROJECT_STATUS.md
└── PROMPT.MD


---

## 🧩 Flujo (arquitectura del workflow n8n)

[Frontend Button: Exportar Backlog]
↓
[Backend NestJS: POST /api/export/backlog] -> (dispara)
↓
[n8n Webhook: /webhook/kanban-export] → [Get Tasks / mock or HTTP Request]
↓
BIFURCACIÓN:
├─> Convert to CSV (binary → kanban-backlog.csv) → (adjunto)
└─> Convert to Text → Message a Model (OpenAI) → (resumen texto)
↓
[Merge (wait for both)] → [Send Email (SMTP/Mailtrap/Gmail)]
↓
[Webhook Response / Notificación al usuario]


---

## 🧾 Requisitos funcionales (CRÍTICOS)
1. **CSV adjunto**: el email debe incluir `kanban-backlog.csv` con columnas: id, título, descripción, columna, fecha_creacion.
2. **Resumen IA en cuerpo del mail**: el texto (resumen) debe generarse con OpenAI y aparecer en el cuerpo del mensaje.
3. **Endpoint backend**: `/api/export/backlog` en NestJS que dispare el webhook n8n.
4. **Configuración de destino de email**: configurable vía `.env` o UI en n8n.
5. **Notificaciones**: confirmar al usuario la solicitud y notificar éxito/fracaso.

---

## 🧰 Variables de entorno (en `.env.example`)

```env
# Database
MONGODB_URI=mongodb://localhost:27017/kanban-board

# Backend
PORT=3000
N8N_WEBHOOK_URL=http://localhost:5678/webhook/kanban-export

# Frontend
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=ws://localhost:3000

# n8n / Mail
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=admin

# OpenAI (no exponer en commits)
OPENAI_API_KEY=xxxx

# Email (production)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
```

---

## 🧭 Reglas de desarrollo / Operativas

- Usar Mailtrap para testing, Gmail o SMTP real solo en producción.
- Nunca commitear claves en texto plano. Usar .env y variables seguras (no subir .env).
- Cuando el agente / asistente ejecute comandos, usar PowerShell (Windows) o el shell que se indique en el scope. Instrucción explícita: si se solicita "ejecutar comando por el agente", preferir PowerShell y documentar la línea exacta a ejecutar.
   - Ej.: powershell -Command "docker compose up -d" o Invoke-RestMethod -Uri 'http://localhost:3000/api/export/backlog' -Method Post -Body '{}' -ContentType 'application/json'
- Prompts reproducibles: guardá prompts base en n8n/prompts.md o README.md, y no incluir datos sensibles en los prompts.
- Pruebas: validar que CSV se importe en Google Sheets; validar correo en Mailtrap.
- Naming:
   - Nombres de nodos en n8n en Title Case: Get Tasks, Convert to File, Message a Model, Merge, Send Email.
   - Archivos: kebab-case (kanban-backlog.csv, workflow.json).
- Documentar cambios en PROJECT_STATUS.md (cada commit mayor debería actualizar estado).
- Finalización del challenge: segui las instrucciones del README.md del challenge (invitación de colaboradores u otros pasos).

---

## 🧪 Comandos útiles (PowerShell recomendado)

```javascript
//  en la raíz del repo
docker compose up -d

// ver logs n8n
docker logs -f n8n

// Ejecutar endpoint de export desde PowerShell:
Invoke-RestMethod -Uri 'http://localhost:3000/api/export/backlog' -Method Post -Body (@{ email = 'test@example.com' } | ConvertTo-Json) -ContentType 'application/json'
```

---

## 📌 Criterios de evaluación (cómo aseguramos que el challenge pase)

- El flujo n8n dispara correctamente y envía email con CSV adjunto y resumen IA.
- El endpoint /api/export/backlog en NestJS dispara el webhook (N8N_WEBHOOK_URL).
- El CSV contiene las columnas solicitadas y es legible en Google Sheets.
- La solución está documentada (README + n8n/workflow.json + setup-instructions.md).
- Seguridad: no exponer claves, usar Mailtrap para pruebas.

---

## 🔭 Extensiones sugeridas (valor añadido para el PR)

- Trigger diario (cron) en n8n para envío automático.
- Guardar resumen como .md y archivarlo (S3 / Google Drive).
- Notificaciones en Slack/Discord.
- Interfaz en frontend para configurar email destino y campos a exportar