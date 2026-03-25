import React from 'react';
import { Task } from '../types';
import { Clock } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onComplete?: (id: number) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete }) => {
  const priorityDots = {
    high: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
    medium: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
    low: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]'
  };

  return (
    <div 
      onClick={() => onComplete?.(task.id)}
      className="bg-white border border-border p-4 rounded-xl shadow-premium hover:shadow-premium-lg hover:border-primary/30 transition-all cursor-pointer group active:scale-[0.98]"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${priorityDots[task.priority]}`} />
          <span className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-[0.1em]">
            {task.priority}
          </span>
        </div>
        <div className="text-[9px] font-mono font-bold bg-paper-warm border border-border px-2 py-0.5 rounded-md text-ink-soft group-hover:bg-accent-light group-hover:text-primary transition-colors">
          {task.project}
        </div>
      </div>
      
      <h4 className="text-[14px] font-bold mb-3 leading-snug text-ink group-hover:text-primary transition-colors">{task.title}</h4>
      
      <div className="flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1.5 text-ink-muted">
           <span className="text-[10px] font-medium italic">Click to done</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-ink-muted font-mono font-bold">
          <Clock size={10} strokeWidth={2.5} />
          <span>{task.created_at}</span>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
