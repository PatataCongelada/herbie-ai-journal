import { useState } from "react";
import { ArrowLeft, Check, Mic, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    emotion: "",
    intensity: 5,
    conduct: "",
    situation: "",
    thoughts: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.emotion.trim()) {
      toast.error("Ingresa una emoción");
      return;
    }
    toast.success("Registro guardado correctamente");
    setForm({ emotion: "", intensity: 5, conduct: "", situation: "", thoughts: "" });
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
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Nuevo Autorregistro</h1>
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
            O registro manual
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

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-secondary text-secondary-foreground rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Check className="w-4 h-4" />
          Guardar Registro
        </button>
      </motion.form>
    </div>
  );
};

export default RegisterPage;
