import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Sparkles, X, Send, FileText } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useDocumentContext } from '../context/DocumentContext';

export const AIFloatingAssistant = () => {
  const { t, language } = useLanguage();
  const { activeDoc } = useDocumentContext();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  
  const initialGreeting = activeDoc 
    ? t('ai.greetingActive').replace('{filename}', activeDoc.name)
    : t('ai.greeting');

  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }>([
    { role: 'ai', content: initialGreeting }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Update initial greeting on doc change or language change if conversation is just initial
    if (messages.length === 1) {
      setMessages([{
        role: 'ai',
        content: activeDoc 
          ? t('ai.greetingActive').replace('{filename}', activeDoc.name)
          : t('ai.greeting')
      }]);
    }
  }, [activeDoc?.id, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isTyping) return;
    
    const userMessage = message.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setMessage('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
          fileBase64: activeDoc?.base64,
          documentSummary: activeDoc?.summary,
          lang: language
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'ai', content: data.content }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: language === 'en' ? "Failed to connect to AI. Please try again." : "No se pudo conectar con la IA. Por favor reintenta." }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: language === 'en' ? "Error connecting to server." : "Error de conexión con el servidor." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-16 right-0 w-84 md:w-96 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              style={{ height: '460px' }}
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3.5 text-white flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} />
                  <div>
                    <span className="font-semibold text-xs block">{t('ai.title')}</span>
                    {activeDoc && (
                      <span className="text-[10px] text-blue-100 flex items-center gap-1">
                        <FileText size={10} /> {activeDoc.name}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-neutral-50 dark:bg-neutral-950/50 space-y-3">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`p-3 rounded-2xl text-xs max-w-[90%] leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-sm' 
                          : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-tl-sm shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="p-3 rounded-2xl text-xs max-w-[90%] bg-white dark:bg-neutral-800 text-neutral-500 rounded-tl-sm shadow-sm flex gap-1 items-center">
                       <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"></span>
                       <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce delay-75"></span>
                       <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce delay-150"></span>
                       <span className="ml-1 text-[11px] font-medium">{t('ai.thinking')}</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
                <form 
                  onSubmit={handleSubmit}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('ai.placeholder')}
                    className="flex-1 bg-neutral-100 dark:bg-neutral-800 border-transparent rounded-full px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="submit" className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shrink-0">
                    <Send size={14} className="-ml-0.5 mt-0.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105 active:scale-95 ${
            isOpen ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
          }`}
        >
          {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </button>
      </div>
    </>
  );
};
