import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestApp } from '../../infrastructure/__tests__/helpers.ts';

describe('health routes', () => {
  it('should answer ok when there is no session', async () => {
    // Given
    const { app } = createTestApp();

    // When
    const response = await request(app).get('/api/health');

    // Then
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
