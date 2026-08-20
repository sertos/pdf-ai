import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Database, User, Bell, Palette } from 'lucide-react';

export const SettingsPage = () => {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 space-y-1">
          {/* Settings Tabs nav Placeholder */}
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
            <User size={18} />
            {t('settings.profile')}
          </button>
           <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <Database size={18} />
            {t('settings.database')}
          </button>
        </div>

        <div className="col-span-1 md:col-span-3 space-y-6">
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">{t('settings.profile')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('auth.fullName')}</label>
                <input 
                  type="text" 
                  defaultValue="John Doe"
                  className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('auth.email')}</label>
                <input 
                  type="email" 
                  defaultValue="john@example.com"
                  className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                {t('settings.save')}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">{t('settings.database')}</h2>
            <p className="text-neutral-500 text-sm mb-6">{t('settings.database.desc')}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('settings.dbUrl')}</label>
                 <input 
                  type="password" 
                  placeholder="postgresql://..."
                  className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <label className="block text-sm font-medium mb-1.5 focus:border-blue-500 outline-none">{t('settings.firebaseConfig')}</label>
                <textarea 
                  rows={4}
                  placeholder='{"apiKey": "...", "projectId": "..."}'
                  className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm resize-none"
                ></textarea>
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800/30">
                {t('settings.dbDisclaimer')}
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                {t('settings.save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
