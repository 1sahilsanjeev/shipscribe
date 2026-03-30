import React, { useState, useEffect } from 'react';
import { Filter, Download, X, ChevronDown } from 'lucide-react';
import ActivityCard from '../components/ActivityCard';
import { ActivityFilter, ActivityFilters, defaultFilters } from '../components/ActivityFilter';
import { Activity } from '../types';
import { supabase } from '../lib/supabase';

const ActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [filters, setFilters] = useState<ActivityFilters>(defaultFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Compute active filters vs default
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.dateRange !== 'all') count++;
    if (filters.fileSearch && filters.fileSearch.trim() !== '') count++;
    if (filters.editors && filters.editors.length !== defaultFilters.editors.length) count++;
    if (filters.sources && filters.sources.length !== defaultFilters.sources.length) count++;
    if (filters.projects && filters.projects.length > 0) count++;
    return count;
  };

  const activeCount = getActiveFilterCount();

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const params = new URLSearchParams();
        
        const now = new Date();
        if (filters.dateRange === 'today') {
          params.append('dateFrom', now.toISOString().split('T')[0]);
        } else if (filters.dateRange === 'yesterday') {
          const yest = new Date(now.getTime() - 86400000);
          params.append('dateFrom', yest.toISOString().split('T')[0]);
          params.append('dateTo', yest.toISOString().split('T')[0]);
        } else if (filters.dateRange === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 86400000);
          params.append('dateFrom', weekAgo.toISOString().split('T')[0]);
        } else if (filters.dateRange === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 86400000);
          params.append('dateFrom', monthAgo.toISOString().split('T')[0]);
        } else if (filters.dateRange === 'custom') {
          if (filters.customFrom) params.append('dateFrom', filters.customFrom);
          if (filters.customTo) params.append('dateTo', filters.customTo);
        }

        if (filters.editors.length > 0 && filters.editors.length !== defaultFilters.editors.length) {
          params.append('editors', filters.editors.join(','));
        }
        if (filters.projects.length > 0) {
          params.append('projects', filters.projects.join(','));
        }
        if (filters.sources.length > 0 && filters.sources.length !== defaultFilters.sources.length) {
          params.append('sources', filters.sources.join(','));
        }
        
        if (filters.fileSearch.trim()) {
          params.append('search', filters.fileSearch.trim());
        }

        params.append('limit', '100');

        const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
        const res = await fetch(`${apiUrl}/api/activities?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (!res.ok) throw new Error('API fetch failed');
        const data = await res.json();
        setActivities(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to fetch activities", e);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [filters]);

  const removeFilter = (type: string) => {
    setFilters(prev => {
      const next = { ...prev };
      if (type === 'dateRange') next.dateRange = 'all';
      if (type === 'search') next.fileSearch = '';
      return next;
    });
  };

  const renderActiveChips = () => {
    const chips = [];
    
    if (filters.dateRange !== 'all') {
      const label = filters.dateRange === 'custom' 
        ? `${filters.customFrom || '...'} to ${filters.customTo || '...'}`
        : filters.dateRange.replace('_', ' ');
      chips.push(
        <span key="date" className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold capitalize border border-primary/20">
          📅 {label}
          <button title="Remove date filter" onClick={() => removeFilter('dateRange')} className="hover:text-primary-dark ml-1"><X size={12} strokeWidth={3} /></button>
        </span>
      );
    }
    
    if (filters.fileSearch) {
      chips.push(
        <span key="search" className="flex items-center gap-1.5 px-3 py-1 bg-ink text-white rounded-full text-xs font-bold border border-ink/20">
          🔍 "{filters.fileSearch}"
          <button title="Remove search filter" onClick={() => removeFilter('search')} className="hover:text-paper ml-1"><X size={12} strokeWidth={3} /></button>
        </span>
      );
    }

    if (chips.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {chips}
        {chips.length > 0 && (
          <button 
            onClick={() => setFilters(defaultFilters)}
            className="text-xs font-bold text-ink-muted hover:text-ink transition-colors ml-2"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  };

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    setIsExportOpen(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams();
      params.append('format', format);
      
      const now = new Date();
      if (filters.dateRange === 'today') {
        params.append('dateFrom', now.toISOString().split('T')[0]);
      } else if (filters.dateRange === 'yesterday') {
        const yest = new Date(now.getTime() - 86400000);
        params.append('dateFrom', yest.toISOString().split('T')[0]);
        params.append('dateTo', yest.toISOString().split('T')[0]);
      } else if (filters.dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 86400000);
        params.append('dateFrom', weekAgo.toISOString().split('T')[0]);
      } else if (filters.dateRange === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 86400000);
        params.append('dateFrom', monthAgo.toISOString().split('T')[0]);
      } else if (filters.dateRange === 'custom') {
        if (filters.customFrom) params.append('dateFrom', filters.customFrom);
        if (filters.customTo) params.append('dateTo', filters.customTo);
      }

      if (filters.editors.length > 0 && filters.editors.length !== defaultFilters.editors.length) {
        params.append('editors', filters.editors.join(','));
      }
      if (filters.projects.length > 0) {
        params.append('projects', filters.projects.join(','));
      }
      if (filters.sources.length > 0 && filters.sources.length !== defaultFilters.sources.length) {
        params.append('sources', filters.sources.join(','));
      }
      if (filters.fileSearch.trim()) {
        params.append('search', filters.fileSearch.trim());
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
      const response = await fetch(`${apiUrl}/api/activities/export?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shipscribe_activity_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export activity. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-4xl font-serif text-ink tracking-tight mb-1">Activity <em>Timeline</em></h2>
          <p className="text-ink-muted font-medium mb-4">A full history of all your developer events.</p>
          {renderActiveChips()}
        </div>
        <div className="flex items-center gap-3 relative">
          {/* Filter Section */}
          <div className="relative">
            <button 
              id="filter-button-main"
              onClick={(e) => {
                e.stopPropagation();
                setIsExportOpen(false);
                setIsFilterOpen(!isFilterOpen);
              }}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[13px] font-bold transition-all shadow-premium active:scale-95 ${
                isFilterOpen || activeCount > 0
                  ? 'bg-paper text-ink border-border shadow-surface-hover' 
                  : 'bg-white text-ink hover:bg-paper-warm border-border'
              }`}
            >
              <Filter size={16} strokeWidth={2.5} className={activeCount > 0 ? 'text-primary' : ''} />
              Filter {activeCount > 0 && (
                <span className="flex items-center justify-center bg-primary/10 text-primary w-5 h-5 rounded-full text-[10px] ml-1">
                  {activeCount}
                </span>
              )}
            </button>
            
            <ActivityFilter 
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
              filters={filters}
              onApply={(newFilters) => setFilters(newFilters)}
            />
          </div>

          {/* Export Section */}
          <div className="relative">
            <button 
              id="export-button-main"
              onClick={(e) => {
                e.stopPropagation();
                setIsFilterOpen(false);
                setIsExportOpen(!isExportOpen);
              }}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-ink text-paper rounded-xl text-[13px] font-bold hover:bg-primary transition-all shadow-premium active:scale-95 disabled:opacity-50"
            >
              <Download size={16} strokeWidth={2.5} className={isExporting ? 'animate-bounce' : ''} />
              {isExporting ? 'Exporting...' : 'Export'}
              <ChevronDown size={14} className={`transition-transform duration-200 ${isExportOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-border rounded-xl shadow-premium z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <button 
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-3 text-left text-xs font-bold text-ink hover:bg-paper-warm transition-colors flex items-center justify-between"
                >
                  Download as CSV
                  <span className="text-[10px] text-ink-muted opacity-50">.csv</span>
                </button>
                <button 
                  onClick={() => handleExport('json')}
                  className="w-full px-4 py-3 text-left text-xs font-bold text-ink hover:bg-paper-warm transition-colors border-t border-border flex items-center justify-between"
                >
                  Download as JSON
                  <span className="text-[10px] text-ink-muted opacity-50">.json</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl shadow-premium overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-paper-warm/30 flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-widest">
            {loading ? 'Refreshing...' : 'Recent Events'}
          </span>
          <span className="text-[10px] font-mono font-bold text-ink-muted uppercase">
            Showing {activities.length} of {activities.length === 100 ? '100+' : activities.length} events
          </span>
        </div>
        
        {loading ? (
          <div className="flex flex-col gap-4 p-6">
             {[1,2,3,4,5].map(i => (
               <div key={i} className="flex gap-4 p-4 animate-pulse">
                 <div className="w-10 h-10 bg-border/40 rounded-xl"></div>
                 <div className="flex-1 space-y-2 py-1">
                   <div className="h-3 bg-border/40 rounded w-3/4"></div>
                   <div className="h-2 bg-border/30 rounded w-1/4"></div>
                 </div>
               </div>
             ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-16 text-center">
             <div className="w-16 h-16 bg-paper-warm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border shadow-inner">
               <Filter className="text-ink-muted/50" size={32} />
             </div>
             <h3 className="text-lg font-bold text-ink mb-1">No activities found</h3>
             <p className="text-sm text-ink-muted max-w-sm mx-auto">Try adjusting your filters or selecting a different date range.</p>
             <button 
               onClick={() => setFilters(defaultFilters)}
               className="mt-6 px-4 py-2 bg-white border border-border rounded-lg text-sm font-bold shadow-sm hover:bg-paper-warm transition-colors"
             >
               Clear all filters
             </button>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {activities.map((activity) => (
              <div key={activity.id} className="p-1">
                <ActivityCard activity={activity} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityPage;
