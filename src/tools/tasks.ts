import { supabaseAdmin } from '../lib/supabase.js';

/**
 * Looks up a user_id from a Shipscribe API key.
 * This is how MCP tools authenticate — they use the SHIPSCRIBE_API_KEY
 * stored in the profile, not a JWT session.
 */
export async function getUserIdByApiKey(apiKey: string): Promise<string | null> {
  if (!apiKey || !supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('api_key', apiKey)
    .single();
  if (error || !data) return null;
  return data.id;
}

export async function getTasks(userId: string, status?: string) {
  if (!supabaseAdmin) return [];
  try {
    let query = supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('user_id', userId);
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error getting tasks:', error);
    throw error;
  }
}

export async function createTask(
  userId: string,
  title: string,
  project: string = 'default',
  priority: string = 'medium',
  status: string = 'todo'
) {
  if (!supabaseAdmin) return { error: 'Database not initialized' };
  try {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert({
        user_id: userId,
        title,
        project,
        priority,
        status
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error creating task:', error);
    throw error;
  }
}

export async function updateTaskStatus(userId: string, taskId: string, status: string) {
  if (!supabaseAdmin) return { error: 'Database not initialized' };
  try {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({ 
        status,
        completed_at: status === 'done' ? new Date().toISOString() : null
      })
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error updating task status:', error);
    throw error;
  }
}

export async function deleteTask(userId: string, taskId: string) {
  if (!supabaseAdmin) return { error: 'Database not initialized' };
  try {
    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting task:', error);
    throw error;
  }
}
