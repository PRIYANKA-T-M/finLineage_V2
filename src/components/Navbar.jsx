import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Dna, LayoutDashboard, Database, GitFork, ShieldCheck, LogIn, LogOut, Activity, Building2, CheckSquare, RefreshCw, UserCheck, Calculator, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { specimenAPI } from '../api/client';

export default function Navbar({ health, onHealthRefresh }) {
  const { user, logout, login } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [syncing, setSyncing] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await login(username, password);
      setShowLoginModal(false);
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleQuickRoleSwitch = async (roleUser, rolePass) => {
    try {
      await login(roleUser, rolePass);
      setShowLoginModal(false);
    } catch (err) {
      setLoginError('Failed to switch role');
    }
  };

  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      await specimenAPI.retryFailedSyncs();
      if (onHealthRefresh) onHealthRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setSyncing(false), 600);
    }
  };

  return (
    <>
      <nav style={{
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: '0 1px 4px 0 rgba(15, 23, 42, 0.04)',
        padding: '0.75rem 1.75rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'var(--text-main)' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              padding: '0.5rem',
              borderRadius: '12px',
              display: 'flex',
              boxShadow: '0 3px 10px rgba(2, 132, 199, 0.25)'
            }}>
              <Dna size={22} color="#ffffff" />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #0284c7, #0f172a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                FinLineage
              </span>
              <span style={{ display: 'block', fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Marine Studbook &amp; Pedigree
              </span>
            </div>
          </NavLink>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <NavLink to="/" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} end>
              <LayoutDashboard size={15} /> Dashboard
            </NavLink>
            <NavLink to="/specimens" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}>
              <Database size={15} /> Specimens
            </NavLink>
            <NavLink to="/pedigree" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}>
              <GitFork size={15} /> Pedigree Viewer
            </NavLink>
            <NavLink to="/breeding" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}>
              <Calculator size={15} /> Breeding Simulator
            </NavLink>
            <NavLink to="/population" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}>
              <TrendingUp size={15} /> Population Viability
            </NavLink>
            <NavLink to="/taxonomy" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}>
              <Building2 size={15} /> Institutions
            </NavLink>
            <NavLink to="/tests" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}>
              <CheckSquare size={15} /> Verification
            </NavLink>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Neo4j / Graph Sync indicator */}
          <button
            onClick={handleTriggerSync}
            title="Click to verify / force Neo4j graph projection synchronization"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: '#f8fafc',
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: 'var(--text-main)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <Activity size={13} color={syncing ? '#0284c7' : '#16a34a'} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            <span style={{ color: 'var(--text-muted)' }}>Graph:</span>
            <span style={{ color: syncing ? 'var(--primary)' : '#16a34a', fontWeight: 700 }}>{syncing ? 'Syncing...' : 'Neo4j Sync'}</span>
          </button>

          {/* User Profile / Login */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                onClick={() => setShowLoginModal(true)}
                style={{ textAlign: 'right', cursor: 'pointer' }}
                title="Click to switch role"
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <UserCheck size={13} color="var(--primary)" /> {user.username}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 700 }}>{user.role}</div>
              </div>
              <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem' }}>
                <LogOut size={13} /> Logout
              </button>
            </div>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              <LogIn size={14} /> Sign In (JWT)
            </button>
          )}
        </div>
      </nav>

      {/* Login & Role Switcher Modal */}
      {showLoginModal && (
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
          <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '1.75rem', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={22} color="var(--primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>Spring Security &amp; JWT</h3>
              </div>
              <button onClick={() => setShowLoginModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Select a conservation role profile or enter credentials to authenticate with JWT tokens.
            </p>

            {/* Quick Role Switch Buttons */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Quick Role Selection:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => handleQuickRoleSwitch('superadmin', 'admin123')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.74rem', padding: '0.45rem', justifyContent: 'flex-start' }}
                >
                  <ShieldCheck size={13} color="#0284c7" /> SUPER_ADMIN
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickRoleSwitch('tenantadmin', 'tenant123')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.74rem', padding: '0.45rem', justifyContent: 'flex-start' }}
                >
                  <Building2 size={13} color="#0d9488" /> TENANT_ADMIN
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickRoleSwitch('biologist', 'bio123')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.74rem', padding: '0.45rem', justifyContent: 'flex-start' }}
                >
                  <Dna size={13} color="#db2777" /> BIOLOGIST
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickRoleSwitch('keeper', 'keeper123')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.74rem', padding: '0.45rem', justifyContent: 'flex-start' }}
                >
                  <Database size={13} color="#7c3aed" /> STUDBOOK_KEEPER
                </button>
              </div>
            </div>

            {loginError && (
              <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '0.6rem 0.8rem', fontSize: '0.8rem' }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. superadmin, biologist"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowLoginModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Authenticate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
