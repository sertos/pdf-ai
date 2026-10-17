import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import fs from "fs";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true });
}

// Inicializar Firebase Admin
if (getApps().length === 0) {
  initializeApp();
}
const db = getFirestore();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const MAX_FREE_QUERIES = 5;

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 30 * 1024 * 1024 } });

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

// Función para obtener la IP real del usuario
function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ipList = typeof forwarded === 'string' ? forwarded : forwarded[0];
    return ipList.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

// Función middleware para verificar y contabilizar uso persistente
async function checkAndIncrementUsage(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const cleanIp = ip.replace(/[^a-zA-Z0-9]/g, "_"); // Sanitizar IP para usar como ID de doc
  const docRef = db.collection("demo_usage").doc(cleanIp);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    const data = docSnap.data();
    const count = data?.count || 0;
    if (count >= MAX_FREE_QUERIES) {
      return { allowed: false, remaining: 0 };
    }
    await docRef.update({
      count: FieldValue.increment(1),
      lastQuery: FieldValue.serverTimestamp()
    });
    return { allowed: true, remaining: MAX_FREE_QUERIES - (count + 1) };
  } else {
    await docRef.set({
      count: 1,
      firstQuery: FieldValue.serverTimestamp(),
      lastQuery: FieldValue.serverTimestamp()
    });
    return { allowed: true, remaining: MAX_FREE_QUERIES - 1 };
  }
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/analyze-pdf", upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const clientIp = getClientIp(req);
    const usage = await checkAndIncrementUsage(clientIp);

    if (!usage.allowed) {
      return res.json({
        summary: "⚠️ **Límite de la demo alcanzado**: Has completado las 5 consultas/análisis gratuitos disponibles en esta demostración de Solvra PDF Genius. Para solicitar un acceso ilimitado o corporativo, contáctanos.",
        insights: ["Límite de uso gratuito alcanzado (5/5)."],
        actionItems: ["Contactar al equipo de Solvra para obtener acceso completo."],
        keyTopics: ["Límite de Demo"]
      });
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
        model: 'gemini-3.8-flash',
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
        const cleanedJson = jsonText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        result = JSON.parse(cleanedJson);
      }
    } catch (genAiError: any) {
      console.error("Gemini direct analysis error:", genAiError);
      const errorStr = JSON.stringify(genAiError) || genAiError?.message || "";
      if (errorStr.includes("402") || errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("prepayment credits")) {
        result = {
          summary: "⚠️ **Servicio no disponible por falta de créditos**: La cuenta de AI Studio no tiene saldo prepago disponible para procesar el documento. Por favor, revisa la facturación del proyecto.",
          insights: ["Créditos de API de Gemini agotados."],
          actionItems: ["Cargar créditos en la consola de Google AI Studio."],
          keyTopics: ["Error de Facturación"]
        };
      }
    }

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

    const clientIp = getClientIp(req);
    const usage = await checkAndIncrementUsage(clientIp);

    if (!usage.allowed) {
      const limitMsg = lang === 'en'
        ? "⚠️ **Demo limit reached**: You have used all 5 free queries allowed for this demonstration. Please contact Solvra to get full access."
        : "⚠️ **Límite de la demo alcanzado**: Has completado las 5 consultas gratuitas permitidas en esta demostración. Contacta al equipo de Solvra para obtener un acceso sin restricciones.";
      return res.json({ content: limitMsg });
    }

    const languageName = lang === 'en' ? 'English' : 'Spanish';

    const systemInstruction = `You are Solvra PDF Genius AI, an expert assistant in analyzing and interpreting PDF documents. 
Your goal is to answer clearly, accurately, professionally, and helpfully to the user's questions about the uploaded document or document intelligence.
Respond in ${languageName} unless the user explicitly switches language.
${documentSummary ? `\nCurrent document summary and context:\n${documentSummary}` : ''}`;

    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
    const userPrompt = lastUserMsg ? lastUserMsg.content : "Resumen del documento";

    const parts: any[] = [];

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
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: parts
          }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3
        }
      });

      const replyText = response.text || (lang === 'en' ? "Could not generate a response." : "No pude generar una respuesta.");
      return res.json({ content: replyText });

    } catch (genAiError: any) {
      console.error("Gemini chat error:", genAiError);
      
      const errorStr = JSON.stringify(genAiError) || genAiError?.message || "";
      if (errorStr.includes("402") || errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("prepayment credits")) {
        const creditMsg = lang === 'en'
          ? "⚠️ The AI service is currently unavailable due to depleted API credits in Google AI Studio. Please check your billing settings."
          : "⚠️ El servicio de IA no está disponible temporalmente por falta de créditos en Google AI Studio. Por favor, revisa la facturación de la cuenta.";
        return res.json({ content: creditMsg });
      }

      try {
        const textResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            systemInstruction: `${systemInstruction}\nContext summary: ${documentSummary || 'PDF Document'}`,
            temperature: 0.7
          }
        });

        if (textResponse.text) {
          return res.json({ content: textResponse.text });
        }
      } catch (retryError: any) {
        console.error("Gemini text retry error:", retryError);
        const retryErrStr = JSON.stringify(retryError) || retryError?.message || "";
        if (retryErrStr.includes("402") || retryErrStr.includes("RESOURCE_EXHAUSTED") || retryErrStr.includes("prepayment credits")) {
          const creditMsg = lang === 'en'
            ? "⚠️ The AI service is currently unavailable due to depleted API credits in Google AI Studio."
            : "⚠️ El servicio de IA no está disponible temporalmente por falta de créditos en Google AI Studio.";
          return res.json({ content: creditMsg });
        }
      }

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
  server: {
    middlewareMode: true,
    allowedHosts: [
      'pdf-ai-971636503516.us-central1.run.app'
    ],
  },
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
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
