import request from 'supertest';
import app from '../../../app.js';

describe('POST /api/v1/import/parse', () => {
  it('should return 400 when no file is provided', async () => {
    const response = await request(app).post('/api/v1/import/parse');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Failed to upload file',
    });
  });
});
