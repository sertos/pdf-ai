import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Check, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const PricingPage = () => {
  const { t } = useLanguage();
  const [annual, setAnnual] = useState(true);

  const tiers = [
    {
      name: 'Starter',
      price: annual ? 0 : 0,
      description: 'Perfect for individuals and students.',
      features: ['5 documents per month', 'Basic summaries', 'Up to 10 pages per PDF', 'Email support'],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Pro',
      price: annual ? 12 : 15,
      description: 'For professionals needing deep insights.',
      features: ['Unlimited documents', 'Advanced AI extraction', 'Up to 500 pages per PDF', 'Priority support', 'Export to Word/PDF', 'API Access'],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Team',
      price: annual ? 39 : 49,
      description: 'Built for collaborative workspaces.',
      features: ['Everything in Pro', '5 Team members', 'Shared workspaces', 'Centralized billing', 'Admin dashboard', 'Custom integrations'],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight mb-4">{t('pricing.title')}</h1>
        <p className="text-xl text-neutral-600 dark:text-neutral-400">{t('pricing.subtitle')}</p>
        
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${!annual ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500'}`}>
            {t('pricing.monthly')}
          </span>
          <button 
            onClick={() => setAnnual(!annual)}
            className="w-14 h-7 bg-blue-600 rounded-full relative flex items-center px-1 transition-colors"
          >
            <motion.div 
              className="w-5 h-5 bg-white rounded-full shadow-sm"
              animate={{ x: annual ? 28 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`text-sm font-medium ${annual ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500'}`}>
            {t('pricing.yearly')} <span className="text-emerald-500 text-xs ml-1 font-bold">{t('pricing.save')}</span>
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 pt-8">
        {tiers.map((tier, idx) => (
          <div 
            key={idx} 
            className={`relative p-8 rounded-3xl border ${tier.popular ? 'border-blue-500 shadow-xl bg-white dark:bg-neutral-950 scale-105 z-10' : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900'}`}
          >
            {tier.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Zap size={14} /> Most Popular
              </div>
            )}
            
            <h3 className="text-xl font-bold">{tier.name}</h3>
            <p className="text-neutral-500 text-sm mt-2">{tier.description}</p>
            
            <div className="mt-6 mb-8">
              <span className="text-5xl font-extrabold">${tier.price}</span>
              <span className="text-neutral-500">/mo</span>
            </div>
            
            <button className={`w-full py-3 rounded-full font-medium transition-colors mb-8 ${tier.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-300 dark:hover:bg-neutral-700'}`}>
              {tier.cta}
            </button>
            
            <ul className="space-y-4">
              {tier.features.map((feature, fIdx) => (
                <li key={fIdx} className="flex items-start gap-3 text-sm">
                  <Check size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
