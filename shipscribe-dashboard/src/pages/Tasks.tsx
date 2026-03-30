import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../lib/api';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  pointerWithin,
  rectIntersection,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Filter, Layers, CheckCircle, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './Tasks.css';

interface Task {
  id: string;
  user_id: string;
  title: string;
  project: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  created_at: string;
  completed_at?: string | null;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#9CA3AF',
};

const COLUMN_IDS = ['todo', 'in_progress', 'done'] as const;
type ColumnId = typeof COLUMN_IDS[number];

const COLUMNS: { id: ColumnId; title: string; color: string }[] = [
  { id: 'todo', title: 'TO DO', color: '#3B82F6' },
  { id: 'in_progress', title: 'IN PROGRESS', color: '#F59E0B' },
  { id: 'done', title: 'COMPLETED', color: '#10B981' },
];

// --- Sortable Task Card ---
function SortableTaskCard({
  task,
  onDelete,
  isDragOverlay = false,
}: {
  task: Task;
  onDelete: (id: string) => void;
  isDragOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task, type: 'task' },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragOverlay ? undefined : transition,
    opacity: isDragging && !isDragOverlay ? 0.35 : 1,
  };

  const dot = PRIORITY_COLORS[task.priority] || '#9CA3AF';

  const timeAgo = (iso: string) => {
    try {
      const diff = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card${isDragOverlay ? ' drag-overlay' : ''}${isDragging ? ' is-dragging' : ''}`}
    >
      <div className="task-card-header">
        <span className="priority-dot" style={{ background: dot }} title={task.priority} />
        {task.project && <span className="task-project">{task.project}</span>}
        <button
          className="task-delete"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          title="Delete task"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="task-title">{task.title}</div>

      <div className="task-meta">
        <span className="task-time">
          <Clock size={10} />
          {timeAgo(task.created_at)}
        </span>
        {task.status === 'done' && (
          <span className="task-done-badge">
            <CheckCircle size={10} />
            Done
          </span>
        )}
      </div>

      <div className="task-drag-hint">
        <span>&#x2630;</span> drag to move
      </div>
    </div>
  );
}

// --- Droppable Column ---
function DroppableColumn({
  col,
  tasks,
  onDelete,
  isOver,
}: {
  col: { id: ColumnId; title: string; color: string };
  tasks: Task[];
  onDelete: (id: string) => void;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: col.id, data: { type: 'column' } });

  return (
    <div
      className={`kanban-column${isOver ? ' column-drag-over' : ''}`}
      style={{ borderTop: `3px solid ${col.color}` }}
    >
      <div className="column-header">
        <span className="column-title">{col.title}</span>
        <span className="column-count" style={{ background: col.color + '20', color: col.color }}>
          {tasks.length}
        </span>
      </div>

      <div ref={setNodeRef} className="column-body" style={{ minHeight: 200 }}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="column-empty">
              <Layers size={20} strokeWidth={1.5} className="column-empty-icon" />
              <span>DROP TASKS HERE</span>
            </div>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} onDelete={onDelete} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

// --- Main Page ---
const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumnId, setOverColumnId] = useState<ColumnId | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterProject, setFilterProject] = useState('ALL');

  const [newTitle, setNewTitle] = useState('');
  const [newProject, setNewProject] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newStatus, setNewStatus] = useState('todo');
  const [adding, setAdding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Prefer column droppable over task cards in collision detection
  const collisionDetection = useCallback((args: any) => {
    const pointerCollisions = pointerWithin(args);
    const columnHits = pointerCollisions.filter((c) =>
      (COLUMN_IDS as readonly string[]).includes(c.id as string)
    );
    if (columnHits.length > 0) return columnHits;
    if (pointerCollisions.length > 0) return pointerCollisions;
    return rectIntersection(args);
  }, []);

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks');
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const projects = useMemo(() => {
    const set = new Set(tasks.map((t) => t.project).filter(Boolean));
    return Array.from(set) as string[];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (filterProject === 'ALL') return tasks;
    return tasks.filter((t) => t.project === filterProject);
  }, [tasks, filterProject]);

  const tasksByCol = (colId: string) => filteredTasks.filter((t) => t.status === colId);
  const todoTasks = tasksByCol('todo');
  const inProgressTasks = tasksByCol('in_progress');
  const doneTasks = tasksByCol('done');

  // --- Drag handlers ---
  const handleDragStart = ({ active }: DragStartEvent) => {
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
    setOverColumnId(null);
  };

  const handleDragOver = ({ over }: DragOverEvent) => {
    if (!over) { setOverColumnId(null); return; }
    const overId = over.id as string;
    if ((COLUMN_IDS as readonly string[]).includes(overId)) {
      setOverColumnId(overId as ColumnId);
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) setOverColumnId(overTask.status as ColumnId);
    }
  };

  const handleDragEnd = async ({ over }: DragEndEvent) => {
    const dragged = activeTask;
    setActiveTask(null);
    setOverColumnId(null);
    if (!over || !dragged) return;

    const overId = over.id as string;
    let targetStatus: string;
    if ((COLUMN_IDS as readonly string[]).includes(overId)) {
      targetStatus = overId;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (!overTask) return;
      targetStatus = overTask.status;
    }

    if (targetStatus === dragged.status) return;

    // Optimistic update — no loading spinner
    setTasks((prev) =>
      prev.map((t) =>
        t.id === dragged.id
          ? { ...t, status: targetStatus as Task['status'], completed_at: targetStatus === 'done' ? new Date().toISOString() : null }
          : t
      )
    );

    try {
      await api.patch(`/api/tasks/${dragged.id}`, {
        status: targetStatus,
        completed_at: targetStatus === 'done' ? new Date().toISOString() : null,
      });
    } catch {
      // Targeted revert — no full reload, no spinner
      setTasks((prev) =>
        prev.map((t) =>
          t.id === dragged.id ? { ...t, status: dragged.status, completed_at: dragged.completed_at ?? null } : t
        )
      );
      toast.error('Failed to move task');
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    setOverColumnId(null);
  };

  // --- Add task ---
  const addTask = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await api.post('/api/tasks', {
        title: newTitle.trim(),
        project: newProject.trim() || 'default',
        priority: newPriority,
        status: newStatus,
      });
      setTasks((prev) => [res.data, ...prev]);
      setNewTitle(''); setNewProject(''); setNewPriority('medium'); setNewStatus('todo');
      setShowAddForm(false);
      toast.success('Task added!');
    } catch {
      toast.error('Failed to add task');
    } finally {
      setAdding(false);
    }
  };

  // --- Delete task ---
  const deleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await api.delete(`/api/tasks/${taskId}`);
      toast.success('Task deleted');
    } catch {
      fetchTasks();
      toast.error('Failed to delete task');
    }
  };

  return (
    <div className="tasks-page animate-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="tasks-header">
        <div>
          <h2 className="tasks-heading">Project <em>Tasks</em></h2>
          <p className="tasks-subheading">Drag tasks between columns to move them.</p>
        </div>
        <div className="tasks-header-actions">
          <div className="project-filter-wrap">
            <Filter size={13} className="filter-icon" strokeWidth={2.5} />
            <select
              className="project-filter"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              title="Filter by project"
            >
              <option value="ALL">ALL PROJECTS</option>
              {projects.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
            </select>
          </div>
          <button className="add-task-btn" onClick={() => setShowAddForm(true)}>
            <Plus size={16} strokeWidth={2.5} /> Add Task
          </button>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="add-task-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Add New Task</h3>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text" placeholder="What needs to be done?"
                value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()} autoFocus
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Project</label>
                <input type="text" placeholder="e.g. shipscribe"
                  value={newProject} onChange={(e) => setNewProject(e.target.value)}
                  list="task-projects-list" />
                <datalist id="task-projects-list">
                  {projects.map((p) => <option key={p} value={p} />)}
                </datalist>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} title="Priority">
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">⚪ Low</option>
                </select>
              </div>
              <div className="form-group">
                <label>Start In</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} title="Start column">
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button className="submit-btn" onClick={addTask} disabled={!newTitle.trim() || adding}>
                {adding ? 'Adding...' : '+ Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Board */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          Loading tasks...
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="kanban-board">
            {COLUMNS.map((col) => (
              <DroppableColumn
                key={col.id}
                col={col}
                tasks={col.id === 'todo' ? todoTasks : col.id === 'in_progress' ? inProgressTasks : doneTasks}
                onDelete={deleteTask}
                isOver={overColumnId === col.id}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
            {activeTask ? (
              <SortableTaskCard task={activeTask} onDelete={() => {}} isDragOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Stats */}
      {tasks.length > 0 && (
        <div className="tasks-stats">
          <span>📋 {tasks.length} total</span>
          <span>⏳ {todoTasks.length} todo</span>
          <span>🔄 {inProgressTasks.length} in progress</span>
          <span>✅ {doneTasks.length} completed</span>
        </div>
      )}
    </div>
  );
};

export default Tasks;
