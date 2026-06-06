import React, { useState } from "react";
import { Opportunity } from "../types";

interface AgentControlProps {
  onAgentComplete: (newOpps: Opportunity[]) => void;
}

export const AgentControl: React.FC<AgentControlProps> = ({ onAgentComplete }) => {
  const [type, setType] = useState<"job" | "scholarship">("job");
  const [source, setSource] = useState<"LinkedIn" | "Facebook" | "Web">("LinkedIn");
  const [domain, setDomain] = useState<string>("Informatique");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // Common preset domains
  const DOMAIN_PRESETS = [
    "Informatique",
    "Finance",
    "Ingénierie",
    "Médecine",
    "Économie",
    "Commerce",
    "Design",
    "Lettres & Arts"
  ];

  const handleRunAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) {
      setError("Veuillez saisir ou choisir un domaine d'activité.");
      return;
    }

    setIsRunning(true);
    setError(null);
    setSuccessCount(null);

    try {
      const response = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, source, domain: domain.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue lors du scan de l'agent.");
      }

      setSuccessCount(data.count || 0);
      if (data.results) {
        onAgentComplete(data.results);
      }
    } catch (err: any) {
      console.error("Agent error:", err);
      setError(err.message || "Impossible de contacter l'agent IA. Vérifiez que la clé GEMINI_API_KEY est configurée.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div id="ai-agent-control" className="border-2 border-black p-6 bg-white shadow-sm mb-8">
      <div className="flex items-center gap-2 mb-4 border-b border-black pb-3">
        <span className="text-xs font-mono font-bold border border-black px-1 py-0.5 bg-neutral-100">[AGENT IA]</span>
        <h3 className="text-lg font-bold uppercase tracking-tight text-black">
          Lancer l'Agent IA d'opportunités
        </h3>
      </div>

      <p className="text-xs font-mono text-neutral-500 mb-5 leading-relaxed">
        Cet agent de recherche utilise l'intelligence artificielle pour analyser de manière simulée ou en temps réel (selon la configuration) les publications LinkedIn, Facebook ou le web correspondant à votre requête. Les résultats sont importés sous forme de projet "En attente" pour modération par l'administrateur.
      </p>

      <form onSubmit={handleRunAgent} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Type of Search */}
          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase mb-2 text-black">Type de recherche</label>
            <div className="flex gap-2">
              <button
                id="agent-type-job"
                type="button"
                onClick={() => setType("job")}
                className={`flex-1 py-2 text-xs font-mono uppercase font-bold rounded shadow-md transition-all border-none ${
                  type === "job" ? "bg-neutral-200 text-black shadow-inner" : "bg-white text-black hover:bg-neutral-100"
                }`}
              >
                Offres d'emploi
              </button>
              <button
                id="agent-type-scholarship"
                type="button"
                onClick={() => setType("scholarship")}
                className={`flex-1 py-2 text-xs font-mono uppercase font-bold rounded shadow-md transition-all border-none ${
                  type === "scholarship" ? "bg-neutral-200 text-black shadow-inner" : "bg-white text-black hover:bg-neutral-100"
                }`}
              >
                Bourses d'études
              </button>
            </div>
          </div>

          {/* 2. Target Platform/Source */}
          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase mb-2 text-black">Réseau Social / Source</label>
            <div className="flex gap-1.5">
              {(["LinkedIn", "Facebook", "Web"] as const).map((src) => (
                <button
                  id={`agent-src-${src}`}
                  key={src}
                  type="button"
                  onClick={() => setSource(src)}
                  className={`flex-1 py-2 text-xs font-mono uppercase font-bold rounded shadow-md transition-all border-none ${
                    source === src ? "bg-neutral-200 text-black shadow-inner font-black" : "bg-white text-black hover:bg-neutral-100"
                  }`}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Domain Context */}
          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase mb-2 text-black">Domaine ou Secteur</label>
            <div className="flex gap-1">
              <input
                id="agent-domain-input"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Ex: Informatique, Médecine..."
                className="w-full border border-black px-3 py-1.5 text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-black bg-white text-black font-sans"
              />
            </div>
          </div>
        </div>

        {/* Domain Presets Quick Selection */}
        <div>
          <span className="text-xs font-bold uppercase text-black block mb-2">Choisir un domaine populaire :</span>
          <div className="flex flex-wrap gap-1.5">
            {DOMAIN_PRESETS.map((p) => (
              <button
                id={`preset-${p}`}
                key={p}
                type="button"
                onClick={() => setDomain(p)}
                className={`px-2.5 py-1 text-xs font-mono transition-all rounded shadow-md border-none cursor-pointer ${
                  domain === p ? "bg-neutral-200 text-black font-bold" : "bg-white text-black hover:bg-neutral-100"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="border border-black p-3 bg-white text-red-600 text-xs font-mono">
            <div>
              <p className="font-bold uppercase mb-1 border-b border-red-200 pb-1">[ERREUR DE L'AGENT IA]</p>
              <p>{error}</p>
              <p className="mt-2 text-[10px] text-neutral-500">
                Avez-vous configuré votre clé d'API dans de le panneau de secrets de Google AI Studio (bouton d'engrenage / Secrets) ?
              </p>
            </div>
          </div>
        )}

        {successCount !== null && (
          <div className="border border-black p-3 bg-white text-black text-xs font-mono">
            <div>
              <span className="font-bold">[SUCCESS] :</span> {successCount} nouvelles opportunités extraites et stockées en base de données pour modération.
            </div>
          </div>
        )}

        {/* Run agent elevatedButton button with custom hover bg-gray-200 / bg-gray-150 */}
        <div className="pt-2 flex justify-end">
          <button
            id="btn-trigger-agent"
            type="submit"
            disabled={isRunning}
            className="w-full sm:w-auto flex items-center justify-center gap-2 border-none bg-white text-black hover:bg-neutral-100 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:shadow-none transition-all uppercase font-mono text-sm px-6 py-3 font-bold shadow-md hover:shadow-lg rounded cursor-pointer"
          >
            {isRunning ? (
              <>
                <span>Recherche en cours par l'Agent {source}...</span>
              </>
            ) : (
              <>
                <span>Exécuter la recherche de l'Agent IA</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
