# 🔒 SETUP DEL SERVIDOR SEGURO - Battery Detector v3

## ¿Qué se hizo?

He creado un servidor Node.js que **protege tus API keys** de Gemini y Groq. Ahora:

✅ Las keys **NO aparecen en el navegador**  
✅ Las keys están almacenadas en `.env` (no se suben a GitHub)  
✅ El cliente llama al servidor, no directamente a APIs  
✅ Todo está encriptado y protegido  

---

## 📁 Archivos creados:

```
battery-detector-v3/
├── server.js                 ← Servidor Node.js (new)
├── server-integration.js     ← Integración para el HTML (new)
├── package.json              ← Dependencias (new)
├── .env                      ← Variables de entorno (new) 🔒
├── .gitignore                ← Archivos ignorados (new)
├── index.html                ← Tu HTML original (sin cambios)
└── README.md
```

---

## 🚀 INSTALACIÓN (PASO A PASO)

### 1️⃣ Abre una terminal en la carpeta del proyecto:

```bash
cd /ruta/a/battery-detector-v3
```

### 2️⃣ Instala Node.js (si no lo tienes)

Descarga desde: https://nodejs.org/

Verifica con:
```bash
node --version
npm --version
```

### 3️⃣ Instala las dependencias del servidor

```bash
npm install
```

Esto instalará:
- `express` - Framework web
- `cors` - Para compartir recursos entre cliente y servidor
- `dotenv` - Para cargar variables de entorno
- `node-fetch` - Para hacer requests HTTP

### 4️⃣ Inicia el servidor

```bash
npm run dev
```

Deberías ver:
```
╔════════════════════════════════════════╗
║     🤖 BatteryAI Server Running       ║
║     🔌 http://localhost:3000           ║
║     🔒 API Keys Protected             ║
╚════════════════════════════════════════╝
```

### 5️⃣ Verifica que funciona

Abre en tu navegador:
```
http://localhost:3000/api/health
```

Deberías ver JSON como:
```json
{
  "status": "ok",
  "hasGemini": true,
  "hasGroq": true
}
```

### 6️⃣ Integra con tu HTML

En tu `index.html`, antes del `</body>`:

```html
<!-- AGREGAR ESTO ANTES DEL CIERRE DEL BODY -->
<script src="server-integration.js"></script>
```

---

## 🔧 CONFIGURACIÓN

### El archivo `.env` contiene:

```env
GEMINI_API_KEY=AIzaSyAcvXuSvF6hXnyXfRlgDzYBPxW7YLdkYvo
GROQ_API_KEY=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
PORT=3000
```

⚠️ **IMPORTANTE:** Este archivo está en `.gitignore`, así que **nunca se sube a GitHub**

---

## 🔌 ENDPOINTS DEL SERVIDOR

### 1. Health Check
```
GET http://localhost:3000/api/health
```
Verifica si el servidor está en línea.

### 2. Llamar Gemini
```
POST http://localhost:3000/api/gemini
Body: {
  "message": "Tu pregunta aquí",
  "conversationHistory": []
}
```

### 3. Llamar Groq
```
POST http://localhost:3000/api/groq
Body: {
  "message": "Tu pregunta aquí",
  "conversationHistory": []
}
```

---

## 📱 FLUJO DE FUNCIONAMIENTO

```
┌─────────────────────────────────────────────────────────┐
│                    TU NAVEGADOR                         │
│  (index.html + server-integration.js)                   │
│                                                         │
│  Usuario escribe → chatInput.value                      │
│  ↓                                                      │
│  sendChatSecure()                                       │
│  ↓                                                      │
│  fetch() → POST /api/gemini                            │
└────────────┬────────────────────────────────────────────┘
             │ (SOLO JSON, NO KEYS)
             ↓
┌─────────────────────────────────────────────────────────┐
│              SERVIDOR NODE.JS                           │
│  (server.js con las keys protegidas en .env)           │
│                                                         │
│  /api/gemini endpoint                                   │
│  ↓                                                      │
│  Lee GEMINI_API_KEY del .env                           │
│  ↓                                                      │
│  Hace request a la API de Gemini                       │
│  ↓                                                      │
│  Retorna respuesta (SIN exponer la key)                │
└────────────┬────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────┐
│                    TU NAVEGADOR                         │
│  Recibe respuesta y la muestra en el chat              │
└─────────────────────────────────────────────────────────┘
```

---

## 🛡️ SEGURIDAD

### ✅ LO QUE ESTÁ PROTEGIDO:

- Las API keys están en el servidor, **no en el navegador**
- Las keys se cargan desde `.env`, **no desde código**
- `.gitignore` previene que las keys se suban a GitHub
- El cliente solo envía mensajes, el servidor maneja las keys

### ❌ NUNCA HAGAS ESTO:

- ❌ Subir `.env` a GitHub
- ❌ Escribir las keys directamente en el código
- ❌ Mostrar las keys en la consola del navegador
- ❌ Compartir el `.env` con otros

---

## 📞 FUNCIONES DISPONIBLES

En `server-integration.js`:

```javascript
// Llama a Gemini vía servidor
await callGeminiSecure(message, conversationHistory);

// Llama a Groq vía servidor
await callGroqSecure(message, conversationHistory);

// Verifica si el servidor está en línea
await checkServerHealth();

// Enviar chat (reemplaza la función antigua)
await sendChatSecure();

// Mostrar mensaje en el chat
displayChatMessage(content, role);
```

---

## 🐛 TROUBLESHOOTING

### "Cannot find module 'express'"
```bash
npm install
```

### "Error: Cannot find .env file"
Asegúrate de que `.env` está en la raíz del proyecto.

### "CORS error"
El servidor está configurado con CORS habilitado, pero verifica que:
```javascript
app.use(cors()); // Está en server.js
```

### "localhost:3000 not reachable"
- Asegúrate que el servidor está corriendo: `npm run dev`
- Verifica que el puerto 3000 esté disponible
- Intenta: `http://localhost:3000/api/health`

---

## 🚀 DEPLOYMENT (Producción)

Para desplegar en producción (Heroku, Render, etc.):

1. Sube el código a GitHub (el `.env` NO se sube gracias a `.gitignore`)
2. En la plataforma de hosting, configura las variables de entorno:
   - `GEMINI_API_KEY=...`
   - `GROQ_API_KEY=...`
3. El servidor buscará en las variables de entorno en lugar de `.env`

---

## 📋 CHECKLIST

- [ ] `npm install` ejecutado sin errores
- [ ] `.env` creado con las keys
- [ ] `npm run dev` iniciado correctamente
- [ ] `http://localhost:3000/api/health` devuelve JSON
- [ ] `server-integration.js` agregado antes del `</body>` en index.html
- [ ] El chat funciona enviando mensajes al servidor
- [ ] Las keys **NO aparecen** en la consola del navegador
- [ ] `.env` está en `.gitignore`

---

## 📚 REFERENCIAS

- Express.js: https://expressjs.com/
- Dotenv: https://github.com/motdotla/dotenv
- Node.js: https://nodejs.org/

---

**¡Listo! Tu servidor está protegido y tus API keys están seguras. 🔒**
