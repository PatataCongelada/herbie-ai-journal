import { useState, useRef, useEffect } from "react";
import { Brain, Send, Loader2, HelpCircle, ChevronDown, AlertCircle, Sparkles } from "lucide-react";
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
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const colorStyles = {
    indigo: {
      bg: "bg-indigo-500/5",
      border: "border-indigo-500/10",
      accent: "text-indigo-500",
      button: "bg-indigo-500",
      icon: "bg-indigo-500",
    },
    rose: {
      bg: "bg-rose-500/5",
      border: "border-rose-500/10",
      accent: "text-rose-500",
      button: "bg-rose-500",
      icon: "bg-rose-500",
    },
    primary: {
      bg: "bg-primary/5",
      border: "border-primary/10",
      accent: "text-primary",
      button: "bg-primary",
      icon: "bg-primary",
    }
  }[color];

  // Rate limit countdown timer
  useEffect(() => {
    if (rateLimitCountdown === null || rateLimitCountdown <= 0) return;
    const timer = setTimeout(() => setRateLimitCountdown(prev => (prev ?? 0) - 1), 1000);
    return () => clearTimeout(timer);
  }, [rateLimitCountdown]);

  const callApi = async (messageList: Message[], prompt?: string): Promise<string | null> => {
    const msgs = prompt 
      ? [{ role: "user", content: prompt }]
      : messageList;

    const response = await fetch("/api/clinical-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: msgs,
        category: "teoria",
        expert: "all",
        source: source
      }),
    });

    const data = await response.json();

    if (response.status === 429) {
      setRateLimitCountdown(data.retryAfterSeconds || 30);
      return null;
    }
    if (!response.ok) throw new Error(data.error || "Error");
    return data.text;
  };

  // Ask Herbie for guidance on the current step (on demand via button)
  const askForStepGuide = async () => {
    if (isLoading || (rateLimitCountdown && rateLimitCountdown > 0)) return;
    setIsLoading(true);
    setIsMinimized(false);

    const prompt = `Actúa como un supervisor clínico experto y empático. Estamos en la herramienta "${toolId}" y el usuario está en el paso: "${stepName}". 
El usuario NO TIENE ni idea de psicología clínica. Explícale ESTE PASO de forma ultra-sencilla, como si se lo explicaras a alguien que nunca ha estudiado psicología. 
Basándote exclusivamente en el manual: ${Array.isArray(source) ? source.join(', ') : source}.
Dile QUÉ tiene que escribir en este campo y POR QUÉ es importante. Sé muy concreto, con ejemplos simples si es posible.`;

    try {
      const text = await callApi([], prompt);
      if (text) {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: `📍 **${stepName}**\n\n${text}` }
        ]);
        if (isMinimized) setHasNewMessage(true);
      }
    } catch (error) {
      console.error("Assistant Error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Error al contactar con Herbie. Inténtalo de nuevo." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a welcome message when step changes (no API call)
  useEffect(() => {
    setMessages(prev => [
      ...prev,
      { 
        role: "assistant", 
        content: `👋 Estoy aquí para ayudarte con el paso **${stepName}**. Pulsa "Pedir ayuda a Herbie" para que te explique qué debes hacer, o escríbeme tu duda directamente.` 
      }
    ]);
    if (isMinimized) setHasNewMessage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || (rateLimitCountdown && rateLimitCountdown > 0)) return;

    const userMsg = { role: "user" as const, content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const text = await callApi(newMessages, 
        `El usuario está en el paso "${stepName}" de "${toolId}" y pregunta: "${input}". 
Responde de forma muy sencilla y directa, sin jerga técnica, usando el manual para sustentar tu respuesta.`
      );
      if (text) {
        setMessages(prev => [...prev, { role: "assistant", content: text }]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ height: isMinimized ? "64px" : "460px" }}
      className={`sticky top-0 z-20 ${colorStyles.bg} border ${colorStyles.border} rounded-[2rem] flex flex-col shadow-xl shadow-black/5 relative overflow-hidden backdrop-blur-md`}
    >
      {/* Header / Toggle */}
      <div
        onClick={() => {
          setIsMinimized(!isMinimized);
          if (!isMinimized) setHasNewMessage(false);
        }}
        className="flex items-center justify-between p-4 px-6 cursor-pointer hover:bg-black/5 transition-colors flex-shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl ${colorStyles.icon} flex items-center justify-center relative shadow-lg`}>
            <Brain className="w-4 h-4 text-white" />
            <AnimatePresence>
              {hasNewMessage && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                />
              )}
            </AnimatePresence>
          </div>
          <div className="text-left">
            <span className={`text-[10px] font-black uppercase tracking-widest ${colorStyles.accent}`}>
              Herbie Assistant
            </span>
            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter opacity-70 truncate max-w-[180px]">
              {isMinimized ? "Ver guía interactiva" : stepName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className={`w-3 h-3 animate-spin ${colorStyles.accent}`} />}
          {rateLimitCountdown && rateLimitCountdown > 0 ? (
            <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">
              ⏳ {rateLimitCountdown}s
            </span>
          ) : null}
          <motion.div animate={{ rotate: isMinimized ? 0 : 180 }}>
            <ChevronDown className={`w-4 h-4 ${colorStyles.accent} opacity-60`} />
          </motion.div>
        </div>
      </div>

      {/* Body */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col min-h-0 px-4 pb-4 space-y-3"
          >
            {/* "Ask Herbie" Button */}
            <button
              onClick={askForStepGuide}
              disabled={isLoading || (rateLimitCountdown !== null && rateLimitCountdown > 0)}
              className={`w-full ${colorStyles.button} text-white rounded-2xl py-2.5 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50`}
            >
              {isLoading ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> {t('aba.thinking')}</>
              ) : rateLimitCountdown && rateLimitCountdown > 0 ? (
                <><AlertCircle className="w-3 h-3" /> Disponible en {rateLimitCountdown}s</>
              ) : (
                <><Sparkles className="w-3 h-3" /> Pedir guía de este paso</>
              )}
            </button>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar scroll-smooth"
            >
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[88%] p-3 rounded-2xl text-[11px] leading-relaxed font-medium ${
                      msg.role === "user"
                        ? `${colorStyles.button} text-white rounded-tr-none`
                        : "bg-card border border-border/50 text-foreground rounded-tl-none"
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="bg-card border border-border/50 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                      <Loader2 className={`w-3 h-3 animate-spin ${colorStyles.accent}`} />
                      <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('aba.thinking')}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input */}
            <div className="flex gap-2 bg-background/60 p-2 rounded-[1.5rem] border border-border/30 shadow-inner flex-shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Pregúntame algo sobre este paso..."
                disabled={rateLimitCountdown !== null && rateLimitCountdown > 0}
                className="flex-1 bg-transparent border-none text-[11px] font-medium outline-none px-2 h-8 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || (rateLimitCountdown !== null && rateLimitCountdown > 0)}
                className={`w-8 h-8 ${colorStyles.button} text-white rounded-xl flex items-center justify-center shadow transition-transform active:scale-95 disabled:opacity-40`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative bg */}
      <div className={`absolute -top-12 -right-12 w-28 h-28 rounded-full ${colorStyles.button} opacity-[0.08] blur-3xl -z-10`} />
      <div className={`absolute -bottom-12 -left-12 w-28 h-28 rounded-full ${colorStyles.button} opacity-[0.08] blur-3xl -z-10`} />
    </motion.div>
  );
};

export default ToolAssistantBot;
