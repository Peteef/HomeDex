import { describe, expect, it } from 'vitest';
import { loadConfig } from '../config.ts';
import { rejectDevConfigInProduction } from '../devConfig.ts';

const production = loadConfig({ NODE_ENV: 'production' });
const development = loadConfig({});

describe('dev config', () => {
  describe('rejectDevConfigInProduction', () => {
    it.each(['DEV_USERNAME', 'DEV_PASSWORD', 'DEV_ANYTHING_NEW'])(
      'should throw in production when %s is set',
      (name) => {
        // When / Then
        expect(() => {
          rejectDevConfigInProduction(production, { [name]: 'x' });
        }).toThrow(`${name} are for development only`);
      },
    );

    it('should name every DEV_ variable that is set', () => {
      // When / Then
      expect(() => {
        rejectDevConfigInProduction(production, { DEV_USERNAME: 'Tester', DEV_PASSWORD: 'x' });
      }).toThrow('DEV_PASSWORD, DEV_USERNAME are for development only');
    });

    it('should ignore variables that only contain DEV_ later in the name', () => {
      // When / Then
      expect(() => {
        rejectDevConfigInProduction(production, { MY_DEV_FLAG: 'x', DEVICE: 'x' });
      }).not.toThrow();
    });

    it('should accept DEV_ variables in development', () => {
      // When / Then
      expect(() => {
        rejectDevConfigInProduction(development, { DEV_USERNAME: 'Tester', DEV_PASSWORD: 'x' });
      }).not.toThrow();
    });

    it('should accept production without DEV_ variables', () => {
      // When / Then
      expect(() => {
        rejectDevConfigInProduction(production, { PORT: '3000' });
      }).not.toThrow();
    });
  });
});
