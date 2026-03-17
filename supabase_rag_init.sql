-- 1. Habilitar la extensión vector para búsqueda semántica
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Tabla para almacenar los fragmentos de los manuales
CREATE TABLE IF NOT EXISTS public.manual_knowledge (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    content text NOT NULL,              -- El fragmento de texto
    embedding vector(768),              -- Vector de 768 dimensiones (Gemini text-embedding-004)
    metadata jsonb,                     -- Para guardar origen, página, etc.
    created_at timestamptz DEFAULT now()
);

-- 3. Índice para búsqueda rápida por similitud
CREATE INDEX ON public.manual_knowledge USING hnsw (embedding vector_cosine_ops);

-- 4. Función para buscar fragmentos similares (Similarity Search)
CREATE OR REPLACE FUNCTION match_manual_knowledge (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    manual_knowledge.id,
    manual_knowledge.content,
    manual_knowledge.metadata,
    1 - (manual_knowledge.embedding <=> query_embedding) AS similarity
  FROM manual_knowledge
  WHERE 1 - (manual_knowledge.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 5. Política de acceso (lectura anónima para el bot/app)
ALTER TABLE public.manual_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura pública manuales" ON public.manual_knowledge FOR SELECT USING (true);
