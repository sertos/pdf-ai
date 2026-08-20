import React, { useCallback, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDocumentContext } from '../context/DocumentContext';

export const UploadPage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { uploadAndProcess } = useDocumentContext();
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 50 * 1024 * 1024 // 50MB
  } as any);

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    if (files.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setStatusText(t('upload.extracting'));

    try {
      for (let i = 0; i < files.length; i++) {
        const stepMsg = t('upload.processingStep')
          .replace('{current}', String(i + 1))
          .replace('{total}', String(files.length))
          .replace('{filename}', files[i].name);
        setStatusText(stepMsg);
        await uploadAndProcess(files[i], language);
      }
      setIsProcessing(false);
      navigate('/documents');
    } catch (err) {
      console.error("Upload process error", err);
      setIsProcessing(false);
      navigate('/documents');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('upload.title')}</h1>
        <p className="text-neutral-500 mt-1">{t('upload.subtitle')}</p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer ${
          isDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 scale-[1.01]' 
            : 'border-neutral-300 dark:border-neutral-700 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-neutral-950 shadow-sm'
        }`}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 mx-auto rounded-2xl flex items-center justify-center mb-6 shadow-inner">
          <UploadCloud size={32} />
        </div>
        <h3 className="text-xl font-semibold mb-2">{t('upload.drag')}</h3>
        <p className="text-neutral-500 mb-6">{t('upload.or')}</p>
        <button className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-6 py-2.5 rounded-full text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm">
          {t('upload.browse')}
        </button>
        <p className="text-sm text-neutral-400 mt-6">{t('upload.support')}</p>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="font-medium text-lg flex items-center gap-2">
              <CheckCircle size={20} className="text-blue-600" />
              {t('upload.selectedFiles')} ({files.length})
            </h3>
            <div className="space-y-3">
              {files.map((file, idx) => (
                <motion.div
                  key={`${file.name}-${idx}`}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between p-4 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg flex items-center justify-center">
                      <File size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100">{file.name}</p>
                      <p className="text-xs text-neutral-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    disabled={isProcessing}
                    className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </motion.div>
              ))}
            </div>

            {isProcessing && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center text-sm font-medium text-blue-700 dark:text-blue-300 animate-pulse">
                {statusText}
              </div>
            )}

            <div className="flex justify-end pt-4">
               <button 
                 onClick={handleProcess}
                 disabled={isProcessing}
                 className={`px-8 py-3 rounded-full text-sm font-medium shadow-md flex items-center justify-center min-w-[200px] transition-all ${
                   isProcessing ? 'bg-blue-400 cursor-not-allowed text-white' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                 }`}
               >
                 {isProcessing ? (
                   <>
                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     {t('doc.processing')}
                   </>
                 ) : (
                   t('upload.processBtn')
                 )}
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
