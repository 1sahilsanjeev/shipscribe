import React, { useState, useEffect } from 'react';
import { adminActions } from '../lib/api';
import toast from 'react-hot-toast';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  ChevronLeft,
  ShieldCheck,
  UserPlus,
  RefreshCcw
} from 'lucide-react';

const Admin: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [filter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  async function fetchData() {
    setLoading(true);
    try {
      const [{ data: waitlist }, { data: statsData }] = await Promise.all([
        adminActions.getWaitlist({ status: filter, search }),
        adminActions.getStats()
      ]);
      setEntries(waitlist.data || []);
      setStats(statsData);
    } catch (err: any) {
      toast.error('Failed to fetch admin data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function approve(email: string) {
    try {
      await adminActions.approve(email);
      toast.success(`Invite sent to ${email}`);
      fetchData();
    } catch (err: any) {
      toast.error('Approval failed');
    }
  }

  async function bulkApprove() {
    try {
      await adminActions.bulkApprove(selected);
      toast.success(`${selected.length} invites sent`);
      setSelected([]);
      fetchData();
    } catch (err: any) {
      toast.error('Bulk approval failed');
    }
  }

  async function reject(email: string) {
    try {
      await adminActions.reject(email);
      toast.success('Rejected');
      fetchData();
    } catch (err: any) {
      toast.error('Rejection failed');
    }
  }

  async function revoke(email: string) {
    try {
      await adminActions.revoke(email);
      toast.success('Access revoked');
      fetchData();
    } catch (err: any) {
      toast.error('Revocation failed');
    }
  }

  const STATUS_COLORS: any = {
    waiting: 'text-amber-500 bg-amber-500/10',
    invited: 'text-emerald-500 bg-emerald-500/10',
    approved: 'text-blue-500 bg-blue-500/10',
    rejected: 'text-rose-500 bg-rose-500/10'
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] dark:bg-[#050505] p-8 lg:p-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <ShieldCheck className="text-primary" size={24} />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Waitlist <span className="text-primary italic">Admin</span></h1>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">Manage access requests and invite status.</p>
          </div>
          <a href="/dashboard" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors group mb-1">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold">Back to Dashboard</span>
          </a>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Signups', value: stats.total || 0, icon: Users, color: 'text-zinc-600' },
            { label: 'Waiting', value: stats.waiting || 0, icon: Clock, color: 'text-amber-500' },
            { label: 'Approved/Invited', value: stats.invited || 0, icon: CheckCircle, color: 'text-emerald-500' },
            { label: 'Rejected', value: stats.rejected || 0, icon: XCircle, color: 'text-rose-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon size={22} />
                </div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-white">{stat.value}</div>
              </div>
              <div className="text-zinc-500 dark:text-zinc-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters & Actions */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-4 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="flex bg-zinc-50 dark:bg-zinc-900 p-1.5 rounded-2xl w-full lg:w-auto">
              {['all','waiting','invited','rejected'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                    filter === f 
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Search email or name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                id="admin-search"
                title="Search waitlist"
                className="w-full h-12 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-900 border border-transparent focus:border-primary/30 rounded-2xl transition-all outline-none text-zinc-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button 
                onClick={fetchData} 
                title="Refresh"
                className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-2xl transition-all"
              >
                <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
              {selected.length > 0 && (
                <button 
                  onClick={bulkApprove}
                  className="flex items-center gap-2 px-6 h-12 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all ml-auto"
                >
                  <UserPlus size={18} />
                  Approve {selected.length}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="p-6">
                    <input 
                      type="checkbox"
                      className="w-5 h-5 rounded-lg accent-primary cursor-pointer border-zinc-300"
                      aria-label="Select all"
                      onChange={e => {
                        if (e.target.checked) {
                          setSelected(entries.filter(e => e.status === 'waiting').map(e => e.email));
                        } else {
                          setSelected([]);
                        }
                      }}
                    />
                  </th>
                  <th className="p-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">Position</th>
                  <th className="p-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">User</th>
                  <th className="p-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">Source</th>
                  <th className="p-6 text-xs font-bold text-zinc-400 uppercase tracking-wider text-center">Referrals</th>
                  <th className="p-6 text-xs font-bold text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="p-6 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors group">
                    <td className="p-6">
                      {entry.status === 'waiting' && (
                        <input
                          type="checkbox"
                          checked={selected.includes(entry.email)}
                          className="w-5 h-5 rounded-lg accent-primary cursor-pointer border-zinc-300"
                          aria-label={`Select ${entry.email}`}
                          onChange={e => {
                            if (e.target.checked) setSelected(prev => [...prev, entry.email]);
                            else setSelected(prev => prev.filter(e => e !== entry.email));
                          }}
                        />
                      )}
                    </td>
                    <td className="p-6 font-mono text-zinc-400">#{entry.position}</td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-900 dark:text-white tracking-tight">{entry.email}</span>
                        <span className="text-xs text-zinc-400">{entry.name || 'Anonymous User'}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-bold text-zinc-500 uppercase">
                        {entry.source?.replace('_', ' ') || 'landing'}
                      </span>
                    </td>
                    <td className="p-6 text-center">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${entry.referral_count > 0 ? 'bg-primary/10 text-primary font-bold' : 'text-zinc-400'}`}>
                        {entry.referral_count || 0}
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[entry.status] || 'bg-zinc-100 text-zinc-500'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {entry.status === 'waiting' && (
                          <>
                            <button
                              onClick={() => approve(entry.email)}
                              className="p-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all"
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => reject(entry.email)}
                              className="p-2 bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {entry.status === 'invited' && (
                          <button
                            onClick={() => revoke(entry.email)}
                            className="px-3 py-1.5 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-all"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {entries.length === 0 && !loading && (
            <div className="p-20 text-center">
              <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Users className="text-zinc-300" size={32} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No signups found</h3>
              <p className="text-zinc-500 mb-8">Try adjusting your filters or search terms.</p>
              <button onClick={() => {setFilter('all'); setSearch('')}} className="text-primary font-bold hover:underline">Clear all filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
