import React from "react";
import { Opportunity } from "../types";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onEditClick?: (opp: Opportunity) => void;
  isAdmin?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  isAdmin = false,
  onEditClick,
  onApprove,
  onReject,
  onDelete
}) => {

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="text-xs border border-black px-2 py-0.5 rounded bg-black text-white">Publié</span>;
      case "rejected":
        return <span className="text-xs border border-neutral-300 px-2 py-0.5 rounded bg-neutral-200 text-neutral-700">Rejeté</span>;
      default:
        return <span className="text-xs border border-dashed border-black px-2 py-0.5 rounded bg-white text-black">En attente</span>;
    }
  };

  const cardId = `opp-card-${opportunity.id}`;

  return (
    <div
      id={cardId}
      className="border border-black p-5 bg-white shadow-sm flex flex-col justify-between transition-all duration-150 hover:shadow-md"
    >
      <div>
        <div className="flex justify-between items-start mb-2 gap-2">
          <span className="text-xs font-mono uppercase bg-neutral-100 px-2 py-1 border border-black/10">
            {opportunity.domain}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs flex items-center border border-black/20 px-2 py-0.5 rounded bg-neutral-50 font-mono">
              ★ {opportunity.source}
            </span>
            {isAdmin && getStatusBadge(opportunity.status)}
          </div>
        </div>

        <h4 className="text-lg font-bold text-black mt-2 leading-tight">
          {opportunity.title}
        </h4>

        <p className="text-xs text-neutral-600 font-medium mb-3 mt-1 font-mono uppercase">
          [{opportunity.type === "job" ? "Emploi" : "Bourse"}] • {opportunity.companyOrInstitution}
        </p>

        <p className="text-sm text-black leading-relaxed whitespace-pre-wrap font-sans my-3">
          {opportunity.description}
        </p>

        <div className="text-xs border-t border-neutral-100 pt-3 flex flex-col gap-1.5 font-mono text-neutral-500">
          <div>
            <span className="text-black font-semibold">Éligibilité/Lieu:</span> {opportunity.locationOrEligibility}
          </div>
          {opportunity.foundByAgent && (
            <div>
              <span className="text-black font-semibold">Trouvé par:</span> {opportunity.foundByAgent}
            </div>
          )}
          <div>
            <span className="text-black font-semibold">Découvert le:</span> {new Date(opportunity.createdAt).toLocaleDateString("fr-FR")}
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-neutral-100 flex flex-wrap gap-2 items-center justify-between">
        {opportunity.url ? (
          <a
            id={`apply-link-${opportunity.id}`}
            href={opportunity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold underline hover:text-neutral-500"
          >
            Voir l'offre d'origine [Lien]
          </a>
        ) : (
          <span className="text-xs text-neutral-400 italic font-mono">Aucun lien disponible</span>
        )}

        {isAdmin && (
          <div className="flex gap-2 mt-2 sm:mt-0">
            {opportunity.status === "pending" && onApprove && (
              <button
                id={`approve-btn-${opportunity.id}`}
                onClick={() => onApprove(opportunity.id)}
                className="bg-white text-black hover:bg-neutral-200 border border-black text-xs font-mono px-3 py-1.5 uppercase transition-colors shadow-sm duration-100"
              >
                Publier
              </button>
            )}
            {opportunity.status === "pending" && onReject && (
              <button
                id={`reject-btn-${opportunity.id}`}
                onClick={() => onReject(opportunity.id)}
                className="bg-white text-black hover:bg-neutral-200 border border-black text-xs font-mono px-3 py-1.5 uppercase transition-colors shadow-sm duration-100"
              >
                Rejeter
              </button>
            )}
            {onEditClick && (
              <button
                id={`edit-btn-${opportunity.id}`}
                onClick={() => onEditClick(opportunity)}
                className="bg-white text-black hover:bg-neutral-200 border border-black text-xs font-mono px-2 py-1.5 uppercase transition-colors shadow-sm duration-100 flex items-center justify-center"
                title="Modifier"
              >
                Éditer
              </button>
            )}
            {onDelete && (
              <button
                id={`delete-btn-${opportunity.id}`}
                onClick={() => onDelete(opportunity.id)}
                className="bg-white text-black hover:bg-neutral-200 border border-black text-xs font-mono px-2 py-1.5 uppercase transition-colors shadow-sm duration-100 flex items-center justify-center"
                title="Supprimer"
              >
                Supprimer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
