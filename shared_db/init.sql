CREATE DATABASE sharedappdb;
\c sharedappdb;

-- Drop the devs table if it exists to clear old data
DROP TABLE IF EXISTS devs;

CREATE TABLE devs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50)
);

INSERT INTO devs (name) VALUES ('Elijah Adeleke'), ('Debby Boyo'), ('Precious')
ON CONFLICT (name) DO NOTHING;

DELETE FROM devs
WHERE name IN ('Flask Developer', 'Node Developer', 'Shared DB User');
