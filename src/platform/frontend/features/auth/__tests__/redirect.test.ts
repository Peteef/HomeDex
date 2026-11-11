import type { Location } from 'react-router';
import { describe, expect, it } from 'vitest';
import { redirectState, redirectTarget } from '../redirect.ts';

describe('redirect', () => {
  describe('redirectState', () => {
    it('should keep the path, query and hash of the location', () => {
      // Given
      const location = {
        pathname: '/m/shopping-list',
        search: '?list=1',
        hash: '#top',
      } as Location;

      // When / Then
      expect(redirectState(location)).toEqual({ from: '/m/shopping-list?list=1#top' });
    });
  });

  describe('redirectTarget', () => {
    it('should return the remembered path when it is inside the app', () => {
      // When / Then
      expect(redirectTarget({ from: '/m/shopping-list' })).toBe('/m/shopping-list');
    });

    it.each([
      ['there is no state', null],
      ['the state has no path', { other: 1 }],
      ['the path is not a string', { from: 42 }],
      ['the path leaves the site', { from: '//evil.example' }],
      ['the path is absolute', { from: 'https://evil.example' }],
      ['the path is the login page', { from: '/login' }],
    ])('should return home when %s', (_case, state) => {
      // When / Then
      expect(redirectTarget(state)).toBe('/');
    });
  });
});
