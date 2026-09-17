import React, { useState } from 'react';
import { GitFork, AlertTriangle, CheckCircle, Save, X, Info } from 'lucide-react';
import { specimenAPI } from '../api/client';

export default function ParentageModal({ specimen, specimens, onClose, onSuccess }) {
  const [parentId, setParentId] = useState('');
  const [parentRole, setParentRole] = useState('SIRE');
  const [confidence, setConfidence] = useState(1.0);
  const [source, setSource] = useState('OBSERVED');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Eligible parents: same species, not self
  const eligibleParents = specimens.filter(s =>
    s.speciesId === specimen.speciesId &&
    s.specimenId.toUpperCase() !== specimen.specimenId.toUpperCase()
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setWarning('');

    if (!parentId) {
      setError('Please select a parent specimen');
      return;
    }

    setSubmitting(true);
    try {
      await specimenAPI.addParent(specimen.specimenId, {
        parentId,
        parentRole,
        confidence: parseFloat(confidence),
        source
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign parentage');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '2rem', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <GitFork size={22} color="var(--primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>Assign Parentage</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ background: '#f8fafc', padding: '0.8rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Specimen (Offspring)</div>
          <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem' }}>{specimen.specimenId}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>{specimen.speciesCommonName}</div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '0.7rem' }}>
            <AlertTriangle size={16} />
            <span style={{ fontSize: '0.82rem' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Parent Specimen (Same Species)</label>
            <select
              className="form-control"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              required
            >
              <option value="">-- Select Candidate Parent --</option>
              {eligibleParents.map(p => (
                <option key={p.specimenId} value={p.specimenId}>
                  {p.specimenId} ({p.sex === 'M' ? 'Male' : p.sex === 'F' ? 'Female' : 'Unknown'}) — {p.localIdentifier || 'No Tag'} {p.wildFounder ? '★ Founder' : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Parent Role</label>
              <select
                className="form-control"
                value={parentRole}
                onChange={(e) => setParentRole(e.target.value)}
              >
                <option value="SIRE">SIRE (Father / Male)</option>
                <option value="DAM">DAM (Mother / Female)</option>
                <option value="UNKNOWN">UNKNOWN</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Evidence Source</label>
              <select
                className="form-control"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="OBSERVED">Direct Observation</option>
                <option value="GENETIC_TEST">DNA / Genetic Test</option>
                <option value="ESTIMATED">Studbook Estimation</option>
                <option value="HISTORICAL_LOG">Historical Log</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <label className="form-label">Parentage Confidence Level</label>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                {Math.round(confidence * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1 }}>
              <Save size={16} /> {submitting ? 'Assigning...' : 'Save Relationship'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
