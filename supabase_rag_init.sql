-- 1. Habilitar la extensión vector para búsqueda semántica
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Tabla para almacenar los fragmentos de los manuales
CREATE TABLE IF NOT EXISTS public.manual_knowledge (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    content text NOT NULL,
    embedding vector(768),
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);

-- Asegurar que las nuevas columnas existen (si la tabla ya fue creada antes)
ALTER TABLE public.manual_knowledge ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';
ALTER TABLE public.manual_knowledge ADD COLUMN IF NOT EXISTS expert text DEFAULT 'general';

-- 3. Índice para búsqueda rápida por similitud
CREATE INDEX IF NOT EXISTS manual_knowledge_embedding_idx ON public.manual_knowledge USING hnsw (embedding vector_cosine_ops);

-- 4. Función para buscar fragmentos similares (Similarity Search)
CREATE OR REPLACE FUNCTION match_manual_knowledge (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_category text DEFAULT NULL,
  p_expert text DEFAULT NULL
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
    AND (p_category IS NULL OR manual_knowledge.category = p_category)
    AND (p_expert IS NULL OR manual_knowledge.expert = p_expert)
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 5. Política de acceso (lectura anónima para el bot/app)
ALTER TABLE public.manual_knowledge ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura pública manuales" ON public.manual_knowledge;
CREATE POLICY "Lectura pública manuales" ON public.manual_knowledge FOR SELECT USING (true);
