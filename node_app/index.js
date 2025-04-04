const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const prometheusMiddleware = require('express-prometheus-middleware'); // NEW

const app = express();

// Prometheus middleware for metrics collection
app.use(prometheusMiddleware({
  metricsPath: '/metrics',
  collectDefaultMetrics: true,
  requestDurationBuckets: [0.1, 0.5, 1, 1.5, 2, 5]
}));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// PostgreSQL connection
const pool = new Pool({
  host: 'localhost',
  user: 'devops',
  password: 'admin123',
  database: 'sharedappdb'
});

// Main route
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT name FROM devs');
    const names = result.rows.map(row => row.name);
    res.render('index', { names });
  } catch (error) {
    console.error('DB Error:', error);
    res.status(500).send('Database error');
  }
});

// Start server
app.listen(3000, '0.0.0.0', () => {
  console.log('Node.js app listening on port 3000');
});
