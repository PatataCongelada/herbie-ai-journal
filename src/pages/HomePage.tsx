import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, BrainCircuit } from "lucide-react";
import { useState, useEffect } from "react";

const ABA_QUOTES = [
  "Toda conducta es un mensaje sin palabras.",
  "El ambiente no te define, pero te da las cartas.",
  "Mide lo que te importa. Lo que no se mide, se olvida.",
  "El cambio ocurre fragmento a fragmento.",
];

const HomePage = () => {
  const navigate = useNavigate();
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % ABA_QUOTES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-12">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] herbie-gradient shadow-2xl shadow-primary/40 relative group">
            <Sparkles className="w-12 h-12 text-white animate-pulse" />
            <div className="absolute inset-0 rounded-[2.5rem] bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-foreground">
              HERBIE
            </h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold">
              AI Journal & Clinical Assistant
            </p>
          </div>
        </motion.div>

        {/* Dynamic Quote */}
        <div className="h-8">
           <motion.p
              key={quoteIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs italic text-muted-foreground/60 max-w-[240px]"
            >
              "{ABA_QUOTES[quoteIndex]}"
            </motion.p>
        </div>

        {/* Main CTA: PLANES */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-xs space-y-4"
        >
          <button
            onClick={() => navigate("/plans")}
            className="w-full group relative overflow-hidden h-20 herbie-gradient text-white rounded-[2rem] shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-center gap-4">
              <span className="text-xl font-black uppercase tracking-widest">Planes</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => navigate("/aba")}
            className="w-full h-14 bg-card border border-border/50 text-card-foreground rounded-2xl flex items-center justify-center gap-3 text-sm font-bold hover:bg-muted transition-colors"
          >
            <BrainCircuit className="w-5 h-5 text-primary" />
            Cerebro Experto ABA
          </button>
        </motion.div>
      </div>

      {/* Footer Branding */}
      <div className="p-8 text-center opacity-30 text-[10px] font-bold tracking-widest grayscale">
        H.E.R.B.I.E. SYSTEM V2.5
      </div>
    </div>
  );
};

export default HomePage;
