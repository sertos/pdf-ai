import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

export const AuthPage = ({ type }: { type: 'login' | 'register' }) => {
  const { t } = useLanguage();
  const isLogin = type === 'login';
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-950">
      {/* Left panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 xl:px-32">
        <div className="max-w-md w-full mx-auto">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight mb-12">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <FileText size={20} />
            </div>
            {t('app.name')}
          </Link>

          <h1 className="text-3xl font-bold mb-2">
            {isLogin ? t('auth.login.title') : t('auth.register.title')}
          </h1>
          <p className="text-neutral-500 mb-8">
            {isLogin ? t('auth.login.subtitle') : t('auth.subtitle.register')}
          </p>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-medium border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors mb-6"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25C22.56 11.4 22.48 10.59 22.34 9.81H12V14.43H17.92C17.67 15.93 16.8 17.2 15.54 18.04V21H19.09C21.17 19.09 22.56 15.95 22.56 12.25Z" fill="#4285F4"/>
              <path d="M12 23C14.97 23 17.46 22.02 19.09 21L15.54 18.04C14.66 18.63 13.43 19 12 19C9.23 19 6.88 17.13 6.04 14.61H2.38V17.51C4.16 21 7.78 23 12 23Z" fill="#34A853"/>
              <path d="M6.04 14.61C5.83 14 5.71 13.33 5.71 12.64C5.71 11.95 5.83 11.28 6.04 10.67V7.77H2.38C1.65 9.21 1.25 10.87 1.25 12.64C1.25 14.41 1.65 16.07 2.38 17.51L6.04 14.61Z" fill="#FBBC05"/>
              <path d="M12 6.27C13.62 6.27 15.07 6.83 16.21 7.91L19.16 4.96C17.45 3.37 14.97 2.27 12 2.27C7.78 2.27 4.16 4.27 2.38 7.77L6.04 10.67C6.88 8.16 9.23 6.27 12 6.27Z" fill="#EA4335"/>
            </svg>
            {t('auth.google')}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300 dark:border-neutral-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-neutral-950 text-neutral-500">{t('auth.or')}</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 text-red-600 p-3 rounded-lg text-sm border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('auth.fullName')}</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('auth.email')}</label>
              <input 
                type="email" 
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('auth.password')}</label>
              <input 
                type="password" 
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <Link 
              to="/dashboard"
              className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mt-6"
            >
              {isLogin ? t('auth.login.button') : t('auth.register.button')}
            </Link>
          </form>

          <div className="mt-8 text-center text-sm text-neutral-500">
            {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
            <Link to={isLogin ? "/register" : "/login"} className="font-medium text-blue-600 hover:text-blue-500">
              {isLogin ? t('auth.signup') : t('auth.login')}
            </Link>
          </div>
        </div>
      </div>

      {/* Right panel - Image/Brand */}
      <div className="hidden lg:flex w-1/2 bg-neutral-50 dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 items-center justify-center relative overflow-hidden">
        {/* Abstract shapes or branding illustration could go here */}
        <div className="absolute w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl -top-40 -right-40" />
        <div className="absolute w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl bottom-0 left-0" />
        
        <div className="relative z-10 max-w-lg text-center">
           <div className="w-24 h-24 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-2xl">
             <FileText size={48} className="text-blue-500" />
           </div>
           <h2 className="text-4xl font-bold tracking-tight mb-4 text-balance">{t('auth.hero.title')}</h2>
           <p className="text-lg text-neutral-600 dark:text-neutral-400">{t('auth.hero.subtitle')}</p>
        </div>
      </div>
    </div>
  );
};
