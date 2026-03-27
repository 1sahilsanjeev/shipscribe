import { Router } from 'express';
import { anthropic, CLAUDE_MODEL } from '../lib/claude.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { authenticate } from '../middleware/authenticate.js';
import { buildUserContext, buildVoicePrompt, buildProjectPrompt } from '../lib/aiContext.js';
const router = Router();
// GET /api/posts — fetch all posts for user
router.get('/', authenticate, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('posts')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false })
        .limit(50);
    if (error)
        return res.status(500).json({ error });
    res.json(data || []);
});
// POST /api/posts/generate — generate post variants
router.post('/generate', authenticate, async (req, res) => {
    const { summaryText, stats, voicePersonaId } = req.body;
    const userId = req.user.id;
    if (!summaryText) {
        return res.status(400).json({ error: 'summaryText is required' });
    }
    try {
        // 1. Fetch context
        const { activeVoice: currentActive, allProjects, primaryProject } = await buildUserContext(userId);
        // Use specific voice if provided, otherwise use active
        let voice = currentActive;
        if (voicePersonaId) {
            const { data: specificVoice } = await supabaseAdmin
                .from('voice_personas')
                .select('*')
                .eq('id', voicePersonaId)
                .eq('user_id', userId)
                .maybeSingle();
            if (specificVoice)
                voice = specificVoice;
        }
        const voicePrompt = buildVoicePrompt(voice);
        const projectPrompt = buildProjectPrompt(primaryProject, allProjects);
        const systemPrompt = `You are a build-in-public content writer for developers.
You write authentic, engaging Twitter/X posts that developers actually want to read.
Never use corporate speak. Never use hashtags unless asked.
Write like a real developer sharing their work — honest, specific, and interesting.
Always write in first person.
${voicePrompt}
${projectPrompt}`;
        const userPrompt = `Based on this developer's daily summary, generate 3 different 
Twitter/X post variants.

ACTIVITY SUMMARY:
${summaryText}

${stats ? `Stats: ${stats.hours}h coded, ${stats.tasks_completed} tasks` : ''}

${voice ? `
IMPORTANT: Write all 3 variants in the style of @${voice.x_username}. 
Study the voice instructions above carefully. The posts should feel like they 
came from that account.
` : ''}

Generate 3 variants:

VARIANT 1 — CASUAL
Conversational, like texting a friend.
Max 240 chars. No hashtags.

VARIANT 2 — TECHNICAL
Lead with the technical detail.
Specific files, features, problems solved.
Max 240 chars. No hashtags.

VARIANT 3 — STORYTELLING
Mini story — challenge + what was learned.
Max 280 chars. No hashtags.

${voice ? `All 3 must match the voice of @${voice.x_username}.` : ''}

Respond ONLY with valid JSON:
{
  "variants": [
    { "tone": "casual", "text": "...", "chars": 0 },
    { "tone": "technical", "text": "...", "chars": 0 },
    { "tone": "storytelling", "text": "...", "chars": 0 }
  ],
  "voice_used": "${voice?.x_username || 'default'}",
  "project_context": "${primaryProject?.name || 'none'}"
}`;
        const message = await anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 1000,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }]
        });
        const responseText = message.content[0].type === 'text'
            ? message.content[0].text
            : '';
        const clean = responseText
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
        const parsed = JSON.parse(clean);
        res.json({
            variants: parsed.variants.map((v) => ({
                ...v,
                chars: v.text.length,
                over_limit: v.text.length > 280
            })),
            voice_used: voice
                ? { name: voice.name, username: voice.x_username }
                : null,
            project_used: primaryProject
                ? { name: primaryProject.name, emoji: primaryProject.emoji }
                : null
        });
    }
    catch (err) {
        console.error('[posts] generation failed:', err);
        res.status(500).json({
            error: err.message || 'Post generation failed'
        });
    }
});
// POST /api/posts/save — save approved post
router.post('/save', authenticate, async (req, res) => {
    const { text, tone, platform, summary_id } = req.body;
    const { data, error } = await supabaseAdmin
        .from('posts')
        .insert({
        user_id: req.user.id,
        text,
        tone,
        platform: platform || 'twitter',
        summary_id,
        status: 'approved',
        created_at: new Date().toISOString()
    })
        .select()
        .single();
    if (error)
        return res.status(500).json({ error });
    res.json(data);
});
// DELETE /api/posts/:id
router.delete('/:id', authenticate, async (req, res) => {
    const { error } = await supabaseAdmin
        .from('posts')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.user.id);
    if (error)
        return res.status(500).json({ error });
    res.json({ ok: true });
});
export default router;
