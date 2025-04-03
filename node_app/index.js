const express = require('express');
const { Pool } = require('pg');
const app = express();

const pool = new Pool({
  host: 'localhost',
  user: 'devops',
  password: 'password',
  database: 'sharedappdb'
});

app.get('/', async (req, res) => {
  const result = await pool.query('SELECT name FROM devs');
  const names = result.rows.map(row => `<li>${row.name}</li>`).join('');
  res.send(`<h1>Node.js app with shared DB is up and running!</h1><ul>${names}</ul>`);
});

app.listen(3000, '0.0.0.0', () => console.log('Node.js app listening on port 3000'));
