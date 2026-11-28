import type { RegisterModule } from '#platform/backend';

export const register: RegisterModule = ({ setTileBadge }) => {
  setTileBadge(() => {
    throw new Error('The count is broken');
  });
};
