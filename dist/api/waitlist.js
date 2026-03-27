import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
const router = Router();
// POST /api/waitlist/join
// Called by every button and form on landing page
router.post('/join', async (req, res) => {
    const { email, name, source, referred_by } = req.body;
    if (!email || !email.includes('@')) {
        return res.status(400).json({
            error: 'Valid email is required'
        });
    }
    const cleanEmail = email.toLowerCase().trim();
    // Check if already exists
    const { data: existing } = await supabaseAdmin
        .from('waitlist')
        .select('id, status, position, referral_code, email')
        .eq('email', cleanEmail)
        .maybeSingle();
    if (existing) {
        // Already on waitlist — return their info
        return res.json({
            already_joined: true,
            status: existing.status,
            position: existing.position,
            referral_code: existing.referral_code,
            email: existing.email,
            message: existing.status === 'invited'
                ? 'You already have access! Check your email for the invite link.'
                : `You're already on the waitlist at position #${existing.position}`
        });
    }
    // Get position
    const { count } = await supabaseAdmin
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting');
    const position = (count || 0) + 1;
    // Handle referral
    if (referred_by) {
        const { data: referrer } = await supabaseAdmin
            .from('waitlist')
            .select('id, referral_count')
            .eq('referral_code', referred_by)
            .maybeSingle();
        if (referrer) {
            await supabaseAdmin
                .from('waitlist')
                .update({
                referral_count: (referrer.referral_count || 0) + 1
            })
                .eq('id', referrer.id);
        }
    }
    // Insert
    const { data, error } = await supabaseAdmin
        .from('waitlist')
        .insert({
        email: cleanEmail,
        name: name || null,
        source: source || 'landing',
        status: 'waiting',
        position,
        referred_by: referred_by || null
    })
        .select()
        .single();
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json({
        success: true,
        position: data.position,
        referral_code: data.referral_code,
        email: data.email,
        message: `You're #${data.position} on the waitlist!`
    });
});
// GET /api/waitlist/check/:email
router.get('/check/:email', async (req, res) => {
    const { data } = await supabaseAdmin
        .from('waitlist')
        .select('status, position, referral_code, referral_count')
        .eq('email', req.params.email.toLowerCase())
        .maybeSingle();
    if (!data)
        return res.json({ on_waitlist: false });
    res.json({ on_waitlist: true, ...data });
});
// GET /api/waitlist/stats (public — shows total count)
router.get('/stats', async (req, res) => {
    const { count } = await supabaseAdmin
        .from('waitlist')
        .select('*', { count: 'exact', head: true });
    res.json({ total: count || 0 });
});
export default router;
