import { Router, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate.js'

const router = Router()

// GET /api/projects/primary — get primary project
router.get('/primary', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('user_id', req.user!.id)
    .eq('is_primary', true)
    .maybeSingle()

  if (error) return res.status(500).json({ error })
  res.json(data || null)
})

// GET /api/projects — get all projects
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error })
  res.json(data || [])
})

// POST /api/projects — create project
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id
  const projectData = {
    ...req.body,
    user_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  // If setting as primary, unset others first
  if (projectData.is_primary) {
    await supabaseAdmin
      .from('projects')
      .update({ is_primary: false })
      .eq('user_id', userId)
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert(projectData)
    .select()
    .single()

  if (error) return res.status(500).json({ error })
  res.json(data)
})

// PATCH /api/projects/:id — update project
router.patch('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user!.id
  const updates = {
    ...req.body,
    updated_at: new Date().toISOString()
  }

  // If setting as primary, unset others first
  if (updates.is_primary) {
    await supabaseAdmin
      .from('projects')
      .update({ is_primary: false })
      .eq('user_id', userId)
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return res.status(500).json({ error })
  res.json(data)
})

// DELETE /api/projects/:id — delete project
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user!.id

  const { error } = await supabaseAdmin
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return res.status(500).json({ error })
  res.json({ success: true })
})

// PATCH /api/projects/:id/primary — set as primary
router.patch('/:id/primary', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user!.id

  // 1. Unset all as primary
  await supabaseAdmin
    .from('projects')
    .update({ is_primary: false })
    .eq('user_id', userId)

  // 2. Set this one as primary
  const { data, error } = await supabaseAdmin
    .from('projects')
    .update({ is_primary: true, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return res.status(500).json({ error })
  res.json(data)
})

export default router
