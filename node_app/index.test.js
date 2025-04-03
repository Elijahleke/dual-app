// test/index.test.js
const request = require('supertest');
const app = require('../index');
const { Pool } = require('pg');

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn().mockResolvedValue({ rows: [{ name: 'Alice' }, { name: 'Bob' }] }),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('GET /', () => {
  it('should return list of dev names', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Alice');
    expect(res.text).toContain('Bob');
  });
});
