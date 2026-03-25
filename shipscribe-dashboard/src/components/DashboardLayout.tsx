import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const DashboardLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const isChat = location.pathname === '/dashboard/chat';
  const sidebarWidth = isCollapsed ? '64px' : '200px';

  return (
    <div 
      className="flex h-screen overflow-hidden bg-paper text-ink"
      style={{ '--sidebar-width': sidebarWidth } as React.CSSProperties}
    >
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-[64px]' : 'ml-[200px]'} h-full min-h-0 overflow-hidden`}>
        <main className={`flex-1 flex flex-col min-h-0 ${isChat ? 'p-0' : 'p-6 pb-12 overflow-y-auto'}`}>
          <div className={`${isChat ? 'flex-1 flex flex-col h-full min-h-0' : 'max-w-7xl mx-auto w-full'}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
