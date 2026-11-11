import { describe, expect, it } from 'vitest';
import { loadConfig } from '../config.ts';
import { rejectDevUserInProduction } from '../devConfig.ts';

const production = loadConfig({ NODE_ENV: 'production' });
const development = loadConfig({});

describe('dev config', () => {
  describe('rejectDevUserInProduction', () => {
    it.each(['DEV_USERNAME', 'DEV_PASSWORD'])(
      'should throw in production when %s is set',
      (name) => {
        // When / Then
        expect(() => {
          rejectDevUserInProduction(production, { [name]: 'Tester' });
        }).toThrow(`${name} are for development only`);
      },
    );

    it('should name every variable that is set', () => {
      // When / Then
      expect(() => {
        rejectDevUserInProduction(production, { DEV_USERNAME: 'Tester', DEV_PASSWORD: 'x' });
      }).toThrow('DEV_USERNAME, DEV_PASSWORD are for development only');
    });

    it('should accept the variables in development', () => {
      // When / Then
      expect(() => {
        rejectDevUserInProduction(development, { DEV_USERNAME: 'Tester', DEV_PASSWORD: 'x' });
      }).not.toThrow();
    });

    it('should accept production without the variables', () => {
      // When / Then
      expect(() => {
        rejectDevUserInProduction(production, {});
      }).not.toThrow();
    });
  });
});
