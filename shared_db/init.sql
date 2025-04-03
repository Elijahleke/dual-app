CREATE DATABASE sharedappdb;
\c sharedappdb;

-- Create 'devs' table if it doesn't exist
CREATE TABLE IF NOT EXISTS devs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE
);

-- Insert team members, skip if they already exist
INSERT INTO devs (name) 
VALUES 
  ('Elijah Adeleke (team lead)'), 
  ('Debora Boyo'), 
  ('Precious Chukwudi')
ON CONFLICT (name) DO NOTHING;

-- Optional: Clean up duplicate names (only keep the first occurrence)
-- Useful if you've already seeded multiple times before using UNIQUE constraint
DELETE FROM devs
WHERE id NOT IN (
  SELECT MIN(id)
  FROM devs
  GROUP BY name
);
