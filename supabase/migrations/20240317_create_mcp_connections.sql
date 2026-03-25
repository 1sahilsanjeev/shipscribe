-- Create mcp_connections table
CREATE TABLE IF NOT EXISTS mcp_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  editor text NOT NULL,
  platform text,
  last_seen timestamptz DEFAULT now(),
  UNIQUE(user_id, editor)
);

-- Enable RLS
ALTER TABLE mcp_connections ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own connections
CREATE POLICY "Users can see own connections" ON mcp_connections
  FOR SELECT USING (auth.uid() = user_id);

-- Allow service role to manage all (automatic for bypass RLS)
