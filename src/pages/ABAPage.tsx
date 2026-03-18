import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BrainCircuit, Sparkles, Send, BookOpen } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isExpert?: boolean;
  isStreaming?: boolean;
}

const TypewriterText = ({ text, onComplete, isStopped }: { text: string; onComplete?: () => void, isStopped?: boolean }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isStopped) {
      setDisplayedText(text); // Mostrar todo si se detiene
      if (onComplete) onComplete();
      return;
    }

    if (currentIndex < text.length) {
      const char = text[currentIndex];
      // Si detectamos un salto de línea doble, hacemos una pausa más larga
      const isParagraphEnd = text.slice(currentIndex, currentIndex + 2) === "\n\n";
      const delay = isParagraphEnd ? 300 : 15;

      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + char);
        setCurrentIndex(prev => prev + 1);
      }, delay);
      
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete, isStopped]);

  return <div className="whitespace-pre-wrap">{displayedText}</div>;
};

const ABAPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hola, soy el Analista Experto ABA de Herbie. 🧠 Puedo ayudarte a realizar análisis funcionales (ABC), identificar contingencias o consultar protocolos basados en tus manuales. ¿Qué caso o conducta quieres analizar hoy?",
      timestamp: new Date(),
      isExpert: true
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isGlobalStop, setIsGlobalStop] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'all' | 'teoria' | 'practica' | 'teorico_practico'>('all');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [rateLimitUntil, setRateLimitUntil] = useState<Date | null>(null);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rateLimitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rate limit countdown
  useEffect(() => {
    if (rateLimitUntil) {
      const update = () => {
        const secondsLeft = Math.max(0, Math.ceil((rateLimitUntil.getTime() - Date.now()) / 1000));
        setRateLimitCountdown(secondsLeft);
        if (secondsLeft <= 0) {
          setRateLimitUntil(null);
          if (rateLimitTimerRef.current) clearInterval(rateLimitTimerRef.current);
        }
      };
      update();
      rateLimitTimerRef.current = setInterval(update, 1000);
    }
    return () => { if (rateLimitTimerRef.current) clearInterval(rateLimitTimerRef.current); };
  }, [rateLimitUntil]);

  // Start/stop elapsed timer
  useEffect(() => {
    if (isTyping) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTyping]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setIsGlobalStop(false);

    try {
      const response = await fetch('/api/clinical-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          category: selectedMode,
          expert: 'all'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Manejo específico de rate limit 429
        if (response.status === 429 && errorData.retryAt) {
          setRateLimitUntil(new Date(errorData.retryAt));
        }
        throw new Error(errorData.text || "⚠️ No he podido conectar con mi base de conocimientos. ¿Podrías reintentarlo?");
      }
      
      const data = await response.json();

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.text,
        timestamp: new Date(),
        isExpert: true,
        isStreaming: true
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: error.message || "⚠️ Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-background">
      <div className="flex items-center gap-3 p-4 border-b bg-card/50 backdrop-blur-md sticky top-0 z-20">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-primary" /> Cerebro Experto ABA
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Análisis Funcional Activo</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-full">
            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
            <span className="text-[10px] font-bold text-primary">RAG-ON</span>
          </div>
        </div>
      </div>


      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-card border border-border/50 rounded-tl-none text-foreground"
                }`}
              >
                {msg.isStreaming ? (
                  <TypewriterText 
                    text={msg.content} 
                    isStopped={isGlobalStop}
                    onComplete={() => {
                      setMessages(prev => prev.map(m => 
                        m.id === msg.id ? { ...m, isStreaming: false } : m
                      ));
                      if (msg.id === messages[messages.length - 1].id) {
                        setIsGlobalStop(false);
                      }
                    }} 
                  />
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
                {msg.isExpert && (
                  <div className="mt-3 pt-2 border-t border-border/50 text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" /> 
                    Conocimiento extraído del Cerebro Clínico
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Stop Button Inside Chat */}
          <AnimatePresence>
            {(isTyping || messages.some(m => m.isStreaming)) && !isGlobalStop && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex justify-center items-center gap-3 pt-2"
              >
                {isTyping && (
                  <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                    ⏱ {elapsedSeconds}s
                  </span>
                )}
                <button
                  onClick={() => setIsGlobalStop(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-full text-xs font-bold hover:bg-destructive/20 transition-all shadow-sm"
                >
                  <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                  Detener Herbie
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </AnimatePresence>
      </div>

      {/* Input: sticky bottom container */}
      <div className="sticky bottom-0 z-10 bg-background border-t">
        {/* Input Area */}
        <div className="p-4 pb-24 lg:pb-6">

          {/* Rate limit banner */}
          <AnimatePresence>
            {rateLimitUntil && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2 max-w-lg mx-auto"
              >
                <span className="text-base">⚠️</span>
                <div>
                  <p className="font-bold">Límite de consultas alcanzado</p>
                  <p>Podrás escribir de nuevo en <span className="font-mono font-bold">{rateLimitCountdown}s</span> — a las <span className="font-mono">{rateLimitUntil.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group max-w-lg mx-auto">
            {(() => {
              const isBlocked = isTyping || messages.some(m => m.isStreaming) || !!rateLimitUntil;
              return (
                <>
                  <textarea
                    value={input}
                    onChange={(e) => !isBlocked && setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !isBlocked) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={isBlocked}
                    placeholder={
                      rateLimitUntil
                        ? `⚠️ Límite alcanzado. Disponible en ${rateLimitCountdown}s (${rateLimitUntil.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })})`
                        : isBlocked
                        ? `Herbie lleva ${elapsedSeconds}s respondiendo... detén primero a Herbie para escribir.`
                        : "Describe un caso para analizar..."
                    }
                    className={`w-full rounded-2xl px-5 py-4 text-sm focus:outline-none transition-all resize-none pr-14 border ${
                      isBlocked
                        ? "bg-muted/30 border-border/30 text-muted-foreground cursor-not-allowed opacity-60"
                        : "bg-muted/50 hover:bg-muted border-border/50 focus:ring-2 focus:ring-primary/20"
                    }`}
                    rows={2}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isBlocked}
                    className="absolute right-3 bottom-3 p-2.5 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ABAPage;
