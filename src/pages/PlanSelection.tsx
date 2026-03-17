import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Brain, Sparkles, Zap, Moon } from "lucide-react";

const PlanSelection = () => {
  const navigate = useNavigate();

  const plans = [
    {
      id: "activacion",
      title: "Activación Conductual",
      description: "Recupera tu vitalidad a través de rutinas y actividades gratificantes.",
      icon: Zap,
      color: "from-amber-400 to-orange-500",
      lightColor: "bg-amber-500/10 text-amber-600",
    },
    {
      id: "rumia",
      title: "Rumia",
      description: "Gestiona esos pensamientos circulares que no te dejan avanzar.",
      icon: Brain,
      color: "from-blue-400 to-indigo-500",
      lightColor: "bg-indigo-500/10 text-indigo-600",
    },
    {
      id: "meditacion",
      title: "Meditación",
      description: "Encuentra la calma y observa tus estados fisiológicos con atención plena.",
      icon: Moon,
      color: "from-emerald-400 to-teal-500",
      lightColor: "bg-teal-500/10 text-teal-600",
    },
  ];

  return (
    <div className="min-h-screen bg-background px-4 pt-12 pb-20 space-y-8">
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
          Hola de nuevo
        </h1>
        <p className="text-muted-foreground text-balanced max-w-[280px] mx-auto">
          ¿En qué plan clínico vamos a trabajar hoy?
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
              onClick={() => navigate(`/dashboard/${plan.id}`)}
              className="w-full relative group"
            >
              <div className="herbie-card p-5 flex items-center gap-5 text-left border-transparent group-hover:border-primary/20 transition-all duration-300 active:scale-[0.98]">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${plan.lightColor}`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-card-foreground">
                    {plan.title}
                  </h3>
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

      {/* Optional: Summary or Insight */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 p-4 rounded-2xl bg-muted/30 border border-muted/50 text-center"
      >
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          Dato HERBIE
        </p>
        <p className="text-sm italic text-muted-foreground mt-2">
          "Pequeños pasos constantes llevan a grandes cambios estructurales."
        </p>
      </motion.div>
    </div>
  );
};

export default PlanSelection;
