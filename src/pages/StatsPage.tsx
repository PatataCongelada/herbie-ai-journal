import { ArrowLeft, Download, Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, isWithinInterval, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const barColors = [
  "hsl(var(--primary))",
  "hsl(160, 84%, 39%)",
  "hsl(45, 93%, 47%)",
  "hsl(217, 91%, 60%)",
  "hsl(239, 84%, 67%)",
];

const StatsPage = () => {
  const navigate = useNavigate();

  const { data: logs, isLoading } = useQuery({
    queryKey: ['autorregistros-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('autorregistros')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Procesamiento de datos para los gráficos
  const processData = () => {
    if (!logs || logs.length === 0) return { weeklyData: [], conductData: [], summary: { count: 0, avg: 0, racha: 0 } };

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date,
        dayName: format(date, "eee", { locale: es }),
        intensity: 0,
        count: 0,
        totalIntensity: 0
      };
    });

    const categories: Record<string, number> = {};
    let totalIntensityOverall = 0;
    let recordsCountOverall = 0;

    logs.forEach(log => {
      const logDate = parseISO(log.created_at);
      const intensity = Number(log.data.intensity) || 0;
      const conduct = log.data.emotion || log.data.conduct || "Otros";

      if (intensity > 0) {
        totalIntensityOverall += intensity;
        recordsCountOverall++;
      }

      // Agregación para conductData
      categories[conduct] = (categories[conduct] || 0) + 1;

      // Agregación para weeklyData (últimos 7 días)
      last7Days.forEach(day => {
        if (isWithinInterval(logDate, {
          start: startOfDay(day.date),
          end: new Date(startOfDay(day.date).getTime() + 24 * 60 * 60 * 1000 - 1)
        })) {
          day.count++;
          day.totalIntensity += intensity;
        }
      });
    });

    const weeklyData = last7Days.map(day => ({
      day: day.dayName,
      intensity: day.count > 0 ? Number((day.totalIntensity / day.count).toFixed(1)) : 0,
      records: day.count
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
      } else if (i > 0) { // Si hoy no hay pero ayer sí, la racha sigue. Si rompe en el pasado, para.
        break;
      }
    }

    return {
      weeklyData,
      conductData,
      summary: {
        count: logs.length,
        avg: recordsCountOverall > 0 ? (totalIntensityOverall / recordsCountOverall).toFixed(1) : 0,
        racha
      }
    };
  };

  const { weeklyData, conductData, summary } = processData();

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
          <h1 className="text-lg font-bold text-foreground">Estadísticas</h1>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-[10px] font-bold text-primary hover:bg-primary/20 transition-all">
          <Download className="w-3 h-3" /> EXPORTAR
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
          { label: "Registros", value: summary.count, sub: "totales" },
          { label: "Intensidad", value: summary.avg, sub: "promedio" },
          { label: "Racha", value: summary.racha, sub: "días seguidos" },
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
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Intensidad (7 días)</h3>
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
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--card))" }}
              activeDot={{ r: 6, strokeWidth: 0 }}
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
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Conductas Frecuentes</h3>
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
          <h3 className="text-xs font-black text-primary uppercase tracking-widest">Herbie Insights</h3>
        </div>
        <div className="space-y-3">
          {logs && logs.length > 0 ? (
            <>
              <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                Se han detectado <span className="text-primary font-bold">{summary.count} registros</span> en tu historial clínico. 
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Herbie está analizando tus patrones de rumiación y activación. Mantén tu racha de {summary.racha} días para obtener un análisis funcional más profundo.
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Aún no hay suficientes datos para generar insights. ¡Prueba a mandarle un audio a Herbie para empezar!
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default StatsPage;
