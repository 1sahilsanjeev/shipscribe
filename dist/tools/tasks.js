import { supabaseAdmin } from '../lib/supabase.js';
/**
 * Looks up a user_id from a Shipscribe API key.
 * This is how MCP tools authenticate — they use the SHIPSCRIBE_API_KEY
 * stored in the profile, not a JWT session.
 */
export async function getUserIdByApiKey(apiKey) {
    if (!apiKey)
        return null;
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('api_key', apiKey)
        .single();
    if (error || !data)
        return null;
    return data.id;
}
export async function getTasks(userId, status) {
    try {
        let query = supabaseAdmin
            .from('tasks')
            .select('*')
            .eq('user_id', userId);
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
    }
    catch (error) {
        console.error('Error getting tasks:', error);
        throw error;
    }
}
export async function createTask(userId, title, project = 'default', priority = 'medium', status = 'todo') {
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
        if (error)
            throw error;
        return data;
    }
    catch (error) {
        console.error('Error creating task:', error);
        throw error;
    }
}
export async function updateTaskStatus(userId, taskId, status) {
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
        if (error)
            throw error;
        return data;
    }
    catch (error) {
        console.error('Error updating task status:', error);
        throw error;
    }
}
export async function deleteTask(userId, taskId) {
    try {
        const { error } = await supabaseAdmin
            .from('tasks')
            .delete()
            .eq('id', taskId)
            .eq('user_id', userId);
        if (error)
            throw error;
        return { success: true };
    }
    catch (error) {
        console.error('Error deleting task:', error);
        throw error;
    }
}
