import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
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

  return (
    <div className="px-4 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Nuevo Autorregistro</h1>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
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
