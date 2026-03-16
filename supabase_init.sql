-- Tabla para guardar los autorregistros de forma dinámica
CREATE TABLE IF NOT EXISTS public.autorregistros (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    data JSONB NOT NULL -- Aquí se guardará todo lo que extraiga la IA del manual (emoción, intensidad, etc.)
);

-- Habilitar acceso de lectura para todos (para este proyecto personal)
ALTER TABLE public.autorregistros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura anónima" ON public.autorregistros FOR SELECT USING (true);
CREATE POLICY "Permitir inserción anónima" ON public.autorregistros FOR INSERT WITH CHECK (true);
