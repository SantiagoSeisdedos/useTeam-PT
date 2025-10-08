# PROJECT_ERRORS.md

## 🧩 Propósito

Este documento recopila los errores, problemas y bloqueos técnicos encontrados durante el desarrollo del proyecto **useTeam - Kanban AI Export**, así como las soluciones aplicadas.  
La idea es mantener un registro útil para:

- Entender decisiones técnicas tomadas.
- Evitar repetir errores.
- Ayudar a otros desarrolladores a resolver los mismos problemas.
- Mostrar trazabilidad y razonamiento técnico ante revisores del challenge.

---

## 🧱 Contexto del entorno

- **Herramienta de automatización:** n8n (Docker)
- **IA usada:** OpenAI (GPT-3.5-turbo)
- **Envío de correos:** Mailtrap (SMTP sandbox)
- **Datos:** JSON → CSV → Email
- **Flujo:** Webhook → Code → Convert to CSV → Message a Model → Merge → Send Email

---

## ⚠️ Error #1 — `options.attachments.split is not a function`

### 🧾 Descripción

Durante el envío de correos con el nodo **Send Email**, al intentar adjuntar un archivo binario (`{{ $binary }}` o `{{ $binary.data }}`), se obtuvo el siguiente error: `NodeApiError: options.attachments.split is not a function`

### 🎯 Causa raíz

El campo `Attachments` del nodo espera **una lista separada por comas (string)**, no un objeto binario.  
n8n internamente usa `.split(',')` sobre el valor recibido, por lo tanto, pasar un objeto (`$binary`) produce el error.

### 🧩 Solución aplicada

Se pasó **el nombre del campo binario** como string dinámico en lugar del objeto completo:

```handlebars
{{ Object.keys($binary)[0].trim() }}
```

Esto indica a n8n que use el archivo binario actualmente almacenado bajo esa key (por ejemplo data, file, etc.).

### ✅ Resultado

Correo enviado correctamente con CSV adjunto (kanban-backlog.csv) y cuerpo del mensaje con resumen IA.

---

## ⚠️ Error #2 — Desincronización entre ramas (Merge Node)

### 🧾 Descripción

Al **unir** las dos ramas del flujo (CSV y resumen IA) con el **nodo Merge**, el email a veces llegaba sin adjunto o sin resumen.

### 🎯 Causa raíz

El nodo **Merge** combinaba los outputs sin esperar que ambos procesos terminaran, provocando **condiciones de carrera** (race conditions).
Esto pasaba especialmente cuando el Message a Model (LLM) demoraba más en responder que la conversión a CSV.

### 🧩 Solución aplicada

- Se cambió el modo del nodo Merge a “Wait” (esperar ambos inputs).
- Luego, se añadió un nodo Code que unifica los datos en un solo item, combinando:
  - binary del CSV (rama A)
  - json con mensaje IA (rama B)

```javascript
return [
  {
    json: {
      message: $items("Message a Model")[0].json.message,
    },
    binary: $items("Convert to File")[0].binary,
  },
];
```

### ✅ Resultado

Sincronización garantizada → el email se envía con ambas partes completas.

---

# ⚠️ Error #3 — CSV no reconocible en Google Sheets

### 🧾 Descripción

En pruebas iniciales, el CSV generado abría mal en Google Sheets (campos en una sola columna).

### 🎯 Causa raíz

El separador por defecto usado por n8n (; o \t) no siempre es compatible con Google Sheets (espera ,).

### 🧩 Solución aplicada

En el nodo Convert to File, se forzó la opción: `Delimiter: ,`

### ✅ Resultado
El CSV abre correctamente en Google Sheets y mantiene columnas separadas.


# ⚠️ Error #4 — Mock data no compatible con Convert to CSV
### 🧾 Descripción

El nodo Code inicial devolvía un objeto { data: [...] }, que el nodo Convert to File no reconocía como array plano.

### 🎯 Causa raíz

El nodo Convert to File (modo CSV) espera un array en la raíz (items[]), no anidado dentro de un campo data.

### 🧩 Solución aplicada

Se modificó el Code para retornar directamente un array plano:

```javascript
return [
  { json: { id: 1, title: 'Configurar entorno', column: 'To Do' } },
  { json: { id: 2, title: 'Diseñar modelo', column: 'In Progress' } },
  { json: { id: 3, title: 'Implementar drag & drop', column: 'Done' } }
];
```

### ✅ Resultado
CSV generado correctamente.

### 🚀 Mejores prácticas aprendidas

- Usar Merge (Wait) siempre cuando hay ramas con tiempos diferentes.
- No pasar objetos binarios completos en nodos que esperan texto.
- Validar formato CSV antes de enviar por email.
- Documentar cada ajuste técnico y exportar el workflow (workflow.json).
- Nombrar nodos descriptivamente (evita confusión en merges grandes).
- Hacer pruebas con Mailtrap antes de SMTP real.
- Verificar credenciales OpenAI antes de ejecutar workflow completo.