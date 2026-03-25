export interface Activity {
  id: number;
  note: string;
  source: 'manual' | 'github' | 'claude_code' | 'file_watcher';
  editor?: string;
  project: string;
  timestamp: string;
}

export interface Task {
  id: number;
  title: string;
  project: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  created_at: string;
  completed_at?: string;
}

export interface Summary {
  id: number;
  date: string;
  content: string[];
  post?: string;
}

export interface Stats {
  totalActivities: number;
  completedTasks: number;
  pendingTasks: number;
  activeProjects: number;
}

export interface VoicePersona {
  id: string;
  user_id: string;
  name: string;
  x_username: string;
  x_url?: string;
  type: 'own' | 'creator';
  description?: string;
  status: 'pending' | 'scraping' | 'training' | 'ready' | 'failed';
  tweet_count: number;
  fingerprint?: {
    tone: string;
    hooks: string[];
    vocabulary: string[];
    avg_length: number;
    emoji_usage: string;
    hashtag_usage: string;
  };
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: 'active' | 'building' | 'launched' | 'paused' | 'archived';
  url?: string;
  github_url?: string;
  tech_stack: string[];
  started_at?: string;
  launched_at?: string;
  target_audience?: string;
  problem_solved?: string;
  current_focus?: string;
  metrics?: {
    mrr: number;
    users: number;
    commits: number;
  };
  color: string;
  emoji: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}
