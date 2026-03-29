import { supabaseAdmin } from './supabase.js'

export async function buildUserContext(userId: string) {
  if (!supabaseAdmin) {
    return { activeVoice: null, allProjects: [], primaryProject: null };
  }
  
  // Fetch all context in parallel
  const [
    { data: activeVoice },
    { data: allProjects },
    { data: primaryProject }
  ] = await Promise.all([
    supabaseAdmin
      .from('voice_personas')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle(),
    supabaseAdmin
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'archived')
      .order('is_primary', { ascending: false }),
    supabaseAdmin
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .maybeSingle()
  ])

  return { activeVoice, allProjects: allProjects || [], primaryProject }
}

export function buildVoicePrompt(voice: any): string {
  if (!voice || voice.status !== 'ready') return ''
  
  return `
WRITING STYLE — Write in this voice:
Reference: @${voice.x_username} (${voice.name})
Tone: ${voice.fingerprint?.tone || 'casual and direct'}
Hook style: ${voice.fingerprint?.hooks?.join(', ') || 'lead with the result'}
Vocabulary: ${voice.fingerprint?.vocabulary?.join(', ') || 'builder, shipped, building'}
Typical length: ${voice.fingerprint?.avg_length || 200} characters
Emoji usage: ${voice.fingerprint?.emoji_usage || 'minimal'}
Hashtags: ${voice.fingerprint?.hashtag_usage || 'never'}
What this voice never does: ${voice.fingerprint?.never || 'use corporate speak'}

Study the style above and write as if this person wrote it.
Not a parody — genuinely match the voice.`
}

export function buildProjectPrompt(
  project: any, 
  allProjects: any[]
): string {
  if (!project && (!allProjects || allProjects.length === 0)) return ''
  
  const primary = project || (allProjects && allProjects.length > 0 ? allProjects[0] : null)
  if (!primary) return ''

  return `
PROJECT CONTEXT:
Name: ${primary.name} ${primary.emoji || ''}
Description: ${primary.description || 'No description'}
Status: ${primary.status}
Tech stack: ${primary.tech_stack?.join(', ') || 'Not specified'}
Target audience: ${primary.target_audience || 'Not specified'}
Problem it solves: ${primary.problem_solved || 'Not specified'}
Current focus: ${primary.current_focus || 'Not specified'}
Website: ${primary.url || 'Not launched yet'}
${primary.metrics?.mrr ? `MRR: $${primary.metrics.mrr}` : ''}
${primary.metrics?.users ? `Users: ${primary.metrics.users}` : ''}
${allProjects && allProjects.length > 1 ? `
Other projects: ${allProjects
  .filter(p => p.id !== primary.id)
  .map(p => `${p.emoji || ''} ${p.name}`)
  .join(', ')}` : ''}

When generating content, reference this project naturally.
Use the target audience and problem context to make 
posts more specific and relevant.`
}
