import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';
import FullPageCRMCanvas from './FullPageCRMCanvas';

export default function Layout() {
  return (
    <div className="relative flex min-h-screen bg-zinc-950 text-zinc-300 font-sans antialiased overflow-x-hidden">
      {/* 3D Full-Page CRM Data Universe (Covers the entire application) */}
      <FullPageCRMCanvas opacity={0.65} interactive={true} />

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
            background: 'rgba(24, 24, 27, 0.85)',
            backdropFilter: 'blur(16px)',
            color: '#e4e4e7',
            border: '1px solid rgba(255,255,255,0.12)',
            fontSize: '14px',
            borderRadius: '12px'
          }
        }}
      />
    </div>
  );
}
