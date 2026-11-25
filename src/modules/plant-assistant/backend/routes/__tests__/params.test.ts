import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { rejectUnknownPlantId, rejectUnknownWateringId } from '../params.ts';

const app = (): express.Express => {
  const router = express.Router();
  router.param('id', rejectUnknownPlantId);
  router.param('wateringId', rejectUnknownWateringId);

  router.get('/plants/:id', (req, res) => {
    res.json({ id: req.params.id });
  });

  router.get('/waterings/:wateringId', (req, res) => {
    res.json({ wateringId: req.params.wateringId });
  });

  return express().use(router);
};

describe('params', () => {
  describe('rejectUnknownPlantId', () => {
    it('should pass a positive whole number on', async () => {
      // When
      const response = await request(app()).get('/plants/7');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: '7' });
    });

    it.each(['fern', '0', '-1', '1.5'])('should answer 404 when the id is %s', async (id) => {
      // When
      const response = await request(app()).get(`/plants/${id}`);

      // Then
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Plant not found' });
    });
  });

  describe('rejectUnknownWateringId', () => {
    it('should pass a positive whole number on', async () => {
      // When
      const response = await request(app()).get('/waterings/3');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ wateringId: '3' });
    });

    it('should answer 404 when the id is not a positive whole number', async () => {
      // When
      const response = await request(app()).get('/waterings/rain');

      // Then
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Watering not found' });
    });
  });
});
