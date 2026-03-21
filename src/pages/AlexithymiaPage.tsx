import { Heart, ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

const AlexithymiaPage = () => {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2 text-left">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-foreground uppercase tracking-wider leading-none">
                {t('plan.alexithymia')}
              </h1>
              <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-tighter opacity-70">
                {lang === 'es' ? 'Identificación Emocional' : 'Emotional Identification'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Placeholder */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="w-32 h-32 rounded-[3rem] bg-rose-500/5 flex items-center justify-center">
            <Heart className="w-16 h-16 text-rose-500 opacity-20" />
          </div>
          <Sparkles className="w-8 h-8 text-rose-500 absolute -top-2 -right-2 animate-pulse" />
        </motion.div>

        <div className="space-y-4 max-w-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            Fase Beta
          </div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">
            {lang === 'es' ? 'Próximamente' : 'Coming Soon'}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed italic">
            {lang === 'es' 
              ? "Herbie está aprendiendo a identificar y describir los matices de la experiencia emocional interna. Pronto estará listo para ayudarte con este plan."
              : "Herbie is learning to identify and describe the nuances of internal emotional experience. Soon he'll be ready to help you with this plan."}
          </p>
        </div>

        <button 
          onClick={() => navigate('/plans')}
          className="px-8 h-12 rounded-2xl bg-muted font-bold text-sm hover:bg-muted/80 transition-colors"
        >
          {lang === 'es' ? 'Volver a Planes' : 'Back to Plans'}
        </button>
      </div>
    </div>
  );
};

export default AlexithymiaPage;
