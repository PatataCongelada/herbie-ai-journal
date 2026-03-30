import 'dotenv/config';
console.log('✅ Dotenv cargado.');

import express from 'express';
console.log('✅ Express cargado.');

import clinicalChatHandler from './api/clinical-chat.ts';
import architectBriefHandler from './api/architect-brief.ts';
import extractFieldsHandler from './api/extract-fields.ts';
import pingHandler from './api/ping.ts';
import deleteRecordHandler from './api/delete-record.ts';
import decomposeConceptHandler from './api/decompose-concept.ts';
import bodyParser from 'body-parser';

console.log('✅ Todos los handlers importados.');

const app = express();
app.use(bodyParser.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Mock de Vercel Request/Response para local
const wrapHandler = (handlerObject: any) => async (req: any, res: any) => {
  try {
    const handler = typeof handlerObject === 'function' ? handlerObject : handlerObject.default;
    
    if (typeof handler !== 'function') {
      console.error('❌ Error: El handler no es una función', handlerObject);
      return res.status(500).json({ error: 'Handler is not a function' });
    }

    // Inject res.status().json() behavior
    const vercelRes = {
      status: (code: number) => ({
        json: (data: any) => res.status(code).json(data),
        send: (data: any) => res.status(code).send(data)
      }),
      setHeader: (name: string, value: string) => res.setHeader(name, value)
    };
    await handler(req, vercelRes);
  } catch (err: any) {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message });
  }
};

console.log('🛰️ Registrando rutas...');
app.post('/api/clinical-chat', wrapHandler(clinicalChatHandler));
app.post('/api/architect-brief', wrapHandler(architectBriefHandler));
app.post('/api/extract-fields', wrapHandler(extractFieldsHandler));
app.post('/api/decompose-concept', wrapHandler(decomposeConceptHandler));
app.get('/api/ping', wrapHandler(pingHandler));
app.post('/api/delete-record', wrapHandler(deleteRecordHandler));
app.delete('/api/delete-record', wrapHandler(deleteRecordHandler));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Bridge corriendo en http://localhost:${PORT}`);
  console.log('Rutas registradas:');
  console.log('- POST /api/clinical-chat');
  console.log('- POST /api/architect-brief');
  console.log('- POST /api/extract-fields');
  console.log('- GET  /api/ping');
});
