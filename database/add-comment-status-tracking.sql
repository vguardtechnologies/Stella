-- Add fields to track comment status and actions
-- Run this to add comment tracking capabilities

-- Add columns to social_comments table for status tracking
ALTER TABLE social_comments 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS original_text TEXT,
ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0;

-- Add index for better performance when querying deleted/edited comments
CREATE INDEX IF NOT EXISTS idx_social_comments_status 
ON social_comments (is_deleted, is_edited);

-- Add index for deleted_at timestamp
CREATE INDEX IF NOT EXISTS idx_social_comments_deleted_at 
ON social_comments (deleted_at);

-- Update social_activity table to support more action types
-- (if not already present)
DO $$ 
BEGIN
    -- Check if action_type column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'social_activity' AND column_name = 'action_type'
    ) THEN
        ALTER TABLE social_activity 
        ADD COLUMN action_type VARCHAR(50) DEFAULT 'comment_received';
    END IF;
END $$;

-- Add comment status change tracking
INSERT INTO social_activity (comment_id, action_type, action_data, created_at)
SELECT 
    id,
    'status_check',
    jsonb_build_object(
        'is_deleted', is_deleted,
        'is_edited', is_edited,
        'message', 'Initial status tracking setup'
    ),
    NOW()
FROM social_comments 
WHERE NOT EXISTS (
    SELECT 1 FROM social_activity 
    WHERE social_activity.comment_id = social_comments.id 
    AND action_type = 'status_check'
)
LIMIT 0; -- Don't actually insert, just create the structure

COMMIT;
