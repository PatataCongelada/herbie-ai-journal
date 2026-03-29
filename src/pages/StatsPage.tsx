import { ArrowLeft, Download, Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, isWithinInterval, parseISO } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

const barColors = [
  "hsl(var(--primary))",
  "hsl(160, 84%, 39%)",
  "hsl(45, 93%, 47%)",
  "hsl(217, 91%, 60%)",
  "hsl(239, 84%, 67%)",
];

const StatsPage = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { user, encryptionKey } = useAuth();
  const dateLocale = lang === 'es' ? es : enUS;

  const { data: logs, isLoading } = useQuery({
    queryKey: ['autorregistros-stats', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('autorregistros')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      if (!data) return [];

      // DECRYPT DATA
      if (!encryptionKey) return data;

      const { decryptData } = await import("@/lib/crypto");
      
      const decryptedLogs = await Promise.all(data.map(async (log) => {
        if (log.data && log.data.encrypted_data) {
          try {
            const decrypted = await decryptData(log.data.encrypted_data, encryptionKey);
            return { ...log, data: decrypted };
          } catch (e) {
            console.error("Failed to decrypt log for stats:", log.id, e);
            return { ...log, data: { ...log.data, error: "Decrypt Error" } };
          }
        }
        return log;
      }));

      return decryptedLogs;
    },
    enabled: !!user && !!encryptionKey
  });

  // Procesamiento de datos para los gráficos
  const processData = () => {
    if (!logs || logs.length === 0) return { weeklyData: [], conductData: [], summary: { count: 0, avg: 0, racha: 0 } };

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date,
        dayName: format(date, "eee", { locale: dateLocale }),
        intensity: 0,
        count: 0,
        totalIntensity: 0,
        phase: 'intervencion' as string
      };
    });

    const categories: Record<string, number> = {};
    const phases: Record<string, number> = {};
    let totalIntensityOverall = 0;
    let recordsCountOverall = 0;

    logs.forEach(log => {
      const logDate = parseISO(log.created_at);
      const intensity = Number(log.data.intensity) || 0;
      const conduct = log.data.emotion || log.data.conduct || (lang === 'es' ? "Otros" : "Others");
      const phase = log.data.phase || "intervencion";

      if (intensity > 0) {
        totalIntensityOverall += intensity;
        recordsCountOverall++;
      }

      // Agregación para conductData
      categories[conduct] = (categories[conduct] || 0) + 1;
      phases[phase] = (phases[phase] || 0) + 1;

      // Agregación para weeklyData (últimos 7 días)
      last7Days.forEach(day => {
        if (isWithinInterval(logDate, {
          start: startOfDay(day.date),
          end: new Date(startOfDay(day.date).getTime() + 24 * 60 * 60 * 1000 - 1)
        })) {
          day.count++;
          day.totalIntensity += intensity;
          day.phase = phase; // Predominate/last phase for that day
        }
      });
    });

    const weeklyData = last7Days.map(day => ({
      day: day.dayName,
      intensity: day.count > 0 ? Number((day.totalIntensity / day.count).toFixed(1)) : 0,
      records: day.count,
      phase: day.phase
    }));

    const conductData = Object.entries(categories)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calcular racha (días seguidos con registros)
    let racha = 0;
    const sortedDates = [...new Set(logs.map(l => format(parseISO(l.created_at), 'yyyy-MM-dd')))].sort().reverse();
    let current = new Date();
    for (let i = 0; i < 30; i++) {
      const dateStr = format(subDays(current, i), 'yyyy-MM-dd');
      if (sortedDates.includes(dateStr)) {
        racha++;
      } else if (i > 0) { 
        break;
      }
    }

    return {
      weeklyData,
      conductData,
      phases,
      summary: {
        count: logs.length,
        avg: recordsCountOverall > 0 ? (totalIntensityOverall / recordsCountOverall).toFixed(1) : 0,
        racha
      }
    };
  };

  const { weeklyData, conductData, phases, summary } = processData();

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'pre': return 'hsl(217, 91%, 60%)'; // Blue
      case 'intervencion': return 'hsl(45, 93%, 47%)'; // Amber
      case 'post': return 'hsl(160, 84%, 39%)'; // Green
      default: return 'hsl(var(--primary))';
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-24 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{t('stats.title')}</h1>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-[10px] font-bold text-primary hover:bg-primary/20 transition-all">
          <Download className="w-3 h-3" /> {t('stats.export')}
        </button>
      </div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: t('stats.records'), value: summary.count, sub: t('stats.total') },
          { label: t('stats.intensity'), value: summary.avg, sub: t('stats.average') },
          { label: t('stats.streak'), value: summary.racha, sub: t('stats.days_streak') },
        ].map((s) => (
          <div key={s.label} className="herbie-card p-3 text-center border-primary/5">
            <p className="text-xl font-black text-foreground">{s.value}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{s.label}</p>
            <p className="text-[9px] text-muted-foreground/60">{s.sub}</p>
          </div>
        ))}
      </motion.div>

      {/* Intensity Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="herbie-card p-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('stats.evolution')}</h3>
          <div className="flex gap-2">
            {['pre', 'intervencion', 'post'].map(p => (
              <div key={p} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getPhaseColor(p) }} />
                <span className="text-[8px] font-bold text-muted-foreground uppercase">
                  {p === 'intervencion' ? (lang === 'es' ? 'Int' : 'Int') : (p === 'pre' ? t('dash.phase_pre') : t('dash.phase_post'))}
                </span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} 
              axisLine={false} 
              tickLine={false} 
              dy={10}
            />
            <YAxis 
              domain={[0, 10]} 
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} 
              axisLine={false} 
              tickLine={false} 
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: "bold"
              }}
              cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Line
              type="monotone"
              dataKey="intensity"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeOpacity={0.3}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (!payload.records) return null;
                return (
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={5} 
                    fill={getPhaseColor(payload.phase)} 
                    stroke="white" 
                    strokeWidth={2} 
                  />
                );
              }}
              activeDot={{ r: 7, strokeWidth: 0 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Conduct Bar Chart */}
      {conductData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="herbie-card p-4"
        >
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">{t('stats.frequent_conducts')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={conductData} layout="vertical" margin={{ left: -20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" horizontal={false} opacity={0.3} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: "bold" }} 
                axisLine={false} 
                tickLine={false} 
                width={100} 
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "11px"
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={12}>
                {conductData.map((_, i) => (
                  <Cell key={i} fill={barColors[i % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Manual Insights */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.15 }}
        className="herbie-card p-5 border-primary/20 bg-primary/5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-black text-primary uppercase tracking-widest">{t('stats.insights_title')}</h3>
        </div>
        <div className="space-y-3">
          {logs && logs.length > 0 ? (
            <>
              <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                {t('stats.phases_summary')}: <span className="text-blue-500">{phases.pre || 0} {t('dash.phase_pre')}</span> · <span className="text-amber-500">{phases.intervencion || 0} INT</span> · <span className="text-emerald-500">{phases.post || 0} {t('dash.phase_post')}</span>
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('stats.insight_comparison')}
                {Number(summary.avg) > 7 ? t('stats.insight_high_intensity') : t('stats.insight_low_intensity')}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              {t('stats.no_data_insight')}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default StatsPage;
