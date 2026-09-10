import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-300 font-sans antialiased">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-[1600px] mx-auto p-8 lg:p-12">
          <Outlet />
        </div>
      </main>
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#e4e4e7',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '14px'
          }
        }}
      />
    </div>
  );
}
