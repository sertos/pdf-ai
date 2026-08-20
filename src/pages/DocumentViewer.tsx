import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useDocumentContext } from '../context/DocumentContext';
import { getPdfFileSource } from '../utils/pdfUtils';
import { 
  Search, 
  Sparkles, 
  MessageSquare, 
  Download, 
  Bookmark, 
  FileText, 
  UploadCloud, 
  Plus, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  CheckSquare, 
  Tag, 
  Send, 
  FileSpreadsheet,
  FileCheck,
  ChevronDown,
  Layers,
  Maximize2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const DocumentViewer = () => {
  const { t, language } = useLanguage();
  const { 
    documents, 
    activeDoc, 
    setActiveDocId, 
    deleteDocument, 
    addChatMessage, 
    toggleActionItem, 
    exportReport 
  } = useDocumentContext();

  const [activeTab, setActiveTab] = useState<'summary' | 'chat'>('summary');
  const [chatMessage, setChatMessage] = useState('');
  const [numPages, setNumPages] = useState<number>(1);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Dynamic responsive container width tracking to prevent clipping
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(700);

  const pdfFileSource = useMemo(() => {
    if (!activeDoc) return null;
    return getPdfFileSource(activeDoc.pdfUrl || activeDoc.base64);
  }, [activeDoc?.pdfUrl, activeDoc?.base64]);

  useEffect(() => {
    setPageNumber(1);
    setScale(1.0);
  }, [activeDoc?.id]);

  useEffect(() => {
    if (!pdfContainerRef.current) return;
    const updateWidth = () => {
      if (pdfContainerRef.current) {
        const availableWidth = pdfContainerRef.current.clientWidth - 48;
        setContainerWidth(Math.max(280, Math.min(850, availableWidth)));
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(pdfContainerRef.current);
    return () => observer.disconnect();
  }, [activeDoc?.id]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isChatting || !activeDoc) return;

    setActiveTab('chat');
    const userPrompt = chatMessage.trim();
    setChatMessage('');
    
    // Save user message in context
    addChatMessage(activeDoc.id, 'user', userPrompt);
    setIsChatting(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...activeDoc.chatHistory.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userPrompt }
          ],
          fileBase64: activeDoc.base64,
          documentSummary: activeDoc.summary,
          lang: language
        })
      });

      if (res.ok) {
        const data = await res.json();
        addChatMessage(activeDoc.id, 'ai', data.content || (language === 'en' ? "Analysis completed." : "Análisis completado."));
      } else {
        addChatMessage(
          activeDoc.id, 
          'ai', 
          language === 'en' ? "Could not retrieve an answer at this moment. Please try again." : "No pude obtener una respuesta en este momento. Por favor reintenta."
        );
      }
    } catch (error) {
      console.error("Chat submit error:", error);
      addChatMessage(
        activeDoc.id, 
        'ai', 
        language === 'en' ? "An error occurred while communicating with the AI service." : "Ocurrió un error al comunicar con el servicio de IA."
      );
    } finally {
      setIsChatting(false);
    }
  };

  const handleQuickQuestion = (promptText: string) => {
    setChatMessage(promptText);
    setActiveTab('chat');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] -mx-4 md:-mx-8 -my-4 md:-my-8 bg-neutral-50 dark:bg-neutral-900">
      {/* Top Document Selection Bar */}
      <div className="bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 px-4 md:px-6 py-2 flex items-center justify-between gap-4 overflow-x-auto shrink-0 z-20">
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mr-2 shrink-0 flex items-center gap-1">
            <Layers size={14} /> {t('doc.documentsCount')}: ({documents.length})
          </span>
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setActiveDocId(doc.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                activeDoc?.id === doc.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <FileText size={14} />
              <span className="max-w-[140px] truncate">{doc.name}</span>
            </button>
          ))}

          <Link
            to="/upload"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors shrink-0"
          >
            <Plus size={14} />
            {t('doc.uploadNew')}
          </Link>
        </div>

        {activeDoc && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
              >
                <Download size={14} />
                {t('doc.exportReport')}
                <ChevronDown size={12} />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl py-1 z-50 text-xs">
                  <button
                    onClick={() => { exportReport(activeDoc, 'txt'); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                  >
                    <FileText size={14} className="text-blue-500" /> {t('doc.exportTxt')}
                  </button>
                  <button
                    onClick={() => { exportReport(activeDoc, 'md'); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                  >
                    <Sparkles size={14} className="text-purple-500" /> {t('doc.exportMd')}
                  </button>
                  <button
                    onClick={() => { exportReport(activeDoc, 'doc'); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                  >
                    <FileSpreadsheet size={14} className="text-emerald-500" /> {t('doc.exportDoc')}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => deleteDocument(activeDoc.id)}
              className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title={t('doc.deleteTip')}
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Viewer Canvas */}
        <div className="flex-1 bg-neutral-200 dark:bg-neutral-950 flex flex-col relative overflow-hidden">
          {activeDoc ? (
            <>
              {/* PDF Toolbar */}
              <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-b border-neutral-200 dark:border-neutral-800 px-4 py-2 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-red-100 dark:bg-red-900/40 text-red-600 rounded-md flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                  <span className="font-semibold text-xs text-neutral-800 dark:text-neutral-200 truncate max-w-[200px] md:max-w-xs">
                    {activeDoc.name}
                  </span>
                  <span className="text-xs text-neutral-400 hidden sm:inline">
                    ({(activeDoc.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>

                {/* Interactive Controls */}
                <div className="flex items-center gap-2">
                  {isSearching ? (
                    <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg px-2 py-1 text-xs">
                      <input
                        type="text"
                        placeholder={t('doc.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs w-32 md:w-48"
                        autoFocus
                      />
                      <button onClick={() => setIsSearching(false)} className="text-neutral-400 hover:text-neutral-600 ml-1">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsSearching(true)}
                      className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                      title={t('doc.searchPlaceholder')}
                    >
                      <Search size={16} />
                    </button>
                  )}

                  <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700 mx-1" />

                  <button
                    onClick={() => setScale(s => Math.max(0.5, s - 0.15))}
                    className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                    title={t('doc.zoomOut')}
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400 min-w-[36px] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    onClick={() => setScale(s => Math.min(2.5, s + 0.15))}
                    className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                    title={t('doc.zoomIn')}
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    onClick={() => setScale(1.0)}
                    className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-xs"
                    title={t('doc.fitWidth')}
                  >
                    <Maximize2 size={14} />
                  </button>

                  <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700 mx-1" />

                  <button
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isBookmarked
                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/30'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                    title={t('doc.bookmark')}
                  >
                    <Bookmark size={16} />
                  </button>
                </div>
              </div>

              {/* PDF Document Render Container - Auto responsive to containerWidth */}
              <div 
                ref={pdfContainerRef}
                className="flex-1 overflow-auto p-4 md:p-6 flex flex-col items-center justify-start relative w-full"
              >
                {pdfFileSource ? (
                  <div className="w-full flex justify-center mb-16 transition-all">
                    <Document
                      file={pdfFileSource}
                      onLoadSuccess={onDocumentLoadSuccess}
                      loading={
                        <div className="flex flex-col items-center justify-center gap-3 py-24 px-12 text-blue-600 bg-white rounded-xl shadow-md">
                          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                          <span className="text-xs font-medium text-neutral-600">{t('doc.loadingPdf')}</span>
                        </div>
                      }
                      error={
                        <div className="p-8 text-center bg-white rounded-xl shadow-md max-w-xl w-full">
                          <FileText size={48} className="mx-auto text-blue-600 mb-4" />
                          <p className="font-semibold text-neutral-800 mb-1">{activeDoc.name}</p>
                          <p className="text-xs text-neutral-500 max-w-md mx-auto mb-4">
                            {t('doc.processedSuccess')}
                          </p>
                          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-left text-xs text-neutral-700 font-mono space-y-1">
                            <p className="font-bold text-blue-700 uppercase">{t('doc.previewText')}</p>
                            <p className="line-clamp-6 italic">{activeDoc.summary}</p>
                          </div>
                        </div>
                      }
                    >
                      <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        width={containerWidth}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                      />
                    </Document>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white rounded-xl shadow-md max-w-lg my-auto border border-neutral-200">
                    <FileCheck size={48} className="mx-auto text-emerald-600 mb-3" />
                    <h3 className="font-bold text-base text-neutral-900">{activeDoc.name}</h3>
                    <p className="text-xs text-neutral-500 mt-1 mb-4">{activeDoc.summary}</p>
                  </div>
                )}

                {/* Sticky Pagination Controls */}
                {numPages > 0 && (
                  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-neutral-900/95 backdrop-blur shadow-2xl rounded-full px-5 py-2 flex items-center gap-4 border border-neutral-200 dark:border-neutral-800 z-30">
                    <button
                      onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                      disabled={pageNumber <= 1}
                      className="text-xs font-semibold hover:text-blue-600 disabled:opacity-40 transition-colors"
                    >
                      {t('doc.prevPage')}
                    </button>
                    <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
                      {t('doc.pageInfo').replace('{current}', String(pageNumber)).replace('{total}', String(numPages))}
                    </span>
                    <button
                      onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                      disabled={pageNumber >= numPages}
                      className="text-xs font-semibold hover:text-blue-600 disabled:opacity-40 transition-colors"
                    >
                      {t('doc.nextPage')}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-neutral-950">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <UploadCloud size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">
                {t('doc.noDocSelected')}
              </h2>
              <p className="text-neutral-500 text-sm max-w-md mb-6">
                {t('doc.noDocDesc')}
              </p>
              <Link
                to="/upload"
                className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium text-sm shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                {t('doc.uploadFirst')}
              </Link>
            </div>
          )}
        </div>

        {/* AI Sidebar & Intelligence Panel */}
        {activeDoc && (
          <div className="w-96 bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800 flex flex-col shrink-0">
            {/* Sidebar Navigation Tabs */}
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 shrink-0">
              <div className="bg-neutral-200/60 dark:bg-neutral-800 p-1 rounded-xl flex gap-1">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'summary'
                      ? 'bg-white dark:bg-neutral-700 shadow-sm text-blue-600 dark:text-white'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  <Sparkles size={14} />
                  {t('doc.summaryTab')}
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'chat'
                      ? 'bg-white dark:bg-neutral-700 shadow-sm text-blue-600 dark:text-white'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  <MessageSquare size={14} />
                  {t('doc.chatTab')} ({activeDoc.chatHistory.length})
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {activeTab === 'summary' && (
                <>
                  {/* Executive Summary */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                      <FileText size={14} className="text-blue-600" />
                      {t('doc.execSummary')}
                    </h3>
                    <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal">
                      {activeDoc.summary}
                    </div>
                  </div>

                  {/* Key Insights */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <Sparkles size={14} />
                      {t('doc.keyInsights')}
                    </h3>
                    <div className="space-y-2">
                      {activeDoc.insights.map((insight, idx) => (
                        <div
                          key={idx}
                          className="bg-blue-50/70 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs text-blue-950 dark:text-blue-100 flex items-start gap-2.5"
                        >
                          <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="leading-snug">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Plan Checklist */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckSquare size={14} />
                      {t('doc.actionPlan')}
                    </h3>
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden text-xs">
                      {activeDoc.actionItems.map((item, idx) => {
                        const isDone = item.startsWith('[✓] ');
                        const cleanText = item.replace('[✓] ', '');
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleActionItem(activeDoc.id, idx)}
                            className="p-3 flex items-start gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => {}}
                              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className={`leading-snug ${isDone ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-800 dark:text-neutral-200'}`}>
                              {cleanText}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Key Topics Tags */}
                  {activeDoc.keyTopics && activeDoc.keyTopics.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                        <Tag size={14} />
                        {t('doc.keyTopics')}
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {activeDoc.keyTopics.map((topic, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md text-[11px] font-medium"
                          >
                            #{topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'chat' && (
                <div className="flex flex-col h-full space-y-4">
                  {/* Quick suggestion chips */}
                  <div className="space-y-1.5 shrink-0">
                    <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">{t('doc.quickSuggestions')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleQuickQuestion(t('doc.quickFechasPrompt'))}
                        className="text-[11px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors text-left"
                      >
                        {t('doc.quickFechas')}
                      </button>
                      <button
                        onClick={() => handleQuickQuestion(t('doc.quickRiesgosPrompt'))}
                        className="text-[11px] bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors text-left"
                      >
                        {t('doc.quickRiesgos')}
                      </button>
                      <button
                        onClick={() => handleQuickQuestion(t('doc.quickSintesisPrompt'))}
                        className="text-[11px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors text-left"
                      >
                        {t('doc.quickSintesis')}
                      </button>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 space-y-3 pt-2">
                    {activeDoc.chatHistory.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`p-3 rounded-2xl text-xs max-w-[90%] leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white rounded-tr-none shadow-sm font-medium'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-tl-none border border-neutral-200 dark:border-neutral-700'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}

                    {isChatting && (
                      <div className="flex justify-start">
                        <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl rounded-tl-none text-xs text-neutral-500 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce delay-100" />
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce delay-200" />
                          <span className="ml-1 font-medium text-[11px]">{t('doc.queryingDoc')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 shrink-0">
              <form onSubmit={handleChatSubmit} className="relative">
                <input
                  type="text"
                  placeholder={t('doc.askPlaceholder')}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  disabled={isChatting}
                  className="w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl pl-3.5 pr-10 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim() || isChatting}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
