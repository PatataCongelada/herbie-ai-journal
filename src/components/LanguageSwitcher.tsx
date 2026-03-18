import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

const LanguageSwitcher: React.FC = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="fixed top-4 right-4 z-[60] flex items-center bg-card/80 backdrop-blur-md border border-border p-1 rounded-full shadow-lg">
      <button
        onClick={() => setLang('es')}
        className={`relative px-3 py-1 text-xs font-bold transition-colors ${
          lang === 'es' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {lang === 'es' && (
          <motion.div
            layoutId="lang-bg"
            className="absolute inset-0 bg-primary rounded-full -z-10"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
        ES
      </button>
      <button
        onClick={() => setLang('en')}
        className={`relative px-3 py-1 text-xs font-bold transition-colors ${
          lang === 'en' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {lang === 'en' && (
          <motion.div
            layoutId="lang-bg"
            className="absolute inset-0 bg-primary rounded-full -z-10"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
