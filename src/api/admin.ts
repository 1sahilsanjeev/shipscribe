import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate.js'
import { handle } from '../lib/routeHandler.js'

const router = Router()

// Check if requester is admin
const requireAdmin = async (req: AuthenticatedRequest, res: any, next: any) => {
  if (!req.user || !req.user.email) return res.status(401).json({ error: 'Unauthorized' });
  
  const { data } = await supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('email', req.user.email)
    .maybeSingle()
  
  if (!data) return res.status(403).json({ error: 'Not admin' })
  next()
}

// GET /api/admin/waitlist
router.get('/waitlist', authenticate, requireAdmin, handle(async (req: any, res) => {
  const { status, search, limit = 50, offset = 0 } = req.query
  
  let query = supabaseAdmin
    .from('waitlist')
    .select('*', { count: 'exact' })
    .order('referral_count', { ascending: false })
    .order('created_at', { ascending: true })
    .range(Number(offset), Number(offset) + Number(limit) - 1)
  
  if (status && status !== 'all') {
    query = query.eq('status', status as string)
  }
  
  if (search) {
    query = query.or(
      `email.ilike.%${search}%,name.ilike.%${search}%`
    )
  }
  
  const { data, error, count } = await query
  if (error) {
    res.status(500).json({ error })
    return;
  }
  res.json({ data, count })
}));

// GET /api/admin/stats
router.get('/stats', authenticate, requireAdmin, handle(async (req: any, res) => {
  const [w, a, r, i] = await Promise.all([
    supabaseAdmin.from('waitlist').select('*', { count: 'exact', head: true }).eq('status', 'waiting'),
    supabaseAdmin.from('waitlist').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabaseAdmin.from('waitlist').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabaseAdmin.from('waitlist').select('*', { count: 'exact', head: true }).eq('status', 'invited'),
  ])
  
  res.json({
    waiting: w.count || 0,
    approved: a.count || 0,
    rejected: r.count || 0,
    invited: i.count || 0,
    total: (w.count || 0) + (a.count || 0) + 
           (r.count || 0) + (i.count || 0)
  })
}));

// POST /api/admin/approve — approve single user
router.post('/approve', authenticate, requireAdmin, handle(async (req: any, res) => {
  const { email } = req.body
  
  // Update waitlist status
  await supabaseAdmin
    .from('waitlist')
    .update({
      status: 'invited',
      approved_at: new Date().toISOString(),
      invite_sent_at: new Date().toISOString()
    })
    .eq('email', email)

  // Check if user already has account
  const { data: { users } } = await supabaseAdmin
    .auth.admin.listUsers()
  
  const existingUser = (users as any[] | undefined)?.find(u => u.email === email)

  if (existingUser) {
    // Give access to existing user
    await supabaseAdmin
      .from('profiles')
      .update({ access_status: 'approved' })
      .eq('id', existingUser.id)
    
    console.log(`[admin] Access granted to: ${email}`)
  } else {
    // Send invite email — Supabase creates account
    await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${
          process.env.APP_URL || 'http://localhost:5173'
        }/login?invited=true`
      }
    )
    console.log(`[admin] Invite sent to: ${email}`)
  }

  res.json({ success: true, email })
}));

// POST /api/admin/bulk-approve
router.post('/bulk-approve', authenticate, requireAdmin, handle(async (req: any, res) => {
  const { emails } = req.body
  
  const results = await Promise.allSettled(
    emails.map(async (email: string) => {
      await supabaseAdmin
        .from('waitlist')
        .update({ 
          status: 'invited',
          approved_at: new Date().toISOString(),
          invite_sent_at: new Date().toISOString()
        })
        .eq('email', email)
      
      const { data: { users } } = await supabaseAdmin
        .auth.admin.listUsers()
      const existing = (users as any[] | undefined)?.find(u => u.email === email)
      
      if (existing) {
        await supabaseAdmin
          .from('profiles')
          .update({ access_status: 'approved' })
          .eq('id', existing.id)
      } else {
        await supabaseAdmin.auth.admin.inviteUserByEmail(
          email,
          { redirectTo: `${process.env.APP_URL || 'http://localhost:5173'}/login?invited=true` }
        )
      }
      return email
    })
  )
  
  const approved = results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as any).value)
  
  res.json({ approved, count: approved.length })
}));

// POST /api/admin/reject
router.post('/reject', authenticate, requireAdmin, handle(async (req: any, res) => {
  const { email } = req.body
  await supabaseAdmin
    .from('waitlist')
    .update({ status: 'rejected' })
    .eq('email', email)
  res.json({ success: true })
}));

// POST /api/admin/revoke — remove access
router.post('/revoke', authenticate, requireAdmin, handle(async (req: any, res) => {
  const { email } = req.body
  
  const { data: { users } } = await supabaseAdmin
    .auth.admin.listUsers()
  const user = (users as any[] | undefined)?.find(u => u.email === email)
  
  if (user) {
    await supabaseAdmin
      .from('profiles')
      .update({ access_status: 'waitlist' })
      .eq('id', user.id)
  }
  
  await supabaseAdmin
    .from('waitlist')
    .update({ status: 'waiting' })
    .eq('email', email)
  
  res.json({ success: true })
}));

export default router
