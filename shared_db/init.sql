-- Create the database
CREATE DATABASE sharedappdb;
\c sharedappdb;

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS devs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE
);

-- Insert team members with protection from duplication
INSERT INTO devs (name)
VALUES 
  ('Elijah Adeleke (Team Lead)'),
  ('Debora Boyo'),
  ('Precious Chukwudi')
ON CONFLICT (name) DO NOTHING;
