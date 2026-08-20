import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { motion } from 'framer-motion';
import { FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingPage = () => {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="container mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <FileText size={20} />
          </div>
          {t('app.name')}
        </div>
        
        <div className="flex items-center gap-6">
           <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${language === 'en' ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'text-neutral-500'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('es')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${language === 'es' ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'text-neutral-500'}`}
              >
                ES
              </button>
            </div>
          <Link to="/login" className="text-sm font-medium hover:text-blue-600 transition-colors">
            {t('nav.login')}
          </Link>
          <Link to="/register" className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
            {t('nav.register')}
          </Link>
        </div>
      </header>

      <main>
        <section className="pt-32 pb-24 container mx-auto px-6 text-center max-w-4xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-8"
          >
            {t('landing.hero.title')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-neutral-600 dark:text-neutral-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            {t('landing.hero.subtitle')}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              {t('landing.hero.cta')}
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </section>

        <section className="py-24 bg-neutral-50 dark:bg-neutral-900">
          <div className="container mx-auto px-6 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-16">{t('landing.features.title')}</h2>
            
            <div className="grid md:grid-cols-3 gap-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-neutral-950 p-8 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{t('landing.feature.ai')}</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {t('landing.feature.ai.desc')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
