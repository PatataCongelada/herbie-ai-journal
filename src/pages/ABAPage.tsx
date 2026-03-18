import { useState, useRef, useEffect } from "react";
import { Brain, Send, Loader2, ArrowLeft, BrainCircuit, Sparkles, MessageCircle, HelpCircle, Activity, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

const ABAPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/decompose-concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept: input }),
      });

      if (!response.ok) throw new Error("Error en la respuesta");

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.explanation }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: t('aba.error_response') || "Lo siento, hubo un error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2 text-left">
            <div className="w-10 h-10 rounded-2xl herbie-gradient flex items-center justify-center shadow-lg shadow-primary/20">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-foreground uppercase tracking-wider leading-none">
                {t('aba.title')}
              </h1>
              <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-tighter opacity-70">
                {t('aba.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center text-center space-y-6 px-6"
            >
              <div className="w-20 h-20 rounded-[2rem] bg-primary/5 flex items-center justify-center relative">
                <Brain className="w-10 h-10 text-primary opacity-20" />
                <Sparkles className="w-6 h-6 text-primary absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">{t('aba.welcome_title') || "¿En qué puedo ayudarte hoy?"}</h3>
                <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
                  {t('aba.welcome_desc') || "Puedo realizar análisis funcionales o explicar conceptos de ABA."}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                {[
                  { icon: Activity, label: t('aba.abc_analysis') || "Análisis ABC" },
                  { icon: HelpCircle, label: t('aba.define_concept') || "Definir concepto" },
                  { icon: MessageCircle, label: t('aba.clinical_case') || "Caso clínico" },
                  { icon: GraduationCap, label: t('aba.training') || "Entrenamiento" }
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => setInput(item.label)}
                    className="p-3 bg-muted/30 border border-border/50 rounded-2xl text-[10px] font-bold text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all flex items-center gap-2"
                  >
                    <item.icon className="w-3 h-3" />
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none shadow-primary/10"
                      : "bg-card border border-border/50 text-card-foreground rounded-tl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border/50 p-4 rounded-3xl rounded-tl-none flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground font-medium">{t('aba.thinking') || "Herbie está pensando..."}</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t border-border">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t('aba.chat_placeholder')}
            className="flex-1 bg-muted/50 border-none rounded-2xl px-4 text-sm focus:ring-2 ring-primary/20 outline-none h-12"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 herbie-gradient text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95 transition-all"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ABAPage;
