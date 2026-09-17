import {
  CommonAncestorPath,
  CommonAncestorResult,
  PedigreeRelationshipType,
  BreedingRiskLevel,
  BreedingRecommendation,
  SpeciesBreedingPolicy,
  BreedingEvaluationResult,
  CandidateMateResult,
  PairingMatrixResult,
  PairingMatrixCell
} from '../types/genetics';

export interface SpecimenRecord {
  specimenId: string;
  institutionId: string;
  speciesId: string;
  localIdentifier?: string | null;
  sex: string;
  birthDate?: string | null;
  wildFounder: boolean;
  activeBreeder: boolean;
  status: string;
}

export interface ParentEdge {
  specimenId: string;
  parentId: string;
  parentRole: string;
  confidence: number;
}

// --- Species Conservation Breeding Policies ---
export const DEFAULT_BREEDING_POLICIES: Record<string, SpeciesBreedingPolicy> = {
  // Pot-bellied Seahorse
  '33333333-3333-3333-3333-333333333333': {
    policyId: 'pol-seahorse-v2',
    speciesId: '33333333-3333-3333-3333-333333333333',
    speciesScientificName: 'Hippocampus abdominalis',
    version: '2.1.0',
    lowMaxF: 0.03125,
    moderateMaxF: 0.0625,
    highMaxF: 0.25,
    maxKinship: 0.125,
    minPedigreeCompleteness: 0.70,
    disclaimer: 'Pedigree-based risk classification. Thresholds are configurable conservation-management policies and should be reviewed by qualified species experts.'
  },
  // Green Sea Turtle
  '44444444-4444-4444-4444-444444444444': {
    policyId: 'pol-turtle-v2',
    speciesId: '44444444-4444-4444-4444-444444444444',
    speciesScientificName: 'Chelonia mydas',
    version: '2.0.0',
    lowMaxF: 0.03125,
    moderateMaxF: 0.0625,
    highMaxF: 0.25,
    maxKinship: 0.125,
    minPedigreeCompleteness: 0.65,
    disclaimer: 'Pedigree-based risk classification. Thresholds are configurable conservation-management policies and should be reviewed by qualified species experts.'
  }
};

export class FounderCoefficientProvider {
  static getFounderF(specimen: SpecimenRecord | undefined): number {
    if (!specimen) return 0.0;
    if (specimen.wildFounder) return 0.0;
    return 0.0; // Base baseline assumption for unrecorded founder lineages
  }
}

export class CommonAncestorAnalyzer {
  /**
   * Explores all paths from an individual to each of its ancestors.
   * Returns a map of ancestorId -> Array of paths, where each path is an array of specimenIds from individual up to ancestor.
   */
  static getAncestralPaths(
    individualId: string,
    allParents: ParentEdge[],
    maxGenerations: number = 6
  ): Map<string, string[][]> {
    const pathsByAncestor = new Map<string, string[][]>();

    function dfs(currentId: string, currentPath: string[], depth: number) {
      if (depth >= maxGenerations) return;

      const parentRels = allParents.filter(p => p.specimenId === currentId);
      for (const rel of parentRels) {
        const parentId = rel.parentId;
        // Avoid cycle if any
        if (currentPath.includes(parentId)) continue;

        const nextPath = [...currentPath, parentId];
        if (!pathsByAncestor.has(parentId)) {
          pathsByAncestor.set(parentId, []);
        }
        pathsByAncestor.get(parentId)!.push(nextPath);

        dfs(parentId, nextPath, depth + 1);
      }
    }

    dfs(individualId, [individualId], 0);
    return pathsByAncestor;
  }

  /**
   * Identifies common ancestors between Sire and Dam and extracts all non-redundant contributing paths.
   */
  static findCommonAncestors(
    sireId: string,
    damId: string,
    allParents: ParentEdge[],
    allSpecimens: SpecimenRecord[],
    maxGenerations: number = 5
  ): { commonAncestors: CommonAncestorResult[]; paths: CommonAncestorPath[] } {
    if (sireId === damId) {
      // Selfing
      const sire = allSpecimens.find(s => s.specimenId === sireId);
      return {
        commonAncestors: [{
          ancestorId: sireId,
          ancestorSex: sire?.sex || 'U',
          sireDistance: 0,
          damDistance: 0,
          ancestorF: 0.0,
          contribution: 0.5,
          pathsCount: 1,
          isFounder: Boolean(sire?.wildFounder)
        }],
        paths: [{
          ancestorId: sireId,
          ancestorName: sireId,
          sireGenerationDistance: 0,
          damGenerationDistance: 0,
          ancestorInbreedingCoefficient: 0.0,
          pathContribution: 0.5,
          pathDescription: 'Direct self-lineage path'
        }]
      };
    }

    // Direct Parent-Offspring check: is Sire a parent of Dam or Dam a parent of Sire?
    const sireIsDamParent = allParents.some(p => p.specimenId === damId && p.parentId === sireId);
    const damIsSireParent = allParents.some(p => p.specimenId === sireId && p.parentId === damId);

    const sirePathsMap = this.getAncestralPaths(sireId, allParents, maxGenerations);
    const damPathsMap = this.getAncestralPaths(damId, allParents, maxGenerations);

    const commonAncestorIds = new Set<string>();
    for (const ancestorId of sirePathsMap.keys()) {
      if (damPathsMap.has(ancestorId)) {
        commonAncestorIds.add(ancestorId);
      }
    }

    // Direct parent cases
    if (sireIsDamParent) commonAncestorIds.add(sireId);
    if (damIsSireParent) commonAncestorIds.add(damId);

    const contributingPaths: CommonAncestorPath[] = [];
    const commonAncestorsSummary: CommonAncestorResult[] = [];

    // Track path signatures to avoid naive double-counting
    const evaluatedPairPaths = new Set<string>();

    for (const ancestorId of commonAncestorIds) {
      const ancestorSpecimen = allSpecimens.find(s => s.specimenId === ancestorId);
      const ancestorF = FounderCoefficientProvider.getFounderF(ancestorSpecimen);

      let minSireDist = 999;
      let minDamDist = 999;
      let totalContributionForAncestor = 0;
      let pathCount = 0;

      // Handle direct parent-offspring:
      if (ancestorId === sireId && sireIsDamParent) {
        const damPathsToSire = damPathsMap.get(sireId) || [[damId, sireId]];
        for (const p of damPathsToSire) {
          const nDam = p.length - 1;
          const nSire = 0;
          const contrib = Math.pow(0.5, nSire + nDam + 1) * (1 + ancestorF);
          contributingPaths.push({
            ancestorId,
            ancestorName: ancestorSpecimen?.localIdentifier || ancestorId,
            sireGenerationDistance: nSire,
            damGenerationDistance: nDam,
            ancestorInbreedingCoefficient: ancestorF,
            pathContribution: contrib,
            pathDescription: `Direct Parent-Offspring Path: Dam is offspring of Sire (${ancestorId})`
          });
          totalContributionForAncestor += contrib;
          pathCount++;
          minSireDist = Math.min(minSireDist, nSire);
          minDamDist = Math.min(minDamDist, nDam);
        }
      } else if (ancestorId === damId && damIsSireParent) {
        const sirePathsToDam = sirePathsMap.get(damId) || [[sireId, damId]];
        for (const p of sirePathsToDam) {
          const nSire = p.length - 1;
          const nDam = 0;
          const contrib = Math.pow(0.5, nSire + nDam + 1) * (1 + ancestorF);
          contributingPaths.push({
            ancestorId,
            ancestorName: ancestorSpecimen?.localIdentifier || ancestorId,
            sireGenerationDistance: nSire,
            damGenerationDistance: nDam,
            ancestorInbreedingCoefficient: ancestorF,
            pathContribution: contrib,
            pathDescription: `Direct Parent-Offspring Path: Sire is offspring of Dam (${ancestorId})`
          });
          totalContributionForAncestor += contrib;
          pathCount++;
          minSireDist = Math.min(minSireDist, nSire);
          minDamDist = Math.min(minDamDist, nDam);
        }
      } else {
        const sPaths = sirePathsMap.get(ancestorId) || [];
        const dPaths = damPathsMap.get(ancestorId) || [];

        for (const sp of sPaths) {
          for (const dp of dPaths) {
            // Check for path independence: Sire path and Dam path must not intersect EXCEPT at the common ancestor
            const sireIntermediate = sp.slice(0, -1);
            const damIntermediate = dp.slice(0, -1);
            const hasCommonIntermediate = sireIntermediate.some(node => damIntermediate.includes(node));

            if (!hasCommonIntermediate) {
              const n1 = sp.length - 1; // distance from sire to ancestor
              const n2 = dp.length - 1; // distance from dam to ancestor
              const pathSignature = `${sp.join('>')}__${dp.join('>')}`;

              if (!evaluatedPairPaths.has(pathSignature)) {
                evaluatedPairPaths.add(pathSignature);

                const contribution = Math.pow(0.5, n1 + n2 + 1) * (1 + ancestorF);
                contributingPaths.push({
                  ancestorId,
                  ancestorName: ancestorSpecimen?.localIdentifier || ancestorId,
                  sireGenerationDistance: n1,
                  damGenerationDistance: n2,
                  ancestorInbreedingCoefficient: ancestorF,
                  pathContribution: contribution,
                  pathDescription: `${sp.join(' → ')} ∩ ${dp.join(' → ')}`
                });

                totalContributionForAncestor += contribution;
                pathCount++;
                minSireDist = Math.min(minSireDist, n1);
                minDamDist = Math.min(minDamDist, n2);
              }
            }
          }
        }
      }

      if (pathCount > 0) {
        commonAncestorsSummary.push({
          ancestorId,
          ancestorSex: ancestorSpecimen?.sex || 'U',
          sireDistance: minSireDist === 999 ? 0 : minSireDist,
          damDistance: minDamDist === 999 ? 0 : minDamDist,
          ancestorF,
          contribution: totalContributionForAncestor,
          pathsCount: pathCount,
          isFounder: Boolean(ancestorSpecimen?.wildFounder)
        });
      }
    }

    // Sort common ancestors by highest contribution first
    commonAncestorsSummary.sort((a, b) => b.contribution - a.contribution);
    contributingPaths.sort((a, b) => b.pathContribution - a.pathContribution);

    return { commonAncestors: commonAncestorsSummary, paths: contributingPaths };
  }
}

export class WrightInbreedingCalculator {
  /**
   * Calculates Wright's Inbreeding Coefficient F_X for a proposed pairing.
   * F_X = sum_A sum_paths (1/2)^(n1 + n2 + 1) * (1 + F_A)
   */
  static calculateF(paths: CommonAncestorPath[]): number {
    let fTotal = 0;
    for (const p of paths) {
      fTotal += p.pathContribution;
    }
    // Round to 6 decimal places to prevent floating point drift
    return Math.round(fTotal * 1000000) / 1000000;
  }
}

export class KinshipCalculator {
  /**
   * Pairwise Kinship Coefficient phi_ij between two individuals.
   * Equal to the predicted offspring inbreeding coefficient F_offspring(i, j) if i != j.
   * If i == j, phi_ii = 0.5 * (1 + F_i).
   */
  static calculateKinship(
    ind1Id: string,
    ind2Id: string,
    allParents: ParentEdge[],
    allSpecimens: SpecimenRecord[]
  ): number {
    if (ind1Id === ind2Id) {
      const spec = allSpecimens.find(s => s.specimenId === ind1Id);
      // For self, calculate individual's own inbreeding F
      const parents = allParents.filter(p => p.specimenId === ind1Id);
      const sireRel = parents.find(p => p.parentRole === 'SIRE');
      const damRel = parents.find(p => p.parentRole === 'DAM');

      let ownF = 0.0;
      if (sireRel && damRel) {
        const { paths } = CommonAncestorAnalyzer.findCommonAncestors(sireRel.parentId, damRel.parentId, allParents, allSpecimens);
        ownF = WrightInbreedingCalculator.calculateF(paths);
      }
      return Math.round(0.5 * (1 + ownF) * 1000000) / 1000000;
    }

    const { paths } = CommonAncestorAnalyzer.findCommonAncestors(ind1Id, ind2Id, allParents, allSpecimens);
    const f = WrightInbreedingCalculator.calculateF(paths);
    return f;
  }
}

export class RelationshipClassifier {
  static classify(
    sireId: string,
    damId: string,
    commonAncestors: CommonAncestorResult[],
    allParents: ParentEdge[]
  ): PedigreeRelationshipType {
    if (sireId === damId) return 'SELF';

    // Direct parent-offspring
    const sireIsDamParent = allParents.some(p => p.specimenId === damId && p.parentId === sireId);
    const damIsSireParent = allParents.some(p => p.specimenId === sireId && p.parentId === damId);
    if (sireIsDamParent || damIsSireParent) return 'PARENT_OFFSPRING';

    if (commonAncestors.length === 0) return 'UNRELATED';

    // Check shared parents
    const sireParents = allParents.filter(p => p.specimenId === sireId).map(p => p.parentId);
    const damParents = allParents.filter(p => p.specimenId === damId).map(p => p.parentId);
    const sharedParents = sireParents.filter(id => damParents.includes(id));

    if (sharedParents.length >= 2) return 'FULL_SIBLING';
    if (sharedParents.length === 1) return 'HALF_SIBLING';

    // Check distances for cousins
    const closestDistances = commonAncestors.map(a => Math.max(a.sireDistance, a.damDistance));
    const minMaxDist = Math.min(...closestDistances);

    if (minMaxDist === 2) return 'FIRST_COUSIN';
    if (minMaxDist === 3) return 'SECOND_COUSIN';
    if (minMaxDist > 3) return 'DISTANT_RELATIVE';

    return 'DISTANT_RELATIVE';
  }
}

export class BreedingRiskEngine {
  static evaluateRisk(
    f: number,
    kinship: number,
    policy: SpeciesBreedingPolicy,
    pedigreeCompleteness: number
  ): { riskLevel: BreedingRiskLevel; recommendation: BreedingRecommendation } {
    if (pedigreeCompleteness < policy.minPedigreeCompleteness && f === 0) {
      return {
        riskLevel: 'UNKNOWN',
        recommendation: 'INSUFFICIENT_PEDIGREE'
      };
    }

    if (f <= policy.lowMaxF && kinship <= policy.maxKinship) {
      return {
        riskLevel: 'LOW',
        recommendation: 'APPROVED_OPTIMAL'
      };
    }

    if (f <= policy.moderateMaxF) {
      return {
        riskLevel: 'MODERATE',
        recommendation: 'APPROVED_WITH_CAUTION'
      };
    }

    if (f <= policy.highMaxF) {
      return {
        riskLevel: 'HIGH',
        recommendation: 'RESTRICTED_HIGH_RISK'
      };
    }

    return {
      riskLevel: 'CRITICAL',
      recommendation: 'PROHIBITED_CRITICAL'
    };
  }
}

export class BreedingEvaluationService {
  static evaluatePair(
    sireId: string,
    damId: string,
    allParents: ParentEdge[],
    allSpecimens: SpecimenRecord[],
    policyMap: Record<string, SpeciesBreedingPolicy> = DEFAULT_BREEDING_POLICIES,
    maxGenerations: number = 5,
    evaluator: string = 'biologist'
  ): BreedingEvaluationResult {
    const sire = allSpecimens.find(s => s.specimenId === sireId);
    const dam = allSpecimens.find(s => s.specimenId === damId);

    if (!sire) throw new Error(`Sire ${sireId} not found in studbook registry`);
    if (!dam) throw new Error(`Dam ${damId} not found in studbook registry`);
    if (sire.speciesId !== dam.speciesId) {
      throw new Error(`Incompatible pairing: Sire is species ${sire.speciesId} while Dam is ${dam.speciesId}`);
    }

    const speciesId = sire.speciesId;
    const policy = policyMap[speciesId] || DEFAULT_BREEDING_POLICIES['33333333-3333-3333-3333-333333333333'];

    const { commonAncestors, paths } = CommonAncestorAnalyzer.findCommonAncestors(
      sireId,
      damId,
      allParents,
      allSpecimens,
      maxGenerations
    );

    const inbreedingCoefficient = WrightInbreedingCalculator.calculateF(paths);
    const kinshipCoefficient = KinshipCalculator.calculateKinship(sireId, damId, allParents, allSpecimens);
    const relationship = RelationshipClassifier.classify(sireId, damId, commonAncestors, allParents);

    // Calculate Pedigree Completeness (proportion of expected parents/grandparents recorded up to gen 3)
    const sireAncestors = CommonAncestorAnalyzer.getAncestralPaths(sireId, allParents, 3);
    const damAncestors = CommonAncestorAnalyzer.getAncestralPaths(damId, allParents, 3);
    const sireCount = sireAncestors.size;
    const damCount = damAncestors.size;
    const expectedMaxAncestors = 14; // 2 parents + 4 gp + 8 ggp
    const pedigreeCompleteness = Math.min(1.0, Math.round(((sireCount + damCount) / (sire.wildFounder || dam.wildFounder ? 6 : expectedMaxAncestors)) * 100) / 100);

    const { riskLevel, recommendation } = BreedingRiskEngine.evaluateRisk(
      inbreedingCoefficient,
      kinshipCoefficient,
      policy,
      pedigreeCompleteness
    );

    const evaluationId = `eval-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Build human-friendly explanation
    const whyMessages: string[] = [];
    if (commonAncestors.length === 0) {
      whyMessages.push('No shared common ancestors detected within the analyzed generation depth.');
      whyMessages.push('Offspring inbreeding coefficient is zero (F = 0.000000).');
    } else {
      whyMessages.push(`Detected ${commonAncestors.length} common ancestor(s) across ${paths.length} contributing ancestral path(s).`);
      commonAncestors.slice(0, 3).forEach(ca => {
        whyMessages.push(`Shared ancestor ${ca.ancestorId}: Sire distance = ${ca.sireDistance} gen, Dam distance = ${ca.damDistance} gen (contrib: ${ca.contribution.toFixed(6)}).`);
      });
      whyMessages.push(`Closest pedigree topology: ${relationship.replace('_', ' ')}.`);
    }

    if (sire.wildFounder || dam.wildFounder) {
      whyMessages.push('At least one mate is a Gen 0 Wild Founder, introducing valuable unrepresented genetic alleles.');
    }

    return {
      evaluationId,
      sireId,
      damId,
      speciesId,
      speciesName: policy.speciesScientificName,
      inbreedingCoefficient,
      kinshipCoefficient,
      relationship,
      riskLevel,
      recommendation,
      commonAncestors,
      ancestralPaths: paths,
      pedigreeCompleteness,
      pedigreeDepth: maxGenerations,
      explanation: {
        summary: `Pairing ${sireId} × ${damId} yields predicted offspring F = ${inbreedingCoefficient.toFixed(5)} (${riskLevel} risk, ${relationship}).`,
        why: whyMessages,
        formula: "F_X = ∑_A (1/2)^(n1 + n2 + 1) * (1 + F_A)",
        notes: policy.disclaimer
      },
      policyUsed: {
        policyId: policy.policyId,
        version: policy.version
      },
      evaluatedAt: new Date().toISOString(),
      evaluatedBy: evaluator
    };
  }
}
