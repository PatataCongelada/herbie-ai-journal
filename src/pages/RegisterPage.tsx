import { ArrowLeft, Check, Mic, ExternalLink, Loader2, Sparkles, Brain } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import activacionSpec from "@/data/activacion-spec.json";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { planId } = useParams();
  const { t } = useLanguage();
  const { encryptionKey, user } = useAuth();
  
  const isActivacion = planId === 'activacion';
  const spec = isActivacion ? (activacionSpec as any) : null;

  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [smartText, setSmartText] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  
  const [form, setForm] = useState<Record<string, any>>({
    emotion: "",
    intensity: 5,
    conduct: "",
    situation: "",
    thoughts: "",
    phase: "intervencion", 
  });

  // Effects to handle scrolling to top on step change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

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
      
      toast.success(t('reg.extract_success'));
      setSmartText("");
    } catch (error) {
      console.error("Error en Smart Fill:", error);
      toast.error(t('reg.extract_error'));
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Basic validation for general tool
    if (!isActivacion && !form.emotion.trim()) {
      toast.error(t('reg.emotion_error'));
      return;
    }

    if (!encryptionKey) {
      toast.error(t('sec.decrypt_error'));
      return;
    }

    setIsSaving(true);
    try {
      const rawData = { 
        ...form, 
        plan: planId || 'general',
        recorded_at: new Date().toISOString(),
        is_structured: isActivacion
      };

      const { encryptData } = await import("@/lib/crypto");
      const encryptedBlob = await encryptData(rawData, encryptionKey);

      const { error } = await supabase
        .from('autorregistros')
        .insert([
          { 
            user_id: user?.id,
            data: { 
              encrypted_data: encryptedBlob
            } 
          }
        ]);

      if (error) throw error;

      toast.success(t('reg.save_success'));
      navigate(`/dashboard/${planId}`);
    } catch (error: any) {
      console.error("Error al guardar:", error);
      toast.error(t('reg.save_error'));
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
    window.open("https://t.me/Autorregistro_bot", "_blank");
  };

  if (isActivacion && spec) {
    const step = spec.steps[currentStep];
    return (
      <div className="px-4 pt-4 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(`/dashboard/${planId}`)} className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground capitalize">{spec.name}</h1>
        </div>

        <div className="space-y-6">
          <div className="flex gap-1">
            {spec.steps.map((_: any, idx: number) => (
              <div 
                key={idx} 
                className={`h-1 flex-1 rounded-full transition-all ${
                  idx <= currentStep ? "bg-primary" : "bg-muted"
                }`} 
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-black">
                    {step.step_number}
                  </span>
                  <h2 className="text-sm font-black uppercase tracking-tight text-foreground">
                    {step.name}
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Herbie's Feedback</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed italic">
                  "{step.bot_guidance}"
                </p>
              </div>

              <div className="space-y-4">
                {step.fields.map((field: any) => (
                  <div key={field.name} className="space-y-2">
                    <label className="text-xs font-bold text-foreground">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {field.type === 'textarea' && (
                      <textarea
                        value={form[field.name] || ""}
                        onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none min-h-[120px] transition-all border border-transparent focus:border-primary/20"
                      />
                    )}

                    {field.type === 'text' && (
                      <input
                        type="text"
                        value={form[field.name] || ""}
                        onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none transition-all border border-transparent focus:border-primary/20"
                      />
                    )}

                    {field.type === 'slider' && (
                      <div className="space-y-3 p-4 bg-muted/30 rounded-xl">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-muted-foreground">{field.min}</span>
                          <span className="text-2xl font-black text-primary">{form[field.name] || 50}</span>
                          <span className="text-[10px] text-muted-foreground">{field.max}</span>
                        </div>
                        <input
                          type="range"
                          min={field.min}
                          max={field.max}
                          value={form[field.name] || 50}
                          onChange={(e) => setForm({ ...form, [field.name]: Number(e.target.value) })}
                          className="w-full accent-primary h-2 rounded-full cursor-pointer"
                        />
                      </div>
                    )}

                    {field.type === 'radio' && (
                      <div className="flex flex-col gap-2">
                        {field.options?.map((opt: string) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setForm({ ...form, [field.name]: opt })}
                            className={`w-full text-left p-4 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                              form[field.name] === opt 
                                ? "bg-primary/10 border-primary text-primary" 
                                : "bg-muted/30 border-transparent hover:bg-muted"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {field.type === 'checkbox' && (
                      <div className="grid grid-cols-1 gap-2">
                        {field.options?.map((opt: string) => {
                          const currentVal = form[field.name] || [];
                          const isChecked = currentVal.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                const newVal = isChecked 
                                  ? currentVal.filter((v: string) => v !== opt)
                                  : [...currentVal, opt];
                                setForm({ ...form, [field.name]: newVal });
                              }}
                              className={`w-full text-left p-4 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                                isChecked 
                                  ? "bg-primary/10 border-primary text-primary" 
                                  : "bg-muted/30 border-transparent hover:bg-muted"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {field.clinical_rationale && (
                      <p className="text-[10px] text-muted-foreground italic px-1 flex items-start gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-primary shrink-0 mt-0.5" />
                        <span>{field.clinical_rationale}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3 pt-4">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="flex-1 py-4 bg-muted text-muted-foreground rounded-2xl text-xs font-black uppercase tracking-widest"
                  >
                    Previous
                  </button>
                )}
                {currentStep < spec.steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const currentFields = spec.steps[currentStep].fields;
                      const missing = currentFields.find((f: any) => f.required && (!form[f.name] || (Array.isArray(form[f.name]) && form[f.name].length === 0)));
                      if (missing) {
                        toast.error(`Required: ${missing.label}`);
                        return;
                      }
                      setCurrentStep(prev => prev + 1);
                    }}
                    className="flex-[2] py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={isSaving}
                    className="flex-[2] py-4 bg-secondary text-secondary-foreground rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-secondary/20 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Finish & Secure Store
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Fallback to general tool
  return (
    <div className="px-4 pt-4 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/dashboard/${planId}`)} className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground capitalize">{t('reg.title')}: {planId}</h1>
      </div>

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
                {t('reg.voice_title')}
                <span className="text-[10px] uppercase tracking-wider bg-[#2AABEE]/10 text-[#2AABEE] px-2 py-0.5 rounded-full font-medium">
                  {t('reg.voice_new')}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                {t('reg.voice_desc')}
              </p>
              <button
                onClick={handleTelegramConnect}
                className="w-full bg-[#2AABEE] hover:bg-[#229ED9] text-white text-xs font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm shadow-[#2AABEE]/20"
              >
                {t('reg.connect_telegram')}
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-8 mb-4">
          <div className="h-px bg-border flex-1" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('reg.smart_fill_divider')}
          </span>
          <div className="h-px bg-border flex-1" />
        </div>

        <div className="space-y-3 bg-muted/30 p-4 rounded-2xl border border-muted/50">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground">{t('reg.smart_fill_title')}</span>
          </div>
          <textarea
            value={smartText}
            onChange={(e) => setSmartText(e.target.value)}
            placeholder={t('reg.smart_fill_placeholder')}
            rows={3}
            className="w-full bg-background/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none border border-muted/20"
          />
          <button
            type="button"
            onClick={handleSmartFill}
            disabled={isExtracting || !smartText.trim()}
            className="w-full py-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isExtracting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {t('reg.smart_fill_btn')}
          </button>
        </div>

        <div className="flex items-center gap-4 mt-8 mb-4">
          <div className="h-px bg-border flex-1" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('reg.manual_revision')}
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
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('reg.emotion_label')}</label>
          <input
            type="text"
            value={form.emotion}
            onChange={(e) => setForm({ ...form, emotion: e.target.value })}
            placeholder={t('reg.emotion_placeholder')}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('reg.intensity_label')}</label>
            <span className={`text-2xl font-bold ${intensityColor}`}>{form.intensity}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={form.intensity}
            onChange={(e) => setForm({ ...form, intensity: Number(e.target.value) })}
            className="w-full accent-primary h-2 rounded-full"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('reg.conduct_label')}</label>
          <input
            type="text"
            value={form.conduct}
            onChange={(e) => setForm({ ...form, conduct: e.target.value })}
            placeholder={t('reg.conduct_placeholder')}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('reg.situation_label')}</label>
          <input
            type="text"
            value={form.situation}
            onChange={(e) => setForm({ ...form, situation: e.target.value })}
            placeholder={t('reg.situation_placeholder')}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('reg.thoughts_label')}</label>
          <textarea
            value={form.thoughts}
            onChange={(e) => setForm({ ...form, thoughts: e.target.value })}
            placeholder={t('reg.thoughts_placeholder')}
            rows={3}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-xs font-black text-primary uppercase tracking-widest pl-1">{t('reg.clinical_phase')}</label>
          <div className="grid grid-cols-3 gap-2">
            {['pre', 'intervencion', 'post'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setForm({ ...form, phase: p })}
                className={`py-2 px-3 rounded-xl text-[10px] font-black border transition-all ${
                  form.phase === p ? "bg-primary/10 border-primary text-primary" : "bg-muted/50 text-muted-foreground border-transparent"
                }`}
              >
                {t(`dash.phase_${p}`)}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-secondary text-secondary-foreground rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[0.98]"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {t('reg.save_btn')}
        </button>
      </motion.form>
    </div>
  );
};

export default RegisterPage;
