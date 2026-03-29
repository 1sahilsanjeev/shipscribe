import { anthropic, CLAUDE_MODEL } from '../lib/claude.js';
import { supabaseAdmin } from '../lib/supabase.js';
export async function getSummary(userId, date, format = 'short') {
    const targetDate = date || new Date().toISOString().split('T')[0];
    try {
        // 1. Fetch today's activities
        if (!supabaseAdmin)
            throw new Error("Database not initialized");
        const { data: activities } = await supabaseAdmin
            .from('activities')
            .select('note, source, project, editor, timestamp')
            .eq('user_id', userId)
            .gte('timestamp', `${targetDate}T00:00:00`)
            .lte('timestamp', `${targetDate}T23:59:59`)
            .order('timestamp', { ascending: false })
            .limit(100);
        // 2. Fetch completed tasks today
        const { data: tasks } = await supabaseAdmin
            .from('tasks')
            .select('title, project, priority, completed_at')
            .eq('user_id', userId)
            .eq('status', 'done')
            .gte('completed_at', `${targetDate}T00:00:00`)
            .lte('completed_at', `${targetDate}T23:59:59`);
        // 3. Fetch todo tasks
        const { data: todoTasks } = await supabaseAdmin
            .from('tasks')
            .select('title, project, priority')
            .eq('user_id', userId)
            .eq('status', 'todo')
            .limit(10);
        // 4. Fetch time sessions
        const { data: timeSessions } = await supabaseAdmin
            .from('time_sessions')
            .select('project, duration_mins')
            .eq('user_id', userId)
            .gte('start_time', `${targetDate}T00:00:00`)
            .lte('start_time', `${targetDate}T23:59:59`);
        // 5. Calculate stats
        const totalMins = timeSessions?.reduce((sum, s) => sum + (s.duration_mins || 0), 0) || 0;
        const totalHours = (totalMins / 60).toFixed(1);
        const githubActivities = activities?.filter((a) => a.source === 'github') || [];
        const fileEdits = activities?.filter((a) => a.source === 'file_watcher') || [];
        const uniqueProjects = [...new Set(activities?.map((a) => a.project).filter(Boolean))];
        if (!activities?.length && !tasks?.length) {
            return "No activity recorded today yet.\nStart coding and run /get_summary again!";
        }
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
        };
        const selectedFormat = formats[format] || formats.short;
        const systemPrompt = `You are Shipscribe, a developer's personal scribe.
You read raw activity data and write clear, honest summaries.
Write in first person. Be specific about what was built.
Never use corporate speak. Keep it real and developer-friendly.

Additionally, at the very end of your response, provide a short, catchy Twitter/X post reflecting the summary. Prefix this post exactly with "DRAFT_POST: " on a new line.`;
        const userPrompt = `Here is my development activity for ${targetDate}:

## Stats
- Total coding time: ${totalHours} hours
- Files edited: ${fileEdits.length}
- GitHub activity: ${githubActivities.length} events  
- Tasks completed: ${tasks?.length || 0}
- Projects worked on: ${uniqueProjects.join(', ') || 'none'}

## Activities (most recent first)
${activities?.slice(0, 30).map((a) => `- [${a.source}] ${a.note}`).join('\n') || 'No activities recorded'}

## Tasks Completed Today
${tasks?.map((t) => `- ✓ ${t.title} (${t.project})`).join('\n') || 'No tasks completed'}

## Tasks Still Todo
${todoTasks?.map((t) => `- [ ] ${t.title} (${t.priority} priority)`).join('\n') || 'No pending tasks'}

${selectedFormat}`;
        // 7. Call Claude API
        const message = await anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 1500,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }]
        });
        const rawContent = message.content[0].type === 'text'
            ? message.content[0].text
            : '';
        let summaryText = rawContent;
        let draftPost = "I built some great things today. Catching up on my Shipscribe dashboard! 🚀";
        // Extract draft post if Claude followed instructions
        const postPattern = /\nDRAFT_POST:\s*(.*)/s;
        const match = summaryText.match(postPattern);
        if (match) {
            draftPost = match[1].trim();
            summaryText = summaryText.replace(postPattern, '').trim();
        }
        // Bold the bullets for markdown format
        // Simple regex to make sure short format bullets are bolded (e.g "- Shipped something" -> "**- Shipped something**")
        // Or we just return the markdown directly as Claude wrote it, but user wants specific format:
        // **[bullet 1]** etc.
        let formattedText = summaryText;
        if (format === 'short') {
            formattedText = summaryText
                .split('\n')
                .map((line) => {
                if (line.trim().startsWith('-') && !line.includes('**')) {
                    const text = line.replace('-', '').trim();
                    return `**• ${text}**`;
                }
                return line;
            })
                .join('\n');
        }
        // 8. Save to Supabase
        if (!supabaseAdmin)
            return `## Summary for ${targetDate} 📝\n\n${formattedText}\n\n(Database not available for saving)`;
        const { data: saved, error: saveError } = await supabaseAdmin
            .from('summaries')
            .insert({
            user_id: userId,
            date: targetDate,
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
            format
        })
            .select()
            .single();
        if (saveError) {
            console.error('[summaries] DB save error:', saveError);
        }
        const activitiesCount = activities?.length || 0;
        const tasksCount = tasks?.length || 0;
        return `## Summary for ${targetDate} 📝

${formattedText}

---
📊 **Stats:** ${totalHours}h coded · ${tasksCount} tasks · ${activitiesCount} activities

---
🐦 **Draft post:**
${draftPost}

---
*Saved to dashboard · shipscribe.dev*`;
    }
    catch (error) {
        console.error('[summaries] tool execution failed:', error);
        return `Error generating summary: ${error.message}`;
    }
}
