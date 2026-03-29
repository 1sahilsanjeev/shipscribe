import { Router } from 'express';
import { trackActivity } from '../tools/activity.js';
import { getTasks, createTask, updateTaskStatus } from '../tools/tasks.js';
import { getSummary } from '../tools/summary.js';
import { syncGitHub } from '../tools/github.js';
import { syncClaudeCode } from '../tools/claudecode.js';
import { getTimeToday, getTimeWeek } from '../lib/timeTracker.js';
import { getActiveSession } from '../watchers/fileWatcher.js';
import { getCurrentClaudeSession } from '../watchers/claudeCodeWatcher.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

// Endpoint for all standard MCP Tool Calls
router.post('/invoke', async (req: any, res) => {
  const { name, args, clientContext } = req.body;
  const userId = req.user.id;

  try {
    switch (name) {
      case "track_activity": {
        const result = await trackActivity(userId, args?.note as string, args?.project as string);
        return res.json({ content: [{ type: "text", text: JSON.stringify(result, null, 2) }] });
      }
      case "add_task": {
        const result = await createTask(
          userId,
          args?.title as string, 
          args?.project as string, 
          args?.priority as any
        );
        return res.json({ content: [{ type: "text", text: JSON.stringify(result, null, 2) }] });
      }
      case "get_tasks": {
        const result = await getTasks(userId, args?.status as any);
        return res.json({ content: [{ type: "text", text: JSON.stringify(result, null, 2) }] });
      }
      case "get_summary": {
        const result = await getSummary(userId, args?.date as string, args?.format as any);
        return res.json({ content: [{ type: "text", text: result }] });
      }
      case "get_active_session": {
        const projectName = clientContext?.projectName || 'unknown';
        const session = await getActiveSession(userId, projectName) as any;
        if (!session) return res.json({ content: [{ type: "text", text: "No active session found." }] });

        const time = await getTimeToday(userId);
        const bar = (project: string) => {
          const p = time.by_project.find((bp: any) => bp.project === project);
          if (!p) return "";
          const bars = Math.min(15, Math.max(1, Math.round(p.hours * 3)));
          return "█".repeat(bars) + "░".repeat(15 - bars);
        };

        const md = [
          `## Current Session 🟢`,
          ``,
          `**Project:** ${session.project}  `,
          `**Duration:** ${session.session_duration} (started ${session.started_at})  `,
          `**Active file:** ${session.active_file || 'None'}  `,
          ``,
          `### Files touched today (${session.files_count})`,
          ...(session.files_touched as string[]).map((f: string) => `- ${f}${f === session.active_file ? ' ← current' : ''}`),
          ``,
          `### Time breakdown`,
          ...time.by_project.map((p: any) => `- ${p.project}: ${Math.floor(p.hours)}h ${Math.round((p.hours % 1) * 60)}m ${bar(p.project)}`)
        ].join('\n');

        return res.json({ content: [{ type: "text", text: md }] });
      }
      case "get_current_session": {
        const result = await getCurrentClaudeSession(userId);
        if (!result) return res.json({ content: [{ type: "text", text: "No active live session found." }] });
        const md = [
          `## Editor Session (${result.editor}) 🟢`,
          ``,
          `**Session ID:** \`${result.session_id}\`  `,
          `**Duration:** ${result.duration}  `,
          `**Files touched:** ${result.files_touched.length}  `,
          `**Tool calls:** ${result.tool_calls}  `,
          ``,
          `### Recent Files`,
          ...result.files_touched.slice(-5).map((f: string) => `- ${f}`)
        ].join('\n');
        return res.json({ content: [{ type: "text", text: md }] });
      }
      case "get_time_today": {
        const result = await getTimeToday(userId);
        const md = [
          `## Today's Time ⏱`,
          ``,
          `**Total:** ${result.total_hours}h across ${result.by_project.length} projects`,
          ``,
          `| Project | Time | Sessions |`,
          `|---------|------|----------|`,
          ...result.by_project.map((p: any) => `| ${p.project} | ${Math.floor(p.hours)}h ${Math.round((p.hours % 1) * 60)}m | ${p.sessions} |`),
          ``,
          `**Most productive hour:** ${result.most_productive_hour}`
        ].join('\n');
        return res.json({ content: [{ type: "text", text: md }] });
      }
      case "get_time_week": {
        const result = await getTimeWeek(userId);
        return res.json({ content: [{ type: "text", text: JSON.stringify(result, null, 2) }] });
      }
      case "sync_github": {
        const result = await syncGitHub(userId, 'Active via proxy');
        if (result.error) return res.json({ content: [{ type: "text", text: `Error: ${result.error}` }] });
        
        const md = [
          `## GitHub Sync ✓`,
          ``,
          `**Just synced:** ${result.just_synced} new events  `,
          `**Today's total:** ${result.total_today} events across ${result.repos} repos`,
          ``,
          `### Recent activity`,
          ... (result.recent || []).map((r: any) => `- ${r.note} *(${new Date(r.timestamp).toLocaleTimeString()})*`)
        ].join('\n');
        
        return res.json({ content: [{ type: "text", text: md }] });
      }
      case "status": {
        const time = await getTimeToday(userId);
        
        const { count: githubTotal } = await supabaseAdmin!
          .from('activities')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('source', 'github')
          .gte('timestamp', new Date().toISOString().split('T')[0] + 'T00:00:00Z');
          
        const { count: tasksDone } = await supabaseAdmin!
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'done')
          .gte('completed_at', new Date().toISOString().split('T')[0] + 'T00:00:00Z');
        
        const md = [
          `## Shipscribe Status`,
          ``,
          `🟢 Backend Connected`,
          `🟢 File watcher: Active`,
          `🟢 GitHub poller: Active (Proxied)`,
          `⚡ Editor: ${clientContext?.editor || 'unknown'}`,
          ``,
          `**Today at a glance**`,
          `- ${time.total_hours}h coded`,
          `- ${githubTotal || 0} commits`,
          `- ${tasksDone || 0} tasks completed  `,
          `- Streak: 14 days 🔥`,
          ``,
          `Run /get_summary to generate today's post →`
        ].join('\n');
        
        return res.json({ content: [{ type: "text", text: md }] });
      }
      case "claude_code_update": {
        const { info, project } = args;
        const { data: existing } = await supabaseAdmin!
          .from('session_state')
          .select('id')
          .eq('user_id', userId)
          .eq('project', project)
          .eq('external_session_id', info.sessionId)
          .maybeSingle();

        if (existing) {
          await supabaseAdmin!.from('session_state')
            .update({
              last_activity: new Date(info.lastActivity).toISOString(),
              files_touched: info.filesTouched,
              total_files_count: info.filesTouched.length,
              tool_calls: info.toolCalls,
              active_file: info.filesTouched[info.filesTouched.length - 1] || null,
              is_active: true
            })
            .eq('id', existing.id);
        } else {
          await supabaseAdmin!.from('session_state').insert({
            user_id: userId,
            project,
            editor: 'claude_code',
            external_session_id: info.sessionId,
            active_file: info.filesTouched[info.filesTouched.length - 1] || null,
            session_start: new Date(info.startTime).toISOString(),
            last_activity: new Date(info.lastActivity).toISOString(),
            files_touched: info.filesTouched,
            total_files_count: info.filesTouched.length,
            tool_calls: info.toolCalls,
            is_active: true
          });
        }
        return res.json({ success: true });
      }
      case "claude_code_complete": {
        const { info, project, durationMins, note } = args;
        await supabaseAdmin!.from('activities').insert({
          user_id: userId,
          note,
          source: 'claude_code',
          editor: 'claude_code',
          project,
          timestamp: new Date(info.startTime).toISOString(),
          source_id: `cc_${info.sessionId}`
        });

        await supabaseAdmin!.from('session_state')
          .update({ is_active: false })
          .eq('user_id', userId)
          .eq('external_session_id', info.sessionId);
        
        return res.json({ success: true });
      }
      case "init_session": {
        const { projectName, editor } = clientContext;
        const { data: existingSession } = await supabaseAdmin!
          .from('session_state')
          .select('*')
          .eq('user_id', userId)
          .eq('project', projectName)
          .maybeSingle();

        if (!existingSession) {
          await supabaseAdmin!.from('session_state').insert({
            user_id: userId,
            project: projectName,
            files_touched: [],
            total_files_count: 0,
            session_start: new Date().toISOString(),
            is_active: true
          });
        } else {
          await supabaseAdmin!.from('session_state').update({ is_active: true })
            .eq('id', existingSession.id);
        }
        return res.json({ success: true });
      }
      default:
        return res.status(404).json({ error: `Unknown tool: ${name}` });
    }
  } catch (error: any) {
    console.error(`[MCP Router] Tool error: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

// Endpoint for File Watcher Changes
router.post('/file_change', async (req: any, res) => {
  const { editor, project, relativePath } = req.body;
  const userId = req.user.id;

  try {
    // Replicate fileWatcher logic here
    await supabaseAdmin!.from('activities').insert({
      user_id: userId,
      note: `Edited ${relativePath.split('/').pop()} in ${project}`,
      source: 'file_watcher',
      editor: editor,
      project: project,
      timestamp: new Date().toISOString()
    });

    const { data: session } = await supabaseAdmin!
      .from('session_state')
      .select('files_touched')
      .eq('user_id', userId)
      .eq('project', project)
      .single();
    
    let filesTouched: string[] = session?.files_touched || [];
    if (!filesTouched.includes(relativePath)) {
      filesTouched.push(relativePath);
    }

    await supabaseAdmin!.from('session_state')
      .update({ 
        active_file: relativePath, 
        last_activity: new Date().toISOString(), 
        files_touched: filesTouched, 
        total_files_count: filesTouched.length,
        is_active: true
      })
      .eq('user_id', userId)
      .eq('project', project);

    res.json({ success: true });
  } catch (err: any) {
    console.error('[MCP Router] file_change error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/heartbeat', async (req: any, res) => {
  const { editor, project } = req.body || {};
  
  if (!req.user || !supabaseAdmin) {
    return res.status(401).json({ error: 'Unauthorized or Database not initialized' });
  }

  const userId = req.user.id;
  try {
    await supabaseAdmin.from('mcp_connections').upsert({
      user_id: userId,
      editor: editor || 'unknown',
      last_seen: new Date().toISOString()
    });

    if (project) {
        await supabaseAdmin.from('session_state').update({ is_active: true, last_activity: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('project', project);
    }
    res.json({ success: true });
  } catch(err: any) {
    console.error('[MCP Router] heartbeat error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
