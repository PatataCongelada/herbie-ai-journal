import { useState, useRef, useEffect } from "react";
import { Brain, ArrowLeft, EyeOff, Sparkles, Loader2, Save, Wand2, Crosshair, ChevronRight, ChevronLeft, BarChart3, PenSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import ToolRecordsView from "@/components/clinical/ToolRecordsView";
import ToolAssistantBot from "@/components/clinical/ToolAssistantBot";

type ViewMode = "hub" | "history" | "guided";

const CovertPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>("hub");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [planData, setPlanData] = useState({
    title: "",
    objectives: "",
    technique: "",
    stimuli: "",
    procedure: ""
  });

  const handleGenerateFull = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/clinical-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [{ role: "user", content: t('covert.generate_prompt') }],
          category: "teoria",
          expert: "all",
          source: "Covert_Conditioning_Handbook.pdf"
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.text || "Error");

      const jsonStr = data.text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(jsonStr);
      
      setPlanData({
        title: parsed.title || "",
        objectives: parsed.objectives || "",
        technique: parsed.technique || "",
        stimuli: parsed.stimuli || "",
        procedure: parsed.procedure || ""
      });
      
      toast.success(t('reg.extract_success'));
      setStep(4); // Ir al final para revisión
    } catch (error) {
      toast.error(t('reg.extract_error'));
    } finally {
      setIsLoading(false);
    }
  };

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
        plan: "covert",
        ...planData,
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
      console.error("Error saving plan:", error);
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
        <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-500 flex items-center justify-center shadow-2xl shadow-indigo-500/20 mx-auto mb-6">
          <EyeOff className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">{t('plan.covert')}</h1>
        <p className="text-sm text-muted-foreground">{t('plan.covert_desc')}</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => setViewMode("guided")}
          className="group relative p-6 bg-card border border-border/50 rounded-[2rem] text-left hover:bg-muted/30 transition-all shadow-sm overflow-hidden"
        >
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl herbie-gradient flex items-center justify-center text-white">
              <PenSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{t('hub.choice_guided')}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t('hub.guided_desc')}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </button>

        <button 
          onClick={() => setViewMode("history")}
          className="group relative p-6 bg-card border border-border/50 rounded-[2rem] text-left hover:bg-muted/30 transition-all shadow-sm overflow-hidden"
        >
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{t('hub.choice_records')}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t('hub.records_desc')}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
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
                s === step ? "w-8 bg-indigo-500" : s < step ? "w-4 bg-indigo-500/40" : "w-4 bg-muted"
              }`} 
            />
          ))}
        </div>
        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{t(`guided.step_${step}`)}</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pt-6 pb-40 px-6 max-w-2xl mx-auto w-full space-y-8">
        {/* Herbie's Interactive Bot */}
        <ToolAssistantBot 
          toolId={t('plan.covert')}
          source="Covert_Conditioning_Handbook.pdf"
          currentStep={step}
          stepName={t(`guided.step_${step}`)}
          color="indigo"
        />

        {/* Input Fields based on step */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="space-y-6"
        >
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary px-1">{t('covert.field_title')}</label>
                <input 
                  type="text" 
                  value={planData.title}
                  onChange={(e) => setPlanData({...planData, title: e.target.value})}
                  className="w-full bg-card border border-border/50 rounded-2xl px-4 h-14 text-lg font-bold outline-none shadow-sm focus:ring-2 ring-indigo-500/20"
                />
              </div>
              <button 
                onClick={handleGenerateFull}
                className="w-full h-14 rounded-2xl border-2 border-dashed border-indigo-500/30 text-indigo-500 flex items-center justify-center gap-2 hover:bg-indigo-500/5 transition-all text-sm font-bold active:scale-95"
              >
                <Wand2 className="w-5 h-5" />
                {t('covert.generate_basic')}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary px-1">{t('covert.field_objectives')}</label>
              <textarea 
                value={planData.objectives}
                onChange={(e) => setPlanData({...planData, objectives: e.target.value})}
                className="w-full bg-card border border-border/50 rounded-2xl p-4 min-h-[200px] text-sm outline-none shadow-sm focus:ring-2 ring-indigo-500/20 resize-none"
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary px-1">{t('covert.field_technique')}</label>
                <textarea 
                  value={planData.technique}
                  onChange={(e) => setPlanData({...planData, technique: e.target.value})}
                  className="w-full bg-card border border-border/50 rounded-2xl p-4 min-h-[120px] text-sm outline-none shadow-sm focus:ring-2 ring-indigo-500/20 resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 px-1">{t('covert.field_stimuli')}</label>
                <textarea 
                  value={planData.stimuli}
                  onChange={(e) => setPlanData({...planData, stimuli: e.target.value})}
                  className="w-full bg-card border border-border/50 rounded-2xl p-4 min-h-[120px] text-sm outline-none shadow-sm focus:ring-2 ring-indigo-500/20 resize-none"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary px-1">{t('covert.field_procedure')}</label>
              <textarea 
                value={planData.procedure}
                onChange={(e) => setPlanData({...planData, procedure: e.target.value})}
                className="w-full bg-card border border-border/50 rounded-2xl p-4 min-h-[300px] text-sm outline-none shadow-sm focus:ring-2 ring-indigo-500/20 resize-none"
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* Navigation Buttons */}
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
          className="pointer-events-auto flex-1 herbie-gradient text-white h-16 rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center gap-3 font-black uppercase tracking-widest active:scale-95"
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

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-md flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl herbie-gradient flex items-center justify-center animate-bounce shadow-2xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm font-black text-foreground uppercase tracking-widest">{t('aba.thinking')}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="flex flex-col h-dvh bg-background">
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
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <EyeOff className="w-4 h-4 text-indigo-600" />
            </div>
            <h1 className="text-xs font-black text-foreground uppercase tracking-wider">
              {viewMode === "hub" ? t('plan.covert') : t('hub.back_to_hub')}
            </h1>
          </div>
        </div>
      </div>

      {viewMode === "hub" && renderHub()}
      {viewMode === "history" && (
        <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full no-scrollbar pb-32">
          <h2 className="text-sm font-black text-foreground uppercase tracking-widest mb-6 px-1">{t('hub.choice_records')}</h2>
          <ToolRecordsView toolId="covert" />
        </div>
      )}
      {viewMode === "guided" && renderGuided()}
    </div>
  );
};

export default CovertPage;

