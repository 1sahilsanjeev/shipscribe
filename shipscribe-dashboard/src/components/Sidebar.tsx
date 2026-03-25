import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Home, 
  Zap, 
  CheckCircle2, 
  FileText, 
  Share2, 
  BarChart,
  Plug,
  Settings as SettingsIcon,
  LogOut,
  MessageSquare,
  PanelLeft,
  Mic,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMCPStatus } from '../hooks/useMCPStatus';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { logout, isAdmin } = useAuth();
  const { connected, primary, connections } = useMCPStatus();


  const hasBrokenConnection = !connected && connections.length > 0;

  const navItems = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'Chat', path: '/dashboard/chat', icon: MessageSquare },
    { name: 'Activity', path: '/dashboard/activity', icon: Zap },
    { name: 'Tasks', path: '/dashboard/tasks', icon: CheckCircle2 },
    { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart },
    { name: 'Summaries', path: '/dashboard/summaries', icon: FileText },
    { name: 'Voice & Projects', path: '/dashboard/voice', icon: Mic },
    { name: 'Posts', path: '/dashboard/posts', icon: Share2 },
    { name: 'Integrations', path: '/dashboard/integrations', icon: Plug },
    { name: 'Settings', path: '/dashboard/settings', icon: SettingsIcon },
  ];

  return (
    <div className={`fixed left-0 top-0 h-screen bg-paper-warm border-r border-border flex flex-col z-30 transition-all duration-300 ${isCollapsed ? 'w-[64px]' : 'w-[200px]'}`}>
      <div className={`p-4 flex items-center h-[60px] relative ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 uppercase'}`}>
          <Link 
            to="/" 
            className="text-xl font-mono font-medium text-ink tracking-tight flex items-baseline shrink-0"
          >
            ship<span className="font-serif italic text-primary text-2xl -ml-0.5">scribe</span>
          </Link>
        </div>
        <button 
          onClick={onToggle}
          className="p-1.5 rounded-lg text-ink-muted hover:text-primary transition-all z-50 bg-transparent shrink-0"
          title={isCollapsed ? "Open sidebar" : "Close sidebar"}
        >
          <PanelLeft size={18} />
        </button>
      </div>
      
      <nav className="flex-1 py-1 space-y-0.5 overflow-x-hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }: any) => `
              flex items-center h-[40px] transition-all duration-300 relative group
              ${isActive 
                ? 'text-ink font-semibold' 
                : 'text-ink-soft hover:text-ink'}
            `}
          >
            {({ isActive }: any) => (
              <>
                <div className="w-[64px] flex-shrink-0 flex justify-center items-center">
                  <item.icon size={18} className={`shrink-0 ${isActive ? 'text-ink' : 'text-ink-muted group-hover:text-ink-soft'}`} strokeWidth={2.5} />
                </div>
                <span className={`text-[13px] tracking-tight whitespace-nowrap transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                  {item.name}
                </span>
                {item.name === 'Integrations' && hasBrokenConnection && (
                  <div className={`absolute w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)] ${isCollapsed ? 'right-2' : 'right-4'}`} />
                )}
              </>
            )}
          </NavLink>
        ))}
        
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }: any) => `
              flex items-center h-[40px] transition-all duration-300 relative group
              ${isActive 
                ? 'text-primary font-semibold' 
                : 'text-ink-soft hover:text-primary'}
            `}
          >
            {({ isActive }: any) => (
              <>
                <div className="w-[64px] flex-shrink-0 flex justify-center items-center">
                  <ShieldCheck size={18} className={`shrink-0 ${isActive ? 'text-primary' : 'text-ink-muted group-hover:text-primary'}`} strokeWidth={2.5} />
                </div>
                <span className={`text-[13px] tracking-tight whitespace-nowrap transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                  ⚙️ Admin
                </span>
              </>
            )}
          </NavLink>
        )}
      </nav>
      
      <div className="py-2 space-y-2">
        <div className="px-4">
          <div className={`bg-white border border-border rounded-2xl shadow-premium transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-[40px] h-[40px] mx-auto flex items-center justify-center p-0' : 'w-full p-4'}`}>
            <div className={`flex flex-col transition-all duration-300 ${isCollapsed ? 'items-center justify-center' : ''}`}>
              <div className={`flex items-center mb-1 ${isCollapsed ? 'gap-0' : 'gap-2'}`}>
                {connected && primary ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-success pulse shadow-[0_0_8px_rgba(15,110,86,0.5)] shrink-0" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400 shadow-[0_0_8px_rgba(0,0,0,0.1)] shrink-0" />
                )}
                <span className={`text-[11px] font-bold text-ink uppercase tracking-tight whitespace-nowrap transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                  {connected ? 'MCP Connected' : 'MCP Disconnected'}
                </span>
              </div>
              <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-0 opacity-0 h-0' : 'w-auto opacity-100 h-auto pl-4'}`}>
                {connected && primary ? (
                  <p className="text-[11px] text-ink-muted font-medium whitespace-nowrap">
                    {primary.editor.replace('_', ' ')} · {primary.minutes_ago === 0 ? 'now' : `${primary.minutes_ago}m ago`}
                  </p>
                ) : (
                  <>
                    <p className="text-[11px] text-ink-muted font-medium mb-2">
                      {primary ? `Last seen ${primary.minutes_ago} mins ago` : 'Never connected'}
                    </p>
                    <Link 
                      to="/dashboard/integrations" 
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      {primary ? 'Reconnect' : 'Set up'} →
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={logout}
          className="w-full flex items-center h-[40px] text-ink-soft hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold text-[13px] transition-all duration-300 overflow-hidden"
          title="Sign out"
        >
          <div className="w-[64px] flex-shrink-0 flex justify-center items-center">
            <LogOut size={18} className="shrink-0" />
          </div>
          <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            Sign out
          </span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
