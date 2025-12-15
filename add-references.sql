ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS references jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS has_references boolean DEFAULT false;
