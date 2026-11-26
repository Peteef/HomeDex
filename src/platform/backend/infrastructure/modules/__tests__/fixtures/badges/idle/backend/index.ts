import type { RegisterModule } from '#platform/backend';

export const register: RegisterModule = ({ setTileBadge }) => {
  setTileBadge(() => 0);
};
