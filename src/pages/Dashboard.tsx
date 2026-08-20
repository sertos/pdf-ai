import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useDocumentContext } from '../context/DocumentContext';
import { motion } from 'framer-motion';
import { FileText, Layers, Zap, HardDrive, UploadCloud, ArrowRight, Trash2, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { t } = useLanguage();
  const { documents, stats, setActiveDocId, deleteDocument } = useDocumentContext();
  const navigate = useNavigate();

  const statCards = [
    { label: t('dashboard.stats.uploaded'), value: stats.totalDocs, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: t('dashboard.stats.pages'), value: stats.totalPages, icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { label: t('dashboard.stats.summaries'), value: stats.totalSummaries, icon: Zap, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: t('dashboard.stats.storage'), value: `${stats.totalStorageMB} MB`, icon: HardDrive, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  ];

  const handleOpenDoc = (id: string) => {
    setActiveDocId(id);
    navigate('/documents');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-neutral-500 mt-1">{t('dashboard.welcome')} {t('dashboard.userTitle')}</p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm self-start"
        >
          <UploadCloud size={18} />
          {t('dashboard.upload_cta')}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-neutral-950 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <p className="text-neutral-500 text-xs font-semibold uppercase tracking-wider">{stat.label}</p>
            <p className="text-3xl font-bold mt-1 text-neutral-900 dark:text-neutral-50">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">{t('dashboard.recent')}</h2>
            <p className="text-xs text-neutral-500">{t('dashboard.subTitle')}</p>
          </div>
          {documents.length > 0 && (
            <Link to="/documents" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              {t('dashboard.viewAll')} ({documents.length})
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
        
        {documents.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">{t('dashboard.empty')}</h3>
            <p className="text-sm text-neutral-500 max-w-md mb-6">
              {t('dashboard.emptyDesc')}
            </p>
            <Link to="/upload" className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
              {t('dashboard.upload_cta')}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {documents.map((doc) => (
              <div key={doc.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl flex items-center justify-center shrink-0 mt-1">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 
                      onClick={() => handleOpenDoc(doc.id)}
                      className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 hover:text-blue-600 cursor-pointer transition-colors"
                    >
                      {doc.name}
                    </h4>
                    <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5 max-w-xl">
                      {doc.summary}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-neutral-400">
                      <span>{doc.createdAt}</span>
                      <span>•</span>
                      <span>{(doc.size / (1024 * 1024)).toFixed(2)} MB</span>
                      <span>•</span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium">{doc.insights.length} {t('dashboard.insightsCount')}</span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">{doc.actionItems.length} {t('dashboard.tasksCount')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleOpenDoc(doc.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                  >
                    <Eye size={14} />
                    {t('dashboard.viewAnalyze')}
                  </button>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title={t('dashboard.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
