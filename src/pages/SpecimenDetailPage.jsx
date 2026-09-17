import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, GitFork, Dna, Building2, Calendar, Globe, RefreshCw, AlertTriangle, ShieldCheck, Heart, UserPlus, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';
import { specimenAPI, pedigreeAPI } from '../api/client';
import ParentageModal from './ParentageModal';

export default function SpecimenDetailPage({ specimenId, onClose, onRefreshRequired }) {
  const [specimen, setSpecimen] = useState(null);
  const [ancestors, setAncestors] = useState([]);
  const [descendants, setDescendants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showParentModal, setShowParentModal] = useState(false);
  const [allSpecimens, setAllSpecimens] = useState([]);

  const navigate = useNavigate();

  const loadSpecimenData = async () => {
    if (!specimenId) return;
    setLoading(true);
    setError('');
    try {
      const [specRes, ancRes, descRes, allRes] = await Promise.all([
        specimenAPI.getById(specimenId),
        pedigreeAPI.getAncestors(specimenId),
        pedigreeAPI.getDescendants(specimenId),
        specimenAPI.getAll()
      ]);
      setSpecimen(specRes.data);
      setAncestors(ancRes.data.ancestors || []);
      setDescendants(descRes.data.descendants || []);
      setAllSpecimens(allRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load specimen details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpecimenData();
  }, [specimenId]);

  if (!specimenId) return null;

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        zIndex: 1000
      }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '560px', height: '100vh', borderRadius: 0, overflowY: 'auto', padding: '2rem', background: '#ffffff', boxShadow: '-4px 0 24px rgba(15, 23, 42, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Dna size={24} color="var(--primary)" />
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{specimenId}</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Local Identifier: {specimen?.localIdentifier || 'None'}
                </span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '0.8rem' }}>Loading specimen profile &amp; pedigree projection...</p>
            </div>
          ) : error ? (
            <div className="alert alert-error"><AlertTriangle size={18} /> {error}</div>
          ) : specimen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Badges */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className={`badge ${specimen.sex === 'M' ? 'badge-male' : specimen.sex === 'F' ? 'badge-female' : 'badge-unknown'}`}>
                  Sex: {specimen.sex}
                </span>
                <span className="badge badge-active">{specimen.status}</span>
                {specimen.wildFounder && <span className="badge" style={{ background: 'rgba(217, 119, 6, 0.12)', color: '#d97706' }}>Wild Founder</span>}
                <span className={`badge ${specimen.graphSyncStatus === 'SYNCED' ? 'badge-synced' : 'badge-failed'}`}>
                  Graph Sync: {specimen.graphSyncStatus}
                </span>
              </div>

              {/* Taxonomy & Institution */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.6rem', fontWeight: 700 }}>
                  Taxonomy &amp; Facility
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.86rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>Common Species</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{specimen.speciesCommonName}</div>
                    <div style={{ fontSize: '0.72rem', fontStyle: 'italic', color: 'var(--accent)' }}>{specimen.speciesScientificName}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>Housing Institution</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{specimen.institutionName}</div>
                  </div>
                </div>
              </div>

              {/* Biological Metadata */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.6rem', fontWeight: 700 }}>
                  Biological Metadata
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.86rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>Origin</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{specimen.originType}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>Birth Date</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{specimen.birthDate || 'Unknown / Not Logged'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>Active Breeder Status</div>
                    <div style={{ fontWeight: 700, color: specimen.activeBreeder ? '#059669' : '#dc2626' }}>
                      {specimen.activeBreeder ? 'Active Breeder' : 'Non-Breeding'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>Founder Lineage</div>
                    <div style={{ fontWeight: 600, color: specimen.wildFounder ? '#d97706' : 'var(--text-main)' }}>
                      {specimen.wildFounder ? 'Yes (Founder 0)' : 'No (Descendant)'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Parentage Section */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <h4 style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                    Parent Relationships ({specimen.parents?.length || 0})
                  </h4>
                  <button onClick={() => setShowParentModal(true)} className="btn btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}>
                    <UserPlus size={12} /> Assign Parent
                  </button>
                </div>

                {specimen.parents && specimen.parents.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {specimen.parents.map((p, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>{p.parentId}</span>
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: p.parentRole === 'SIRE' ? 'rgba(2, 132, 199, 0.1)' : 'rgba(219, 39, 119, 0.1)', color: p.parentRole === 'SIRE' ? '#0284c7' : '#db2777', fontWeight: 700 }}>
                            {p.parentRole}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                          <div>Confidence: {Math.round(p.confidence * 100)}%</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Source: {p.source}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    No parents assigned {specimen.wildFounder ? '(Wild Founder Specimen)' : ''}
                  </div>
                )}
              </div>

              {/* Direct Ancestors & Descendants Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', marginBottom: '0.4rem' }}>
                    <ArrowUpRight size={14} /> Total Ancestors ({ancestors.length})
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', maxHeight: '90px', overflowY: 'auto' }}>
                    {ancestors.length > 0 ? (
                      ancestors.map((a, idx) => <div key={a.specimenId ? `${a.specimenId}-${idx}` : idx}>{a.specimenId} ({a.sex})</div>)
                    ) : (
                      <span>None</span>
                    )}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 700, color: '#059669', marginBottom: '0.4rem' }}>
                    <ArrowDownRight size={14} /> Total Descendants ({descendants.length})
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', maxHeight: '90px', overflowY: 'auto' }}>
                    {descendants.length > 0 ? (
                      descendants.map((d, idx) => <div key={d.specimenId ? `${d.specimenId}-${idx}` : idx}>{d.specimenId} ({d.sex})</div>)
                    ) : (
                      <span>None</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    navigate(`/pedigree?specimenId=${specimen.specimenId}`);
                    onClose();
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  <GitFork size={16} /> Open Pedigree Tree
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showParentModal && specimen && (
        <ParentageModal
          specimen={specimen}
          specimens={allSpecimens}
          onClose={() => setShowParentModal(false)}
          onSuccess={() => {
            loadSpecimenData();
            if (onRefreshRequired) onRefreshRequired();
          }}
        />
      )}
    </>
  );
}
