const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');

describe('Final Quality Checks', () => {
  test('Health check endpoint works', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('404 handler works', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('CORS headers present', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });

  test('Security headers present', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  test('Rate limiting works', async () => {
    const requests = Array(101).fill().map(() => 
      request(app).get('/api/v1/products')
    );
    
    const responses = await Promise.all(requests);
    const lastResponse = responses[responses.length - 1];
    expect(lastResponse.statusCode).toBe(429);
  });
});

afterAll(async () => {
  await sequelize.close();
});