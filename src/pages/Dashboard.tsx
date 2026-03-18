import { useNavigate, useParams } from "react-router-dom";
import { MessageCircle, PenLine, BarChart3, BookOpen, Brain, ArrowRight, Loader2, Trash2, ArrowLeft, BrainCircuit } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
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
  const { lang, t } = useLanguage();
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const dateLocale = lang === 'es' ? es : enUS;

  const planTitles: Record<string, string> = {
    activacion: t('plan.activacion'),
    rumia: t('plan.rumia'),
    meditacion: t('plan.meditacion'),
  };

  const currentPlanTitle = planId ? planTitles[planId] || t('dash.title') : t('dash.title');

  // Mutation for deleting a record
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch('/api/delete-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('dash.delete_error'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autorregistros'] });
      setSelectedLog(null);
      toast.success(t('dash.delete_success'));
    },
    onError: (error: any) => {
      console.error("Error al eliminar:", error);
      toast.error(t('dash.delete_error'));
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
      title: t('card.chat_herbie'),
      description: t('card.chat_desc'),
      icon: MessageCircle,
      color: "bg-primary/10 text-primary",
      action: () => navigate("/chat"),
    },
    {
      title: t('card.register'),
      description: t('card.register_desc'),
      icon: PenLine,
      color: "bg-secondary/10 text-secondary",
      action: () => navigate(`/register/${planId}`),
    },
    {
      title: t('card.stats'),
      description: t('card.stats_desc'),
      icon: BarChart3,
      color: "bg-accent/10 text-accent",
      action: () => navigate("/stats"),
    },
    {
      title: t('card.aba_analysis'),
      description: t('card.aba_desc'),
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
        <p className="text-sm text-muted-foreground">{t('dash.subtitle')}</p>
      </motion.div>

      {/* Quick Stats Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="herbie-gradient rounded-xl p-4 text-primary-foreground"
      >
        <p className="text-xs font-medium opacity-80">{t('dash.weekly_summary')}</p>
        <div className="flex items-baseline gap-4 mt-1">
          <div>
            <span className="text-2xl font-bold">{logs?.length || 0}</span>
            <span className="text-xs ml-1 opacity-80">{t('dash.records')}</span>
          </div>
          <div>
            <span className="text-2xl font-bold">
              {logs && logs.length > 0 
                ? (logs.reduce((acc: number, log: any) => acc + (Number(log.data.intensity) || 0), 0) / logs.length).toFixed(1)
                : 0}
            </span>
            <span className="text-xs ml-1 opacity-80">{t('dash.avg_intensity')}</span>
          </div>
        </div>
        <button
          onClick={() => navigate("/stats")}
          className="flex items-center gap-1 mt-2 text-xs font-medium opacity-90 hover:opacity-100 transition-opacity"
        >
          {t('dash.view_details')} <ArrowRight className="w-3 h-3" />
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
          <h2 className="text-sm font-semibold text-foreground">{t('dash.recent_logs')}</h2>
          {isLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
        </div>
        
        <div className="space-y-2">
          {logs && logs.length > 0 ? (
            logs.map((log, i) => {
              const intensity = log.data.intensity || 5;
              const emotion = log.data.emotion || t('dash.emotion_label');
              const phase = log.data.phase || "intervencion";
              const time = formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: dateLocale });
              
              const phaseStyles: Record<string, { label: string, color: string }> = {
                pre: { label: t('dash.phase_pre'), color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
                intervencion: { label: t('dash.phase_int'), color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
                post: { label: t('dash.phase_post'), color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
              };

              const currentPhase = phaseStyles[phase] || phaseStyles.intervencion;

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
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-card-foreground capitalize">{emotion}</p>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border ${currentPhase.color}`}>
                          {currentPhase.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {log.data.event_date ? `${t('dash.event')}: ${log.data.event_date}` : (log.data.conduct || t('dash.conduct_none'))} · {time}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-semibold text-muted-foreground">{intensity}</span>
                </div>
              );
            })
          ) : !isLoading ? (
            <div className="text-center py-8 border-2 border-dashed border-muted rounded-2xl">
              <p className="text-xs text-muted-foreground">{t('dash.no_logs')}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{t('dash.try_audio')}</p>
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
              {t('dash.detail_title')}
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dash.emotion_label')}</p>
                  <p className="text-xl font-bold capitalize">{selectedLog.data.emotion || t('dash.emotion_label')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dash.intensity_label')}</p>
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
                    `${t('dash.sent_at')} ${new Date(selectedLog.data.recorded_at).toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', { 
                      dateStyle: 'full', 
                      timeStyle: 'short' 
                    })}`
                  ) : (
                    `${t('dash.recorded_at')} ${new Date(selectedLog.created_at).toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', { 
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
                      {t('dash.delete_btn')}
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl max-w-[90vw] sm:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('dash.delete_confirm_title')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('dash.delete_confirm_desc')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-row gap-2 sm:gap-0">
                      <AlertDialogCancel className="flex-1 rounded-xl">{t('dash.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(selectedLog.id)}
                        className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl"
                      >
                        {t('dash.confirm_delete')}
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
