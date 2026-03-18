import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, GraduationCap, CheckCircle2, ChevronRight, Sparkles, Loader2, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

interface LearningStep {
  content: string;
  question: string;
  answer: string;
  prompt: string;
}

interface LearningProgram {
  concept: string;
  steps: LearningStep[];
}

const LearningMode = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [concept, setConcept] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [program, setProgram] = useState<LearningProgram | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);

  const currentStep = program?.steps[currentStepIndex];

  const handleGenerate = async () => {
    if (!concept.trim()) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/decompose-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept })
      });
      if (!response.ok) throw new Error("Error al generar el programa");
      const data = await response.json();
      setProgram(data);
      setCurrentStepIndex(0);
      setUserAnswer("");
      setShowFeedback(false);
      setShowPrompt(true);
      toast.success(t('learn.generate_success'));
    } catch (error) {
      console.error(error);
      toast.error(t('learn.generate_error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCheckAnswer = () => {
    if (!currentStep) return;
    
    const normalizedUser = userAnswer.trim().toLowerCase();
    const normalizedCorrect = currentStep.answer.trim().toLowerCase();
    
    const correct = normalizedUser.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedUser);
    
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setTimeout(() => {
        if (currentStepIndex < program!.steps.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
          setUserAnswer("");
          setShowFeedback(false);
          // Fading prompts: Show prompt for the first 3 steps, then hide it
          setShowPrompt(currentStepIndex < 2);
        } else {
          toast.success(t('learn.complete_success') + program?.concept);
        }
      }, 1500);
    }
  };

  return (
    <div className="px-4 pt-4 pb-24 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/")} className="p-2 hover:bg-muted rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">{t('learn.title')}</h1>
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{t('learn.skinner_method')}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!program ? (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="herbie-card p-6 bg-primary/5 border-primary/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-sm font-bold">{t('learn.search_title')}</h2>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    placeholder={t('learn.search_placeholder')}
                    className="w-full bg-background border border-muted rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !concept.trim()}
                  className="w-full h-12 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {t('learn.search_btn')}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-dashed border-muted flex gap-3 italic">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                {t('learn.skinner_desc')}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="learning"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('learn.progress_label')}: {program.concept}</span>
                <span className="text-xs font-bold text-primary">{currentStepIndex + 1} / {program.steps.length}</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStepIndex + 1) / program.steps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Learning Frame */}
            <motion.div 
              key={currentStepIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="herbie-card p-6 space-y-6 shadow-xl border-primary/5 min-h-[300px] flex flex-col justify-center"
            >
              <div className="space-y-4">
                <p className="text-base font-medium text-foreground leading-relaxed">
                  {currentStep?.content}
                </p>
                
                <div className="h-px bg-muted/50 w-full" />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-primary italic">" {currentStep?.question} "</h3>
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder={t('learn.placeholder')}
                        className="w-full bg-muted/30 border-b-2 border-primary/20 rounded-t-lg px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleCheckAnswer()}
                        disabled={showFeedback && isCorrect}
                      />
                      
                      {showPrompt && !showFeedback && (
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute -top-6 right-0 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-tighter"
                        >
                          {t('learn.help_label')}: {currentStep?.prompt}
                        </motion.p>
                      )}
                    </div>

                    <AnimatePresence>
                      {showFeedback && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold ${
                            isCorrect ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {isCorrect ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              {t('learn.feedback_correct')}
                            </>
                          ) : (
                            <>
                              <Info className="w-4 h-4" />
                              {t('learn.feedback_hint')}{currentStep?.answer}{t('learn.feedback_hint_end')}
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!isCorrect && (
                      <button
                        onClick={handleCheckAnswer}
                        disabled={!userAnswer.trim()}
                        className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                      >
                        {t('learn.check_btn')} <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            <button 
              onClick={() => setProgram(null)}
              className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mx-auto block"
            >
              {t('learn.abandon_btn')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LearningMode;
