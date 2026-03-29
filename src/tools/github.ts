import { supabaseAdmin } from '../lib/supabase.js';

export async function performGithubSync(userId: string) {
  if (!supabaseAdmin) return { synced: 0, events: [], error: 'Database not initialized' };
  
  // Get GitHub credentials from profiles table
  const { data: profile, error: profError } = await supabaseAdmin
    .from('profiles')
    .select('github_token, github_username')
    .eq('id', userId)
    .single();
  
  if (profError || !profile || !profile.github_token || !profile.github_username) {
    return { synced: 0, events: [], error: 'GitHub credentials not found' };
  }

  const token = profile.github_token;
  const username = profile.github_username;

  try {
    const response = await fetch(`https://api.github.com/users/${username}/events?per_page=30`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Shipscribe-MCP-Server'
      }
    });

    if (!response.ok) {
      return { synced: 0, events: [], error: `GitHub API error: ${response.status}` };
    }

    const events = await response.json() as any[];
    const syncedEvents: string[] = [];
    
    for (const event of events) {
      // Deduplication check
      const { data: exists } = await supabaseAdmin
        .from('synced_events') // Note: Assuming synced_events table exists in Supabase now or using activities source_id
        .select('id')
        .eq('source_id', `gh_${event.id}`) // Let's use source_id directly in activities for dedup if possible
        .maybeSingle();
        
      if (exists) continue;

      let note = '';
      const repoName = event.repo.name;
      const project = repoName.split('/').pop() || repoName;
      const sourceId = `gh_${event.id}`;

      if (event.type === 'PushEvent') {
        const commitCount = event.payload.size;
        const branch = (event.payload.ref || '').split('/').pop();
        const commitMsg = event.payload.commits?.[0]?.message || 'no message';
        note = `Pushed ${commitCount} commit${commitCount > 1 ? 's' : ''} to ${branch} on ${repoName} — ${commitMsg}`;
      } else if (event.type === 'PullRequestEvent') {
        const action = event.payload.action;
        const title = event.payload.pull_request.title;
        note = `${action.charAt(0).toUpperCase() + action.slice(1)} PR: "${title}" in ${repoName}`;
      }

      if (note) {
        try {
          const { error: insError } = await supabaseAdmin.from('activities').insert({
            user_id: userId,
            note,
            source: 'github',
            editor: 'github',
            project,
            timestamp: new Date(event.created_at).toISOString(),
            source_id: sourceId // Using source_id in activities for dedup
          });
          
          if (!insError) syncedEvents.push(note);
        } catch (e) {
          console.error(`Error syncing event ${event.id}:`, e);
        }
      }
    }

    return {
      synced: syncedEvents.length,
      events: syncedEvents
    };
  } catch (error: any) {
    return { synced: 0, events: [], error: error.message };
  }
}

export async function syncGitHub(userId: string, autoSyncStatus: string) {
  if (!supabaseAdmin) return { error: 'Database not initialized' };
  const result = await performGithubSync(userId);
  
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  
  try {
    const { count: totalToday } = await supabaseAdmin
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('source', 'github')
      .gte('timestamp', todayStart.toISOString());

    const { data: repoBreakdown } = await supabaseAdmin
      .from('activities')
      .select('project')
      .eq('user_id', userId)
      .eq('source', 'github')
      .gte('timestamp', todayStart.toISOString());
      
    // Manual grouping since PostgREST grouping is limited without a view or rpc
    const counts: Record<string, number> = {};
    repoBreakdown?.forEach((item: any) => {
      counts[item.project] = (counts[item.project] || 0) + 1;
    });
    const formattedBreakdown = Object.entries(counts).map(([project, count]) => ({ project, count }));

    const { data: recentNotes } = await supabaseAdmin
      .from('activities')
      .select('note, timestamp')
      .eq('user_id', userId)
      .eq('source', 'github')
      .order('timestamp', { ascending: false })
      .limit(5);

    return {
      auto_sync: autoSyncStatus,
      just_synced: result.synced,
      total_today: totalToday || 0,
      repos: formattedBreakdown.length,
      repo_breakdown: formattedBreakdown,
      recent: recentNotes || [],
      error: result.error
    };
  } catch (error: any) {
    return { error: error.message };
  }
}
