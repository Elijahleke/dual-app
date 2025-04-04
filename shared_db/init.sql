CREATE DATABASE sharedappdb;
\c sharedappdb;

-- Drop the existing table to remove old data
DROP TABLE IF EXISTS devs;

-- Recreate it with a UNIQUE constraint on name
CREATE TABLE devs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE
);

-- Clean insert of new values
INSERT INTO devs (name) VALUES 
  ('Elijah Adeleke'), 
  ('Debby Boyo'), 
  ('Precious Chidera')
ON CONFLICT (name) DO NOTHING;

