const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const pool = new Pool({
host: 'localhost',
user: 'devops',
password: 'admin123',
database: 'sharedappdb'
});

app.get('/', async (req, res) => {
const result = await pool.query('SELECT name FROM devs');
const names = result.rows.map(row => row.name);
res.render('index', { names });
});

app.listen(3000, '0.0.0.0', () => console.log('Node.js app listening on port 3000'));