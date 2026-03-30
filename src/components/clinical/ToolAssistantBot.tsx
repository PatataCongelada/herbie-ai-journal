import { useState, useRef, useEffect } from "react";
import { Brain, Send, Loader2, Sparkles, MessageCircle, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface ToolAssistantBotProps {
  toolId: string;
  source: string | string[];
  currentStep: number;
  stepName: string;
  color?: "indigo" | "rose" | "primary";
}

const ToolAssistantBot = ({ toolId, source, currentStep, stepName, color = "indigo" }: ToolAssistantBotProps) => {
  const { lang, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const colorStyles = {
    indigo: {
      bg: "bg-indigo-500/5",
      border: "border-indigo-500/10",
      accent: "text-indigo-500",
      button: "bg-indigo-500",
      icon: "bg-indigo-500",
      welcome_text: "text-indigo-600/80"
    },
    rose: {
      bg: "bg-rose-500/5",
      border: "border-rose-500/10",
      accent: "text-rose-500",
      button: "bg-rose-500",
      icon: "bg-rose-500",
      welcome_text: "text-rose-600/80"
    },
    primary: {
      bg: "bg-primary/5",
      border: "border-primary/10",
      accent: "text-primary",
      button: "bg-primary",
      icon: "bg-primary",
      welcome_text: "text-primary/70"
    }
  }[color];

  const getInitialGuide = async () => {
    setIsLoading(true);
    const prompt = `Actúa como un supervisor clínico experto y empático. Estamos en la herramienta "${toolId}" y el usuario está en el paso: "${stepName}". 
    El usuario NO TIENE ni idea de psicología. Explícale este paso de forma ultra-sencilla basándote exclusivamente en el manual: ${Array.isArray(source) ? source.join(', ') : source}. 
    Saluda brevemente y dile qué debe hacer en este campo. No redactes el plan aún, solo guía.`;

    try {
      const response = await fetch("/api/clinical-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [{ role: "user", content: prompt }],
          category: "teoria",
          expert: "all",
          source: source
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessages([{ role: "assistant", content: data.text }]);
      }
    } catch (error) {
       console.error("Assistant Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getInitialGuide();
  }, [currentStep]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { role: "user" as const, content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/clinical-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, userMsg],
          category: "practica",
          expert: "all",
          source: source,
          systemInstruction: `Instrucción para el bot: Eres un asistente para principiantes. El usuario está en el paso "${stepName}" de "${toolId}". Responde sus dudas de forma clara, directa y muy sencilla usando el manual.`
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: data.text }]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`p-6 ${colorStyles.bg} border ${colorStyles.border} rounded-[2rem] space-y-4 flex flex-col h-[400px] shadow-sm relative overflow-hidden backdrop-blur-sm`}>
      <div className="flex items-center justify-between border-b border-border/10 pb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl ${colorStyles.icon} flex items-center justify-center`}>
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${colorStyles.accent}`}>
            Guía de {t('nav.home').toLowerCase()} herbie
          </span>
        </div>
        <div className="flex items-center gap-1">
          <HelpCircle className={`w-4 h-4 ${colorStyles.accent} opacity-40`} />
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] leading-relaxed shadow-sm font-medium ${
                msg.role === "user" 
                  ? `${colorStyles.button} text-white rounded-tr-none` 
                  : "bg-card border border-border/50 text-foreground rounded-tl-none"
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-card border border-border/50 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                <Loader2 className={`w-3 h-3 animate-spin ${colorStyles.accent}`} />
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('aba.thinking')}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-2 bg-background/50 p-2 rounded-[1.5rem] border border-border/30 shadow-inner">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Hazme una pregunta sobre este paso..."
          className="flex-1 bg-transparent border-none text-[11px] font-medium outline-none px-2 h-8"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className={`w-8 h-8 ${colorStyles.button} text-white rounded-xl flex items-center justify-center shadow-lg transition-transform active:scale-95 disabled:opacity-50`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Decorative patterns */}
      <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full ${colorStyles.button} opacity-[0.03] blur-3xl`} />
      <div className={`absolute -bottom-10 -left-10 w-24 h-24 rounded-full ${colorStyles.button} opacity-[0.03] blur-3xl`} />
    </div>
  );
};

export default ToolAssistantBot;
