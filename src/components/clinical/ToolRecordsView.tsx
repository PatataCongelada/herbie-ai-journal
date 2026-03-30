import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Loader2, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ToolRecordsViewProps {
  toolId: string;
}

const ToolRecordsView = ({ toolId }: ToolRecordsViewProps) => {
  const { lang, t } = useLanguage();
  const { user, encryptionKey } = useAuth();
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const dateLocale = lang === 'es' ? es : enUS;

  const { data: logs, isLoading } = useQuery({
    queryKey: ['autorregistros', toolId, user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('autorregistros')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!data) return [];

      if (!encryptionKey) return data;

      const { decryptData } = await import("@/lib/crypto");
      
      const decryptedLogs = await Promise.all(data.map(async (log) => {
        if (log.data && log.data.encrypted_data) {
          try {
            const decrypted = await decryptData(log.data.encrypted_data, encryptionKey);
            return { ...log, data: decrypted };
          } catch (e) {
            console.error("Failed to decrypt:", log.id, e);
            return { ...log, data: { ...log.data, error: t('sec.decrypt_error') } };
          }
        }
        return log;
      }));

      // Filter by the specific tool/plan
      return decryptedLogs.filter(log => log.data.plan === toolId);
    },
    enabled: !!user && !!encryptionKey,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">Recuperando historial clínico...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs && logs.length > 0 ? (
        <div className="space-y-3">
          {logs.map((log, i) => {
            const intensity = log.data.intensity || 5;
            const emotion = log.data.emotion || t('dash.emotion_label');
            const time = formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: dateLocale });

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedLog(log)}
                className="bg-card border border-border/50 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-all shadow-sm group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full shadow-sm ${
                    intensity >= 7 ? "bg-red-500" : intensity >= 4 ? "bg-amber-500" : "bg-emerald-500"
                  }`} />
                  <div>
                    <p className="text-sm font-bold text-foreground capitalize">{emotion}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-lg font-black text-foreground/20 group-hover:text-primary transition-colors">{intensity}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-muted rounded-[2rem] bg-muted/5">
          <Brain className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-muted-foreground">{t('dash.no_logs')}</h3>
          <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-widest leading-loose">
            No hay registros clínicos asociados<br />a esta herramienta todavía.
          </p>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-[90vw] rounded-[2.5rem] p-0 border-none bg-background shadow-2xl overflow-hidden">
          <div className="p-8 space-y-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-primary">
                <Brain className="w-5 h-5" />
                {t('dash.detail_title')}
              </DialogTitle>
            </DialogHeader>

            {selectedLog && (
              <div className="space-y-6">
                <div className="bg-muted/30 p-6 rounded-[2rem] border border-border/50 flex items-center justify-between">
                  <div>
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 block">Emoción</label>
                    <p className="text-2xl font-bold capitalize">{selectedLog.data.emotion}</p>
                  </div>
                  <div className="text-right">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 block">Intensidad</label>
                    <p className="text-5xl font-black text-primary">{selectedLog.data.intensity}</p>
                  </div>
                </div>

                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
                  {Object.entries(selectedLog.data).map(([key, value]) => {
                    if (['intensity', 'emotion', 'plan'].includes(key)) return null;
                    return (
                      <div key={key} className="space-y-2">
                        <label className="text-[10px] font-black text-primary uppercase tracking-widest px-1">{key}</label>
                        <div className="bg-card border border-border/50 p-4 rounded-2xl text-sm leading-relaxed shadow-sm">
                          {String(value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ToolRecordsView;
