import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);
const embeddingModel = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });

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

    const usedSources = [...new Set(filtered.map((m: any) => m.metadata?.source || 'Manual clínico'))] as string[];
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

    const systemPrompt = `Eres Herbie, un Arquitecto de Software Clínico de Nivel Experto. Tu misión es leer fragmentos de manuales clínicos y generar una especificación completa para diseñar una herramienta digital de terapia o evaluación psicológica.

REGLAS CLÍNICAS OBLIGATORIAS:
1. Rigor Metodológico: Debes diseñar entre 5 y 8 pasos. Nunca te limites a un diseño simplista.
2. Fases Estructurales: El protocolo SIEMPRE debe incluir:
   - Paso 1: Preparación/Evaluación inicial (ej. Línea base SUDS, relajación, psicoeducación breve).
   - Pasos Intermedios: Intervención/Técnica core (con desglose ABC si es cognitivo-conductual u operante).
   - Paso Final: Tareas para casa / Plan de generalización.
3. Métricas Cuantitativas: DEBES incluir campos de tipo 'slider' o 'number' para medir la intensidad (SUDS), frecuencia, viveza de la imaginación u otras variables comprobables empíricamente.
4. Tono del Bot: El 'bot_guidance' (guión de Herbie) debe ser terapéuticamente empático pero directivo y profesional. No suenes a encuesta de satisfacción, eres un especialista guiando un proceso.
5. Contigüidad y Precisión: Si es una técnica conductual (como sensibilización o economía de fichas), respeta la contigüidad temporal y la especificidad de los reforzadores/estímulos en tus pasos.

IMPORTANTE: Responde SIEMPRE en JSON válido, sin texto adicional, sin bloques de código markdown.

El JSON debe seguir exactamente este esquema:
{
  "tool_name": "Nombre de la herramienta (en español)",
  "manual_source": "Nombre del manual consultado",
  "protocol_overview": "Descripción del protocolo clínico (2-3 párrafos)",
  "prerequisites": ["Habilidades previas necesarias", "Condiciones requeridas"],
  "target_behaviors": ["Conducta(s) a reducir o aumentar"],
  "steps": [
    {
      "step_number": 1,
      "name": "Nombre corto del paso (ej: 'Evaluación y Línea Base')",
      "description": "Qué se evalúa o registra en este paso",
      "user_prompt": "¿Qué instrucción aparece en el formulario para el usuario?",
      "bot_guidance": "Guión directivo y empático de Herbie para este paso",
      "fields": [
        {
          "name": "nombre_campo",
          "label": "Etiqueta visible",
          "type": "text | textarea | slider | radio | checkbox | date",
          "placeholder": "Guía dentro del campo",
          "required": true,
          "clinical_rationale": "Justificación clínica según la teoría"
        }
      ]
    }
  ],
  "clinical_basis": [
    "Cita o referencia directa del manual que justifica el diseño"
  ],
  "auto_registros_schema": {
    "description": "Descripción general",
    "key_metrics": ["métrica1_cuantitativa", "métrica2"]
  }
}

Basándote en el siguiente contexto extraído de los manuales:
\${context || "No se encontró contexto específico. Usa tu conocimiento experto de psicología basada en evidencia."}

Genera la especificación completa y rigurosa para la técnica/protocolo: "\${topic}". 
Sé muy específico con los campos (incluyendo métricas medibles obligatoriamente) y diseña entre 5 y 8 pasos.`;

    const chatModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
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
