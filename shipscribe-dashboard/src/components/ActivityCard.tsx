import { Activity } from '../types';

interface ActivityCardProps {
  activity: Activity;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  const EDITOR_LABELS: Record<string, string> = {
    antigravity: 'Antigravity',
    cursor: 'Cursor',
    claude_code: 'Claude Code',
    vscode: 'VS Code',
    github: 'GitHub',
    manual: 'Manual',
    file_watcher: 'File Watcher',
    unknown: 'Unknown'
  }

  const EDITOR_ICONS: Record<string, string> = {
    antigravity: '⚡',
    cursor: '▲',
    claude_code: '◆',
    github: '⬡',
    manual: '✎',
    file_watcher: '👁',
    unknown: '?'
  }

  const colors: Record<string, string> = {
    github: 'text-blue-600 bg-blue-50',
    claude_code: 'text-orange-600 bg-orange-50',
    manual: 'text-success bg-success-light',
    file_watcher: 'text-indigo-600 bg-indigo-50',
    antigravity: 'text-primary bg-accent-light',
    cursor: 'text-[#3E7EFF] bg-[#3E7EFF]/10',
    vscode: 'text-[#007ACC] bg-[#007ACC]/10',
    unknown: 'text-ink-muted bg-paper-warm'
  };

  function formatEditor(editor: string | null | undefined, source: string): string {
    // Aggressive fallback: if source is file_watcher, it's definitely antigravity
    if (source === 'file_watcher' && (!editor || editor === 'unknown')) return 'Antigravity'
    
    const key = (editor || 'unknown').toLowerCase().trim()
    if (key === 'unknown' && source === 'github') return 'GitHub'
    if (key === 'unknown' && source === 'manual') return 'Manual'
    
    return EDITOR_LABELS[key] || editor || 'Unknown'
  }

  function getEditorIcon(editor: string | null | undefined, source: string): string {
    // Aggressive fallback: if source is file_watcher, it's definitely antigravity
    if (source === 'file_watcher' && (!editor || editor === 'unknown')) return '⚡'
    
    const key = (editor || 'unknown').toLowerCase().trim()
    return EDITOR_ICONS[key] || EDITOR_ICONS[source] || '?'
  }

  const editorName = formatEditor(activity.editor, activity.source);
  const editorIcon = getEditorIcon(activity.editor, activity.source);

  return (
    <div className="flex items-start gap-4 p-4 hover:bg-white rounded-xl transition-all border border-transparent hover:border-border hover:shadow-premium group">
      <div className={`w-10 h-10 flex items-center justify-center rounded-xl text-xl font-bold ${
        colors[(activity.editor || '').toLowerCase()] || 
        colors[activity.source] || 
        (activity.source === 'file_watcher' ? colors.antigravity : colors.unknown)
      }`}>
        {editorIcon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[13px] font-bold text-ink leading-tight">{activity.note}</p>
          <span className="text-[10px] font-mono font-bold text-ink-muted uppercase">{activity.timestamp}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold uppercase tracking-[0.1em] text-ink-soft bg-paper-warm px-2 py-0.5 rounded-md border border-border">
            {activity.project}
          </span>
          <span className="text-[10px] text-ink-muted font-medium italic flex items-center gap-1">
            via {editorName}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;
