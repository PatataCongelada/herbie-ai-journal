import { ArrowLeft, Check, Mic, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { planId } = useParams();
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [smartText, setSmartText] = useState("");
  const [form, setForm] = useState({
    emotion: "",
    intensity: 5,
    conduct: "",
    situation: "",
    thoughts: "",
    phase: "intervencion", // Default phase
  });

  const handleSmartFill = async () => {
    if (!smartText.trim()) return;
    setIsExtracting(true);
    try {
      const response = await fetch('/api/extract-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: smartText })
      });
      if (!response.ok) throw new Error("Error extrayendo datos");
      const data = await response.json();
      
      setForm(prev => ({
        ...prev,
        emotion: data.emotion || prev.emotion,
        intensity: data.intensity || prev.intensity,
        conduct: data.conduct || prev.conduct,
        situation: data.situation || prev.situation,
        thoughts: data.thoughts || prev.thoughts,
      }));
      
      toast.success("Campos extraídos correctamente");
      setSmartText("");
    } catch (error) {
      console.error("Error en Smart Fill:", error);
      toast.error("No he podido extraer los datos. Intenta ser más descriptivo.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.emotion.trim()) {
      toast.error("Ingresa una emoción");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('autorregistros')
        .insert([
          { 
            data: { 
              ...form, 
              plan: planId || 'general',
              recorded_at: new Date().toISOString()
            } 
          }
        ]);

      if (error) throw error;

      toast.success("Registro guardado correctamente");
      navigate(`/dashboard/${planId}`);
    } catch (error: any) {
      console.error("Error al guardar:", error);
      toast.error("Error al guardar el registro");
    } finally {
      setIsSaving(false);
    }
  };

  const intensityColor =
    form.intensity >= 7
      ? "text-destructive"
      : form.intensity >= 4
      ? "text-[hsl(45,93%,47%)]"
      : "text-secondary";

  const handleTelegramConnect = () => {
    // Redirige al bot de Telegram real
    window.open("https://t.me/Autorregistro_bot", "_blank");
  };

  return (
    <div className="px-4 pt-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/dashboard/${planId}`)} className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground capitalize">Registro: {planId}</h1>
      </div>

      {/* Telegram Voice Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mb-8"
      >
        <div className="rounded-2xl bg-gradient-to-br from-[#2AABEE]/10 to-[#229ED9]/5 border border-[#2AABEE]/20 p-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#2AABEE]/10 rounded-full blur-2xl" />
          
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-[#2AABEE]/10 flex items-center justify-center shrink-0">
              <Mic className="w-5 h-5 text-[#2AABEE]" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                Registro por Voz
                <span className="text-[10px] uppercase tracking-wider bg-[#2AABEE]/10 text-[#2AABEE] px-2 py-0.5 rounded-full font-medium">
                  Nuevo
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Habla con Herbie en Telegram y él registrará tus emociones automáticamente.
              </p>
              
              <button
                onClick={handleTelegramConnect}
                className="w-full bg-[#2AABEE] hover:bg-[#229ED9] text-white text-xs font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm shadow-[#2AABEE]/20"
              >
                Conectar con Telegram
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-8 mb-4">
          <div className="h-px bg-border flex-1" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            O auto-llenado inteligente
          </span>
          <div className="h-px bg-border flex-1" />
        </div>

        {/* Smart Fill Input */}
        <div className="space-y-3 bg-muted/30 p-4 rounded-2xl border border-muted/50">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground">Auto-llenado Herbie</span>
          </div>
          <textarea
            value={smartText}
            onChange={(e) => setSmartText(e.target.value)}
            placeholder="Ej: Ayer estaba en el metro y me dio mucha ansiedad (8) porque había gente gritando. Me bajé antes de tiempo."
            rows={3}
            className="w-full bg-background/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none border border-muted/20"
          />
          <button
            type="button"
            onClick={handleSmartFill}
            disabled={isExtracting || !smartText.trim()}
            className="w-full py-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isExtracting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Extraer Datos Automáticamente
          </button>
        </div>

        <div className="flex items-center gap-4 mt-8 mb-4">
          <div className="h-px bg-border flex-1" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            O revisión manual
          </span>
          <div className="h-px bg-border flex-1" />
        </div>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* Emotion */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Emoción</label>
          <input
            type="text"
            value={form.emotion}
            onChange={(e) => setForm({ ...form, emotion: e.target.value })}
            placeholder="Ej: Ansiedad, tristeza, ira..."
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Intensity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Intensidad</label>
            <span className={`text-2xl font-bold ${intensityColor} transition-colors`}>{form.intensity}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={form.intensity}
            onChange={(e) => setForm({ ...form, intensity: Number(e.target.value) })}
            className="w-full accent-primary h-2 rounded-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Baja</span>
            <span>Media</span>
            <span>Alta</span>
          </div>
        </div>

        {/* Conduct */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Conducta</label>
          <input
            type="text"
            value={form.conduct}
            onChange={(e) => setForm({ ...form, conduct: e.target.value })}
            placeholder="Ej: Evitación, exposición, aislamiento..."
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Situation */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Situación</label>
          <input
            type="text"
            value={form.situation}
            onChange={(e) => setForm({ ...form, situation: e.target.value })}
            placeholder="¿Dónde estabas? ¿Qué ocurrió?"
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Thoughts */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pensamientos</label>
          <textarea
            value={form.thoughts}
            onChange={(e) => setForm({ ...form, thoughts: e.target.value })}
            placeholder="¿Qué pensabas en ese momento?"
            rows={3}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Clinical Phase */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-black text-primary uppercase tracking-widest pl-1">Fase Clínica</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'pre', label: 'PRE', color: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800' },
              { id: 'intervencion', label: 'INTER', color: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800' },
              { id: 'post', label: 'POST', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setForm({ ...form, phase: p.id })}
                className={`py-2 px-3 rounded-xl text-[10px] font-black border transition-all ${
                  form.phase === p.id 
                    ? p.color + " ring-2 ring-current ring-offset-2 ring-offset-background scale-95" 
                    : "bg-muted/50 text-muted-foreground border-transparent grayscale opacity-70 hover:opacity-100 hover:grayscale-0"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground italic px-1">
            {form.phase === 'pre' && "Línea base: Comportamiento natural sin intervención."}
            {form.phase === 'intervencion' && "Tratamiento activo: Aplicando nuevas contingencias."}
            {form.phase === 'post' && "Seguimiento: Evaluación tras retirar el refuerzo directo."}
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-secondary text-secondary-foreground rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Guardar Registro
        </button>
      </motion.form>
    </div>
  );
};

export default RegisterPage;
