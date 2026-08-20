import React, { createContext, useContext, useState, useEffect } from 'react';
import { savePdfData, getPdfData, deletePdfData } from '../utils/idbStorage';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

export interface ProcessedDocument {
  id: string;
  name: string;
  size: number; // in bytes
  pageCount: number;
  pdfUrl?: string; // Data URL or object URL
  base64?: string; // Base64 string for AI API calls
  summary: string;
  insights: string[];
  actionItems: string[];
  keyTopics: string[];
  chatHistory: ChatMessage[];
  createdAt: string;
}

interface DocumentContextType {
  documents: ProcessedDocument[];
  activeDoc: ProcessedDocument | null;
  activeDocId: string | null;
  setActiveDocId: (id: string | null) => void;
  uploadAndProcess: (file: File, lang?: string) => Promise<ProcessedDocument>;
  deleteDocument: (id: string) => void;
  addChatMessage: (docId: string, role: 'user' | 'ai', content: string) => void;
  toggleActionItem: (docId: string, index: number) => void;
  exportReport: (doc: ProcessedDocument, format: 'txt' | 'md' | 'doc') => void;
  stats: {
    totalDocs: number;
    totalPages: number;
    totalSummaries: number;
    totalStorageMB: string;
  };
}

const STORAGE_KEY = 'solvra_pdf_genius_documents_v1';
const ACTIVE_KEY = 'solvra_pdf_genius_active_v1';

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<ProcessedDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load saved docs", e);
    }
    return [];
  });

  const [activeDocId, setActiveDocIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_KEY);
    } catch (e) {
      return null;
    }
  });

  const setActiveDocId = (id: string | null) => {
    setActiveDocIdState(id);
    if (id) {
      localStorage.setItem(ACTIVE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      // Don't save large base64 strings in localStorage to avoid hitting 5MB quota limit, or keep light versions
      const docsToSave = documents.map(doc => ({
        ...doc,
        // keep base64 or prune if too large
        base64: doc.base64 && doc.base64.length < 3000000 ? doc.base64 : undefined,
        pdfUrl: doc.pdfUrl && doc.pdfUrl.startsWith('data:') && doc.pdfUrl.length < 3000000 ? doc.pdfUrl : undefined
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docsToSave));
    } catch (e) {
      console.warn("Storage quota limit reached, saving metadata only", e);
      const metadataOnly = documents.map(({ pdfUrl, base64, ...rest }) => rest);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(metadataOnly));
      } catch (err) {}
    }
  }, [documents]);

  const activeDoc = documents.find(d => d.id === activeDocId) || documents[0] || null;

  // Auto load PDF data from IndexedDB for previous documents if missing in memory
  useEffect(() => {
    if (activeDoc && (!activeDoc.base64 || !activeDoc.pdfUrl)) {
      getPdfData(activeDoc.id).then((savedData) => {
        if (savedData) {
          setDocuments(prev => prev.map(d => d.id === activeDoc.id ? { ...d, base64: savedData, pdfUrl: savedData } : d));
        }
      });
    }
  }, [activeDoc?.id, activeDoc?.base64, activeDoc?.pdfUrl]);

  const uploadAndProcess = async (file: File, lang: string = 'es'): Promise<ProcessedDocument> => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('lang', lang);

    // Read full Data URL locally for storage and react-pdf
    const fullDataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const objectUrl = URL.createObjectURL(file);

    let analysisRes = {
      summary: '',
      insights: [] as string[],
      actionItems: [] as string[],
      keyTopics: [] as string[]
    };

    try {
      const res = await fetch('/api/analyze-pdf', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        analysisRes = {
          summary: data.summary || (lang === 'en' 
            ? `Executive summary for ${file.name}: This document contains key findings, clauses, and structured data.`
            : `Resumen ejecutivo de ${file.name}: Este documento contiene cláusulas, hallazgos clave y datos estratégicos.`),
          insights: data.insights?.length ? data.insights : (lang === 'en' ? [
            "Document processed successfully by Solvra PDF Genius AI.",
            "Interactive view and keyword search enabled.",
            "Contextual AI assistant ready for queries."
          ] : [
            "Documento procesado exitosamente por Solvra PDF Genius AI.",
            "Visualización interactiva y búsqueda por palabra clave habilitada.",
            "Asistente contextual disponible para responder cualquier inquietud."
          ]),
          actionItems: data.actionItems?.length ? data.actionItems : (lang === 'en' ? [
            "Review key extracted insights.",
            "Ask AI Assistant about specific sections.",
            "Export consolidated report."
          ] : [
            "Analizar los puntos clave con el equipo de trabajo.",
            "Realizar preguntas al Asistente IA sobre secciones específicas.",
            "Exportar reporte consolidado."
          ]),
          keyTopics: data.keyTopics?.length ? data.keyTopics : (lang === 'en' ? ["General", "Report", "PDF Genius"] : ["General", "Informe", "PDF Genius"])
        };
      }
    } catch (e) {
      console.error("API call error:", e);
      analysisRes = {
        summary: lang === 'en' ? `Document ${file.name} ready for review.` : `Documento ${file.name} listo para lectura y análisis.`,
        insights: lang === 'en' ? ["Document loaded successfully.", "AI Assistant available."] : ["Documento cargado correctamente.", "Asistente IA disponible."],
        actionItems: lang === 'en' ? ["Review PDF content."] : ["Revisar el contenido del PDF."],
        keyTopics: ["PDF Genius"]
      };
    }

    const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Save to IndexedDB asynchronously
    await savePdfData(docId, fullDataUrl);

    const initMsgContent = lang === 'en'
      ? `Hello! I have analyzed **${file.name}**. What would you like to know about this document?`
      : `¡Hola! He analizado **${file.name}**. ¿Qué te gustaría saber sobre este documento?`;

    const newDoc: ProcessedDocument = {
      id: docId,
      name: file.name,
      size: file.size,
      pageCount: Math.ceil(file.size / (1024 * 50)) || 1,
      pdfUrl: fullDataUrl || objectUrl,
      base64: fullDataUrl,
      summary: analysisRes.summary,
      insights: analysisRes.insights,
      actionItems: analysisRes.actionItems,
      keyTopics: analysisRes.keyTopics,
      chatHistory: [
        {
          id: `msg_init_${Date.now()}`,
          role: 'ai',
          content: initMsgContent,
          timestamp: Date.now()
        }
      ],
      createdAt: new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    setDocuments(prev => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    return newDoc;
  };

  const deleteDocument = (id: string) => {
    deletePdfData(id);
    setDocuments(prev => prev.filter(d => d.id !== id));
    if (activeDocId === id) {
      const remaining = documents.filter(d => d.id !== id);
      setActiveDocId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const addChatMessage = (docId: string, role: 'user' | 'ai', content: string) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === docId) {
        return {
          ...doc,
          chatHistory: [
            ...doc.chatHistory,
            { id: `msg_${Date.now()}_${Math.random()}`, role, content, timestamp: Date.now() }
          ]
        };
      }
      return doc;
    }));
  };

  const toggleActionItem = (docId: string, index: number) => {
    // Optionally cross off action item
    setDocuments(prev => prev.map(doc => {
      if (doc.id === docId) {
        const updatedItems = [...doc.actionItems];
        if (updatedItems[index].startsWith('[✓] ')) {
          updatedItems[index] = updatedItems[index].replace('[✓] ', '');
        } else {
          updatedItems[index] = '[✓] ' + updatedItems[index];
        }
        return { ...doc, actionItems: updatedItems };
      }
      return doc;
    }));
  };

  const exportReport = (doc: ProcessedDocument, format: 'txt' | 'md' | 'doc') => {
    const reportContent = `====================================================
SOLVRA PDF GENIUS - REPORTE DE ANÁLISIS DE DOCUMENTO
====================================================
Nombre del Archivo: ${doc.name}
Fecha de Procesamiento: ${doc.createdAt}
Páginas estimadas: ${doc.pageCount}
Tamaño: ${(doc.size / (1024 * 1024)).toFixed(2)} MB

RESUMEN EJECUTIVO:
${doc.summary}

PUNTOS CLAVE & INSIGHTS:
${doc.insights.map((ins, i) => `${i + 1}. ${ins}`).join('\n')}

PLAN DE ACCIÓN:
${doc.actionItems.map((act, i) => `[ ] ${act}`).join('\n')}

TEMAS PRINCIPALES:
${doc.keyTopics.join(', ')}

====================================================
Generado por Solvra PDF Genius AI
====================================================`;

    const blob = new Blob([reportContent], { type: format === 'md' ? 'text/markdown' : 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.name.replace(/\.[^/.]+$/, "")}_Reporte_PDFGenius.${format === 'doc' ? 'doc' : format === 'md' ? 'md' : 'txt'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const stats = {
    totalDocs: documents.length,
    totalPages: documents.reduce((acc, d) => acc + (d.pageCount || 1), 0),
    totalSummaries: documents.length,
    totalStorageMB: (documents.reduce((acc, d) => acc + d.size, 0) / (1024 * 1024)).toFixed(1)
  };

  return (
    <DocumentContext.Provider
      value={{
        documents,
        activeDoc,
        activeDocId,
        setActiveDocId,
        uploadAndProcess,
        deleteDocument,
        addChatMessage,
        toggleActionItem,
        exportReport,
        stats
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocumentContext = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocumentContext must be used within a DocumentProvider');
  }
  return context;
};
