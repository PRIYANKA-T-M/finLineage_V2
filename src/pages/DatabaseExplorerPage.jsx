import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Download,
  RefreshCw,
  Search,
  Table2,
  FileJson,
  FileCode2,
  FileSpreadsheet,
  GitFork,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { databaseAPI } from '../api/client';

const TABLE_LABELS = [
  { key: 'specimens', label: 'specimens', description: 'Master studbook specimen records (30 seeded + live additions)' },
  { key: 'specimen_parents', label: 'specimen_parents', description: 'Directed SIRE / DAM parentage edges projecting Neo4j [:PARENT_OF]' },
  { key: 'institutions', label: 'institutions', description: 'Participating aquariums, hatcheries, and research sanctuaries' },
  { key: 'species', label: 'species', description: 'Managed marine species registry with IUCN conservation statuses' },
  { key: 'breeding_events', label: 'breeding_events', description: 'Historical and planned controlled spawning / nesting events' },
  { key: 'mating_evaluations', label: 'mating_evaluations', description: 'Audited Wright inbreeding (F) and kinship evaluation records' },
  { key: 'breeding_plans', label: 'breeding_plans', description: 'Multi-objective optimized cohort breeding plans' },
  { key: 'species_policies', label: 'species_policies', description: 'Configurable species genetic risk thresholds (F & Kinship limits)' },
  { key: 'audit_logs', label: 'audit_logs', description: 'Immutable ledger of studbook, parentage, and breeding plan mutations' }
];

export default function DatabaseExplorerPage() {
  const [overview, setOverview] = useState(null);
  const [activeTable, setActiveTable] = useState('specimens');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rawPreview, setRawPreview] = useState({ open: false, format: 'json', content: '', loading: false });
  const [copied, setCopied] = useState(false);

  const loadDatabase = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await databaseAPI.getOverview();
      setOverview(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load database tables.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  const currentRows = useMemo(() => {
    if (!overview?.tables) return [];
    const rows = overview.tables[activeTable] || [];
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [overview, activeTable, searchQuery]);

  const columns = useMemo(() => {
    if (currentRows.length === 0) return [];
    const keySet = new Set();
    currentRows.slice(0, 20).forEach((row) => {
      Object.keys(row).forEach((k) => keySet.add(k));
    });
    return Array.from(keySet);
  }, [currentRows]);

  const formatCell = (val) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (Array.isArray(val)) {
      if (val.length === 0) return '[]';
      return val.map((item) => {
        if (item && typeof item === 'object') {
          if (item.parentId) return `${item.parentRole}:${item.parentId}`;
          if (item.sireId && item.damId) return `${item.sireId}×${item.damId}`;
          return JSON.stringify(item);
        }
        return String(item);
      }).join(', ');
    }
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  const handleOpenPreview = async (format) => {
    setRawPreview({ open: true, format, content: '', loading: true });
    setCopied(false);
    try {
      const res = await fetch(databaseAPI.exportUrl(format));
      const text = await res.text();
      setRawPreview({ open: true, format, content: text, loading: false });
    } catch (err) {
      setRawPreview({ open: true, format, content: `Failed to load ${format.toUpperCase()} export.`, loading: false });
    }
  };

  const handleCopyPreview = async () => {
    try {
      await navigator.clipboard.writeText(rawPreview.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored if blocked
    }
  };

  const totalRows = overview?.counts
    ? Object.values(overview.counts).reduce((sum, n) => sum + (Number(n) || 0), 0)
    : 0;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
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
              LIVE DATABASE &amp; DATASET
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              Synthetic Marine Conservation Studbook + Live Mutations
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Database Explorer &amp; Exportable Dataset
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '780px', marginTop: '0.25rem' }}>
            Inspect every table currently held in the FinLineage datastore and download the deterministic 30-specimen, 4-generation baseline dataset (plus any records you added) in JSON, CSV, PostgreSQL SQL, or Neo4j Cypher format.
          </p>
        </div>

        <button onClick={loadDatabase} disabled={loading} className="btn btn-secondary">
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh Tables
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      {/* Top Metrics & Dataset Download Banner */}
      {overview && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="stat-card" style={{ padding: '1.15rem', borderRadius: '12px' }}>
              <span className="stat-label">Total Database Rows</span>
              <div className="stat-value">{totalRows}</div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Across 9 relational/domain tables</span>
            </div>

            <div className="stat-card" style={{ padding: '1.15rem', borderRadius: '12px' }}>
              <span className="stat-label">Specimens &amp; Edges</span>
              <div className="stat-value" style={{ color: '#0284c7' }}>
                {overview.graphStats?.nodes ?? 0} / {overview.graphStats?.edges ?? 0}
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                {overview.graphStats?.nodes ?? 0} specimen nodes, {overview.graphStats?.edges ?? 0} parentage edges
              </span>
            </div>

            <div className="stat-card" style={{ padding: '1.15rem', borderRadius: '12px' }}>
              <span className="stat-label">Neo4j Graph Sync</span>
              <div className="stat-value" style={{ color: '#059669' }}>
                {overview.graphStats?.synced ?? 0} / {overview.graphStats?.nodes ?? 0}
              </div>
              <span style={{ fontSize: '0.74rem', color: '#059669' }}>
                {overview.graphStats?.failed === 0 ? 'All nodes synchronized' : `${overview.graphStats?.failed} pending retry`}
              </span>
            </div>

            <div className="stat-card" style={{ padding: '1.15rem', borderRadius: '12px' }}>
              <span className="stat-label">Seed Dataset Origin</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
                Synthetic 4-Gen Studbook
              </div>
              <span style={{ fontSize: '0.73rem', color: 'var(--text-dim)' }}>
                15 Pot-bellied Seahorses + 15 Green Sea Turtles
              </span>
            </div>
          </div>

          {/* Dataset Export Card */}
          <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #f8fafc, #eff6ff)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Database size={18} color="var(--primary)" />
                  Use This Dataset Externally (Download or Inspect Seed Scripts)
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Export the complete dataset—including all 30 baseline specimens, 43 parentage relationships, institutions, species, and breeding policies—for PostgreSQL, Neo4j, Python/R, or spreadsheets.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <a href={databaseAPI.exportUrl('json')} download="finlineage-dataset.json" className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
                  <FileJson size={15} /> Download JSON
                </a>
                <a href={databaseAPI.exportUrl('csv')} download="finlineage-specimens-dataset.csv" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                  <FileSpreadsheet size={15} /> Download CSV
                </a>
                <a href={databaseAPI.exportUrl('sql')} download="finlineage-seed.sql" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                  <FileCode2 size={15} /> PostgreSQL (.sql)
                </a>
                <a href={databaseAPI.exportUrl('cypher')} download="finlineage-neo4j.cypher" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                  <GitFork size={15} /> Neo4j (.cypher)
                </a>
                <button type="button" onClick={() => handleOpenPreview('sql')} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                  Preview SQL / Cypher
                </button>
              </div>
            </div>
          </div>

          {/* Raw Script Preview Drawer */}
          {rawPreview.open && (
            <div className="glass-card" style={{ marginBottom: '1.5rem', border: '1px solid #bae6fd' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>Dataset Script Preview:</strong>
                  {['sql', 'cypher', 'csv', 'json'].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => handleOpenPreview(fmt)}
                      className={`btn ${rawPreview.format === fmt ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.25rem 0.65rem', fontSize: '0.74rem', textTransform: 'uppercase' }}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleCopyPreview} className="btn btn-secondary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.76rem' }}>
                    {copied ? <><Check size={14} color="#059669" /> Copied</> : <><Copy size={14} /> Copy</>}
                  </button>
                  <button
                    onClick={() => setRawPreview({ ...rawPreview, open: false })}
                    className="btn btn-secondary"
                    style={{ padding: '0.3rem 0.7rem', fontSize: '0.76rem' }}
                  >
                    Close
                  </button>
                </div>
              </div>
              <pre style={{
                background: '#0f172a',
                color: '#e2e8f0',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.76rem',
                maxHeight: '320px',
                overflow: 'auto',
                fontFamily: 'var(--font-mono)',
                margin: 0
              }}>
                {rawPreview.loading ? 'Generating dataset export...' : rawPreview.content}
              </pre>
            </div>
          )}

          {/* Table Selector Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {TABLE_LABELS.map((tbl) => {
              const rowsCount = (overview.tables?.[tbl.key] || []).length;
              const isActive = activeTable === tbl.key;
              return (
                <button
                  key={tbl.key}
                  onClick={() => { setActiveTable(tbl.key); setSearchQuery(''); }}
                  className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                >
                  <Table2 size={14} /> {tbl.label} ({rowsCount})
                </button>
              );
            })}
          </div>

          {/* Active Table Card */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '1rem 1.5rem',
              background: '#f8fafc',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                  TABLE: {activeTable} ({currentRows.length} rows)
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {TABLE_LABELS.find((t) => t.key === activeTable)?.description}
                </span>
              </div>

              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  className="form-control"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Filter rows in ${activeTable}...`}
                  style={{ paddingLeft: '2.1rem', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            {currentRows.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                No rows found in <code>{activeTable}</code>{searchQuery ? ` matching "${searchQuery}"` : ''}.
              </div>
            ) : (
              <div className="table-responsive" style={{ maxHeight: '600px', overflow: 'auto' }}>
                <table className="table" style={{ margin: 0, fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '48px' }}>#</th>
                      {columns.map((col) => (
                        <th key={col} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        <td style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{rIdx + 1}</td>
                        {columns.map((col) => {
                          const rawVal = row[col];
                          const text = formatCell(rawVal);
                          return (
                            <td key={col} style={{
                              maxWidth: '280px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontFamily: typeof rawVal === 'boolean' || typeof rawVal === 'number' || col.toLowerCase().includes('id') ? 'var(--font-mono)' : 'inherit'
                            }} title={text}>
                              {typeof rawVal === 'boolean' ? (
                                <span style={{
                                  padding: '0.1rem 0.45rem',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  background: rawVal ? '#ecfdf5' : '#f1f5f9',
                                  color: rawVal ? '#059669' : '#64748b'
                                }}>
                                  {text}
                                </span>
                              ) : col === 'graphSyncStatus' ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: rawVal === 'SYNCED' ? '#059669' : '#d97706', fontWeight: 700 }}>
                                  <CheckCircle2 size={13} /> {text}
                                </span>
                              ) : (
                                text
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
