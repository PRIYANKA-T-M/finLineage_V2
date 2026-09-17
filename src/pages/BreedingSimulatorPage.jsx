import React, { useState, useEffect } from 'react';
import {
  GitMerge,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  TrendingDown,
  Compass,
  Users,
  Grid,
  History,
  Sliders,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Info,
  Layers,
  Award,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Calculator
} from 'lucide-react';
import { specimenAPI, speciesAPI, institutionAPI, geneticBreedingAPI } from '../api/client';

export default function BreedingSimulatorPage() {
  const [activeTab, setActiveTab] = useState('simulator'); // 'simulator' | 'candidates' | 'matrix' | 'history'
  const [speciesList, setSpeciesList] = useState([]);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('');
  const [specimens, setSpecimens] = useState([]);
  const [institutions, setInstitutions] = useState([]);

  // Simulator State
  const [sireId, setSireId] = useState('');
  const [damId, setDamId] = useState('');
  const [maxGenerations, setMaxGenerations] = useState(5);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [evalError, setEvalError] = useState(null);

  // Candidate Finder State
  const [targetSpecimenId, setTargetSpecimenId] = useState('');
  const [candidatesData, setCandidatesData] = useState(null);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Matrix State
  const [matrixData, setMatrixData] = useState(null);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null);

  // Audit History State
  const [evaluationsHistory, setEvaluationsHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Policy Modal
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [policyForm, setPolicyForm] = useState(null);

  // Initial Data Load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [spRes, instRes, specRes, histRes, polRes] = await Promise.all([
        speciesAPI.getAll(),
        institutionAPI.getAll(),
        specimenAPI.getAll(),
        geneticBreedingAPI.getEvaluations(),
        geneticBreedingAPI.getPolicies()
      ]);
      setSpeciesList(spRes.data || []);
      setInstitutions(instRes.data || []);
      setSpecimens(specRes.data || []);
      setEvaluationsHistory(histRes.data?.evaluations || []);
      setPolicies(polRes.data || []);

      if (spRes.data?.length > 0) {
        setSelectedSpeciesId(spRes.data[0].speciesId);
      }
    } catch (err) {
      console.error('Failed to load initial data for breeding simulator', err);
    }
  };

  // Filter specimens for selected species
  const filteredSpecimens = specimens.filter(s => !selectedSpeciesId || s.speciesId === selectedSpeciesId);
  const maleBreeders = filteredSpecimens.filter(s => s.sex === 'M' && s.activeBreeder && s.status === 'ACTIVE');
  const femaleBreeders = filteredSpecimens.filter(s => s.sex === 'F' && s.activeBreeder && s.status === 'ACTIVE');

  // Load candidate list when target specimen changes
  const handleLoadCandidates = async (specId) => {
    if (!specId) return;
    setLoadingCandidates(true);
    try {
      const res = await geneticBreedingAPI.getCandidates(specId);
      setCandidatesData(res.data);
    } catch (err) {
      console.error('Failed to load candidates', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Load Matrix when tab changes or species changes
  useEffect(() => {
    if (activeTab === 'matrix' && selectedSpeciesId) {
      loadMatrix(selectedSpeciesId);
    }
  }, [activeTab, selectedSpeciesId]);

  const loadMatrix = async (spId) => {
    setLoadingMatrix(true);
    try {
      const res = await geneticBreedingAPI.getMatrix(spId);
      setMatrixData(res.data);
    } catch (err) {
      console.error('Failed to load pairing matrix', err);
    } finally {
      setLoadingMatrix(false);
    }
  };

  // Refresh history when viewing history tab
  useEffect(() => {
    if (activeTab === 'history') {
      refreshHistory();
    }
  }, [activeTab]);

  const refreshHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await geneticBreedingAPI.getEvaluations();
      setEvaluationsHistory(res.data?.evaluations || []);
    } catch (err) {
      console.error('Failed to refresh history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Run Evaluation
  const handleEvaluate = async (e) => {
    if (e) e.preventDefault();
    if (!sireId || !damId) {
      setEvalError('Please select both a Sire and a Dam to evaluate.');
      return;
    }
    setEvaluating(true);
    setEvalError(null);
    try {
      const res = await geneticBreedingAPI.evaluatePair(sireId, damId, maxGenerations);
      setEvaluationResult(res.data);
      refreshHistory();
    } catch (err) {
      setEvalError(err.response?.data?.message || 'Failed to evaluate pair.');
      setEvaluationResult(null);
    } finally {
      setEvaluating(false);
    }
  };

  // Quick preset loader
  const handleLoadPreset = (sId, dId) => {
    setSireId(sId);
    setDamId(dId);
    setEvalError(null);
    setTimeout(() => {
      // Auto-evaluate
      evaluateDirect(sId, dId);
    }, 50);
  };

  const evaluateDirect = async (sId, dId) => {
    setEvaluating(true);
    setEvalError(null);
    try {
      const res = await geneticBreedingAPI.evaluatePair(sId, dId, maxGenerations);
      setEvaluationResult(res.data);
      refreshHistory();
    } catch (err) {
      setEvalError(err.response?.data?.message || 'Failed to evaluate pair.');
    } finally {
      setEvaluating(false);
    }
  };

  const getRiskBadgeColor = (risk) => {
    switch (risk) {
      case 'LOW':
        return { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', iconColor: '#059669' };
      case 'MODERATE':
        return { bg: '#fefce8', border: '#fde047', text: '#854d0e', iconColor: '#ca8a04' };
      case 'HIGH':
        return { bg: '#fff7ed', border: '#fdba74', text: '#9a3412', iconColor: '#ea580c' };
      case 'CRITICAL':
      default:
        return { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', iconColor: '#dc2626' };
    }
  };

  const currentPolicy = policies.find(p => p.speciesId === selectedSpeciesId) || policies[0];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{
              background: '#e0f2fe',
              color: '#0369a1',
              padding: '0.2rem 0.65rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.04em'
            }}>
              MILESTONE 2
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              Wright's Inbreeding &amp; Kinship Intelligence
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Pedigree Breeding Simulator
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '680px', marginTop: '0.25rem' }}>
            Evaluate proposed pairings with Wright’s coefficient of inbreeding (<span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>F</span>), Malécot’s kinship coefficient (<span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>φ</span>), and auditable genealogical path breakdowns.
          </p>
        </div>

        {/* Global Selectors & Policy Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              Target Species
            </label>
            <select
              value={selectedSpeciesId}
              onChange={(e) => {
                setSelectedSpeciesId(e.target.value);
                setSireId('');
                setDamId('');
                setEvaluationResult(null);
              }}
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.45rem 0.85rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                minWidth: '220px'
              }}
            >
              {speciesList.map(sp => (
                <option key={sp.speciesId} value={sp.speciesId}>
                  {sp.commonName} ({sp.scientificName})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setPolicyForm(currentPolicy);
              setShowPolicyModal(true);
            }}
            className="btn btn-secondary"
            style={{ marginTop: '1.1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Sliders size={14} /> Threshold Policy
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '1.75rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem'
      }}>
        <button
          onClick={() => setActiveTab('simulator')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: 700,
            color: activeTab === 'simulator' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'simulator' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Calculator size={16} /> Pair Evaluation Simulator
        </button>

        <button
          onClick={() => {
            setActiveTab('candidates');
            if (sireId && !targetSpecimenId) {
              setTargetSpecimenId(sireId);
              handleLoadCandidates(sireId);
            } else if (maleBreeders.length > 0 && !targetSpecimenId) {
              setTargetSpecimenId(maleBreeders[0].specimenId);
              handleLoadCandidates(maleBreeders[0].specimenId);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: 700,
            color: activeTab === 'candidates' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'candidates' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Users size={16} /> Candidate Mate Finder
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: 700,
            color: activeTab === 'matrix' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'matrix' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Grid size={16} /> Pairing Matrix Grid
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: 700,
            color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'history' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <History size={16} /> Evaluation Audit History ({evaluationsHistory.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PAIR EVALUATION SIMULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'simulator' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: '1.75rem' }}>
          {/* Left Column: Form & Presets */}
          <div>
            <div className="glass-card" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <GitMerge size={18} color="var(--primary)" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Proposed Mating Pair
                </h2>
              </div>

              {/* Preset Test Buttons for Biological Acceptance Verification */}
              <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                  Quick Biological Validation Presets:
                </span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('SH_M102', 'SH_F101')}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: '#b91c1c'
                    }}
                    title="Full siblings sharing founders SH_M01 & SH_F01 (Expected F = 0.25)"
                  >
                    Full Siblings (F=0.25)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('SH_M201', 'SH_F202')}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: '#ca8a04'
                    }}
                    title="Cousins sharing grandfather SH_M01 (Expected F = 0.03125)"
                  >
                    Cousins (F=0.031)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('SH_M01', 'SH_F02')}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: '#15803d'
                    }}
                    title="Unrelated wild founders (Expected F = 0)"
                  >
                    Unrelated (F=0)
                  </button>
                </div>
              </div>

              <form onSubmit={handleEvaluate}>
                {/* Sire Selection */}
                <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--male-color)' }}>
                      Sire (Male Candidate)
                    </span>
                    {sireId && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {specimens.find(s => s.specimenId === sireId)?.localIdentifier || sireId}
                      </span>
                    )}
                  </label>
                  <select
                    className="form-control"
                    value={sireId}
                    onChange={(e) => setSireId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Male Sire Candidate --</option>
                    {maleBreeders.map(s => (
                      <option key={s.specimenId} value={s.specimenId}>
                        {s.specimenId} {s.localIdentifier ? `(${s.localIdentifier})` : ''} — {institutions.find(i => i.institutionId === s.institutionId)?.name || 'Institution'} {s.wildFounder ? '★ Wild Founder' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dam Selection */}
                <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--female-color)' }}>
                      Dam (Female Candidate)
                    </span>
                    {damId && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {specimens.find(s => s.specimenId === damId)?.localIdentifier || damId}
                      </span>
                    )}
                  </label>
                  <select
                    className="form-control"
                    value={damId}
                    onChange={(e) => setDamId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Female Dam Candidate --</option>
                    {femaleBreeders.map(s => (
                      <option key={s.specimenId} value={s.specimenId}>
                        {s.specimenId} {s.localIdentifier ? `(${s.localIdentifier})` : ''} — {institutions.find(i => i.institutionId === s.institutionId)?.name || 'Institution'} {s.wildFounder ? '★ Wild Founder' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Generational Depth Slider */}
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      Pedigree Traversal Depth:
                    </label>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background: '#f1f5f9',
                      padding: '0.1rem 0.5rem',
                      borderRadius: '6px'
                    }}>
                      {maxGenerations} Generations
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={maxGenerations}
                    onChange={(e) => setMaxGenerations(parseInt(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                    <span>1 (Parents only)</span>
                    <span>5 (Recommended)</span>
                    <span>8 (Deep Lineage)</span>
                  </div>
                </div>

                {evalError && (
                  <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '0.75rem', fontSize: '0.82rem' }}>
                    <ShieldAlert size={16} />
                    <span>{evalError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={evaluating || !sireId || !damId}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.92rem', justifyContent: 'center' }}
                >
                  {evaluating ? (
                    'Computing Genealogical Paths...'
                  ) : (
                    <>
                      <Calculator size={16} /> Evaluate Genetic Pair
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Configured Thresholds Summary */}
            {currentPolicy && (
              <div className="glass-card" style={{ padding: '1.25rem', background: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Active Conservation Policy
                  </span>
                  <span style={{ fontSize: '0.68rem', background: '#e2e8f0', padding: '0.15rem 0.45rem', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                    v{currentPolicy.version}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem', fontSize: '0.78rem' }}>
                  <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.7rem' }}>Low Risk Max F:</span>
                    <strong style={{ color: '#059669' }}>≤ {(currentPolicy.lowMaxF * 100).toFixed(2)}%</strong>
                  </div>
                  <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.7rem' }}>Moderate Risk:</span>
                    <strong style={{ color: '#ca8a04' }}>≤ {(currentPolicy.moderateMaxF * 100).toFixed(2)}%</strong>
                  </div>
                  <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.7rem' }}>Critical Threshold:</span>
                    <strong style={{ color: '#dc2626' }}>&gt; {(currentPolicy.highMaxF * 100).toFixed(2)}%</strong>
                  </div>
                  <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.7rem' }}>Min Completeness:</span>
                    <strong>{(currentPolicy.minPedigreeCompleteness * 100).toFixed(0)}%</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Evaluation Results & Why? Breakdown */}
          <div>
            {evaluationResult ? (
              <div>
                {/* Top Metrics Hero */}
                {(() => {
                  const badge = getRiskBadgeColor(evaluationResult.riskLevel);
                  return (
                    <div
                      style={{
                        background: badge.bg,
                        border: `1px solid ${badge.border}`,
                        borderRadius: '14px',
                        padding: '1.5rem',
                        marginBottom: '1.5rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                            <span style={{
                              background: '#ffffff',
                              color: badge.text,
                              border: `1px solid ${badge.border}`,
                              padding: '0.25rem 0.75rem',
                              borderRadius: '999px',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}>
                              {evaluationResult.riskLevel === 'LOW' && <CheckCircle2 size={15} color={badge.iconColor} />}
                              {evaluationResult.riskLevel === 'MODERATE' && <AlertTriangle size={15} color={badge.iconColor} />}
                              {(evaluationResult.riskLevel === 'HIGH' || evaluationResult.riskLevel === 'CRITICAL') && <ShieldAlert size={15} color={badge.iconColor} />}
                              {evaluationResult.riskLevel} BREEDING RISK
                            </span>
                            <span style={{
                              background: '#ffffff',
                              color: 'var(--text-main)',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              border: '1px solid #e2e8f0'
                            }}>
                              {evaluationResult.relationship.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            Recommendation: {evaluationResult.recommendation.replace(/_/g, ' ')}
                          </h3>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                            Audited by {evaluationResult.evaluatedBy}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            {new Date(evaluationResult.evaluatedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Primary Quant Numbers */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block' }}>
                            Offspring Inbreeding (F)
                          </span>
                          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: badge.text, fontFamily: 'var(--font-mono)' }}>
                            {evaluationResult.inbreedingCoefficient.toFixed(5)}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            {(evaluationResult.inbreedingCoefficient * 100).toFixed(3)}% probability of identity-by-descent
                          </span>
                        </div>

                        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block' }}>
                            Kinship Coefficient (φ)
                          </span>
                          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                            {evaluationResult.kinshipCoefficient.toFixed(5)}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            Kinship between Sire &amp; Dam
                          </span>
                        </div>

                        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block' }}>
                            Pedigree Completeness
                          </span>
                          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: evaluationResult.pedigreeCompleteness >= 0.8 ? '#059669' : '#ca8a04', fontFamily: 'var(--font-mono)' }}>
                            {(evaluationResult.pedigreeCompleteness * 100).toFixed(1)}%
                          </div>
                          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '0.35rem', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.min(100, evaluationResult.pedigreeCompleteness * 100)}%`,
                                height: '100%',
                                background: evaluationResult.pedigreeCompleteness >= 0.8 ? '#10b981' : '#f59e0b',
                                borderRadius: '3px'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* The "Why?" Explanation Breakdown Panel */}
                <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <HelpCircle size={20} color="var(--primary)" />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      "Why?" Genealogical Explanation Panel
                    </h3>
                  </div>

                  {/* Summary Bullets */}
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                      {evaluationResult.explanation.summary}
                    </p>
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {evaluationResult.explanation.why.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Wright Formula Box */}
                  <div style={{
                    padding: '0.85rem 1rem',
                    background: '#eff6ff',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', display: 'block' }}>
                        Evaluated Algorithm
                      </span>
                      <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: '#1e3a8a', fontWeight: 700 }}>
                        {evaluationResult.explanation.formula}
                      </code>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: '#3b82f6' }}>
                      n₁ = sire steps, n₂ = dam steps, F_A = ancestor inbreeding
                    </span>
                  </div>

                  {/* Shared Ancestors List */}
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                    Shared Common Ancestors ({evaluationResult.commonAncestors.length})
                  </h4>

                  {evaluationResult.commonAncestors.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No common ancestors identified within {maxGenerations} generations. The individuals are genealogically unrelated in this depth.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
                      {evaluationResult.commonAncestors.map(ca => {
                        const anc = specimens.find(s => s.specimenId === ca.ancestorId);
                        return (
                          <div
                            key={ca.ancestorId}
                            style={{
                              background: '#ffffff',
                              border: '1px solid var(--border-color)',
                              borderRadius: '10px',
                              padding: '1rem',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                              <div>
                                <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                                  {ca.ancestorId}
                                </strong>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>
                                  {anc?.localIdentifier || 'Specimen'} • Sex: {ca.ancestorSex}
                                </span>
                              </div>
                              {ca.isFounder && (
                                <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                  ★ Founder (FA=0)
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', fontSize: '0.75rem', marginTop: '0.6rem' }}>
                              <div style={{ background: '#f8fafc', padding: '0.4rem', borderRadius: '6px' }}>
                                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.68rem' }}>Sire Distance</span>
                                <strong>n₁ = {ca.sireDistance} gen</strong>
                              </div>
                              <div style={{ background: '#f8fafc', padding: '0.4rem', borderRadius: '6px' }}>
                                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.68rem' }}>Dam Distance</span>
                                <strong>n₂ = {ca.damDistance} gen</strong>
                              </div>
                              <div style={{ background: '#f8fafc', padding: '0.4rem', borderRadius: '6px' }}>
                                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.68rem' }}>Contribution</span>
                                <strong style={{ color: '#0284c7' }}>+{(ca.contribution * 100).toFixed(3)}%</strong>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Traversed Contributing Ancestral Paths Table */}
                  {evaluationResult.ancestralPaths.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                        Contributing Ancestral Paths ({evaluationResult.ancestralPaths.length})
                      </h4>
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Ancestor</th>
                              <th>Sire Path Distance</th>
                              <th>Dam Path Distance</th>
                              <th>Ancestral Lineage Breadcrumb</th>
                              <th>Contribution</th>
                            </tr>
                          </thead>
                          <tbody>
                            {evaluationResult.ancestralPaths.map((path, idx) => (
                              <tr key={idx}>
                                <td>
                                  <strong>{path.ancestorId}</strong>
                                </td>
                                <td>
                                  <span className="badge badge-secondary">{path.sireGenerationDistance} generations</span>
                                </td>
                                <td>
                                  <span className="badge badge-secondary">{path.damGenerationDistance} generations</span>
                                </td>
                                <td>
                                  <code style={{ fontSize: '0.74rem', background: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                                    {path.pathDescription}
                                  </code>
                                </td>
                                <td>
                                  <strong style={{ color: '#0284c7', fontFamily: 'var(--font-mono)' }}>
                                    +{(path.pathContribution * 100).toFixed(4)}%
                                  </strong>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Empty state before evaluating */
              <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#f0f9ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem auto'
                }}>
                  <Compass size={32} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Awaiting Pair Selection
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '460px', margin: '0 auto 1.5rem auto' }}>
                  Choose a Sire and Dam on the left or click one of the quick test presets to calculate inbreeding risk, kinship coefficients, and common ancestor paths.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem' }}>
                  <button
                    onClick={() => handleLoadPreset('SH_M102', 'SH_F101')}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem' }}
                  >
                    Load Sibling Pair
                  </button>
                  <button
                    onClick={() => handleLoadPreset('SH_M201', 'SH_F202')}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem' }}
                  >
                    Load Cousin Pair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CANDIDATE MATE FINDER */}
      {/* ========================================================================= */}
      {activeTab === 'candidates' && (
        <div>
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Candidate Mate Compatibility &amp; Ranking
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Select an individual to automatically rank all active opposite-sex candidates of the same species by lowest predicted <span style={{ fontFamily: 'var(--font-mono)' }}>F</span> and lowest kinship.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <select
                  value={targetSpecimenId}
                  onChange={(e) => {
                    setTargetSpecimenId(e.target.value);
                    handleLoadCandidates(e.target.value);
                  }}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    minWidth: '240px'
                  }}
                >
                  <option value="">-- Choose Specimen to Match --</option>
                  {filteredSpecimens.filter(s => s.activeBreeder && s.status === 'ACTIVE').map(s => (
                    <option key={s.specimenId} value={s.specimenId}>
                      {s.specimenId} ({s.sex === 'M' ? '♂ Male' : (s.sex === 'F' ? '♀ Female' : '⚲ Unknown')}) - {s.localIdentifier || 'Specimen'}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleLoadCandidates(targetSpecimenId)}
                  disabled={!targetSpecimenId || loadingCandidates}
                  className="btn btn-primary"
                  style={{ fontSize: '0.82rem' }}
                >
                  {loadingCandidates ? 'Evaluating...' : 'Find Matches'}
                </button>
              </div>
            </div>
          </div>

          {/* Results Table */}
          {loadingCandidates ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Compass size={32} color="var(--primary)" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Evaluating candidate mate compatibility across all breeders...</p>
            </div>
          ) : candidatesData && candidatesData.candidates?.length > 0 ? (
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                  {candidatesData.totalCandidates} Compatible Candidates for {candidatesData.targetSpecimenId} ({candidatesData.targetSex === 'M' ? 'Sire' : 'Dam'})
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Ranked by Lowest Inbreeding (F ASC) → Lowest Kinship (φ ASC)
                </span>
              </div>

              <div className="table-responsive">
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Rank</th>
                      <th>Candidate ID</th>
                      <th>Facility Location</th>
                      <th>Predicted Offspring F</th>
                      <th>Kinship (φ)</th>
                      <th>Relationship</th>
                      <th>Risk Level</th>
                      <th>Recommendation</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidatesData.candidates.map((cand) => {
                      const badge = getRiskBadgeColor(cand.riskLevel);
                      return (
                        <tr key={cand.specimenId}>
                          <td>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: cand.rank === 1 ? '#fef08a' : '#f1f5f9',
                              color: cand.rank === 1 ? '#854d0e' : '#475569',
                              fontWeight: 800,
                              fontSize: '0.78rem'
                            }}>
                              {cand.rank}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <strong style={{ color: cand.sex === 'M' ? 'var(--male-color)' : 'var(--female-color)' }}>
                                {cand.specimenId}
                              </strong>
                              {cand.localIdentifier && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                                  ({cand.localIdentifier})
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                              {cand.institutionName}
                            </span>
                            {cand.isSameInstitution ? (
                              <span style={{ fontSize: '0.68rem', color: '#059669', display: 'block', fontWeight: 600 }}>
                                ✓ Same Facility (No Transfer)
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.68rem', color: '#d97706', display: 'block', fontWeight: 600 }}>
                                ⇄ Cross-Institution Transfer
                              </span>
                            )}
                          </td>
                          <td>
                            <span style={{
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              fontSize: '0.9rem',
                              color: badge.text
                            }}>
                              {cand.inbreedingCoefficient.toFixed(5)}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block' }}>
                              {(cand.inbreedingCoefficient * 100).toFixed(3)}%
                            </span>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                              {cand.kinshipCoefficient.toFixed(5)}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {cand.relationship.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              background: badge.bg,
                              color: badge.text,
                              border: `1px solid ${badge.border}`,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 800
                            }}>
                              {cand.riskLevel}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              {cand.recommendation.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => {
                                const s = candidatesData.targetSex === 'M' ? candidatesData.targetSpecimenId : cand.specimenId;
                                const d = candidatesData.targetSex === 'M' ? cand.specimenId : candidatesData.targetSpecimenId;
                                handleLoadPreset(s, d);
                                setActiveTab('simulator');
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.74rem' }}
                            >
                              Inspect in Simulator <ArrowRight size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Select a target specimen from the dropdown above to view ranked compatible mates.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PAIRING MATRIX GRID */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div>
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Pairing Matrix Heatmap ({matrixData?.speciesName || 'Species'})
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  All combinations of active breeding males (rows) and females (columns). Hover over any cell to see inbreeding coefficient, kinship, and risk classification.
                </p>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: '12px', height: '12px', background: '#dcfce7', borderRadius: '3px', border: '1px solid #86efac' }} /> Low Risk
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: '12px', height: '12px', background: '#fef9c3', borderRadius: '3px', border: '1px solid #fde047' }} /> Moderate
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: '12px', height: '12px', background: '#ffedd5', borderRadius: '3px', border: '1px solid #fdba74' }} /> High
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: '12px', height: '12px', background: '#fee2e2', borderRadius: '3px', border: '1px solid #fca5a5' }} /> Critical
                </span>
              </div>
            </div>
          </div>

          {loadingMatrix ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Compass size={32} color="var(--primary)" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Computing pairwise genetic matrix...</p>
            </div>
          ) : matrixData && matrixData.males?.length > 0 && matrixData.females?.length > 0 ? (
            <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid var(--border-color)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                      Sire ♂ \ Dam ♀
                    </th>
                    {matrixData.females.map((f) => (
                      <th
                        key={f.id}
                        style={{
                          padding: '0.75rem',
                          background: '#f8fafc',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: 'var(--female-color)',
                          minWidth: '110px'
                        }}
                      >
                        <div>{f.id}</div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 500, display: 'block' }}>
                          {f.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixData.males.map((m, rIdx) => (
                    <tr key={m.id}>
                      <th style={{
                        padding: '0.75rem',
                        background: '#f8fafc',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--male-color)',
                        textAlign: 'left'
                      }}>
                        <div>{m.id}</div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 500, display: 'block' }}>
                          {m.name}
                        </span>
                      </th>
                      {matrixData.females.map((f, cIdx) => {
                        const cell = matrixData.matrix[rIdx]?.[cIdx];
                        if (!cell) return <td key={cIdx} style={{ border: '1px solid var(--border-color)' }}>-</td>;

                        let bg = '#dcfce7';
                        let textColor = '#15803d';
                        let borderCol = '#86efac';

                        if (cell.risk === 'MODERATE') {
                          bg = '#fef9c3';
                          textColor = '#854d0e';
                          borderCol = '#fde047';
                        } else if (cell.risk === 'HIGH') {
                          bg = '#ffedd5';
                          textColor = '#9a3412';
                          borderCol = '#fdba74';
                        } else if (cell.risk === 'CRITICAL') {
                          bg = '#fee2e2';
                          textColor = '#991b1b';
                          borderCol = '#fca5a5';
                        }

                        return (
                          <td
                            key={f.id}
                            onClick={() => {
                              handleLoadPreset(m.id, f.id);
                              setActiveTab('simulator');
                            }}
                            onMouseEnter={() => setHoveredCell({ sire: m, dam: f, cell })}
                            onMouseLeave={() => setHoveredCell(null)}
                            style={{
                              background: bg,
                              border: `1px solid ${borderCol}`,
                              padding: '0.75rem 0.5rem',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'transform 0.15s ease',
                              fontFamily: 'var(--font-mono)'
                            }}
                            title={`Click to simulate ${m.id} × ${f.id} (F = ${cell.f.toFixed(5)})`}
                          >
                            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: textColor }}>
                              F={cell.f.toFixed(4)}
                            </div>
                            <span style={{ fontSize: '0.65rem', color: textColor, display: 'block' }}>
                              {cell.relationship}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Hover Preview Bar */}
              {hoveredCell && (
                <div style={{
                  marginTop: '1.25rem',
                  padding: '0.75rem 1rem',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      Selected Pair: {hoveredCell.sire.id} (♂) × {hoveredCell.dam.id} (♀)
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      Topology: {hoveredCell.cell.relationship} • Risk: {hoveredCell.cell.risk}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 800 }}>
                      F = {hoveredCell.cell.f.toFixed(5)} (φ = {hoveredCell.cell.kinship.toFixed(5)})
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700 }}>
                      Click cell to inspect detailed paths →
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Insufficient active male and female breeders for this species to generate pairing matrix.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: EVALUATION AUDIT HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Genealogical Evaluation Audit History
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Permanent audit store of all computed mating evaluations ({evaluationsHistory.length} total records)
              </span>
            </div>
            <button onClick={refreshHistory} className="btn btn-secondary" style={{ fontSize: '0.78rem' }}>
              Refresh History
            </button>
          </div>

          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Evaluation ID</th>
                  <th>Sire ID</th>
                  <th>Dam ID</th>
                  <th>Offspring F</th>
                  <th>Kinship (φ)</th>
                  <th>Risk Classification</th>
                  <th>Recommendation</th>
                  <th>Evaluator</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {evaluationsHistory.map((item) => {
                  const badge = getRiskBadgeColor(item.riskLevel);
                  return (
                    <tr key={item.evaluationId}>
                      <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                        {new Date(item.evaluatedAt).toLocaleString()}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          {item.evaluationId}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--male-color)' }}>{item.sireId}</strong>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--female-color)' }}>{item.damId}</strong>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: badge.text }}>
                          {item.inbreedingCoefficient.toFixed(5)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>
                          {item.kinshipCoefficient.toFixed(5)}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          background: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 800
                        }}>
                          {item.riskLevel}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          {item.recommendation.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.evaluatedBy}
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setEvaluationResult(item);
                            setSireId(item.sireId);
                            setDamId(item.damId);
                            setActiveTab('simulator');
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.74rem' }}
                        >
                          View Breakdown
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Threshold Policy Configuration Modal */}
      {showPolicyModal && policyForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Species Breeding Threshold Policy
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Species: {policyForm.speciesName}
                </span>
              </div>
              <button onClick={() => setShowPolicyModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Adjust conservation policy thresholds according to species-specific studbook guidelines.
            </p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await geneticBreedingAPI.updatePolicy(policyForm.speciesId, policyForm);
                setPolicies(policies.map(p => p.speciesId === policyForm.speciesId ? res.data : p));
                setShowPolicyModal(false);
              } catch (err) {
                console.error('Failed to update policy', err);
              }
            }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Low Risk Maximum F (default 0.015 = 1.5%)</label>
                <input
                  type="number"
                  step="0.001"
                  className="form-control"
                  value={policyForm.lowMaxF}
                  onChange={(e) => setPolicyForm({ ...policyForm, lowMaxF: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Moderate Risk Maximum F (default 0.0625 = 6.25% First Cousin)</label>
                <input
                  type="number"
                  step="0.001"
                  className="form-control"
                  value={policyForm.moderateMaxF}
                  onChange={(e) => setPolicyForm({ ...policyForm, moderateMaxF: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">High Risk Maximum F (default 0.125 = 12.5% Half Sibling)</label>
                <input
                  type="number"
                  step="0.001"
                  className="form-control"
                  value={policyForm.highMaxF}
                  onChange={(e) => setPolicyForm({ ...policyForm, highMaxF: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Minimum Pedigree Completeness (0.0 to 1.0)</label>
                <input
                  type="number"
                  step="0.05"
                  className="form-control"
                  value={policyForm.minPedigreeCompleteness}
                  onChange={(e) => setPolicyForm({ ...policyForm, minPedigreeCompleteness: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowPolicyModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Policy Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
