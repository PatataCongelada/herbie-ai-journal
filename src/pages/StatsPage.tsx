import { ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const weeklyData = [
  { day: "Lun", intensity: 6, records: 2 },
  { day: "Mar", intensity: 8, records: 1 },
  { day: "Mié", intensity: 5, records: 3 },
  { day: "Jue", intensity: 7, records: 2 },
  { day: "Vie", intensity: 4, records: 1 },
  { day: "Sáb", intensity: 3, records: 2 },
  { day: "Dom", intensity: 5, records: 1 },
];

const conductData = [
  { name: "Evitación", count: 4 },
  { name: "Exposición", count: 2 },
  { name: "Rumiación", count: 3 },
  { name: "Meditación", count: 1 },
  { name: "Aislamiento", count: 2 },
];

const barColors = [
  "hsl(0, 60%, 50%)",
  "hsl(160, 84%, 39%)",
  "hsl(45, 93%, 47%)",
  "hsl(217, 91%, 60%)",
  "hsl(239, 84%, 67%)",
];

const StatsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="px-4 pt-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Estadísticas</h1>
        </div>
        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          <Download className="w-3.5 h-3.5" /> CSV
        </button>
      </div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-3 gap-2"
      >
        {[
          { label: "Registros", value: "12", sub: "esta semana" },
          { label: "Intensidad", value: "5.4", sub: "promedio" },
          { label: "Racha", value: "5", sub: "días seguidos" },
        ].map((s) => (
          <div key={s.label} className="herbie-card p-3 text-center">
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
            <p className="text-[10px] text-muted-foreground">{s.sub}</p>
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
        <h3 className="text-xs font-semibold text-foreground mb-3">Intensidad Semanal</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(214, 32%, 91%)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="intensity"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "hsl(217, 91%, 60%)" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Conduct Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="herbie-card p-4"
      >
        <h3 className="text-xs font-semibold text-foreground mb-3">Frecuencia de Conductas</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={conductData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(215, 16%, 47%)" }} axisLine={false} tickLine={false} width={80} />
            <Tooltip
              contentStyle={{
                background: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(214, 32%, 91%)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
              {conductData.map((_, i) => (
                <Cell key={i} fill={barColors[i % barColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Manual Insights */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.15 }}
        className="herbie-card p-4 space-y-2"
      >
        <h3 className="text-xs font-semibold text-foreground">Insights del Manual</h3>
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">
            📊 Esta semana: <span className="text-foreground font-medium">4/7 días con evitación</span>
          </p>
          <p className="text-xs text-muted-foreground">
            📈 Intensidad promedio <span className="text-foreground font-medium">subió de 4.2 a 5.4</span>
          </p>
          <p className="text-xs text-accent font-medium">
            💡 Sube un manual clínico para obtener insights personalizados
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default StatsPage;
