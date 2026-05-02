/**
 * 🔒 SERVER.JS - Servidor seguro para proteger API keys
 * 
 * Este servidor:
 * 1. Protege las API keys de Gemini y Groq
 * 2. Las cargas desde .env (nunca expuestas)
 * 3. Actúa como proxy entre el navegador y las APIs
 * 4. Implementa CORS para permitir requests del navegador
 * 
 * Inicia con: node server.js
 * O con nodemon: npm run dev
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

// ================================================================
// CONFIGURACIÓN
// ================================================================
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// API Keys desde variables de entorno (SEGURAS)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash-latest';
const GROQ_MODEL = 'mixtral-8x7b-32768';

// Timeouts
const GEMINI_TIMEOUT = parseInt(process.env.GEMINI_TIMEOUT || '30000');
const GROQ_TIMEOUT = parseInt(process.env.GROQ_TIMEOUT || '30000');

// ================================================================
// MIDDLEWARE
// ================================================================

// CORS - Permite requests desde cualquier origen en desarrollo
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logger de requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ================================================================
// RUTAS
// ================================================================

/**
 * Health check - Verifica que el servidor está en línea
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGemini: !!GEMINI_API_KEY,
    hasGroq: !!GROQ_API_KEY,
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

/**
 * Endpoint Gemini - Llama a la API de Gemini
 */
app.post('/api/gemini', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Gemini API key not configured' });
    }

    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('📡 Llamando a Gemini...');

    // Construir el contexto de conversación
    const contents = [];
    
    // Agregar historial si existe
    if (Array.isArray(conversationHistory)) {
      conversationHistory.forEach(msg => {
        if (msg.role && msg.content) {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        }
      });
    }

    // Agregar mensaje actual
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        }),
        timeout: GEMINI_TIMEOUT
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Gemini error:', errorData);
      return res.status(response.status).json({
        error: errorData.error?.message || 'Gemini API error'
      });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';

    console.log('✅ Respuesta de Gemini recibida');
    res.json({ reply, provider: 'Gemini' });

  } catch (error) {
    console.error('❌ Error en Gemini:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * Endpoint Groq - Llama a la API de Groq
 */
app.post('/api/groq', async (req, res) => {
  try {
    if (!GROQ_API_KEY) {
      return res.status(503).json({ error: 'Groq API key not configured' });
    }

    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('📡 Llamando a Groq...');

    // Construir el historial de mensajes
    const messages = [];
    
    // Agregar historial si existe
    if (Array.isArray(conversationHistory)) {
      conversationHistory.forEach(msg => {
        if (msg.role && msg.content) {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      });
    }

    // Agregar mensaje actual
    messages.push({
      role: 'user',
      content: message
    });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      }),
      timeout: GROQ_TIMEOUT
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Groq error:', errorData);
      return res.status(response.status).json({
        error: errorData.error?.message || 'Groq API error'
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No response from Groq';

    console.log('✅ Respuesta de Groq recibida');
    res.json({ reply, provider: 'Groq' });

  } catch (error) {
    console.error('❌ Error en Groq:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * Endpoint Chat inteligente - Intenta Gemini, fallback a Groq
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('📡 Intentando Gemini primero...');

    // Intentar Gemini primero
    if (GEMINI_API_KEY) {
      try {
        const contents = [];
        
        if (Array.isArray(conversationHistory)) {
          conversationHistory.forEach(msg => {
            if (msg.role && msg.content) {
              contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
              });
            }
          });
        }

        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: contents,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024
              }
            }),
            timeout: GEMINI_TIMEOUT
          }
        );

        if (response.ok) {
          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
          console.log('✅ Respuesta de Gemini');
          return res.json({ reply, provider: 'Gemini' });
        }
      } catch (geminiError) {
        console.warn('⚠️ Gemini falló, intentando Groq...');
      }
    }

    // Fallback a Groq
    if (GROQ_API_KEY) {
      console.log('📡 Usando Groq como fallback...');

      const messages = [];
      
      if (Array.isArray(conversationHistory)) {
        conversationHistory.forEach(msg => {
          if (msg.role && msg.content) {
            messages.push({
              role: msg.role,
              content: msg.content
            });
          }
        });
      }

      messages.push({
        role: 'user',
        content: message
      });

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024
        }),
        timeout: GROQ_TIMEOUT
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || 'No response';
        console.log('✅ Respuesta de Groq');
        return res.json({ reply, provider: 'Groq' });
      }
    }

    // Si llegamos aquí, ambas fallaron
    res.status(503).json({
      error: 'All AI services are unavailable'
    });

  } catch (error) {
    console.error('❌ Error en chat:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * Ruta raíz
 */
app.get('/', (req, res) => {
  res.json({
    message: '🔒 BatteryAI Server - API Keys Protected',
    endpoints: {
      health: '/api/health',
      gemini: '/api/gemini',
      groq: '/api/groq',
      chat: '/api/chat'
    }
  });
});

// ================================================================
// ERROR HANDLING
// ================================================================

app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : undefined
  });
});

// ================================================================
// INICIAR SERVIDOR
// ================================================================

app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║     🤖 BatteryAI Server Running       ║');
  console.log(`║     🔌 http://localhost:${PORT}           ║`);
  console.log('║     🔒 API Keys Protected             ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Gemini configured: ${!!GEMINI_API_KEY}`);
  console.log(`Groq configured: ${!!GROQ_API_KEY}`);
  console.log('');
  console.log('Endpoints disponibles:');
  console.log(`  GET  http://localhost:${PORT}/api/health`);
  console.log(`  POST http://localhost:${PORT}/api/gemini`);
  console.log(`  POST http://localhost:${PORT}/api/groq`);
  console.log(`  POST http://localhost:${PORT}/api/chat`);
  console.log('');
  console.log('Presiona Ctrl+C para detener el servidor');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Apagando servidor...');
  process.exit(0);
});
