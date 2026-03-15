import { useNavigate } from "react-router-dom";
import { MessageCircle, PenLine, BarChart3, BookOpen, Brain, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const Dashboard = () => {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Chat HERBIE",
      description: "Consulta tu manual clínico con IA",
      icon: MessageCircle,
      color: "bg-primary/10 text-primary",
      action: () => navigate("/chat"),
    },
    {
      title: "Registrar",
      description: "Nuevo autorregistro rápido",
      icon: PenLine,
      color: "bg-secondary/10 text-secondary",
      action: () => navigate("/register"),
    },
    {
      title: "Estadísticas",
      description: "Tu progreso semanal",
      icon: BarChart3,
      color: "bg-accent/10 text-accent",
      action: () => navigate("/stats"),
    },
    {
      title: "Manual Activo",
      description: "Sube tu primer manual clínico",
      icon: BookOpen,
      color: "bg-primary/10 text-primary",
      action: () => navigate("/settings"),
    },
  ];

  return (
    <div className="px-4 pt-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-1"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg herbie-gradient flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">HERBIE</h1>
        </div>
        <p className="text-sm text-muted-foreground">Tu asistente clínico IA</p>
      </motion.div>

      {/* Quick Stats Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="herbie-gradient rounded-xl p-4 text-primary-foreground"
      >
        <p className="text-xs font-medium opacity-80">Resumen semanal</p>
        <div className="flex items-baseline gap-4 mt-1">
          <div>
            <span className="text-2xl font-bold">5</span>
            <span className="text-xs ml-1 opacity-80">registros</span>
          </div>
          <div>
            <span className="text-2xl font-bold">4.8</span>
            <span className="text-xs ml-1 opacity-80">intensidad media</span>
          </div>
        </div>
        <button
          onClick={() => navigate("/stats")}
          className="flex items-center gap-1 mt-2 text-xs font-medium opacity-90 hover:opacity-100 transition-opacity"
        >
          Ver detalles <ArrowRight className="w-3 h-3" />
        </button>
      </motion.div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 + i * 0.03 }}
              onClick={card.action}
              className="herbie-card p-4 text-left flex flex-col gap-3"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-card-foreground">{card.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Recent Log */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.25 }}
        className="space-y-2"
      >
        <h2 className="text-sm font-semibold text-foreground">Últimos registros</h2>
        <div className="space-y-2">
          {[
            { emotion: "Ansiedad", intensity: 7, time: "Hace 2h", conduct: "Evitación" },
            { emotion: "Tristeza", intensity: 4, time: "Ayer", conduct: "Aislamiento" },
            { emotion: "Calma", intensity: 3, time: "Hace 2 días", conduct: "Meditación" },
          ].map((log, i) => (
            <div key={i} className="herbie-card p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    log.intensity >= 7
                      ? "bg-destructive"
                      : log.intensity >= 4
                      ? "bg-[hsl(45,93%,47%)]"
                      : "bg-secondary"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-card-foreground">{log.emotion}</p>
                  <p className="text-xs text-muted-foreground">{log.conduct} · {log.time}</p>
                </div>
              </div>
              <span className="text-lg font-semibold text-muted-foreground">{log.intensity}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
