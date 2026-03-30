import { useState, useRef, useEffect } from "react";
import { Brain, Send, Loader2, ArrowLeft, BrainCircuit, Sparkles, MessageCircle, HelpCircle, Activity, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

const ABAPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'guided'>('chat');
  const [activeStep, setActiveStep] = useState(0); // 0: no empezado, 1-6: pasos del protocolo
  const scrollRef = useRef<HTMLDivElement>(null);

  const steps = [
    { id: 1, name: "Topografía", color: "from-blue-500 to-blue-600", desc: "Definición física y observable de la conducta blanco." },
    { id: 2, name: "Antecedentes", color: "from-indigo-500 to-indigo-600", desc: "Identificación de Estímulos Discriminativos (SD) y Operaciones de Establecimiento (MO)." },
    { id: 3, name: "Consecuencias", color: "from-cyan-500 to-cyan-600", desc: "Identificación de refuerzos y castigos inmediatos." },
    { id: 4, name: "Función", color: "from-violet-500 to-violet-600", desc: "Hipótesis de la función (Atención, Tangible, Escape, Automático)." },
    { id: 5, name: "Reemplazo", color: "from-purple-500 to-purple-600", desc: "Elección de una conducta funcionalmente equivalente." },
    { id: 6, name: "Intervención", color: "from-rose-500 to-rose-600", desc: "Diseño del plan antecedente y consecuente." }
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const startGuidedMode = () => {
    setMessages([]);
    setMode('guided');
    setActiveStep(1);
    const initialMsg = { 
      role: "assistant", 
      content: "¡Hola! He activado el **Consultor ABA Guiado**. Vamos a realizar un Análisis Funcional paso a paso siguiendo el rigor de Froxán Parga. \n\n**Paso 1: Topografía de la Respuesta.** Por favor, describe la conducta de forma física y observable. ¿Qué hace exactamente la persona? Evita etiquetas como 'agresividad' o 'ansiedad'."
    };
    setMessages([initialMsg]);
  };

  const resetToChat = () => {
    setMessages([]);
    setMode('chat');
    setActiveStep(0);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      let finalMessageContent = input;
      let finalCategory = "practica";

      if (mode === 'guided') {
        finalCategory = "aba_expert";
        const stepInfo = steps.find(s => s.id === activeStep);
        finalMessageContent = `[PASO ${activeStep}: ${stepInfo?.name}] El usuario dice: ${input}. 
        IMPORTANTE: Si la información es suficiente, avanza al siguiente paso clínico. Si es vaga, exige más detalle antes de pasar al paso ${activeStep + 1}.`;
      }

      const response = await fetch("/api/clinical-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, { ...userMessage, content: finalMessageContent }],
          category: finalCategory,
          expert: "aba",
          source: [
            "Análisis-funcional-de-la-conducta-humana_-Concepto_-Froxán-Parga_-María-Xesús-2020-Ediciones-Pirámid.pdf",
            "L_AnalisisConductualAplicado-2009.pdf"
          ]
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.text || "Error");

      setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);

      // Lógica simple de progresión (puede ser mejorada si la IA devuelve un flag, pero por ahora detectamos 'Siguiente paso' o similar)
      if (mode === 'guided' && (data.text.toLowerCase().includes("pasamos al") || data.text.toLowerCase().includes("siguiente paso") || data.text.toLowerCase().includes("paso " + (activeStep + 1)))) {
        if (activeStep < 6) setActiveStep(prev => prev + 1);
      }

    } catch (error: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Lo siento, hubo un error técnico." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden relative">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/80 backdrop-blur-2xl flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-2xl herbie-gradient flex items-center justify-center shadow-lg transition-transform ${mode === 'guided' ? 'scale-110 shadow-primary/30' : 'opacity-80'}`}>
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-foreground uppercase tracking-wider leading-none">
                {mode === 'guided' ? "Consultor ABA" : "Cerebro ABA"}
              </h1>
              <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-tighter opacity-70">
                {mode === 'guided' ? `MODO GUIADO · PASO ${activeStep} DE 6` : "MODO CHAT LIBRE"}
              </p>
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-muted/50 p-1 rounded-2xl border border-border/50 backdrop-blur-sm self-center">
          <button 
            onClick={resetToChat}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${mode === 'chat' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground'}`}
          >
            Chat
          </button>
          <button 
            onClick={startGuidedMode}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${mode === 'guided' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground'}`}
          >
            Guiado
          </button>
        </div>
      </div>

      {/* Progress Bar (Only in Guided Mode) */}
      {mode === 'guided' && (
        <div className="w-full h-1 bg-muted flex">
          {steps.map(s => (
            <div 
              key={s.id} 
              className={`flex-1 transition-all duration-500 h-full ${activeStep >= s.id ? `bg-gradient-to-r ${s.color}` : 'opacity-20 bg-muted-foreground'}`}
            />
          ))}
        </div>
      )}

      {/* Content Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-32"
      >
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center text-center space-y-8 px-6 mt-12"
            >
              <div className="w-24 h-24 rounded-[2.5rem] bg-primary/5 flex items-center justify-center relative shadow-inner">
                <Brain className="w-12 h-12 text-primary opacity-20" />
                <Sparkles className="w-8 h-8 text-primary absolute -top-2 -right-2 animate-pulse" />
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-black text-foreground tracking-tight">Elige tu enfoque ABA</h3>
                <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed font-medium">
                  Puedo ser un tutor teórico o acompañarte paso a paso en un análisis funcional riguroso.
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button 
                  onClick={startGuidedMode}
                  className="w-full p-6 text-left group herbie-gradient rounded-3xl transition-all shadow-xl shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-1 active:scale-95"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <Activity className="w-6 h-6 text-white" />
                    <span className="text-sm font-black text-white uppercase tracking-wider">Modo Guiado</span>
                  </div>
                  <p className="text-xs text-white/70 font-medium leading-relaxed">Inicia un Análisis Funcional de 6 pasos basado en protocolos clínicos oficiales.</p>
                </button>

                <button 
                  onClick={resetToChat}
                  className="w-full p-5 text-left bg-card border border-border/50 rounded-3xl hover:bg-muted/30 transition-all flex items-center gap-4 group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase text-foreground">Chat Libre</span>
                    <span className="text-[10px] text-muted-foreground font-medium">Consulta teorías o casos sin protocolos rígidos.</span>
                  </div>
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] p-5 rounded-[2rem] text-sm leading-relaxed shadow-lg ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none shadow-primary/20 font-medium"
                        : "bg-white dark:bg-card border border-border/50 text-card-foreground rounded-tl-none ring-1 ring-black/5"
                    }`}
                  >
                    {msg.content.split('\n').map((line, j) => (
                      <p key={j} className={line.trim() ? "mb-2" : "mb-4"}>{line}</p>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-card/50 backdrop-blur-md border border-border/50 p-4 rounded-3xl rounded-tl-none flex items-center gap-3 shadow-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map(dot => (
                  <motion.div
                    key={dot}
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: dot * 0.2 }}
                    className="w-1.5 h-1.5 bg-primary rounded-full"
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                Herbie está analizando...
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-gradient-to-t from-background via-background to-transparent border-none z-20 sticky bottom-0">
        <div className="max-w-2xl mx-auto flex gap-3 items-center">
          <div className="relative flex-1 group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={mode === 'guided' ? `Escribe aquí tu respuesta para el Paso ${activeStep}...` : "Escribe tu consulta sobre ABA..."}
              className="w-full bg-card/80 backdrop-blur-xl border border-border/50 rounded-[1.5rem] px-6 text-sm focus:ring-4 ring-primary/10 outline-none h-14 shadow-2xl transition-all group-hover:border-primary/30"
            />
            {mode === 'guided' && (
              <div className={`absolute left-0 -top-12 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg bg-gradient-to-r ${steps[activeStep - 1]?.color} transition-all`}>
                Enfoque: {steps[activeStep - 1]?.name}
              </div>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-14 h-14 herbie-gradient text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-primary/30 disabled:opacity-50 active:scale-90 transition-all hover:rotate-6"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ABAPage;
