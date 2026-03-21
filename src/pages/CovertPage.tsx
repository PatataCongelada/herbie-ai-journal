import { useState } from "react";
import { Brain, ArrowLeft, EyeOff, Sparkles, Loader2, Save, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";

const CovertPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [planData, setPlanData] = useState({
    title: "",
    objectives: "",
    technique: "",
    stimuli: "",
    procedure: ""
  });

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/clinical-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [{ role: "user", content: t('covert.generate_prompt') }],
          category: "all",
          expert: "Cautela",
          source: "Covert_Conditioning_Handbook.pdf"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.text || "Error en la respuesta");
      }

      // Limpiar y parsear JSON de la respuesta de la IA
      const jsonStr = data.text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(jsonStr);
      
      setPlanData({
        title: parsed.title || "",
        objectives: parsed.objectives || "",
        technique: parsed.technique || "",
        stimuli: parsed.stimuli || "",
        procedure: parsed.procedure || ""
      });
      
      toast.success(t('reg.extract_success') || "Plan generado con éxito");
    } catch (error: any) {
      console.error("Error generating plan:", error);
      toast.error(t('reg.extract_error') || "No se pudo generar el plan automático");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    toast.success(t('reg.save_success'));
    // En un futuro esto se guardaría en Supabase
  };

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2 text-left">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <EyeOff className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-foreground uppercase tracking-wider leading-none">
                {t('plan.covert')}
              </h1>
              <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-tighter opacity-70">
                Editor Clínico V1.0
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={handleSave}
          className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
        >
          <Save className="w-5 h-5" />
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-32">
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="bg-card p-8 rounded-[2.5rem] shadow-2xl border border-border flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl herbie-gradient flex items-center justify-center animate-bounce">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">Herbie está analizando Cautela...</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 italic">Redactando plan clínico</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Title Field */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-primary px-1">
              {t('covert.field_title')}
            </label>
            <input 
              type="text"
              value={planData.title}
              onChange={(e) => setPlanData({...planData, title: e.target.value})}
              placeholder="Ej: Plan de Sensibilización para Tabaquismo"
              className="w-full bg-card border border-border/50 rounded-2xl px-4 h-14 text-lg font-bold focus:ring-2 ring-indigo-500/20 outline-none transition-all shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Objectives */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 px-1">
                {t('covert.field_objectives')}
              </label>
              <textarea 
                value={planData.objectives}
                onChange={(e) => setPlanData({...planData, objectives: e.target.value})}
                placeholder="Describe los objetivos de la intervención..."
                className="w-full bg-card border border-border/50 rounded-2xl p-4 min-h-[120px] text-sm focus:ring-2 ring-indigo-500/20 outline-none transition-all shadow-sm resize-none"
              />
            </div>

            {/* Technique */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 px-1">
                {t('covert.field_technique')}
              </label>
              <textarea 
                value={planData.technique}
                onChange={(e) => setPlanData({...planData, technique: e.target.value})}
                placeholder="Técnica sugerida por el manual de Cautela..."
                className="w-full bg-card border border-border/50 rounded-2xl p-4 min-h-[120px] text-sm focus:ring-2 ring-indigo-500/20 outline-none transition-all shadow-sm resize-none"
              />
            </div>
          </div>

          {/* Stimuli */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 px-1 flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              {t('covert.field_stimuli')}
            </label>
            <textarea 
              value={planData.stimuli}
              onChange={(e) => setPlanData({...planData, stimuli: e.target.value})}
              placeholder="Identifica los estímulos aversivos o reforzadores imaginarios..."
              className="w-full bg-card border border-border/50 rounded-2xl p-4 min-h-[120px] text-sm focus:ring-2 ring-indigo-500/20 outline-none transition-all shadow-sm resize-none"
            />
          </div>

          {/* Procedure */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 px-1 flex items-center gap-2">
              <Target className="w-3 h-3" />
              {t('covert.field_procedure')}
            </label>
            <textarea 
              value={planData.procedure}
              onChange={(e) => setPlanData({...planData, procedure: e.target.value})}
              placeholder="Guía paso a paso de la sesión imaginaria..."
              className="w-full bg-card border border-border/50 rounded-2xl p-4 min-h-[200px] text-sm focus:ring-2 ring-indigo-500/20 outline-none transition-all shadow-sm resize-none"
            />
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 left-0 right-0 px-6 max-w-2xl mx-auto flex justify-center pointer-events-none">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="pointer-events-auto herbie-gradient text-white h-16 px-8 rounded-[2rem] shadow-2xl shadow-primary/40 flex items-center justify-center gap-3 active:scale-95 transition-all text-sm font-black uppercase tracking-widest group"
        >
          <Wand2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          {t('covert.generate_basic')}
        </button>
      </div>
    </div>
  );
};

export default CovertPage;
