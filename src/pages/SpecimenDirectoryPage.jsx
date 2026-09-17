import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Plus, Search, Filter, GitFork, Eye, UserPlus, Trash2, RefreshCw, AlertTriangle, ShieldCheck, Tag } from 'lucide-react';
import { specimenAPI, speciesAPI, institutionAPI } from '../api/client';
import SpecimenDetailPage from './SpecimenDetailPage';
import ParentageModal from './ParentageModal';

export default function SpecimenDirectoryPage() {
  const navigate = useNavigate();

  const [specimens, setSpecimens] = useState([]);
  const [speciesList, setSpeciesList] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [selectedSex, setSelectedSex] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [foundersOnly, setFoundersOnly] = useState(false);

  // Modals & Drawers
  const [selectedSpecimenId, setSelectedSpecimenId] = useState(null);
  const [parentModalSpecimen, setParentModalSpecimen] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [specRes, spRes, instRes] = await Promise.all([
        specimenAPI.getAll(),
        speciesAPI.getAll(),
        institutionAPI.getAll()
      ]);
      setSpecimens(specRes.data);
      setSpeciesList(spRes.data);
      setInstitutions(instRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load specimens.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSpecimens = specimens.filter(s => {
    if (search) {
      const q = search.toLowerCase();
      const matchId = s.specimenId.toLowerCase().includes(q);
      const matchTag = s.localIdentifier && s.localIdentifier.toLowerCase().includes(q);
      const matchSpecies = s.speciesCommonName && s.speciesCommonName.toLowerCase().includes(q);
      if (!matchId && !matchTag && !matchSpecies) return false;
    }
    if (selectedSpecies && s.speciesId !== selectedSpecies) return false;
    if (selectedInstitution && s.institutionId !== selectedInstitution) return false;
    if (selectedSex && s.sex !== selectedSex) return false;
    if (selectedStatus && s.status !== selectedStatus) return false;
    if (foundersOnly && !s.wildFounder) return false;
    return true;
  });

  const handleDelete = async (specimenId) => {
    if (!window.confirm(`Are you sure you want to archive specimen ${specimenId}?`)) return;
    try {
      await specimenAPI.archive(specimenId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to archive specimen');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>Digital Studbook Directory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Comprehensive demographic registry and parentage metadata across partner institutions
          </p>
        </div>
        <button onClick={() => navigate('/specimens/new')} className="btn btn-primary">
          <Plus size={16} /> Register Specimen
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.2rem' }}
              placeholder="Search ID, tag, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="form-control" value={selectedSpecies} onChange={(e) => setSelectedSpecies(e.target.value)}>
            <option value="">All Species</option>
            {speciesList.map(sp => (
              <option key={sp.speciesId} value={sp.speciesId}>{sp.commonName}</option>
            ))}
          </select>

          <select className="form-control" value={selectedInstitution} onChange={(e) => setSelectedInstitution(e.target.value)}>
            <option value="">All Institutions</option>
            {institutions.map(inst => (
              <option key={inst.institutionId} value={inst.institutionId}>{inst.name}</option>
            ))}
          </select>

          <select className="form-control" value={selectedSex} onChange={(e) => setSelectedSex(e.target.value)}>
            <option value="">All Sexes</option>
            <option value="M">Male (M)</option>
            <option value="F">Female (F)</option>
            <option value="U">Unknown (U)</option>
          </select>

          <select className="form-control" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DECEASED">DECEASED</option>
            <option value="TRANSFERRED">TRANSFERRED</option>
            <option value="RETIRED">RETIRED</option>
          </select>
        </div>

        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={foundersOnly}
              onChange={(e) => setFoundersOnly(e.target.checked)}
              style={{ accentColor: 'var(--primary)' }}
            />
            Show Wild Founders Only (Gen 0 Baseline)
          </label>
          <span>Showing {filteredSpecimens.length} of {specimens.length} specimens</span>
        </div>
      </div>

      {/* Directory Table */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '0.8rem' }}>Loading digital studbook records...</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontWeight: 700 }}>Specimen ID &amp; Tag</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontWeight: 700 }}>Species</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontWeight: 700 }}>Institution</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontWeight: 700 }}>Sex / Origin</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontWeight: 700 }}>Sire / Dam Links</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontWeight: 700 }}>Status / Graph</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSpecimens.map(s => {
                  const sire = s.parents?.find(p => p.parentRole === 'SIRE');
                  const dam = s.parents?.find(p => p.parentRole === 'DAM');
                  return (
                    <tr key={s.specimenId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.92rem' }}>{s.specimenId}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{s.localIdentifier || 'No Tag'}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{s.speciesCommonName}</div>
                        <div style={{ fontSize: '0.72rem', fontStyle: 'italic', color: 'var(--accent)' }}>{s.speciesScientificName}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {s.institutionName}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <span className={`badge ${s.sex === 'M' ? 'badge-male' : s.sex === 'F' ? 'badge-female' : 'badge-unknown'}`}>
                          {s.sex}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: s.wildFounder ? '#d97706' : 'var(--text-dim)', marginTop: '0.2rem', fontWeight: s.wildFounder ? 700 : 500 }}>
                          {s.wildFounder ? '★ Wild Founder' : s.originType}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem' }}>
                        <div><span style={{ color: '#0284c7', fontWeight: 700 }}>S:</span> {sire ? sire.parentId : <span style={{ color: 'var(--text-dim)' }}>None</span>}</div>
                        <div><span style={{ color: '#db2777', fontWeight: 700 }}>D:</span> {dam ? dam.parentId : <span style={{ color: 'var(--text-dim)' }}>None</span>}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>{s.status}</span>
                        <div style={{ marginTop: '0.2rem' }}>
                          <span className={`badge ${s.graphSyncStatus === 'SYNCED' ? 'badge-synced' : 'badge-failed'}`} style={{ fontSize: '0.65rem' }}>
                            {s.graphSyncStatus}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setSelectedSpecimenId(s.specimenId)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.5rem' }}
                            title="View Specimen Profile"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => navigate(`/pedigree?specimenId=${s.specimenId}`)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.5rem', color: 'var(--primary)' }}
                            title="Open Interactive Pedigree Tree"
                          >
                            <GitFork size={14} />
                          </button>
                          <button
                            onClick={() => setParentModalSpecimen(s)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.5rem' }}
                            title="Assign Parent"
                          >
                            <UserPlus size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(s.specimenId)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.5rem', color: '#dc2626' }}
                            title="Archive Specimen"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selectedSpecimenId && (
        <SpecimenDetailPage
          specimenId={selectedSpecimenId}
          onClose={() => setSelectedSpecimenId(null)}
          onRefreshRequired={loadData}
        />
      )}

      {/* Parentage Assignment Modal */}
      {parentModalSpecimen && (
        <ParentageModal
          specimen={parentModalSpecimen}
          specimens={specimens}
          onClose={() => setParentModalSpecimen(null)}
          onSuccess={() => {
            loadData();
            setParentModalSpecimen(null);
          }}
        />
      )}
    </div>
  );
}
