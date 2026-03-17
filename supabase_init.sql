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

-- Tabla para gestionar sesiones del bot (contexto y timeout)
CREATE TABLE IF NOT EXISTS public.bot_sessions (
    telegram_id BIGINT PRIMARY KEY,
    history JSONB DEFAULT '[]'::jsonb,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.bot_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Servicio total bot_sessions" ON public.bot_sessions FOR ALL USING (true) WITH CHECK (true);
