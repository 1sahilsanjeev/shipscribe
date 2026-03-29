import { supabaseAdmin } from '../lib/supabase.js';

const EDITOR_NAME = (() => {
  if (process.env.ANTIGRAVITY_AGENT === '1') return 'antigravity'
  if (process.env.CURSOR_TRACE_ID) return 'cursor'
  if (process.env.CLAUDE_CODE_ENTRYPOINT) return 'claude_code'
  return process.env.SHIPSCRIBE_EDITOR || 'unknown'
})()


export async function trackActivity(userId: string, note: string, project: string = 'default') {
  const source = 'manual'; // Default to manual for this tool
  
  console.error('[track_activity] called with:', { userId, note, project });
  console.error('[track_activity] user_id being used:', userId);

  try {
    if (!supabaseAdmin) return 'Error: Database not initialized';
    console.error('[track_activity] inserting to Supabase activities table...');
    const { data, error } = await supabaseAdmin
      .from('activities')
      .insert({
        user_id: userId,
        note,
        source,
        editor: EDITOR_NAME,
        project,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();
    
    console.error('[track_activity] Supabase result:', { data, error });

    if (error) {
      console.error('[track_activity] Supabase Error:', error);
      throw error;
    }

    return `✓ Activity saved: ${note} (id: ${data.id})`;
  } catch (error: any) {
    console.error('[track_activity] caught error:', error);
    throw error;
  }
}
