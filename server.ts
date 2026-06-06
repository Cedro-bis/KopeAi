import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("La clé d'API GEMINI_API_KEY n'est pas configurée dans l'environnement.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Database helper
const DB_FILE = path.join(process.cwd(), "db.json");

function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading database:", error);
  }
  return { opportunities: [] };
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database:", error);
  }
}

// API Routes

// 1. Get all opportunities
app.get("/api/opportunities", (req, res) => {
  const db = readDB();
  res.json(db.opportunities);
});

// 2. Create an opportunity (manual)
app.post("/api/opportunities", (req, res) => {
  const {
    title,
    type,
    domain,
    source,
    url,
    description,
    companyOrInstitution,
    locationOrEligibility,
    status,
    published,
    foundByAgent
  } = req.body;

  if (!title || !type || !domain || !source) {
    res.status(400).json({ error: "Les champs obligatoires sont manquants (titre, type, domaine, source)." });
    return;
  }

  const db = readDB();
  const newOpp = {
    id: `opp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    title,
    type,
    domain,
    source,
    url: url || "",
    description: description || "",
    companyOrInstitution: companyOrInstitution || "",
    locationOrEligibility: locationOrEligibility || "",
    status: status || "pending",
    published: published !== undefined ? published : false,
    createdAt: new Date().toISOString(),
    foundByAgent: foundByAgent || "Administrateur"
  };

  db.opportunities.unshift(newOpp);
  writeDB(db);

  res.status(201).json(newOpp);
});

// 3. Update an opportunity status or content
app.put("/api/opportunities/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const db = readDB();
  const index = db.opportunities.findIndex((o: any) => o.id === id);

  if (index === -1) {
    res.status(404).json({ error: "Opportunité non trouvée." });
    return;
  }

  const currentOpp = db.opportunities[index];
  const updatedOpp = {
    ...currentOpp,
    ...updates,
    id: currentOpp.id // preserve ID
  };

  db.opportunities[index] = updatedOpp;
  writeDB(db);

  res.json(updatedOpp);
});

// 4. Delete an opportunity
app.delete("/api/opportunities/:id", (req, res) => {
  const { id } = req.params;

  const db = readDB();
  const initialLength = db.opportunities.length;
  db.opportunities = db.opportunities.filter((o: any) => o.id !== id);

  if (db.opportunities.length === initialLength) {
    res.status(404).json({ error: "Opportunité non trouvée." });
    return;
  }

  writeDB(db);
  res.json({ success: true, message: "Opportunité supprimée avec succès." });
});

// 5. Run Gemini AI Agent to fetch opportunities
app.post("/api/agents/run", async (req, res) => {
  const { type, source, domain } = req.body;

  if (!type || !source || !domain) {
    res.status(400).json({ error: "Paramètres manquants : type, source, domaine." });
    return;
  }

  const agentName = `${source} AI Scout V3`;

  try {
    const ai = getGeminiClient();

    const promptMessage = `Recherche des opportunités réelles et fraîches pour le type d'opportunité suivant: "${type === 'job' ? 'Offre d\'emploi' : 'Bourse d\'étude'}".
Le domaine professionnel ou d'études ciblé est : "${domain}".
La source de recherche ciblée est : "${source}" (par exemple, des posts pertinents sur ${source === 'LinkedIn' ? 'LinkedIn.com' : source === 'Facebook' ? 'Facebook.com' : 'le web francophone'}).

Tu es un agent IA spécialisé dans l'extraction d'opportunités d'emploi ou de bourses d'études.
Utilise tes connaissances du web ou effectue une analyse de recherche pour trouver 3 opportunités d'emploi ou de bourses réelles ou hautement réalistes.
Les descriptions doivent faire entre 3 et 5 lignes rédigées en français, avec un ton professionnel et informatif.
Fournis un lien de redirection valide (par exemple: https://www.linkedin.com/jobs/view/... ou un site officiel d'entreprise ou d'université comme https://careers.google.com ou https://scholarship.org). Si l'URL n'est pas précisément connue, construis un lien plausible très précis vers la page de recrutement de l'organisme.

Tu dois retourner la réponse STRICTEMENT sous la forme d'un tableau d'objets JSON respectant exactement la structure suivante :
[
  {
    "title": "Titre précis de l'opportunité",
    "domain": "Le domaine exact (ex: Informatique, Médecine, Ingénierie)",
    "source": "${source}",
    "url": "https://...",
    "description": "Une description claire, bien formatée et explicative en français d'environ 3-4 lignes détaillant le rôle ou l'objet de la bourse, les critères clés, l'esprit général et le profil attendu.",
    "companyOrInstitution": "Nom de l'entreprise ou de l'université",
    "locationOrEligibility": "Ex: Paris, France (Télétravail) ou Ouvert aux étudiants internationaux"
  }
]`;

    try {
      // We try running with Google Search Grounding to find actual fresh real-time web opportunities!
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptMessage,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "Tableau d'offres d'emplois ou de bourses d'études",
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                domain: { type: Type.STRING },
                source: { type: Type.STRING },
                url: { type: Type.STRING },
                description: { type: Type.STRING },
                companyOrInstitution: { type: Type.STRING },
                locationOrEligibility: { type: Type.STRING }
              },
              required: ["title", "domain", "source", "url", "description", "companyOrInstitution", "locationOrEligibility"]
            }
          }
        }
      });

      const textOutput = response.text;
      if (!textOutput) {
        throw new Error("Aucun contenu retourné par l'IA.");
      }

      const rawResults = JSON.parse(textOutput.trim());
      const approvedResults = processAgentResults(rawResults, type, agentName);
      res.json({ success: true, count: approvedResults.length, results: approvedResults });

    } catch (apiError: any) {
      console.warn("API Error with Grounding, trying robust schema model fallback without search grounding...", apiError.message);

      // Fallback: standard json with no grounding tools to minimize API constraint errors
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptMessage,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "Tableau d'offres d'emplois ou de bourses d'études",
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                domain: { type: Type.STRING },
                source: { type: Type.STRING },
                url: { type: Type.STRING },
                description: { type: Type.STRING },
                companyOrInstitution: { type: Type.STRING },
                locationOrEligibility: { type: Type.STRING }
              },
              required: ["title", "domain", "source", "url", "description", "companyOrInstitution", "locationOrEligibility"]
            }
          }
        }
      });

      const textOutput = fallbackResponse.text;
      if (!textOutput) {
        throw new Error("Aucun contenu retourné par l'IA lors du fallback.");
      }

      const rawResults = JSON.parse(textOutput.trim());
      const approvedResults = processAgentResults(rawResults, type, agentName);
      res.json({ success: true, count: approvedResults.length, results: approvedResults });
    }

  } catch (error: any) {
    console.error("Agent Run Error:", error);
    res.status(500).json({ error: error.message || "Erreur interne lors de l'exécution de l'agent d'IA." });
  }
});

// Helper to sanitize and store results as drafts ("pending")
function processAgentResults(rawResults: any[], type: "job" | "scholarship", agentName: string) {
  if (!Array.isArray(rawResults)) {
    return [];
  }

  const db = readDB();
  const processed: any[] = [];

  for (const item of rawResults) {
    const opp = {
      id: `opp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: item.title || "Opportunité d'Emploi sans titre",
      type: type,
      domain: item.domain || "Général",
      source: item.source || "Web",
      url: item.url || "https://www.google.fr",
      description: item.description || "Aucune description fournie.",
      companyOrInstitution: item.companyOrInstitution || "Non spécifié",
      locationOrEligibility: item.locationOrEligibility || "Non spécifié",
      status: "pending", // ALWAYS pending first for admin review!
      published: false,   // ALWAYS false for draft
      createdAt: new Date().toISOString(),
      foundByAgent: agentName
    };

    processed.push(opp);
    db.opportunities.unshift(opp); // Add to database
  }

  writeDB(db);
  return processed;
}

// Serve Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
