import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

const fetchApi = async (path: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No session');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
  const res = await fetch(`${apiUrl}${path}`, {
    headers: { 'Authorization': `Bearer ${session.access_token}` },
  });
  if (!res.ok) throw new Error('API fetch failed');
  return res.json();
};

export interface ActivityFilters {
  dateRange: 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom';
  customFrom: string | null;
  customTo: string | null;
  editors: string[];
  projects: string[];
  sources: string[];
  fileSearch: string;
}

export const defaultFilters: ActivityFilters = {
  dateRange: 'all',
  customFrom: null,
  customTo: null,
  editors: ['antigravity', 'cursor', 'claude_code', 'vscode', 'github', 'manual', 'unknown'],
  projects: [],
  sources: ['file_watcher', 'github', 'claude_code', 'manual'],
  fileSearch: '',
};

interface ActivityFilterProps {
  filters: ActivityFilters;
  onApply: (workingFilters: ActivityFilters) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ALL_EDITORS = [
  { id: 'antigravity', label: 'Antigravity' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'claude_code', label: 'Claude Code' },
  { id: 'github', label: 'GitHub' },
  { id: 'manual', label: 'Manual' }
];

const ALL_SOURCES = [
  { id: 'file_watcher', label: 'File watcher' },
  { id: 'github', label: 'GitHub commits' },
  { id: 'claude_code', label: 'Claude Code sessions' },
  { id: 'manual', label: 'Manual entries' }
];

export const ActivityFilter: React.FC<ActivityFilterProps> = ({ 
  filters, 
  onApply, 
  isOpen, 
  onClose 
}) => {
  const [workingFilters, setWorkingFilters] = useState<ActivityFilters>(filters);
  const [availableProjects, setAvailableProjects] = useState<string[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setWorkingFilters(filters);
      fetchProjects();
    }
  }, [isOpen, filters]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        const button = document.getElementById('filter-button-main');
        if (button && button.contains(event.target as Node)) return;
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const fetchProjects = async () => {
    try {
      const data = await fetchApi('/api/analytics/projects-list');
      setAvailableProjects(data || []);
      if (workingFilters.projects.length === 0 && data.length > 0) {
        setWorkingFilters(prev => ({ ...prev, projects: data }));
      }
    } catch (e) {
      console.error('Failed to load projects for filter', e);
    }
  };

  const handleClearAll = () => {
    setWorkingFilters({ ...defaultFilters, projects: availableProjects });
  };

  const toggleArrayItem = (key: 'editors' | 'projects' | 'sources', value: string) => {
    setWorkingFilters(prev => {
      const current = prev[key];
      const next = current.includes(value) 
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const isChecked = (key: 'editors' | 'projects' | 'sources', value: string) => 
    workingFilters[key].includes(value);

  if (!isOpen) return null;

  return (
    <div 
      ref={panelRef}
      className="absolute top-full right-0 mt-2 w-[340px] bg-white rounded-2xl border border-border shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b border-border bg-paper-warm/50">
        <h3 className="font-bold text-ink text-sm">Filters</h3>
        <button 
          onClick={handleClearAll}
          className="text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="px-4 py-2 max-h-[60vh] overflow-y-auto overflow-x-hidden space-y-6">
        
        {/* DATE RANGE */}
        <section className="pt-2">
          <h4 className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-2">Date Range</h4>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(['today', 'yesterday', 'week', 'month', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setWorkingFilters(prev => ({ ...prev, dateRange: range }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  workingFilters.dateRange === range 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-paper text-ink hover:bg-border'
                }`}
              >
                {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : range.replace('_', ' ')}
              </button>
            ))}
            <button
              onClick={() => setWorkingFilters(prev => ({ ...prev, dateRange: 'custom' }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                workingFilters.dateRange === 'custom' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'bg-paper text-ink hover:bg-border'
              }`}
            >
              <Calendar size={12} />
              Custom
            </button>
          </div>
          
          {workingFilters.dateRange === 'custom' && (
            <div className="flex items-center gap-2 mt-2 p-3 bg-paper rounded-xl border border-border">
              <input 
                type="date" 
                title="Start date"
                value={workingFilters.customFrom || ''}
                onChange={e => setWorkingFilters(prev => ({ ...prev, customFrom: e.target.value }))}
                className="flex-1 bg-white border border-border rounded-lg px-2 py-1 text-xs text-ink focus:outline-none focus:border-primary"
              />
              <span className="text-ink-muted text-xs">&rarr;</span>
              <input 
                type="date" 
                title="End date"
                value={workingFilters.customTo || ''}
                onChange={e => setWorkingFilters(prev => ({ ...prev, customTo: e.target.value }))}
                className="flex-1 bg-white border border-border rounded-lg px-2 py-1 text-xs text-ink focus:outline-none focus:border-primary"
              />
            </div>
          )}
        </section>

        {/* EDITOR */}
        <section>
          <h4 className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-2">Editor</h4>
          <div className="space-y-2">
            {ALL_EDITORS.map(editor => (
              <label key={editor.id} className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={isChecked('editors', editor.id)}
                  onChange={() => toggleArrayItem('editors', editor.id)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm font-medium text-ink group-hover:text-primary transition-colors">{editor.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* PROJECT */}
        <section>
          <h4 className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-2">Project</h4>
          <div className="space-y-2">
            {availableProjects.length === 0 ? (
              <p className="text-xs text-ink-muted italic">Loading...</p>
            ) : availableProjects.map(project => (
              <label key={project} className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={isChecked('projects', project)}
                  onChange={() => toggleArrayItem('projects', project)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm font-medium text-ink group-hover:text-primary transition-colors">{project}</span>
              </label>
            ))}
          </div>
        </section>

        {/* SOURCE */}
        <section>
          <h4 className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-2">Source</h4>
          <div className="space-y-2">
            {ALL_SOURCES.map(source => (
              <label key={source.id} className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={isChecked('sources', source.id)}
                  onChange={() => toggleArrayItem('sources', source.id)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm font-medium text-ink group-hover:text-primary transition-colors">{source.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* FILE SEARCH */}
        <section className="pb-2">
          <h4 className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-2">File Name / Content</h4>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search notes or files..." 
              value={workingFilters.fileSearch}
              onChange={e => setWorkingFilters(prev => ({ ...prev, fileSearch: e.target.value }))}
              className="w-full bg-paper border border-border rounded-xl pl-3 pr-8 py-2 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-ink-muted/50"
            />
            {workingFilters.fileSearch && (
              <button 
                title="Clear file search"
                onClick={() => setWorkingFilters(prev => ({ ...prev, fileSearch: '' }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-muted hover:text-ink rounded-lg"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </section>

      </div>

      <div className="p-4 border-t border-border bg-paper-warm/50">
        <button
          onClick={() => {
            onApply(workingFilters);
            onClose();
          }}
          className="w-full py-2.5 bg-ink text-white rounded-xl font-bold text-sm hover:bg-primary transition-colors shadow-premium active:scale-[0.98]"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};
