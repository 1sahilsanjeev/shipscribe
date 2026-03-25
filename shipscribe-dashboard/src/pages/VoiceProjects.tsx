import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  Plus, 
  Trash2, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  ExternalLink, 
  Github, 
  MoreVertical,
  Edit2,
  Star,
  X
} from 'lucide-react';
import { voiceActions, projectActions } from '../lib/api';
import { VoicePersona, Project } from '../types';
import toast from 'react-hot-toast';

const VoiceProjects: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'voice' | 'projects'>('voice');
  const [personas, setPersonas] = useState<VoicePersona[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form States
  const [personaForm, setPersonaForm] = useState({
    name: '',
    x_username: '',
    type: 'own' as 'own' | 'creator',
    description: ''
  });

  const [projectForm, setProjectForm] = useState({
    name: '',
    emoji: '🚀',
    description: '',
    status: 'active' as any,
    color: '#1A3FE0',
    url: '',
    github_url: '',
    tech_stack: [] as string[],
    target_audience: '',
    problem_solved: '',
    current_focus: '',
    is_primary: false,
    metrics: { mrr: 0, users: 0, commits: 0 }
  });

  const [newTech, setNewTech] = useState('');

  const emojis = ['🚀', '💡', '🛠️', '🎯', '📱', '🌐', '🤖', '💰', '📊', '🎨', '🔧', '⚡', '🏗️', '🔐', '📝', '🎮', '🛒', '🏥', '📚', '🎵', '🌍', '💻', '🔬', '🏆'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vRes, pRes] = await Promise.all([
        voiceActions.getAll(),
        projectActions.getAll()
      ]);
      setPersonas(vRes.data);
      setProjects(pRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPersona = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await voiceActions.create(personaForm);
      toast.success('Persona added! Starting training...');
      setShowPersonaModal(false);
      setPersonaForm({ name: '', x_username: '', type: 'own', description: '' });
      
      // Start training simulation
      await voiceActions.train(res.data.id, personaForm.x_username);
      fetchData();
      
      // Refresh periodically to show training progress
      const interval = setInterval(async () => {
        const updated = await voiceActions.getAll();
        setPersonas(updated.data);
        const current = updated.data.find((p: any) => p.id === res.data.id);
        if (current?.status === 'ready' || current?.status === 'failed') {
          clearInterval(interval);
        }
      }, 3000);

    } catch (error) {
      toast.error('Failed to add persona');
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await projectActions.update(editingProject.id, projectForm);
        toast.success('Project updated');
      } else {
        await projectActions.create(projectForm);
        toast.success('Project added');
      }
      setShowProjectModal(false);
      setEditingProject(null);
      resetProjectForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to save project');
    }
  };

  const resetProjectForm = () => {
    setProjectForm({
      name: '',
      emoji: '🚀',
      description: '',
      status: 'active',
      color: '#1A3FE0',
      url: '',
      github_url: '',
      tech_stack: [],
      target_audience: '',
      problem_solved: '',
      current_focus: '',
      is_primary: false,
      metrics: { mrr: 0, users: 0, commits: 0 }
    });
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      emoji: project.emoji,
      description: project.description || '',
      status: project.status as any,
      color: project.color,
      url: project.url || '',
      github_url: project.github_url || '',
      tech_stack: project.tech_stack || [],
      target_audience: project.target_audience || '',
      problem_solved: project.problem_solved || '',
      current_focus: project.current_focus || '',
      is_primary: project.is_primary,
      metrics: project.metrics || { mrr: 0, users: 0, commits: 0 }
    });
    setShowProjectModal(true);
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await projectActions.setPrimary(id);
      toast.success('Primary project updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update primary project');
    }
  };

  const handleActivateVoice = async (id: string) => {
    try {
      await voiceActions.activate(id);
      toast.success('Active voice updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update voice');
    }
  };

  const handlePreviewVoice = async (id: string) => {
    try {
      const res = await voiceActions.preview(id);
      toast((t) => (
        <div className="flex flex-col gap-2">
          <p className="font-bold text-xs uppercase text-primary">Preview Post</p>
          <p className="text-sm font-medium">{res.data.text}</p>
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="text-[10px] font-bold uppercase text-ink-muted hover:text-ink"
          >
            Close
          </button>
        </div>
      ), { duration: 6000 });
    } catch (error) {
      toast.error('Training not complete');
    }
  };

  const handleDeletePersona = async (id: string) => {
    if (!confirm('Are you sure you want to delete this persona?')) return;
    try {
      await voiceActions.delete(id);
      toast.success('Persona deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete persona');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await projectActions.delete(id);
      toast.success('Project deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-medium text-ink mb-1 italic">Voice & Projects</h1>
          <p className="text-ink-muted font-medium text-sm">
            Configure how Shipscribe writes and provide context about your work.
          </p>
        </div>
        <div className="flex bg-white/50 p-1 rounded-2xl border border-border self-start">
          <button 
            onClick={() => setActiveTab('voice')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'voice' ? 'bg-white text-primary shadow-premium' : 'text-ink-soft hover:text-ink'}`}
          >
            🎙️ Voice Personas
          </button>
          <button 
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'projects' ? 'bg-white text-primary shadow-premium' : 'text-ink-soft hover:text-ink'}`}
          >
            📁 Projects
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {activeTab === 'voice' ? (
            <div className="space-y-8">
              {/* Voice Personas Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-ink uppercase tracking-tight">Your Voice</h2>
                  <p className="text-xs text-ink-muted font-medium mt-1">Train Shipscribe to write in your unique style.</p>
                </div>
                <button 
                  onClick={() => setShowPersonaModal(true)}
                  className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:shadow-premium transition-all"
                >
                  <Plus size={16} /> Add Persona
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {personas.filter(p => p.type === 'own').map(persona => (
                  <PersonaCard 
                    key={persona.id} 
                    persona={persona} 
                    onActivate={handleActivateVoice}
                    onPreview={handlePreviewVoice}
                    onDelete={handleDeletePersona}
                    onRetrain={() => voiceActions.train(persona.id, persona.x_username).then(fetchData)}
                  />
                ))}
                {personas.filter(p => p.type === 'own').length === 0 && (
                  <button 
                    onClick={() => setShowPersonaModal(true)}
                    className="border-2 border-dashed border-border rounded-3xl p-8 flex flex-col items-center justify-center gap-3 text-ink-soft hover:text-primary hover:border-primary transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-paper-warm flex items-center justify-center group-hover:bg-primary/5 transition-all">
                      <Plus className="group-hover:scale-110 transition-all" />
                    </div>
                    <span className="font-bold text-sm">Train your own voice</span>
                  </button>
                )}
              </div>

              <div className="pt-8 border-t border-border">
                <h2 className="text-xl font-bold text-ink uppercase tracking-tight">Creator Personas</h2>
                <p className="text-xs text-ink-muted font-medium mt-1">Add other creators to write in their style.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {personas.filter(p => p.type === 'creator').map(persona => (
                    <PersonaCard 
                      key={persona.id} 
                      persona={persona} 
                      onActivate={handleActivateVoice}
                      onPreview={handlePreviewVoice}
                      onDelete={handleDeletePersona}
                      onRetrain={() => voiceActions.train(persona.id, persona.x_username).then(fetchData)}
                    />
                  ))}
                  <button 
                    onClick={() => {
                      setPersonaForm({ ...personaForm, type: 'creator' });
                      setShowPersonaModal(true);
                    }}
                    className="border-2 border-dashed border-border rounded-3xl p-8 flex flex-col items-center justify-center gap-3 text-ink-soft hover:text-primary hover:border-primary transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-paper-warm flex items-center justify-center group-hover:bg-primary/5 transition-all">
                      <Plus className="group-hover:scale-110 transition-all" />
                    </div>
                    <span className="font-bold text-sm">Add creator style</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-ink uppercase tracking-tight">Projects</h2>
                  <p className="text-xs text-ink-muted font-medium mt-1">Context for AI summaries and posts.</p>
                </div>
                <button 
                  onClick={() => { resetProjectForm(); setShowProjectModal(true); }}
                  className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:shadow-premium transition-all"
                >
                  <Plus size={16} /> Add Project
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                    onSetPrimary={handleSetPrimary}
                  />
                ))}
                <button 
                  onClick={() => { resetProjectForm(); setShowProjectModal(true); }}
                  className="border-2 border-dashed border-border rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-ink-soft hover:text-primary hover:border-primary transition-all group min-h-[300px]"
                >
                  <div className="w-16 h-16 rounded-3xl bg-paper-warm flex items-center justify-center group-hover:bg-primary/5 transition-all">
                    <Plus size={32} className="group-hover:scale-110 transition-all" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg text-ink">Add Project</p>
                    <p className="text-xs font-medium mt-1">Let AI know what you're building</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Persona Modal */}
      {showPersonaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-premium animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-serif italic text-ink">Add Voice Persona</h3>
              <button 
                type="button"
                title="Close Modal"
                onClick={() => setShowPersonaModal(false)}
                className="text-ink-soft hover:text-ink"
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleAddPersona} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-ink uppercase tracking-wider">Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="type" 
                      value="own" 
                      checked={personaForm.type === 'own'} 
                      onChange={() => setPersonaForm({ ...personaForm, type: 'own' })}
                      className="accent-primary"
                    />
                    <span className="text-sm font-medium">My own X account</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="type" 
                      value="creator" 
                      checked={personaForm.type === 'creator'} 
                      onChange={() => setPersonaForm({ ...personaForm, type: 'creator' })}
                      className="accent-primary"
                    />
                    <span className="text-sm font-medium">Another creator</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-ink uppercase tracking-wider">X Profile</label>
                <input 
                  type="text" 
                  placeholder="@username or URL" 
                  required
                  className="w-full bg-paper-warm border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={personaForm.x_username}
                  onChange={e => setPersonaForm({ ...personaForm, x_username: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-ink uppercase tracking-wider">Display Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. My casual voice" 
                  required
                  className="w-full bg-paper-warm border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={personaForm.name}
                  onChange={e => setPersonaForm({ ...personaForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-ink uppercase tracking-wider">Description (Optional)</label>
                <textarea 
                  placeholder="What makes this voice unique?" 
                  rows={3}
                  className="w-full bg-paper-warm border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={personaForm.description}
                  onChange={e => setPersonaForm({ ...personaForm, description: e.target.value })}
                />
              </div>

              <div className="bg-paper p-4 rounded-3xl border border-border space-y-3">
                <p className="text-[11px] font-bold text-ink-muted uppercase">How we train</p>
                <ol className="text-xs text-ink-soft space-y-1 ml-4 list-decimal font-medium">
                  <li>Fetch public tweets via X API</li>
                  <li>AI analyzes tone, hooks, vocabulary</li>
                  <li>Build a voice fingerprint</li>
                </ol>
                <p className="text-[10px] text-ink-muted italic">Only public tweets are used.</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowPersonaModal(false)}
                  className="flex-1 bg-paper-warm text-ink font-bold py-3 rounded-2xl border border-border hover:bg-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-primary text-white font-bold py-3 rounded-2xl hover:shadow-premium transition-all"
                >
                  Add & Start Training
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-premium animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-serif italic text-ink">{editingProject ? 'Edit Project' : 'Add Project'}</h3>
              <button onClick={() => setShowProjectModal(false)} className="text-ink-soft hover:text-ink"><X /></button>
            </div>
            <form onSubmit={handleSaveProject} className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-ink uppercase tracking-wider">Emoji</label>
                  <div className="relative group">
                    <div className="w-full bg-paper-warm border border-border rounded-xl px-4 py-3 text-2xl flex items-center justify-center cursor-pointer">
                      {projectForm.emoji}
                    </div>
                    <div className="absolute top-full left-0 mt-2 bg-white border border-border rounded-2xl p-2 shadow-premium grid grid-cols-6 gap-1 z-10 hidden group-hover:grid">
                      {emojis.map(e => (
                        <button 
                          key={e} 
                          type="button"
                          title={`Select emoji ${e}`}
                          aria-label={`Select emoji ${e}`}
                          onClick={() => setProjectForm({ ...projectForm, emoji: e })}
                          className="w-8 h-8 flex items-center justify-center hover:bg-paper-warm rounded-lg transition-all"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="col-span-3 space-y-2">
                  <label className="text-[11px] font-bold text-ink uppercase tracking-wider">Name *</label>
                  <input 
                    type="text" 
                    placeholder="Project name" 
                    required
                    className="w-full bg-paper-warm border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold"
                    value={projectForm.name}
                    onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-ink uppercase tracking-wider">Description *</label>
                <textarea 
                  placeholder="What does this project do?" 
                  required
                  rows={2}
                  className="w-full bg-paper-warm border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={projectForm.description}
                  onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-ink uppercase tracking-wider">Status</label>
                  <select 
                    title="Project Status"
                    className="w-full bg-paper-warm border border-border rounded-xl px-4 py-3 text-sm focus:outline-none appearance-none font-bold"
                    value={projectForm.status}
                    onChange={e => setProjectForm({ ...projectForm, status: e.target.value as any })}
                  >
                    <option value="active">Active</option>
                    <option value="building">Building</option>
                    <option value="launched">Launched</option>
                    <option value="paused">Paused</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-ink uppercase tracking-wider">Accent Color</label>
                  <div className="flex gap-2 p-1 bg-paper-warm border border-border rounded-xl">
                    {['#1A3FE0', '#E01A4F', '#1AE05B', '#E09F1A', '#8B1AE0'].map(c => (
                      <button 
                        key={c}
                        type="button"
                        title={`Select color ${c}`}
                        aria-label={`Select color ${c}`}
                        onClick={() => setProjectForm({ ...projectForm, color: c })}
                        className={`w-full h-8 rounded-lg transition-all ${projectForm.color === c ? 'ring-2 ring-offset-2 ring-primary ring-offset-paper-warm' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-ink uppercase tracking-wider">Website URL</label>
                  <input 
                    type="url" 
                    placeholder="https://..." 
                    className="w-full bg-paper-warm border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={projectForm.url}
                    onChange={e => setProjectForm({ ...projectForm, url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-ink uppercase tracking-wider">GitHub URL</label>
                  <input 
                    type="url" 
                    placeholder="https://github.com/..." 
                    className="w-full bg-paper-warm border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={projectForm.github_url}
                    onChange={e => setProjectForm({ ...projectForm, github_url: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-ink uppercase tracking-wider">Tech Stack</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {projectForm.tech_stack.map(tech => (
                    <span key={tech} className="bg-white border border-border px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      {tech}
                      <button 
                        type="button" 
                        title="Remove tech"
                        aria-label="Remove tech"
                        onClick={() => setProjectForm({ ...projectForm, tech_stack: projectForm.tech_stack.filter(t => t !== tech) })} 
                        className="text-ink-soft hover:text-red-500"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Add tech (React, etc.)" 
                    className="flex-1 bg-paper-warm border border-border rounded-xl px-4 py-2 text-sm focus:outline-none"
                    value={newTech}
                    onChange={e => setNewTech(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newTech.trim()) {
                          setProjectForm({ ...projectForm, tech_stack: [...projectForm.tech_stack, newTech.trim()] });
                          setNewTech('');
                        }
                      }
                    }}
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      if (newTech.trim()) {
                        setProjectForm({ ...projectForm, tech_stack: [...projectForm.tech_stack, newTech.trim()] });
                        setNewTech('');
                      }
                    }}
                    className="bg-paper-warm border border-border px-4 rounded-xl text-xs font-bold"
                  >Add</button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-ink uppercase tracking-wider">Target Audience</label>
                <input 
                  type="text" 
                  placeholder="Who is this for?" 
                  className="w-full bg-paper-warm border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={projectForm.target_audience}
                  onChange={e => setProjectForm({ ...projectForm, target_audience: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-ink uppercase tracking-wider">Problem Solved</label>
                <textarea 
                  placeholder="What problem does this fix?" 
                  rows={2}
                  className="w-full bg-paper-warm border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={projectForm.problem_solved}
                  onChange={e => setProjectForm({ ...projectForm, problem_solved: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-ink uppercase tracking-wider">Current Focus</label>
                <input 
                  type="text" 
                  placeholder="What are you working on right now?" 
                  className="w-full bg-paper-warm border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={projectForm.current_focus}
                  onChange={e => setProjectForm({ ...projectForm, current_focus: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3 bg-paper p-4 rounded-3xl border border-border">
                <input 
                  type="checkbox" 
                  id="is_primary"
                  className="w-5 h-5 rounded-lg accent-primary" 
                  checked={projectForm.is_primary}
                  onChange={e => setProjectForm({ ...projectForm, is_primary: e.target.checked })}
                />
                <label htmlFor="is_primary" className="text-sm font-bold text-ink cursor-pointer">Set as primary project</label>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="flex-1 bg-paper-warm text-ink font-bold py-3 rounded-2xl border border-border hover:bg-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-primary text-white font-bold py-3 rounded-2xl hover:shadow-premium transition-all"
                >
                  {editingProject ? 'Update Project' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const PersonaCard = ({ persona, onActivate, onPreview, onDelete, onRetrain }: { 
  persona: VoicePersona, 
  onActivate: (id: string) => void, 
  onPreview: (id: string) => void,
  onDelete: (id: string) => void,
  onRetrain: (id: string) => void
}) => {
  return (
    <div className={`bg-white border-2 rounded-3xl p-6 transition-all relative overflow-hidden ${persona.is_active ? 'border-primary' : 'border-border'}`}>
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-paper-warm overflow-hidden border border-border">
            {persona.avatar_url ? (
              <img src={persona.avatar_url} alt={persona.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary"><Mic size={24} /></div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-ink">@{persona.x_username}</h3>
              {persona.is_active && (
                <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm animate-pulse">Active</span>
              )}
            </div>
            <p className="text-xs text-ink-muted font-bold uppercase tracking-tight">{persona.name}</p>
          </div>
        </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={persona.status} />
            <div className="relative group">
              <button title="More Actions" className="p-1 text-ink-soft hover:text-ink"><MoreVertical size={18} /></button>
              <div className="absolute top-full right-0 mt-2 bg-white border border-border rounded-2xl shadow-premium py-2 w-48 hidden group-hover:block z-20">
              <button 
                onClick={() => onRetrain(persona.id)}
                className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-ink-soft hover:text-primary hover:bg-paper-warm transition-all"
              >
                <RefreshCw size={14} /> Retrain Voice
              </button>
              <button 
                onClick={() => onDelete(persona.id)}
                className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 size={14} /> Delete Persona
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm font-medium text-ink/80 mt-4 line-clamp-2 italic">
        {persona.description || `Writing style trained on @${persona.x_username}'s content.`}
      </p>

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-border/50">
        <div className="text-xs font-bold text-ink-muted flex items-center gap-1">
          <CheckCircle2 size={14} className="text-success" />
          {persona.tweet_count > 0 ? `${persona.tweet_count.toLocaleString()} tweets analyzed` : 'No data yet'}
        </div>
        <div className="flex gap-2">
          {!persona.is_active && persona.status === 'ready' && (
            <button 
              onClick={() => onActivate(persona.id)}
              className="bg-paper-warm text-ink px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-tight hover:bg-white border border-border transition-all"
            >
              Set Active
            </button>
          )}
          <button 
            onClick={() => onPreview(persona.id)}
            disabled={persona.status !== 'ready'}
            className="flex items-center gap-2 bg-white text-ink px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-tight border border-border hover:bg-paper-warm transition-all disabled:opacity-50"
          >
            <Play size={12} /> Preview
          </button>
        </div>
      </div>
      
      {persona.status === 'scraping' || persona.status === 'training' ? (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-paper-warm">
          <div className="h-full bg-primary animate-progress duration-[5s] w-1/2"></div>
        </div>
      ) : null}
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    pending: 'bg-gray-100 text-gray-500',
    scraping: 'bg-blue-100 text-blue-500 animate-pulse',
    training: 'bg-purple-100 text-purple-500 animate-pulse',
    ready: 'bg-emerald-100 text-emerald-500',
    failed: 'bg-red-100 text-red-500'
  };

  const labels: any = {
    pending: 'Queued',
    scraping: 'Scraping',
    training: 'Training',
    ready: 'Ready',
    failed: 'Failed'
  };

  return (
    <span className={`${styles[status]} text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter`}>
      {labels[status]}
    </span>
  );
};

const ProjectCard = ({ project, onEdit, onDelete, onSetPrimary }: { 
  project: Project, 
  onEdit: (p: Project) => void,
  onDelete: (id: string) => void,
  onSetPrimary: (id: string) => void
}) => {
  return (
    <div className={`bg-white border-2 rounded-[32px] p-6 transition-all hover:shadow-premium group ${project.is_primary ? 'border-primary shadow-premium' : 'border-border'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-3xl flex items-center justify-center text-3xl shadow-sm border border-border/50`} style={{ backgroundColor: `${project.color}10` }}>
          {project.emoji || '🚀'}
        </div>
        <div className="flex gap-2">
          {project.is_primary && (
             <span className="bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Primary</span>
          )}
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
            project.status === 'active' ? 'bg-success/10 text-success' : 
            project.status === 'building' ? 'bg-blue-100 text-blue-600' : 
            'bg-gray-100 text-gray-600'
          }`}>
            {project.status}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-ink flex items-center gap-2">
          {project.name}
          {!project.is_primary && (
            <button onClick={() => onSetPrimary(project.id)} className="opacity-0 group-hover:opacity-100 transition-all text-ink-soft hover:text-primary" title="Set as primary">
              <Star size={18} />
            </button>
          )}
        </h3>
        <p className="text-sm font-medium text-ink-muted line-clamp-2 leading-relaxed h-10">
          {project.description}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-4 min-h-[50px]">
        {project.tech_stack.slice(0, 4).map(tech => (
          <span key={tech} className="bg-paper-warm text-[10px] font-bold text-ink-soft px-2 py-0.5 rounded-lg border border-border/50 uppercase tracking-tight">
            {tech}
          </span>
        ))}
        {project.tech_stack.length > 4 && (
          <span className="text-[10px] font-bold text-ink-muted self-center">+{project.tech_stack.length - 4}</span>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
        {project.current_focus && (
          <div className="flex items-start gap-2">
            <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
            <p className="text-[11px] font-bold text-ink"><span className="text-ink-muted uppercase mr-1">Focus:</span> {project.current_focus}</p>
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-paper-warm rounded-2xl border border-border/50">
            <p className="text-[9px] font-black text-ink-muted uppercase tracking-tighter">MRR</p>
            <p className="text-xs font-bold text-ink">${project.metrics?.mrr || 0}</p>
          </div>
          <div className="text-center p-2 bg-paper-warm rounded-2xl border border-border/50">
            <p className="text-[9px] font-black text-ink-muted uppercase tracking-tighter">Users</p>
            <p className="text-xs font-bold text-ink">{project.metrics?.users || 0}</p>
          </div>
          <div className="text-center p-2 bg-paper-warm rounded-2xl border border-border/50">
            <p className="text-[9px] font-black text-ink-muted uppercase tracking-tighter">Commits</p>
            <p className="text-xs font-bold text-ink">{project.metrics?.commits || 0}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-1">
          {project.url && (
            <a href={project.url} target="_blank" rel="noreferrer" title="Website" className="p-2 bg-paper-warm rounded-xl text-ink-soft hover:text-primary transition-all border border-border/50"><ExternalLink size={14} /></a>
          )}
          {project.github_url && (
            <a href={project.github_url} target="_blank" rel="noreferrer" title="GitHub" className="p-2 bg-paper-warm rounded-xl text-ink-soft hover:text-primary transition-all border border-border/50"><Github size={14} /></a>
          )}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(project)}
            className="flex items-center gap-2 text-[11px] font-black uppercase text-ink-soft hover:text-primary transition-all"
          >
            <Edit2 size={14} /> Edit
          </button>
          <div className="w-1 h-1 rounded-full bg-border self-center" />
          <button 
            onClick={() => onDelete(project.id)}
            className="flex items-center gap-2 text-[11px] font-black uppercase text-ink-soft hover:text-red-500 transition-all"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceProjects;
