import { useState } from "react";
import { ArrowLeft, Brain, FileDown, Loader2, Sparkles, BookOpen, ChevronDown, ChevronRight, AlertCircle, FlaskConical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ToolDesign, generateDesignPdf } from "@/lib/generateDesignPdf";

const AVAILABLE_MANUALS = [
  { label: "Todos los manuales", value: "" },
  { label: "Covert Conditioning Handbook (Cautela)", value: "Covert_Conditioning_Handbook.pdf" },
  { label: "ABA — Tratamiento basado en evidencia", value: "Tratamiento-basado-ABA.Guia-de-practica-clinica.pdf" },
  { label: "Modificación de Conducta", value: "modificacion de conducta que es y como aplicarla.pdf" },
];

const ArchitectPage = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [design, setDesign] = useState<ToolDesign | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error("Escribe el nombre del protocolo o técnica"); return; }
    setIsGenerating(true);
    setDesign(null);

    try {
      const response = await fetch("/api/architect-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), source: source || undefined }),
      });

      const data = await response.json();

      if (response.status === 429) {
        setRateLimitSeconds(30);
        toast.error("Límite de IA alcanzado. Espera un momento.");
        return;
      }

      if (!response.ok) throw new Error(data.error || "Error generando la especificación");

      setDesign(data.design);
      setMeta(data.meta);
      setExpandedSteps([0]); // Open first step
      toast.success("¡Especificación generada correctamente!");
    } catch (error: any) {
      console.error(error);
      toast.error("Error al generar: " + (error.message || "Inténtalo de nuevo"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!design || !meta) return;
    setIsDownloading(true);
    try {
      generateDesignPdf(design, meta);
      toast.success("PDF descargado correctamente");
    } catch (e) {
      toast.error("Error generando el PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleStep = (idx: number) => {
    setExpandedSteps(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/settings")} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-violet-500" />
            </div>
            <h1 className="text-xs font-black text-foreground uppercase tracking-wider">Laboratorio de Diseño Clínico</h1>
          </div>
        </div>
        {design && (
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="flex items-center gap-2 bg-violet-500 text-white text-xs font-black px-4 py-2 rounded-xl shadow-lg shadow-violet-500/20 active:scale-95 transition-transform disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
            Exportar PDF
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Input Panel */}
        <div className="p-6 max-w-2xl mx-auto w-full space-y-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="text-sm text-muted-foreground leading-relaxed">
              Escribe el nombre de un protocolo clínico y Herbie consultará los manuales para generar una especificación completa de herramienta: pasos, campos, guión del asistente y justificación clínica.
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-violet-500 px-1">Protocolo o Técnica</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="Ej: Condicionamiento Encubierto, Economía de Fichas, Desensibilización Sistemática..."
                className="w-full bg-card border border-border/50 rounded-2xl px-4 h-14 text-sm font-medium outline-none shadow-sm focus:ring-2 ring-violet-500/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-violet-500 px-1">Manual de Referencia</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-card border border-border/50 rounded-2xl px-4 h-12 text-sm font-medium outline-none shadow-sm focus:ring-2 ring-violet-500/20 cursor-pointer"
              >
                {AVAILABLE_MANUALS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="w-full h-14 bg-violet-500 text-white rounded-2xl shadow-xl shadow-violet-500/20 flex items-center justify-center gap-3 font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 text-sm"
            >
              {isGenerating ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Consultando manuales...</>
              ) : (
                <><Brain className="w-5 h-5" /> Generar Especificación</>
              )}
            </button>

            {rateLimitSeconds && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-amber-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>Límite de IA alcanzado. Espera {rateLimitSeconds}s antes de intentar de nuevo.</p>
              </div>
            )}
          </motion.div>

          {/* Results */}
          <AnimatePresence>
            {design && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5 pb-32"
              >
                {/* Tool Header */}
                <div className="p-6 bg-violet-500/5 border border-violet-500/10 rounded-[2rem] space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-violet-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-500">Herramienta Generada</span>
                  </div>
                  <h2 className="text-xl font-black text-foreground">{design.tool_name}</h2>
                  <p className="text-xs text-muted-foreground font-medium">📖 {design.manual_source}</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{design.protocol_overview}</p>

                  {/* Stats */}
                  <div className="flex gap-3 pt-2">
                    <div className="flex-1 bg-card rounded-xl p-3 text-center border border-border/50">
                      <p className="text-2xl font-black text-violet-500">{design.steps.length}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Pasos</p>
                    </div>
                    <div className="flex-1 bg-card rounded-xl p-3 text-center border border-border/50">
                      <p className="text-2xl font-black text-violet-500">{design.steps.reduce((a, s) => a + (s.fields?.length || 0), 0)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Campos</p>
                    </div>
                    <div className="flex-1 bg-card rounded-xl p-3 text-center border border-border/50">
                      <p className="text-2xl font-black text-violet-500">{design.clinical_basis?.length || 0}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Citas</p>
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-violet-500 px-1">Wizard de Pasos</label>
                  {design.steps.map((step, idx) => (
                    <div key={idx} className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => toggleStep(idx)}
                        className="w-full p-4 flex items-center gap-3 text-left"
                      >
                        <div className="w-8 h-8 rounded-xl bg-violet-500 text-white flex items-center justify-center font-black text-sm flex-shrink-0">
                          {step.step_number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{step.name}</p>
                          <p className="text-xs text-muted-foreground">{step.fields?.length || 0} campos</p>
                        </div>
                        <motion.div animate={{ rotate: expandedSteps.includes(idx) ? 180 : 0 }}>
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {expandedSteps.includes(idx) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-4 border-t border-border/30 pt-4">
                              <p className="text-xs text-foreground/70 leading-relaxed">{step.description}</p>

                              {/* User Prompt */}
                              <div className="bg-violet-500/5 rounded-xl p-3 space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-violet-500">Instrucción al usuario</span>
                                <p className="text-xs text-foreground/80">{step.user_prompt}</p>
                              </div>

                              {/* Bot Guidance */}
                              <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Brain className="w-3 h-3" /> Guión de Herbie (Bot)</span>
                                <p className="text-xs text-foreground/80 leading-relaxed">{step.bot_guidance}</p>
                              </div>

                              {/* Fields */}
                              {step.fields && step.fields.length > 0 && (
                                <div className="space-y-2">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Campos del formulario</span>
                                  {step.fields.map((field, fi) => (
                                    <div key={fi} className="flex items-start gap-3 bg-background rounded-xl p-3 border border-border/30">
                                      <ChevronRight className="w-3 h-3 text-violet-500 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-foreground">{field.label}</span>
                                          <span className="text-[9px] bg-violet-500/10 text-violet-500 font-black px-1.5 py-0.5 rounded-full uppercase">{field.type}</span>
                                          {field.required && <span className="text-[9px] text-red-500 font-bold">*</span>}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{field.clinical_rationale || field.placeholder}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                {/* Clinical Basis */}
                {design.clinical_basis && design.clinical_basis.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-violet-500 px-1">Justificación Clínica</label>
                    <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-3">
                      {design.clinical_basis.map((quote, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-0.5 bg-violet-500/40 rounded-full flex-shrink-0" />
                          <p className="text-xs text-foreground/70 leading-relaxed italic">"{quote}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Download CTA */}
                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="w-full h-16 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-2xl shadow-xl shadow-violet-500/20 flex items-center justify-center gap-3 font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 text-sm"
                >
                  {isDownloading ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileDown className="w-6 h-6" />}
                  Descargar Especificación en PDF
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ArchitectPage;
