import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { authenticate } from '../middleware/authenticate.js';
const router = Router();
// GET /api/voice/active — get active persona
router.get('/active', authenticate, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('voice_personas')
        .select('*')
        .eq('user_id', req.user.id)
        .eq('is_active', true)
        .maybeSingle();
    if (error)
        return res.status(500).json({ error });
    res.json(data || null);
});
// GET /api/voice — get all personas
router.get('/', authenticate, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('voice_personas')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });
    if (error)
        return res.status(500).json({ error });
    res.json(data || []);
});
// POST /api/voice — create new persona
router.post('/', authenticate, async (req, res) => {
    const userId = req.user.id;
    const { name, x_username, type, description } = req.body;
    const personaData = {
        user_id: userId,
        name,
        x_username: x_username.replace('@', ''),
        x_url: x_username.startsWith('http') ? x_username : `https://x.com/${x_username.replace('@', '')}`,
        type: type || 'own',
        description,
        status: 'pending',
        tweet_count: 0,
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    const { data, error } = await supabaseAdmin
        .from('voice_personas')
        .insert(personaData)
        .select()
        .single();
    if (error)
        return res.status(500).json({ error });
    res.json(data);
});
// PATCH /api/voice/:id — update persona
router.patch('/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = {
        ...req.body,
        updated_at: new Date().toISOString()
    };
    const { data, error } = await supabaseAdmin
        .from('voice_personas')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
    if (error)
        return res.status(500).json({ error });
    res.json(data);
});
// DELETE /api/voice/:id — delete persona
router.delete('/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { error } = await supabaseAdmin
        .from('voice_personas')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    if (error)
        return res.status(500).json({ error });
    res.json({ success: true });
});
// POST /api/voice/:id/train — trigger training (simulated)
router.post('/:id/train', authenticate, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    // 1. Initial response
    res.json({ message: 'Training started', status: 'scraping' });
    // 2. Simulated Flow
    // We'll use a helper to update status in background
    const updateStatus = async (status, extra = {}) => {
        await supabaseAdmin
            .from('voice_personas')
            .update({ status, ...extra, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId);
    };
    // Phase 1: Scraping (after 2s)
    setTimeout(async () => {
        await updateStatus('scraping');
        // Phase 2: Training (after 3s more)
        setTimeout(async () => {
            await updateStatus('training');
            // Phase 3: Ready (after 3s more)
            setTimeout(async () => {
                const tweetCount = Math.floor(Math.random() * 1500) + 500;
                const fingerprint = {
                    tone: 'casual and direct',
                    hooks: ['lead with numbers', 'start with a problem'],
                    vocabulary: ['shipped', 'building', 'indie'],
                    avg_length: 180,
                    emoji_usage: 'minimal',
                    hashtag_usage: 'never'
                };
                await updateStatus('ready', {
                    tweet_count: tweetCount,
                    fingerprint,
                    avatar_url: `https://unavatar.io/twitter/${req.body.x_username || 'jack'}`
                });
            }, 3000);
        }, 3000);
    }, 2000);
});
// POST /api/voice/:id/activate — set as active
router.post('/:id/activate', authenticate, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    // 1. Deactivate all others
    await supabaseAdmin
        .from('voice_personas')
        .update({ is_active: false })
        .eq('user_id', userId);
    // 2. Activate this one
    const { data, error } = await supabaseAdmin
        .from('voice_personas')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
    if (error)
        return res.status(500).json({ error });
    res.json(data);
});
// POST /api/voice/:id/preview — generate sample post
router.post('/:id/preview', authenticate, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { data: persona } = await supabaseAdmin
        .from('voice_personas')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
    if (!persona || !persona.fingerprint) {
        return res.status(400).json({ error: 'Persona not trained or not found' });
    }
    // Return a mock post for preview
    const mockPost = `Just shipped a new feature for Shipscribe. 
Building in public is hard but seeing people use it makes it all worth it. 
${persona.tweet_count} items analyzed to write this. 🚀`;
    res.json({ text: mockPost });
});
export default router;
