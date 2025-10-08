# 🐛 Errores y Soluciones - Kanban Board

Este documento recopila los **errores técnicos más relevantes** encontrados durante el desarrollo y sus soluciones aplicadas.

---

## ⚠️ **Error #1: `options.attachments.split is not a function` (n8n)**

### **Contexto:**

Error al enviar email con adjunto CSV en el nodo "Send Email" de n8n.

### **Causa:**

El campo `Attachments` espera una lista de nombres (string), no un objeto binario completo.

### **Solución:**

Pasar el nombre del campo binario en lugar del objeto:

```handlebars
{{ Object.keys($binary)[0].trim() }}
```

### **Resultado:** ✅

Email enviado correctamente con CSV adjunto.

---

## ⚠️ **Error #2: Desincronización en Merge Node (n8n)**

### **Contexto:**

Email llegaba sin adjunto o sin resumen al combinar ramas A y B.

### **Causa:**

Race condition - el nodo Merge no esperaba que ambas ramas terminaran.

### **Solución:**

- Configurar Merge en modo "Wait"
- Agregar nodo Code para unificar items:

```javascript
return [
  {
    json: { message: $items("Message a Model")[0].json.message },
    binary: $items("Convert to File")[0].binary,
  },
];
```

### **Resultado:** ✅

Sincronización garantizada en todas las ejecuciones.

---

## ⚠️ **Error #3: `Cannot read properties of undefined (reading 'map')` (n8n)**

### **Contexto:**

Nodo Code fallaba al intentar mapear `payload.tasks`.

### **Causa:**

El payload del webhook venía en `body`, no en raíz:

```javascript
// ❌ Incorrecto
const payload = $json;
payload.tasks.map(...) // ERROR

// ✅ Correcto
const payload = $json.body;
payload.tasks.map(...) // OK
```

### **Solución:**

Extraer datos de `$json.body` en lugar de `$json`.

### **Resultado:** ✅

Workflow ejecutándose correctamente.

---

## ⚠️ **Error #4: TypeScript - `'_id' is of type 'unknown'` (Backend)**

### **Contexto:**

Error al intentar `task._id.toString()` en el servicio de export.

### **Causa:**

Mongoose retorna `_id` como tipo `unknown` en algunos contextos.

### **Solución:**

Cast a `any` o usar `String()`:

```typescript
// Opción 1
id: (task._id as any).toString();

// Opción 2 (mejor)
id: String(task._id);
```

### **Resultado:** ✅

TypeScript compila sin errores.

---

## ⚠️ **Error #5: Mongoose - `CannotDetermineTypeError` para campo `color`**

### **Contexto:**

Error al agregar campo `color: string | null` al schema de Task.

### **Causa:**

Mongoose no puede inferir tipos de uniones (`string | null`) automáticamente.

### **Solución:**

Especificar tipo explícitamente:

```typescript
// ❌ Incorrecto
@Prop({ default: null })
color: string | null;

// ✅ Correcto
@Prop({ type: String, default: null })
color: string | null;
```

### **Resultado:** ✅

Schema compilado correctamente.

---

## ⚠️ **Error #6: WebSocket - Contador de usuarios no actualiza**

### **Contexto:**

Contador de usuarios conectados mostraba siempre 0.

### **Causa:**

Gateway solo emitía eventos `user-connected/disconnected` sin enviar el conteo real.

### **Solución:**

Enviar conteo en los eventos:

```typescript
// En handleConnection
client.emit("connected-users-count", {
  count: this.server.sockets.sockets.size,
});

// En handleDisconnect
this.server.emit("user-disconnected", {
  count: this.server.sockets.sockets.size,
});
```

### **Resultado:** ✅

Contador actualiza correctamente en tiempo real.

---

## ⚠️ **Error #7: CRLF vs LF en archivos (Prettier)**

### **Contexto:**

Prettier fallaba por inconsistencia de line endings en Windows.

### **Causa:**

Git configurado para CRLF en Windows, pero Prettier esperaba LF.

### **Solución:**

Ejecutar Prettier para normalizar:

```bash
npm run format
```

Configurar `.prettierrc`:

```json
{
  "endOfLine": "auto"
}
```

### **Resultado:** ✅

Código formateado consistentemente.

---

## ⚠️ **Error #8: n8n - Split Out node sin output**

### **Contexto:**

Nodo "Split Out" bloqueaba el flujo sin generar output.

### **Causa:**

Buscaba campo `data` que no existía en los items recibidos.

### **Solución:**

Opción 1: Eliminar el nodo (no necesario)  
Opción 2: Cambiar "Fields To Split Out" a campo existente (ej: `title`)

### **Resultado:** ✅

Flujo ejecutándose completamente.

---

## 🚀 **Mejores Prácticas Aprendidas**

### **n8n**

- ✅ Usar Merge en modo "Wait" para ramas asíncronas
- ✅ Acceder a datos del webhook en `$json.body`
- ✅ Pasar nombres de campos binarios, no objetos completos
- ✅ Validar estructura de datos en Code nodes
- ✅ Revisar logs en "Executions" para debugging

### **Backend (NestJS)**

- ✅ Especificar tipos explícitos en decoradores Mongoose
- ✅ Cast `_id` para evitar errores de tipo `unknown`
- ✅ Usar `class-validator` para validación de DTOs
- ✅ Formatear código con Prettier regularmente
- ✅ Configurar CORS correctamente para frontend

### **Frontend (React)**

- ✅ Crear servicios singleton para API, WebSocket y Audio
- ✅ Usar `type` keyword para imports de tipos
- ✅ Manejar estados de loading y error
- ✅ Implementar optimistic updates para mejor UX
- ✅ Separar lógica de UI en componentes pequeños

### **WebSocket**

- ✅ Emitir eventos solo a otros usuarios (`broadcast`)
- ✅ Enviar metadata (userId, timestamp) en eventos
- ✅ Re-registrar listeners después de reconexión
- ✅ Manejar desconexiones gracefully

---

## 📊 **Impacto de los Errores**

| Error              | Tiempo Perdido | Criticidad | Solución          |
| ------------------ | -------------- | ---------- | ----------------- |
| #1 n8n attachments | ~30 min        | Alta       | Documentación n8n |
| #2 Merge sync      | ~45 min        | Alta       | Code node         |
| #3 n8n payload     | ~15 min        | Media      | Debug logs        |
| #4 TypeScript \_id | ~20 min        | Media      | Cast to any       |
| #5 Mongoose union  | ~10 min        | Baja       | Type explicit     |
| #6 WS counter      | ~25 min        | Media      | Emit count        |
| #7 CRLF/LF         | ~5 min         | Baja       | Prettier          |
| #8 Split Out       | ~10 min        | Media      | Update field      |

**Total tiempo en debugging:** ~3 horas  
**Total tiempo de desarrollo:** ~16 horas

---

## 💡 **Conclusiones**

Los errores encontrados fueron mayormente de:

1. **Integración** (n8n ↔ backend)
2. **Tipos** (TypeScript estricto)
3. **Sincronización** (WebSocket)

Todos fueron resueltos con:

- ✅ Lectura de documentación oficial
- ✅ Debugging con logs
- ✅ Testing incremental

---
