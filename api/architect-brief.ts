import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

async function getManualContext(topic: string, source?: string): Promise<{ context: string; sources: string[] }> {
  try {
    const result = await embeddingModel.embedContent(topic);
    const embedding = result.embedding.values;

    const { data: matches, error } = await supabase.rpc('match_manual_knowledge', {
      query_embedding: embedding,
      match_threshold: 0.45,
      match_count: 15,
      p_category: null,
      p_expert: null
    });

    if (error || !matches || matches.length === 0) return { context: "", sources: [] };

    let filtered = matches;
    if (source) {
      const sources = Array.isArray(source) ? source : [source];
      const srcFiltered = matches.filter((m: any) =>
        sources.some((s: string) => m.metadata?.source === s || m.metadata?.full_path?.includes(s))
      );
      if (srcFiltered.length > 0) filtered = srcFiltered;
    }

    const usedSources = [...new Set(filtered.map((m: any) => m.metadata?.source || 'Manual clínico'))];
    const context = filtered.slice(0, 10).map((m: any) => `[${m.metadata?.source || 'Manual'}] ${m.content}`).join("\n\n");
    return { context, sources: usedSources };
  } catch (err) {
    console.error("RAG error:", err);
    return { context: "", sources: [] };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topic, source, mode = 'full' } = req.body;

  if (!topic) return res.status(400).json({ error: 'topic is required' });

  try {
    const { context, sources } = await getManualContext(topic, source);

    const systemPrompt = `Eres Herbie, un Arquitecto de Software Clínico. Tu misión es leer fragmentos de manuales clínicos y generar una especificación completa para diseñar una herramienta digital de registro e intervención psicológica dentro de una app.

IMPORTANTE: Responde SIEMPRE en JSON válido, sin texto adicional, sin bloques de código markdown.

El JSON debe seguir exactamente este esquema:
{
  "tool_name": "Nombre de la herramienta (en español)",
  "manual_source": "Nombre del manual consultado",
  "protocol_overview": "Descripción del protocolo clínico (2-3 párrafos basados en el manual)",
  "steps": [
    {
      "step_number": 1,
      "name": "Nombre corto del paso",
      "description": "Qué se evalúa o registra en este paso",
      "user_prompt": "¿Qué instrucción aparece en el formulario para el usuario?",
      "bot_guidance": "Guión completo de lo que el asistente Herbie debe decir en este paso para un usuario sin conocimientos de psicología",
      "fields": [
        {
          "name": "nombre_campo",
          "label": "Etiqueta visible para el usuario",
          "type": "text | textarea | slider | radio | checkbox | date",
          "placeholder": "Texto de ejemplo o guía dentro del campo",
          "required": true,
          "clinical_rationale": "Por qué este campo es necesario según el manual"
        }
      ]
    }
  ],
  "clinical_basis": [
    "Cita o referencia directa del manual que justifica el diseño"
  ],
  "auto_registros_schema": {
    "description": "Descripción de cómo guardar los registros",
    "key_metrics": ["métrica1", "métrica2"]
  }
}

Basándote en el siguiente contexto extraído de los manuales:
${context || "No se encontró contexto específico. Usa tu conocimiento general de psicología clínica basada en evidencia."}

Genera la especificación completa para la técnica/protocolo: "${topic}". 
Sé muy específico con los campos (idealmente 3-5 campos por paso, máximo 5 pasos).`;

    const chatModel = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemPrompt
    });

    const result = await chatModel.generateContent(`Genera la especificación JSON completa para: "${topic}"`);
    const response = await result.response;
    let rawText = response.text().trim();

    // Strip markdown code blocks if present
    rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');

    const parsed = JSON.parse(rawText);

    return res.status(200).json({ 
      design: parsed,
      meta: { sources, topic, generated_at: new Date().toISOString() }
    });
  } catch (error: any) {
    console.error('Architect error:', error);
    if (error.status === 429 || error.message?.includes('429')) {
      return res.status(429).json({ error: 'RATE_LIMIT', message: 'Por favor espera unos segundos e inténtalo de nuevo.' });
    }
    return res.status(500).json({ error: error.message, detail: 'Error generando la especificación' });
  }
}
