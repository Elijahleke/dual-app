CREATE DATABASE sharedappdb;
\c sharedappdb;

CREATE TABLE devs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50)
);

INSERT INTO devs (name) VALUES ('Elijah Adeleke'), ('Debby Boyo'), ('Precious');

DELETE FROM devs
WHERE name IN ('Flask Developer', 'Node Developer', 'Shared DB User');
