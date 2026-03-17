import { useNavigate, useParams } from "react-router-dom";
import { MessageCircle, PenLine, BarChart3, BookOpen, Brain, ArrowRight, Loader2, Trash2, ArrowLeft, BrainCircuit } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Dashboard = () => {
  const navigate = useNavigate();
  const { planId } = useParams();
  const queryClient = useQueryClient();
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const planTitles: Record<string, string> = {
    activacion: "Activación Conductual",
    rumia: "Rumia",
    meditacion: "Meditación",
  };

  const currentPlanTitle = planId ? planTitles[planId] || "Dashboard" : "Dashboard";

  // Mutation for deleting a record
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('autorregistros')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autorregistros'] });
      setSelectedLog(null);
      toast.success("Registro eliminado correctamente");
    },
    onError: (error: any) => {
      console.error("Error al eliminar:", error);
      toast.error("Error al eliminar el registro. Verifica los permisos de Supabase.");
    }
  });

  // Fetch autorregistros from Supabase
  const { data: logs, isLoading } = useQuery({
    queryKey: ['autorregistros', planId],
    queryFn: async () => {
      let query = supabase
        .from('autorregistros')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (planId) {
        query = query.eq('data->>plan', planId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Polling cada 5 segundos para ver registros nuevos del bot
  });

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
      action: () => navigate(`/register/${planId}`),
    },
    {
      title: "Estadísticas",
      description: "Tu progreso semanal",
      icon: BarChart3,
      color: "bg-accent/10 text-accent",
      action: () => navigate("/stats"),
    },
    {
      title: "Análisis ABA",
      description: "Analizar con Cerebro Experto",
      icon: BrainCircuit,
      color: "bg-primary/10 text-primary",
      action: () => navigate("/aba"),
    },
  ];

  return (
    <div className="px-4 pt-6 pb-20 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/")} className="p-1 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="w-8 h-8 rounded-lg herbie-gradient flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-foreground uppercase tracking-tight">{currentPlanTitle}</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Gestiona tus progresos y registros clínicos</p>
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
            <span className="text-2xl font-bold">{logs?.length || 0}</span>
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
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Últimos registros</h2>
          {isLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
        </div>
        
        <div className="space-y-2">
          {logs && logs.length > 0 ? (
            logs.map((log, i) => {
              const intensity = log.data.intensity || 5;
              const emotion = log.data.emotion || "Registro";
              const time = formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es });
              
              return (
                <div 
                  key={log.id} 
                  onClick={() => setSelectedLog(log)}
                  className="herbie-card p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        intensity >= 7
                          ? "bg-destructive"
                          : intensity >= 4
                          ? "bg-[hsl(45,93%,47%)]"
                          : "bg-secondary"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-card-foreground capitalize">{emotion}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.data.event_date ? `Suceso: ${log.data.event_date}` : (log.data.conduct || "Sin conducta")} · {time}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-semibold text-muted-foreground">{intensity}</span>
                </div>
              );
            })
          ) : !isLoading ? (
            <div className="text-center py-8 border-2 border-dashed border-muted rounded-2xl">
              <p className="text-xs text-muted-foreground">No hay registros todavía.</p>
              <p className="text-[10px] text-muted-foreground mt-1">¡Prueba a mandarle un audio a Herbie!</p>
            </div>
          ) : null}
        </div>
      </motion.div>

      {/* Record Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-[90vw] rounded-2xl sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Detalle del Registro
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Emoción</p>
                  <p className="text-xl font-bold capitalize">{selectedLog.data.emotion || "Registro"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Intensidad</p>
                  <p className="text-3xl font-black text-primary">{selectedLog.data.intensity || 0}</p>
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(selectedLog.data).map(([key, value]) => {
                  if (key === 'intensity' || key === 'emotion') return null;
                  return (
                    <div key={key} className="space-y-1">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{key}</p>
                      <p className="text-sm text-foreground leading-relaxed bg-muted/20 p-2 rounded-lg border border-muted">
                        {String(value)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-muted">
                <p className="text-[10px] text-muted-foreground text-center">
                  {selectedLog.data.recorded_at ? (
                    `Mensaje enviado el ${new Date(selectedLog.data.recorded_at).toLocaleString('es-ES', { 
                      dateStyle: 'full', 
                      timeStyle: 'short' 
                    })}`
                  ) : (
                    `Registrado el ${new Date(selectedLog.created_at).toLocaleString('es-ES', { 
                      dateStyle: 'full', 
                      timeStyle: 'short' 
                    })}`
                  )}
                </p>
              </div>

              <div className="pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      disabled={deleteMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/5 transition-colors text-sm font-medium"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Eliminar registro
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl max-w-[90vw] sm:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se borrará permanentemente de tu diario clínico.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-row gap-2 sm:gap-0">
                      <AlertDialogCancel className="flex-1 rounded-xl">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(selectedLog.id)}
                        className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
