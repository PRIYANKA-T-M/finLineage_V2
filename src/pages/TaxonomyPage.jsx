import React, { useState, useEffect } from 'react';
import { Building2, Fish, Plus, Edit2, Trash2, Globe, Mail, Phone, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { institutionAPI, speciesAPI } from '../api/client';

export default function TaxonomyPage() {
  const [activeTab, setActiveTab] = useState('institutions');
  const [institutions, setInstitutions] = useState([]);
  const [speciesList, setSpeciesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [showInstModal, setShowInstModal] = useState(false);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [editingInst, setEditingInst] = useState(null);
  const [editingSpecies, setEditingSpecies] = useState(null);

  // Institution form
  const [instName, setInstName] = useState('');
  const [instCountry, setInstCountry] = useState('');
  const [instType, setInstType] = useState('AQUARIUM');
  const [instEmail, setInstEmail] = useState('');
  const [instPhone, setInstPhone] = useState('');

  // Species form
  const [spScientificName, setSpScientificName] = useState('');
  const [spCommonName, setSpCommonName] = useState('');
  const [spIucn, setSpIucn] = useState('VULNERABLE');
  const [spDescription, setSpDescription] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [instRes, spRes] = await Promise.all([
        institutionAPI.getAll(),
        speciesAPI.getAll()
      ]);
      setInstitutions(instRes.data);
      setSpeciesList(spRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch taxonomy data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveInstitution = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        name: instName,
        country: instCountry,
        facilityType: instType,
        email: instEmail,
        phone: instPhone
      };

      if (editingInst) {
        await institutionAPI.update(editingInst.institutionId, payload);
        setSuccessMsg(`Institution '${instName}' updated successfully.`);
      } else {
        await institutionAPI.create(payload);
        setSuccessMsg(`Institution '${instName}' created successfully.`);
      }

      setShowInstModal(false);
      setEditingInst(null);
      resetInstForm();
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save institution.');
    }
  };

  const handleDeleteInstitution = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove institution '${name}'?`)) return;
    try {
      await institutionAPI.delete(id);
      setSuccessMsg(`Institution '${name}' deleted.`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete institution.');
    }
  };

  const handleSaveSpecies = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        scientificName: spScientificName,
        commonName: spCommonName,
        iucnStatus: spIucn,
        description: spDescription
      };

      if (editingSpecies) {
        await speciesAPI.update(editingSpecies.speciesId, payload);
        setSuccessMsg(`Species '${spCommonName}' updated successfully.`);
      } else {
        await speciesAPI.create(payload);
        setSuccessMsg(`Species '${spCommonName}' created successfully.`);
      }

      setShowSpeciesModal(false);
      setEditingSpecies(null);
      resetSpeciesForm();
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save species.');
    }
  };

  const handleDeleteSpecies = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove species '${name}'?`)) return;
    try {
      await speciesAPI.delete(id);
      setSuccessMsg(`Species '${name}' deleted.`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete species.');
    }
  };

  const resetInstForm = () => {
    setInstName('');
    setInstCountry('');
    setInstType('AQUARIUM');
    setInstEmail('');
    setInstPhone('');
  };

  const resetSpeciesForm = () => {
    setSpScientificName('');
    setSpCommonName('');
    setSpIucn('VULNERABLE');
    setSpDescription('');
  };

  const openEditInst = (inst) => {
    setEditingInst(inst);
    setInstName(inst.name);
    setInstCountry(inst.country);
    setInstType(inst.facilityType);
    setInstEmail(inst.email);
    setInstPhone(inst.phone);
    setShowInstModal(true);
  };

  const openEditSpecies = (sp) => {
    setEditingSpecies(sp);
    setSpScientificName(sp.scientificName);
    setSpCommonName(sp.commonName);
    setSpIucn(sp.iucnStatus);
    setSpDescription(sp.description);
    setShowSpeciesModal(true);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>Taxonomy &amp; Institutions</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage conservation hatcheries, partner aquariums, and managed marine species taxonomies
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {activeTab === 'institutions' ? (
            <button onClick={() => { resetInstForm(); setEditingInst(null); setShowInstModal(true); }} className="btn btn-primary">
              <Plus size={16} /> Register Institution
            </button>
          ) : (
            <button onClick={() => { resetSpeciesForm(); setEditingSpecies(null); setShowSpeciesModal(true); }} className="btn btn-primary">
              <Plus size={16} /> Register Marine Species
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="alert" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', marginBottom: '1.5rem', fontWeight: 600 }}>
          <CheckCircle size={18} color="#059669" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('institutions')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'institutions' ? '2px solid var(--primary)' : '2px solid transparent',
            padding: '0.75rem 1.5rem',
            color: activeTab === 'institutions' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Building2 size={18} color={activeTab === 'institutions' ? 'var(--primary)' : 'inherit'} />
          Institutions ({institutions.length})
        </button>

        <button
          onClick={() => setActiveTab('species')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'species' ? '2px solid var(--primary)' : '2px solid transparent',
            padding: '0.75rem 1.5rem',
            color: activeTab === 'species' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Fish size={18} color={activeTab === 'species' ? 'var(--primary)' : 'inherit'} />
          Marine Species ({speciesList.length})
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '0.8rem' }}>Loading records...</p>
        </div>
      ) : activeTab === 'institutions' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {institutions.map(inst => (
            <div key={inst.institutionId} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem' }}>{inst.name}</h3>
                    <span className="badge" style={{ background: 'rgba(2, 132, 199, 0.1)', color: 'var(--primary)', fontSize: '0.7rem' }}>
                      {inst.facilityType}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => openEditInst(inst)} className="btn btn-secondary" style={{ padding: '0.35rem' }} title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDeleteInstitution(inst.institutionId, inst.name)} className="btn btn-secondary" style={{ padding: '0.35rem', color: '#dc2626' }} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Globe size={14} color="var(--accent)" />
                    <span>{inst.country}</span>
                  </div>
                  {inst.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Mail size={14} color="var(--accent)" />
                      <span>{inst.email}</span>
                    </div>
                  )}
                  {inst.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Phone size={14} color="var(--accent)" />
                      <span>{inst.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.72rem', color: 'var(--text-dim)', wordBreak: 'break-all' }}>
                UUID: {inst.institutionId}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {speciesList.map(sp => (
            <div key={sp.speciesId} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem' }}>{sp.commonName}</h3>
                    <div style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--accent)' }}>{sp.scientificName}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => openEditSpecies(sp)} className="btn btn-secondary" style={{ padding: '0.35rem' }} title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDeleteSpecies(sp.speciesId, sp.commonName)} className="btn btn-secondary" style={{ padding: '0.35rem', color: '#dc2626' }} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <span className="badge" style={{
                    background: sp.iucnStatus === 'ENDANGERED' || sp.iucnStatus === 'CRITICALLY_ENDANGERED' ? 'rgba(220, 38, 38, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                    color: sp.iucnStatus === 'ENDANGERED' || sp.iucnStatus === 'CRITICALLY_ENDANGERED' ? '#dc2626' : '#d97706',
                    fontSize: '0.72rem'
                  }}>
                    IUCN: {sp.iucnStatus}
                  </span>
                </div>

                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  {sp.description || 'No description provided.'}
                </p>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.72rem', color: 'var(--text-dim)', wordBreak: 'break-all' }}>
                UUID: {sp.speciesId}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Institution Modal */}
      {showInstModal && (
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
          zIndex: 1000
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', background: '#ffffff' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.25rem' }}>
              {editingInst ? 'Edit Institution' : 'Register New Institution'}
            </h3>
            <form onSubmit={handleSaveInstitution}>
              <div className="form-group">
                <label className="form-label">Institution Name</label>
                <input type="text" className="form-control" value={instName} onChange={(e) => setInstName(e.target.value)} required placeholder="e.g. Monterey Bay Aquarium" />
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <input type="text" className="form-control" value={instCountry} onChange={(e) => setInstCountry(e.target.value)} required placeholder="e.g. United States" />
              </div>
              <div className="form-group">
                <label className="form-label">Facility Type</label>
                <select className="form-control" value={instType} onChange={(e) => setInstType(e.target.value)}>
                  <option value="AQUARIUM">AQUARIUM</option>
                  <option value="CONSERVATION_HATCHERY">CONSERVATION_HATCHERY</option>
                  <option value="SANCTUARY">SANCTUARY</option>
                  <option value="RESEARCH_CENTER">RESEARCH_CENTER</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={instEmail} onChange={(e) => setInstEmail(e.target.value)} placeholder="contact@aquarium.org" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="text" className="form-control" value={instPhone} onChange={(e) => setInstPhone(e.target.value)} placeholder="+1-555-0100" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowInstModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Institution</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Species Modal */}
      {showSpeciesModal && (
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
          zIndex: 1000
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', background: '#ffffff' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.25rem' }}>
              {editingSpecies ? 'Edit Marine Species' : 'Register New Marine Species'}
            </h3>
            <form onSubmit={handleSaveSpecies}>
              <div className="form-group">
                <label className="form-label">Scientific Name</label>
                <input type="text" className="form-control" value={spScientificName} onChange={(e) => setSpScientificName(e.target.value)} required placeholder="e.g. Hippocampus abdominalis" />
              </div>
              <div className="form-group">
                <label className="form-label">Common Name</label>
                <input type="text" className="form-control" value={spCommonName} onChange={(e) => setSpCommonName(e.target.value)} required placeholder="e.g. Pot-bellied Seahorse" />
              </div>
              <div className="form-group">
                <label className="form-label">IUCN Red List Status</label>
                <select className="form-control" value={spIucn} onChange={(e) => setSpIucn(e.target.value)}>
                  <option value="CRITICALLY_ENDANGERED">CRITICALLY_ENDANGERED</option>
                  <option value="ENDANGERED">ENDANGERED</option>
                  <option value="VULNERABLE">VULNERABLE</option>
                  <option value="NEAR_THREATENED">NEAR_THREATENED</option>
                  <option value="LEAST_CONCERN">LEAST_CONCERN</option>
                  <option value="DATA_DEFICIENT">DATA_DEFICIENT</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description / Habitat Notes</label>
                <textarea className="form-control" rows={3} value={spDescription} onChange={(e) => setSpDescription(e.target.value)} placeholder="Habitat details, native marine ranges, conservation focus..." />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowSpeciesModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Species</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
