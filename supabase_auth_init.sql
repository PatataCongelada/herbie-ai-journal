-- 🛠️ SCRIPT DE INICIALIZACIÓN DE USUARIOS Y SEGURIDAD CLINICA (E2EE)
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase.

-- 1. TABLA DE PERFILES (Extensión de Auth de Supabase)
-- Almacena metadatos del usuario de forma segura.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at timestamp with time zone,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  constraint username_length check (char_length(username) >= 3)
);

-- 2. TABLA DE AUTORREGISTROS (Datos Clínicos Encriptados)
-- Almacena los registros que se llenan en la app.
CREATE TABLE IF NOT EXISTS public.autorregistros (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  data jsonb NOT NULL, -- Almacenará { encrypted_data: "Base64..." }
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. SEGURIDAD DE NIVEL DE FILA (RLS)
-- Crucial para privacidad clínica. Solo el dueño ve sus datos.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autorregistros ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE ACCESO (PROTECCIÓN DE DATOS)
-- Solo el usuario autenticado con su UID correspondiente puede acceder.

-- Perfiles
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON public.profiles;
CREATE POLICY "Los usuarios pueden ver su propio perfil" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Autorregistros
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios registros" ON public.autorregistros;
CREATE POLICY "Los usuarios pueden ver sus propios registros" ON public.autorregistros 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Los usuarios pueden insertar sus propios registros" ON public.autorregistros;
CREATE POLICY "Los usuarios pueden insertar sus propios registros" ON public.autorregistros 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Los usuarios pueden borrar sus propios registros" ON public.autorregistros;
CREATE POLICY "Los usuarios pueden borrar sus propios registros" ON public.autorregistros 
  FOR DELETE USING (auth.uid() = user_id);

-- 5. FUNCIÓN Y DISPARADOR (Trigger) PARA CREACIÓN AUTOMÁTICA DE PERFIL
-- Crea una entrada en public.profiles cada vez que alguien se registra en Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- COMENTARIOS DE AYUDA
COMMENT ON TABLE public.autorregistros IS 'Tabla segura para autorregistros clínicos con cifrado de cliente.';
COMMENT ON TABLE public.profiles IS 'Perfiles públicos de usuario vinculados a Supabase Auth.';
