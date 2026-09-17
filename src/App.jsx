import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import SpecimenDirectoryPage from './pages/SpecimenDirectoryPage';
import SpecimenFormPage from './pages/SpecimenFormPage';
import PedigreeViewerPage from './pages/PedigreeViewerPage';
import TaxonomyPage from './pages/TaxonomyPage';
import BreedingSimulatorPage from './pages/BreedingSimulatorPage';
import PopulationOptimizationPage from './pages/PopulationOptimizationPage';
import TestsDocsPage from './pages/TestsDocsPage';
import { dashboardAPI } from './api/client';

export default function App() {
  const [health, setHealth] = useState(null);

  const fetchHealth = async () => {
    try {
      const res = await dashboardAPI.getSummary();
      setHealth(res.data);
    } catch (e) {
      console.error('Failed to fetch summary', e);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar health={health} onHealthRefresh={fetchHealth} />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/specimens" element={<SpecimenDirectoryPage />} />
          <Route path="/specimens/new" element={<SpecimenFormPage />} />
          <Route path="/pedigree" element={<PedigreeViewerPage />} />
          <Route path="/breeding" element={<BreedingSimulatorPage />} />
          <Route path="/population" element={<PopulationOptimizationPage />} />
          <Route path="/taxonomy" element={<TaxonomyPage />} />
          <Route path="/tests" element={<TestsDocsPage />} />
        </Routes>
      </main>
    </div>
  );
}
