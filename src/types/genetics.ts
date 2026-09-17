// Milestone 2 & 3 Genetic, Pedigree, and Population Types

export interface CommonAncestorPath {
  ancestorId: string;
  ancestorName?: string;
  sireGenerationDistance: number;
  damGenerationDistance: number;
  ancestorInbreedingCoefficient: number;
  pathContribution: number;
  pathDescription?: string;
}

export interface CommonAncestorResult {
  ancestorId: string;
  ancestorSex: string;
  sireDistance: number;
  damDistance: number;
  ancestorF: number;
  contribution: number;
  pathsCount: number;
  isFounder: boolean;
}

export type PedigreeRelationshipType =
  | 'UNRELATED'
  | 'PARENT_OFFSPRING'
  | 'FULL_SIBLING'
  | 'HALF_SIBLING'
  | 'FIRST_COUSIN'
  | 'SECOND_COUSIN'
  | 'DISTANT_RELATIVE'
  | 'SELF'
  | 'UNKNOWN';

export type BreedingRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';

export type BreedingRecommendation =
  | 'APPROVED_OPTIMAL'
  | 'APPROVED_WITH_CAUTION'
  | 'RESTRICTED_HIGH_RISK'
  | 'PROHIBITED_CRITICAL'
  | 'INSUFFICIENT_PEDIGREE';

export interface SpeciesBreedingPolicy {
  policyId: string;
  speciesId: string;
  speciesScientificName: string;
  version: string;
  lowMaxF: number;        // e.g. 0.03125
  moderateMaxF: number;   // e.g. 0.0625
  highMaxF: number;       // e.g. 0.25
  maxKinship: number;     // e.g. 0.125
  minPedigreeCompleteness: number; // e.g. 0.70
  disclaimer: string;
}

export interface BreedingEvaluationResult {
  evaluationId: string;
  sireId: string;
  damId: string;
  speciesId: string;
  speciesName: string;
  inbreedingCoefficient: number;    // Wright's F_X
  kinshipCoefficient: number;       // Pairwise Kinship phi_ij
  relationship: PedigreeRelationshipType;
  riskLevel: BreedingRiskLevel;
  recommendation: BreedingRecommendation;
  commonAncestors: CommonAncestorResult[];
  ancestralPaths: CommonAncestorPath[];
  pedigreeCompleteness: number;
  pedigreeDepth: number;
  explanation: {
    summary: string;
    why: string[];
    formula: string;
    notes: string;
  };
  policyUsed: {
    policyId: string;
    version: string;
  };
  evaluatedAt: string;
  evaluatedBy: string;
}

export interface CandidateMateResult {
  specimenId: string;
  localIdentifier?: string | null;
  sex: string;
  institutionId: string;
  institutionName: string;
  inbreedingCoefficient: number;    // predicted offspring F
  kinshipCoefficient: number;       // pairwise kinship
  relationship: PedigreeRelationshipType;
  riskLevel: BreedingRiskLevel;
  recommendation: BreedingRecommendation;
  pedigreeCompleteness: number;
  rank: number;
  isSameInstitution: boolean;
}

export interface PairingMatrixCell {
  sireId: string;
  damId: string;
  f: number;
  kinship: number;
  risk: BreedingRiskLevel;
  relationship: PedigreeRelationshipType;
  feasible: boolean;
}

export interface PairingMatrixResult {
  speciesId: string;
  males: Array<{ id: string; name: string; institution: string; founder: boolean }>;
  females: Array<{ id: string; name: string; institution: string; founder: boolean }>;
  matrix: PairingMatrixCell[][];
}

// --- Milestone 3 Types ---

export interface FounderContribution {
  founderId: string;
  founderName: string;
  institution: string;
  sex: string;
  contributionPercent: number;     // e.g. 32.5
  targetPercent: number;           // e.g. 25.0
  deviation: number;               // positive = over-represented
  status: 'OVER_REPRESENTED' | 'BALANCED' | 'UNDER_REPRESENTED';
}

export interface IndividualMeanKinship {
  specimenId: string;
  localIdentifier?: string | null;
  sex: string;
  institution: string;
  meanKinship: number;             // MK_i
  populationRank: number;
  percentile: number;
  geneticValue: 'HIGH_VALUE' | 'MODERATE_VALUE' | 'COMMON';
  activeBreeder: boolean;
}

export interface PopulationSummaryMetrics {
  speciesId: string;
  speciesName: string;
  populationSize: number;
  activeBreeders: number;
  potentialBreeders: number;
  maleCount: number;
  femaleCount: number;
  unknownSexCount: number;
  wildFounders: number;
  captiveBorn: number;
  averageKinship: number;
  meanPopulationF: number;
  pedigreeCompleteness: number;
  lowestMK: { specimenId: string; value: number };
  highestMK: { specimenId: string; value: number };
  founderDiversity: { current: number; total: number };
}

export interface PopulationAlert {
  alertId: string;
  level: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  affectedCount?: number;
  actionRecommendation: string;
}

export interface BreedingPlanPair {
  pairIndex: number;
  sireId: string;
  sireInstitution: string;
  damId: string;
  damInstitution: string;
  predictedOffspringF: number;
  pairwiseKinship: number;
  meanKinship: number;
  founderBalanceScore: number;     // 0.0 - 1.0 (higher = better balance)
  overallScore: number;            // lower is better
  riskLevel: BreedingRiskLevel;
  recommendationLevel: 'OPTIMAL' | 'GOOD' | 'ACCEPTABLE' | 'TRADE_OFF' | 'NOT_RECOMMENDED';
  isCrossInstitution: boolean;
  rationale: string;
  tradeOffs?: string;
}

export interface BreedingPlan {
  planId: string;
  speciesId: string;
  speciesName: string;
  planName: string;
  status: 'PROPOSED' | 'APPROVED' | 'ACTIVE' | 'ARCHIVED';
  planningHorizonGenerations: number;
  objectives: {
    minimizeOffspringInbreeding: boolean;
    minimizeMeanKinship: boolean;
    preserveFounderRepresentation: boolean;
    limitIndividualReproduction: boolean;
  };
  weights: {
    inbreeding: number;
    meanKinship: number;
    founderBalance: number;
  };
  populationSize: number;
  candidatePairsEvaluated: number;
  feasiblePairs: number;
  recommendedPairs: BreedingPlanPair[];
  projectedImpact: {
    currentMeanF: number;
    projectedMeanF: number;
    fReductionPercent: number;
    currentMeanKinship: number;
    projectedMeanKinship: number;
    kinshipReductionPercent: number;
    founderImbalanceBefore: number;
    founderImbalanceAfter: number;
    imbalanceImprovementPercent: number;
  };
  createdAt: string;
  createdBy: string;
  algorithmVersion: string;
  policyVersion: string;
}

export interface ScenarioSimulationResult {
  scenarioId: string;
  scenarioName: string;
  speciesId: string;
  generations: Array<{
    generation: number;
    label: string;
    populationSize: number;
    meanF: number;
    meanKinship: number;
    founderImbalance: number;
    diversityRetentionPercent: number;
  }>;
  overallScore: number;
  summary: string;
}

export interface CrossInstitutionTransferOpportunity {
  transferId: string;
  sireId: string;
  sireInstitution: string;
  damId: string;
  damInstitution: string;
  predictedOffspringF: number;
  pairwiseKinship: number;
  geneticGainScore: number; // e.g. 0.88
  geneticBenefit: 'VERY_HIGH' | 'HIGH' | 'MODERATE';
  transferStatus: 'REQUIRES_INSTITUTIONAL_APPROVAL';
  reason: string;
}
