import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useDocumentContext } from '../context/DocumentContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, UploadCloud, Download, Sparkles, CheckSquare, Tag, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ReportsPage = () => {
  const { t } = useLanguage();
  const { documents, stats } = useDocumentContext();

  const hasData = documents.length > 0;

  // Chart 1: Document Sizes & Pages
  const chartData = documents.map((doc) => ({
    name: doc.name.length > 12 ? doc.name.substring(0, 10) + '...' : doc.name,
    insights: doc.insights.length,
    actionItems: doc.actionItems.length,
    sizeMB: parseFloat((doc.size / (1024 * 1024)).toFixed(2))
  }));

  // Pie Chart Data
  const pieData = [
    { name: t('reports.pieInsights'), value: documents.reduce((acc, d) => acc + d.insights.length, 0), color: '#3b82f6' },
    { name: t('reports.pieTasks'), value: documents.reduce((acc, d) => acc + d.actionItems.length, 0), color: '#10b981' },
    { name: t('reports.pieChatMsgs'), value: documents.reduce((acc, d) => acc + d.chatHistory.length, 0), color: '#8b5cf6' },
  ];

  const allTopics = documents.flatMap(d => d.keyTopics || []);

  const handleExportAll = () => {
    if (documents.length === 0) return;
    const combinedReport = `====================================================
SOLVRA PDF GENIUS - REPORTE DE INTELIGENCIA CONSOLIDADO
====================================================
Total de Documentos Analizados: ${documents.length}
Páginas Totales: ${stats.totalPages}
Almacenamiento: ${stats.totalStorageMB} MB
Fecha de Generación: ${new Date().toLocaleDateString()}

` + documents.map((doc, i) => `----------------------------------------------------
DOCUMENTO ${i + 1}: ${doc.name}
----------------------------------------------------
RESUMEN:
${doc.summary}

INSIGHTS (${doc.insights.length}):
${doc.insights.map((ins) => ` - ${ins}`).join('\n')}

ACCIONES (${doc.actionItems.length}):
${doc.actionItems.map((act) => ` [ ] ${act}`).join('\n')}
`).join('\n\n');

    const blob = new Blob([combinedReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Solvra_PDF_Genius_Reporte_Consolidado.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('reports.title')}</h1>
          <p className="text-neutral-500 mt-1">{t('reports.subtitle')}</p>
        </div>

        {hasData && (
          <button
            onClick={handleExportAll}
            className="flex items-center justify-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm self-start"
          >
            <Download size={16} />
            {t('reports.exportConsolidated')}
          </button>
        )}
      </div>

      {!hasData ? (
        <div className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">{t('reports.empty')}</h2>
          <p className="text-neutral-500 max-w-sm mb-6">{t('reports.emptyDesc')}</p>
          <Link
            to="/upload"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center gap-2"
          >
            <UploadCloud size={18} />
            {t('reports.uploadDocs')}
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-neutral-950 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center">
                <Sparkles size={24} />
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase font-semibold">{t('reports.totalInsights')}</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                  {documents.reduce((acc, d) => acc + d.insights.length, 0)}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-950 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center">
                <CheckSquare size={24} />
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase font-semibold">{t('reports.identifiedTasks')}</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                  {documents.reduce((acc, d) => acc + d.actionItems.length, 0)}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-950 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl flex items-center justify-center">
                <Zap size={24} />
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase font-semibold">{t('reports.estimatedTimeSaved')}</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                  {(stats.totalPages * 4).toFixed(0)} {t('reports.min')}
                </p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="bg-white dark:bg-neutral-950 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <h3 className="text-base font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
                {t('reports.barChartTitle')}
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="insights" fill="#3b82f6" name="Insights" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actionItems" fill="#10b981" name="Plan de Acción" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-white dark:bg-neutral-950 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <h3 className="text-base font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
                {t('reports.pieChartTitle')}
              </h3>
              <div className="h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Key Topics Cloud */}
          {allTopics.length > 0 && (
            <div className="bg-white dark:bg-neutral-950 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <Tag size={18} className="text-blue-600" />
                {t('reports.topicsCloudTitle')}
              </h3>
              <div className="flex flex-wrap gap-2 pt-2">
                {Array.from(new Set(allTopics)).map((topic, i) => (
                  <span
                    key={i}
                    className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium border border-blue-100 dark:border-blue-900/40"
                  >
                    #{topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
