import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BrainCircuit, Sparkles, Target, Zap, Microscope, Send, Loader2, Brain, BookOpen } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isExpert?: boolean;
}

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
  const [selectedExpert, setSelectedExpert] = useState<'all' | 'tomas' | 'froxan'>('all');
  const [selectedMode, setSelectedMode] = useState<'all' | 'teoria' | 'practica'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

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

    try {
      const response = await fetch('/api/clinical-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          category: selectedMode,
          expert: selectedExpert
        })
      });

      if (!response.ok) throw new Error("Error en la conexión");
      
      const data = await response.json();

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.text,
        timestamp: new Date(),
        isExpert: true
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "⚠️ No he podido conectar con mi base de conocimientos. ¿Podrías reintentarlo?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
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

      {/* Control Center */}
      <div className="bg-card border-b p-3 flex flex-wrap gap-4 items-center justify-center sm:justify-start overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Experto:</span>
          <div className="flex bg-muted rounded-lg p-0.5">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'tomas', label: 'Tomás' },
              { id: 'froxan', label: 'Froxán' }
            ].map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedExpert(e.id as any)}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                  selectedExpert === e.id 
                    ? "bg-background shadow-sm text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-4 w-px bg-border hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Foco:</span>
          <div className="flex bg-muted rounded-lg p-0.5">
            {[
              { id: 'all', label: 'Todo' },
              { id: 'teoria', label: 'Teoría' },
              { id: 'practica', label: 'Práctica' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMode(m.id as any)}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                  selectedMode === m.id 
                    ? "bg-background shadow-sm text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
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
                {msg.content}
                {msg.isExpert && (
                  <div className="mt-3 pt-2 border-t border-border/50 text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" /> 
                    Contenido extraído de: {selectedExpert === 'all' ? 'Manuales Clínicos' : selectedExpert === 'tomas' ? 'Tomás Carrasco' : 'Froxán et al.'}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-start"
            >
              <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-none">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ABC Model Hint (Floating) */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t bg-background/50 backdrop-blur-sm">
        {[
          { icon: Target, label: "Situación/A", color: "text-blue-500 bg-blue-500/10" },
          { icon: Zap, label: "Conducta/B", color: "text-amber-500 bg-amber-500/10" },
          { icon: Microscope, label: "Consecuente/C", color: "text-emerald-500 bg-emerald-500/10" },
        ].map((hint, i) => (
          <button 
            key={i} 
            onClick={() => setInput(prev => prev + (prev ? " " : "") + hint.label + ": ")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap text-[10px] font-bold border border-transparent hover:border-current transition-all ${hint.color}`}
          >
            <hint.icon className="w-3 h-3" />
            {hint.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t pb-24 lg:pb-8">
        <div className="relative group max-w-lg mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Describe un caso para analizar..."
            className="w-full bg-muted/50 hover:bg-muted rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none pr-14 border border-border/50"
            rows={2}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="absolute right-3 bottom-3 p-2.5 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ABAPage;
