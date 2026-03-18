import 'dotenv/config';
console.log('✅ Dotenv cargado.');

import express from 'express';
console.log('✅ Express cargado.');

import clinicalChatHandler from './api/clinical-chat.ts';
console.log('✅ Handler clinical-chat cargado.');

import extractFieldsHandler from './api/extract-fields.ts';
import pingHandler from './api/ping.ts';
import deleteRecordHandler from './api/delete-record.ts';
import decomposeConceptHandler from './api/decompose-concept.ts';
import bodyParser from 'body-parser';

console.log('✅ Todos los handlers cargados.');
const app = express();
app.use(bodyParser.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Mock de Vercel Request/Response para local
const wrapHandler = (handler: any) => async (req: any, res: any) => {
  try {
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

app.post('/api/clinical-chat', wrapHandler(clinicalChatHandler));
app.post('/api/extract-fields', wrapHandler(extractFieldsHandler));
app.post('/api/decompose-concept', wrapHandler(decomposeConceptHandler));
app.get('/api/ping', wrapHandler(pingHandler));
app.post('/api/delete-record', wrapHandler(deleteRecordHandler));
app.delete('/api/delete-record', wrapHandler(deleteRecordHandler));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Bridge corriendo en http://localhost:${PORT}`);
  console.log(`🔗 El proxy de Vite enviará las peticiones aquí.`);
});
