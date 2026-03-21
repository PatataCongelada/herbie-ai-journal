import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Brain, Sparkles, Zap, Moon, BrainCircuit, GraduationCap, Users, EyeOff } from "lucide-react";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

const ABA_QUOTES = {
  es: [
    "Toda conducta es un mensaje sin palabras, esperando ser leído con paciencia.",
    "El ambiente no te define, pero te da las cartas con las que juegas.",
    "Reforzar no es premiar: es encender una llama donde antes había oscuridad.",
    "Antes del cambio siempre hay un antecedente. Aprende a leerlo.",
    "Una consecuencia justa enseña lo que mil palabras no pueden.",
    "La extinción duele antes de liberar. Es el último grito de lo aprendido.",
    "Mide lo que te importa. Lo que no se mide, se olvida en silencio.",
    "El contexto no es el fondo del cuadro, es el pincel que lo pinta.",
    "Generalizar no es copiar: es aprender que el mundo también puede ser seguro.",
    "El cambio más profundo ocurre sin que nadie lo note, fragmento a fragmento.",
  ],
  en: [
    "Every behavior is a wordless message, waiting to be read with patience.",
    "The environment doesn't define you, but it deals the cards you play with.",
    "Reinforcement is not rewarding: it's lighting a flame where there was darkness.",
    "Before change there's always an antecedent. Learn to read it.",
    "A fair consequence teaches what a thousand words cannot.",
    "Extinction hurts before it sets free. It's the final cry of what was learned.",
    "Measure what matters. What isn't measured is forgotten in silence.",
    "Context is not the background of the painting, it's the brush that paints it.",
    "Generalization is not copying: it's learning that the world can also be safe.",
    "The deepest change happens without anyone noticing, piece by piece.",
  ]
};

const PlanSelection = () => {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const [quoteIndex, setQuoteIndex] = useState(0);

  const quotes = ABA_QUOTES[lang];

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [quotes.length]);

  const plans = [
    {
      id: "activacion",
      title: t('plan.activacion'),
      description: t('plan.activacion_desc'),
      icon: Zap,
      color: "from-amber-400 to-orange-500",
      lightColor: "bg-amber-500/10 text-amber-600",
    },
    {
      id: "rumia",
      title: t('plan.rumia'),
      description: t('plan.rumia_desc'),
      icon: Brain,
      color: "from-blue-400 to-indigo-500",
      lightColor: "bg-indigo-500/10 text-indigo-600",
    },
    {
      id: "meditacion",
      title: t('plan.meditacion'),
      description: t('plan.meditacion_desc'),
      icon: Moon,
      color: "from-emerald-400 to-teal-500",
      lightColor: "bg-teal-500/10 text-teal-600",
    },
    {
      id: "aprendizaje",
      title: t('plan.aprendizaje'),
      description: t('plan.aprendizaje_desc'),
      path: "/learning",
      icon: GraduationCap,
      color: "from-violet-400 to-purple-500",
      lightColor: "bg-violet-500/10 text-violet-600",
      isBeta: true
    },
    {
      id: "covert",
      title: t('plan.covert'),
      description: t('plan.covert_desc'),
      path: "/covert",
      icon: EyeOff,
      color: "from-indigo-500 to-purple-600",
      lightColor: "bg-indigo-500/10 text-indigo-600",
      isBeta: true
    },
    {
      id: "habilidades-sociales",
      title: t('plan.social_skills'),
      description: t('plan.social_skills_desc'),
      icon: Users,
      color: "from-rose-400 to-pink-500",
      lightColor: "bg-rose-500/10 text-rose-500",
      comingSoon: true,
    },
  ];

  const handleNavigate = (plan: any) => {
    if (plan.comingSoon) return;
    if (plan.path) {
      navigate(plan.path);
    } else {
      navigate(`/dashboard/${plan.id}`);
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden relative">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-12 pb-8 space-y-8 no-scrollbar">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl herbie-gradient shadow-lg shadow-primary/20 mb-2">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {t('plans.welcome')}
          </h1>
          <p className="text-muted-foreground text-balanced max-w-[280px] mx-auto">
            {t('plans.subtitle')}
          </p>
        </motion.div>

        {/* Plans List */}
        <div className="space-y-4 max-w-md mx-auto">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <motion.button
                key={plan.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleNavigate(plan)}
                disabled={!!plan.comingSoon}
                className={`w-full relative group ${plan.comingSoon ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="herbie-card p-5 flex items-center gap-5 text-left border-transparent group-hover:border-primary/20 transition-all duration-300 active:scale-[0.98]">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${plan.lightColor}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-card-foreground">
                        {plan.title}
                      </h3>
                      {plan.isBeta && (
                        <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-tighter">Beta</span>
                      )}
                      {plan.comingSoon && (
                        <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full uppercase tracking-tighter">{t('plan.coming_soon')}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {plan.description}
                    </p>
                  </div>
                </div>
                {/* Subtle gradient effect on card */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${plan.color} opacity-0 group-hover:opacity-[0.03] transition-opacity pointer-events-none`} />
              </motion.button>
            );
          })}
        </div>

        {/* Featured: ABA Expert */}
        <div className="max-w-md mx-auto pt-4">
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            onClick={() => navigate("/aba")}
            className="w-full relative group overflow-hidden rounded-3xl p-px bg-gradient-to-br from-primary/50 via-primary/20 to-transparent"
          >
            <div className="relative bg-card rounded-[23px] p-5 flex items-center gap-5 text-left transition-all duration-300 group-hover:bg-muted/50">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-primary/10 text-primary shadow-lg shadow-primary/5">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-card-foreground">
                    {t('plan.aba_expert')}
                  </h3>
                  <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-tighter">Beta</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('plan.aba_expert_desc')}
                </p>
              </div>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Dato Herbie: Fixed at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 bg-card border-t border-border/50 text-center pb-safe-or-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
      >
        <p className="text-[10px] uppercase tracking-widest text-primary font-black mb-2">
          {t('plans.heroic_data')}
        </p>
        <div className="h-12 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={`${lang}-${quoteIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-sm italic text-muted-foreground max-w-sm"
            >
              "{quotes[quoteIndex]}"
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default PlanSelection;
