import { Router } from 'express';
import { anthropic, CLAUDE_MODEL } from '../lib/claude.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { authenticate } from '../middleware/authenticate.js';
import { buildUserContext, buildVoicePrompt, buildProjectPrompt } from '../lib/aiContext.js';
const router = Router();
router.post('/', authenticate, async (req, res) => {
    const { message, history = [], projectId } = req.body;
    const userId = req.user.id;
    try {
        // 1. Fetch context & activities in parallel
        const today = new Date().toISOString().split('T')[0];
        const [{ activeVoice, allProjects, primaryProject: currentPrimary }, { data: todayActivities }, { data: recentTasks }, { data: todoTasks }, { data: recentSummaries }, { data: timeToday },] = await Promise.all([
            buildUserContext(userId),
            supabaseAdmin
                .from('activities')
                .select('note, source, project, timestamp')
                .eq('user_id', userId)
                .gte('timestamp', `${today}T00:00:00`)
                .order('timestamp', { ascending: false })
                .limit(50),
            supabaseAdmin
                .from('tasks')
                .select('title, project, status, priority, completed_at')
                .eq('user_id', userId)
                .eq('status', 'done')
                .gte('completed_at', `${today}T00:00:00`),
            supabaseAdmin
                .from('tasks')
                .select('title, project, priority')
                .eq('user_id', userId)
                .eq('status', 'todo')
                .limit(10),
            supabaseAdmin
                .from('summaries')
                .select('content, date, format')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(3),
            supabaseAdmin
                .from('time_sessions')
                .select('project, duration_mins')
                .eq('user_id', userId)
                .gte('start_time', `${today}T00:00:00`),
        ]);
        // Use specific project if provided, otherwise primary
        let focusProject = currentPrimary;
        if (projectId) {
            focusProject = allProjects.find(p => p.id === projectId) || currentPrimary;
        }
        const voicePrompt = buildVoicePrompt(activeVoice);
        const projectPrompt = buildProjectPrompt(focusProject, allProjects);
        const totalMins = timeToday?.reduce((sum, s) => sum + (s.duration_mins || 0), 0) || 0;
        const totalHours = (totalMins / 60).toFixed(1);
        const uniqueProjects = [
            ...new Set(todayActivities?.map((a) => a.project).filter(Boolean) || []),
        ];
        const systemPrompt = `You are Shipscribe AI — a personal developer assistant that knows everything about the user's work.

You have access to their real-time development context:

${projectPrompt}

${activeVoice ? `
CONTENT GENERATION STYLE:
When the user asks you to write a post, tweet, summary, or any content — write it in the style of @${activeVoice.x_username}.
${voicePrompt}
` : ''}

TODAY'S ACTIVITY (${today}):
- Total coding time: ${totalHours} hours
- Files/events tracked: ${todayActivities?.length || 0}
- Projects worked on: ${uniqueProjects.join(', ') || 'none'}
- Tasks completed today: ${recentTasks?.length || 0}

RECENT ACTIVITIES:
${todayActivities
            ?.slice(0, 20)
            .map((a) => `- [${a.source}] ${a.note}`)
            .join('\n') || 'No activities today yet'}

TASKS COMPLETED TODAY:
${recentTasks?.map((t) => `- ✓ ${t.title} (${t.project})`).join('\n') ||
            'None yet'}

PENDING TASKS:
${todoTasks
            ?.map((t) => `- [ ] ${t.title} (${t.priority} priority)`)
            .join('\n') || 'No pending tasks'}

RECENT SUMMARIES:
${recentSummaries
            ?.map((s) => {
            try {
                const text = typeof s.content === 'string'
                    ? JSON.parse(s.content).text
                    : s.content?.text;
                return `[${s.date}] ${(text || '').slice(0, 200)}...`;
            }
            catch {
                return `[${s.date}] (summary unavailable)`;
            }
        })
            .join('\n') || 'No summaries yet'}

Instructions:
- Be concise and developer-friendly
- Be honest — if they had a slow day, say so
- When writing posts or summaries, be specific about what was built
- When asked about tasks, reference the real data above
- Format responses with markdown when helpful
- Keep responses focused and actionable
- Never make up data — only reference what's in the context above`;
        const response = await anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 1000,
            system: systemPrompt,
            messages: [
                ...history,
                { role: 'user', content: message },
            ],
        });
        const reply = response.content[0].type === 'text' ? response.content[0].text : '';
        res.json({ reply });
    }
    catch (err) {
        console.error('[chat] error:', err);
        res.status(500).json({ error: err.message });
    }
});
export default router;
