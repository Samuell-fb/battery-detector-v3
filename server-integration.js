/**
 * 🔒 SERVER INTEGRATION - Integración Segura del Cliente con Servidor
 * 
 * Este script reemplaza las llamadas directas a APIs de Gemini/Groq
 * por llamadas seguras al servidor Node.js
 * 
 * NUNCA expondrá las API keys en el navegador
 */

// ================================================================
// CONFIGURACIÓN DEL SERVIDOR
// ================================================================
const SERVER_URL = 'http://localhost:3000';
const SERVER_ENDPOINTS = {
  health: `${SERVER_URL}/api/health`,
  gemini: `${SERVER_URL}/api/gemini`,
  groq: `${SERVER_URL}/api/groq`,
  chat: `${SERVER_URL}/api/chat`
};

// ================================================================
// FUNCIONES DE INTEGRACIÓN SEGURA
// ================================================================

/**
 * Verifica si el servidor está en línea
 */
async function checkServerHealth() {
  try {
    const response = await fetch(SERVER_ENDPOINTS.health, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    
    const data = await response.json();
    console.log('✅ Servidor en línea:', data);
    return data;
  } catch (error) {
    console.error('❌ Servidor no disponible:', error.message);
    return null;
  }
}

/**
 * Llamada segura a Gemini vía servidor
 */
async function callGeminiSecure(message, conversationHistory = []) {
  if (!message) {
    console.error('Message es requerido');
    return null;
  }

  try {
    const response = await fetch(SERVER_ENDPOINTS.gemini, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : []
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error('❌ Error en Gemini:', error.message);
    return null;
  }
}

/**
 * Llamada segura a Groq vía servidor
 */
async function callGroqSecure(message, conversationHistory = []) {
  if (!message) {
    console.error('Message es requerido');
    return null;
  }

  try {
    const response = await fetch(SERVER_ENDPOINTS.groq, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : []
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error('❌ Error en Groq:', error.message);
    return null;
  }
}

/**
 * Llamada inteligente a Chat (intenta Gemini, fallback a Groq)
 */
async function callChatSecure(message, conversationHistory = []) {
  if (!message) {
    console.error('Message es requerido');
    return null;
  }

  try {
    const response = await fetch(SERVER_ENDPOINTS.chat, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : []
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      reply: data.reply,
      provider: data.provider
    };
  } catch (error) {
    console.error('❌ Error en Chat:', error.message);
    return null;
  }
}

/**
 * Enviar mensaje de chat (reemplaza la función original insegura)
 */
async function sendChatSecure() {
  if (aiThinking) return;

  const input = document.getElementById('chatInput');
  const message = input ? input.value.trim() : '';

  if (!message) return;

  // Mostrar mensaje del usuario
  displayChatMessage(message, 'user');
  if (input) input.value = '';

  // Indicador de escritura
  const typingInd = document.getElementById('typingInd');
  if (typingInd) typingInd.style.display = 'flex';
  aiThinking = true;

  try {
    // Llamar al servidor (seguro, sin exponer keys)
    const result = await callChatSecure(message, historial || []);

    if (typingInd) typingInd.style.display = 'none';

    if (result && result.reply) {
      // Mostrar respuesta de IA
      displayChatMessage(result.reply, 'assistant');

      // Reproducir sonido si está habilitado
      if (aiVoiceEnabled) {
        speakText(result.reply);
      }

      // Guardar en historial
      if (!Array.isArray(historial)) historial = [];
      historial.push(
        { role: 'user', content: message, time: new Date().toLocaleTimeString() },
        { role: 'assistant', content: result.reply, time: new Date().toLocaleTimeString() }
      );

      // Guardar en caché
      saveActiveChatSnapshot();

      console.log(`✅ Respuesta de ${result.provider || 'IA'}`);
    } else {
      displayChatMessage('No se pudo procesar la solicitud. Verifica que el servidor esté en línea.', 'assistant');
    }
  } catch (error) {
    console.error('❌ Error al enviar chat:', error);
    displayChatMessage('Error al conectar con el servidor. Asegúrate que está ejecutándose.', 'assistant');
    if (typingInd) typingInd.style.display = 'none';
  } finally {
    aiThinking = false;
  }
}

/**
 * Mostrar mensaje en el chat (función auxiliar)
 */
function displayChatMessage(content, role) {
  const chatMsgs = document.getElementById('chatMsgs');
  if (!chatMsgs) return;

  const msgEl = document.createElement('div');
  msgEl.className = role === 'user' ? 'msg msg-user' : 'msg msg-ai';

  let html = '';
  if (role === 'assistant') {
    html += '<span class="ai-tag">🤖 IA</span>';
  } else if (role === 'user') {
    html += '<span class="user-tag">TÚ</span>';
  }

  html += `<span>${escapeHtml(content)}</span>`;
  html += `<div class="msg-time">${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>`;

  msgEl.innerHTML = html;
  chatMsgs.appendChild(msgEl);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

/**
 * Escapa HTML para evitar inyecciones
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Reproducir texto con síntesis de voz
 */
function speakText(text) {
  if (!aiVoiceEnabled || !('speechSynthesis' in window)) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'es' ? 'es-ES' : 'en-US';
  utterance.rate = 0.9;
  utterance.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

// ================================================================
// REEMPLAZAR FUNCIONES INSEGURAS EN EL HTML
// ================================================================

/**
 * Esperar a que el DOM esté listo
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔒 Inicializando integración segura del servidor...');

  // Verificar conexión con servidor
  const health = await checkServerHealth();
  if (!health) {
    console.warn('⚠️ El servidor no está disponible. Asegúrate de ejecutar: npm run dev');
    showNotif('⚠️ Servidor no disponible', 'warn');
  } else {
    console.log('✅ Servidor conectado correctamente');
  }

  // Reemplazar botón de envío del chat
  const chatSendBtn = document.getElementById('chatSend');
  if (chatSendBtn) {
    chatSendBtn.onclick = sendChatSecure;
  }

  // Permitir Enter en el input del chat
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatSecure();
      }
    });
  }

  console.log('✅ Integración segura lista');
});

// ================================================================
// HELPERS
// ================================================================

/**
 * Mostrar notificación (asume que la función existe en el HTML)
 */
function showNotif(message, type = 'info') {
  if (typeof notif === 'function') {
    notif(message, type);
  } else {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

console.log('🔒 server-integration.js cargado correctamente');
