import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';
import FullPageCRMCanvas from './FullPageCRMCanvas';
import DashboardAtmosphere from './DashboardAtmosphere';

export default function Layout() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('sf_ambient_theme') || 'aurora';
  });
  const [particlesEnabled, setParticlesEnabled] = useState(() => {
    return localStorage.getItem('sf_particles_enabled') !== 'false';
  });
  const [intensity, setIntensity] = useState(() => {
    return localStorage.getItem('sf_ambient_intensity') || 'vibrant';
  });

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('sf_ambient_theme', newTheme);
  };

  const handleToggleParticles = (val) => {
    setParticlesEnabled(val);
    localStorage.setItem('sf_particles_enabled', String(val));
  };

  const handleIntensityChange = (val) => {
    setIntensity(val);
    localStorage.setItem('sf_ambient_intensity', val);
  };

  const canvasOpacity = intensity === 'vibrant' ? 0.85 : intensity === 'subtle' ? 0.45 : 0.65;

  return (
    <div className="relative flex min-h-screen bg-[#03040a] text-zinc-300 font-sans antialiased overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Dynamic Multi-Layer Ambient Atmosphere (Aurora glows, cyber grid, interactive spotlight, stardust) */}
      <DashboardAtmosphere
        theme={theme}
        onThemeChange={handleThemeChange}
        particlesEnabled={particlesEnabled}
        onToggleParticles={handleToggleParticles}
        intensity={intensity}
        onIntensityChange={handleIntensityChange}
      />

      {/* 3D Full-Page CRM Constellation Universe */}
      <FullPageCRMCanvas 
        opacity={canvasOpacity} 
        interactive={true} 
        enableNodes={particlesEnabled}
        theme={theme}
        intensity={intensity}
      />

      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area floating in the 3D CRM space */}
      <main className="flex-1 ml-64 min-h-screen relative z-10">
        <div className="max-w-[1600px] mx-auto p-8 lg:p-12">
          <Outlet />
        </div>
      </main>

      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            background: 'rgba(15, 18, 30, 0.9)',
            backdropFilter: 'blur(20px)',
            color: '#f4f4f5',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
            fontSize: '14px',
            borderRadius: '14px'
          }
        }}
      />
    </div>
  );
}
