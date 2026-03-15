import { ArrowLeft, BookOpen, Upload, LogOut, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const SettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="px-4 pt-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Ajustes</h1>
      </div>

      {/* Active Manual */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="herbie-card p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">Manual Activo</h3>
        </div>
        <div className="bg-muted rounded-lg p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground italic">Sin manual activo</p>
            <p className="text-xs text-muted-foreground">Sube tu primer manual clínico</p>
          </div>
        </div>
        <button className="w-full bg-accent text-accent-foreground rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          <Upload className="w-4 h-4" />
          Subir Manual (PDF)
        </button>
      </motion.div>

      {/* Telegram */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="herbie-card p-4 space-y-3"
      >
        <h3 className="text-sm font-semibold text-foreground">Telegram</h3>
        <p className="text-xs text-muted-foreground">
          Conecta tu bot de Telegram para enviar registros rápidos por mensaje.
        </p>
        <p className="text-xs text-muted-foreground">
          Ejemplo: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground text-xs">ansiedad 8 evité reunión</code>
        </p>
        <button className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold hover:opacity-90 transition-opacity">
          Conectar Telegram
        </button>
      </motion.div>

      {/* Account */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="herbie-card p-4 space-y-3"
      >
        <h3 className="text-sm font-semibold text-foreground">Cuenta</h3>
        <p className="text-xs text-muted-foreground">usuario@ejemplo.com</p>
        <button className="w-full border border-border text-foreground rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors">
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
