import { Router, Response } from 'express'
import { anthropic, CLAUDE_MODEL } from '../lib/claude.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate.js'
import { buildUserContext, buildProjectPrompt } from '../lib/aiContext.js'

const router = Router()

// GET /api/summaries — fetch all summaries for user
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('summaries')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    res.status(500).json({ error })
    return;
  }
  
  const formatted = (data || []).map((s: any) => ({ 
    ...s, 
    content: typeof s.content === 'string' ? JSON.parse(s.content) : s.content 
  }));
  res.json(formatted)
})

// POST /api/summaries/generate — generate new summary
router.post('/generate', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id
  const { 
    date = new Date().toISOString().split('T')[0],
    format = 'short'  // short | deep | standup | weekly
  } = req.body

  try {
    // 1. Fetch today's activities
    const { data: activities } = await supabaseAdmin
      .from('activities')
      .select('note, source, project, editor, timestamp')
      .eq('user_id', userId)
      .gte('timestamp', `${date}T00:00:00Z`)
      .lte('timestamp', `${date}T23:59:59Z`)
      .order('timestamp', { ascending: false })
      .limit(100)

    // 2. Fetch completed tasks today
    const { data: tasks } = await supabaseAdmin
      .from('tasks')
      .select('title, project, priority, completed_at')
      .eq('user_id', userId)
      .eq('status', 'done')
      .gte('completed_at', `${date}T00:00:00Z`)
      .lte('completed_at', `${date}T23:59:59Z`)

    // 3. Fetch todo tasks
    const { data: todoTasks } = await supabaseAdmin
      .from('tasks')
      .select('title, project, priority')
      .eq('user_id', userId)
      .eq('status', 'todo')
      .limit(10)

    // 4. Fetch time sessions
    const { data: timeSessions } = await supabaseAdmin
      .from('time_sessions')
      .select('project, duration_mins')
      .eq('user_id', userId)
      .gte('start_time', `${date}T00:00:00Z`)
      .lte('start_time', `${date}T23:59:59Z`)

    // 5. Calculate stats
    const totalMins = timeSessions?.reduce(
      (sum, s) => sum + (s.duration_mins || 0), 0
    ) || 0
    const totalHours = (totalMins / 60).toFixed(1)
    const githubActivities = activities?.filter(
      a => a.source === 'github'
    ) || []
    const fileEdits = activities?.filter(
      a => a.source === 'file_watcher'
    ) || []
    const uniqueProjects = [...new Set(
      activities?.map(a => a.project).filter(Boolean)
    )]

    // 6. Build prompt based on format
    const formats = {
      short: `Generate a short 5-bullet summary of this developer's day.
Each bullet should be specific and mention what was actually built.
Start each bullet with a verb (Shipped, Fixed, Built, Added, Refactored).
Keep each bullet under 15 words.
End with one sentence about tomorrow's focus based on todo tasks.`,

      deep: `Generate a detailed narrative summary of this developer's day.
Write 3-4 paragraphs covering:
1. What was built and why it matters
2. Key problems solved and how  
3. Progress toward bigger goals
4. What's next
Be specific, honest, and engaging. Write in first person.`,

      standup: `Generate a standup update in this exact format:
**Yesterday:** (what was completed)
**Today:** (what will be worked on based on todo tasks)  
**Blockers:** (any blockers mentioned, or "None")
Keep each section to 2-3 bullet points maximum.`,

      weekly: `Generate a weekly recap summary.
Cover the highlights of the week:
- Major features shipped
- Problems solved  
- Progress metrics
- What's planned next week
Write as a proud but honest build-in-public post.`
    }

    // 6a. Fetch context
    const { primaryProject, allProjects } = await buildUserContext(userId)
    const projectPrompt = buildProjectPrompt(primaryProject, allProjects)

    const systemPrompt = `You are Shipscribe, a developer's personal scribe.
You read raw activity data and write clear, honest summaries.
Write in first person. Be specific about what was built.
Never use corporate speak. Keep it real and developer-friendly.
${projectPrompt}`

    const userPrompt = `Here is my development activity for ${date}:

## Stats
- Total coding time: ${totalHours} hours
- Files edited: ${fileEdits.length}
- GitHub activity: ${githubActivities.length} events  
- Tasks completed: ${tasks?.length || 0}
- Projects worked on: ${uniqueProjects.join(', ') || 'none'}

## Activities (most recent first)
${activities?.slice(0, 30).map(a => 
  `- [${a.source}] ${a.note}`
).join('\n') || 'No activities recorded'}

## Tasks Completed Today
${tasks?.map(t => 
  `- ✓ ${t.title} (${t.project})`
).join('\n') || 'No tasks completed'}

## Tasks Still Todo
${todoTasks?.map(t => 
  `- [ ] ${t.title} (${t.priority} priority)`
).join('\n') || 'No pending tasks'}

${formats[format as keyof typeof formats]}`

    // 7. Call Claude API
    let summaryText = '';
    try {
      const message = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })

      summaryText = message.content[0].type === 'text' 
        ? message.content[0].text 
        : ''
    } catch (err: any) {
      console.error('[summaries] Anthropic error:', err.message)
      console.error('[summaries] Status:', err.status)
      
      if (err.status === 401) {
        return res.status(500).json({
          error: 'Invalid Anthropic API key. Check ANTHROPIC_API_KEY in .env'
        })
      }
      
      return res.status(500).json({ 
        error: err.message || 'AI generation failed' 
      })
    }

    // 8. Save to Supabase
    const { data: saved, error: saveError } = await supabaseAdmin
      .from('summaries')
      .insert({
        user_id: userId,
        date,
        content: JSON.stringify({
          text: summaryText,
          stats: {
            hours: totalHours,
            files_edited: fileEdits.length,
            tasks_completed: tasks?.length || 0,
            github_events: githubActivities.length,
            projects: uniqueProjects
          }
        }),
        format,
        model: CLAUDE_MODEL
      })
      .select()
      .single()

    if (saveError) throw saveError

    res.json({
      summary: saved,
      text: summaryText,
      model: CLAUDE_MODEL,
      stats: {
        hours: totalHours,
        activities: activities?.length || 0,
        tasks_completed: tasks?.length || 0,
        projects: uniqueProjects
      }
    })

  } catch (error: any) {
    console.error('[summaries] generation failed:', error)
    res.status(500).json({ 
      error: error.message || 'Generation failed' 
    })
  }
})

// DELETE /api/summaries/:id
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { error } = await supabaseAdmin
    .from('summaries')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)

  if (error) {
    res.status(500).json({ error })
    return;
  }
  res.json({ ok: true })
})

export default router
