import { ArrowLeft, BookOpen, Upload, LogOut, FileText, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="px-4 pt-4 space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">{t('settings.title')}</h1>
      </div>

      {/* Account Section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="herbie-card p-4 space-y-3"
      >
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{t('settings.account')}</h3>
        </div>
        <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 herbie-gradient rounded-xl flex items-center justify-center text-white font-black text-lg">
            {user?.email?.[0]?.toUpperCase() || "H"}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{user?.email || 'herbie@example.com'}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Usuario activo</p>
          </div>
        </div>
      </motion.div>

      {/* Active Manual */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="herbie-card p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">{t('settings.active_manual')}</h3>
        </div>
        <div className="bg-muted rounded-lg p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground italic">{t('settings.no_manual')}</p>
            <p className="text-xs text-muted-foreground">{t('settings.upload_desc')}</p>
          </div>
        </div>
        <button className="w-full bg-accent text-accent-foreground rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          <Upload className="w-4 h-4" />
          {t('settings.upload_btn')}
        </button>
      </motion.div>

      {/* Telegram */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="herbie-card p-4 space-y-3"
      >
        <h3 className="text-sm font-semibold text-foreground">{t('settings.telegram')}</h3>
        <p className="text-xs text-muted-foreground">
          {t('settings.telegram_desc')}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('dash.event')}: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground text-xs">ansiedad 8 evité reunión</code>
        </p>
        <button className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold hover:opacity-90 transition-opacity">
          {t('settings.connect_telegram')}
        </button>
      </motion.div>

      {/* Clinical Design Lab */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="herbie-card p-4 space-y-3 border-violet-500/20"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔬</span>
          <h3 className="text-sm font-semibold text-foreground">Laboratorio de Diseño Clínico</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Consulta los manuales clínicos para generar una especificación completa de cualquier herramienta de intervención y exportarla como PDF.
        </p>
        <button 
          onClick={() => navigate("/architect")}
          className="w-full bg-violet-500 text-white rounded-xl py-3 text-sm font-black flex items-center justify-center gap-2 hover:bg-violet-600 active:scale-95 transition-all shadow-lg shadow-violet-500/20"
        >
          🧠 Abrir el Laboratorio
        </button>
      </motion.div>

      {/* Logout — Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.15 }}
        className="herbie-card p-4 space-y-3 border-red-500/20"
      >
        <h3 className="text-sm font-semibold text-red-500">Cerrar sesión</h3>
        <p className="text-xs text-muted-foreground">Saldrás de tu cuenta. Podrás volver a entrar con tus credenciales.</p>
        <button 
          onClick={handleLogout}
          className="w-full bg-red-500 text-white rounded-xl py-3 text-sm font-black flex items-center justify-center gap-2 hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/20"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
