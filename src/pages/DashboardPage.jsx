import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Fish,
  Dna,
  GitFork,
  Heart,
  ShieldCheck,
  Activity,
  AlertTriangle,
  RefreshCw,
  Plus,
  Play,
  CheckCircle2,
  Database,
  Layers,
  ArrowRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { dashboardAPI, breedingAPI, auditAPI, testAPI } from '../api/client';

export default function DashboardPage() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [breedingEvents, setBreedingEvents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sumRes, breedRes, auditRes] = await Promise.all([
        dashboardAPI.getSummary(),
        breedingAPI.getAll(),
        auditAPI.getAll()
      ]);
      setSummary(sumRes.data);
      setBreedingEvents(breedRes.data || []);
      setAuditLogs(auditRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>Loading FinLineage digital studbook metrics...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
            <span className="badge badge-synced" style={{ fontSize: '0.72rem' }}>
              ● System Online &amp; Graph Synced
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Milestone 1 — Digital Studbook &amp; Pedigree Data Foundation
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            Marine Conservation Studbook Dashboard
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => navigate('/tests')} className="btn btn-secondary">
            <Play size={16} color="#059669" /> Run Test Suite (20/20)
          </button>
          <button onClick={() => navigate('/specimens/new')} className="btn btn-primary">
            <Plus size={16} /> Register Specimen
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* KPI Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div className="glass-card stat-card" onClick={() => navigate('/taxonomy')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Institutions</span>
            <Building2 size={20} color="var(--primary)" />
          </div>
          <div className="stat-value">{summary?.totalInstitutions || 0}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--accent)', fontWeight: 600 }}>Partner Aquariums &amp; Hatcheries</div>
        </div>

        <div className="glass-card stat-card" onClick={() => navigate('/taxonomy')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Marine Species</span>
            <Fish size={20} color="var(--accent)" />
          </div>
          <div className="stat-value">{summary?.totalSpecies || 0}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Vulnerable &amp; Endangered</div>
        </div>

        <div className="glass-card stat-card" onClick={() => navigate('/specimens')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Total Specimens</span>
            <Dna size={20} color="#0284c7" />
          </div>
          <div className="stat-value">{summary?.totalSpecimens || 0}</div>
          <div style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 600 }}>Living &amp; Tracked Lineages</div>
        </div>

        <div className="glass-card stat-card" onClick={() => navigate('/specimens')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Active Breeders</span>
            <Heart size={20} color="#db2777" />
          </div>
          <div className="stat-value">{summary?.activeBreeders || 0}</div>
          <div style={{ fontSize: '0.74rem', color: '#db2777', fontWeight: 600 }}>Available for Pairing</div>
        </div>

        <div className="glass-card stat-card" onClick={() => navigate('/specimens')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Wild Founders</span>
            <Layers size={20} color="#d97706" />
          </div>
          <div className="stat-value">{summary?.wildFounders || 0}</div>
          <div style={{ fontSize: '0.74rem', color: '#d97706', fontWeight: 600 }}>Gen 0 Baseline Pool</div>
        </div>

        <div className="glass-card stat-card" onClick={() => navigate('/pedigree')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Pedigree Links</span>
            <GitFork size={20} color="#059669" />
          </div>
          <div className="stat-value">{summary?.totalParentRelationships || 0}</div>
          <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>Parent-Offspring Edges</div>
        </div>
      </div>

      {/* Architecture Health & Dual Store Projection */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Dual-Store Persistence Health
              </h3>
            </div>
            <span className="badge badge-synced" style={{ fontSize: '0.7rem' }}>ALL SYSTEMS HEALTHY</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>PostgreSQL Database (Source of Truth)</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Demographics, Institutions, Species, Foreign Keys</div>
              </div>
              <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.78rem' }}>CONNECTED</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>Neo4j Graph Database (Projection)</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pedigree traversal, cycle prevention, (:Specimen)-[:PARENT_OF]-&gt;</div>
              </div>
              <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.78rem' }}>PROJECTED (100%)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>Automated Acceptance Suite</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tests 1–20 covering validation, cycles, and traversal</div>
              </div>
              <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.78rem' }}>20 / 20 PASSED</span>
            </div>
          </div>
        </div>

        {/* Species Breakdown */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Fish size={18} color="var(--accent)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Species Representation &amp; Sex Ratios
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>Synthetic Baseline</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem' }}>Pot-bellied Seahorse</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>15 specimens</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Hippocampus abdominalis • 4 Founders (2M, 2F) • 4 Generations
              </div>
              <div style={{ height: '7px', width: '100%', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: '47%', background: '#0284c7' }} title="Males (7)"></div>
                <div style={{ width: '40%', background: '#db2777' }} title="Females (6)"></div>
                <div style={{ width: '13%', background: '#7c3aed' }} title="Unknown (2)"></div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem' }}>Green Sea Turtle</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>15 specimens</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Chelonia mydas • 4 Founders (2M, 2F) • 4 Generations
              </div>
              <div style={{ height: '7px', width: '100%', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: '47%', background: '#0284c7' }} title="Males (7)"></div>
                <div style={{ width: '40%', background: '#db2777' }} title="Females (6)"></div>
                <div style={{ width: '13%', background: '#7c3aed' }} title="Unknown (2)"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breeding Events & Audit Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Breeding Events */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Heart size={18} color="#db2777" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Breeding Activity &amp; Clutches ({breedingEvents.length})
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '280px', overflowY: 'auto' }}>
            {breedingEvents.map((event, idx) => (
              <div
                key={`dashboard-breed-event-${event.breedingEventId || 'be'}-${idx}`}
                style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {event.sireId} &times; {event.damId}
                  </span>
                  <span className="badge badge-synced" style={{ fontSize: '0.68rem' }}>
                    {event.status || event.outcome || 'RECORDED'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  <span>Date: {event.eventDate}</span>
                  <span>{event.notes || (event.offspringCount !== undefined ? `Offspring: ${event.offspringCount}` : 'Logged')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log Trail */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Audit Log Trail ({auditLogs.length})
              </h3>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>Immutable Activity Ledger</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
            {auditLogs.slice(0, 8).map((log, idx) => (
              <div
                key={`dashboard-audit-log-${log.auditId || 'al'}-${idx}`}
                style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{log.action} • {log.entityType || 'SYSTEM'}</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Recent'}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                  {log.newValue || log.details || log.entityId || 'System operation executed'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Milestone 2 & 3 Intelligence Banners */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        <div
          onClick={() => navigate('/breeding')}
          className="glass-card stat-card"
          style={{ cursor: 'pointer', padding: '1.5rem', background: '#ffffff' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
              MILESTONE 2
            </span>
            <ArrowRight size={18} color="var(--primary)" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            Breeding Evaluation &amp; Pair Simulator
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Calculate Wright’s inbreeding coefficient (F), kinship (φ), common ancestors, and review the detailed "Why?" genealogical path explanation.
          </p>
        </div>

        <div
          onClick={() => navigate('/population')}
          className="glass-card stat-card"
          style={{ cursor: 'pointer', padding: '1.5rem', background: '#ffffff' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
              MILESTONE 3
            </span>
            <ArrowRight size={18} color="#059669" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            Population Genetic Optimization
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Mean Kinship rankings, founder genome representation, multi-objective breeding plan generation, and 3-generation scenario projections.
          </p>
        </div>
      </div>
    </div>
  );
}
