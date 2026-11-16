import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { GitFork, Search, Layers, RefreshCw, ZoomIn, ZoomOut, Maximize, AlertTriangle, Eye, ShieldCheck, Dna, Info } from 'lucide-react';
import { pedigreeAPI, specimenAPI } from '../api/client';
import SpecimenDetailPage from './SpecimenDetailPage';

// Custom Node Component for Specimen in Pedigree Tree
const SpecimenNode = ({ data }) => {
  const isMale = data.sex === 'M';
  const isFemale = data.sex === 'F';
  const isTarget = data.isTarget;

  const borderColor = isTarget
    ? 'var(--primary)'
    : isMale
    ? '#0284c7'
    : isFemale
    ? '#db2777'
    : '#7c3aed';

  const badgeBg = isMale
    ? 'rgba(2, 132, 199, 0.12)'
    : isFemale
    ? 'rgba(219, 39, 119, 0.12)'
    : 'rgba(124, 58, 237, 0.12)';

  const badgeColor = isMale ? '#0284c7' : isFemale ? '#db2777' : '#7c3aed';
  const isFounder = Boolean(data.wildFounder || data.founder);

  return (
    <div
      onClick={() => data.onSelect && data.onSelect(data.specimenId)}
      style={{
        background: isTarget ? '#f0f9ff' : '#ffffff',
        border: `2px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '0.85rem 1rem',
        minWidth: '220px',
        maxWidth: '260px',
        boxShadow: isTarget ? '0 0 16px rgba(2, 132, 199, 0.35)' : '0 4px 12px rgba(15, 23, 42, 0.08)',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: borderColor, width: 8, height: 8 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
        <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>{data.specimenId}</span>
        <span style={{
          background: badgeBg,
          color: badgeColor,
          padding: '0.15rem 0.45rem',
          borderRadius: '4px',
          fontSize: '0.68rem',
          fontWeight: 700
        }}>
          {data.sex === 'M' ? 'MALE' : data.sex === 'F' ? 'FEMALE' : 'UNK'}
        </span>
      </div>

      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
        {data.speciesCommonName || data.species || 'Marine Specimen'}
      </div>

      {data.localIdentifier && (
        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
          Tag: {data.localIdentifier}
        </div>
      )}

      <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>{data.institutionName || data.institution || 'Institution'}</span>
        {isFounder ? (
          <span style={{ color: '#d97706', fontWeight: 700 }}>★ Founder</span>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Gen {data.generation ?? '?'}</span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: borderColor, width: 8, height: 8 }} />
    </div>
  );
};

const nodeTypes = {
  specimenNode: SpecimenNode
};

export default function PedigreeViewerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSpecimenId = searchParams.get('specimenId') || 'SH_M301';

  const [specimens, setSpecimens] = useState([]);
  const [selectedSpecimenId, setSelectedSpecimenId] = useState(initialSpecimenId);
  const [generations, setGenerations] = useState(4);
  const [viewMode, setViewMode] = useState('pedigree'); // 'pedigree' | 'ancestors' | 'descendants'

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailSpecimenId, setDetailSpecimenId] = useState(null);

  // Load specimen catalog
  useEffect(() => {
    specimenAPI.getAll().then(res => {
      setSpecimens(res.data);
    }).catch(console.error);
  }, []);

  // Sync search param
  useEffect(() => {
    const q = searchParams.get('specimenId');
    if (q && q !== selectedSpecimenId) {
      setSelectedSpecimenId(q);
    }
  }, [searchParams]);

  // Layout calculation for nodes by generation
  const buildGraphLayout = useCallback((graphData, targetId, currentMode = 'pedigree') => {
    // Normalise nodes
    const rawNodes = (graphData.nodes || graphData.allNodes || []).map(n => ({
      ...n,
      id: String(n.id || n.specimenId),
      specimenId: String(n.specimenId || n.id)
    }));

    // Normalise edges / relationships
    const rawEdges = graphData.edges || graphData.relationships || [];

    if (rawNodes.length === 0) {
      return { flowNodes: [], flowEdges: [] };
    }

    // Group nodes by generation level
    const genGroups = {};
    let maxGen = 0;
    rawNodes.forEach(node => {
      const gen = typeof node.generation === 'number' ? node.generation : 0;
      if (gen > maxGen) maxGen = gen;
      if (!genGroups[gen]) genGroups[gen] = [];
      genGroups[gen].push(node);
    });

    const flowNodes = [];
    const flowEdges = [];

    const HORIZONTAL_SPACING = 270;
    const VERTICAL_SPACING = 160;

    Object.keys(genGroups).forEach(genKey => {
      const gen = parseInt(genKey, 10);
      const group = genGroups[gen];
      const totalWidth = (group.length - 1) * HORIZONTAL_SPACING;
      const startX = -totalWidth / 2;

      // In ancestors mode, target is at 0 and oldest ancestors have highest gen,
      // so we invert it with (maxGen - gen) to place ancestors at the top.
      // In pedigree and descendants modes, generation 0 is already the top-most tier.
      const yLevel = (currentMode === 'ancestors') ? (maxGen - gen) : gen;

      group.forEach((node, index) => {
        const isTarget = node.id === targetId || node.specimenId === targetId;
        flowNodes.push({
          id: String(node.id),
          type: 'specimenNode',
          position: {
            x: startX + index * HORIZONTAL_SPACING,
            y: yLevel * VERTICAL_SPACING
          },
          data: {
            ...node,
            specimenId: node.specimenId || node.id,
            isTarget,
            onSelect: (id) => setDetailSpecimenId(id)
          }
        });
      });
    });

    rawEdges.forEach((edge, index) => {
      const isSire = edge.role === 'SIRE';
      flowEdges.push({
        id: `e-${edge.source}-${edge.target}-${index}`,
        source: String(edge.source),
        target: String(edge.target),
        type: 'smoothstep',
        animated: true,
        label: edge.role ? `${edge.role} (${Math.round((edge.confidence || 1.0) * 100)}%)` : undefined,
        labelStyle: { fill: isSire ? '#0284c7' : '#db2777', fontWeight: 700, fontSize: 10 },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95, stroke: 'var(--border-color)' },
        labelBgPadding: [6, 4],
        labelBgBorderRadius: 4,
        style: {
          stroke: isSire ? '#0284c7' : '#db2777',
          strokeWidth: 2,
          opacity: 0.9
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isSire ? '#0284c7' : '#db2777',
          width: 14,
          height: 14
        }
      });
    });

    return { flowNodes, flowEdges };
  }, []);

  const loadPedigreeGraph = useCallback(async () => {
    if (!selectedSpecimenId) return;
    setLoading(true);
    setError('');
    try {
      if (viewMode === 'pedigree') {
        const res = await pedigreeAPI.getPedigree(selectedSpecimenId, generations);
        const { flowNodes, flowEdges } = buildGraphLayout(res.data, selectedSpecimenId, 'pedigree');
        setNodes(flowNodes);
        setEdges(flowEdges);
      } else if (viewMode === 'ancestors') {
        const res = await pedigreeAPI.getAncestors(selectedSpecimenId);
        const { flowNodes, flowEdges } = buildGraphLayout(res.data, selectedSpecimenId, 'ancestors');
        setNodes(flowNodes);
        setEdges(flowEdges);
      } else if (viewMode === 'descendants') {
        const res = await pedigreeAPI.getDescendants(selectedSpecimenId);
        const { flowNodes, flowEdges } = buildGraphLayout(res.data, selectedSpecimenId, 'descendants');
        setNodes(flowNodes);
        setEdges(flowEdges);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to traverse pedigree graph.');
    } finally {
      setLoading(false);
    }
  }, [selectedSpecimenId, generations, viewMode, buildGraphLayout, setNodes, setEdges]);

  useEffect(() => {
    loadPedigreeGraph();
  }, [loadPedigreeGraph]);

  const handleSelectSpecimen = (id) => {
    setSelectedSpecimenId(id);
    setSearchParams({ specimenId: id });
  };

  return (
    <div style={{ height: 'calc(100vh - 65px)', display: 'flex', flexDirection: 'column' }}>
      {/* Control Header */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.75rem 1.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GitFork size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Interactive Pedigree Graph</h2>
          </div>

          {/* Specimen Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Target:</span>
            <select
              className="form-control"
              style={{ width: '220px', padding: '0.35rem 0.6rem', fontSize: '0.84rem' }}
              value={selectedSpecimenId}
              onChange={(e) => handleSelectSpecimen(e.target.value)}
            >
              {specimens.map(s => (
                <option key={s.specimenId} value={s.specimenId}>
                  {s.specimenId} ({s.sex}) — {s.speciesCommonName}
                </option>
              ))}
            </select>
          </div>

          {/* Depth / Generations Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Depth:</span>
            <input
              type="range"
              min="1"
              max="6"
              value={generations}
              onChange={(e) => setGenerations(parseInt(e.target.value, 10))}
              style={{ width: '90px', accentColor: 'var(--primary)' }}
            />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>{generations} Gen</span>
          </div>
        </div>

        {/* View Mode Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => setViewMode('pedigree')}
            className={`btn ${viewMode === 'pedigree' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            Multi-Gen Graph
          </button>
          <button
            onClick={() => setViewMode('ancestors')}
            className={`btn ${viewMode === 'ancestors' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            Ancestors Only
          </button>
          <button
            onClick={() => setViewMode('descendants')}
            className={`btn ${viewMode === 'descendants' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            Descendants Only
          </button>
          <button
            onClick={loadPedigreeGraph}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.6rem' }}
            title="Refresh Graph"
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Mode Information & Stats Ribbon */}
      <div style={{
        background: '#f1f5f9',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.4rem 1.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.76rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            background: viewMode === 'pedigree' ? '#0284c7' : viewMode === 'ancestors' ? '#7c3aed' : '#059669',
            color: '#ffffff',
            padding: '0.1rem 0.45rem',
            borderRadius: '4px',
            fontWeight: 800,
            fontSize: '0.68rem',
            letterSpacing: '0.04em'
          }}>
            {viewMode === 'pedigree' ? 'MULTI-GEN PEDIGREE' : viewMode === 'ancestors' ? 'ANCESTORS ONLY' : 'DESCENDANTS ONLY'}
          </span>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
            {viewMode === 'pedigree' && `Complete Lineage Network • Showing both direct ancestors and descendants for ${selectedSpecimenId}`}
            {viewMode === 'ancestors' && `Ascending Lineage Tree • Tracing parents, grandparents, and wild founders for ${selectedSpecimenId}`}
            {viewMode === 'descendants' && `Descending Progeny Tree • Tracing offspring and successive downstream generations for ${selectedSpecimenId}`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: 600 }}>
          <span><b>{nodes.length}</b> Specimens</span>
          <span><b>{edges.length}</b> Kinship Edges</span>
        </div>
      </div>

      {/* Graph Canvas */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', minHeight: '500px', background: '#f8fafc' }}>
        {error && (
          <div style={{ position: 'absolute', top: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
            <div className="alert alert-error" style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
              <AlertTriangle size={18} /> {error}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 100, background: '#ffffff', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-main)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
            <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            Traversing Neo4j Graph...
          </div>
        )}

        {!loading && nodes.length === 0 && !error && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            background: '#ffffff',
            padding: '2rem 2.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            zIndex: 10
          }}>
            <GitFork size={40} style={{ color: 'var(--primary)', opacity: 0.8, margin: '0 auto 0.75rem' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>No Lineage Records Found</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              No ancestors or descendants recorded for {selectedSpecimenId}. This specimen may be a wild founder.
            </p>
          </div>
        )}

        {/* Legend */}
        <div style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: '1.5rem',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '0.85rem 1.15rem',
          fontSize: '0.74rem',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem'
        }}>
          <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.78rem', marginBottom: '0.2rem' }}>Lineage Legend</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#0284c7' }}></span>
            <span style={{ color: 'var(--text-muted)' }}>Sire (Male Father)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#db2777' }}></span>
            <span style={{ color: 'var(--text-muted)' }}>Dam (Female Mother)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#d97706', fontWeight: 800 }}>★</span>
            <span style={{ color: 'var(--text-muted)' }}>Wild Founder (Gen 0)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', border: '2px solid var(--primary)' }}></span>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Active Target Specimen</span>
          </div>
        </div>

        <ReactFlow
          key={`${selectedSpecimenId}-${generations}-${viewMode}-${nodes.length}`}
          style={{ width: '100%', height: '100%' }}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.5}
          attributionPosition="bottom-right"
        >
          <Background color="#cbd5e1" gap={20} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              if (n.data?.isTarget) return '#0284c7';
              if (n.data?.sex === 'M') return '#0284c7';
              if (n.data?.sex === 'F') return '#db2777';
              return '#7c3aed';
            }}
            maskColor="rgba(241, 245, 249, 0.7)"
            style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '8px' }}
          />
        </ReactFlow>
      </div>

      {/* Drawer */}
      {detailSpecimenId && (
        <SpecimenDetailPage
          specimenId={detailSpecimenId}
          onClose={() => setDetailSpecimenId(null)}
          onRefreshRequired={loadPedigreeGraph}
        />
      )}
    </div>
  );
}
