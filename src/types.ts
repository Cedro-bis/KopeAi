export type OpportunityType = 'job' | 'scholarship';

export interface Opportunity {
  id: string;
  title: string;
  type: OpportunityType;
  domain: string;
  source: 'LinkedIn' | 'Facebook' | 'Web';
  url: string;
  description: string;
  companyOrInstitution: string;
  locationOrEligibility: string;
  published: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  foundByAgent: string;
}

export interface AgentStatus {
  id: string;
  name: string;
  source: 'LinkedIn' | 'Facebook' | 'Web';
  type: OpportunityType;
  status: 'idle' | 'searching' | 'completed' | 'error';
  lastRun: string | null;
  resultsFound: number;
}
