import React, { useState, useEffect } from "react";
import { Opportunity, OpportunityType } from "./types";
import { OpportunityCard } from "./components/OpportunityCard";
import { AgentControl } from "./components/AgentControl";
// Icons disabled per user request to remove icons

export default function App() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'home' | 'jobs' | 'scholarships'>('home');
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for creating/editing opportunity
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  
  const [formTitle, setFormTitle] = useState<string>("");
  const [formType, setFormType] = useState<OpportunityType>("job");
  const [formDomain, setFormDomain] = useState<string>("");
  const [formSource, setFormSource] = useState<'LinkedIn' | 'Facebook' | 'Web'>("LinkedIn");
  const [formUrl, setFormUrl] = useState<string>("");
  const [formCompany, setFormCompany] = useState<string>("");
  const [formLocation, setFormLocation] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");

  // Search filter
  const [adminSearch, setAdminSearch] = useState<string>("");
  const [adminFilterType, setAdminFilterType] = useState<"all" | "job" | "scholarship">("all");
  const [adminFilterStatus, setAdminFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");

  // Fetch opportunities on load
  const fetchOpportunities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/opportunities");
      if (!res.ok) {
        throw new Error("Impossible de charger les opportunités depuis le serveur.");
      }
      const data = await res.json();
      setOpportunities(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors du chargement des opportunités.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  // Set domain on changing views
  useEffect(() => {
    setSelectedDomain(null);
  }, [currentView]);

  // Handle Approve/Publish Opportunity
  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/opportunities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved", published: true }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOpportunities(prev => prev.map(o => o.id === id ? updated : o));
      } else {
        alert("Erreur lors de la publication de l'opportunité.");
      }
    } catch (err) {
      console.error("Error approving opportunity:", err);
    }
  };

  // Handle Reject Opportunity
  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/opportunities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", published: false }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOpportunities(prev => prev.map(o => o.id === id ? updated : o));
      } else {
        alert("Erreur lors du rejet de l'opportunité.");
      }
    } catch (err) {
      console.error("Error rejecting opportunity:", err);
    }
  };

  // Handle Delete Opportunity
  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cette opportunité ?")) {
      return;
    }
    try {
      const res = await fetch(`/api/opportunities/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setOpportunities(prev => prev.filter(o => o.id !== id));
      } else {
        alert("Erreur lors de la suppression.");
      }
    } catch (err) {
      console.error("Error deleting opportunity:", err);
    }
  };

  // Handle submit form (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDomain.trim() || !formCompany.trim()) {
      alert("Veuillez remplir au moins le titre, le domaine et l'entreprise ou institution.");
      return;
    }

    const payload = {
      title: formTitle.trim(),
      type: formType,
      domain: formDomain.trim(),
      source: formSource,
      url: formUrl.trim(),
      companyOrInstitution: formCompany.trim(),
      locationOrEligibility: formLocation.trim(),
      description: formDescription.trim(),
      status: editingOpp ? editingOpp.status : "approved", // Manual additions are approved by default
      published: editingOpp ? editingOpp.published : true,
      foundByAgent: editingOpp ? editingOpp.foundByAgent : "Saisie Manuelle Admin"
    };

    try {
      let res;
      if (editingOpp) {
        res = await fetch(`/api/opportunities/${editingOpp.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/opportunities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const saved = await res.json();
        if (editingOpp) {
          setOpportunities(prev => prev.map(o => o.id === editingOpp.id ? saved : o));
        } else {
          setOpportunities(prev => [saved, ...prev]);
        }
        closeForm();
      } else {
        const errData = await res.json();
        alert(errData.error || "Une erreur est survenue lors de l'enregistrement.");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("Erreur réseau de communication avec le serveur.");
    }
  };

  const openCreateForm = () => {
    setEditingOpp(null);
    setFormTitle("");
    setFormType("job");
    setFormDomain("");
    setFormSource("LinkedIn");
    setFormUrl("");
    setFormCompany("");
    setFormLocation("");
    setFormDescription("");
    setIsFormOpen(true);
  };

  const openEditForm = (opp: Opportunity) => {
    setEditingOpp(opp);
    setFormTitle(opp.title);
    setFormType(opp.type);
    setFormDomain(opp.domain);
    setFormSource(opp.source);
    setFormUrl(opp.url);
    setFormCompany(opp.companyOrInstitution);
    setFormLocation(opp.locationOrEligibility);
    setFormDescription(opp.description);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingOpp(null);
  };

  // Called when AI Agent finishes scanning
  const handleAgentComplete = (newOpps: Opportunity[]) => {
    // Reload opportunities to get fresh data in sync
    fetchOpportunities();
    // basculer on admin and show draft tab to let moderator review it!
    setAdminFilterStatus("pending");
  };

  // Derive dynamic Domains list based on current opportunities
  // If a domain doesn't exist, it is created automatically as soon as it's added!
  const allJobOpportunities = opportunities.filter(o => o.type === "job");
  const allScholarshipOpportunities = opportunities.filter(o => o.type === "scholarship");

  const jobDomains = Array.from(new Set(
    allJobOpportunities
      .filter(o => o.status === "approved" || isAdminMode)
      .map(o => o.domain)
  )).sort();

  const scholarshipDomains = Array.from(new Set(
    allScholarshipOpportunities
      .filter(o => o.status === "approved" || isAdminMode)
      .map(o => o.domain)
  )).sort();

  // Statistics for footer stats panel
  const totalOffresDetectees = opportunities.length;
  const activeDomainsCount = Array.from(new Set(opportunities.map(o => o.domain))).length;

  // Filter public view data
  const publicFilteredOpps = opportunities.filter(o => {
    if (o.status !== "approved") return false;
    
    // Type separation
    if (currentView === "jobs" && o.type !== "job") return false;
    if (currentView === "scholarships" && o.type !== "scholarship") return false;

    // Domain separation
    if (selectedDomain && o.domain !== selectedDomain) return false;

    return true;
  });

  // Filter admin view data
  const adminFilteredOpps = opportunities.filter(o => {
    // Search
    if (adminSearch.trim()) {
      const query = adminSearch.toLowerCase();
      const matchTitle = o.title.toLowerCase().includes(query);
      const matchComp = o.companyOrInstitution.toLowerCase().includes(query);
      const matchDesc = o.description.toLowerCase().includes(query);
      const matchDom = o.domain.toLowerCase().includes(query);
      if (!matchTitle && !matchComp && !matchDesc && !matchDom) return false;
    }

    // Type filter
    if (adminFilterType !== "all" && o.type !== adminFilterType) return false;

    // Status filter
    if (adminFilterStatus !== "all" && o.status !== adminFilterStatus) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col selection:bg-neutral-200">
      
      {/* HEADER: From Professional Polish theme */}
      <header className="p-6 md:p-8 flex flex-col sm:flex-row justify-between items-center border-b border-gray-100 bg-white gap-4 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
          <span className="text-xl font-black tracking-tighter uppercase text-black">KopeAI</span>
        </div>

        <nav className="flex items-center gap-6 text-xs font-mono uppercase tracking-wider">
          <span 
            className={`cursor-pointer pb-1 transition-all ${currentView === 'home' && !isAdminMode ? 'border-b-2 border-black font-bold text-black' : 'opacity-40 hover:opacity-100 text-black'}`}
            onClick={() => { setCurrentView('home'); setIsAdminMode(false); }}
          >
            Accueil
          </span>
          <span 
            className={`cursor-pointer pb-1 transition-all ${currentView === 'jobs' && !isAdminMode ? 'border-b-2 border-black font-bold text-black' : 'opacity-40 hover:opacity-100 text-black'}`}
            onClick={() => { setCurrentView('jobs'); setIsAdminMode(false); }}
          >
            Emplois
          </span>
          <span 
            className={`cursor-pointer pb-1 transition-all ${currentView === 'scholarships' && !isAdminMode ? 'border-b-2 border-black font-bold text-black' : 'opacity-40 hover:opacity-100 text-black'}`}
            onClick={() => { setCurrentView('scholarships'); setIsAdminMode(false); }}
          >
            Bourses
          </span>
          <span 
            id="nav-admin-link"
            className={`cursor-pointer pb-1 transition-all ${isAdminMode ? 'border-b-2 border-black font-bold text-black' : 'opacity-40 hover:opacity-100 text-black'}`}
            onClick={() => setIsAdminMode(true)}
          >
            Espace Modération
          </span>
        </nav>
      </header>

      {/* CORE DISPLAY CONTAINER */}
      <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-6 md:px-12 py-10">
        
        {/* VIEW 1: HOME PAGE (As requested + matched with theme styling) */}
        {!isAdminMode && currentView === 'home' && (
          <div className="flex-grow flex flex-col items-center justify-center text-center py-12 md:py-20 animate-fadeIn">
            {/* Pill badge */}
            <div className="mb-6 px-4 py-1 border border-black rounded-full text-[10px] uppercase font-bold tracking-[0.2em] text-black bg-white">
              Intelligence Artificielle & Opportunités d'Avenir
            </div>

            {/* Giant human title */}
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-[1.1] max-w-4xl text-black">
              Trouvez votre prochaine destination de carrière ou d'études.
            </h1>

            {/* Purpose/Objectif text described in French to match user request */}
            <p className="text-base md:text-lg text-neutral-600 max-w-2xl mb-12 leading-relaxed">
              Nos agents intelligents analysent quotidiennement <strong>LinkedIn</strong>, <strong>Facebook</strong>, et le <strong>Web</strong> pour filtrer les meilleures opportunités. Chaque lien d'offre est étudié, décrit de manière concise et soumis pour étude à l'administrateur avant publication officielle.
            </p>

            {/* TWO ELEVATED BUTTONS:
                "Mets seulement deux couleurs. Fond blanc avec écrits noir. Tous les boutons seront des elevatedBoutton avec hover de couleur grise."
            */}
            <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md sm:max-w-none justify-center">
              
              {/* Button 1: Offres d'emplois */}
              <button 
                id="btn-goto-jobs"
                onClick={() => setCurrentView('jobs')}
                className="bg-white border-2 border-black text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:bg-neutral-200 hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-200 px-8 py-6 rounded-none font-bold flex flex-col items-center gap-1.5 min-w-[280px] text-center cursor-pointer"
              >
                <span className="text-xl">Offres d'Emplois</span>
                <span className="text-[10px] uppercase tracking-widest opacity-60 font-mono">Consulter par domaines</span>
              </button>

              {/* Button 2: Bourses d'études */}
              <button 
                id="btn-goto-scholarships"
                onClick={() => setCurrentView('scholarships')}
                className="bg-white border-2 border-black text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:bg-neutral-200 hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-200 px-8 py-6 rounded-none font-bold flex flex-col items-center gap-1.5 min-w-[280px] text-center cursor-pointer"
              >
                <span className="text-xl">Bourses d'Études</span>
                <span className="text-[10px] uppercase tracking-widest opacity-60 font-mono">Découvrir les programmes</span>
              </button>

            </div>

            {/* Toggle quick button for admin convenience */}
            <div className="mt-16 pt-8 border-t border-neutral-100 w-full flex justify-center">
              <button
                onClick={() => setIsAdminMode(true)}
                className="bg-white border border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-200 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all px-4 py-2 font-mono text-xs uppercase"
              >
                🔑 Entrer dans l'espace Administration
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2 & 3: PUBLIC OPPORTUNITY VIEWS (Filtered by domains) */}
        {!isAdminMode && (currentView === 'jobs' || currentView === 'scholarships') && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Section Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-neutral-200">
              <div>
                <button
                  onClick={() => setCurrentView('home')}
                  className="bg-white border border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-200 hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all px-3 py-1.5 text-xs font-mono uppercase mb-4 inline-flex items-center gap-1.5"
                >
                  [&lt;-] Retour
                </button>
                <h2 className="text-3xl font-black text-black uppercase tracking-tight">
                  {currentView === 'jobs' ? "Offres d'Emplois de l'IA" : "Bourses d'Études de l'IA"}
                </h2>
                <p className="text-sm text-neutral-500 mt-1 font-sans">
                  Filtrez les offres réelles et vérifiées par domaine d'activité.
                </p>
              </div>

              {/* General Quick statistics */}
              <div className="text-xs font-mono text-right flex flex-col text-neutral-500 border-l border-neutral-200 pl-4">
                <span>Total de domaines : <strong className="text-black">{currentView === 'jobs' ? jobDomains.length : scholarshipDomains.length}</strong></span>
                <span>Offres publiées : <strong className="text-black">{publicFilteredOpps.length} d'offres</strong></span>
              </div>
            </div>

            {/* DOMAINS ROW / NAVIGATION TABS (Dynamic domain creation is supported organically) */}
            <div className="py-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs uppercase font-bold tracking-wider text-black">Filtrer par Domaine :</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  id="domain-filter-all"
                  onClick={() => setSelectedDomain(null)}
                  className={`border border-black px-4 py-2 text-xs font-mono uppercase cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                    selectedDomain === null 
                      ? "bg-black text-white" 
                      : "bg-white text-black hover:bg-neutral-200 hover:shadow-none hover:translate-y-[1px]"
                  }`}
                >
                  Tous les domaines ({currentView === 'jobs' ? allJobOpportunities.filter(o => o.status === 'approved').length : allScholarshipOpportunities.filter(o => o.status === 'approved').length})
                </button>

                {/* Map of dynamically discovered categories! If an AI Agent adds a new one, it shows up here instantly! */}
                {(currentView === 'jobs' ? jobDomains : scholarshipDomains).map((domainName) => {
                  const count = opportunities.filter(o => o.type === (currentView === 'jobs' ? 'job' : 'scholarship') && o.domain === domainName && o.status === 'approved').length;
                  return (
                    <button
                      id={`domain-filter-${domainName}`}
                      key={domainName}
                      onClick={() => setSelectedDomain(domainName)}
                      className={`border border-black px-4 py-2 text-xs font-mono uppercase cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                        selectedDomain === domainName 
                          ? "bg-black text-white" 
                          : "bg-white text-black hover:bg-neutral-200 hover:shadow-none hover:translate-y-[1px]"
                      }`}
                    >
                      {domainName} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MAIN CARDS GRID */}
            {isLoading ? (
              <div className="py-20 text-center text-neutral-600 font-mono tracking-widest text-xs flex flex-col items-center justify-center gap-4">
                [DÉCOMPRESSION DE LA BASE DE DONNÉES...]
              </div>
            ) : publicFilteredOpps.length === 0 ? (
              <div className="border border-dashed border-black p-12 text-center bg-white space-y-4">
                <p className="text-lg font-bold text-black font-mono">AUCUNE OPPORTUNITÉ PUBLIÉE DANS CE SECTEUR</p>
                <p className="text-sm text-neutral-500 max-w-md mx-auto">
                  Les agents intelligents d'IA n'ont pas encore de résultats validés pour ce filtre ou cet onglet. Veuillez basculer vers un autre domaine ou consulter l'espace d'administration pour en générer de nouveaux de manière autonome.
                </p>
                <button
                  onClick={() => setSelectedDomain(null)}
                  className="bg-white border border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-200 hover:shadow-none transition-all px-4 py-2 font-mono text-xs uppercase"
                >
                  Voir tous les domaines
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicFilteredOpps.map((opp) => (
                  <OpportunityCard 
                    key={opp.id} 
                    opportunity={opp} 
                    isAdmin={false}
                  />
                ))}
              </div>
            )}
            
            {/* Quick action helper bottom */}
            <div className="pt-10 flex justify-center">
              <button
                onClick={() => { setCurrentView('home'); }}
                className="bg-white border border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-200 hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all px-6 py-3 font-mono text-sm uppercase font-bold text-center"
              >
                Retour à la page d'accueil
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: ADMIN MODULE (Everything in one scrollable page layout) */}
        {isAdminMode && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Admin Banner & Heading */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b-2 border-black">
              <div>
                <span className="text-[10px] bg-black text-white px-2.5 py-0.5 rounded font-mono font-bold uppercase tracking-widest">
                  CONSOLE DE CONTRÔLE ET MODÉRATION
                </span>
                <h2 className="text-3xl font-black text-black tracking-tight mt-1">
                  GESTION DU SYSTÈME AUTOMATISÉ
                </h2>
                <p className="text-xs font-mono text-neutral-500 mt-1">
                  Analysez et validez les opportunités détectées par les agents Gemini et configurez la publication.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  id="btn-admin-add-manual"
                  onClick={openCreateForm}
                  className="bg-white border border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-200 hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all px-4 py-2 font-mono text-xs uppercase flex items-center gap-1.5 font-bold cursor-pointer"
                >
                  [+] Saisie manuelle
                </button>
                <button
                  onClick={() => { setIsAdminMode(false); setCurrentView('home'); }}
                  className="bg-white border border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-200 hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all px-4 py-2 font-mono text-xs uppercase cursor-pointer"
                >
                  Fermer Panel
                </button>
              </div>
            </div>

            {/* METRICS STATS PANEL: Matches Professional Polish Layout exactly */}
            <section className="bg-neutral-50 border border-black p-6 md:p-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="border-l-2 border-black pl-4">
                  <div className="text-2xl md:text-3xl font-black text-black">
                    {activeDomainsCount}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider font-mono text-neutral-500">
                    Domaines Actifs
                  </div>
                </div>
                <div className="border-l-2 border-black pl-4">
                  <div className="text-2xl md:text-3xl font-black text-black">
                    {totalOffresDetectees}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider font-mono text-neutral-500">
                    Détectées (Total)
                  </div>
                </div>
                <div className="border-l-2 border-black pl-4">
                  <div className="text-2xl md:text-3xl font-black text-black font-sans text-amber-600 bg-white border border-amber-200 px-2 py-0.5 inline-block rounded-sm">
                    {opportunities.filter(o => o.status === "pending").length}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider font-mono text-neutral-500 mt-1">
                    En attente d'étude
                  </div>
                </div>
                <div className="border-l-2 border-black pl-4">
                  <div className="text-2xl md:text-3xl font-black text-black text-emerald-600">
                    {opportunities.filter(o => o.status === "approved").length}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider font-mono text-neutral-500">
                    Offres Publiées
                  </div>
                </div>
              </div>
            </section>

            {/* AI AGENT CONTROLLER COMPONENT:
                Includes custom search/crawler utilizing parameters!
            */}
            <div className="border border-black p-2 bg-neutral-100/30">
              <AgentControl onAgentComplete={handleAgentComplete} />
            </div>

            {/* LIST OF MODERATON INBOX */}
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-neutral-50 p-4 border border-black font-mono text-xs">
                
                {/* Search query box */}
                <div className="flex items-center gap-2 w-full lg:w-96 border border-neutral-300 bg-white px-2 py-1.5">
                  <span className="text-neutral-500 shrink-0 font-bold">Chercher :</span>
                  <input
                    id="search-input-admin"
                    type="text"
                    placeholder="Chercher titre, entreprise, secteur, agent..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="w-full focus:outline-none bg-white text-black text-xs font-sans"
                  />
                  {adminSearch && (
                    <button onClick={() => setAdminSearch("")} className="text-neutral-500 hover:text-black">
                      [x]
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                  <div className="flex items-center gap-1.5">
                    <span>Secteur:</span>
                    <select
                      id="opt-type-filter"
                      value={adminFilterType}
                      onChange={(e) => setAdminFilterType(e.target.value as any)}
                      className="border border-neutral-300 bg-white text-black py-1 px-2 font-mono text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-black"
                    >
                      <option value="all">Tout</option>
                      <option value="job">Emplois uniquement</option>
                      <option value="scholarship">Bourses uniquement</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span>Statut:</span>
                    <select
                      id="opt-status-filter"
                      value={adminFilterStatus}
                      onChange={(e) => setAdminFilterStatus(e.target.value as any)}
                      className="border border-neutral-300 bg-white text-black py-1 px-2 font-mono text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-black"
                    >
                      <option value="all">Tous statuts</option>
                      <option value="pending">En attente de modération</option>
                      <option value="approved">Publié / Approuvé</option>
                      <option value="rejected">Rejeté</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Moderation results */}
              {isLoading ? (
                <div className="py-20 text-center font-mono text-xs">COMMUNICATION AVEC LA BASE DE DONNÉES...</div>
              ) : adminFilteredOpps.length === 0 ? (
                <div className="border border-black p-12 text-center bg-white">
                  <p className="font-mono text-sm text-neutral-400 uppercase">Aucun élément ne correspond à ces critères d'administration.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {adminFilteredOpps.map((opp) => (
                    <OpportunityCard 
                      key={opp.id} 
                      opportunity={opp} 
                      isAdmin={true}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onDelete={handleDelete}
                      onEditClick={openEditForm}
                    />
                  ))}
                </div>
              )}

            </div>

          </div>
        )}

      </main>

      {/* MANUAL CREATION & EDIT DRAWER/MODAL DIALOG */}
      {isFormOpen && (
        <div id="form-overlay" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black w-full max-w-2xl text-black flex flex-col max-h-[90vh] animate-fadeIn">
            
            {/* Header */}
            <div className="p-5 border-b border-black flex justify-between items-center bg-white">
              <h3 className="text-lg font-black uppercase tracking-tight text-black">
                {editingOpp ? "MODIFIER L'OPPORTUNITÉ" : "NOUVELLE OPPORTUNITÉ MANUELLE"}
              </h3>
              <button 
                id="btn-close-form"
                onClick={closeForm}
                className="text-black hover:bg-neutral-100 p-2 rounded-none cursor-pointer border border-black/10 font-bold"
              >
                [X]
              </button>
            </div>

            {/* Form Scrollable Body */}
            <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Category OpportunityType */}
                <div>
                  <label className="block text-black font-bold uppercase mb-1.5">Type de catalogue *</label>
                  <select
                    id="form-select-type"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as OpportunityType)}
                    className="w-full border border-black bg-white text-black p-2 focus:outline-none focus:ring-1 focus:ring-black rounded-none"
                  >
                    <option value="job">Offre d'Emploi</option>
                    <option value="scholarship">Bourse d'Étude</option>
                  </select>
                </div>

                {/* 2. Source Type */}
                <div>
                  <label className="block text-black font-bold uppercase mb-1.5">Source d'origine *</label>
                  <select
                    id="form-select-source"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value as any)}
                    className="w-full border border-black bg-white text-black p-2 focus:outline-none focus:ring-1 focus:ring-black rounded-none"
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Web">Web (Recherche libre)</option>
                  </select>
                </div>
              </div>

              {/* 3. Title */}
              <div>
                <label className="block text-black font-bold uppercase mb-1.5">Titre de l'opportunité *</label>
                <input
                  id="form-input-title"
                  type="text"
                  required
                  placeholder="Ex : Concepteur de Logiciels Cloud, Bourse Master BioTech"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full border border-black bg-white text-black p-2 rounded-none placeholder:text-neutral-400 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 4. Company Or Institution */}
                <div>
                  <label className="block text-black font-bold uppercase mb-1.5">Compagnie ou Institution Émettrice *</label>
                  <input
                    id="form-input-company"
                    type="text"
                    required
                    placeholder="Ex: Google France, Université de Montréal"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full border border-black bg-white text-black p-2 rounded-none text-sm font-sans focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                {/* 5. Domain Category - IMPORTANT: If a brand-new domain is specified, it gets dynamically added instantly! */}
                <div>
                  <label className="block text-black font-bold uppercase mb-1.5">Domaine / Secteur *</label>
                  <input
                    id="form-input-domain"
                    type="text"
                    required
                    placeholder="Ex: Informatique, Santé, Finance"
                    value={formDomain}
                    onChange={(e) => setFormDomain(e.target.value)}
                    className="w-full border border-black bg-white text-black p-2 rounded-none text-sm font-sans focus:outline-none focus:ring-1 focus:ring-black"
                    list="domain-datalist"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Saisissez un domaine d'activité. S'il n'existe pas, un nouvel onglet sera généré automatiquement !
                  </p>
                  <datalist id="domain-datalist">
                    {(formType === "job" ? jobDomains : scholarshipDomains).map(d => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 6. URL */}
                <div>
                  <label className="block text-black font-bold uppercase mb-1.5">Lien de l'offre d'origine</label>
                  <input
                    id="form-input-url"
                    type="url"
                    placeholder="https://example.com/offre"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="w-full border border-black bg-white text-black p-2 rounded-none text-sm font-sans focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                {/* 7. Location Or Eligibility */}
                <div>
                  <label className="block text-black font-bold uppercase mb-1.5">Éligibilité / Localisation</label>
                  <input
                    id="form-input-location"
                    type="text"
                    placeholder="Ex: Paris (Télétravail) ou Étudiants du tiers-monde"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full border border-black bg-white text-black p-2 rounded-none text-sm font-sans focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {/* 8. Description (French: Quelques lignes) */}
              <div>
                <label className="block text-black font-bold uppercase mb-1.5">Description (Sera rédigée en quelques lignes) *</label>
                <textarea
                  id="form-textarea-description"
                  required
                  rows={4}
                  placeholder="Décrivez brièvement les responsabilités, compétences, dotations ou bourses en quelques lignes explicatives (3 à 5 lignes de préférence)..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full border border-black bg-white text-black p-2 rounded-none text-sm font-sans focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Form Action Buttons: 2 colors, white bg, black written, gray hover */}
              <div className="flex justify-end gap-3 pt-4 border-t border-black/10">
                <button
                  id="btn-cancel-form"
                  type="button"
                  onClick={closeForm}
                  className="border border-black bg-white text-black hover:bg-neutral-200 transition-all font-bold px-4 py-2 uppercase cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  id="btn-submit-form"
                  type="submit"
                  className="bg-black text-white hover:bg-neutral-800 border border-black transition-all font-bold px-6 py-2 uppercase cursor-pointer"
                >
                  {editingOpp ? "Enregistrer les modifications" : "Créer et Publier"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* FOOTER: Matching Professional Polish theme footer statistics & visual borders */}
      <section className="bg-gray-50 border-t border-gray-100 p-8 md:p-12 w-full mt-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-7xl mx-auto text-black">
          <div className="border-l-2 border-black pl-5">
            <div className="text-2xl md:text-3xl font-black mb-1">{activeDomainsCount}</div>
            <div className="text-[10px] uppercase tracking-widest opacity-60 font-mono">Domaines Actifs</div>
          </div>
          <div className="border-l-2 border-black pl-5">
            <div className="text-2xl md:text-3xl font-black mb-1">{totalOffresDetectees}</div>
            <div className="text-[10px] uppercase tracking-widest opacity-60 font-mono">Offres Détectées</div>
          </div>
          <div className="border-l-2 border-black pl-5">
            <div className="text-2xl md:text-3xl font-black mb-1">24/7</div>
            <div className="text-[10px] uppercase tracking-widest opacity-60 font-mono">Surveillance IA</div>
          </div>
          <div className="border-l-2 border-black pl-5">
            <div className="text-2xl md:text-3xl font-black mb-1">98%</div>
            <div className="text-[10px] uppercase tracking-widest opacity-60 font-mono">Taux de Pertinence</div>
          </div>
        </div>
      </section>

      <footer className="p-6 flex flex-col sm:flex-row justify-between items-center text-[9px] uppercase tracking-[0.2em] opacity-50 border-t border-gray-100 bg-white w-full max-w-7xl mx-auto gap-4">
        <div>© 2026 KopeAI — Plateforme d'Extraction d'Opportunités</div>
        <div className="flex gap-4">
          <span>Confidentialité</span>
          <span>Conditions générales</span>
          <span 
            className="font-bold underline cursor-pointer"
            onClick={() => setIsAdminMode(!isAdminMode)}
          >
            {isAdminMode ? "Quitter le Panel" : "Portail Modérateur"}
          </span>
        </div>
      </footer>

    </div>
  );
}
