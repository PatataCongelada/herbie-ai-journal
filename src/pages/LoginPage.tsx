import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BrainCircuit, Lock, User, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Artificial delay for premium feel
    await new Promise(resolve => setTimeout(resolve, 800));

    if (login(username, password)) {
      toast.success(t('login.btn'));
      navigate("/");
    } else {
      toast.error(t('login.error'));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen herbie-bg flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-20 herbie-gradient rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl shadow-primary/20 mb-6 relative"
          >
            <BrainCircuit className="w-10 h-10 text-white" />
            <Sparkles className="w-4 h-4 text-white absolute -top-1 -right-1 animate-pulse" />
          </motion.div>
          
          <h1 className="text-2xl font-black text-foreground tracking-tight mb-2">
            HERBIE <span className="text-primary">SYSTEM</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            {t('login.subtitle')}
          </p>
        </div>

        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleLogin}
          className="herbie-card p-8 border-primary/10 bg-card/50 backdrop-blur-xl space-y-5"
        >
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">
              {t('login.username')}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-muted/50 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">
              {t('login.password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-muted/50 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 herbie-gradient text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {t('login.btn')}
              </>
            )}
          </button>
        </motion.form>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]"
        >
          H.E.R.B.I.E. V2.5.0 • PROTECTED SYSTEM
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
