import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BrainCircuit, Lock, Mail, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signUp(email, password);
      toast.success(t('signup.success'));
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || t('signup.error'));
    } finally {
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
            HERBIE <span className="text-primary">JOIN</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            {t('signup.subtitle')}
          </p>
        </div>

        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSignup}
          className="herbie-card p-8 border-primary/10 bg-card/50 backdrop-blur-xl space-y-5"
        >
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">
              {t('signup.username')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-muted/50 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">
              {t('signup.password')}
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
                minLength={6}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <p className="text-[10px] text-primary/80 leading-tight">
              {t('sec.e2ee_on')}: Your password generates your clinical key locally.
            </p>
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
                {t('signup.btn')}
              </>
            )}
          </button>

          <Link 
            to="/login"
            className="block text-center text-xs text-muted-foreground hover:text-primary transition-colors mt-2"
          >
            {t('signup.already_have')}
          </Link>
        </motion.form>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]"
        >
          H.E.R.B.I.E. SECURE NODE • V2.5.0
        </motion.p>
      </motion.div>
    </div>
  );
};

export default SignupPage;
