import request from 'supertest';
import app from './src/app';

describe('App', () => {
  it('it should work', () => {
    console.log('hello');
  });

  it('should return 200 status code', async () => {
    const response = await request(app).get('/health').send();

    expect(response.statusCode).toBe(200);
  });
});
