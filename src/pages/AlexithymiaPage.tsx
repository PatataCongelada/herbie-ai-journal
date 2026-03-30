import { useState, useRef, useEffect } from "react";
import { Heart, ArrowLeft, Send, Loader2, Sparkles, AlertCircle, MessageSquare, BarChart3, ChevronRight, ChevronLeft, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import ToolRecordsView from "@/components/clinical/ToolRecordsView";

type ViewMode = "hub" | "history" | "guided";

const AlexithymiaPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>("hub");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuiding, setIsGuiding] = useState(false);
  const [guideText, setGuideText] = useState("");
  
  const [alexData, setAlexData] = useState({
    sensation: "",
    situation: "",
    intensity: "5",
    label: ""
  });

  const getGuide = async (currentStep: number) => {
    setIsGuiding(true);
    setGuideText("");
    
    const steps = ["sensation", "situation", "intensity", "label"];
    const prompt = `${t('alex.guide_prompt')} ${steps[currentStep-1]}.`;

    try {
      const response = await fetch("/api/clinical-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [{ role: "user", content: prompt }],
          category: "practica",
          expert: "all",
          source: [
            "Tratamiento-basado-ABA.Guia-de-practica-clinica.pdf",
            "modificacion de conducta que es y como aplicarla.pdf"
          ]
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setGuideText(data.text);
      }
    } catch (error) {
      console.error("Error fetching guide:", error);
    } finally {
      setIsGuiding(false);
    }
  };

  useEffect(() => {
    if (viewMode === "guided") {
      getGuide(step);
    }
  }, [viewMode, step]);

  const { user, encryptionKey } = useAuth();

  const handleSave = async () => {
    if (!user || !encryptionKey) {
        toast.error(t('reg.save_error'));
        return;
    }

    setIsLoading(true);
    try {
      const { encryptData } = await import("@/lib/crypto");
      
      const recordData = {
        plan: "alexithymia",
        emotion: alexData.label || "Identificación Alexitimia",
        intensity: alexData.intensity,
        sensation: alexData.sensation,
        situation: alexData.situation,
        recorded_at: new Date().toISOString()
      };

      const encrypted = await encryptData(recordData, encryptionKey);

      const { error } = await supabase
        .from('autorregistros')
        .insert({
          user_id: user.id,
          data: { encrypted_data: encrypted }
        });

      if (error) throw error;

      toast.success(t('reg.save_success'));
      setViewMode("hub");
    } catch (error) {
      console.error("Error saving alex:", error);
      toast.error(t('reg.save_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderHub = () => (
    <div className="flex-1 p-6 flex flex-col gap-6 max-w-2xl mx-auto w-full pt-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2 mb-8"
      >
        <div className="w-20 h-20 rounded-[2.5rem] bg-rose-500 flex items-center justify-center shadow-2xl shadow-rose-500/20 mx-auto mb-6">
          <Heart className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">{t('alex.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('alex.subtitle')}</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => setViewMode("guided")}
          className="group relative p-6 bg-card border border-border/50 rounded-[2rem] text-left hover:bg-rose-500/5 transition-all shadow-sm overflow-hidden"
        >
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{t('hub.choice_guided')}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t('hub.guided_desc')}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
        </button>

        <button 
          onClick={() => setViewMode("history")}
          className="group relative p-6 bg-card border border-border/50 rounded-[2rem] text-left hover:bg-muted/30 transition-all shadow-sm overflow-hidden"
        >
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{t('hub.choice_records')}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t('hub.records_desc')}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
        </button>
      </div>
    </div>
  );

  const renderGuided = () => (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
        {/* Stepper Header */}
        <div className="px-6 py-4 border-b border-border bg-card/30 backdrop-blur-md flex items-center justify-between">
            <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((s) => (
                <div 
                key={s} 
                className={`h-1 rounded-full transition-all duration-500 ${
                    s === step ? "w-8 bg-rose-500" : s < step ? "w-4 bg-rose-500/40" : "w-4 bg-muted"
                }`} 
                />
            ))}
            </div>
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">{t(`alex.step_${step}`)}</span>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pt-6 pb-40 px-6 max-w-2xl mx-auto w-full space-y-8">
            {/* Guide Card */}
            <AnimatePresence mode="wait">
                <motion.div 
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-[2rem] space-y-3 relative"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-rose-500 flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-rose-500">{t('guided.ai_guide')}</label>
                    </div>
                    {isGuiding ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse py-2">
                            <Loader2 className="w-3 h-3 animate-spin" /> {t('aba.thinking')}
                        </div>
                    ) : (
                        <p className="text-xs text-rose-600/80 leading-relaxed font-semibold italic italic">
                            {guideText}
                        </p>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Step Content */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {step === 1 && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-rose-500 px-1">{t('alex.step_1')}</label>
                        <textarea 
                            value={alexData.sensation}
                            onChange={(e) => setAlexData({...alexData, sensation: e.target.value})}
                            placeholder="Ej: Siento un nudo en el pecho o tensión en los brazos..."
                            className="w-full bg-card border border-border/50 rounded-2xl p-4 min-h-[150px] text-sm outline-none shadow-sm focus:ring-2 ring-rose-500/20 resize-none"
                        />
                    </div>
                )}
                {step === 2 && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-rose-500 px-1">{t('alex.step_2')}</label>
                        <textarea 
                            value={alexData.situation}
                            onChange={(e) => setAlexData({...alexData, situation: e.target.value})}
                            placeholder="¿Qué estaba pasando justo antes? ¿Dónde estabas?"
                            className="w-full bg-card border border-border/50 rounded-2xl p-4 min-h-[150px] text-sm outline-none shadow-sm focus:ring-2 ring-rose-500/20 resize-none"
                        />
                    </div>
                )}
                {step === 3 && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-rose-500 px-1">{t('alex.step_3')}</label>
                        <div className="flex flex-col items-center gap-6 py-8">
                            <span className="text-6xl font-black text-rose-500">{alexData.intensity}</span>
                            <input 
                                type="range" 
                                min="1" 
                                max="10" 
                                value={alexData.intensity}
                                onChange={(e) => setAlexData({...alexData, intensity: e.target.value})}
                                className="w-full max-w-sm h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-rose-500"
                            />
                        </div>
                    </div>
                )}
                {step === 4 && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-rose-500 px-1">{t('alex.step_4')}</label>
                        <textarea 
                            value={alexData.label}
                            onChange={(e) => setAlexData({...alexData, label: e.target.value})}
                            placeholder="Según la guía de Herbie... ¿Qué nombre le pondrías ahora a esta emoción?"
                            className="w-full bg-card border border-border/50 rounded-2xl p-4 min-h-[150px] text-sm outline-none shadow-sm focus:ring-2 ring-rose-500/20 resize-none"
                        />
                    </div>
                )}
            </motion.div>
        </div>

        {/* Buttons */}
        <div className="fixed bottom-8 left-0 right-0 px-6 max-w-2xl mx-auto flex gap-4 pointer-events-none">
            {step > 1 && (
                <button 
                    onClick={() => setStep(s => s - 1)}
                    className="pointer-events-auto h-16 w-16 bg-card border border-border rounded-2xl shadow-xl flex items-center justify-center text-foreground active:scale-95"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
            )}
            <button 
                onClick={() => step < 4 ? setStep(s => s + 1) : handleSave()}
                className="pointer-events-auto flex-1 bg-rose-500 text-white h-16 rounded-2xl shadow-xl shadow-rose-500/30 flex items-center justify-center gap-3 font-black uppercase tracking-widest active:scale-95"
            >
                {step < 4 ? (
                    <>
                    {t('guided.next')}
                    <ChevronRight className="w-6 h-6" />
                    </>
                ) : (
                    <>
                    <Save className="w-6 h-6" />
                    {t('guided.finish')}
                    </>
                )}
            </button>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between sticky top-0 z-50 overflow-hidden">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => viewMode === "hub" ? navigate(-1) : setViewMode("hub")} 
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <Heart className="w-4 h-4 text-rose-500" />
            </div>
            <h1 className="text-xs font-black text-foreground uppercase tracking-wider">
              {viewMode === "hub" ? t('alex.title') : t('hub.back_to_hub')}
            </h1>
          </div>
        </div>
      </div>

      {viewMode === "hub" && renderHub()}
      {viewMode === "history" && (
        <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full no-scrollbar pb-32">
          <h2 className="text-sm font-black text-foreground uppercase tracking-widest mb-6 px-1">{t('hub.choice_records')}</h2>
          <ToolRecordsView toolId="alexithymia" />
        </div>
      )}
      {viewMode === "guided" && renderGuided()}
    </div>
  );
};

export default AlexithymiaPage;

