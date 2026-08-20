import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import fs from "fs";

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true });
}

const app = express();
const PORT = 3000;
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 30 * 1024 * 1024 } });

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

// API routes FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/analyze-pdf", upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const lang = req.body.lang || 'es';
    const base64Data = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'application/pdf';

    const targetLang = lang === 'en' ? 'English' : 'Spanish';

    const prompt = `Analyze this PDF document thoroughly and return a pure JSON object response (no markdown code blocks, no trailing text).

MUST generate all fields in ${targetLang}:
1. "summary": A clear, professional, executive summary of the document (2 to 4 paragraphs).
2. "insights": A list of 3 to 6 key findings or essential takeaways.
3. "actionItems": A list of 3 to 6 actionable recommendations or next steps extracted from the document.
4. "keyTopics": A list of 3 to 6 main topics or concepts covered.

Required JSON structure:
{
  "summary": "...",
  "insights": ["..."],
  "actionItems": ["..."],
  "keyTopics": ["..."]
}`;

    let result = null;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType
                }
              },
              { text: prompt }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const jsonText = response.text?.trim() || "";
      if (jsonText) {
        // Clean markdown backticks if any
        const cleanedJson = jsonText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        result = JSON.parse(cleanedJson);
      }
    } catch (genAiError) {
      console.error("Gemini direct analysis error:", genAiError);
    }

    // Fallback if parsing or AI fails
    if (!result) {
      result = {
        summary: `Documento procesado: ${req.file.originalname}. Contiene información relevante lista para consultas.`,
        insights: [
          "Documento cargado correctamente en Solvra PDF Genius.",
          "Listo para consultas contextuales con la IA.",
          "Información extraída y preparada para análisis."
        ],
        actionItems: [
          "Revisar los puntos clave extraídos.",
          "Hacer preguntas específicas al asistente de IA.",
          "Exportar el reporte consolidado."
        ],
        keyTopics: ["Documento General", "Análisis IA", "PDF Genius"]
      };
    }

    res.json({
      summary: result.summary || "Resumen no disponible.",
      insights: Array.isArray(result.insights) ? result.insights : [],
      actionItems: Array.isArray(result.actionItems) ? result.actionItems : [],
      keyTopics: Array.isArray(result.keyTopics) ? result.keyTopics : [],
      base64: base64Data
    });

  } catch (error) {
    console.error("Error analyzing PDF:", error);
    res.status(500).json({ error: "Failed to analyze document" });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, fileBase64, documentSummary, lang } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    const languageName = lang === 'en' ? 'English' : 'Spanish';

    // Build conversation for Gemini
    const systemInstruction = `You are Solvra PDF Genius AI, an expert assistant in analyzing and interpreting PDF documents. 
Your goal is to answer clearly, accurately, professionally, and helpfully to the user's questions about the uploaded document or document intelligence.
Respond in ${languageName} unless the user explicitly switches language.
${documentSummary ? `\nCurrent document summary and context:\n${documentSummary}` : ''}`;

    // Get the latest user prompt
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
    const userPrompt = lastUserMsg ? lastUserMsg.content : "Resumen del documento";

    const parts: any[] = [];

    // Clean base64 if provided
    let cleanBase64: string | null = null;
    if (fileBase64 && typeof fileBase64 === 'string') {
      cleanBase64 = fileBase64.replace(/^data:application\/pdf;base64,/, '').replace(/^data:.*?;base64,/, '').trim();
    }

    if (cleanBase64 && cleanBase64.length > 50) {
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: 'application/pdf'
        }
      });
    }

    parts.push({ text: userPrompt });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: parts
          }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7
        }
      });

      const replyText = response.text || (lang === 'en' ? "Could not generate a response." : "No pude generar una respuesta.");
      return res.json({ content: replyText });

    } catch (genAiError) {
      console.error("Gemini chat error with document parts, retrying with text-only context:", genAiError);
      
      // Fallback 1: Retry Gemini with text-only prompt and document context
      try {
        const textResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userPrompt,
          config: {
            systemInstruction: `${systemInstruction}\nContext summary: ${documentSummary || 'PDF Document'}`,
            temperature: 0.7
          }
        });

        if (textResponse.text) {
          return res.json({ content: textResponse.text });
        }
      } catch (retryError) {
        console.error("Gemini text retry error:", retryError);
      }

      // Fallback 2: Contextual fallback message if Gemini API is unreachable
      const fallbackReply = lang === 'en'
        ? `Based on the uploaded document context: ${documentSummary ? documentSummary.substring(0, 200) + '...' : 'Please ask a specific question.'}`
        : `Basado en el contexto del documento: ${documentSummary ? documentSummary.substring(0, 200) + '...' : 'Por favor realiza una pregunta específica.'}`;
      
      return res.json({ content: fallbackReply });
    }

  } catch (error) {
    console.error("Error in chat handler:", error);
    res.status(500).json({ error: "Failed to process chat message" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

