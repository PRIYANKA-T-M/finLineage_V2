import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, Info, CheckCircle2, UserPlus, Dna } from 'lucide-react';
import { specimenAPI, institutionAPI, speciesAPI } from '../api/client';

export default function SpecimenFormPage() {
  const navigate = useNavigate();

  const [institutions, setInstitutions] = useState([]);
  const [speciesList, setSpeciesList] = useState([]);
  const [specimens, setSpecimens] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [specimenId, setSpecimenId] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [speciesId, setSpeciesId] = useState('');
  const [localIdentifier, setLocalIdentifier] = useState('');
  const [sex, setSex] = useState('U');
  const [birthDate, setBirthDate] = useState('');
  const [originType, setOriginType] = useState('CAPTIVE_BORN');
  const [wildFounder, setWildFounder] = useState(false);
  const [activeBreeder, setActiveBreeder] = useState(true);
  const [status, setStatus] = useState('ACTIVE');

  // Parents
  const [sireId, setSireId] = useState('');
  const [damId, setDamId] = useState('');
  const [confidenceSire, setConfidenceSire] = useState(1.0);
  const [confidenceDam, setConfidenceDam] = useState(1.0);

  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [instRes, spRes, specRes] = await Promise.all([
          institutionAPI.getAll(),
          speciesAPI.getAll(),
          specimenAPI.getAll()
        ]);
        setInstitutions(instRes.data);
        setSpeciesList(spRes.data);
        setSpecimens(specRes.data);

        if (instRes.data.length > 0) setInstitutionId(instRes.data[0].institutionId);
        if (spRes.data.length > 0) setSpeciesId(spRes.data[0].speciesId);
      } catch (err) {
        setError('Failed to load form prerequisites.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter eligible parent candidates for the selected species
  const eligibleSires = specimens.filter(s => s.speciesId === speciesId && (s.sex === 'M' || s.sex === 'U'));
  const eligibleDams = specimens.filter(s => s.speciesId === speciesId && (s.sex === 'F' || s.sex === 'U'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setWarning('');

    if (!specimenId.trim()) {
      setError('Specimen ID is required.');
      return;
    }

    const parents = [];
    if (sireId) {
      parents.push({
        parentId: sireId,
        parentRole: 'SIRE',
        confidence: parseFloat(confidenceSire),
        source: 'OBSERVED'
      });
    }
    if (damId) {
      parents.push({
        parentId: damId,
        parentRole: 'DAM',
        confidence: parseFloat(confidenceDam),
        source: 'OBSERVED'
      });
    }

    const payload = {
      specimenId: specimenId.trim().toUpperCase(),
      institutionId,
      speciesId,
      localIdentifier: localIdentifier.trim() || undefined,
      sex,
      birthDate: birthDate || undefined,
      originType,
      wildFounder,
      activeBreeder,
      status,
      parents: parents.length > 0 ? parents : undefined
    };

    setSubmitting(true);
    try {
      const response = await specimenAPI.create(payload);
      if (response.data.warning) {
        alert(`Specimen registered successfully! Note warning: ${response.data.warning}`);
      }
      navigate('/specimens');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register specimen.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => navigate('/specimens')} className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Back to Directory
      </button>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', padding: '0.6rem', borderRadius: '10px' }}>
            <Dna size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Register New Specimen</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Add a new marine individual to the digital studbook with verified parentage and taxonomy
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Specimen ID (Required, Unique)</label>
              <input
                type="text"
                className="form-control"
                value={specimenId}
                onChange={(e) => setSpecimenId(e.target.value)}
                placeholder="e.g. SH_M305 or TR_F306"
                required
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Will be automatically converted to uppercase</span>
            </div>

            <div className="form-group">
              <label className="form-label">Local Identifier / Tag / Tank #</label>
              <input
                type="text"
                className="form-control"
                value={localIdentifier}
                onChange={(e) => setLocalIdentifier(e.target.value)}
                placeholder="e.g. TANK-4-ALPHA"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Marine Species</label>
              <select
                className="form-control"
                value={speciesId}
                onChange={(e) => {
                  setSpeciesId(e.target.value);
                  setSireId('');
                  setDamId('');
                }}
                required
              >
                {speciesList.map(sp => (
                  <option key={sp.speciesId} value={sp.speciesId}>
                    {sp.commonName} ({sp.scientificName})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Housing Institution</label>
              <select
                className="form-control"
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                required
              >
                {institutions.map(inst => (
                  <option key={inst.institutionId} value={inst.institutionId}>
                    {inst.name} ({inst.country})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Sex</label>
              <select className="form-control" value={sex} onChange={(e) => setSex(e.target.value)}>
                <option value="M">M — Male</option>
                <option value="F">F — Female</option>
                <option value="U">U — Unknown</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Birth Date</label>
              <input
                type="date"
                className="form-control"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Origin Type</label>
              <select className="form-control" value={originType} onChange={(e) => setOriginType(e.target.value)}>
                <option value="CAPTIVE_BORN">CAPTIVE_BORN</option>
                <option value="WILD">WILD</option>
                <option value="RESCUED">RESCUED</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="DECEASED">DECEASED</option>
                <option value="TRANSFERRED">TRANSFERRED</option>
                <option value="RETIRED">RETIRED</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={wildFounder}
                onChange={(e) => setWildFounder(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              Wild Founder (Gen 0 Baseline)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={activeBreeder}
                onChange={(e) => setActiveBreeder(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              Active Breeder (Available for Pairing)
            </label>
          </div>

          {/* Parent Assignment Section */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
              Initial Parentage Assignment (Optional)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Select candidate parents from the same species to immediately project into Neo4j
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Sire (Father)</label>
                <select
                  className="form-control"
                  value={sireId}
                  onChange={(e) => setSireId(e.target.value)}
                >
                  <option value="">-- No Sire Assigned --</option>
                  {eligibleSires.map(s => (
                    <option key={s.specimenId} value={s.specimenId}>
                      {s.specimenId} ({s.sex}) — {s.institutionName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Dam (Mother)</label>
                <select
                  className="form-control"
                  value={damId}
                  onChange={(e) => setDamId(e.target.value)}
                >
                  <option value="">-- No Dam Assigned --</option>
                  {eligibleDams.map(s => (
                    <option key={s.specimenId} value={s.specimenId}>
                      {s.specimenId} ({s.sex}) — {s.institutionName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={() => navigate('/specimens')} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              <Save size={16} /> {submitting ? 'Registering...' : 'Save Specimen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
