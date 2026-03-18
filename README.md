# Herbie — Tu Diario Clínico Inteligente 🤖🧠

Herbie es un asistente clínico impulsado por inteligencia artificial, especializado en Análisis de Conducta Aplicado (ABA). Permite registrar datos clínicos, analizar conductas y consultar manuales especializados en tiempo real.

## Características principales

- **Cerebro Experto ABA**: Chat con IA entrenado con manuales clínicos (RAG)
- **Registro Automático**: Extracción de campos clínicos con IA
- **Dashboard Clínico**: Visualización de registros por plan
- **Bot de Telegram**: Registro conversacional desde el móvil

## Stack técnico

- **Frontend**: React + Vite + TypeScript + Framer Motion
- **Backend**: Node.js (api-bridge) + Vercel Serverless Functions  
- **IA**: Google Gemini API (chat + embeddings)
- **Base de datos**: Supabase (PostgreSQL + pgvector)

## Desarrollo local

```bash
npm install
npm run dev
```

También necesitas el puente API:

```bash
npx tsx api-bridge.ts
```

## Variables de entorno necesarias

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_GEMINI_API_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
TELEGRAM_BOT_TOKEN=
```
