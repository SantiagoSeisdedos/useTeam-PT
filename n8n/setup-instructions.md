# 🚀 Guía de Configuración de n8n - Kanban Export

## 📋 **Resumen**
Esta guía te ayudará a configurar el workflow de n8n para la funcionalidad de exportación de backlog del tablero Kanban.

---

## 🛠 **Prerequisitos**

### **Software Requerido**
- Docker instalado y funcionando
- Acceso a internet para descargar imágenes Docker
- Puerto 5678 disponible en tu máquina

### **Servicios Externos**
- **Mailtrap** (para testing) o **Gmail SMTP** (para producción)
- **OpenAI API Key** (para resúmenes con IA)

---

## 🐳 **Instalación de n8n con Docker**

### **1. Levantar n8n**
```bash
# Desde la raíz del proyecto
docker-compose up -d n8n
```

### **2. Verificar que funciona**
- Abrir navegador en: `http://localhost:5678`
- Deberías ver la interfaz de n8n

---

## 📥 **Importar el Workflow**

### **1. Acceder a n8n**
- Ir a `http://localhost:5678`
- Crear cuenta o hacer login

### **2. Importar workflow**
1. Click en **"Import from file"** o **"+"** → **"Import from file"**
2. Seleccionar el archivo: `n8n/workflow.json`
3. Click **"Import"**

### **3. Activar el workflow**
1. En la lista de workflows, encontrar **"Kanban Backlog Export"**
2. Activar el **switch** (debe quedar en verde)
3. El workflow ahora está activo y escuchando webhooks

---

## ⚙️ **Configuración de Credenciales**

### **1. Configurar Email (Mailtrap)**

#### **Para Testing (Mailtrap)**
1. Ir a [Mailtrap.io](https://mailtrap.io) y crear cuenta
2. Crear inbox de testing
3. En n8n: **Settings** → **Credentials** → **Add Credential**
4. Seleccionar **"SMTP"**
5. Configurar:
   ```
   Host: smtp.mailtrap.io
   Port: 2525
   Username: [tu username de Mailtrap]
   Password: [tu password de Mailtrap]
   ```
6. Guardar como **"Mailtrap SMTP"**

#### **Para Producción (Gmail)**
1. En n8n: **Settings** → **Credentials** → **Add Credential**
2. Seleccionar **"Gmail"**
3. Configurar OAuth2 o App Password
4. Guardar como **"Gmail SMTP"**

### **2. Configurar OpenAI**

1. En n8n: **Settings** → **Credentials** → **Add Credential**
2. Seleccionar **"OpenAI"**
3. Ingresar tu **API Key** de OpenAI
4. Guardar como **"OpenAI API"**

---

## 🔧 **Configuración del Workflow**

### **1. Verificar nodos críticos**

#### **Nodo "Webhook"**
- **URL:** `http://localhost:5678/webhook/kanban-export`
- **Method:** POST
- **Response Mode:** "When Last Node Finishes"

#### **Nodo "Code" (Primer nodo)**
```javascript
// Extraer el payload del webhook
const webhookData = $input.first().json;
const payload = webhookData.body || webhookData;

console.log("📦 Payload recibido:", {
  hasTasks: !!payload.tasks,
  tasksCount: payload.tasks?.length,
  email: payload.email
});

// Validar que existan tareas
if (!payload.tasks || !Array.isArray(payload.tasks)) {
  throw new Error('El payload no contiene un array de tasks');
}

if (payload.tasks.length === 0) {
  console.warn('⚠️ No hay tareas para exportar');
}

// Retornar array de items (cada tarea como un item separado)
return payload.tasks.map((task) => ({
  json: {
    id: task.id,
    title: task.title,
    description: task.description,
    column: task.column,
    fecha_creacion: task.fecha_creacion,
    // Metadata adicional
    email: payload.email,
    timestamp: payload.timestamp,
    totalTasks: payload.totalTasks,
  },
}));
```

#### **Nodo "Split Out"**
- **Fields To Split Out:** `title` (cualquier campo que exista)
- **Include:** `All Other Fields`

#### **Nodo "Convert to File"**
- **Operation:** Convert to CSV
- **Put Output File in Field:** `data`
- **Options:**
  - Delimiter: `,`
  - File Name: `kanban-backlog.csv`
  - Header Row: `true`

#### **Nodo "Code1" (Segundo nodo)**
```javascript
// Obtener todos los items del nodo anterior
const allItems = $input.all();

// Validar que hay items
if (!allItems || allItems.length === 0) {
  throw new Error('No se recibieron tareas para procesar');
}

console.log(`📦 Procesando ${allItems.length} tareas`);

// Extraer metadata del primer item
const firstTask = allItems[0].json;
const email = firstTask.email;
const timestamp = firstTask.timestamp;
const totalTasks = firstTask.totalTasks;

// Construir resumen
let textContent = `📋 **REPORTE KANBAN BOARD**\n\n`;
textContent += `📧 Destinatario: ${email}\n`;
textContent += `📅 Fecha de exportación: ${new Date(timestamp).toLocaleString('es-ES')}\n`;
textContent += `📊 Total de tareas: ${totalTasks}\n\n`;
textContent += `---\n\n`;

// Agrupar por columna
const tasksByColumn = {};
allItems.forEach(item => {
  const task = item.json;
  const column = task.column;
  if (!tasksByColumn[column]) {
    tasksByColumn[column] = [];
  }
  tasksByColumn[column].push(task);
});

// Generar contenido por columna
Object.keys(tasksByColumn).forEach(column => {
  const tasks = tasksByColumn[column];
  textContent += `## 📌 ${column} (${tasks.length} tareas)\n\n`;
  
  tasks.forEach((task, index) => {
    textContent += `${index + 1}. **${task.title}**\n`;
    textContent += `   📝 ${task.description}\n`;
    textContent += `   🆔 ID: ${task.id}\n`;
    textContent += `   📅 Creado: ${new Date(task.fecha_creacion).toLocaleDateString('es-ES')}\n\n`;
  });
});

textContent += `---\n`;
textContent += `✅ Exportación completada exitosamente`;

return [{ json: { textContent: textContent } }];
```

#### **Nodo "Message a model"**
- **Model:** `gpt-3.5-turbo`
- **Messages:** 
  ```
  Role: system
  Content: Eres un asistente que genera resúmenes ejecutivos de tableros Kanban en español.
  
  Role: user
  Content: {{ $json.textContent }}
  ```

#### **Nodo "Send email"**
- **From Email:** `kanban-board@tudominio.com`
- **To Email:** `{{ $json.email }}`
- **Subject:** `📋 Reporte Kanban Board - {{ new Date().toLocaleDateString('es-ES') }}`
- **Message:** `{{ $json.textContent }}`
- **Attachments:** `{{ Object.keys($binary)[0] }}`

---

## 🧪 **Testing del Workflow**

### **1. Test Manual**
1. Ir a **"Executions"** en n8n
2. Click **"Test workflow"** en el workflow "Kanban Backlog Export"
3. Verificar que todos los nodos se ejecuten en verde

### **2. Test desde Frontend**
1. Levantar el backend: `cd backend && npm run start:dev`
2. Levantar el frontend: `cd frontend && npm run dev`
3. Ir a `http://localhost:5173`
4. Click en **"Exportar Backlog"**
5. Ingresar email de destino
6. Click **"Exportar"**
7. Verificar en **"Executions"** de n8n que se ejecute correctamente

### **3. Verificar Email**
- Revisar inbox de Mailtrap o Gmail
- Deberías recibir email con:
  - ✅ CSV adjunto (`kanban-backlog.csv`)
  - ✅ Resumen en el cuerpo del email
  - ✅ Formato correcto del CSV

---

## 🐛 **Troubleshooting**

### **Error: "Cannot read properties of undefined"**
- **Causa:** El payload no tiene la estructura esperada
- **Solución:** Verificar que el backend esté enviando datos correctos

### **Error: "The field 'data' wasn't found"**
- **Causa:** El nodo "Split Out" está buscando un campo que no existe
- **Solución:** Cambiar "Fields To Split Out" a un campo que exista (ej: `title`)

### **Error: "SMTP connection failed"**
- **Causa:** Credenciales de email incorrectas
- **Solución:** Verificar credenciales en Settings → Credentials

### **Error: "OpenAI API key invalid"**
- **Causa:** API key incorrecta o sin créditos
- **Solución:** Verificar API key en Settings → Credentials

### **Workflow no se ejecuta**
- **Causa:** Workflow no está activado
- **Solución:** Activar el switch del workflow

---

## 📊 **Monitoreo**

### **Logs de n8n**
```bash
# Ver logs en tiempo real
docker logs n8n -f

# Ver logs específicos
docker logs n8n --tail 50
```

### **Executions en n8n**
- Ir a **"Executions"** para ver historial
- Click en cualquier ejecución para ver detalles
- Revisar logs de cada nodo

---

## 🔄 **Actualizaciones**

### **Actualizar workflow**
1. Exportar workflow actualizado desde n8n
2. Reemplazar `n8n/workflow.json`
3. Re-importar en n8n
4. Activar el workflow

### **Backup del workflow**
1. En n8n: Click en el workflow
2. **"Export"** → **"Download"**
3. Guardar como backup

---

## ✅ **Checklist de Configuración**

- [ ] n8n levantado con Docker
- [ ] Workflow importado desde `n8n/workflow.json`
- [ ] Workflow activado (switch verde)
- [ ] Credenciales de email configuradas
- [ ] Credenciales de OpenAI configuradas
- [ ] Test manual del workflow exitoso
- [ ] Test desde frontend exitoso
- [ ] Email recibido con CSV adjunto
- [ ] CSV se abre correctamente en Excel/Google Sheets

---

## 🎯 **URLs Importantes**

- **n8n UI:** `http://localhost:5678`
- **Webhook URL:** `http://localhost:5678/webhook/kanban-export`
- **Executions:** `http://localhost:5678/executions`
- **Credentials:** `http://localhost:5678/credentials`

---

**¡Configuración completada! El workflow está listo para exportar backlogs.** 🚀

