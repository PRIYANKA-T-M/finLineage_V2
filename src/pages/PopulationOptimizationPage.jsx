import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Activity,
  Layers,
  Sliders,
  Award,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Compass,
  ArrowRight,
  GitBranch,
  Building2,
  PieChart,
  BarChart3,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Send,
  Zap
} from 'lucide-react';
import { speciesAPI, populationAPI, geneticBreedingAPI } from '../api/client';

export default function PopulationOptimizationPage() {
  const [speciesList, setSpeciesList] = useState([]);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('');
  const [loading, setLoading] = useState(true);

  // M3 Data
  const [summary, setSummary] = useState(null);
  const [meanKinshipList, setMeanKinshipList] = useState([]);
  const [founders, setFounders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [transfers, setTransfers] = useState([]);

  // Optimizer Form State
  const [inbreedingWeight, setInbreedingWeight] = useState(40);
  const [mkWeight, setMkWeight] = useState(30);
  const [founderWeight, setFounderWeight] = useState(30);
  const [maxPairs, setMaxPairs] = useState(4);
  const [optimizing, setOptimizing] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);

  // Scenario Simulator State
  const [simulating, setSimulating] = useState(false);
  const [scenarioComparison, setScenarioComparison] = useState(null);

  useEffect(() => {
    loadSpecies();
  }, []);

  const loadSpecies = async () => {
    try {
      const res = await speciesAPI.getAll();
      setSpeciesList(res.data || []);
      if (res.data?.length > 0) {
        const firstId = res.data[0].speciesId;
        setSelectedSpeciesId(firstId);
        loadPopulationData(firstId);
      }
    } catch (err) {
      console.error('Failed to load species', err);
    }
  };

  const loadPopulationData = async (spId) => {
    setLoading(true);
    try {
      const [sumRes, mkRes, fndRes, alrRes, trfRes] = await Promise.all([
        populationAPI.getSummary(spId),
        populationAPI.getMeanKinship(spId),
        populationAPI.getFounders(spId),
        populationAPI.getAlerts(spId),
        geneticBreedingAPI.getTransfers(spId)
      ]);

      setSummary(sumRes.data);
      setMeanKinshipList(mkRes.data?.meanKinshipList || []);
      setFounders(fndRes.data?.founders || []);
      setAlerts(alrRes.data?.alerts || []);
      setTransfers(trfRes.data?.transfers || []);

      // Auto-generate initial plan
      runOptimization(spId, { inbreeding: 0.4, meanKinship: 0.3, founderBalance: 0.3 }, 4);
    } catch (err) {
      console.error('Failed to load population metrics', err);
    } finally {
      setLoading(false);
    }
  };

  const runOptimization = async (spId, weights, pairLimit) => {
    setOptimizing(true);
    try {
      const res = await geneticBreedingAPI.optimizePlan({
        speciesId: spId,
        planningHorizon: 1,
        weights,
        maxPairs: pairLimit,
        allowCrossInstitution: true
      });
      setGeneratedPlan(res.data);
    } catch (err) {
      console.error('Failed to generate breeding plan', err);
    } finally {
      setOptimizing(false);
    }
  };

  const handleGeneratePlan = (e) => {
    e.preventDefault();
    const total = inbreedingWeight + mkWeight + founderWeight;
    const normWeights = {
      inbreeding: inbreedingWeight / total,
      meanKinship: mkWeight / total,
      founderBalance: founderWeight / total
    };
    runOptimization(selectedSpeciesId, normWeights, maxPairs);
  };

  const handleRunScenarioComparison = async () => {
    setSimulating(true);
    try {
      const res = await geneticBreedingAPI.compareScenarios(selectedSpeciesId);
      setScenarioComparison(res.data?.comparison || []);
    } catch (err) {
      console.error('Failed to run scenario comparison', err);
    } finally {
      setSimulating(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'CRITICAL_BREEDER':
        return { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', label: 'Critical Conservation Priority' };
      case 'HIGH_PRIORITY':
        return { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', label: 'High Genetic Value' };
      case 'SECURE':
        return { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', label: 'Adequately Represented' };
      case 'OVER_REPRESENTED':
      default:
        return { bg: '#fefce8', border: '#fde047', text: '#854d0e', label: 'Lineage Over-Represented' };
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{
              background: '#ecfdf5',
              color: '#047857',
              padding: '0.2rem 0.65rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.04em'
            }}>
              MILESTONE 3
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              Population Viability &amp; Conservation Optimization
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Population Genetic Optimization
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '720px', marginTop: '0.25rem' }}>
            Population-level studbook intelligence: Mean Kinship (<span style={{ fontFamily: 'var(--font-mono)' }}>MK</span>) ranking, founder allele retention, multi-objective pairing optimization, and multi-generation projection.
          </p>
        </div>

        {/* Species selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
            Select Species
          </label>
          <select
            value={selectedSpeciesId}
            onChange={(e) => {
              setSelectedSpeciesId(e.target.value);
              loadPopulationData(e.target.value);
            }}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              minWidth: '240px'
            }}
          >
            {speciesList.map(sp => (
              <option key={sp.speciesId} value={sp.speciesId}>
                {sp.commonName} ({sp.scientificName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Compass size={36} color="var(--primary)" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Calculating population-level kinship matrix and founder retention...</p>
        </div>
      ) : summary && (
        <>
          {/* Top 4 Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
            <div className="stat-card" style={{ padding: '1.25rem', borderRadius: '12px' }}>
              <span className="stat-label">Total Population</span>
              <div className="stat-value">{summary.populationSize}</div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                {summary.activeBreeders} active breeding candidates
              </span>
            </div>

            <div className="stat-card" style={{ padding: '1.25rem', borderRadius: '12px' }}>
              <span className="stat-label">Mean Population F</span>
              <div className="stat-value" style={{ color: summary.meanPopulationF <= 0.05 ? '#059669' : '#ca8a04', fontFamily: 'var(--font-mono)' }}>
                {summary.meanPopulationF.toFixed(4)}
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                {(summary.meanPopulationF * 100).toFixed(2)}% average inbreeding
              </span>
            </div>

            <div className="stat-card" style={{ padding: '1.25rem', borderRadius: '12px' }}>
              <span className="stat-label">Gene Diversity (GD)</span>
              <div className="stat-value" style={{ color: '#0284c7', fontFamily: 'var(--font-mono)' }}>
                {(summary.geneDiversity * 100).toFixed(1)}%
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                GD = 1 - Mean Kinship ({summary.meanPopulationKinship.toFixed(4)})
              </span>
            </div>

            <div className="stat-card" style={{ padding: '1.25rem', borderRadius: '12px' }}>
              <span className="stat-label">Effective Population (Ne)</span>
              <div className="stat-value" style={{ fontFamily: 'var(--font-mono)' }}>
                {summary.effectivePopulationSize.toFixed(1)}
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                Ne = (4 * Nm * Nf) / (Nm + Nf)
              </span>
            </div>
          </div>

          {/* Conservation Alerts Banner (if any) */}
          {alerts.length > 0 && (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              marginBottom: '1.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <AlertTriangle size={18} color="#d97706" />
                <strong style={{ fontSize: '0.92rem', color: '#92400e' }}>
                  Conservation &amp; Population Health Alerts ({alerts.length})
                </strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.6rem' }}>
                {alerts.map((al, idx) => (
                  <div key={idx} style={{ background: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #fef08a', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 800, color: al.severity === 'HIGH' ? '#dc2626' : '#d97706', display: 'block', fontSize: '0.74rem' }}>
                      [{al.severity}] {al.type.replace(/_/g, ' ')}
                    </span>
                    <p style={{ color: 'var(--text-main)', marginTop: '0.2rem' }}>{al.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Multi-Objective Breeding Plan Optimizer */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 400px) 1fr', gap: '1.75rem', marginBottom: '2rem' }}>
            {/* Left: Optimizer Sliders */}
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Zap size={20} color="var(--primary)" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Multi-Objective Optimizer
                </h2>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Balance competing conservation goals: minimize inbreeding, favor low mean-kinship individuals, and equalize founder allele representation.
              </p>

              <form onSubmit={handleGeneratePlan}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Minimize Offspring Inbreeding (F)</label>
                    <strong>{inbreedingWeight}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={inbreedingWeight}
                    onChange={(e) => setInbreedingWeight(parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Lower Population Mean Kinship</label>
                    <strong>{mkWeight}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={mkWeight}
                    onChange={(e) => setMkWeight(parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Equalize Founder Representation</label>
                    <strong>{founderWeight}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={founderWeight}
                    onChange={(e) => setFounderWeight(parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Max Recommended Pairs</label>
                  <select
                    className="form-control"
                    value={maxPairs}
                    onChange={(e) => setMaxPairs(parseInt(e.target.value))}
                  >
                    <option value={2}>2 Pairs</option>
                    <option value={3}>3 Pairs</option>
                    <option value={4}>4 Pairs</option>
                    <option value={6}>6 Pairs</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={optimizing}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                >
                  {optimizing ? 'Calculating Optimal Set...' : 'Generate Optimal Breeding Plan'}
                </button>
              </form>
            </div>

            {/* Right: Recommended Plan Output */}
            <div>
              {generatedPlan ? (
                <div className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.72rem', background: '#dbeafe', color: '#1d4ed8', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                          OPTIMIZED PLAN
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {generatedPlan.planId}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        Recommended Breeding Cohort ({generatedPlan.recommendedPairs.length} Pairs)
                      </h3>
                    </div>

                    {/* Projected Impact Pills */}
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.35rem 0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: '#166534', fontWeight: 700, display: 'block' }}>Projected Mean F</span>
                        <strong style={{ color: '#15803d', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                          {generatedPlan.projectedImpact.projectedMeanF.toFixed(4)}
                        </strong>
                      </div>
                      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.35rem 0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: '#1e40af', fontWeight: 700, display: 'block' }}>F Reduction</span>
                        <strong style={{ color: '#2563eb', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                          +{generatedPlan.projectedImpact.fReductionPercent.toFixed(1)}%
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Pairing Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                    {generatedPlan.recommendedPairs.map((pair, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#ffffff',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '1rem',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                          <span style={{
                            background: '#f1f5f9',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            color: 'var(--text-main)'
                          }}>
                            Pair #{idx + 1}
                          </span>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            color: '#059669',
                            background: '#ecfdf5',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px'
                          }}>
                            Fit: {pair.optimizationScore.toFixed(1)}/100
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <div style={{ textAlign: 'left' }}>
                            <strong style={{ color: 'var(--male-color)', fontSize: '0.95rem' }}>{pair.sireId}</strong>
                            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                              {pair.sireInstitution}
                            </span>
                          </div>
                          <span style={{ color: 'var(--text-dim)', fontWeight: 700 }}>×</span>
                          <div style={{ textAlign: 'right' }}>
                            <strong style={{ color: 'var(--female-color)', fontSize: '0.95rem' }}>{pair.damId}</strong>
                            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                              {pair.damInstitution}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', fontSize: '0.75rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '6px' }}>
                          <div>
                            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.68rem' }}>Offspring F</span>
                            <strong style={{ fontFamily: 'var(--font-mono)' }}>{pair.predictedOffspringF.toFixed(4)}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.68rem' }}>Topology</span>
                            <strong>{pair.relationship.replace(/_/g, ' ')}</strong>
                          </div>
                        </div>

                        {pair.isCrossInstitution && (
                          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#b45309', fontWeight: 600 }}>
                            <Building2 size={12} /> Requires Inter-Institutional Transfer
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: 'var(--text-muted)' }}>Configure weights and click generate to compute the optimal breeding pairs.</p>
                </div>
              )}
            </div>
          </div>

          {/* Section: Individual Mean Kinship Ranking Table */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '2rem' }}>
            <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Individual Mean Kinship (MK) Conservation Rankings
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Ranked by ascending Mean Kinship. Lower MK represents rarer alleles with higher conservation priority.
                </span>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Rank</th>
                    <th>Specimen ID</th>
                    <th>Sex</th>
                    <th>Facility Location</th>
                    <th>Mean Kinship (MK)</th>
                    <th>Percentile</th>
                    <th>Conservation Priority</th>
                    <th>Founder Status</th>
                  </tr>
                </thead>
                <tbody>
                  {meanKinshipList.map((ind) => {
                    const badge = getPriorityBadge(ind.conservationPriority);
                    return (
                      <tr key={ind.specimenId}>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: ind.rank <= 3 ? '#fef08a' : '#f1f5f9',
                            color: ind.rank <= 3 ? '#854d0e' : '#475569',
                            fontWeight: 800,
                            fontSize: '0.75rem'
                          }}>
                            {ind.rank}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: ind.sex === 'M' ? 'var(--male-color)' : 'var(--female-color)' }}>
                            {ind.specimenId}
                          </strong>
                          {ind.localIdentifier && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: '0.4rem' }}>
                              ({ind.localIdentifier})
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${ind.sex === 'M' ? 'badge-male' : 'badge-female'}`}>
                            {ind.sex === 'M' ? '♂ Male' : (ind.sex === 'F' ? '♀ Female' : '⚲ Unknown')}
                          </span>
                        </td>
                        <td>{ind.institutionName}</td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-main)' }}>
                            {ind.meanKinship.toFixed(5)}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                            {(ind.percentile * 100).toFixed(0)}th
                          </span>
                        </td>
                        <td>
                          <span style={{
                            background: badge.bg,
                            border: `1px solid ${badge.border}`,
                            color: badge.text,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 800
                          }}>
                            {badge.label}
                          </span>
                        </td>
                        <td>
                          {ind.isFounder ? (
                            <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                              ★ Wild Founder
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Captive Born</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Founder Representation Lineage Tracking */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '2rem' }}>
            <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Founder Representation &amp; Lineage Retention ({founders.length} Founders)
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Comparing actual founder genome contribution against target representation to prevent lineage loss.
              </span>
            </div>

            <div className="table-responsive">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Founder ID</th>
                    <th>Sex</th>
                    <th>Origin Facility</th>
                    <th>Direct Descendants</th>
                    <th>Target %</th>
                    <th>Actual %</th>
                    <th>Deviation</th>
                    <th>Lineage Status</th>
                  </tr>
                </thead>
                <tbody>
                  {founders.map((f) => {
                    const dev = f.representationDeviation;
                    const isOver = f.status === 'OVER_REPRESENTED';
                    const isUnder = f.status === 'UNDER_REPRESENTED';

                    return (
                      <tr key={f.founderId}>
                        <td>
                          <strong style={{ color: f.sex === 'M' ? 'var(--male-color)' : 'var(--female-color)' }}>
                            {f.founderId}
                          </strong>
                          {f.localIdentifier && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: '0.3rem' }}>
                              ({f.localIdentifier})
                            </span>
                          )}
                        </td>
                        <td>{f.sex === 'M' ? '♂ Male' : '♀ Female'}</td>
                        <td>{f.institutionName}</td>
                        <td>
                          <span className="badge badge-secondary">{f.descendantsCount} descendants</span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{f.targetPercent.toFixed(1)}%</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                          {f.actualPercent.toFixed(1)}%
                        </td>
                        <td style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: isOver ? '#b45309' : (isUnder ? '#dc2626' : '#15803d')
                        }}>
                          {dev > 0 ? `+${dev.toFixed(1)}%` : `${dev.toFixed(1)}%`}
                        </td>
                        <td>
                          <span style={{
                            background: isUnder ? '#fef2f2' : (isOver ? '#fffbeb' : '#f0fdf4'),
                            border: `1px solid ${isUnder ? '#fca5a5' : (isOver ? '#fde68a' : '#bbf7d0')}`,
                            color: isUnder ? '#991b1b' : (isOver ? '#92400e' : '#166534'),
                            padding: '0.2rem 0.5rem',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 800
                          }}>
                            {f.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Multi-Generation Scenario Projection & Comparison */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Multi-Generation Strategy Comparison (3-Gen Projection)
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Evaluate 3 alternative conservation management trajectories across 3 simulated generations without database mutation.
                </span>
              </div>
              <button
                onClick={handleRunScenarioComparison}
                disabled={simulating}
                className="btn btn-primary"
                style={{ fontSize: '0.8rem' }}
              >
                {simulating ? 'Simulating Generations...' : 'Compare 3 Strategies'}
              </button>
            </div>

            {scenarioComparison ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                {scenarioComparison.map((scen) => (
                  <div
                    key={scen.scenarioId}
                    style={{
                      background: scen.scenarioId === 'scen-balanced' ? '#f0fdf4' : '#ffffff',
                      border: `1px solid ${scen.scenarioId === 'scen-balanced' ? '#86efac' : 'var(--border-color)'}`,
                      borderRadius: '12px',
                      padding: '1.25rem',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {scen.name}
                      </h4>
                      {scen.scenarioId === 'scen-balanced' && (
                        <span style={{ background: '#22c55e', color: '#ffffff', fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      {scen.description}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.68rem' }}>Projected Mean F</span>
                        <strong style={{ fontFamily: 'var(--font-mono)' }}>{scen.projectedMeanF.toFixed(4)}</strong>
                      </div>
                      <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.68rem' }}>Mean Kinship</span>
                        <strong style={{ fontFamily: 'var(--font-mono)' }}>{scen.projectedMeanKinship.toFixed(4)}</strong>
                      </div>
                      <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.68rem' }}>Founder Imbalance</span>
                        <strong style={{ fontFamily: 'var(--font-mono)' }}>{scen.founderImbalanceScore.toFixed(3)}</strong>
                      </div>
                      <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.68rem' }}>Conservation Score</span>
                        <strong style={{ color: '#059669', fontSize: '0.85rem' }}>{scen.overallScore.toFixed(1)}/100</strong>
                      </div>
                    </div>

                    {/* Generational Trajectory */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem' }}>
                        Simulated Trajectory (Gen 0 → Gen 3):
                      </span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                        {scen.simulatedGenerations.map((g) => (
                          <div key={g.generationNumber} style={{ textAlign: 'center' }}>
                            <span style={{ color: 'var(--text-dim)', display: 'block' }}>Gen {g.generationNumber}</span>
                            <strong>F={g.meanInbreedingF.toFixed(3)}</strong>
                            <span style={{ fontSize: '0.65rem', color: '#059669', display: 'block' }}>
                              {g.diversityRetentionPercent.toFixed(0)}% Div
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Simulate and contrast 3 breeding strategies (Strict Min F vs. Founder Lineage Preservation vs. Balanced Multi-Objective).
                </p>
                <button onClick={handleRunScenarioComparison} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                  Run 3-Strategy Comparison
                </button>
              </div>
            )}
          </div>

          {/* Section: Cross-Institution Transfer Opportunities */}
          {transfers.length > 0 && (
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Cross-Institution Transfer Opportunities ({transfers.length})
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  High-benefit pairings between specimens located at different facilities requiring inter-institutional studbook approval.
                </span>
              </div>

              <div className="table-responsive">
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Sire</th>
                      <th>Sire Facility</th>
                      <th>Dam</th>
                      <th>Dam Facility</th>
                      <th>Predicted Offspring F</th>
                      <th>Genetic Diversity Gain</th>
                      <th>Approval Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.map((tr, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong style={{ color: 'var(--male-color)' }}>{tr.sireId}</strong>
                        </td>
                        <td>{tr.sireInstitution}</td>
                        <td>
                          <strong style={{ color: 'var(--female-color)' }}>{tr.damId}</strong>
                        </td>
                        <td>{tr.damInstitution}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                          {tr.predictedOffspringF.toFixed(4)}
                        </td>
                        <td>
                          <span style={{ color: '#059669', fontWeight: 700 }}>
                            {tr.geneticBenefit}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#1d4ed8',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 800
                          }}>
                            {tr.transferStatus.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
