import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BrainCircuit, Sparkles, Target, Zap, Microscope } from "lucide-react";

const ABAPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-4 pt-6 pb-20 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Cerebro Experto ABA</h1>
      </div>

      {/* Hero / Coming Soon Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="herbie-gradient rounded-3xl p-8 text-white relative overflow-hidden"
      >
        <div className="relative z-10 space-y-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
            <BrainCircuit className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black leading-tight">Análisis Funcional Inteligente</h2>
            <p className="text-white/80 text-sm">Próximamente: El cerebro experto de Herbie analizará tus contingencias en tiempo real.</p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3" /> Fase de Entrenamiento
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      </motion.div>

      {/* ABC Model Teaser */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Modelo ABC (AFC)</h3>
        <div className="grid gap-3">
          {[
            { 
              step: "A", 
              title: "Antecedente", 
              desc: "¿Qué disparó la conducta?", 
              icon: Target,
              color: "text-blue-500 bg-blue-500/10" 
            },
            { 
              step: "B", 
              title: "Behavior (Conducta)", 
              desc: "¿Qué hiciste exactamente?", 
              icon: Zap,
              color: "text-amber-500 bg-amber-500/10" 
            },
            { 
              step: "C", 
              title: "Consecuente", 
              desc: "¿Qué se mantuvo o cambió?", 
              icon: Microscope,
              color: "text-emerald-500 bg-emerald-500/10" 
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
              className="herbie-card p-4 flex items-center gap-4 border-muted/50"
            >
              <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 font-black text-lg ${item.color}`}>
                <span className="text-[10px] opacity-60 leading-none">{item.step}</span>
                {item.title[0]}
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Information Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-2xl border-2 border-dashed border-muted text-center space-y-2"
      >
        <p className="text-sm font-medium text-foreground">Estamos entrenando a la IA</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          El análisis funcional de la conducta requiere una precisión clínica extrema. Muy pronto Herbie podrá desglosar tus registros en contingencias funcionales automáticas.
        </p>
      </motion.div>
    </div>
  );
};

export default ABAPage;
